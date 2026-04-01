
const fs = require('fs');
let page = fs.readFileSync('frontend/src/pages/BookingPage.jsx', 'utf8');
page = page.replace(
  'startTime: ${selectedSlot.slotDate}T',
  'startTime: ${selectedSlot.slotDate}T'
);
fs.writeFileSync('frontend/src/pages/BookingPage.jsx', page);

