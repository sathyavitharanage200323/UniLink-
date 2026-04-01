const fs = require('fs');
let content = fs.readFileSync('frontend/src/api.js', 'utf8');
console.log(content.substring(0, 100));
