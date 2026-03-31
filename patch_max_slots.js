const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/SlotCalendarPage.jsx', 'utf8');

const target = "if (overlap) return 'This time slot overlaps with an existing one.';";
const ext = `if (overlap) return 'This time slot overlaps with an existing one.';
    
    if (!editingSlot && slotsForSelectedDate.length >= 12) {
      return 'Maximum 12 slots allowed per day.';
    }`;

code = code.replace(target, ext);
fs.writeFileSync('frontend/src/pages/SlotCalendarPage.jsx', code, 'utf8');
