"# Library Management System

FastAPI 기반의 도서관 관리 시스템 백엔드입니다.

## 주요 기능

- 사용자 관리 (User Management)
- 도서 아이템 관리 (Library Items Management)
- 파일 업로드 (AWS S3 연동)
- RESTful API 제공

## 기술 스택

- **Backend**: FastAPI, SQLAlchemy, PostgreSQL
- **Cloud**: AWS S3 (파일 저장)
- **Database**: PostgreSQL
- **Migration**: Alembic

## 설치 및 실행

### 1. 가상환경 생성 및 활성화
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### 2. 의존성 설치
```bash
pip install -r requirements.txt
```

### 3. 환경 변수 설정
```bash
cp .env.example .env
# .env 파일을 편집하여 실제 값으로 수정
```

### 4. 데이터베이스 설정

#### 방법 1: Alembic 마이그레이션 (권장)
```bash
alembic upgrade head
```

#### 방법 2: 직접 테이블 생성
```bash
python create_tables.py
```

### 5. 서버 실행
```bash
python run_server.py
```

## API 문서

서버 실행 후 다음 URL에서 API 문서를 확인할 수 있습니다:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 프로젝트 구조

```
app/
├── api/           # API 라우터
│   └── v1/        # API v1 엔드포인트
├── core/          # 핵심 설정
├── crud/          # 데이터베이스 CRUD 작업
├── database/      # 데이터베이스 설정
├── models/        # SQLAlchemy 모델
├── schemas/       # Pydantic 스키마
└── services/      # 비즈니스 로직
```

## 개발 도구

### 테스트 실행
```bash
python test_setup.py
```

### 시드 데이터 생성
```bash
python scripts/seed_library_items.py
```

### 코드 포맷팅
```bash
black .
isort .
```

## 환경 변수

주요 환경 변수들:

```bash
# 서버 설정
DEBUG=true
HOST=0.0.0.0
PORT=8000

# 데이터베이스
DATABASE_URL=postgresql+asyncpg://username:password@host:port/database

# AWS S3
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=your_bucket_name

# JWT 인증
JWT_SECRET_KEY=your_secret_key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## 배포

이 프로젝트는 Git을 통해 배포할 수 있도록 구성되어 있습니다.

```bash
git add .
git commit -m "Update backend implementation"
git push origin main
```"
