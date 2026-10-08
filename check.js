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
            if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = getFiles('.');
let foundCategoriesLinks = [];

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    // looking for any href involving categories
    const regex = /href=['"`]([^'"`]*categories[^'"`]*)['"`]/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        let href = match[1];
        foundCategoriesLinks.push({href, file});
    }
    
    // Also look for href: '/...',
    const regex2 = /href:\s*['"`]([^'"`]*categories[^'"`]*)['"`]/g;
    while ((match = regex2.exec(content)) !== null) {
        let href = match[1];
        foundCategoriesLinks.push({href, file});
    }
});

// Let's filter unique ones or check them against existing routes
console.log('Categories links found:');
const uniqueLinks = [...new Set(foundCategoriesLinks.map(l => l.href))];
console.log(uniqueLinks);

// Let's check if the directory app + link exists, ignoring dynamic parts for now
const appDir = path.join(__dirname, 'app');
uniqueLinks.forEach(link => {
    // skip dynamic ones or full urls
    if(link.includes('${') || link.startsWith('http')) return;
    
    // check if it's a dashboard link
    if (link.includes('dashboard') || link.includes('admin') || link.includes('vendor') || link.includes('account')) {
        console.log(`Checking Dashboard/Portal link: ${link}`);
    }
});
