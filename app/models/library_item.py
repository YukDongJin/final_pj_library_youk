# 📁 새로 생성된 파일: app/models/library_item.py
# 라이브러리 아이템 테이블 SQLAlchemy 모델

from sqlalchemy import Column, String, DateTime, Text, BigInteger, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.models_config import Base
from app.core.config import settings
import uuid
import enum


class ItemType(enum.Enum):
    """라이브러리 아이템 타입 열거형"""
    image = "image"
    document = "document" 
    file = "file"
    video = "video"


class VisibilityType(enum.Enum):
    """아이템 공개 범위 열거형"""
    public = "public"
    private = "private"


class LibraryItem(Base):
    """
    라이브러리 아이템 테이블 모델
    - 사용자가 제공한 테이블 구조를 정확히 반영
    - library_items 테이블: id(uuid), user_profile_id(FK), name(text), type(enum), 
      mime_type(varchar), visibility(enum), s3_thumbnail_key(varchar), s3_key(varchar), 
      file_size(bigint), preview_text(text), original_filename(varchar), 
      created_at, updated_at, deleted_at
    """
    __tablename__ = "library_items"

    # Primary Key: UUID 타입
    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        comment="라이브러리 아이템 고유 ID (UUID)"
    )
    
    # Foreign Key: 사용자 ID 참조
    # 사용자 이미지에서 'user_profile_id'로 표시됨
    user_profile_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        comment="소유자 사용자 ID (users 테이블 참조)"
    )
    
    # 아이템 이름 (사용자가 지정한 표시명)
    name = Column(
        Text, 
        nullable=False,
        comment="사용자가 지정한 아이템 표시명"
    )
    
    # 아이템 타입 (이미지, 문서, 파일, 비디오)
    type = Column(
        Enum(ItemType),
        nullable=False,
        comment="아이템 타입 (image, document, file, video)"
    )
    
    # MIME 타입
    mime_type = Column(
        String(255),
        nullable=False,
        comment="파일의 MIME 타입 (예: image/jpeg, application/pdf)"
    )
    
    # 공개 범위
    visibility = Column(
        Enum(VisibilityType),
        nullable=False,
        default=VisibilityType.private,
        comment="아이템 공개 범위 (public, private)"
    )
    
    # S3 썸네일 키 (이미지/비디오만 해당)
    s3_thumbnail_key = Column(
        String(500),
        nullable=True,
        comment="S3 썸네일 파일 키 (이미지/비디오만)"
    )
    
    # S3 원본 파일 키
    s3_key = Column(
        String(500),
        nullable=False,
        comment="S3 원본 파일 키"
    )
    
    # 파일 크기 (바이트)
    file_size = Column(
        BigInteger,
        nullable=False,
        comment="파일 크기 (bytes)"
    )
    
    # 미리보기 텍스트 (문서 파일용)
    preview_text = Column(
        Text,
        nullable=True,
        comment="문서 파일의 미리보기 텍스트"
    )
    
    # 원본 파일명
    original_filename = Column(
        String(255),
        nullable=False,
        comment="업로드 시 원본 파일명"
    )
    
    # 생성 시간 (자동 설정)
    created_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(),
        nullable=False,
        comment="아이템 생성 시간"
    )
    
    # 수정 시간 (자동 업데이트)
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        comment="마지막 수정 시간"
    )
    
    # 삭제 시간 (소프트 삭제용)
    deleted_at = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="소프트 삭제 시간 (NULL이면 활성 상태)"
    )

    # 관계 설정: 소유자 사용자
    user = relationship(
        "User", 
        back_populates="library_items"
    )

    def __repr__(self):
        return f"<LibraryItem(id={self.id}, name={self.name}, type={self.type.value})>"

    def __str__(self):
        return f"LibraryItem: {self.name} ({self.type.value})"

    @property
    def is_deleted(self):
        """아이템이 삭제되었는지 확인"""
        return self.deleted_at is not None

    @property
    def file_url(self):
        """S3 파일 URL 생성 (실제로는 S3 클라이언트에서 presigned URL 생성)"""
        # 실제 구현에서는 S3 클라이언트를 사용해 presigned URL 생성
        return f"https://{settings.S3_BUCKET_NAME}.s3.{settings.S3_REGION}.amazonaws.com/{self.s3_key}"

    @property
    def thumbnail_url(self):
        """S3 썸네일 URL 생성"""
        if self.s3_thumbnail_key:
            return f"https://{settings.S3_BUCKET_NAME}.s3.{settings.S3_REGION}.amazonaws.com/{self.s3_thumbnail_key}"
        return None

    def soft_delete(self):
        """소프트 삭제 실행"""
        self.deleted_at = func.now()

    def restore(self):
        """소프트 삭제 복원"""
        self.deleted_at = None

    def to_dict(self):
        """
        모델을 딕셔너리로 변환 (API 응답용)
        """
        return {
            "id": str(self.id),
            "user_profile_id": str(self.user_profile_id),
            "name": self.name,
            "type": self.type.value,
            "mime_type": self.mime_type,
            "visibility": self.visibility.value,
            "s3_thumbnail_key": self.s3_thumbnail_key,
            "s3_key": self.s3_key,
            "file_size": self.file_size,
            "preview_text": self.preview_text,
            "original_filename": self.original_filename,
            "file_url": self.file_url,
            "thumbnail_url": self.thumbnail_url,
            "is_deleted": self.is_deleted,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "deleted_at": self.deleted_at.isoformat() if self.deleted_at else None
        }