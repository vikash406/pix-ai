from rembg import remove
from PIL import Image
import io

async def remove_bg(file):
    img = Image.open(file.file)
    output = remove(img)

    buf = io.BytesIO()
    output.save(buf, format="PNG")
    buf.seek(0)

    return buf