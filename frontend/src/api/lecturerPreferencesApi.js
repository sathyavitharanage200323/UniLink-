import { BACKEND_BASE_URL } from '../config';

const BASE_URL = `${BACKEND_BASE_URL}/api/preferences`;

async function readErrorMessage(response, fallbackMessage) {
  try {
    const json = await response.json();
    return json?.message || json?.error || JSON.stringify(json);
  } catch {
    const text = await response.text().catch(() => '');
    return text || fallbackMessage;
  }
}

export async function getLecturerPreferences(lecturerId) {
  const response = await fetch(`${BASE_URL}/${lecturerId}`);

  if (!response.ok) {
    const message = await readErrorMessage(response, 'Failed to fetch lecturer preferences');
    throw new Error(message);
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
    const message = await readErrorMessage(response, 'Failed to save lecturer preferences');
    throw new Error(message);
  }

  return response.json();
}