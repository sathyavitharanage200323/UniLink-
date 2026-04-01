const fs = require('fs');
let page = fs.readFileSync('frontend/src/pages/BookingPage.jsx', 'utf8');

const target1 = '$' + '{selectedSlot.slotDate}T$' + '{selectedSlot.startTime}';
const replace1 = '$' + '{selectedSlot.slotDate}T$' + '{selectedSlot.startTime.substring(0,5)}:00';
page = page.replace(target1, replace1);

const target2 = '$' + '{selectedSlot.slotDate}T$' + '{selectedSlot.endTime}';
const replace2 = '$' + '{selectedSlot.slotDate}T$' + '{selectedSlot.endTime.substring(0,5)}:00';
page = page.replace(target2, replace2);

fs.writeFileSync('frontend/src/pages/BookingPage.jsx', page);
console.log('Done');
