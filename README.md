# AlumniNest

AlumniNest connects current students with alumni of their institute. Alumni
share success stories and job openings and offer one-to-one mentorship.
Students read those posts, search for a mentor, send a mentorship request and
chat with the mentor once the request is accepted.

The project started at the ScrollHack hackathon in September 2024.

## Features

- **Accounts:** sign-up as a student or an alumnus, email verification, login,
  logout and password reset.
- **Profiles:** profession, field, skills, location and availability for
  alumni; field of study and interests for students.
- **Posts:** alumni publish success stories and job openings; everyone can
  read them.
- **Mentor search:** students describe the mentor they need in plain words and
  get alumni ranked by how well their skills, profession, field and location
  match.
- **Mentorship requests:** a student requests a mentor; the alumnus accepts or
  declines.
- **Live chat:** one-to-one messaging between a student and their mentor, with
  history.

## Tech stack

| Part | Stack |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router, Axios, Socket.io client |
| Backend | Node.js, Express, MongoDB with Mongoose, JSON Web Tokens, Nodemailer, Socket.io |
| Tests | Jest, Supertest, in-memory MongoDB |

## Getting started

### Prerequisites

- Node.js 20 or newer
- A MongoDB connection string (local MongoDB or MongoDB Atlas)
- SMTP credentials for sending the verification and reset emails

### Setup

```bash
git clone https://github.com/samirsuroshe18/ScrollHack-Project.git
cd ScrollHack-Project

cd Backend
npm install
cp .env.example .env     # then fill in the values, see below

cd ../Frontend
npm install
```

### Environment variables

`Backend/.env`:

| Key | Purpose |
|---|---|
| `MONGODB_URI` | Database connection string |
| `PORT`, `SERVER_HOST` | Where the API listens (`3000`, `localhost`) |
| `CORS_ORIGIN` | Frontend origin (`http://localhost:5174`) |
| `FRONTEND_URL` | Base URL used in email links (`http://localhost:5174`) |
| `MAIL_HOST`, `EMAIL_PORT`, `MAIL_USER`, `MAIL_PASS` | SMTP settings |
| `ACCESS_TOKEN_SECRET`, `ACCESS_TOKEN_EXPIRY` | Access token signing, for example a long random string and `1d` |
| `REFRESH_TOKEN_SECRET`, `REFRESH_TOKEN_EXPIRY` | Refresh token signing, for example a long random string and `10d` |

### Run

Start the API and the web app in two terminals:

```bash
cd Backend
npm run dev
```

```bash
cd Frontend
npm run dev
```

Open <http://localhost:5174>. The web app proxies `/api` and `/socket.io` to
the API on port 3000.

### Demo data

```bash
cd Backend
npm run seed
```

This creates five alumni and three students with profiles, six posts, and a
mentorship with a short conversation. Every demo account uses the password
`Demo@123`, for example:

| Role | Email |
|---|---|
| Alumnus | `asha.alumni@alumninest.demo` |
| Student | `arjun.student@alumninest.demo` |

The script only removes and recreates accounts under `@alumninest.demo`, so it
can be run again at any time.

### Tests

```bash
cd Backend
npm test
```

The tests start their own in-memory database and never send email.

## Project structure

```
Backend/
  src/
    app.js            Express app, routes and error handling
    index.js          Starts the HTTP and Socket.io server
    socket.js         Chat events
    controller/       Request handlers
    middlewares/      Authentication and role checks
    models/           User, Post, Mentorship, Message
    routes/           Route definitions
    utils/            Mail sender, mentor search, helpers
    scripts/seed.js   Demo data
  tests/              API and chat tests
Frontend/
  src/
    api/              Axios client
    context/          Login state
    components/       Pages, dashboards and shared pieces
    data/             Static lists
docs/
  design.md           Design of the application
```

## API overview

All routes are under `/api/v1`.

| Area | Routes |
|---|---|
| Accounts | `POST /users/register`, `POST /users/login`, `GET /users/logout`, `GET /users/me`, `PATCH /users/me`, `POST /users/forgot-password` |
| Email links | `GET /verify/verify-email`, `GET /verify/reset-password`, `POST /verify/verify-password` |
| Posts | `GET /posts`, `POST /posts` |
| Mentors | `GET /mentors`, `GET /mentors/search?q=` |
| Mentorships | `POST /mentorships`, `GET /mentorships`, `PATCH /mentorships/:id`, `GET /mentorships/:id/messages` |

Chat uses the Socket.io events `chat:join`, `chat:send` and `chat:message`.
See [docs/design.md](docs/design.md) for details.

## Team

Built by Tanishq ([@TanishqMSD](https://github.com/TanishqMSD)),
Mohit ([@Mohitd45](https://github.com/Mohitd45)),
Samir Suroshe ([@samirsuroshe18](https://github.com/samirsuroshe18)) and
Vaibhav ([@V8ibhav](https://github.com/V8ibhav)).
