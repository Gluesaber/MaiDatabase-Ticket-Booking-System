# Developer Setup Guide — NoLife Ticket

This document is the authoritative reference for setting up the project locally for development.
It is written to be unambiguous and machine-readable. Follow every step in order.

---

## 1. Prerequisites

Install all of the following before proceeding.

| Tool | Required Version | Notes |
|---|---|---|
| PostgreSQL | 15 or later (17 recommended) | Must be running as a service on port 5432 |
| Java JDK | 17 or later (21 LTS recommended) | Backend compiles to Java 17 bytecode |
| Apache Maven | 3.9 or later | Used to build and run the Spring Boot backend |
| Node.js | 20 or later (LTS) | Required by Vite 8 and TypeScript 6 |
| npm | 10 or later | Bundled with Node.js 20 |
| Git | Any recent version | To clone the repository |

Verify each tool is on your PATH before continuing:

```bash
psql --version
java -version
mvn -version
node -version
npm -version
git --version
```

---

## 2. Clone the Repository

```bash
git clone https://github.com/Nuggetkub/Database-Ticket-Booking-System.git
cd Database-Ticket-Booking-System
```

All commands from this point forward are run from the repository root unless stated otherwise.

---

## 3. Database Setup

### 3.1 Create the database

Connect to PostgreSQL as the `postgres` superuser and create the database:

```bash
psql -U postgres -c "CREATE DATABASE ticketing;"
```

### 3.2 Apply the schema

```bash
psql -U postgres -d ticketing -f ddl.sql
```

This creates all tables, enums, indexes, triggers, and functions.
**The backend will refuse to start if this step is skipped** (`ddl-auto: validate` is set).

### 3.3 Load seed data

```bash
psql -U postgres -d ticketing -f seed.sql
```

This inserts venues, events, showtimes, tiers, and user accounts needed for development.

### 3.4 (Optional) Load demo booking logs

```bash
psql -U postgres -d ticketing -f seed_descriptions_and_bookings.sql
```

Adds event descriptions and 200 historical bookings so the admin overview and reports
dashboards display meaningful data instead of empty charts.

### 3.5 Credentials

The backend is pre-configured to connect with:

| Setting | Value |
|---|---|
| Host | `localhost` |
| Port | `5432` |
| Database | `ticketing` |
| Username | `postgres` |
| Password | `postgres` |

If your local PostgreSQL uses different credentials, edit
`ticketing/src/main/resources/application.yml` before starting the backend:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/ticketing
    username: postgres   # change this
    password: postgres   # change this
```

---

## 4. Backend (Spring Boot)

### 4.1 Navigate to the backend directory

```bash
cd ticketing
```

### 4.2 Start the development server

```bash
mvn spring-boot:run
```

Maven will download dependencies on the first run (this takes a few minutes).
The backend is ready when you see a log line containing `Started` and port `8080`.

**Base URL:** `http://localhost:8080/api`

### 4.3 Key configuration (`application.yml`)

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/ticketing
    username: postgres
    password: postgres
  jpa:
    hibernate:
      ddl-auto: validate        # schema must exist; Hibernate will NOT create tables
    open-in-view: false

app:
  jwt:
    secret: bXlzdXBlcnNlY3JldGtleWZvcmp3dGF1dGhlbnRpY2F0aW9u
    expiration-ms: 86400000     # 24-hour token lifetime
```

Do **not** change `ddl-auto` to `create` or `create-drop` in a shared environment —
that would wipe the database.

### 4.4 Build a JAR (production)

```bash
mvn clean package -DskipTests
java -jar target/ticketing-0.0.1-SNAPSHOT.jar
```

---

## 5. Frontend (React + Vite)

Open a **new terminal**. The backend must already be running.

### 5.1 Navigate to the frontend directory

```bash
cd ticketing-ui
```

### 5.2 Install dependencies

```bash
npm install
```

### 5.3 Start the development server

```bash
npm run dev
```

**URL:** `http://localhost:5173`

Hot-module replacement (HMR) is enabled — edits to `.tsx`/`.ts` files reload instantly.

### 5.4 API base URL

The frontend calls the backend at `http://localhost:8080/api` (hardcoded in
`src/services/ApiService.ts`, line 12). If you change the backend port, update that
constant:

```typescript
const BASE = 'http://localhost:8080/api';
```

### 5.5 Other npm scripts

| Script | Command | Purpose |
|---|---|---|
| Type-check | `npm run build` | Runs `tsc -b` then Vite build — catches all TypeScript errors |
| Lint | `npm run lint` | ESLint with TypeScript rules |
| Preview build | `npm run preview` | Serves the production build locally |

---

## 6. Test Accounts

All accounts use password: `password`

| Role | Email | Access |
|---|---|---|
| Admin | admin@nugget.com | Everything, including reports and user management |
| Organizer | wiroj@nugget.com | Create/edit/delete own events and showtimes |
| Organizer | siriporn@nugget.com | Create/edit/delete own events and showtimes |
| Customer | alice@example.com | Browse, book, pay, view history |
| Customer | bob@example.com | Browse, book, pay, view history |

Additional customer accounts: `charlie@example.com`, `diana@example.com`,
`edward@example.com`, `fiona@example.com`, `george@example.com`, `helen@example.com`,
`ivan@example.com` — all use password `password`.

---

## 7. Architecture Overview

```
Browser (React SPA)
  └─ HTTP/JSON ──► Spring Boot REST API (:8080)
                       ├─ Spring Security (JWT Bearer token)
                       ├─ JPA / Hibernate 6
                       └─ PostgreSQL (:5432)
```

### Authentication flow

1. `POST /api/auth/login` returns a JWT (24-hour lifetime).
2. The token is stored in `localStorage` (key: `token`).
3. Every subsequent request includes `Authorization: Bearer <token>`.
4. The backend validates the token via `JwtAuthFilter` (Spring Security filter chain).

### Role system

Three roles are stored in the `roles` table and enforced server-side:

| Role | Database value | Permissions |
|---|---|---|
| `admin` | `admin` | All endpoints |
| `organizer` | `organizer` | Own events + showtimes, venue reads |
| `customer` | `customer` | Public reads, bookings, payments |

### Key backend packages

| Package | Responsibility |
|---|---|
| `controller/` | REST endpoints (`@RestController`) |
| `service/` | Business logic interfaces |
| `service/impl/` | Business logic implementations |
| `entity/` | JPA-mapped database tables |
| `repository/` | Spring Data JPA repositories |
| `specification/` | JPA Criteria API for dynamic event search filters |
| `dto/` | Request/response record classes |
| `security/` | JWT filter, user details, security config |

### Key frontend files

| File | Responsibility |
|---|---|
| `src/App.tsx` | Root component, client-side routing (state machine, not a router library) |
| `src/services/ApiService.ts` | All HTTP calls; maps backend shapes to frontend types |
| `src/context/AuthContext.tsx` | JWT storage, user state, login/logout |
| `src/types.ts` | Shared TypeScript interfaces |
| `src/pages/EventListPage.tsx` | Public browse + filter + booking entry point |
| `src/pages/OrganizerDashboardPage.tsx` | Event/showtime CRUD for organizers |
| `src/pages/AdminOverviewPage.tsx` | Admin stats dashboard |
| `src/pages/AdminReportsPage.tsx` | Admin analytics charts (Recharts) |
| `src/components/SeatSelection.tsx` | Interactive seat map |
| `src/components/FilterBar.tsx` | Search and filter UI |

---

## 8. Database Schema Summary

Key tables and their relationships:

```
users ──── roles
  │
  └──► bookings ──► tickets ──► tickettiers ──► showtimes ──► events
         │                                           │
         └──► payments                           venues
```

| Table | Description |
|---|---|
| `users` | Accounts; `role_id` FK to `roles` |
| `roles` | `admin`, `organizer`, `customer` |
| `events` | Event metadata (title, description, rating, tags, thumbnail) |
| `eventtypes` | Tag definitions (Concert, Musical, Sport, etc.) |
| `event_type_map` | Many-to-many: events ↔ eventtypes |
| `venues` | Venue name, location, capacity |
| `showtimes` | Event + venue + schedule + ticket-per-person limit |
| `tickettiers` | Seat tiers per showtime (name, price, total capacity) |
| `bookings` | One booking per transaction; status: PENDING/CONFIRMED/CANCELLED/EXPIRED |
| `tickets` | One row per seat; status: RESERVED/CONFIRMED/CANCELLED |
| `payments` | One payment per booking; amount must equal sum of non-cancelled ticket prices |

### Important database triggers

| Trigger | Table | Rule enforced |
|---|---|---|
| `trg_check_seat_uniqueness` | `tickets` | Seat code must be unique per showtime among non-CANCELLED tickets |
| `trg_check_payment_amount` | `payments` | Payment amount must equal the sum of non-CANCELLED ticket prices for the booking |
| `trg_check_tier_capacity` | `tickettiers` | Sum of all tier `total_amount` values cannot exceed the venue's capacity |

---

## 9. Common Development Tasks

### Add a new REST endpoint

1. Add the method to the service interface in `service/`.
2. Implement it in `service/impl/`.
3. Add the `@GetMapping`/`@PostMapping` etc. to the relevant `controller/`.
4. If a new DTO is needed, add a record class to `dto/`.
5. Update `ApiService.ts` in the frontend to call the new endpoint.

### Add a new page to the frontend

1. Create `src/pages/NewPage.tsx`.
2. Add the page name to the `Page` type union in `App.tsx`.
3. Add a route case in `App.tsx`'s render switch.
4. Navigate to it with `onNavigate('new-page')`.

### Change the JWT secret or expiry

Edit `ticketing/src/main/resources/application.yml`:

```yaml
app:
  jwt:
    secret: <base64-encoded-secret-minimum-32-bytes>
    expiration-ms: 86400000   # milliseconds; 86400000 = 24 hours
```

### Run only the database (no Docker for app layers)

If you have PostgreSQL installed locally (the recommended dev setup), just ensure the
`postgresql` service is running. No Docker is required for local development.

---

## 10. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Backend fails to start: `Schema-validation: missing table` | DDL not applied | Run `psql -U postgres -d ticketing -f ddl.sql` |
| Backend fails to start: `Connection refused` on port 5432 | PostgreSQL not running | Start the PostgreSQL service |
| Frontend shows blank screen / network errors | Backend not running | Start the backend first, then the frontend |
| `401 Unauthorized` on all API calls | JWT expired or missing | Log out and log in again; check `localStorage.getItem('token')` in browser devtools |
| `403 Forbidden` on admin/organizer endpoints | Wrong role | Use the correct test account for the operation |
| Currency symbol renders as `เธฟ` | File saved with Windows-874 encoding | Always read/write source files with explicit UTF-8 encoding; never use PowerShell `Set-Content` without `-Encoding utf8NoBOM` on Thai-locale Windows |
| Port 8080 already in use | Another process on that port | Kill the process or change `server.port` in `application.yml` |
| Port 5173 already in use | Another Vite instance | Stop the other instance or run `npm run dev -- --port 5174` |
