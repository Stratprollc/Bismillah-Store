const fs = require('fs');
let content = fs.readFileSync('src/components/JarvisAI.tsx', 'utf-8');
content = content.replace(/\\`/g, '`');
content = content.replace(/\\\$/g, '$');
fs.writeFileSync('src/components/JarvisAI.tsx', content);
