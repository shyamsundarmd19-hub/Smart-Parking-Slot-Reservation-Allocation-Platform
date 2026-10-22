import os
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Local fallback directory for dev/test when AWS S3 is not configured
LOCAL_STORAGE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "passes")
os.makedirs(LOCAL_STORAGE_DIR, exist_ok=True)


class S3Service:
    def __init__(self):
        self.bucket_name = settings.AWS_S3_BUCKET_NAME
        self.region = settings.AWS_REGION
        self.s3_client = None

        if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            try:
                self.s3_client = boto3.client(
                    "s3",
                    region_name=self.region,
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                )
            except Exception as e:
                logger.warning(f"Could not initialize Boto3 S3 client: {e}")
        else:
            # Check default AWS environment or IAM role on EC2 instance
            try:
                self.s3_client = boto3.client("s3", region_name=self.region)
            except Exception:
                self.s3_client = None

    def upload_pass_pdf(self, file_bytes: bytes, filename: str) -> str:
        """
        Uploads generated PDF pass with AES-256 (SSE-S3) encryption.
        Returns the S3 URL or fallback local URL.
        """
        s3_key = f"passes/{filename}"

        if self.s3_client and self.bucket_name:
            try:
                # AWS Free Tier S3 upload with Server-Side Encryption (SSE-S3)
                self.s3_client.put_object(
                    Bucket=self.bucket_name,
                    Key=s3_key,
                    Body=file_bytes,
                    ContentType="application/pdf",
                    ServerSideEncryption="AES256",  # Free Tier included SSE-S3
                )
                url = f"https://{self.bucket_name}.s3.{self.region}.amazonaws.com/{s3_key}"
                logger.info(f"Pass successfully uploaded to AWS S3: {url}")
                return url
            except (ClientError, NoCredentialsError) as e:
                logger.warning(f"AWS S3 upload failed ({e}). Falling back to local storage.")

        # Local storage fallback for local testing & environments without AWS keys
        local_path = os.path.join(LOCAL_STORAGE_DIR, filename)
        with open(local_path, "wb") as f:
            f.write(file_bytes)
        local_url = f"/api/static/passes/{filename}"
        logger.info(f"Pass saved locally to: {local_path}")
        return local_url


s3_service = S3Service()
