# Git Push Guide - UniLink Project

## Summary of Changes Made

### New Features:
1. **Lecturer Availability Management System** - Weekly grid interface for managing availability
2. **Appointment Reschedule & Delay** - Lecturers can reschedule pending appointments or delay confirmed meetings
3. **Sample Sri Lankan University Data** - 5 lecturers, 10 students, appointments, and availability slots

### Files Modified:
- Backend: AppointmentController, AppointmentService, application.properties
- Frontend: LecturerSchedulePage, BookingPage, App.js, and more

### New Files Created:
- Backend: AvailabilityController, AvailabilityService, AvailabilitySlot model, data.sql
- Frontend: LecturerAvailabilityPage, LecturerSchedulePage, BookingPage (with CSS)
- Documentation: AVAILABILITY_SYSTEM_SUMMARY.md, SAMPLE_DATA_SUMMARY.md

---

## Option 1: Push to a New Feature Branch (RECOMMENDED)

This is the safest approach - create a new branch for your features.

### Step 1: Create and switch to a new branch
```bash
git checkout -b feature/reschedule-and-availability
```

### Step 2: Add all your changes
```bash
git add .
```

### Step 3: Commit your changes with a descriptive message
```bash
git commit -m "feat: Add reschedule/delay appointments and availability management

- Implemented lecturer availability management with weekly grid interface
- Added reschedule functionality for pending appointments
- Added delay functionality for confirmed appointments (15/30/45/60 min)
- Created sample Sri Lankan university data (5 lecturers, 10 students)
- Fixed logout issue when using reschedule/delay features
- Added backend endpoint for updating appointment times
- Improved error handling and logging"
```

### Step 4: Push to GitHub
```bash
git push -u origin feature/reschedule-and-availability
```

### Step 5: Create a Pull Request
1. Go to your GitHub repository
2. You'll see a prompt to create a Pull Request for your new branch
3. Click "Compare & pull request"
4. Add a description of your changes
5. Click "Create pull request"

---

## Option 2: Push Directly to Main Branch (Use with Caution)

Only use this if you're working alone or have permission to push directly to main.

### Step 1: Add all your changes
```bash
git add .
```

### Step 2: Commit your changes
```bash
git commit -m "feat: Add reschedule/delay appointments and availability management"
```

### Step 3: Pull latest changes from remote (to avoid conflicts)
```bash
git pull origin main
```

### Step 4: Push to main
```bash
git push origin main
```

---

## Option 3: Push to an Existing Feature Branch

If you want to add to an existing branch like "Appointment-Booking":

### Step 1: Switch to the existing branch
```bash
git checkout Appointment-Booking
```

### Step 2: Pull latest changes
```bash
git pull origin Appointment-Booking
```

### Step 3: Add and commit your changes
```bash
git add .
git commit -m "feat: Add reschedule/delay functionality and availability management"
```

### Step 4: Push to the branch
```bash
git push origin Appointment-Booking
```

---

## Useful Git Commands

### Check current status
```bash
git status
```

### See what branch you're on
```bash
git branch
```

### See all branches (including remote)
```bash
git branch -a
```

### Undo changes to a specific file (before commit)
```bash
git restore <filename>
```

### View commit history
```bash
git log --oneline
```

### Create a new branch without switching
```bash
git branch <branch-name>
```

### Switch to a different branch
```bash
git checkout <branch-name>
```

---

## Recommended Approach for Your Project

Based on your existing branches, I recommend:

1. **Create a new feature branch** called `feature/reschedule-and-availability`
2. **Commit all your changes** to this branch
3. **Push to GitHub**
4. **Create a Pull Request** to merge into main

This keeps your work organized and allows for code review before merging.

---

## Quick Commands (Copy & Paste)

```bash
# Create new branch and switch to it
git checkout -b feature/reschedule-and-availability

# Add all changes
git add .

# Commit with message
git commit -m "feat: Add reschedule/delay appointments and availability management

- Implemented lecturer availability management with weekly grid interface
- Added reschedule functionality for pending appointments
- Added delay functionality for confirmed appointments
- Created sample Sri Lankan university data
- Fixed logout issue when using reschedule/delay features"

# Push to GitHub
git push -u origin feature/reschedule-and-availability
```

After pushing, go to GitHub and create a Pull Request!

---

## Troubleshooting

### If you get "Permission denied" error:
Make sure you're authenticated with GitHub. You may need to:
- Set up SSH keys, or
- Use a Personal Access Token for HTTPS

### If you get merge conflicts:
```bash
git pull origin main
# Resolve conflicts in your editor
git add .
git commit -m "Resolve merge conflicts"
git push
```

### If you want to see what will be pushed:
```bash
git diff origin/main
```

---

## Notes

- The `.vscode/` folder is in your untracked files - you may want to add it to `.gitignore`
- Make sure your backend server is stopped before committing (no need to commit running processes)
- The `data.sql` file contains sample data - make sure this is what you want to commit

---

Good luck with your push! 🚀
