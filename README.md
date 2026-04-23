# UniLink — Lecturer Appointment Booking System

A full-stack web application that streamlines academic consultation scheduling between students and lecturers. Built for the ITPM module.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router 7, STOMP.js + SockJS |
| Backend | Spring Boot 3.4.1 (Java 17), Spring Data JPA |
| Database | MySQL 8 |
| Real-time | WebSocket (STOMP over SockJS) |
| Email | Gmail SMTP (Spring Mail) |
| AI | Google Gemini API (chat summaries) |
| Build | Maven (backend), Create React App (frontend) |

---

## Features

- **Authentication** — Email/password login, role-based access (STUDENT / LECTURER / ADMIN), email-based password reset
- **Appointment Booking** — Students book slots with lecturers; status flow: PENDING → CONFIRMED → COMPLETED
- **Availability Management** — Lecturers set a weekly grid (Mon–Sun, 8 AM–6 PM, 30-min slots)
- **Real-time Chat** — WebSocket chat tied to confirmed appointments, typing indicators, read receipts, pinned messages
- **AI Chat Summaries** — Gemini API generates conversation summaries
- **Bug Reporting** — Users report issues with severity levels; admin manages them
- **Canned Responses** — Lecturers save quick-reply templates
- **Do Not Disturb** — Lecturers toggle DND with an auto-reply message
- **Admin Panel** — User management and bug report dashboard

---

## Project Structure

```
UniLink/
├── backend/backend/        # Spring Boot application
│   ├── src/main/java/      # Controllers, Services, Repositories, Models, DTOs
│   ├── src/main/resources/ # application.properties, email templates
│   └── pom.xml
├── frontend/               # React application
│   ├── src/
│   │   ├── api/            # Axios API client
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   └── pages/          # Page-level components
│   └── package.json
├── SQL/                    # Database schema and migration scripts
└── docs/                   # Project documentation
```

---

## Getting Started

### Prerequisites
- Java 17+
- Node.js 18+
- MySQL 8 running on `localhost:3306`

### 1. Database Setup

```sql
CREATE DATABASE unilink;
```

Run the schema from `SQL/unilink_schema.sql`.

### 2. Backend

```bash
cd backend/backend
./mvnw spring-boot:run
# Runs on http://localhost:8082
```

### 3. Frontend

```bash
cd frontend
npm install
npm start
# Runs on http://localhost:3000
```

---

## Team

| Student ID | Name | Module |
|---|---|---|
| IT23761650 | D.V.S. Madhubhashini | Authentication & Booking Engine |
| IT23765542 | D.V.N. Wasana | Lecturer & Slot Management |
| IT23681156 | N M Korala | Dashboard, Notifications & Analytics |

---

## License

Developed for educational purposes — ITPM module.
