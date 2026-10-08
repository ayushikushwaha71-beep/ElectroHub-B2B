import os, glob

for filepath in glob.glob('public/images/products/*.svg'):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple fix for aria-label="something" something else"
    # E.g. aria-label="0.96" OLED" -> aria-label="0.96&quot; OLED"
    if 'aria-label="0.96" OLED"' in content:
        content = content.replace('aria-label="0.96" OLED"', 'aria-label="0.96&quot; OLED"')
    if 'aria-label="2.4" TFT"' in content:
        content = content.replace('aria-label="2.4" TFT"', 'aria-label="2.4&quot; TFT"')
    if 'aria-label="3.5" TFT"' in content:
        content = content.replace('aria-label="3.5" TFT"', 'aria-label="3.5&quot; TFT"')
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
