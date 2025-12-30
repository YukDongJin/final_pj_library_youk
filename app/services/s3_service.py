# 📁 새로 생성된 파일: app/services/s3_service.py
# AWS S3 파일 업로드 서비스

import boto3
from botocore.config import Config
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from botocore.exceptions import ClientError, NoCredentialsError
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class S3Service:
    """
    AWS S3 파일 업로드 서비스
    - Presigned URL 생성
    - 파일 업로드/다운로드
    - 썸네일 생성 및 관리
    """
    
    def __init__(self):
        """S3 클라이언트 초기화"""
        try:
            endpoint_url = f"https://s3.{settings.S3_REGION}.amazonaws.com"
            self.s3_client = boto3.client(
                "s3",
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.S3_REGION,
                endpoint_url=endpoint_url,
                config=Config(s3={"addressing_style": "virtual"}),
            )
            self.bucket_name = settings.S3_BUCKET_NAME
            logger.info("✅ S3 클라이언트 초기화 완료")
        except NoCredentialsError:
            logger.warning("⚠️ AWS 자격 증명이 설정되지 않음 - 개발 모드로 실행")
            self.s3_client = None
            self.bucket_name = settings.S3_BUCKET_NAME
        except Exception as e:
            logger.error(f"❌ S3 클라이언트 초기화 실패: {e}")
            self.s3_client = None
            self.bucket_name = settings.S3_BUCKET_NAME

    def generate_s3_key(self, filename: str, user_id: str) -> str:
        """
        S3 키 생성 (파일 경로)
        
        Args:
            filename: 원본 파일명
            user_id: 사용자 ID
            
        Returns:
            S3 키 (예: uploads/2024/12/user123/uuid-filename.jpg)
        """
        now = datetime.utcnow()
        file_extension = filename.split('.')[-1] if '.' in filename else ''
        unique_filename = f"{uuid.uuid4()}.{file_extension}" if file_extension else str(uuid.uuid4())
        
        s3_key = f"uploads/{now.year}/{now.month:02d}/{user_id}/{unique_filename}"
        return s3_key

    def generate_thumbnail_key(self, s3_key: str) -> str:
        """
        썸네일 S3 키 생성
        
        Args:
            s3_key: 원본 파일 S3 키
            
        Returns:
            썸네일 S3 키
        """
        # uploads/2024/12/user123/uuid.jpg -> thumbnails/2024/12/user123/uuid_thumb.jpg
        path_parts = s3_key.split('/')
        filename = path_parts[-1]
        name, ext = filename.rsplit('.', 1) if '.' in filename else (filename, '')
        
        thumbnail_filename = f"{name}_thumb.{ext}" if ext else f"{name}_thumb"
        thumbnail_key = f"thumbnails/{'/'.join(path_parts[1:-1])}/{thumbnail_filename}"
        
        return thumbnail_key

    async def generate_presigned_upload_url(
        self,
        filename: str,
        content_type: str,
        user_id: str,
        expires_in: int = 3600
    ) -> Dict[str, Any]:
        """
        파일 업로드용 Presigned URL 생성
        
        Args:
            filename: 업로드할 파일명
            content_type: 파일 MIME 타입
            user_id: 사용자 ID
            expires_in: URL 만료 시간 (초)
            
        Returns:
            업로드 URL 정보 딕셔너리
        """
        try:
            s3_key = self.generate_s3_key(filename, user_id)
            
            if not self.s3_client:
                # 개발 환경에서 더미 URL 반환
                return {
                    "upload_url": f"https://{self.bucket_name}.s3.amazonaws.com/{s3_key}?mock=true",
                    "s3_key": s3_key,
                    "expires_in": expires_in,
                    "fields": {},
                    "is_mock": True
                }
            
            # Presigned POST URL 생성 (더 안전함)
            response = self.s3_client.generate_presigned_post(
                Bucket=self.bucket_name,
                Key=s3_key,
                Fields={
                    "Content-Type": content_type,
                    "x-amz-meta-user-id": user_id,
                    "x-amz-meta-original-filename": filename
                },
                Conditions=[
                    {"Content-Type": content_type},
                    {"x-amz-meta-user-id": user_id},
                    {"x-amz-meta-original-filename": filename},
                    ["content-length-range", 1, 100 * 1024 * 1024]  # 1B ~ 100MB
                ],
                ExpiresIn=expires_in
            )
            
            logger.info(f"Presigned URL 생성: {filename} -> {s3_key}")
            
            return {
                "upload_url": response["url"],
                "s3_key": s3_key,
                "expires_in": expires_in,
                "fields": response["fields"],
                "is_mock": False
            }
            
        except ClientError as e:
            logger.error(f"S3 Presigned URL 생성 실패: {e}")
            raise Exception(f"업로드 URL 생성 실패: {str(e)}")
        except Exception as e:
            logger.error(f"예상치 못한 오류: {e}")
            raise Exception(f"업로드 URL 생성 중 오류: {str(e)}")

    async def generate_presigned_download_url(
        self,
        s3_key: str,
        expires_in: int = 3600
    ) -> str:
        """
        파일 다운로드용 Presigned URL 생성
        
        Args:
            s3_key: S3 파일 키
            expires_in: URL 만료 시간 (초)
            
        Returns:
            다운로드 URL
        """
        try:
            if not self.s3_client:
                # 개발 환경에서 더미 URL 반환
                return f"https://{self.bucket_name}.s3.amazonaws.com/{s3_key}?mock=true"
            
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': s3_key},
                ExpiresIn=expires_in
            )
            
            return url
            
        except ClientError as e:
            logger.error(f"S3 다운로드 URL 생성 실패: {e}")
            raise Exception(f"다운로드 URL 생성 실패: {str(e)}")

    async def delete_file(self, s3_key: str) -> bool:
        """
        S3에서 파일 삭제
        
        Args:
            s3_key: 삭제할 파일의 S3 키
            
        Returns:
            삭제 성공 여부
        """
        try:
            if not self.s3_client:
                logger.info(f"개발 모드: 파일 삭제 시뮬레이션 - {s3_key}")
                return True
            
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=s3_key)
            logger.info(f"S3 파일 삭제 완료: {s3_key}")
            return True
            
        except ClientError as e:
            logger.error(f"S3 파일 삭제 실패: {e}")
            return False

    async def copy_file(self, source_key: str, dest_key: str) -> bool:
        """
        S3 내에서 파일 복사
        
        Args:
            source_key: 원본 파일 키
            dest_key: 대상 파일 키
            
        Returns:
            복사 성공 여부
        """
        try:
            if not self.s3_client:
                logger.info(f"개발 모드: 파일 복사 시뮬레이션 - {source_key} -> {dest_key}")
                return True
            
            copy_source = {'Bucket': self.bucket_name, 'Key': source_key}
            self.s3_client.copy_object(
                CopySource=copy_source,
                Bucket=self.bucket_name,
                Key=dest_key
            )
            
            logger.info(f"S3 파일 복사 완료: {source_key} -> {dest_key}")
            return True
            
        except ClientError as e:
            logger.error(f"S3 파일 복사 실패: {e}")
            return False

    def get_file_info(self, s3_key: str) -> Optional[Dict[str, Any]]:
        """
        S3 파일 정보 조회
        
        Args:
            s3_key: 파일 S3 키
            
        Returns:
            파일 정보 딕셔너리 또는 None
        """
        try:
            if not self.s3_client:
                # 개발 환경에서 더미 정보 반환
                return {
                    "size": 1024000,
                    "last_modified": datetime.utcnow(),
                    "content_type": "application/octet-stream",
                    "is_mock": True
                }
            
            response = self.s3_client.head_object(Bucket=self.bucket_name, Key=s3_key)
            
            return {
                "size": response.get("ContentLength", 0),
                "last_modified": response.get("LastModified"),
                "content_type": response.get("ContentType", "application/octet-stream"),
                "metadata": response.get("Metadata", {}),
                "is_mock": False
            }
            
        except ClientError as e:
            logger.error(f"S3 파일 정보 조회 실패: {e}")
            return None

    def is_image_file(self, content_type: str) -> bool:
        """이미지 파일 여부 확인"""
        return content_type.startswith('image/')

    def is_video_file(self, content_type: str) -> bool:
        """비디오 파일 여부 확인"""
        return content_type.startswith('video/')

    def needs_thumbnail(self, content_type: str) -> bool:
        """썸네일 생성이 필요한 파일 타입인지 확인"""
        return self.is_image_file(content_type) or self.is_video_file(content_type)


# 전역 S3 서비스 인스턴스
s3_service = S3Service()
