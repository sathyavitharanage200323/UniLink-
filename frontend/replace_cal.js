const fs = require('fs');
const filePath = 'D:\\University Lecturer Appointment Booking System\\Unilink\\Codes\\UniLink-\\frontend\\src\\pages\\LecturerSlotsPage.jsx';
let content = fs.readFileSync(filePath, 'utf8');
const searchString = '<div className="lh-hero__actions">';
const endIndex = content.indexOf('</div>', content.indexOf(searchString)) + 6;
if (content.indexOf(searchString) !== -1) {
    const replacement = `<div className="lh-hero__actions">
                  <button className="lh-btn lh-btn--outline" onClick={() => navigate('/lecturer/home')} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
                    ← Back to Home
                  </button>
                  <button className="lh-btn lh-btn--primary" onClick={() => navigate('/lecturer/schedule')} style={{ background: 'white', color: '#0F2854' }}>
                    <Calendar size={16} /> Calendar View
                  </button>
                </div>`;
    content = content.substring(0, content.indexOf(searchString)) + replacement + content.substring(endIndex);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Replaced');
} else {
    console.log('Not found');
}
