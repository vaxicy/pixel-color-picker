#!/usr/bin/env python3
"""
生成 Pixel Color Picker 扩展图标
需要安装 Pillow: pip install Pillow
"""

from PIL import Image, ImageDraw
import os

def create_icon(size, output_path):
    """创建像素风图标"""
    # 创建新图像
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # 计算像素大小
    pixel = size // 32  # 基础像素大小
    
    # 定义颜色
    colors = ['#FF6B9D', '#C44AFF', '#4ECDC4', '#FFE66D']
    border_color = '#4A4A4A'
    
    # 绘制四个色块（2x2网格）
    block_size = size // 2
    border_width = pixel * 2
    
    for i, color in enumerate(colors):
        row = i // 2
        col = i % 2
        
        x1 = col * block_size
        y1 = row * block_size
        x2 = x1 + block_size - 1
        y2 = y1 + block_size - 1
        
        # 填充颜色
        draw.rectangle([x1, y1, x2, y2], fill=color)
        
        # 绘制边框
        for b in range(border_width):
            draw.rectangle(
                [x1 + b, y1 + b, x2 - b, y2 - b],
                outline=border_color,
                width=1
            )
    
    # 绘制中心吸管图标
    center_x = size // 2
    center_y = size // 2
    handle_size = size // 8
    
    # 吸管手柄
    draw.rectangle(
        [center_x - handle_size//2, center_y - handle_size, 
         center_x + handle_size//2, center_y + handle_size],
        fill=border_color
    )
    
    # 吸管头部
    draw.rectangle(
        [center_x - handle_size//4, center_y - handle_size - pixel*2,
         center_x + handle_size//4, center_y - handle_size],
        fill=border_color
    )
    
    # 保存
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img.save(output_path)
    print(f"✓ 已生成: {output_path}")

def main():
    """主函数"""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    images_dir = os.path.join(base_dir, 'images')
    
    # 确保目录存在
    os.makedirs(images_dir, exist_ok=True)
    
    # 生成不同尺寸的图标
    sizes = [16, 48, 128]
    for size in sizes:
        filename = f'icon-{size}.png'
        output_path = os.path.join(images_dir, filename)
        create_icon(size, output_path)
    
    print("\n✨ 所有图标已生成完成！")
    print(f"📁 图标位置: {images_dir}")

if __name__ == '__main__':
    try:
        from PIL import Image
        main()
    except ImportError:
        print("❌ 错误: 需要安装 Pillow 库")
        print("请运行: pip install Pillow")
        print("\n或者使用在线工具生成图标:")
        print("1. 访问 https://favicon.io/favicon-generator/")
        print("2. 或者使用已提供的 icon.svg 文件")
