const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/SlotCalendarPage.jsx', 'utf8');

const target = "if (formData.endTime <= formData.startTime) {";
const replacement = `if (formData.startTime < '07:00' || formData.endTime > '21:00') {
      return 'Slots must be scheduled between 07:00 AM and 09:00 PM.';
    }

    if (formData.endTime <= formData.startTime) {`;

// only replace the first occurrence
code = code.replace(target, replacement);
fs.writeFileSync('frontend/src/pages/SlotCalendarPage.jsx', code, 'utf8');
