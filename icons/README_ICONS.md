# Icon Generation Instructions

The extension requires three icon sizes: 16x16, 48x48, and 128x128 pixels.

## Quick Method: Use the HTML Generator

1. Open `generate-icons.html` in your web browser
2. Click "Generate All Icons"
3. The icons will be automatically downloaded to your Downloads folder
4. Move the downloaded `icon16.png`, `icon48.png`, and `icon128.png` files to this `icons/` directory

## Alternative Method: Use Python Script

If you have Python and Pillow installed:

```bash
pip install pillow
python3 create-icons.py
```

## Alternative Method: Create Icons Manually

You can create your own icons using any image editing software:

1. Create three PNG images with dimensions: 16x16, 48x48, and 128x128 pixels
2. Name them: `icon16.png`, `icon48.png`, `icon128.png`
3. Save them in this `icons/` directory

### Design Guidelines

The icon should represent security/detection:
- Use a shield shape
- Add an AI or warning symbol
- Use colors: #667eea (primary), #fbbf24 (warning accent), white
- Ensure the icon is visible at small sizes (16x16)

## Temporary Placeholders

If you want to test the extension immediately without custom icons, you can use simple colored squares as placeholders. The extension will still work, just with basic icons.
