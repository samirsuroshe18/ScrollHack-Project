# AlumniNest: design

AlumniNest connects current students with alumni of their institute. Alumni
share success stories and job openings and offer one-to-one mentorship.
Students read those posts, search for a mentor, request mentorship and chat
with the mentor once the request is accepted.

This document describes the design that takes the hackathon prototype to a
working application.

## Goals

- Every screen reachable from the UI works end to end against the database.
- Two roles, `student` and `alumni`, each with its own dashboard.
- Sign-up with email verification, login, logout and password reset.
- The application runs locally with one command per side (backend, frontend).

## Out of scope

- Payments. Mentorship is free; a request replaces the paid subscription.
- Hosting and production deployment.
- The "Institute" and "Survey" sections. They are removed from the sidebars.
- Admin roles and Google account linking.

## Architecture

```
Frontend (React, Vite, Tailwind)        Backend (Express)            MongoDB
  pages + dashboards   -- /api/v1 -->    REST controllers   ----->    User
  auth context         <-- cookies --    JWT auth middleware          Post
  chat panel           <- socket.io ->   Socket.io server             Mentorship
                                                                       Message
```

In development the Vite dev server proxies `/api` and `/socket.io` to the
backend, so the browser sees one origin and the auth cookies need no
cross-site configuration.

## Data model

### User

| Field | Type | Notes |
|---|---|---|
| `userName` | String | required, at most 80 characters |
| `email` | String | required, unique, lowercase |
| `password` | String | bcrypt hash, set in a pre-save hook |
| `phoneNo` | String | at most 20 characters |
| `role` | String | `student` or `alumni`, required |
| `state`, `district` | String | chosen at registration, at most 80 characters each |
| `isVerified` | Boolean | false until the email link is opened |
| `profile.profession` | String | alumni |
| `profile.field` | String | field of study or expertise |
| `profile.passingYear` | Number | alumni |
| `profile.workplace` | String | alumni |
| `profile.skills` | [String] | alumni: skills; students: interests; at most 20, each at most 40 characters |
| `profile.location` | String | |
| `profile.availability` | String | alumni: when they can mentor |
| `profile.bio` | String | at most 1000 characters; the other profile text fields at most 120 |
| `refreshToken` | String | |
| `tokenVersion` | Number | raised on logout and password reset; a token carrying an older value is refused |
| `verifyToken`, `verifyTokenExpiry` | String, Date | email verification |
| `forgotPasswordToken`, `forgotPasswordTokenExpiry` | String, Date | password reset |

### Post

| Field | Type | Notes |
|---|---|---|
| `author` | ObjectId → User | must be an alumnus |
| `type` | String | `success_story` or `job` |
| `content` | String | required, 1 to 2000 characters |
| timestamps | | |

### Mentorship

| Field | Type | Notes |
|---|---|---|
| `student` | ObjectId → User | the requester |
| `mentor` | ObjectId → User | an alumnus |
| `status` | String | `pending`, `accepted` or `declined` |
| timestamps | | |

A unique index on `(student, mentor)` prevents duplicate requests.

### Message

| Field | Type | Notes |
|---|---|---|
| `mentorship` | ObjectId → Mentorship | indexed |
| `sender` | ObjectId → User | |
| `text` | String | required, 1 to 1000 characters |
| timestamps | | |

## REST API

All routes are under `/api/v1`. Responses use the existing `ApiResponse`
shape (`statusCode`, `data`, `message`). Routes marked *auth* require a valid
access token cookie.

### Accounts

| Method and path | Access | Purpose |
|---|---|---|
| `POST /users/register` | public | Create an account and send the verification email |
| `POST /users/login` | public | Verify credentials, set access and refresh cookies |
| `GET /users/logout` | auth | Clear the cookies and the stored refresh token, and end every session and chat connection of the user |
| `GET /users/me` | auth | Return the current user |
| `PATCH /users/me` | auth | Update name, phone and profile fields |
| `POST /users/forgot-password` | public | Send the password reset email |
| `GET /verify/verify-email?token=` | public | Mark the account verified |
| `GET /verify/reset-password?token=` | public | Check that a reset token is valid |
| `POST /verify/verify-password?token=` | public | Set a new password and end every open session of the user |

Login is refused for unverified accounts, and a fresh verification email is
sent instead. Email links point at frontend routes, which call the `verify`
endpoints and show the result.

### Posts

| Method and path | Access | Purpose |
|---|---|---|
| `GET /posts?type=` | auth | List posts, newest first, optionally by type |
| `POST /posts` | alumni | Create a success story or a job post |

### Mentors

| Method and path | Access | Purpose |
|---|---|---|
| `GET /mentors` | auth | List verified alumni |
| `GET /mentors/search?q=` | auth | Rank alumni against a free-text description |

Search splits the description into lowercase terms and drops terms shorter
than three characters and common stop words. Each alumnus scores 3 points per
term found in `skills`, 2 per term found in `profession` or `field`, and 1 per
term found in `location` or `workplace`. Alumni with a score above zero are
returned, highest first, limited to ten.

### Mentorships

| Method and path | Access | Purpose |
|---|---|---|
| `POST /mentorships` | student | Request mentorship from an alumnus |
| `GET /mentorships` | auth | List the caller's mentorships, either side |
| `PATCH /mentorships/:id` | mentor of that record | Accept or decline a pending request |
| `GET /mentorships/:id/messages` | participants | Message history, oldest first |

## Chat

Chat runs over Socket.io on the same HTTP server as the REST API.

- The handshake reads the access token cookie; unauthenticated sockets are
  rejected.
- `chat:join { mentorshipId }` adds the socket to that mentorship's room. It
  is refused unless the user is a participant and the status is `accepted`.
- `chat:send { mentorshipId, text }` saves a `Message` and emits `chat:message`
  with the saved message to the room.

History is loaded over REST when a conversation opens; the socket carries new
messages only.

## Frontend

### Routes

| Path | Page | Access |
|---|---|---|
| `/` | Landing page | public |
| `/login` | Login | public |
| `/register` | Register | public |
| `/verify-email` | Email verification result | public |
| `/forgot-password` | Request a reset link | public |
| `/reset-password` | Set a new password | public |
| `/student` | Student dashboard | student |
| `/alumni` | Alumni dashboard | alumni |

Protected routes send visitors who are not logged in to `/login`, and send a
user with the wrong role to their own dashboard.

### Shared pieces

- `api/client.js`: one axios instance with `baseURL: /api/v1` and credentials
  enabled.
- `context/AuthContext.jsx`: loads the current user from `GET /users/me` on
  start, and exposes `login`, `logout` and `refreshUser`.
- `components/ProtectedRoute.jsx`: the role check described above.
- `components/ChatPanel.jsx`: conversation list, message history and input,
  used by both dashboards.

### Dashboards

| Section | Student | Alumni |
|---|---|---|
| Profile | edit own profile | edit own profile |
| Success Story | read | read and post |
| Job Portal | read | read and post |
| Find Mentor | search and send a request | |
| Requests | | accept or decline |
| 1:1 Mentorship | chat with accepted mentors | chat with accepted students |

The in-memory `PostContext` is removed; posts come from the API. The existing
visual design, the preloader and the login captcha are kept.

## Error handling

- Controllers throw `ApiError`; the existing error middleware turns it into a
  JSON response with the status code and message.
- Request bodies are validated in the controllers; invalid input returns 400
  with a message naming the problem.
- The frontend shows the server's message next to the form or action that
  failed. A 401 from any request clears the auth state and returns the user to
  `/login`.

## Configuration

`Backend/.env` (not committed) holds:

| Key | Purpose |
|---|---|
| `MONGODB_URI` | database connection string |
| `PORT`, `SERVER_HOST` | where the API listens |
| `CORS_ORIGIN` | allowed frontend origin |
| `FRONTEND_URL` | base URL used in email links |
| `MAIL_HOST`, `EMAIL_PORT`, `MAIL_USER`, `MAIL_PASS` | SMTP settings |
| `ACCESS_TOKEN_SECRET`, `ACCESS_TOKEN_EXPIRY` | access token signing |
| `REFRESH_TOKEN_SECRET`, `REFRESH_TOKEN_EXPIRY` | refresh token signing |

`Backend/.env.example` lists the keys with empty values.

## Testing

Backend tests use Jest, Supertest and an in-memory MongoDB. The mail sender is
replaced with a stub.

- Accounts: register, verify, login refused before verification, login, me,
  logout, password reset.
- Posts: alumni can post, students cannot, listing and type filter.
- Mentor search: ranking order, stop words, no matches.
- Mentorships: request, duplicate request refused, only the mentor can accept,
  messages refused unless accepted.

The full flow is also checked by hand in the browser with two accounts.

## Demo data

`npm run seed` in `Backend/` creates verified sample alumni and students with
profiles, a few posts, and one accepted mentorship with messages. It only
touches accounts under the `@alumninest.demo` email domain, so it can be run
again safely.
