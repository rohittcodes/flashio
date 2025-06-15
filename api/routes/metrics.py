from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
import json
import os
from collections import defaultdict, Counter
import statistics

router = APIRouter(prefix="/metrics", tags=["metrics"])

# Metrics models
class SystemMetrics(BaseModel):
    timestamp: datetime
    total_logs: int
    logs_per_second: float
    error_rate: float
    warning_rate: float
    top_services: List[Dict[str, Any]]
    response_time_avg: Optional[float] = None
    response_time_p95: Optional[float] = None
    unique_users: int
    unique_sessions: int

class ServiceMetrics(BaseModel):
    service_name: str
    total_logs: int
    error_count: int
    warning_count: int
    error_rate: float
    avg_logs_per_minute: float
    peak_logs_per_minute: float
    last_activity: datetime
    health_score: float

class PerformanceMetrics(BaseModel):
    time_range: Dict[str, str]
    throughput: Dict[str, float]  # logs per unit time
    error_trends: List[Dict[str, Any]]
    service_performance: List[ServiceMetrics]
    system_health_score: float
    alerts_triggered: int
    anomalies_detected: int

class DashboardData(BaseModel):
    current_metrics: SystemMetrics
    performance_metrics: PerformanceMetrics
    recent_trends: List[Dict[str, Any]]
    top_errors: List[Dict[str, Any]]
    service_status: List[Dict[str, Any]]
    real_time_stats: Dict[str, Any]

class MetricsCalculator:
    """Advanced metrics calculation engine"""
    
    def __init__(self):
        self.metrics_cache = {}
        
    def parse_timestamp(self, timestamp_str: str) -> datetime:
        """Parse various timestamp formats"""
        try:
            return datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
        except:
            try:
                return datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M:%S")
            except:
                return datetime.now()
    
    def calculate_system_metrics(self, logs: List[Dict[str, Any]], time_window: int = 3600) -> SystemMetrics:
        """Calculate comprehensive system metrics"""
        if not logs:
            return SystemMetrics(
                timestamp=datetime.now(),
                total_logs=0,
                logs_per_second=0.0,
                error_rate=0.0,
                warning_rate=0.0,
                top_services=[],
                unique_users=0,
                unique_sessions=0
            )
        
        # Basic counts
        total_logs = len(logs)
        error_count = sum(1 for log in logs if log.get('level', '').lower() in ['error', 'critical', 'fatal'])
        warning_count = sum(1 for log in logs if log.get('level', '').lower() in ['warn', 'warning'])
        
        # Calculate rates
        error_rate = error_count / total_logs if total_logs > 0 else 0.0
        warning_rate = warning_count / total_logs if total_logs > 0 else 0.0
        
        # Calculate logs per second
        timestamps = [self.parse_timestamp(log.get('timestamp', '')) for log in logs]
        if len(timestamps) > 1:
            time_span = (max(timestamps) - min(timestamps)).total_seconds()
            logs_per_second = total_logs / time_span if time_span > 0 else 0.0
        else:
            logs_per_second = 0.0
        
        # Service statistics
        service_counts = Counter(log.get('service', 'unknown') for log in logs)
        top_services = [
            {"service": service, "count": count, "percentage": count / total_logs * 100}
            for service, count in service_counts.most_common(10)
        ]
        
        # Extract response times if available
        response_times = []
        for log in logs:
            message = log.get('message', '')
            if 'response_time' in message or 'duration' in message:
                try:
                    # Simple extraction - could be improved with regex
                    words = message.split()
                    for i, word in enumerate(words):
                        if 'response_time' in word or 'duration' in word:
                            if i + 1 < len(words):
                                time_str = words[i + 1].replace('ms', '').replace('s', '')
                                response_times.append(float(time_str))
                                break
                except:
                    continue
        
        response_time_avg = statistics.mean(response_times) if response_times else None
        response_time_p95 = statistics.quantiles(response_times, n=20)[18] if len(response_times) > 20 else None
        
        # Unique users and sessions
        users = set()
        sessions = set()
        
        for log in logs:
            message = log.get('message', '')
            
            # Extract user_id
            if 'user_id' in log:
                users.add(log['user_id'])
            elif 'user_id' in message:
                try:
                    user_part = message.split('user_id')[1].split()[0].strip(':=[]()').strip()
                    if user_part:
                        users.add(user_part)
                except:
                    pass
            
            # Extract session_id
            if 'session_id' in log:
                sessions.add(log['session_id'])
            elif 'session_id' in message:
                try:
                    session_part = message.split('session_id')[1].split()[0].strip(':=[]()').strip()
                    if session_part:
                        sessions.add(session_part)
                except:
                    pass
        
        return SystemMetrics(
            timestamp=datetime.now(),
            total_logs=total_logs,
            logs_per_second=logs_per_second,
            error_rate=error_rate,
            warning_rate=warning_rate,
            top_services=top_services,
            response_time_avg=response_time_avg,
            response_time_p95=response_time_p95,
            unique_users=len(users),
            unique_sessions=len(sessions)
        )
    
    def calculate_service_metrics(self, logs: List[Dict[str, Any]]) -> List[ServiceMetrics]:
        """Calculate metrics for each service"""
        service_groups = defaultdict(list)
        
        # Group logs by service
        for log in logs:
            service = log.get('service', 'unknown')
            service_groups[service].append(log)
        
        service_metrics = []
        
        for service_name, service_logs in service_groups.items():
            total_logs = len(service_logs)
            error_count = sum(1 for log in service_logs if log.get('level', '').lower() in ['error', 'critical', 'fatal'])
            warning_count = sum(1 for log in service_logs if log.get('level', '').lower() in ['warn', 'warning'])
            
            error_rate = error_count / total_logs if total_logs > 0 else 0.0
            
            # Calculate logs per minute
            timestamps = [self.parse_timestamp(log.get('timestamp', '')) for log in service_logs]
            if len(timestamps) > 1:
                time_span_minutes = (max(timestamps) - min(timestamps)).total_seconds() / 60
                avg_logs_per_minute = total_logs / time_span_minutes if time_span_minutes > 0 else 0.0
                
                # Calculate peak logs per minute (using 1-minute windows)
                minute_counts = defaultdict(int)
                for ts in timestamps:
                    minute_key = ts.strftime('%Y-%m-%d %H:%M')
                    minute_counts[minute_key] += 1
                
                peak_logs_per_minute = max(minute_counts.values()) if minute_counts else 0.0
            else:
                avg_logs_per_minute = 0.0
                peak_logs_per_minute = 0.0
            
            last_activity = max(timestamps) if timestamps else datetime.now()
            
            # Calculate health score (0-100)
            health_score = 100.0
            health_score -= error_rate * 50  # Reduce by error rate
            health_score -= min(30, warning_count / total_logs * 100 * 0.3)  # Reduce by warnings
            
            # Factor in recency
            time_since_last = (datetime.now() - last_activity).total_seconds()
            if time_since_last > 3600:  # 1 hour
                health_score -= min(20, time_since_last / 3600 * 5)
            
            health_score = max(0, health_score)
            
            service_metrics.append(ServiceMetrics(
                service_name=service_name,
                total_logs=total_logs,
                error_count=error_count,
                warning_count=warning_count,
                error_rate=error_rate,
                avg_logs_per_minute=avg_logs_per_minute,
                peak_logs_per_minute=peak_logs_per_minute,
                last_activity=last_activity,
                health_score=health_score
            ))
        
        return sorted(service_metrics, key=lambda x: x.total_logs, reverse=True)
    
    def calculate_performance_metrics(self, logs: List[Dict[str, Any]], time_range_hours: int = 24) -> PerformanceMetrics:
        """Calculate performance metrics over time"""
        if not logs:
            return PerformanceMetrics(
                time_range={"start": "", "end": ""},
                throughput={},
                error_trends=[],
                service_performance=[],
                system_health_score=100.0,
                alerts_triggered=0,
                anomalies_detected=0
            )
        
        # Calculate time range
        timestamps = [self.parse_timestamp(log.get('timestamp', '')) for log in logs]
        start_time = min(timestamps)
        end_time = max(timestamps)
        
        time_range = {
            "start": start_time.isoformat(),
            "end": end_time.isoformat()
        }
        
        # Calculate throughput
        total_hours = (end_time - start_time).total_seconds() / 3600
        logs_per_hour = len(logs) / total_hours if total_hours > 0 else 0
        logs_per_minute = logs_per_hour / 60
        logs_per_second = logs_per_minute / 60
        
        throughput = {
            "logs_per_hour": logs_per_hour,
            "logs_per_minute": logs_per_minute,
            "logs_per_second": logs_per_second
        }
        
        # Calculate error trends (hourly buckets)
        error_trends = []
        hour_buckets = defaultdict(lambda: {"total": 0, "errors": 0, "warnings": 0})
        
        for log in logs:
            timestamp = self.parse_timestamp(log.get('timestamp', ''))
            hour_key = timestamp.strftime('%Y-%m-%d %H:00')
            level = log.get('level', '').lower()
            
            hour_buckets[hour_key]["total"] += 1
            if level in ['error', 'critical', 'fatal']:
                hour_buckets[hour_key]["errors"] += 1
            elif level in ['warn', 'warning']:
                hour_buckets[hour_key]["warnings"] += 1
        
        for hour, counts in sorted(hour_buckets.items()):
            error_rate = counts["errors"] / counts["total"] if counts["total"] > 0 else 0
            error_trends.append({
                "hour": hour,
                "total_logs": counts["total"],
                "errors": counts["errors"],
                "warnings": counts["warnings"],
                "error_rate": error_rate
            })
        
        # Get service performance
        service_performance = self.calculate_service_metrics(logs)
        
        # Calculate overall system health score
        total_logs = len(logs)
        error_count = sum(1 for log in logs if log.get('level', '').lower() in ['error', 'critical', 'fatal'])
        warning_count = sum(1 for log in logs if log.get('level', '').lower() in ['warn', 'warning'])
        
        system_health_score = 100.0
        system_health_score -= (error_count / total_logs * 100) * 0.8  # Weight errors heavily
        system_health_score -= (warning_count / total_logs * 100) * 0.2  # Weight warnings less
        system_health_score = max(0, system_health_score)
        
        return PerformanceMetrics(
            time_range=time_range,
            throughput=throughput,
            error_trends=error_trends,
            service_performance=service_performance,
            system_health_score=system_health_score,
            alerts_triggered=0,  # Would be populated from alerts system
            anomalies_detected=0  # Would be populated from anomaly detection
        )
    
    def generate_dashboard_data(self, logs: List[Dict[str, Any]]) -> DashboardData:
        """Generate comprehensive dashboard data"""
        current_metrics = self.calculate_system_metrics(logs)
        performance_metrics = self.calculate_performance_metrics(logs)
        
        # Recent trends (last 6 hours)
        recent_cutoff = datetime.now() - timedelta(hours=6)
        recent_logs = [
            log for log in logs 
            if self.parse_timestamp(log.get('timestamp', '')) >= recent_cutoff
        ]
        
        recent_trends = []
        if recent_logs:
            # Group by hour
            hourly_stats = defaultdict(lambda: {"logs": 0, "errors": 0})
            for log in recent_logs:
                hour = self.parse_timestamp(log.get('timestamp', '')).strftime('%H:00')
                hourly_stats[hour]["logs"] += 1
                if log.get('level', '').lower() in ['error', 'critical', 'fatal']:
                    hourly_stats[hour]["errors"] += 1
            
            for hour, stats in sorted(hourly_stats.items()):
                recent_trends.append({
                    "hour": hour,
                    "logs": stats["logs"],
                    "errors": stats["errors"],
                    "error_rate": stats["errors"] / stats["logs"] if stats["logs"] > 0 else 0
                })
        
        # Top errors
        error_logs = [log for log in logs if log.get('level', '').lower() in ['error', 'critical', 'fatal']]
        error_messages = Counter()
        for log in error_logs:
            message = log.get('message', '')[:100]  # Truncate long messages
            error_messages[message] += 1
        
        top_errors = [
            {"message": message, "count": count, "percentage": count / len(error_logs) * 100}
            for message, count in error_messages.most_common(10)
        ] if error_logs else []
        
        # Service status
        service_status = []
        for service_metric in performance_metrics.service_performance[:10]:
            status = "healthy"
            if service_metric.health_score < 50:
                status = "critical"
            elif service_metric.health_score < 70:
                status = "warning"
            elif service_metric.health_score < 85:
                status = "degraded"
            
            service_status.append({
                "service": service_metric.service_name,
                "status": status,
                "health_score": service_metric.health_score,
                "error_rate": service_metric.error_rate,
                "last_activity": service_metric.last_activity.isoformat()
            })
        
        # Real-time stats
        now = datetime.now()
        last_hour_logs = [
            log for log in logs 
            if self.parse_timestamp(log.get('timestamp', '')) >= now - timedelta(hours=1)
        ]
        
        real_time_stats = {
            "logs_last_hour": len(last_hour_logs),
            "current_rate": len(last_hour_logs) / 60.0,  # logs per minute
            "active_services": len(set(log.get('service', '') for log in last_hour_logs)),
            "recent_errors": len([log for log in last_hour_logs if log.get('level', '').lower() in ['error', 'critical', 'fatal']]),
            "system_status": "healthy" if performance_metrics.system_health_score > 80 else "degraded" if performance_metrics.system_health_score > 60 else "critical"
        }
        
        return DashboardData(
            current_metrics=current_metrics,
            performance_metrics=performance_metrics,
            recent_trends=recent_trends,
            top_errors=top_errors,
            service_status=service_status,
            real_time_stats=real_time_stats
        )

# Global calculator instance
calculator = MetricsCalculator()

@router.post("/system", response_model=SystemMetrics)
async def get_system_metrics(
    logs: List[Dict[str, Any]],
    time_window: int = 3600
):
    """Calculate current system metrics"""
    try:
        global calculator
        metrics = calculator.calculate_system_metrics(logs, time_window)
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate system metrics: {str(e)}")

@router.post("/services", response_model=List[ServiceMetrics])
async def get_service_metrics(
    logs: List[Dict[str, Any]]
):
    """Calculate metrics for each service"""
    try:
        global calculator
        service_metrics = calculator.calculate_service_metrics(logs)
        return service_metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate service metrics: {str(e)}")

@router.post("/performance", response_model=PerformanceMetrics)
async def get_performance_metrics(
    logs: List[Dict[str, Any]],
    time_range_hours: int = 24
):
    """Calculate performance metrics over time"""
    try:
        global calculator
        performance = calculator.calculate_performance_metrics(logs, time_range_hours)
        return performance
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate performance metrics: {str(e)}")

@router.post("/dashboard", response_model=DashboardData)
async def get_dashboard_data(
    logs: List[Dict[str, Any]]
):
    """Get comprehensive dashboard data"""
    try:
        global calculator
        dashboard_data = calculator.generate_dashboard_data(logs)
        return dashboard_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate dashboard data: {str(e)}")

@router.get("/health")
async def system_health_check():
    """Quick system health check"""
    try:
        # This would typically check various system components
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "components": {
                "api": "healthy",
                "database": "healthy",
                "storage": "healthy",
                "alerts": "healthy",
                "anomaly_detection": "healthy"
            },
            "uptime": "24h 15m",  # Would be calculated from actual uptime
            "version": "1.0.0"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")

@router.post("/trends")
async def analyze_trends(
    logs: List[Dict[str, Any]],
    time_bucket: str = "hour"  # hour, day, week
):
    """Analyze trends in log data"""
    try:
        global calculator
        
        if not logs:
            return {"message": "No logs provided", "trends": []}
        
        # Group logs by time bucket
        time_buckets = defaultdict(lambda: {"total": 0, "errors": 0, "warnings": 0, "services": set()})
        
        for log in logs:
            timestamp = calculator.parse_timestamp(log.get('timestamp', ''))
            
            if time_bucket == "hour":
                bucket_key = timestamp.strftime('%Y-%m-%d %H:00')
            elif time_bucket == "day":
                bucket_key = timestamp.strftime('%Y-%m-%d')
            elif time_bucket == "week":
                # Get Monday of the week
                monday = timestamp - timedelta(days=timestamp.weekday())
                bucket_key = monday.strftime('%Y-%m-%d')
            else:
                bucket_key = timestamp.strftime('%Y-%m-%d %H:00')
            
            level = log.get('level', '').lower()
            service = log.get('service', 'unknown')
            
            time_buckets[bucket_key]["total"] += 1
            time_buckets[bucket_key]["services"].add(service)
            
            if level in ['error', 'critical', 'fatal']:
                time_buckets[bucket_key]["errors"] += 1
            elif level in ['warn', 'warning']:
                time_buckets[bucket_key]["warnings"] += 1
        
        # Convert to trend data
        trends = []
        for bucket_time, stats in sorted(time_buckets.items()):
            error_rate = stats["errors"] / stats["total"] if stats["total"] > 0 else 0
            warning_rate = stats["warnings"] / stats["total"] if stats["total"] > 0 else 0
            
            trends.append({
                "time": bucket_time,
                "total_logs": stats["total"],
                "errors": stats["errors"],
                "warnings": stats["warnings"],
                "error_rate": error_rate,
                "warning_rate": warning_rate,
                "active_services": len(stats["services"])
            })
        
        # Calculate trend direction
        if len(trends) >= 2:
            recent_error_rate = trends[-1]["error_rate"]
            previous_error_rate = trends[-2]["error_rate"]
            error_trend = "increasing" if recent_error_rate > previous_error_rate else "decreasing" if recent_error_rate < previous_error_rate else "stable"
            
            recent_volume = trends[-1]["total_logs"]
            previous_volume = trends[-2]["total_logs"]
            volume_trend = "increasing" if recent_volume > previous_volume else "decreasing" if recent_volume < previous_volume else "stable"
        else:
            error_trend = "unknown"
            volume_trend = "unknown"
        
        return {
            "time_bucket": time_bucket,
            "total_periods": len(trends),
            "trends": trends,
            "summary": {
                "error_trend": error_trend,
                "volume_trend": volume_trend,
                "avg_error_rate": statistics.mean([t["error_rate"] for t in trends]) if trends else 0,
                "peak_volume": max([t["total_logs"] for t in trends]) if trends else 0
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze trends: {str(e)}")
