# Pixel Color Picker - 像素吸色器

可爱的像素风网页吸色工具 Chrome 扩展

## 功能特性

🎨 **网页取色** - 点击即可获取网页任意位置的颜色
💾 **颜色收藏** - 保存喜欢的颜色到色卡
🌈 **色卡管理** - 创建和管理多个色卡
📤 **导出功能** - 导出为 CSS 变量或 PNG 图片
🎮 **像素风格** - 复古可爱的像素风 UI 设计
⚡ **快捷键支持** - 快速激活取色模式

## 安装方法

### 方法一：开发者模式加载（推荐）

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启右上角的「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择本项目文件夹
6. 完成！扩展已安装到工具栏

### 方法二：Chrome 网上应用店（待发布）

*即将上架，敬请期待*

## 使用方法

### 基本取色

1. 点击浏览器工具栏中的「像素吸色器」图标
2. 在弹出的窗口中点击「开始取色」按钮
3. 鼠标移动到网页上，会出现放大镜
4. 点击想要取色的区域
5. 颜色会自动显示在弹出窗口中

### 保存颜色

1. 取色后，点击「保存到色卡」按钮
2. 颜色会添加到下方的色卡列表中
3. 点击色卡中的颜色可以再次查看

### 导出功能

- **导出 CSS**：将色卡导出为 CSS 变量格式
- **导出图片**：将色卡导出为 PNG 图片

### 设置

点击弹出窗口底部的「设置」按钮，可以：
- 调整放大镜像素大小
- 设置默认颜色格式
- 配置自动保存
- 管理数据（导入/导出/清除）

## 技术栈

- **Manifest V3** - Chrome 扩展最新标准
- **Vanilla JavaScript** - 原生 JS，无依赖
- **Chrome Storage API** - 数据持久化
- **Canvas API** - 图片导出功能

## 项目结构

```
pixel-color-picker/
├── manifest.json          # 扩展配置
├── popup/                 # 弹出窗口
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── content/               # 内容脚本
│   ├── content.js
│   └── content.css
├── background/            # 后台服务
│   └── background.js
├── options/               # 设置页面
│   ├── options.html
│   ├── options.css
│   └── options.js
├── lib/                   # 工具库
│   └── color-utils.js
├── images/                # 图标资源
│   └── (需要添加图标文件)
└── README.md             # 说明文档
```

## 待添加图标

扩展需要以下图标文件（放在 `images/` 文件夹）：

- `icon-16.png` (16x16)
- `icon-48.png` (48x48)
- `icon-128.png` (128x128)

### 快速生成图标

使用以下 Python 脚本生成简单的像素风图标：

```python
from PIL import Image, ImageDraw

def create_pixel_icon(size, filename):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # 绘制一个简单的调色板图标
    colors = ['#FF6B9D', '#C44AFF', '#4ECDC4', '#FFE66D']
    pixel_size = size // 4
    
    for i, color in enumerate(colors):
        x = (i % 2) * pixel_size
        y = (i // 2) * pixel_size
        draw.rectangle([x, y, x + pixel_size, y + pixel_size], 
                      fill=color, outline='#4A4A4A', width=2)
    
    img.save(f'images/{filename}')

create_pixel_icon(16, 'icon-16.png')
create_pixel_icon(48, 'icon-48.png')
create_pixel_icon(128, 'icon-128.png')
```

或者使用在线工具：
- [Favicon.io](https://favicon.io/)
- [Pixel Art Maker](https://pixelartmaker.com/)

## 开发计划

### 已完成 ✅

- [x] 基本取色功能
- [x] 颜色收藏
- [x] 色卡管理
- [x] 导出 CSS
- [x] 导出 PNG
- [x] 像素风 UI

### 待开发 🚧

- [ ] 改进取色精度（使用截图 API）
- [ ] 颜色历史记录
- [ ] 渐变生成器
- [ ] 颜色对比度检查
- [ ] 分享色卡链接
- [ ] 深色模式
- [ ] 多语言支持

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 作者

Pixel Color Picker Team

## 更新日志

### v1.0.0 (2026-06-07)

- 🎉 初始版本发布
- ✨ 实现基本取色功能
- 💾 支持颜色收藏
- 📤 支持导出 CSS 和 PNG
- 🎨 像素风 UI 设计
