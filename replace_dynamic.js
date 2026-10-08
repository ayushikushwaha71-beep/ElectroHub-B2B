const fs = require('fs');

const files = [
    'c:\\Users\\Ayushi\\electrohub24\\components\\categories\\TrendingCategories.tsx',
    'c:\\Users\\Ayushi\\electrohub24\\components\\categories\\PopularCategories.tsx',
    'c:\\Users\\Ayushi\\electrohub24\\components\\categories\\CategoryGrid.tsx',
    'c:\\Users\\Ayushi\\electrohub24\\TrendingCategories.tsx',
    'c:\\Users\\Ayushi\\electrohub24\\PopularCategories.tsx',
    'c:\\Users\\Ayushi\\electrohub24\\CategoryGrid.tsx'
];

files.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        let original = content;
        
        content = content.replace(/`\/categories\/\$\{([^}]+)\}`/g, '`/shop?category=${$1}`');
        
        if (content !== original) {
            fs.writeFileSync(file, content);
            console.log('Fixed', file);
        }
    }
});
