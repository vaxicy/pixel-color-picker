from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "store-assets" / "screenshots"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1280, 800

COLORS = {
    "ink": "#332d36",
    "soft": "#716676",
    "pink": "#ff5f9c",
    "mint": "#67d6bd",
    "cream": "#fff0a8",
    "paper": "#fff9fc",
    "panel": "#fffdf7",
    "white": "#ffffff",
    "purple": "#8c6cff",
    "blue": "#75bfe8",
    "green": "#12c96f",
}


def font(size, bold=False, pixel=False):
    candidates = []
    if pixel:
        candidates.append(ROOT / "fonts" / "PressStart2P-Regular.ttf")
    if bold:
        candidates += [
            Path("C:/Windows/Fonts/msyhbd.ttc"),
            Path("C:/Windows/Fonts/simhei.ttf"),
        ]
    candidates += [
        Path("C:/Windows/Fonts/msyh.ttc"),
        Path("C:/Windows/Fonts/simhei.ttf"),
        Path("C:/Windows/Fonts/simsun.ttc"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


F = {
    "h1": font(48, bold=True),
    "h2": font(34, bold=True),
    "h3": font(24, bold=True),
    "body": font(21),
    "small": font(16),
    "tiny": font(13),
    "pixel": font(22, pixel=True),
    "pixel_small": font(12, pixel=True),
}


def rect(draw, xy, fill, outline=COLORS["ink"], width=4):
    draw.rectangle(xy, fill=fill, outline=outline, width=width)


def text(draw, xy, value, fill=COLORS["ink"], f=None, anchor=None):
    draw.text(xy, value, fill=fill, font=f or F["body"], anchor=anchor)


def wrap(draw, value, max_width, f):
    lines = []
    current = ""
    for char in value:
        test = current + char
        if draw.textlength(test, font=f) <= max_width or not current:
            current = test
        else:
            lines.append(current)
            current = char
    if current:
        lines.append(current)
    return lines


def paragraph(draw, xy, value, max_width, f=None, fill=COLORS["soft"], leading=10):
    f = f or F["body"]
    x, y = xy
    for line in wrap(draw, value, max_width, f):
        text(draw, (x, y), line, fill=fill, f=f)
        y += f.size + leading
    return y


def base():
    img = Image.new("RGB", (W, H), COLORS["paper"])
    draw = ImageDraw.Draw(img)
    for x in range(0, W, 24):
        draw.line([(x, 0), (x, H)], fill="#f1e4ec", width=1)
    for y in range(0, H, 24):
        draw.line([(0, y), (W, y)], fill="#f1e4ec", width=1)
    for x in range(12, W, 24):
        for y in range(12, H, 24):
            draw.rectangle((x, y, x + 2, y + 2), fill="#ffd9ea")
    return img, draw


def hero(draw, title, subtitle):
    rect(draw, (56, 52, 1224, 184), COLORS["pink"], width=5)
    text(draw, (94, 87), title, fill="white", f=F["h1"])
    text(draw, (96, 146), subtitle, fill="white", f=F["body"])


def popup_mock(draw, x, y, scale=1):
    w, h = int(360 * scale), int(520 * scale)
    rect(draw, (x + 8, y + 8, x + w + 8, y + h + 8), "#d8d1d8", outline="#d8d1d8", width=0)
    rect(draw, (x, y, x + w, y + h), COLORS["white"], width=5)
    rect(draw, (x + 14, y + 14, x + w - 18, y + 80), COLORS["pink"], width=4)
    text(draw, (x + 38, y + 28), "PIXEL TOOL", fill="white", f=F["pixel_small"])
    text(draw, (x + 38, y + 48), "像素吸色器", fill="white", f=font(17, bold=True))
    rect(draw, (x + 28, y + 100, x + w - 28, y + 154), COLORS["mint"], width=4)
    text(draw, (x + w // 2, y + 117), "快速取色", f=font(20, bold=True), anchor="ma")
    text(draw, (x + 28, y + 186), "我的色卡组", f=font(20, bold=True))
    swatches = ["#ff6b9d", "#8c6cff", "#69d9bf", "#fff0a8", "#75bfe8", "#f05f7d"]
    for i in range(3):
        yy = y + 222 + i * 78
        rect(draw, (x + 28, yy, x + w - 28, yy + 56), COLORS["panel"], width=3)
        for j in range(4):
            color = swatches[(i + j) % len(swatches)]
            draw.rectangle((x + 46 + j * 22, yy + 14, x + 66 + j * 22, yy + 38), fill=color, outline=COLORS["ink"], width=2)
        text(draw, (x + 150, yy + 12), ["默认色卡", "品牌灵感", "网页主题"][i], f=font(16, bold=True))
        text(draw, (x + 150, yy + 34), f"{4 + i}/20 色", fill=COLORS["soft"], f=F["small"])
    rect(draw, (x + 28, y + h - 82, x + w - 28, y + h - 28), COLORS["cream"], width=3)
    text(draw, (x + w // 2, y + h - 66), "历史  ·  设置  ·  Pro", f=F["small"], anchor="ma")


def palette_board(draw, x, y, w, h):
    rect(draw, (x, y, x + w, y + h), COLORS["white"], width=5)
    text(draw, (x + 32, y + 30), "默认色卡", f=F["h3"])
    text(draw, (x + 32, y + 65), "12 个颜色 · 支持备注、搜索、排序", fill=COLORS["soft"], f=F["body"])
    colors = ["#ff6b9d", "#8c6cff", "#69d9bf", "#fff0a8", "#75bfe8", "#f05f7d", "#b58af0", "#6f8f55", "#f6c65b", "#c7834f", "#76d9bd", "#d7a4b8"]
    cols = 6
    cell = 86
    sx, sy = x + 34, y + 116
    for i, c in enumerate(colors):
        cx = sx + (i % cols) * (cell + 16)
        cy = sy + (i // cols) * (cell + 52)
        rect(draw, (cx, cy, cx + cell, cy + cell), c, width=4)
        text(draw, (cx, cy + cell + 12), c, f=F["tiny"])
        text(draw, (cx, cy + cell + 32), ["主按钮", "标题", "背景", "强调"][i % 4], fill=COLORS["soft"], f=F["tiny"])


def export_card(draw, x, y, label, detail, color):
    rect(draw, (x, y, x + 178, y + 126), COLORS["panel"], width=4)
    rect(draw, (x + 18, y + 18, x + 68, y + 68), color, width=3)
    text(draw, (x + 88, y + 24), label, f=font(18, bold=True))
    paragraph(draw, (x + 88, y + 56), detail, 70, f=F["tiny"], fill=COLORS["soft"], leading=4)


def screenshot_1():
    img, draw = base()
    hero(draw, "Pixel Color Picker", "像素风网页取色、色卡管理和导出工具")
    popup_mock(draw, 82, 230)
    text(draw, (520, 268), "一键吸取网页颜色", f=F["h2"])
    paragraph(draw, (522, 322), "从网页中快速获取颜色，自动保存到色卡和历史记录。适合设计师、前端开发者和内容创作者整理灵感配色。", 610, f=F["body"])
    rect(draw, (520, 452, 1138, 532), COLORS["panel"], width=4)
    text(draw, (548, 480), "HEX", f=font(24, pixel=True))
    text(draw, (630, 476), "#FF6B9D", f=font(28, bold=True))
    rect(draw, (548, 586, 748, 654), COLORS["mint"], width=4)
    text(draw, (580, 606), "复制颜色", f=font(22, bold=True))
    rect(draw, (780, 586, 1016, 654), COLORS["cream"], width=4)
    text(draw, (812, 606), "保存到色卡", f=font(22, bold=True))
    img.save(OUT / "screenshot-01-picker.png")


def screenshot_2():
    img, draw = base()
    hero(draw, "Palettes & History", "多色卡、历史记录、备注与搜索")
    palette_board(draw, 74, 234, 710, 486)
    rect(draw, (836, 234, 1190, 720), COLORS["white"], width=5)
    text(draw, (868, 270), "取色历史", f=F["h3"])
    items = [("#ff6b9d", "刚刚 · 主按钮"), ("#69d9bf", "3 分钟前 · 提示色"), ("#8c6cff", "昨天 · 标题"), ("#fff0a8", "昨天 · 高亮")]
    for i, (c, label) in enumerate(items):
        yy = 330 + i * 82
        rect(draw, (868, yy, 1158, yy + 56), COLORS["panel"], width=3)
        draw.rectangle((888, yy + 13, 918, yy + 43), fill=c, outline=COLORS["ink"], width=2)
        text(draw, (940, yy + 10), c, f=F["small"])
        text(draw, (940, yy + 32), label, fill=COLORS["soft"], f=F["tiny"])
    img.save(OUT / "screenshot-02-palettes-history.png")


def screenshot_3():
    img, draw = base()
    hero(draw, "Export For Developers", "CSS、SCSS、JSON、Tailwind 和 PNG 色卡导出")
    text(draw, (82, 242), "把灵感颜色变成可用代码", f=F["h2"])
    paragraph(draw, (84, 300), "一键导出常用格式，方便放进设计系统、前端项目或团队文档。", 560, f=F["body"])
    for i, (label, detail, color) in enumerate([
        ("CSS", "变量格式", "#ff6b9d"),
        ("SCSS", "$ 变量", "#8c6cff"),
        ("JSON", "可再次导入", "#69d9bf"),
        ("Tailwind", "配置片段", "#fff0a8"),
        ("PNG", "色卡图片", "#75bfe8"),
    ]):
        export_card(draw, 84 + i * 222, 430, label, detail, color)
    rect(draw, (740, 230, 1160, 360), "#201c2b", outline=COLORS["ink"], width=5)
    text(draw, (770, 258), ":root {", fill="#f8edf7", f=F["body"])
    text(draw, (798, 290), "--primary: #FF6B9D;", fill="#69d9bf", f=F["small"])
    text(draw, (798, 318), "--accent:  #8C6CFF;", fill="#fff0a8", f=F["small"])
    img.save(OUT / "screenshot-03-export.png")


def screenshot_4():
    img, draw = base()
    hero(draw, "Pixel Pro", "免费可用，Pro 解锁更多主题和无限色卡")
    rect(draw, (80, 240, 580, 650), COLORS["white"], width=5)
    text(draw, (116, 282), "免费版", f=F["h2"])
    paragraph(draw, (120, 340), "基础取色、历史记录、导出功能和最多 5 个色卡。", 390, f=F["body"])
    rect(draw, (120, 506, 432, 574), COLORS["cream"], width=4)
    text(draw, (154, 526), "适合先体验", f=font(22, bold=True))
    rect(draw, (700, 240, 1200, 650), COLORS["white"], width=5)
    text(draw, (736, 282), "Pro 版", f=F["h2"])
    paragraph(draw, (740, 340), "解锁无限色卡、Pro 主题、自定义主题和后续高级工具。提供 14 天免费试用，支持 PayPal 付款，付款后用邮箱在扩展内解锁。", 390, f=F["body"])
    rect(draw, (740, 506, 1060, 574), COLORS["mint"], width=4)
    text(draw, (770, 526), "14 天免费试用", f=font(22, bold=True))
    img.save(OUT / "screenshot-04-pro.png")


def screenshot_5():
    img, draw = base()
    hero(draw, "Themes & Languages", "中英文界面、多套像素主题、可自定义颜色")
    rect(draw, (82, 238, 1198, 690), COLORS["white"], width=5)
    text(draw, (124, 286), "主题预设", f=F["h2"])
    names = ["莓果像素", "森绿软糖", "月夜霓虹", "海盐气泡", "绿屏掌机", "雾粉灰调"]
    cols = ["#ff6b9d", "#70c59b", "#6f5bd8", "#75bfe8", "#6f8f55", "#c78ca0"]
    for i, (name, color) in enumerate(zip(names, cols)):
        x = 124 + (i % 3) * 330
        y = 370 + (i // 3) * 116
        rect(draw, (x, y, x + 280, y + 78), COLORS["panel"], width=3)
        draw.rectangle((x + 18, y + 18, x + 58, y + 58), fill=color, outline=COLORS["ink"], width=3)
        text(draw, (x + 78, y + 18), name, f=font(18, bold=True))
        text(draw, (x + 78, y + 44), "Theme preset", fill=COLORS["soft"], f=F["tiny"])
    rect(draw, (882, 286, 1128, 338), COLORS["cream"], width=3)
    text(draw, (912, 300), "简体中文 / English", f=F["small"])
    img.save(OUT / "screenshot-05-themes-language.png")


if __name__ == "__main__":
    screenshot_1()
    screenshot_2()
    screenshot_3()
    screenshot_4()
    screenshot_5()
    print(f"Generated screenshots in {OUT}")
