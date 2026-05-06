from rembg import remove, new_session
from PIL import Image
import io

# Create a lightweight session
session = new_session(model_name='u2netp')

async def remove_bg(file):
    try:
        img = Image.open(file.file)
        output = remove(img, session=session)
    except Exception as exc:
        raise RuntimeError(
            "Background removal failed. The rembg model may still be downloading or network access is unavailable. "
            "Try running the backend without the global reload watcher and ensure the u2net model can download."
        ) from exc

    buf = io.BytesIO()
    output.save(buf, format="PNG")
    buf.seek(0)

    return buf