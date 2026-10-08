const fs = require('fs');
const path = require('path');

function getFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.next') && !file.includes('.git')) {
                results = results.concat(getFiles(file));
            }
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = getFiles('.');
let foundCategoriesLinks = [];

files.forEach(file => {
    // Only check files in dashboard/admin/vendor/account directories or files
    if (!file.toLowerCase().includes('admin') && 
        !file.toLowerCase().includes('vendor') && 
        !file.toLowerCase().includes('account') && 
        !file.toLowerCase().includes('dashboard') && 
        !file.toLowerCase().includes('portal')) return;
        
    const content = fs.readFileSync(file, 'utf8');
    const regex = /href=['"`]([^'"`]*categories[^'"`]*)['"`]/gi;
    let match;
    while ((match = regex.exec(content)) !== null) {
        let href = match[1];
        foundCategoriesLinks.push({href, file});
    }
    const regex2 = /href:\s*['"`]([^'"`]*categories[^'"`]*)['"`]/gi;
    while ((match = regex2.exec(content)) !== null) {
        let href = match[1];
        foundCategoriesLinks.push({href, file});
    }
});

console.log('Categories links found in dashboard files:');
console.log(foundCategoriesLinks);
