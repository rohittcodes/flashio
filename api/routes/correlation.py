from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, Optional, List, Tuple
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
import json
import os
from collections import defaultdict
from storage.chroma_client import ChromaLogStore
import uuid

router = APIRouter(prefix="/correlation", tags=["correlation"])

# Correlation models
class CorrelationRequest(BaseModel):
    primary_logs: List[Dict[str, Any]] = Field(..., description="Primary logs to correlate")
    time_window: int = Field(300, description="Time window for correlation in seconds")
    correlation_fields: List[str] = Field(
        default=["service", "user_id", "session_id", "trace_id", "request_id"],
        description="Fields to use for correlation"
    )
    include_cross_service: bool = Field(True, description="Include cross-service correlations")

class CorrelatedLogGroup(BaseModel):
    id: str
    correlation_type: str  # temporal, field_based, pattern_based
    primary_log: Dict[str, Any]
    related_logs: List[Dict[str, Any]]
    correlation_strength: float  # 0.0 to 1.0
    time_span: float  # seconds
    services_involved: List[str]
    correlation_fields: Dict[str, Any]

class CorrelationSummary(BaseModel):
    total_groups: int
    correlation_types: Dict[str, int]
    services_involved: List[str]
    time_range: Dict[str, str]
    strongest_correlations: List[CorrelatedLogGroup]

class ServiceFlow(BaseModel):
    request_id: str
    services: List[str]
    timeline: List[Dict[str, Any]]
    total_duration: float
    errors: List[Dict[str, Any]]
    warnings: List[Dict[str, Any]]

# API key validation
class LogCorrelator:
    """Advanced log correlation engine"""
    
    def __init__(self):
        self.correlation_cache = {}
        
    def parse_timestamp(self, timestamp_str: str) -> datetime:
        """Parse various timestamp formats"""
        try:
            # Try ISO format first
            return datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
        except:
            try:
                # Try other common formats
                return datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M:%S")
            except:
                # Default to now if parsing fails
                return datetime.now()
    
    def extract_correlation_fields(self, log: Dict[str, Any], fields: List[str]) -> Dict[str, Any]:
        """Extract correlation fields from a log entry"""
        correlation_data = {}
        
        for field in fields:
            # Check direct field access
            if field in log:
                correlation_data[field] = log[field]
                continue
                
            # Check nested fields
            if '.' in field:
                parts = field.split('.')
                current = log
                try:
                    for part in parts:
                        current = current[part]
                    correlation_data[field] = current
                except (KeyError, TypeError):
                    pass
                    
            # Check message content for common patterns
            message = log.get('message', '')
            if field == 'request_id' and 'request_id' in message:
                try:
                    # Extract request_id from message
                    parts = message.split('request_id')
                    if len(parts) > 1:
                        id_part = parts[1].split()[0].strip(':=[]()').strip()
                        if id_part:
                            correlation_data[field] = id_part
                except:
                    pass
                    
            elif field == 'user_id' and 'user' in message:
                try:
                    # Extract user_id from message
                    if 'user_id' in message:
                        parts = message.split('user_id')
                        if len(parts) > 1:
                            user_part = parts[1].split()[0].strip(':=[]()').strip()
                            if user_part:
                                correlation_data[field] = user_part
                except:
                    pass
                    
        return correlation_data
    
    def find_temporal_correlations(self, logs: List[Dict[str, Any]], time_window: int) -> List[CorrelatedLogGroup]:
        """Find logs that are temporally correlated"""
        correlations = []
        
        # Sort logs by timestamp
        sorted_logs = sorted(logs, key=lambda x: self.parse_timestamp(x.get('timestamp', '')))
        
        for i, primary_log in enumerate(sorted_logs):
            primary_time = self.parse_timestamp(primary_log.get('timestamp', ''))
            related_logs = []
            
            # Look for logs within time window
            for j, other_log in enumerate(sorted_logs):
                if i == j:
                    continue
                    
                other_time = self.parse_timestamp(other_log.get('timestamp', ''))
                time_diff = abs((other_time - primary_time).total_seconds())
                
                if time_diff <= time_window:
                    related_logs.append(other_log)
            
            if related_logs:
                # Calculate correlation strength based on time proximity and count
                avg_time_diff = sum(
                    abs((self.parse_timestamp(log.get('timestamp', '')) - primary_time).total_seconds())
                    for log in related_logs
                ) / len(related_logs)
                
                strength = max(0.1, 1.0 - (avg_time_diff / time_window))
                
                services = set([primary_log.get('service', 'unknown')])
                services.update(log.get('service', 'unknown') for log in related_logs)
                
                correlation = CorrelatedLogGroup(
                    id=f"temporal_{uuid.uuid4().hex[:8]}",
                    correlation_type="temporal",
                    primary_log=primary_log,
                    related_logs=related_logs,
                    correlation_strength=strength,
                    time_span=max(
                        abs((self.parse_timestamp(log.get('timestamp', '')) - primary_time).total_seconds())
                        for log in related_logs
                    ) if related_logs else 0,
                    services_involved=list(services),
                    correlation_fields={"time_window": time_window}
                )
                correlations.append(correlation)
        
        return correlations
    
    def find_field_based_correlations(self, logs: List[Dict[str, Any]], correlation_fields: List[str]) -> List[CorrelatedLogGroup]:
        """Find logs that share common field values"""
        correlations = []
        field_groups = defaultdict(list)
        
        # Group logs by field values
        for log in logs:
            correlation_data = self.extract_correlation_fields(log, correlation_fields)
            
            for field, value in correlation_data.items():
                if value:  # Only consider non-empty values
                    key = f"{field}:{value}"
                    field_groups[key].append(log)
        
        # Create correlations for groups with multiple logs
        for key, group_logs in field_groups.items():
            if len(group_logs) > 1:
                field_name, field_value = key.split(':', 1)
                primary_log = group_logs[0]
                related_logs = group_logs[1:]
                
                # Calculate correlation strength
                strength = min(1.0, len(group_logs) / 10.0)  # Stronger with more logs
                
                services = set(log.get('service', 'unknown') for log in group_logs)
                
                # Calculate time span
                timestamps = [self.parse_timestamp(log.get('timestamp', '')) for log in group_logs]
                time_span = (max(timestamps) - min(timestamps)).total_seconds() if len(timestamps) > 1 else 0
                
                correlation = CorrelatedLogGroup(
                    id=f"field_{field_name}_{uuid.uuid4().hex[:8]}",
                    correlation_type="field_based",
                    primary_log=primary_log,
                    related_logs=related_logs,
                    correlation_strength=strength,
                    time_span=time_span,
                    services_involved=list(services),
                    correlation_fields={field_name: field_value, "group_size": len(group_logs)}
                )
                correlations.append(correlation)
        
        return correlations
    
    def find_pattern_correlations(self, logs: List[Dict[str, Any]]) -> List[CorrelatedLogGroup]:
        """Find logs with similar patterns or sequences"""
        correlations = []
        pattern_groups = defaultdict(list)
        
        # Group logs by message patterns
        for log in logs:
            message = log.get('message', '')
            level = log.get('level', '')
            service = log.get('service', '')
            
            # Create pattern key
            words = message.lower().split()
            if len(words) >= 3:
                pattern = f"{level}:{service}:{' '.join(words[:3])}"
                pattern_groups[pattern].append(log)
        
        # Create correlations for pattern groups
        for pattern, group_logs in pattern_groups.items():
            if len(group_logs) > 2:  # Require at least 3 logs for pattern correlation
                primary_log = group_logs[0]
                related_logs = group_logs[1:]
                
                strength = min(1.0, len(group_logs) / 5.0)
                services = set(log.get('service', 'unknown') for log in group_logs)
                
                timestamps = [self.parse_timestamp(log.get('timestamp', '')) for log in group_logs]
                time_span = (max(timestamps) - min(timestamps)).total_seconds() if len(timestamps) > 1 else 0
                
                correlation = CorrelatedLogGroup(
                    id=f"pattern_{uuid.uuid4().hex[:8]}",
                    correlation_type="pattern_based",
                    primary_log=primary_log,
                    related_logs=related_logs,
                    correlation_strength=strength,
                    time_span=time_span,
                    services_involved=list(services),
                    correlation_fields={"pattern": pattern, "occurrences": len(group_logs)}
                )
                correlations.append(correlation)
        
        return correlations
    
    def trace_service_flows(self, logs: List[Dict[str, Any]]) -> List[ServiceFlow]:
        """Trace request flows across services"""
        flows = []
        request_groups = defaultdict(list)
        
        # Group logs by request identifiers
        for log in logs:
            correlation_data = self.extract_correlation_fields(log, ['request_id', 'trace_id', 'session_id'])
            
            for field, value in correlation_data.items():
                if value:
                    request_groups[value].append(log)
        
        # Create service flows
        for request_id, request_logs in request_groups.items():
            if len(request_logs) > 1:
                # Sort by timestamp
                sorted_logs = sorted(request_logs, key=lambda x: self.parse_timestamp(x.get('timestamp', '')))
                
                services = []
                timeline = []
                errors = []
                warnings = []
                
                for log in sorted_logs:
                    service = log.get('service', 'unknown')
                    if service not in services:
                        services.append(service)
                    
                    timeline.append({
                        'timestamp': log.get('timestamp'),
                        'service': service,
                        'level': log.get('level'),
                        'message': log.get('message', '')[:100]  # Truncate long messages
                    })
                    
                    level = log.get('level', '').lower()
                    if level in ['error', 'critical', 'fatal']:
                        errors.append(log)
                    elif level in ['warn', 'warning']:
                        warnings.append(log)
                
                # Calculate total duration
                start_time = self.parse_timestamp(sorted_logs[0].get('timestamp', ''))
                end_time = self.parse_timestamp(sorted_logs[-1].get('timestamp', ''))
                duration = (end_time - start_time).total_seconds()
                
                flow = ServiceFlow(
                    request_id=request_id,
                    services=services,
                    timeline=timeline,
                    total_duration=duration,
                    errors=errors,
                    warnings=warnings
                )
                flows.append(flow)
        
        return flows

# Global correlator instance
correlator = LogCorrelator()

@router.post("/analyze", response_model=CorrelationSummary)
async def correlate_logs(
    request: CorrelationRequest
):
    """Analyze logs for correlations"""
    try:
        global correlator
        
        all_correlations = []
        
        # Find temporal correlations
        temporal_correlations = correlator.find_temporal_correlations(
            request.primary_logs, 
            request.time_window
        )
        all_correlations.extend(temporal_correlations)
        
        # Find field-based correlations
        field_correlations = correlator.find_field_based_correlations(
            request.primary_logs,
            request.correlation_fields
        )
        all_correlations.extend(field_correlations)
        
        # Find pattern correlations
        pattern_correlations = correlator.find_pattern_correlations(request.primary_logs)
        all_correlations.extend(pattern_correlations)
        
        # Count by type
        type_counts = defaultdict(int)
        services = set()
        
        for correlation in all_correlations:
            type_counts[correlation.correlation_type] += 1
            services.update(correlation.services_involved)
        
        # Get time range
        timestamps = [log.get('timestamp', '') for log in request.primary_logs]
        time_range = {
            "start": min(timestamps) if timestamps else "",
            "end": max(timestamps) if timestamps else ""
        }
        
        # Get strongest correlations
        strongest = sorted(all_correlations, key=lambda x: x.correlation_strength, reverse=True)[:10]
        
        return CorrelationSummary(
            total_groups=len(all_correlations),
            correlation_types=dict(type_counts),
            services_involved=list(services),
            time_range=time_range,
            strongest_correlations=strongest
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to correlate logs: {str(e)}")

@router.post("/trace-flows", response_model=List[ServiceFlow])
async def trace_service_flows(
    logs: List[Dict[str, Any]]
):
    """Trace request flows across services"""
    try:
        global correlator
        flows = correlator.trace_service_flows(logs)
        
        # Sort by duration, longest first
        flows.sort(key=lambda x: x.total_duration, reverse=True)
        
        return flows
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to trace service flows: {str(e)}")

@router.post("/find-related")
async def find_related_logs(
    primary_log: Dict[str, Any],
    candidate_logs: List[Dict[str, Any]],
    correlation_fields: List[str] = ["service", "user_id", "request_id"],
    time_window: int = 300
):
    """Find logs related to a specific primary log"""
    try:
        global correlator
        
        primary_time = correlator.parse_timestamp(primary_log.get('timestamp', ''))
        primary_correlation_data = correlator.extract_correlation_fields(primary_log, correlation_fields)
        
        related_logs = []
        
        for candidate in candidate_logs:
            candidate_time = correlator.parse_timestamp(candidate.get('timestamp', ''))
            time_diff = abs((candidate_time - primary_time).total_seconds())
            
            # Check temporal correlation
            temporal_match = time_diff <= time_window
            
            # Check field correlations
            candidate_correlation_data = correlator.extract_correlation_fields(candidate, correlation_fields)
            field_matches = 0
            total_fields = 0
            
            for field in correlation_fields:
                if field in primary_correlation_data and field in candidate_correlation_data:
                    total_fields += 1
                    if primary_correlation_data[field] == candidate_correlation_data[field]:
                        field_matches += 1
            
            field_match_ratio = field_matches / total_fields if total_fields > 0 else 0
            
            # Calculate overall correlation score
            correlation_score = 0.0
            if temporal_match:
                correlation_score += 0.3 * (1.0 - time_diff / time_window)
            
            correlation_score += 0.7 * field_match_ratio
            
            if correlation_score > 0.2:  # Minimum threshold
                related_logs.append({
                    "log": candidate,
                    "correlation_score": correlation_score,
                    "time_difference": time_diff,
                    "field_matches": field_matches,
                    "matching_fields": [
                        field for field in correlation_fields
                        if field in primary_correlation_data and 
                           field in candidate_correlation_data and
                           primary_correlation_data[field] == candidate_correlation_data[field]
                    ]
                })
        
        # Sort by correlation score
        related_logs.sort(key=lambda x: x["correlation_score"], reverse=True)
        
        return {
            "primary_log": primary_log,
            "related_logs": related_logs[:20],  # Top 20 related logs
            "total_candidates": len(candidate_logs),
            "related_count": len(related_logs)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to find related logs: {str(e)}")

@router.post("/detect-chains")
async def detect_error_chains(
    logs: List[Dict[str, Any]],
    max_chain_length: int = 10
):
    """Detect chains of related errors or events"""
    try:
        global correlator
        
        # Filter for error logs
        error_logs = [
            log for log in logs 
            if log.get('level', '').lower() in ['error', 'critical', 'fatal', 'warning']
        ]
        
        if not error_logs:
            return {"message": "No error logs found", "chains": []}
        
        # Sort by timestamp
        sorted_errors = sorted(error_logs, key=lambda x: correlator.parse_timestamp(x.get('timestamp', '')))
        
        chains = []
        used_logs = set()
        
        for i, start_log in enumerate(sorted_errors):
            if id(start_log) in used_logs:
                continue
                
            chain = [start_log]
            used_logs.add(id(start_log))
            
            start_time = correlator.parse_timestamp(start_log.get('timestamp', ''))
            start_service = start_log.get('service', '')
            
            # Look for subsequent related errors
            for j in range(i + 1, len(sorted_errors)):
                if len(chain) >= max_chain_length:
                    break
                    
                candidate_log = sorted_errors[j]
                if id(candidate_log) in used_logs:
                    continue
                
                candidate_time = correlator.parse_timestamp(candidate_log.get('timestamp', ''))
                time_diff = (candidate_time - start_time).total_seconds()
                
                # Check if this could be part of the chain
                if time_diff > 600:  # 10 minutes max
                    break
                
                # Check for service relationship or common identifiers
                candidate_service = candidate_log.get('service', '')
                correlation_data = correlator.extract_correlation_fields(candidate_log, ['request_id', 'user_id', 'session_id'])
                start_correlation_data = correlator.extract_correlation_fields(start_log, ['request_id', 'user_id', 'session_id'])
                
                is_related = False
                
                # Same service
                if candidate_service == start_service:
                    is_related = True
                
                # Shared correlation fields
                for field in ['request_id', 'user_id', 'session_id']:
                    if (field in correlation_data and field in start_correlation_data and
                        correlation_data[field] == start_correlation_data[field] and
                        correlation_data[field] is not None):
                        is_related = True
                        break
                
                if is_related:
                    chain.append(candidate_log)
                    used_logs.add(id(candidate_log))
            
            # Only include chains with multiple errors
            if len(chain) > 1:
                chain_duration = (
                    correlator.parse_timestamp(chain[-1].get('timestamp', '')) - 
                    correlator.parse_timestamp(chain[0].get('timestamp', ''))
                ).total_seconds()
                
                services_in_chain = list(set(log.get('service', 'unknown') for log in chain))
                
                chains.append({
                    "id": f"chain_{uuid.uuid4().hex[:8]}",
                    "length": len(chain),
                    "duration": chain_duration,
                    "services": services_in_chain,
                    "start_time": chain[0].get('timestamp'),
                    "end_time": chain[-1].get('timestamp'),
                    "logs": chain,
                    "severity": "critical" if any(log.get('level', '').lower() in ['critical', 'fatal'] for log in chain) else "high"
                })
        
        # Sort chains by length and severity
        chains.sort(key=lambda x: (x["length"], x["duration"]), reverse=True)
        
        return {
            "total_error_logs": len(error_logs),
            "chains_detected": len(chains),
            "chains": chains[:10]  # Top 10 chains
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to detect error chains: {str(e)}")
