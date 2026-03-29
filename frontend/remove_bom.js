const fs = require('fs');
['src/pages/LecturerSlotsPage.jsx', 'src/api.js'].forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
    fs.writeFileSync(file, content, 'utf8');
  }
});
console.log('BOM removed');
