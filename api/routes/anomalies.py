from fastapi import APIRouter, Depends, HTTPException, Header, BackgroundTasks
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
import json
import os
import asyncio
import numpy as np
from collections import defaultdict, Counter
from utils.encryption import CredentialManager
from storage.chroma_client import ChromaLogStore

router = APIRouter(prefix="/anomalies", tags=["anomalies"])
credential_manager = CredentialManager()

# Anomaly models
class AnomalyConfig(BaseModel):
    enabled: bool = Field(True, description="Whether anomaly detection is enabled")
    sensitivity: float = Field(0.8, description="Anomaly detection sensitivity (0.0-1.0)")
    time_window: int = Field(3600, description="Time window for analysis in seconds")
    min_samples: int = Field(10, description="Minimum samples required for detection")
    detection_methods: List[str] = Field(
        default=["volume", "pattern", "timing"],
        description="Detection methods to use"
    )

class Anomaly(BaseModel):
    id: str
    type: str  # volume, pattern, timing, etc.
    severity: str  # low, medium, high, critical
    description: str
    timestamp: datetime
    affected_logs: List[Dict[str, Any]]
    metrics: Dict[str, float]
    confidence: float
    baseline: Optional[Dict[str, Any]] = None

class AnomalyReport(BaseModel):
    timestamp: datetime
    total_anomalies: int
    anomalies_by_type: Dict[str, int]
    anomalies_by_severity: Dict[str, int]
    recent_anomalies: List[Anomaly]
    system_health_score: float

# API key validation
async def verify_api_key(x_api_key: str = Header(...)):
    """Verify API key middleware"""
    expected_key_hash = os.getenv('API_KEY_HASH')
    if not expected_key_hash:
        raise HTTPException(status_code=500, detail="API key not configured")
    
    if credential_manager.hash_api_key(x_api_key) != expected_key_hash:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return x_api_key

async def verify_api_key_optional(x_api_key: str = Header(None)):
    """Optional API key verification for read-only endpoints"""
    if x_api_key is None:
        return None  # Allow access without API key
    
    expected_key_hash = os.getenv('API_KEY_HASH')
    if not expected_key_hash:
        return None  # If no API key is configured, allow access
    
    if credential_manager.hash_api_key(x_api_key) != expected_key_hash:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return x_api_key

# Global configuration and storage
anomaly_config = AnomalyConfig()
detected_anomalies: Dict[str, Anomaly] = {}
baseline_metrics: Dict[str, List[float]] = defaultdict(list)
real_time_monitoring = False

class AnomalyDetector:
    """Real-time anomaly detection engine"""
    
    def __init__(self, config: AnomalyConfig):
        self.config = config
        self.baseline_data = defaultdict(list)
        
    def update_baseline(self, logs: List[Dict[str, Any]]):
        """Update baseline metrics from historical logs"""
        if not logs:
            return
            
        # Volume metrics
        hourly_counts = defaultdict(int)
        error_rates = []
        response_times = []
        
        for log in logs:
            timestamp = log.get('timestamp', '')
            level = log.get('level', '').lower()
            
            try:
                dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                hour_key = dt.hour
                hourly_counts[hour_key] += 1
                
                if level in ['error', 'critical', 'fatal']:
                    error_rates.append(1)
                else:
                    error_rates.append(0)
                    
                # Extract response time if available
                message = log.get('message', '')
                if 'response_time' in message:
                    try:
                        # Simple extraction - in production, use more sophisticated parsing
                        time_str = message.split('response_time')[1].split()[0]
                        response_times.append(float(time_str.replace('ms', '').replace(':', '')))
                    except:
                        pass
                        
            except Exception:
                continue
        
        # Store baseline metrics
        self.baseline_data['hourly_volume'] = list(hourly_counts.values())
        self.baseline_data['error_rate'] = error_rates
        self.baseline_data['response_times'] = response_times
        
    def detect_volume_anomalies(self, current_logs: List[Dict[str, Any]]) -> List[Anomaly]:
        """Detect volume-based anomalies"""
        anomalies = []
        
        if len(current_logs) < self.config.min_samples:
            return anomalies
            
        current_volume = len(current_logs)
        baseline_volumes = self.baseline_data.get('hourly_volume', [])
        
        if len(baseline_volumes) < 5:  # Need some baseline data
            return anomalies
            
        # Calculate statistics
        baseline_mean = np.mean(baseline_volumes)
        baseline_std = np.std(baseline_volumes)
        
        # Detect anomalies using standard deviation
        threshold = baseline_mean + (2 * baseline_std * self.config.sensitivity)
        low_threshold = max(0, baseline_mean - (2 * baseline_std * self.config.sensitivity))
        
        severity = "low"
        confidence = 0.5
        
        if current_volume > threshold:
            severity = "high" if current_volume > threshold * 1.5 else "medium"
            confidence = min(0.95, (current_volume - threshold) / threshold)
            
            anomaly = Anomaly(
                id=f"volume_high_{int(datetime.now().timestamp())}",
                type="volume",
                severity=severity,
                description=f"Unusually high log volume: {current_volume} (baseline: {baseline_mean:.1f}±{baseline_std:.1f})",
                timestamp=datetime.now(),
                affected_logs=current_logs[:10],  # Sample of affected logs
                metrics={"current_volume": current_volume, "baseline_mean": baseline_mean, "baseline_std": baseline_std},
                confidence=confidence,
                baseline={"mean": baseline_mean, "std": baseline_std, "threshold": threshold}
            )
            anomalies.append(anomaly)
            
        elif current_volume < low_threshold:
            severity = "medium" if current_volume < low_threshold * 0.5 else "low"
            confidence = min(0.95, (low_threshold - current_volume) / low_threshold)
            
            anomaly = Anomaly(
                id=f"volume_low_{int(datetime.now().timestamp())}",
                type="volume",
                severity=severity,
                description=f"Unusually low log volume: {current_volume} (baseline: {baseline_mean:.1f}±{baseline_std:.1f})",
                timestamp=datetime.now(),
                affected_logs=current_logs,
                metrics={"current_volume": current_volume, "baseline_mean": baseline_mean, "baseline_std": baseline_std},
                confidence=confidence,
                baseline={"mean": baseline_mean, "std": baseline_std, "threshold": low_threshold}
            )
            anomalies.append(anomaly)
            
        return anomalies
        
    def detect_pattern_anomalies(self, current_logs: List[Dict[str, Any]]) -> List[Anomaly]:
        """Detect pattern-based anomalies"""
        anomalies = []
        
        # Count error rates
        error_count = sum(1 for log in current_logs if log.get('level', '').lower() in ['error', 'critical', 'fatal'])
        error_rate = error_count / len(current_logs) if current_logs else 0
        
        baseline_error_rates = self.baseline_data.get('error_rate', [])
        if len(baseline_error_rates) < 10:
            return anomalies
            
        baseline_error_rate = np.mean(baseline_error_rates)
        error_threshold = baseline_error_rate + (0.1 * self.config.sensitivity)  # 10% above baseline
        
        if error_rate > error_threshold:
            severity = "critical" if error_rate > 0.5 else "high" if error_rate > 0.2 else "medium"
            confidence = min(0.95, (error_rate - error_threshold) / error_threshold)
            
            anomaly = Anomaly(
                id=f"pattern_error_{int(datetime.now().timestamp())}",
                type="pattern",
                severity=severity,
                description=f"High error rate detected: {error_rate:.2%} (baseline: {baseline_error_rate:.2%})",
                timestamp=datetime.now(),
                affected_logs=[log for log in current_logs if log.get('level', '').lower() in ['error', 'critical', 'fatal']][:10],
                metrics={"current_error_rate": error_rate, "baseline_error_rate": baseline_error_rate},
                confidence=confidence
            )
            anomalies.append(anomaly)
            
        # Check for unusual patterns in log messages
        message_patterns = Counter()
        for log in current_logs:
            message = log.get('message', '')
            # Simple pattern extraction - look for repeated error patterns
            words = message.lower().split()
            if len(words) > 3:
                pattern = ' '.join(words[:3])  # First 3 words as pattern
                message_patterns[pattern] += 1
                
        # Find patterns that appear unusually frequently
        total_logs = len(current_logs)
        for pattern, count in message_patterns.items():
            frequency = count / total_logs
            if frequency > 0.1 and count > 5:  # Pattern appears in >10% of logs and >5 times
                anomaly = Anomaly(
                    id=f"pattern_repeat_{int(datetime.now().timestamp())}_{hash(pattern) % 10000}",
                    type="pattern",
                    severity="medium",
                    description=f"Repeated pattern detected: '{pattern}' ({count} occurrences, {frequency:.1%})",
                    timestamp=datetime.now(),
                    affected_logs=[log for log in current_logs if pattern in log.get('message', '').lower()][:5],
                    metrics={"pattern_frequency": frequency, "pattern_count": count},
                    confidence=min(0.9, frequency * 2)
                )
                anomalies.append(anomaly)
        
        return anomalies
        
    def analyze_logs(self, logs: List[Dict[str, Any]]) -> List[Anomaly]:
        """Analyze logs for anomalies using configured detection methods"""
        all_anomalies = []
        
        if not self.config.enabled:
            return all_anomalies
            
        if "volume" in self.config.detection_methods:
            all_anomalies.extend(self.detect_volume_anomalies(logs))
            
        if "pattern" in self.config.detection_methods:
            all_anomalies.extend(self.detect_pattern_anomalies(logs))
            
        return all_anomalies

# Global detector instance
detector = AnomalyDetector(anomaly_config)

@router.post("/config")
async def update_anomaly_config(
    config: AnomalyConfig,
    api_key: str = Depends(verify_api_key)
):
    """Update anomaly detection configuration"""
    try:
        global anomaly_config, detector
        anomaly_config = config
        detector = AnomalyDetector(config)
        
        return {"message": "Anomaly detection configuration updated", "config": config.dict()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update config: {str(e)}")

@router.get("/config")
async def get_anomaly_config(api_key: str = Depends(verify_api_key_optional)):
    """Get current anomaly detection configuration"""
    return anomaly_config.dict()

@router.post("/analyze")
async def analyze_logs_for_anomalies(
    logs: List[Dict[str, Any]],
    update_baseline: bool = False,
    api_key: str = Depends(verify_api_key)
):
    """Analyze logs for anomalies"""
    try:
        global detector, detected_anomalies
        
        if update_baseline:
            detector.update_baseline(logs)
            
        anomalies = detector.analyze_logs(logs)
        
        # Store detected anomalies
        for anomaly in anomalies:
            detected_anomalies[anomaly.id] = anomaly
            
        return {
            "analyzed_logs": len(logs),
            "anomalies_detected": len(anomalies),
            "anomalies": [anomaly.dict() for anomaly in anomalies]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze logs: {str(e)}")

@router.get("/detected", response_model=List[Anomaly])
async def get_detected_anomalies(
    severity: Optional[str] = None,
    anomaly_type: Optional[str] = None,
    limit: int = 50,
    api_key: str = Depends(verify_api_key_optional)
):
    """Get detected anomalies with optional filtering"""
    try:
        anomalies = list(detected_anomalies.values())
        
        if severity:
            anomalies = [a for a in anomalies if a.severity == severity]
            
        if anomaly_type:
            anomalies = [a for a in anomalies if a.type == anomaly_type]
            
        # Sort by timestamp, newest first
        anomalies.sort(key=lambda x: x.timestamp, reverse=True)
        
        return anomalies[:limit]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get anomalies: {str(e)}")

@router.get("/report", response_model=AnomalyReport)
async def get_anomaly_report(api_key: str = Depends(verify_api_key_optional)):
    """Get comprehensive anomaly report"""
    try:
        anomalies = list(detected_anomalies.values())
        
        # Count by type and severity
        type_counts = defaultdict(int)
        severity_counts = defaultdict(int)
        
        for anomaly in anomalies:
            type_counts[anomaly.type] += 1
            severity_counts[anomaly.severity] += 1
            
        # Calculate system health score
        total_anomalies = len(anomalies)
        critical_count = severity_counts.get('critical', 0)
        high_count = severity_counts.get('high', 0)
        
        # Health score calculation (0-100)
        health_score = 100.0
        health_score -= critical_count * 20  # -20 for each critical
        health_score -= high_count * 10      # -10 for each high
        health_score -= (total_anomalies - critical_count - high_count) * 2  # -2 for others
        health_score = max(0, health_score)
        
        # Get recent anomalies (last 24 hours)
        recent_threshold = datetime.now() - timedelta(hours=24)
        recent_anomalies = [
            a for a in anomalies 
            if a.timestamp >= recent_threshold
        ]
        recent_anomalies.sort(key=lambda x: x.timestamp, reverse=True)
        
        return AnomalyReport(
            timestamp=datetime.now(),
            total_anomalies=total_anomalies,
            anomalies_by_type=dict(type_counts),
            anomalies_by_severity=dict(severity_counts),
            recent_anomalies=recent_anomalies[:20],
            system_health_score=health_score
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")

@router.post("/start-monitoring")
async def start_real_time_monitoring(
    background_tasks: BackgroundTasks,
    api_key: str = Depends(verify_api_key)
):
    """Start real-time anomaly monitoring"""
    global real_time_monitoring
    
    if real_time_monitoring:
        return {"message": "Real-time monitoring is already running"}
    
    real_time_monitoring = True
    
    # In a production system, this would connect to your log stream
    # For now, we'll simulate monitoring
    return {"message": "Real-time anomaly monitoring started"}

@router.post("/stop-monitoring")
async def stop_real_time_monitoring(api_key: str = Depends(verify_api_key)):
    """Stop real-time anomaly monitoring"""
    global real_time_monitoring
    real_time_monitoring = False
    return {"message": "Real-time anomaly monitoring stopped"}

@router.get("/monitoring-status")
async def get_monitoring_status(api_key: str = Depends(verify_api_key_optional)):
    """Get real-time monitoring status"""
    return {
        "monitoring_active": real_time_monitoring,
        "config": anomaly_config.dict(),
        "total_detected_anomalies": len(detected_anomalies)
    }

@router.delete("/clear")
async def clear_anomalies(
    older_than_hours: int = 24,
    api_key: str = Depends(verify_api_key)
):
    """Clear old anomalies"""
    try:
        cutoff_time = datetime.now() - timedelta(hours=older_than_hours)
        
        before_count = len(detected_anomalies)
        anomalies_to_remove = [
            anomaly_id for anomaly_id, anomaly in detected_anomalies.items()
            if anomaly.timestamp < cutoff_time
        ]
        
        for anomaly_id in anomalies_to_remove:
            del detected_anomalies[anomaly_id]
            
        cleared_count = len(anomalies_to_remove)
        
        return {
            "message": f"Cleared {cleared_count} anomalies older than {older_than_hours} hours",
            "remaining_anomalies": len(detected_anomalies)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear anomalies: {str(e)}")
