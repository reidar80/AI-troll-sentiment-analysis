#!/usr/bin/env python3
"""
Simple script to create placeholder PNG icons for the Chrome extension.
Requires: pip install pillow
"""

try:
    from PIL import Image, ImageDraw, ImageFont
    import os

    def create_icon(size, filename):
        """Create a simple icon with the given size"""
        # Create image with transparent background
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        # Draw gradient circle (simplified as solid color)
        padding = size // 10
        circle_bbox = [padding, padding, size - padding, size - padding]

        # Background circle
        draw.ellipse(circle_bbox, fill='#667eea')

        # Shield shape (simplified)
        shield_padding = size // 4
        shield_top = size // 4
        shield_bottom = size * 3 // 4
        shield_left = size // 3
        shield_right = size * 2 // 3

        shield_points = [
            (size // 2, shield_top),
            (shield_right, shield_top + size // 10),
            (shield_right, shield_bottom - size // 10),
            (size // 2, shield_bottom),
            (shield_left, shield_bottom - size // 10),
            (shield_left, shield_top + size // 10),
        ]

        draw.polygon(shield_points, fill='#ffffff')

        # Warning badge (small circle in corner)
        badge_size = size // 4
        badge_pos = size * 3 // 4
        draw.ellipse([badge_pos - badge_size // 2, badge_pos - badge_size // 2,
                      badge_pos + badge_size // 2, badge_pos + badge_size // 2],
                     fill='#fbbf24')

        # Try to add exclamation mark if size is large enough
        if size >= 48:
            try:
                font_size = max(badge_size // 2, 12)
                font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
                draw.text((badge_pos, badge_pos), "!", fill='#ffffff', font=font, anchor='mm')
            except:
                # Fallback if font not available
                pass

        # Save image
        img.save(filename, 'PNG')
        print(f"Created {filename}")

    # Create icons directory if it doesn't exist
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Generate icons
    create_icon(16, os.path.join(script_dir, 'icon16.png'))
    create_icon(48, os.path.join(script_dir, 'icon48.png'))
    create_icon(128, os.path.join(script_dir, 'icon128.png'))

    print("\nAll icons created successfully!")
    print("Icons are ready to use with the Chrome extension.")

except ImportError:
    print("Error: Pillow library not installed.")
    print("Please install it with: pip install pillow")
    print("\nAlternatively, use the generate-icons.html file in your browser to create icons manually.")
