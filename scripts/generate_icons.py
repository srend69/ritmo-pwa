#!/usr/bin/env python3
"""Generate the Ritmo app icons (no external assets required)."""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

BASE = 512
SS = 4  # supersampling for clean anti-aliased edges
SIZE = BASE * SS
OUT = Path(__file__).resolve().parent.parent / "assets" / "icons"
OUT.mkdir(parents=True, exist_ok=True)


def lerp(a: int, b: int, t: float) -> int:
    return round(a + (b - a) * t)


def gradient(size: int) -> Image.Image:
    small = Image.new("RGB", (BASE, BASE))
    pixels = small.load()
    top_left = (116, 96, 244)
    bottom_right = (64, 45, 190)
    for y in range(BASE):
        for x in range(BASE):
            t = (x * 0.72 + y * 0.28) / (BASE - 1)
            pixels[x, y] = (
                lerp(top_left[0], bottom_right[0], t),
                lerp(top_left[1], bottom_right[1], t),
                lerp(top_left[2], bottom_right[2], t),
            )
    return small.resize((size, size), Image.Resampling.BICUBIC)


def build_icon(content_scale: float = 1.0) -> Image.Image:
    img = gradient(SIZE).convert("RGBA")

    # Soft mint glow in the upper right.
    glow = Image.new("RGBA", (BASE, BASE), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    gdraw.ellipse((285, -155, 690, 250), fill=(52, 211, 153, 78))
    glow = glow.filter(ImageFilter.GaussianBlur(78)).resize(
        (SIZE, SIZE), Image.Resampling.BICUBIC
    )
    img = Image.alpha_composite(img, glow)

    draw = ImageDraw.Draw(img)
    center = BASE / 2

    def px(value: float) -> int:
        return round(value * SS)

    def tx(value: float) -> float:
        return center + (value - center) * content_scale

    def ty(value: float) -> float:
        return center + (value - center) * content_scale

    def ts(value: float) -> float:
        return value * content_scale

    # Three rounded bars, like a calm rhythm / equalizer.
    bars = [
        (163, 232, 100, 0.74),
        (233, 166, 168, 1.0),
        (303, 198, 132, 0.88),
    ]
    for left, top, height, opacity in bars:
        width = 46
        color = (255, 255, 255, round(255 * opacity))
        draw.rounded_rectangle(
            (
                px(tx(left)),
                px(ty(top)),
                px(tx(left + width)),
                px(ty(top + height)),
            ),
            radius=px(ts(width / 2)),
            fill=color,
        )

    # Mint badge with a check mark.
    badge = (312, 84, 432, 204)
    draw.ellipse(
        tuple(px(v) for v in (tx(badge[0]), ty(badge[1]), tx(badge[2]), ty(badge[3]))),
        fill=(52, 211, 153, 255),
    )
    check = [(340, 144), (364, 168), (404, 121)]
    points = [(px(tx(x)), px(ty(y))) for x, y in check]
    draw.line(
        points,
        fill=(18, 38, 34, 255),
        width=px(ts(16)),
        joint="curve",
    )
    for x, y in points:
        r = px(ts(8))
        draw.ellipse((x - r, y - r, x + r, y + r), fill=(18, 38, 34, 255))

    return img.resize((BASE, BASE), Image.Resampling.LANCZOS)


def save(img: Image.Image, name: str, size: int) -> None:
    resized = img.resize((size, size), Image.Resampling.LANCZOS)
    path = OUT / name
    resized.save(path, optimize=True)
    print(f"wrote {path.relative_to(OUT.parent.parent)} ({size}x{size})")


def main() -> None:
    icon = build_icon()
    maskable = build_icon(content_scale=0.76)
    save(icon, "icon-192.png", 192)
    save(icon, "icon-512.png", 512)
    save(maskable, "maskable-192.png", 192)
    save(maskable, "maskable-512.png", 512)
    save(icon, "apple-touch-icon.png", 180)
    save(icon, "favicon-32.png", 32)
    icon.resize((1024, 1024), Image.Resampling.LANCZOS).save(
        OUT / "icon-1024.png", optimize=True
    )
    print("wrote assets/icons/icon-1024.png (1024x1024)")


if __name__ == "__main__":
    main()
