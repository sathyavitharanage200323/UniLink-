# 📚 UniLink  (Lecturer Appointment Booking System )

A full-stack web application developed for the **ITPM module** to streamline the process of **booking academic consultation appointments between students and lecturers**.  
The system ensures secure authentication, structured slot management, intelligent booking validation, and automated notifications.

---

# 🚀 System Overview

The **Lecturer Appointment Booking System** is designed using a **modular architecture**, where each component handles a core system responsibility.

Instead of dividing work by simple CRUD operations, the system is structured into **four main layers**:

1. **Authentication & User Management (Security Layer)**
2. **Lecturer & Slot Management (Supply Layer)**
3. **Booking & Appointment Engine (Core Logic)**
4. **Dashboard, Notifications & Analytics (Intelligence Layer)**

This architecture ensures scalability, security, and maintainability.

---

# 🏗 System Architecture

```
Client (Frontend)
        │
        ▼
Authentication Middleware (JWT)
        │
        ▼
Business Logic Layer
 ├── User Management
 ├── Slot Management
 ├── Booking Engine
 └── Notification & Analytics
        │
        ▼
Database (MongoDB / SQL)
```

---

# 👥 Team Responsibilities

## 🔐 Authentication & User Management (Security Layer)

**Member:**  
👤 IT23761650 - **D.V.S. Madhubhashini**

### Responsibilities
- Student registration
- Login system for **students & lecturers**
- Password encryption
- Role-based access control (RBAC)
- Profile management
- Account deactivation

### Security Features
- JWT Authentication
- Session management
- Middleware route protection
- Unauthorized access prevention

⚠️ **Importance**

If authentication fails, the entire system becomes insecure.  
This module ensures **only authorized users can access system resources**.

---

## 👨‍🏫 Lecturer & Slot Management (Supply Side)

**Member:**  
👤 IT23765542 - **D.V.N. Wasana**

### Responsibilities

- Lecturer profile management
- Create lecturer availability slots
- Edit / block time slots
- View daily lecturer schedule
- Prevent overlapping slots

### Core Rules

- ❌ No overlapping slots allowed
- ✔ Slot capacity validation
- ✔ Slot status management

### Slot Status Types

- `OPEN`
- `FULL`
- `BLOCKED`

⚠️ **Importance**

If slot logic fails, the system will allow **double bookings and scheduling conflicts**.

---

## 📅 Booking & Appointment Engine (Core Logic)

**Member:**  
👤 IT23761650 - **D.V.S. Madhubhashini**

### Responsibilities

- Students book available lecturer slots
- Prevent double booking
- Appointment lifecycle management

### Appointment Status Flow

```
Pending → Confirmed → Completed → Cancelled
```

### Features

- Booking validation
- Conflict detection
- Rescheduling appointments
- Cancellation rules enforcement

⚠️ **Importance**

This module acts as the **core brain of the system**, enforcing business rules.

---

## 📊 Dashboard, Notifications & Analytics (Intelligence Layer)

**Member:**  
👤 IT23681156 - **N M Korala**

### Responsibilities

- Lecturer dashboard
- Student booking history
- Email notifications
- Booking analytics

### Dashboard Features

- Today's appointments
- Upcoming meetings
- Booking statistics
- No-show tracking

### Notification System

Automated email alerts for:

- Booking confirmation
- Appointment cancellation
- Appointment updates

### Optional Feature

📧 **Reminder email** sent **1 hour before the meeting**

---

# 🧩 Final Module Breakdown

| Member | Module | Responsibility Level |
|------|------|------|
| IT23761650 - D.V.S. Madhubhashini | Authentication & Roles | Security Foundation |
| IT23765542 - D.V.N. Wasana | Lecturer & Slot Management | Scheduling Infrastructure |
| IT23761650 - D.V.S. Madhubhashini | Booking & Appointment Engine | Core Business Logic |
| IT23681156 - N M Korala | Dashboard & Notifications | System Intelligence |

---

# 🛠 Technology Stack

### Frontend
- React.js
- HTML5
- CSS3
- JavaScript

### Backend
- Node.js
- Express.js

### Database
- MongoDB

### Authentication
- JWT (JSON Web Token)
- Bcrypt password hashing

### Notifications
- Nodemailer

---

# 🔑 Key System Features

✔ Secure authentication system  
✔ Role-based access control  
✔ Lecturer availability management  
✔ Smart booking validation  
✔ Conflict prevention  
✔ Appointment lifecycle tracking  
✔ Email notification system  
✔ User dashboards with analytics

---

# 📦 Project Setup

### 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/itpm-appointment-system.git
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Run Backend

```bash
npm start
```

### 4️⃣ Run Frontend

```bash
npm run dev
```

---

# 📌 Future Improvements

- Mobile application support
- Video meeting integration
- AI-based schedule suggestions
- SMS notification system
- Admin analytics panel

---

# 📜 License

This project is developed for **educational purposes for the ITPM module**.

---

# ⭐ Project Vision

The goal of this system is to **digitize and simplify lecturer consultation scheduling**, eliminating manual coordination and reducing scheduling conflicts.
