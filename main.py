from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from . import models

# FastAPI 앱 생성
app = FastAPI()

# DB 연결 세션 생성
def get_db():
    db = models.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# FastAPI 엔드포인트 예시
@app.get("/")
def read_root(db: Session = Depends(get_db)):
    return {"message": "Hello World!"} 