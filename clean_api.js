const fs = require('fs');

const apiPath = 'frontend/src/api.js';
let content = fs.readFileSync(apiPath, 'utf8');

content = content.replace(
  /export function updateLecturerAvailability[\s\S]*?\}\n/g,
  ""
);

content = content.replace(
  /export function toggleSlotAvailability[\s\S]*?\}\n/g,
  ""
);

content = content.replace(
  /export function createSlot\(data\) \{\n  return apiFetch\('\/api\/availability\/slot', \{\n    method: 'POST',\n    body: JSON.stringify\(data\),\n  \}\);\n\}/,
  "export function createSlot(lecturerId, data) {\n  return apiFetch('/api/availability/lecturer/' + lecturerId + '/slot', {\n    method: 'POST',\n    body: JSON.stringify(data),\n  });\n}"
);

if (!content.includes('export function blockSlot')) {
    content += "\nexport function blockSlot(slotId, reason) {\n  return apiFetch('/api/availability/slot/' + slotId + '/block', {\n    method: 'PATCH',\n    body: JSON.stringify({ reason }),\n  });\n}\n";
}

fs.writeFileSync(apiPath, content, 'utf8');
