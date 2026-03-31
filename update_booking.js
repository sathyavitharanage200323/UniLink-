const fs = require('fs');
let page = fs.readFileSync('frontend/src/pages/BookingPage.jsx', 'utf8');

const oldStart = "${selectedSlot.slotDate}T";
const newStart = "${selectedSlot.slotDate}T:00";
const oldEnd = "${selectedSlot.slotDate}T";
const newEnd = "${selectedSlot.slotDate}T:00";

page = page.replace(oldStart, newStart).replace(oldEnd, newEnd);
fs.writeFileSync('frontend/src/pages/BookingPage.jsx', page);
