# Nugget Tickets — Database Ticket Booking System

A full-stack ticketing platform built with PostgreSQL, Spring Boot 3, and React.

## Tech Stack

| Layer | Technology |
|---|---|
| Database | PostgreSQL 17 |
| Backend | Java 23, Spring Boot 3, Spring Security 6 (JWT), JPA/Hibernate 6 |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Dev Tools | Docker Compose, Adminer |

---

## Getting Started

### Option A — Docker Compose (recommended)

Runs everything (database, backend, frontend) with one command.

**Prerequisites:** Docker Desktop

```bash
git clone https://github.com/Nuggetkub/Database-Ticket-Booking-System.git
cd Database-Ticket-Booking-System
docker compose up
```

| Service | URL |
|---|---|
| Frontend | http://localhost |
| Backend API | http://localhost:8080/api |
| Adminer (DB viewer) | http://localhost:8081 |

---

### Option B — Run Locally (manual)

**Prerequisites:** Java 23+, Maven, Node.js + npm, PostgreSQL

**1. Set up the database**

Create a PostgreSQL database named `ticketing`, then run:
```bash
psql -U postgres -d ticketing -f ddl.sql
psql -U postgres -d ticketing -f seed.sql
```

**2. Start the backend**
```bash
cd ticketing
mvn spring-boot:run
```
Backend runs at http://localhost:8080

**3. Start the frontend** (new terminal)
```bash
cd ticketing-ui
npm install
npm run dev
```
Frontend runs at http://localhost:5173

> Start the backend **before** the frontend.

---

## Project Structure

```
├── ddl.sql              # Database schema
├── seed.sql             # Sample data
├── docker-compose.yml   # Docker setup
├── ticketing/           # Spring Boot backend
│   └── src/main/java/com/ticketing/
│       ├── controller/  # REST endpoints
│       ├── service/     # Business logic
│       ├── entity/      # JPA entities
│       ├── repository/  # Data access
│       ├── security/    # JWT auth
│       └── dto/         # Request/response objects
└── ticketing-ui/        # React frontend
    └── src/
        ├── pages/       # Page components
        ├── components/  # Shared UI components
        ├── services/    # API calls
        └── types.ts     # TypeScript types
```

---

## Test Accounts

All accounts use password: `password`

| Role | Email |
|---|---|
| Admin | admin@nugget.com |
| Organizer | wiroj@nugget.com |
| Organizer | siriporn@nugget.com |
| Customer | alice@example.com |
| Customer | bob@example.com |

---

## Features

### Customer
- Browse events with filters (tag, price, date)
- Select seats on a venue layout map
- Book tickets (up to the per-person limit)
- 15-minute payment countdown after booking
- Pay via Credit Card, Debit Card, QR Code, Bank Transfer, or Wallet
- View booking history with payment status
- Cancel pending or confirmed bookings

### Organizer
- Create and manage their own events (title, duration, age rating, tags)
- Add showtimes with venue, schedule, and ticket tiers
- Edit event details and showtime settings
- Delete events/showtimes (active bookings are auto-cancelled)
- Venue double-booking prevention

### Admin
- Full access to all events and showtimes
- Manage venues (create, edit, delete)
- Manage user roles (promote/demote between admin, organizer, customer)
- Reports dashboard:
  - **Peak Sales Period** — hourly/daily ticket sales heatmap, filterable by event
  - **Top-Selling Province** — revenue by venue location
  - **Booking-to-Capacity** — fill rate per showtime with visual progress bars
  - **Top Events by Income** — events ranked by total revenue
  - **Top Events by Tickets Sold** — events ranked by ticket count

---

## Age Ratings

Events use MPAA ratings: `G`, `PG`, `PG-13`, `R`, `NC-17`

## API Base URL

```
http://localhost:8080/api
```

Key endpoints:

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Login |
| POST | `/auth/register` | Public | Register |
| GET | `/events` | Public | List all events |
| GET | `/events/search` | Public | Filter events |
| GET | `/events/mine` | Organizer/Admin | My events only |
| POST | `/bookings` | Customer | Create booking |
| POST | `/payments` | Customer | Pay for booking |
| GET | `/bookings/history` | Customer | Booking history |
| GET | `/admin/users` | Admin | List all users |
| PUT | `/admin/users/{id}/role` | Admin | Change user role |
| GET | `/admin/reports/peak-sales` | Admin | Peak sales report |
