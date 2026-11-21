# MentorLagbe Server

REST API for MentorLagbe, a tuition and mentorship platform connecting students
with tutors. Built with Express and MongoDB, secured with JWT and role-based
middlewares, with Stripe Checkout for Pro plan payments.

## Live Links
- Live API: https://mentorlagbe-server-shahed.vercel.app
- Live site (client): https://mentorlagbe-client-shahed.vercel.app
- Client repo: https://github.com/abdullah-al-shahed/mentorlagbe-client.git

## Admin Credentials (for testing)
| Role | Email | Password |
|---|---|---|
| Admin | mdadmin@gmail.com | mdadmiN-2026 |
| Tutor | mdtutor@gmail.com | mdtutoR-2026 |

## Key Features
- JWT verification with role middlewares: verifyToken, verifyStudent, verifyTutor, verifyAdmin
- Tuitions API with server-side search, filters (subject, class level, mode) and pagination
- Admin approval flow (pending / approved / rejected)
- Free plan limit: 2 tuition posts, Pro plan unlimited
- Applications API with duplicate prevention and tutor accept/reject
- Stripe Checkout session creation and payment verification
- Dashboard stats endpoints for student, tutor and admin
- Seed script with 12 realistic approved tuitions

## API Routes
| Method | Route | Access |
|---|---|---|
| GET | /tuitions, /tuitions/filters, /tuitions/:id | Public |
| POST | /tuitions | Tutor |
| PATCH / DELETE | /tuitions/:id, /tuitions/:id/toggle | Tutor (owner) |
| PATCH | /tuitions/:id/approval | Admin |
| POST | /applications | Student |
| GET | /applications/mine | Student |
| DELETE | /applications/:id | Student (pending only) |
| GET | /applications/tutor | Tutor |
| PATCH | /applications/:id/status | Tutor |
| GET / PATCH | /users/me | Any logged-in user |
| GET | /users | Admin |
| PATCH | /users/:id/role | Admin |
| POST | /payments/create-checkout-session, /payments/verify | Logged-in user |
| GET | /payments | Admin |
| GET | /stats/public, /stats/student, /stats/tutor, /stats/admin | Public / role-based |

## Tech Stack
Node.js, Express, MongoDB, JWT, Stripe

## npm Packages
express, cors, dotenv, mongodb, jsonwebtoken, stripe

## Run Locally
1. `npm install`
2. `npm run dev`
3. Optional: `npm run seed` to insert demo tuitions

## Environment Variables
PORT, MONGODB_URI, DB_NAME, JWT_SECRET, STRIPE_SECRET_KEY, CLIENT_URL