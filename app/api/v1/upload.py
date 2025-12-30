# 📁 새로 생성된 파일: app/api/v1/upload.py
# 실제 S3 파일 업로드 API

from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db, get_current_active_user, get_current_user_optional
from app.core.config import settings
from app.services.s3_service import s3_service
from app.services.file_service import file_service
from app.schemas.library_item import PresignedUrlRequest, PresignedUrlResponse
from app.schemas.common import SuccessResponse
from app.models.user import User
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/presigned-url",
    response_model=SuccessResponse[PresignedUrlResponse],
    summary="S3 업로드용 Presigned URL 생성 (실제 S3)",
    description="실제 AWS S3에 파일을 업로드하기 위한 Presigned URL을 생성합니다."
)
async def generate_real_presigned_url(
    *,
    request: PresignedUrlRequest,
    current_user: Optional[User] = Depends(get_current_user_optional)
) -> SuccessResponse[PresignedUrlResponse]:
    """
    실제 S3 Presigned URL 생성 API
    - AWS S3 클라이언트를 사용하여 실제 업로드 URL 생성
    """
    try:
        # 업로드 요청 검증
        valid, error_msg, file_info = file_service.validate_upload_request(
            filename=request.filename,
            content_type=request.content_type,
            file_size=request.file_size
        )
        
        if not valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg
            )
        
        # 실제 S3 Presigned URL 생성
        if not current_user:
            if not settings.DEBUG:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="??? ?????",
                )
            user_id = "test-user"
            username = "test-user"
        else:
            user_id = str(current_user.id)
            username = current_user.username

        upload_info = await s3_service.generate_presigned_upload_url(
            filename=request.filename,
            content_type=request.content_type,
            user_id=user_id
        )
        
        logger.info(f"실제 S3 Presigned URL 생성: {request.filename} (사용자: {username})")
        
        return SuccessResponse(
            data=PresignedUrlResponse(
                upload_url=upload_info["upload_url"],
                s3_key=upload_info["s3_key"],
                expires_in=upload_info["expires_in"],
                fields=upload_info.get("fields", {}),
                file_info=file_info
            ),
            message="실제 S3 업로드 URL이 성공적으로 생성되었습니다"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"S3 Presigned URL 생성 중 오류: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="업로드 URL 생성 중 오류가 발생했습니다"
        )


@router.get(
    "/download/{item_id}",
    response_model=SuccessResponse[Dict[str, str]],
    summary="S3 파일 다운로드 URL 생성",
    description="S3에 저장된 파일의 다운로드 URL을 생성합니다."
)
async def generate_download_url(
    item_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> SuccessResponse[Dict[str, str]]:
    """
    S3 파일 다운로드 URL 생성 API
    """
    try:
        from app.crud.library_item import library_item_crud
        
        # 아이템 조회 및 권한 확인
        item = await library_item_crud.get(db, id=item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="파일을 찾을 수 없습니다"
            )
        
        # 소유자이거나 공개 파일인지 확인
        is_owner = str(item.user_profile_id) == str(current_user.id)
        is_public = item.visibility == "public"
        
        if not (is_owner or is_public):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="이 파일에 대한 접근 권한이 없습니다"
            )
        
        # S3 다운로드 URL 생성
        download_url = await s3_service.generate_presigned_download_url(
            s3_key=item.s3_key,
            expires_in=3600  # 1시간
        )
        
        # 썸네일 URL도 함께 생성 (있는 경우)
        thumbnail_url = None
        if item.s3_thumbnail_key:
            thumbnail_url = await s3_service.generate_presigned_download_url(
                s3_key=item.s3_thumbnail_key,
                expires_in=3600
            )
        
        logger.info(f"다운로드 URL 생성: {item.name} (사용자: {current_user.username})")
        
        result = {
            "download_url": download_url,
            "filename": item.original_filename,
            "file_size": str(item.file_size)
        }
        
        if thumbnail_url:
            result["thumbnail_url"] = thumbnail_url
        
        return SuccessResponse(
            data=result,
            message="다운로드 URL이 성공적으로 생성되었습니다"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"다운로드 URL 생성 중 오류: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="다운로드 URL 생성 중 오류가 발생했습니다"
        )
