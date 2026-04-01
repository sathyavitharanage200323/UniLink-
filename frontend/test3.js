const fs = require('fs');
const filePath = 'D:\\University Lecturer Appointment Booking System\\Unilink\\Codes\\UniLink-\\frontend\\src\\App.js';
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('SlotCalendarPage')) {
  content = content.replace("import LecturerSlotsPage", "import SlotCalendarPage from './pages/SlotCalendarPage.jsx';\nimport LecturerSlotsPage");
}

const endIndex = content.indexOf('</Routes>');

if (content.indexOf('/lecturer/calendar') === -1) {
  const insertStr = `
        <Route
          path="/lecturer/calendar"
          element={
            activeUser?.role === 'LECTURER'
              ? <SlotCalendarPage currentUser={activeUser} onLogout={onLogout} />
              : <Navigate to="/student/home" replace />
          }
        />
      `;
  content = content.substring(0, endIndex) + insertStr + content.substring(endIndex);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed');
}
