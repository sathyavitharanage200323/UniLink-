const fs = require('fs');
const filePath = 'D:\\University Lecturer Appointment Booking System\\Unilink\\Codes\\UniLink-\\frontend\\src\\App.js';
let content = fs.readFileSync(filePath, 'utf8');

const routeStr = '\n        <Route\n          path="/lecturer/availability"';

const insertStr = '\n        <Route\n          path="/lecturer/calendar"\n          element={\n            activeUser?.role === \\'LECTURER\\'\n              ? <SlotCalendarPage currentUser={activeUser} onLogout={onLogout} />\n              : <Navigate to="/student/home" replace />\n          }\n        />\n';

if (content.indexOf('/lecturer/calendar') === -1) {
  content = content.replace(routeStr, routeStr + insertStr);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('updated routes');
} else {
  console.log('already has route');
}
