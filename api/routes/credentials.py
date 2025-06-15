from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Optional
from pydantic import BaseModel, Field
import os
from utils.encryption import CredentialManager

router = APIRouter(prefix="/credentials", tags=["credentials"])

# Initialize credential manager
credential_manager = CredentialManager()

# Define request/response models
class AWSCredentials(BaseModel):
    aws_access_key_id: str = Field(..., description="AWS Access Key ID")
    aws_secret_access_key: str = Field(..., description="AWS Secret Access Key")
    region_name: str = Field(..., description="AWS Region")
    log_group_name: str = Field(..., description="CloudWatch Log Group Name")

@router.post("/aws")
async def store_aws_credentials(
    credentials: AWSCredentials
) -> Dict[str, str]:
    """Store encrypted AWS credentials"""
    try:
        # Encrypt credentials
        encrypted_creds = credential_manager.encrypt_credentials(credentials.dict())
        
        # In a production environment, you would store these in a secure database
        # For now, we'll use an environment variable (not recommended for production)
        os.environ['ENCRYPTED_AWS_CREDENTIALS'] = encrypted_creds
        
        return {"message": "AWS credentials stored successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to store credentials: {str(e)}")

@router.get("/aws/test")
async def test_aws_connection() -> Dict[str, str]:
    """Test AWS CloudWatch connection with stored credentials"""
    try:
        # Get encrypted credentials
        encrypted_creds = os.getenv('ENCRYPTED_AWS_CREDENTIALS')
        if not encrypted_creds:
            raise HTTPException(status_code=404, detail="No AWS credentials found")
        
        # Decrypt credentials
        credentials = credential_manager.decrypt_credentials(encrypted_creds)
        
        # Initialize CloudWatch client and test connection
        from log_sources.cloud.aws_cloudwatch import CloudWatchLogSource
        log_source = CloudWatchLogSource(credentials)
        
        # Test connection by attempting to connect
        await log_source.connect()
        await log_source.disconnect()
        
        return {"message": "AWS CloudWatch connection successful"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Connection test failed: {str(e)}")