from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from services.rembg_service import remove_bg

router = APIRouter()

@router.post("/")
async def removebg(file: UploadFile = File(...)):
    try:
        buf = await remove_bg(file)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    return StreamingResponse(buf, media_type="image/png")