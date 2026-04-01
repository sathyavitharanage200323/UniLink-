const fs = require('fs');

const frontendPath = 'frontend/src/pages/SlotCalendarPage.jsx';
let content = fs.readFileSync(frontendPath, 'utf8');

content = content.replace(
  /function getStatus\(slotDate\) \{[\s\S]*?return 'Past';\n\}/,
  "function getStatus(slot) {\n  const now = new Date();\n  const slotD = new Date(\\T\\);\n  const slotE = new Date(\\T\\);\n  if (slot.status === 'BLOCKED') return 'BLOCKED';\n  if (slot.status === 'BOOKED') return 'BOOKED';\n  if (slotE < now) return 'EXPIRED';\n  if (slotD <= now && now <= slotE) return 'ONGOING';\n  return slot.status || 'AVAILABLE';\n}"
);

// We must also update references of getStatus(slot.slotDate) to getStatus(slot)
// Since there's multiple, let's just do a mass replace of "getStatus(slot.slotDate)" to "getStatus(slot)" and "getStatus(viewingSlot.slotDate)" to "getStatus(viewingSlot)" etc.
content = content.replace(/getStatus\(slot\.slotDate\)/g, 'getStatus(slot)');
content = content.replace(/getStatus\(viewingSlot\.slotDate\)/g, 'getStatus(viewingSlot)');

// Let's also patch the getSlotAccentClass(slot.slotDate) if possible, let's review CSS classes
content = content.replace(
  /getSlotAccentClass\(slot\.slotDate\)/g,
  "getStatus(slot).toLowerCase()"
);

// We need to fix pastSlots, upcomingSlots, todaySlots logic slightly.
content = content.replace(
  /const upcomingSlots = slots\.filter\(\(slot\) => getStatus\(slot\) === 'Upcoming'\)\.length;/g,
  "const upcomingSlots = slots.filter((slot) => getStatus(slot) === 'AVAILABLE' || getStatus(slot) === 'BOOKED').length;"
);
content = content.replace(
  /const pastSlots = slots\.filter\(\(slot\) => getStatus\(slot\) === 'Past'\)\.length;/g,
  "const pastSlots = slots.filter((slot) => getStatus(slot) === 'EXPIRED').length;"
);

// Add blockSlot to api if needed, though getSlots, createSlot, updateSlot, deleteSlot is there. We can keep it simple.

fs.writeFileSync(frontendPath, content, 'utf8');
