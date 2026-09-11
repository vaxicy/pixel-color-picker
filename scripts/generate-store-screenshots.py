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

TEXTS = {
    "zh": {
        "s1_hero": "Pixel Color Picker",
        "s2_hero": "色卡与历史",
        "s3_hero": "为开发者导出",
        "s5_hero": "主题与语言",
        "s1_sub": "像素风网页取色、色卡管理和导出工具",
        "s1_head": "一键吸取网页颜色",
        "s1_desc": "从网页中快速获取颜色，自动保存到色卡和历史记录。适合设计师、前端开发和内容创作者整理灵感配色。",
        "copy": "复制颜色",
        "save": "保存到色卡",
        "pop_title": "像素吸色器",
        "quick": "快速取色",
        "my_palettes": "我的色卡组",
        "pal_names": ["默认色卡", "品牌灵感", "网页主题"],
        "colors_unit": "色",
        "pop_bottom": "历史  ·  设置  ·  主题",
        "s2_sub": "多色卡、历史记录、备注与搜索",
        "s2_board": "默认色卡",
        "s2_board_sub": "12 个颜色 · 支持备注、搜索、排序",
        "s2_history": "取色历史",
        "s2_items": ["刚刚 · 主按钮", "3 分钟前 · 提示色", "昨天 · 标题", "昨天 · 高亮"],
        "tags": ["主按钮", "标题", "背景", "强调"],
        "s3_sub": "CSS、SCSS、JSON、Tailwind 和 PNG 色卡导出",
        "s3_head": "把灵感颜色变成可用代码",
        "s3_desc": "一键导出常用格式，方便放进设计系统、前端项目或团队文档。",
        "s3_cards": [("CSS", "变量格式"), ("SCSS", "$ 变量"), ("JSON", "可再次导入"),
                     ("Tailwind", "配置片段"), ("CSV", "表格数据"), ("ASE", "PS 色板")],
        "s4_hero": "永久免费",
        "s4_sub": "无订阅 · 无广告 · 全部功能开放",
        "s4_free_title": "完全免费",
        "s4_free_desc": "已移除全部付费墙：15 套主题、无限色卡、自定义主题和所有导出格式对每位用户开放。",
        "s4_free_cta": "免费使用",
        "s4_high": "亮点功能",
        "s4_feats": [("右键快速取色", "页面右键一键吸色并存卡"),
                     ("多格式导出", "CSS / JSON / PNG / CSV / ASE"),
                     ("历史收藏置顶", "常用颜色一键置顶"),
                     ("中英双语", "15 套像素主题任意切换")],
        "s5_sub": "15 套像素主题、中英双语、可自定义颜色",
        "s5_head": "主题预设",
        "s5_names": ["莓果像素", "苍松翠谷", "冬青红果", "烟熏玫瑰", "海盐气泡", "月夜霓虹"],
        "s5_lang": "简体中文 / English",
    },
    "en": {
        "s1_hero": "Pixel Color Picker",
        "s2_hero": "Palettes & History",
        "s3_hero": "Export For Developers",
        "s5_hero": "Themes & Languages",
        "s1_sub": "Pixel-style color picking, palettes & export",
        "s1_head": "Pick colors from any page",
        "s1_desc": "Grab colors from any webpage and save them to palettes and history automatically. Great for designers, front-end developers and content creators.",
        "copy": "Copy color",
        "save": "Save to palette",
        "pop_title": "Pixel Picker",
        "quick": "Quick pick",
        "my_palettes": "My palettes",
        "pal_names": ["Default", "Brand", "Web theme"],
        "colors_unit": "colors",
        "pop_bottom": "History  ·  Settings  ·  Themes",
        "s2_sub": "Multiple palettes, history, notes & search",
        "s2_board": "Default palette",
        "s2_board_sub": "12 colors · notes, search & sorting",
        "s2_history": "History",
        "s2_items": ["Just now · Primary", "3 min ago · Accent", "Yesterday · Title", "Yesterday · Highlight"],
        "tags": ["Primary", "Title", "Background", "Accent"],
        "s3_sub": "Export to CSS, SCSS, JSON, Tailwind, PNG & more",
        "s3_head": "From picked color to code",
        "s3_desc": "Export in common formats for design systems, front-end projects and team docs.",
        "s3_cards": [("CSS", "CSS variables"), ("SCSS", "$ variables"), ("JSON", "Re-import"),
                     ("Tailwind", "Config snippet"), ("CSV", "CSV table"), ("ASE", "Swatches")],
        "s4_hero": "Free Forever",
        "s4_sub": "No subscription · No ads · All features",
        "s4_free_title": "Completely free",
        "s4_free_desc": "All paywalls removed: 15 themes, unlimited palettes, custom themes and every export format are open to everyone.",
        "s4_free_cta": "Use it free",
        "s4_high": "Highlights",
        "s4_feats": [("Context-menu pick", "Pick & save from the right-click menu"),
                     ("Multi-format export", "CSS / JSON / PNG / CSV / ASE"),
                     ("Pinned favorites", "Pin frequently used colors"),
                     ("Bilingual UI", "15 pixel themes included")],
        "s5_sub": "15 pixel themes, bilingual UI, custom colors",
        "s5_head": "Theme presets",
        "s5_names": ["Berry Pixel", "Pine Valley", "Holly Berry", "Smoked Rose", "Sea Salt Soda", "Neon Night"],
        "s5_lang": "简体中文 / English",
    },
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
            # 优先在最后一个空格处断行，避免拆开英文单词（对中文无影响）
            cut = current.rfind(" ")
            if cut > 0 and len(current) - cut <= 20:
                lines.append(current[:cut])
                current = current[cut + 1:] + char
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


def popup_mock(draw, x, y, t):
    w, h = 360, 520
    rect(draw, (x + 8, y + 8, x + w + 8, y + h + 8), "#d8d1d8", outline="#d8d1d8", width=0)
    rect(draw, (x, y, x + w, y + h), COLORS["white"], width=5)
    rect(draw, (x + 14, y + 14, x + w - 18, y + 80), COLORS["pink"], width=4)
    text(draw, (x + 38, y + 28), "PIXEL TOOL", fill="white", f=F["pixel_small"])
    text(draw, (x + 38, y + 48), t["pop_title"], fill="white", f=font(17, bold=True))
    rect(draw, (x + 28, y + 100, x + w - 28, y + 154), COLORS["mint"], width=4)
    text(draw, (x + w // 2, y + 117), t["quick"], f=font(20, bold=True), anchor="ma")
    text(draw, (x + 28, y + 186), t["my_palettes"], f=font(20, bold=True))
    swatches = ["#ff6b9d", "#8c6cff", "#69d9bf", "#fff0a8", "#75bfe8", "#f05f7d"]
    for i in range(3):
        yy = y + 222 + i * 72
        rect(draw, (x + 28, yy, x + w - 28, yy + 56), COLORS["panel"], width=3)
        for j in range(4):
            color = swatches[(i + j) % len(swatches)]
            draw.rectangle((x + 46 + j * 22, yy + 14, x + 66 + j * 22, yy + 38), fill=color, outline=COLORS["ink"], width=2)
        text(draw, (x + 150, yy + 12), t["pal_names"][i], f=font(16, bold=True))
        text(draw, (x + 150, yy + 34), f"{4 + i}/20 {t['colors_unit']}", fill=COLORS["soft"], f=F["small"])
    rect(draw, (x + 28, y + h - 82, x + w - 28, y + h - 28), COLORS["cream"], width=3)
    text(draw, (x + w // 2, y + h - 66), t["pop_bottom"], f=F["small"], anchor="ma")


def palette_board(draw, x, y, w, h, t):
    rect(draw, (x, y, x + w, y + h), COLORS["white"], width=5)
    text(draw, (x + 32, y + 30), t["s2_board"], f=F["h3"])
    text(draw, (x + 32, y + 65), t["s2_board_sub"], fill=COLORS["soft"], f=F["body"])
    colors = ["#ff6b9d", "#8c6cff", "#69d9bf", "#fff0a8", "#75bfe8", "#f05f7d", "#b58af0", "#6f8f55", "#f6c65b", "#c7834f", "#76d9bd", "#d7a4b8"]
    cols = 6
    cell = 86
    sx, sy = x + 34, y + 116
    for i, c in enumerate(colors):
        cx = sx + (i % cols) * (cell + 16)
        cy = sy + (i // cols) * (cell + 52)
        rect(draw, (cx, cy, cx + cell, cy + cell), c, width=4)
        text(draw, (cx, cy + cell + 12), c, f=F["tiny"])
        text(draw, (cx, cy + cell + 32), t["tags"][i % 4], fill=COLORS["soft"], f=F["tiny"])


def export_card(draw, x, y, label, detail, color):
    rect(draw, (x, y, x + 176, y + 126), COLORS["panel"], width=4)
    rect(draw, (x + 18, y + 18, x + 68, y + 68), color, width=3)
    text(draw, (x + 88, y + 24), label, f=font(18, bold=True))
    paragraph(draw, (x + 88, y + 56), detail, 74, f=F["tiny"], fill=COLORS["soft"], leading=4)


def screenshot_1(t, outdir):
    img, draw = base()
    hero(draw, t["s1_hero"], t["s1_sub"])
    popup_mock(draw, 82, 230, t)
    text(draw, (520, 268), t["s1_head"], f=F["h2"])
    paragraph(draw, (522, 322), t["s1_desc"], 610, f=F["body"])
    rect(draw, (520, 452, 1138, 532), COLORS["panel"], width=4)
    text(draw, (548, 480), "HEX", f=font(24, pixel=True))
    text(draw, (630, 476), "#FF6B9D", f=font(28, bold=True))
    rect(draw, (548, 586, 748, 654), COLORS["mint"], width=4)
    text(draw, (580, 606), t["copy"], f=font(22, bold=True))
    rect(draw, (780, 586, 1016, 654), COLORS["cream"], width=4)
    text(draw, (812, 606), t["save"], f=font(22, bold=True))
    img.save(outdir / "screenshot-01-picker.png")


def screenshot_2(t, outdir):
    img, draw = base()
    hero(draw, t["s2_hero"], t["s2_sub"])
    palette_board(draw, 74, 234, 710, 486, t)
    rect(draw, (836, 234, 1190, 720), COLORS["white"], width=5)
    text(draw, (868, 270), t["s2_history"], f=F["h3"])
    items = [("#ff6b9d", t["s2_items"][0]), ("#69d9bf", t["s2_items"][1]),
             ("#8c6cff", t["s2_items"][2]), ("#fff0a8", t["s2_items"][3])]
    for i, (c, label) in enumerate(items):
        yy = 330 + i * 82
        rect(draw, (868, yy, 1158, yy + 56), COLORS["panel"], width=3)
        draw.rectangle((888, yy + 13, 918, yy + 43), fill=c, outline=COLORS["ink"], width=2)
        text(draw, (940, yy + 10), c, f=F["small"])
        text(draw, (940, yy + 32), label, fill=COLORS["soft"], f=F["tiny"])
    img.save(outdir / "screenshot-02-palettes-history.png")


def screenshot_3(t, outdir):
    img, draw = base()
    hero(draw, t["s3_hero"], t["s3_sub"])
    text(draw, (82, 242), t["s3_head"], f=F["h2"])
    paragraph(draw, (84, 300), t["s3_desc"], 560, f=F["body"])
    for i, (label, detail, color) in enumerate([
        ("CSS", t["s3_cards"][0][1], "#ff6b9d"),
        ("SCSS", t["s3_cards"][1][1], "#8c6cff"),
        ("JSON", t["s3_cards"][2][1], "#69d9bf"),
        ("Tailwind", t["s3_cards"][3][1], "#fff0a8"),
        ("CSV", t["s3_cards"][4][1], "#75bfe8"),
        ("ASE", t["s3_cards"][5][1], "#f05f7d"),
    ]):
        export_card(draw, 80 + i * 188, 430, label, detail, color)
    rect(draw, (740, 230, 1160, 360), "#201c2b", outline=COLORS["ink"], width=5)
    text(draw, (770, 258), ":root {", fill="#f8edf7", f=F["body"])
    text(draw, (798, 290), "--primary: #FF6B9D;", fill="#69d9bf", f=F["small"])
    text(draw, (798, 318), "--accent:  #8C6CFF;", fill="#fff0a8", f=F["small"])
    img.save(outdir / "screenshot-03-export.png")


def screenshot_4(t, outdir):
    img, draw = base()
    hero(draw, t["s4_hero"], t["s4_sub"])
    rect(draw, (80, 240, 620, 650), COLORS["white"], width=5)
    text(draw, (116, 282), t["s4_free_title"], f=F["h2"])
    paragraph(draw, (120, 340), t["s4_free_desc"], 440, f=F["body"])
    rect(draw, (120, 506, 432, 574), COLORS["mint"], width=4)
    text(draw, (154, 526), t["s4_free_cta"], f=font(22, bold=True))
    rect(draw, (700, 240, 1200, 650), COLORS["white"], width=5)
    text(draw, (736, 282), t["s4_high"], f=F["h2"])
    for i, (t1, t2) in enumerate(t["s4_feats"]):
        yy = 340 + i * 72
        rect(draw, (736, yy, 1164, yy + 56), COLORS["panel"], width=3)
        text(draw, (760, yy + 8), t1, f=font(18, bold=True))
        text(draw, (760, yy + 32), t2, fill=COLORS["soft"], f=F["tiny"])
    img.save(outdir / "screenshot-04-free.png")


def screenshot_5(t, outdir):
    img, draw = base()
    hero(draw, t["s5_hero"], t["s5_sub"])
    rect(draw, (82, 238, 1198, 690), COLORS["white"], width=5)
    text(draw, (124, 286), t["s5_head"], f=F["h2"])
    names = t["s5_names"]
    cols = ["#ff6b9d", "#12544F", "#7F2020", "#853953", "#75bfe8", "#6f5bd8"]
    for i, (name, color) in enumerate(zip(names, cols)):
        x = 124 + (i % 3) * 330
        y = 370 + (i // 3) * 116
        rect(draw, (x, y, x + 280, y + 78), COLORS["panel"], width=3)
        draw.rectangle((x + 18, y + 18, x + 58, y + 58), fill=color, outline=COLORS["ink"], width=3)
        text(draw, (x + 78, y + 18), name, f=font(18, bold=True))
        text(draw, (x + 78, y + 44), "Theme preset", fill=COLORS["soft"], f=F["tiny"])
    rect(draw, (882, 286, 1128, 338), COLORS["cream"], width=3)
    text(draw, (912, 300), t["s5_lang"], f=F["small"])
    img.save(outdir / "screenshot-05-themes-language.png")


def main():
    for lang in ("zh", "en"):
        t = TEXTS[lang]
        outdir = OUT / lang
        outdir.mkdir(parents=True, exist_ok=True)
        screenshot_1(t, outdir)
        screenshot_2(t, outdir)
        screenshot_3(t, outdir)
        screenshot_4(t, outdir)
        screenshot_5(t, outdir)
        print(f"Generated 5 '{lang}' screenshots in {outdir}")


if __name__ == "__main__":
    main()
    print(f"Output: {OUT}")

