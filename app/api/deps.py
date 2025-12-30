# 📁 새로 생성된 파일: app/api/deps.py
# API 의존성 함수들

from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from jose import JWTError, jwt
from app.database.base import get_async_session
from app.core.config import settings
from app.crud.user import user_crud
from app.models.user import User
import logging

logger = logging.getLogger(__name__)

# JWT 토큰 스키마 (토큰 없을 때 403 대신 None 반환)
security = HTTPBearer(auto_error=False)


async def get_db() -> AsyncSession:
    """
    데이터베이스 세션 의존성
    - FastAPI 엔드포인트에서 사용
    """
    async for session in get_async_session():
        yield session


async def get_current_user_optional(
    db: AsyncSession = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[User]:
    """
    현재 사용자 조회 (선택적)
    - 토큰이 없어도 None 반환 (에러 발생 안함)
    
    Args:
        db: 데이터베이스 세션
        credentials: JWT 토큰 인증 정보
        
    Returns:
        현재 사용자 또는 None
    """
    if not credentials:
        return None
    
    try:
        # JWT 토큰 디코딩
        payload = jwt.decode(
            credentials.credentials,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        # Cognito User ID 추출
        cognito_user_id: str = payload.get("sub")
        if not cognito_user_id:
            return None
        
        # 사용자 조회
        user = await user_crud.get_by_username(db, username=cognito_user_id)
        return user
        
    except JWTError as e:
        logger.warning(f"JWT 토큰 검증 실패: {e}")
        return None
    except Exception as e:
        logger.error(f"사용자 인증 중 오류: {e}")
        return None


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """
    현재 사용자 조회 (필수)
    - 토큰이 없거나 유효하지 않으면 401 에러 발생
    
    Args:
        db: 데이터베이스 세션
        credentials: JWT 토큰 인증 정보
        
    Returns:
        현재 사용자
        
    Raises:
        HTTPException: 인증 실패 시 401 에러
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="인증 정보가 유효하지 않습니다",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        if not credentials:
            raise credentials_exception

        # JWT 토큰 디코딩
        payload = jwt.decode(
            credentials.credentials,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        # Cognito User ID 추출
        cognito_user_id: str = payload.get("sub")
        if not cognito_user_id:
            raise credentials_exception
        
        # 사용자 조회
        user = await user_crud.get_by_username(db, username=cognito_user_id)
        if not user:
            raise credentials_exception
        
        return user
        
    except JWTError:
        raise credentials_exception
    except Exception as e:
        logger.error(f"사용자 인증 중 오류: {e}")
        raise credentials_exception


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """
    현재 활성 사용자 조회
    - 추후 사용자 상태 확인 로직 추가 가능
    
    Args:
        current_user: 현재 사용자
        
    Returns:
        현재 활성 사용자
        
    Raises:
        HTTPException: 비활성 사용자인 경우 400 에러
    """
    # 추후 사용자 활성 상태 확인 로직 추가 가능
    # if not current_user.is_active:
    #     raise HTTPException(status_code=400, detail="비활성 사용자입니다")
    
    return current_user


def verify_cognito_token(token: str) -> dict:
    """
    AWS Cognito JWT 토큰 검증
    - 실제 운영 환경에서는 Cognito 공개 키로 검증해야 함
    
    Args:
        token: JWT 토큰
        
    Returns:
        토큰 페이로드
        
    Raises:
        JWTError: 토큰 검증 실패
    """
    try:
        # 개발 환경에서는 간단한 JWT 검증
        # 운영 환경에서는 Cognito 공개 키 사용 필요
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError as e:
        logger.error(f"Cognito 토큰 검증 실패: {e}")
        raise


async def check_item_ownership(
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> bool:
    """
    라이브러리 아이템 소유권 확인
    
    Args:
        item_id: 아이템 ID
        current_user: 현재 사용자
        db: 데이터베이스 세션
        
    Returns:
        소유권 여부
        
    Raises:
        HTTPException: 아이템이 없거나 소유권이 없는 경우 403/404 에러
    """
    from app.crud.library_item import library_item_crud
    
    item = await library_item_crud.get(db, id=item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="아이템을 찾을 수 없습니다"
        )
    
    if str(item.user_profile_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="이 아이템에 대한 권한이 없습니다"
        )
    
    return True


class CommonQueryParams:
    """
    공통 쿼리 파라미터 클래스
    - 페이지네이션 및 정렬 파라미터
    """
    def __init__(
        self,
        skip: int = 0,
        limit: int = 20,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ):
        self.skip = skip
        self.limit = min(limit, 100)  # 최대 100개로 제한
        self.sort_by = sort_by
        self.sort_order = sort_order


def common_parameters(
    skip: int = 0,
    limit: int = 20,
    sort_by: str = "created_at",
    sort_order: str = "desc"
) -> CommonQueryParams:
    """
    공통 쿼리 파라미터 의존성
    
    Args:
        skip: 건너뛸 레코드 수
        limit: 최대 조회 레코드 수
        sort_by: 정렬 기준 필드
        sort_order: 정렬 순서 (asc/desc)
        
    Returns:
        공통 쿼리 파라미터 객체
    """
    return CommonQueryParams(skip, limit, sort_by, sort_order)
