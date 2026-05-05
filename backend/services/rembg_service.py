from rembg import remove
from PIL import Image
import io

async def remove_bg(file):
    try:
        img = Image.open(file.file)
        output = remove(img)
    except Exception as exc:
        raise RuntimeError(
            "Background removal failed. The rembg model may still be downloading or network access is unavailable. "
            "Try running the backend without the global reload watcher and ensure the u2net model can download."
        ) from exc

    buf = io.BytesIO()
    output.save(buf, format="PNG")
    buf.seek(0)

    return buf