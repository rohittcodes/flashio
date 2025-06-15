from fastapi import APIRouter, Depends, HTTPException, Header
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
import json
import os
import asyncio
from utils.encryption import CredentialManager
from storage.chroma_client import ChromaLogStore

router = APIRouter(prefix="/alerts", tags=["alerts"])
credential_manager = CredentialManager()

# Alert models
class AlertRule(BaseModel):
    name: str = Field(..., description="Name of the alert rule")
    pattern: str = Field(..., description="Pattern to match (regex or keywords)")
    severity: str = Field("medium", description="Alert severity: low, medium, high, critical")
    enabled: bool = Field(True, description="Whether the alert is enabled")
    threshold: Optional[int] = Field(1, description="Number of matches before triggering")
    time_window: Optional[int] = Field(300, description="Time window in seconds")
    notification_channels: List[str] = Field(default_factory=list, description="Notification channels")

class Alert(BaseModel):
    id: str
    rule_name: str
    severity: str
    message: str
    timestamp: datetime
    log_count: int
    pattern_matches: List[Dict[str, Any]]
    acknowledged: bool = False

class AlertSummary(BaseModel):
    total_alerts: int
    critical_alerts: int
    high_alerts: int
    medium_alerts: int
    low_alerts: int
    recent_alerts: List[Alert]

# API key validation
async def verify_api_key(x_api_key: str = Header(...)):
    """Verify API key middleware"""
    expected_key_hash = os.getenv('API_KEY_HASH')
    if not expected_key_hash:
        raise HTTPException(status_code=500, detail="API key not configured")
    
    if credential_manager.hash_api_key(x_api_key) != expected_key_hash:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return x_api_key

# In-memory storage for demonstration (use database in production)
alert_rules: Dict[str, AlertRule] = {}
active_alerts: Dict[str, Alert] = {}

@router.post("/rules", response_model=Dict[str, str])
async def create_alert_rule(
    rule: AlertRule,
    api_key: str = Depends(verify_api_key)
):
    """Create a new alert rule"""
    try:
        rule_id = f"rule_{len(alert_rules) + 1}_{int(datetime.now().timestamp())}"
        alert_rules[rule_id] = rule
        
        return {
            "message": f"Alert rule '{rule.name}' created successfully",
            "rule_id": rule_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create alert rule: {str(e)}")

@router.get("/rules", response_model=List[Dict[str, Any]])
async def get_alert_rules(api_key: str = Depends(verify_api_key)):
    """Get all alert rules"""
    try:
        return [
            {"id": rule_id, **rule.dict()}
            for rule_id, rule in alert_rules.items()
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve alert rules: {str(e)}")

@router.delete("/rules/{rule_id}")
async def delete_alert_rule(
    rule_id: str,
    api_key: str = Depends(verify_api_key)
):
    """Delete an alert rule"""
    try:
        if rule_id not in alert_rules:
            raise HTTPException(status_code=404, detail="Alert rule not found")
        
        del alert_rules[rule_id]
        return {"message": f"Alert rule {rule_id} deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete alert rule: {str(e)}")

@router.post("/check")
async def check_alerts_manually(
    logs: List[Dict[str, Any]],
    api_key: str = Depends(verify_api_key)
):
    """Manually check logs against alert rules"""
    try:
        triggered_alerts = []
        
        for rule_id, rule in alert_rules.items():
            if not rule.enabled:
                continue
                
            matches = []
            for log in logs:
                log_text = json.dumps(log).lower()
                pattern = rule.pattern.lower()
                
                if pattern in log_text:
                    matches.append(log)
            
            if len(matches) >= rule.threshold:
                alert_id = f"alert_{int(datetime.now().timestamp())}_{rule_id}"
                alert = Alert(
                    id=alert_id,
                    rule_name=rule.name,
                    severity=rule.severity,
                    message=f"Pattern '{rule.pattern}' found {len(matches)} times",
                    timestamp=datetime.now(),
                    log_count=len(matches),
                    pattern_matches=matches[:10]  # Limit to first 10 matches
                )
                
                active_alerts[alert_id] = alert
                triggered_alerts.append(alert)
        
        return {
            "triggered_alerts": len(triggered_alerts),
            "alerts": [alert.dict() for alert in triggered_alerts]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check alerts: {str(e)}")

@router.get("/active", response_model=List[Alert])
async def get_active_alerts(
    severity: Optional[str] = None,
    api_key: str = Depends(verify_api_key)
):
    """Get active alerts, optionally filtered by severity"""
    try:
        alerts = list(active_alerts.values())
        
        if severity:
            alerts = [alert for alert in alerts if alert.severity == severity]
        
        # Sort by timestamp, newest first
        alerts.sort(key=lambda x: x.timestamp, reverse=True)
        
        return alerts
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve active alerts: {str(e)}")

@router.post("/acknowledge/{alert_id}")
async def acknowledge_alert(
    alert_id: str,
    api_key: str = Depends(verify_api_key)
):
    """Acknowledge an alert"""
    try:
        if alert_id not in active_alerts:
            raise HTTPException(status_code=404, detail="Alert not found")
        
        active_alerts[alert_id].acknowledged = True
        return {"message": f"Alert {alert_id} acknowledged"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to acknowledge alert: {str(e)}")

@router.get("/summary", response_model=AlertSummary)
async def get_alert_summary(api_key: str = Depends(verify_api_key)):
    """Get alert summary and statistics"""
    try:
        alerts = list(active_alerts.values())
        
        severity_counts = {
            "critical": len([a for a in alerts if a.severity == "critical"]),
            "high": len([a for a in alerts if a.severity == "high"]),
            "medium": len([a for a in alerts if a.severity == "medium"]),
            "low": len([a for a in alerts if a.severity == "low"])
        }
        
        # Get recent alerts (last 24 hours)
        recent_threshold = datetime.now() - timedelta(hours=24)
        recent_alerts = [
            alert for alert in alerts 
            if alert.timestamp >= recent_threshold
        ]
        recent_alerts.sort(key=lambda x: x.timestamp, reverse=True)
        
        return AlertSummary(
            total_alerts=len(alerts),
            critical_alerts=severity_counts["critical"],
            high_alerts=severity_counts["high"],
            medium_alerts=severity_counts["medium"],
            low_alerts=severity_counts["low"],
            recent_alerts=recent_alerts[:20]  # Last 20 recent alerts
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get alert summary: {str(e)}")

@router.delete("/clear")
async def clear_acknowledged_alerts(api_key: str = Depends(verify_api_key)):
    """Clear all acknowledged alerts"""
    try:
        before_count = len(active_alerts)
        
        # Remove acknowledged alerts
        active_alerts_copy = active_alerts.copy()
        for alert_id, alert in active_alerts_copy.items():
            if alert.acknowledged:
                del active_alerts[alert_id]
        
        after_count = len(active_alerts)
        cleared_count = before_count - after_count
        
        return {
            "message": f"Cleared {cleared_count} acknowledged alerts",
            "remaining_alerts": after_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear alerts: {str(e)}")
