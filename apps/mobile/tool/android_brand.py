"""Android identity assets derived from the canonical Q and palette, no downloads."""
import io

from PIL import Image, ImageDraw


def generate_android_brand(mobile, tokens, symbol):
    colors = tokens["colors"]
    res = mobile / "android/app/src/main/res"
    output = {}
    for density, size in {"mdpi": 48, "hdpi": 72, "xhdpi": 96,
                          "xxhdpi": 144, "xxxhdpi": 192}.items():
        scale = size * 4 / 100
        image = Image.new("RGB", (size * 4, size * 4), colors["laserBlue"])
        draw = ImageDraw.Draw(image)
        def p(value):
            return (20 + value * .6) * scale
        width = round(12 * .6 * scale)
        # Pillow strokes sit inside the ellipse; use an outer bounding box.
        draw.ellipse((p(10), p(6), p(90), p(86)),
                     outline=colors["white"], width=width)
        draw.line((p(62), p(66), p(86), p(88)), fill=colors["white"], width=width)
        for x, y in [(62, 66), (86, 88)]:
            r = width / 2
            draw.ellipse((p(x) - r, p(y) - r, p(x) + r, p(y) + r), fill=colors["white"])
        stream = io.BytesIO()
        image.resize((size, size), Image.Resampling.LANCZOS).save(stream, format="PNG")
        output[res / f"mipmap-{density}/ic_launcher.png"] = stream.getvalue()
    def xml(path, value):
        output[res / path] = (value + "\n").encode()
    xml("drawable/ic_quantify_foreground.xml", f'''<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp" android:height="108dp" android:viewportWidth="108" android:viewportHeight="108">
    <group android:scaleX="0.6" android:scaleY="0.6" android:translateX="24" android:translateY="24">
        <path android:pathData="{symbol}" android:fillColor="@android:color/transparent"
            android:strokeColor="{colors['white']}" android:strokeWidth="12" android:strokeLineCap="round" />
    </group>
</vector>''')
    # Android 12 masks the system splash icon; keep the Q within its safe circle.
    xml("drawable/quantify_splash_system.xml", f'''<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="288dp" android:height="288dp" android:viewportWidth="150" android:viewportHeight="150">
    <group android:translateX="25" android:translateY="25">
        <path android:pathData="{symbol}" android:fillColor="@android:color/transparent"
            android:strokeColor="@color/quantify_mark" android:strokeWidth="12" android:strokeLineCap="round" />
    </group>
</vector>''')
    xml("drawable/quantify_splash.xml", f'''<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="112dp" android:height="112dp" android:viewportWidth="100" android:viewportHeight="100">
    <path android:pathData="{symbol}" android:fillColor="@android:color/transparent"
        android:strokeColor="@color/quantify_mark" android:strokeWidth="12" android:strokeLineCap="round" />
</vector>''')
    xml("mipmap-anydpi-v26/ic_launcher.xml", '''<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/quantify_brand" />
    <foreground android:drawable="@drawable/ic_quantify_foreground" />
</adaptive-icon>''')
    for theme, folder in [("light", "values"), ("dark", "values-night")]:
        roles = tokens["themes"][theme]
        xml(f"{folder}/brand_colors.xml", f'''<resources>
    <color name="quantify_brand">{colors['laserBlue']}</color>
    <color name="quantify_launch_background">{colors[roles['canvas']]}</color>
    <color name="quantify_mark">{colors[roles['icon']]}</color>
</resources>''')
    return output
