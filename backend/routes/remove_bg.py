from fastapi import APIRouter, UploadFile, File
from fastapi.responses import StreamingResponse
from ..services.rembg_service import remove_bg

router = APIRouter()

@router.post("/")
async def removebg(file: UploadFile = File(...)):
    buf = await remove_bg(file)
    return StreamingResponse(buf, media_type="image/png")