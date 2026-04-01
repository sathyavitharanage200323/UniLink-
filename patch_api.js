const fs = require('fs');
let code = fs.readFileSync('frontend/src/api.js', 'utf8');
code = code.replace(/export function createAppointment\(data\) \{[\s\S]*?body: JSON\.stringify\(data\),[\s\S]*?\}\);[\s\S]*?\}/, 
\export function createAppointment(data) {
  return apiFetch('/api/appointments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}\
);
fs.writeFileSync('frontend/src/api.js', code);
