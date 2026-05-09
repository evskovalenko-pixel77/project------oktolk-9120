import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src', 'auth'))
from src.auth.main import app

@app.get("/")
def root():
    return {"status": "ok", "app": "OkTolk API", "docs": "/docs"}
