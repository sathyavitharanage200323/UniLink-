
const fs = require('fs');
let page = fs.readFileSync('frontend/src/pages/BookingPage.jsx', 'utf8');
const lines = page.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('startTime:') && lines[i].includes('selectedSlot')) {
    lines[i] = '          startTime: ${selectedSlot.slotDate}T:00,';
  } else if (lines[i].includes('endTime:') && lines[i].includes('selectedSlot')) {
    lines[i] = '          endTime: ${selectedSlot.slotDate}T:00,';
  }
}
fs.writeFileSync('frontend/src/pages/BookingPage.jsx', lines.join('\n'));

