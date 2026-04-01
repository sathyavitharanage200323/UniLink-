const fs = require('fs');
const filePath = 'D:\\University Lecturer Appointment Booking System\\Unilink\\Codes\\UniLink-\\frontend\\src\\App.js';
let content = fs.readFileSync(filePath, 'utf8');
if (content.indexOf('import SlotCalendarPage from') === -1) {
  content = content.replace("import LecturerSlotsPage from './pages/LecturerSlotsPage.jsx';", "import LecturerSlotsPage from './pages/LecturerSlotsPage.jsx';\nimport SlotCalendarPage from './pages/SlotCalendarPage.jsx';");
}
if (content.indexOf('<Route\n          path="/lecturer/calendar"') === -1) {
  const routeString = \<Route
          path="/lecturer/availability"
          element={
            activeUser?.role === 'LECTURER'
              ? <LecturerSlotsPage user={activeUser} onLogout={onLogout} />
              : <Navigate to="/student/home" replace />
          }
        />\;
  const insertString = \\n        <Route
          path="/lecturer/calendar"
          element={
            activeUser?.role === 'LECTURER'
              ? <SlotCalendarPage currentUser={activeUser} onLogout={onLogout} />
              : <Navigate to="/student/home" replace />
          }
        />\;
  content = content.replace(routeString, routeString + insertString);
}
fs.writeFileSync(filePath, content, 'utf8');
console.log('App.js updated');
