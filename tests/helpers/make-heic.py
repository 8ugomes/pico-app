"""Creates an original HEVC-encoded fixture, not a renamed JPEG or personal photo."""
from pathlib import Path
from PIL import Image, ImageDraw
from pillow_heif import register_heif_opener
register_heif_opener()
p = Path('.vercel'); p.mkdir(exist_ok=True)
image = Image.new('RGB', (640, 480), (23, 35, 55))
draw = ImageDraw.Draw(image)
draw.rectangle((0, 0, 319, 239), fill=(210, 60, 40))
draw.rectangle((320, 240, 639, 479), fill=(40, 190, 140))
draw.ellipse((220, 140, 420, 340), fill=(230, 230, 220))
image.save(p / 'heic-fixture.heic', quality=80)
assert Image.open(p / 'heic-fixture.heic').size == (640, 480)
