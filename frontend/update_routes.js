const fs = require('fs');
const filePath = 'D:\\University Lecturer Appointment Booking System\\Unilink\\Codes\\UniLink-\\frontend\\src\\App.js';
let content = fs.readFileSync(filePath, 'utf8');

const search = 'import LecturerSlotsPage from \\'./pages/LecturerSlotsPage.jsx\\';';
if (!content.includes('SlotCalendarPage')) {
  content = content.replace(search, search + '\nimport SlotCalendarPage from \\'./pages/SlotCalendarPage.jsx\\';');
}

const lines = content.split('\n');
const newLines = [];
let i = 0;
while (i < lines.length) {
  newLines.push(lines[i]);
  if (lines[i].includes('path="/lecturer/availability"')) {
    let braceCount = 0;
    let foundStart = false;
    let j = i + 1;
    for (; j < lines.length; j++) {
      newLines.push(lines[j]);
      if (lines[j].includes('/>')) {
        break; // found the end of the route
      }
    }
    i = j;

    newLines.push('        <Route');
    newLines.push('          path="/lecturer/calendar"');
    newLines.push('          element={');
    newLines.push('            activeUser?.role === \\'LECTURER\\'');
    newLines.push('              ? <SlotCalendarPage currentUser={activeUser} onLogout={onLogout} />');
    newLines.push('              : <Navigate to="/student/home" replace />');
    newLines.push('          }');
    newLines.push('        />');
  }
  i++;
}

fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
console.log('App.js routed successfully.');
