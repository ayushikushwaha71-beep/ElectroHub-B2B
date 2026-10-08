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
            if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.jsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = getFiles('.');
let totalReplaced = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Replace hrefs
    content = content.replace(/href=['"\`](.*?\/categories\/([a-zA-Z0-9\-]+(?:[\/a-zA-Z0-9\-]*)))['"\`]/g, (match, fullPath, subPath) => {
        const qs = subPath.replace(/\//g, '-');
        return match.replace(fullPath, '/shop?category=' + qs);
    });

    content = content.replace(/href:\s*['"\`](.*?\/categories\/([a-zA-Z0-9\-]+(?:[\/a-zA-Z0-9\-]*)))['"\`]/g, (match, fullPath, subPath) => {
        const qs = subPath.replace(/\//g, '-');
        return match.replace(fullPath, '/shop?category=' + qs);
    });
    
    if (content !== original) {
        fs.writeFileSync(file, content);
        totalReplaced++;
        console.log('Fixed links in', file);
    }
});
console.log('Total files modified:', totalReplaced);
