const BASE_URL = 'http://localhost:9090/api/preferences';

export async function getLecturerPreferences(lecturerId) {
  const response = await fetch(`${BASE_URL}/${lecturerId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch lecturer preferences');
  }

  return response.json();
}

export async function saveLecturerPreferences(preferences) {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(preferences),
  });

  if (!response.ok) {
    throw new Error('Failed to save lecturer preferences');
  }

  return response.json();
}