# Pixel Color Picker - 像素吸色器

A pixel-art style Chrome extension for picking colors from any web page. Free forever, with optional tips.

可爱的像素风网页取色工具 · 全免费 · 自由打赏

## 功能特性

- 🎨 **网页取色** - 一键获取网页任意位置的颜色，支持 HEX/RGB/HSL
- 💾 **颜色收藏** - 把喜欢的颜色保存到色卡
- 🌈 **色卡管理** - 自由创建多个色卡，重命名、删除、排序
- 🎨 **12+ 套主题** - 少女粉、森林绿、夜空黑、鸢尾紫、燕麦咖、樱桃、游戏机、可可、薄荷、葡萄、迷雾蓝、奶油白 + 自定义主题（全部免费）
- 📤 **多格式导出** - 导出为 CSS 变量、JSON、Tailwind config、PNG 色卡图片
- 🔍 **色卡搜索** - 快速搜索历史与色卡
- 🌓 **深色模式** - 跟随系统自动切换
- 🌐 **中英双语** - 完整 zh-CN / en 翻译
- 💾 **本地存储** - 所有数据存 `chrome.storage.sync`，不上传任何服务器
- 💝 **自由打赏** - 喜欢这个工具？微信扫码 / PayPal 跳链接打赏支持

## 安装方法

### 方法一：Chrome 网上应用店

[Chrome Web Store 安装链接](https://chromewebstore.google.com/detail/pixel-color-picker/...)

### 方法二：开发者模式加载

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启右上角的「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择本项目文件夹
6. 完成！扩展已安装到工具栏

## 使用方法

### 基本取色

1. 点击浏览器工具栏中的「像素吸色器」图标
2. 在弹出的窗口中点击「快速取色」按钮
3. 使用取色吸管点击网页上任意位置
4. 颜色会自动显示并保存到色卡

### 色卡管理

- **创建色卡**：点击「+」创建新色卡
- **重命名**：双击色卡标题
- **删除**：右键色卡
- **导出**：单色卡支持导出 CSS / JSON / Tailwind / PNG

### 主题切换

- **预设主题**：从 12+ 套主题中任选
- **自定义主题**：在设置里调整 4 个颜色（header/button/bg/panel）→ 自动保存为你的专属主题
- **重置**：一键恢复默认

### 设置

点击弹出窗口底部的「设置」按钮，可以：
- 设置默认颜色格式（HEX / RGB / HSL）
- 配置自动保存策略
- 切换中英双语
- 12+ 主题 + 自定义主题（全部免费）
- 数据导入 / 导出 / 清除
- 💝 **支持作者**：微信扫码 / PayPal 打赏（可选）

## 技术栈

- **Manifest V3** - Chrome 扩展最新标准
- **Vanilla JavaScript** - 原生 JS，无依赖
- **Chrome Storage API** - 数据持久化（`chrome.storage.sync`）
- **Canvas API** - 图片导出

## 项目结构

```
color-picker/
├── manifest.json
├── popup/                  # 弹出窗口
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── background/             # 后台服务
│   └── background.js
├── options/                # 设置页面
│   ├── options.html
│   ├── options.css
│   └── options.js
├── shared/                 # 共享工具
│   └── i18n.js
├── images/                 # 图标 + 赞赏码
│   ├── icon-16.png
│   ├── icon-48.png
│   ├── icon-128.png
│   └── wx-donate.png
├── store-assets/           # Chrome 商店素材
│   ├── icon.png
│   ├── screenshots/
│   │   ├── en/
│   │   └── zh/
│   └── promo/
│       ├── 440x280.png
│       └── 1400x560.png
├── _locales/               # Chrome 多语言
│   ├── en/messages.json
│   └── zh_CN/messages.json
├── scripts/                # 打包 + 截图脚本
└── README.md
```

## 隐私

本扩展 **完全本地运行**：
- 所有色卡和设置存在 `chrome.storage.sync`，不会上传任何服务器
- 没有远程代码、没有第三方分析、没有追踪
- 可选打赏链接跳转到 `paypal.com` 或微信扫码 — 由用户主动触发，不收集任何信息

完整隐私政策：[https://vaxicy.github.io/pixel-color-picker-privacy/privacy-policy.html](https://vaxicy.github.io/pixel-color-picker-privacy/privacy-policy.html)

## 许可证

Non-Commercial License · 仅供个人非商业使用
详见 [LICENSE](LICENSE) 文件

## 贡献

欢迎提交 Issue 和 Pull Request！

## 更新日志

### v1.1.1 (2026-08-06)

- 📝 **内置更新日志** - 设置页新增像素风 changelog 弹窗，版本自动从 manifest 读取
- 💌 **反馈入口** - changelog 弹窗内一键发送反馈邮件
- 🎨 **对比度修复** - 粉主题下 changelog 弹窗白字看不清问题修复
- 🐛 **悬浮态 bug** - 关闭按钮悬浮不再消失/变白
- 🗑️ **UI 简化** - 移除 popup 打赏入口，打赏仅保留在 options 设置页

### v1.1.0 (2026-08-06)

- 🎁 **完全免费** - 移除 Pro 付费模式，所有主题、自定义主题、无限色卡对所有用户开放
- 💝 **新增打赏** - 微信赞赏码 / PayPal 付款链接（可选）
- 🔒 **零远程** - 删除所有 `host_permissions`，本扩展不再向任何服务器发请求
- 🧹 **冗余清理** - 删除 18+ Pro 相关 i18n 字段与 4 处 Pro 限制拦截

### v1.0.0 (2026-06-07)

- 🎉 初始版本发布
- ✨ 实现基本取色 / 色卡 / 主题 / 导出 / 双语
