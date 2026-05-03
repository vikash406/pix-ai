from fastapi import APIRouter, UploadFile, File
from fastapi.responses import StreamingResponse
from ..services.enhance_service import enhance_image

router = APIRouter()

@router.post("/")
async def enhance(file: UploadFile = File(...)):
    buf = await enhance_image(file)
    return StreamingResponse(buf, media_type="image/jpeg")