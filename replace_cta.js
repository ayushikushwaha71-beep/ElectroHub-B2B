const fs = require('fs');

const files = [
    'c:\\Users\\Ayushi\\electrohub24\\components\\home\\PromotionalBanner.tsx',
    'c:\\Users\\Ayushi\\electrohub24\\PromotionalBanner.tsx'
];

files.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        let original = content;
        
        content = content.replace(/ctaHref="\/categories\/([^"]+)"/g, 'ctaHref="/shop?category=$1"');
        
        if (content !== original) {
            fs.writeFileSync(file, content);
            console.log('Fixed', file);
        }
    }
});
