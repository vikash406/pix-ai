from PIL import Image, ImageEnhance
import io

async def enhance_image(file):
    img = Image.open(file.file)

    # Basic enhancement (mobile fast)
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(1.3)

    enhancer = ImageEnhance.Brightness(img)
    img = enhancer.enhance(1.1)

    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=95)
    buf.seek(0)

    return buf