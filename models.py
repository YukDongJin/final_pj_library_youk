from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# SQLAlchemy 설정 
Base = declarative_base()

# 데이터베이스 연결 설정 (PostgreSQL 예시)
DATABASE_URL = "postgresql+asyncpg://username:password@localhost/dbname"

# 엔진 생성
engine = create_engine(DATABASE_URL, echo=True)

# 세션 생성
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 테이블 모델 정의 예시
class User(Base):
    tablename = 'users'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)