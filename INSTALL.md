# 安装指南

## 快速开始

### 1. 准备图标文件

由于项目需要图标文件，您有以下选择：

#### 选项 A：使用 Python 生成（推荐）

1. 安装 Python（如果还没有）
2. 安装 Pillow 库：
   ```bash
   pip install Pillow
   ```
3. 运行生成脚本：
   ```bash
   python generate-icons.py
   ```
4. 图标会自动生成到 `images/` 文件夹

#### 选项 B：手动创建

使用任何图片编辑工具（如 Photoshop、GIMP、Paint.NET）创建以下尺寸的 PNG 图标：

- `images/icon-16.png` (16x16)
- `images/icon-48.png` (48x48)
- `images/icon-128.png` (128x128)

建议设计：像素风的调色板图标，使用项目的主题色（粉色 #FF6B9D、紫色 #C44AFF）

#### 选项 C：使用在线工具

1. 访问 [Favicon.io](https://favicon.io/favicon-generator/)
2. 创建一个调色板图标
3. 下载并重命名为 `icon-16.png`, `icon-48.png`, `icon-128.png`
4. 放到 `images/` 文件夹

#### 选项 D：临时测试（不推荐）

如果只想快速测试，可以：
1. 找任意 PNG 图片
2. 复制三份到 `images/` 文件夹
3. 分别命名为 `icon-16.png`, `icon-48.png`, `icon-128.png`

### 2. 加载到 Chrome

1. 打开 Chrome 浏览器
2. 在地址栏输入：`chrome://extensions/`
3. 右上角打开「开发者模式」开关
4. 点击「加载已解压的扩展程序」
5. 选择项目文件夹（`c:\Users\16704\Desktop\e`）
6. 完成！扩展图标会出现在工具栏

### 3. 开始使用

1. 点击工具栏中的扩展图标
2. 点击「开始取色」
3. 在网页上移动鼠标，会显示放大镜
4. 点击想要的颜色
5. 颜色会显示在弹出窗口中

## 常见问题

### Q: 找不到「开发者模式」？

A: 在 `chrome://extensions/` 页面右上角，有一个开关按钮

### Q: 加载时提示「无法加载扩展程序」？

A: 检查：
- `manifest.json` 文件是否存在且格式正确
- 图标文件是否存在
- 文件夹路径是否正确

### Q: 取色不准确？

A: 当前版本使用简化算法，正在改进中。可以尝试：
- 刷新页面后重试
- 在简单背景的页面测试

### Q: 如何卸载？

A: 在 `chrome://extensions/` 页面，找到扩展，点击「移除」

## 下一步

- 阅读 [README.md](README.md) 了解完整功能
- 打开设置页面配置扩展
- 开始收藏你的颜色！

## 需要帮助？

如果遇到问题，请：
1. 检查 Chrome 版本（需要 Chrome 88+）
2. 查看控制台错误信息
3. 提交 Issue

---

祝你使用愉快！🎨
