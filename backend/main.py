import sys
from pathlib import Path

# Ye line bahut important hai Render ke liye
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

from fastapi import FastAPI
from routes.enhance import router as enhance_router
from routes.remove_bg import router as remove_bg_router

app = FastAPI()

app.include_router(enhance_router, prefix="/enhance")
app.include_router(remove_bg_router, prefix="/remove-bg")