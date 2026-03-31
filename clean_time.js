const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/SlotCalendarPage.jsx', 'utf8');

const regex = /if \(formData\.startTime < '07:00' \|\| formData\.endTime > '21:00'\) \{[\s\S]*?return 'Slots must be scheduled between 07:00 AM and 09:00 PM\.';[\s\S]*?\}/gi;

code = code.replace(regex, '');
fs.writeFileSync('frontend/src/pages/SlotCalendarPage.jsx', code, 'utf8');
