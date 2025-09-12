# NeuroScreen PWA Icon Generator
# Run this script to generate all required PWA icons from your logo

from PIL import Image, ImageDraw, ImageFont
import os

def create_pwa_icons():
    # Icon sizes needed for PWA
    sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512]
    
    # Create a simple NeuroScreen icon
    def create_icon(size):
        # Create a circular icon with gradient background
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # Draw gradient circle background
        for i in range(size//2):
            alpha = int(255 * (1 - i / (size//2)))
            color = (37, 99, 235, alpha)  # Primary blue with varying alpha
            draw.ellipse([i, i, size-i, size-i], fill=color)
        
        # Draw brain wave pattern in center
        center = size // 2
        wave_size = size // 4
        
        # Simple wave pattern
        points = []
        for x in range(-wave_size, wave_size, 2):
            y = int(wave_size * 0.3 * (x / wave_size) ** 2)  # Parabolic wave
            points.append((center + x, center + y))
        
        if len(points) > 1:
            draw.line(points, fill=(255, 255, 255, 255), width=max(1, size//32))
        
        return img
    
    # Create all required icon sizes
    icons_dir = "static/icons"
    os.makedirs(icons_dir, exist_ok=True)
    
    for size in sizes:
        icon = create_icon(size)
        icon.save(f"{icons_dir}/icon-{size}x{size}.png", "PNG")
        print(f"Created icon-{size}x{size}.png")
    
    # Create favicon.ico
    favicon = create_icon(32)
    favicon.save(f"{icons_dir}/favicon.ico", "ICO")
    print("Created favicon.ico")
    
    print("All PWA icons created successfully!")

if __name__ == "__main__":
    create_pwa_icons()