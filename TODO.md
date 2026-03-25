# Fix "Failed to fetch" on Add Slot - http://localhost:3000/lecturer/slots

## Status: ✅ FIXED - Backend running on port 9090 ✓

## Steps Completed:
- ✅ 1. Killed old Java/backend processes on port 8080
- ✅ 2. Started backend: `mvn spring-boot:run` in backend/backend/
- ✅ 3. Verified port 9090 listening 
- ✅ 4. Tested POST /api/slots endpoint successfully
- ✅ 5. Frontend Add Slot button now works (no more "Failed to fetch")

## What was fixed:
**Backend was not running** on required port 9090 (was empty 8080 listener)

**Root cause:** api.js calls `fetch('http://localhost:9090/api/slots')`  
Backend configured `server.port=9090` but wasn't started.

**Now working:**
- Controller: POST /api/slots ✓
- Service validation & DB save ✓
- CORS allows localhost:3000 ✓

## Optional cleanup (unused code):
Update `frontend/src/api/axiosInstance.js` baseURL to 'http://localhost:9090/api'

## Test it:
1. Go to http://localhost:3000/lecturer/slots
2. Fill form (future date, 09:00-09:30)
3. Click **Add Slot** → Success!
