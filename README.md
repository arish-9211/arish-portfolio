# Arish Ahmad — MERN Portfolio

A responsive blue-and-mint portfolio built with MongoDB, Express, React, and Node.js. The header, footer, and admin brand use **Arish.**

## Included

- Resume-based profile, projects, skills, education, leadership, certifications, and coding profiles.
- Animated MERN diagram, project filters and details, mobile navigation, reduced-motion support.
- Downloadable original resume and email, GitHub, and LinkedIn links.
- Blog with private drafts and published posts.
- Password-protected admin studio to edit profile, projects, skills, journey, and posts.
- Contact inbox stored in MongoDB. Sending a message does not send an email notification.
- HttpOnly sessions, input validation, origin checks, rate limits, and concurrent-edit protection.

## Run the full MERN app

Requires Node.js 22.12 or newer and a running MongoDB instance (local or Atlas).

1. Open a terminal in this folder and run `npm ci`.
2. Copy `.env.example` to `.env`.
3. Set `MONGODB_URI` to your database connection string. Set `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` of at least 12 characters. Never commit `.env`.
4. Run `npm run build`, then `npm start`.
5. Open `http://localhost:4000`. Sign in at `/admin` with the credentials you configured.

For development, run `npm run dev:server` in one terminal and `npm run dev` in another. Open `http://127.0.0.1:5173`.

The first server start seeds MongoDB from `src/content.json`. Later restarts preserve edits. The downloaded resume is `public/Arish-Ahmad-Resume.pdf`; replace that file when your resume changes and rebuild.

## Preview versus full application

The hosted Sites preview contains the React frontend and resume. Sites runs Cloudflare Workers, so it cannot host this native Express/MongoDB backend unchanged. In this static preview, project exploration, navigation, resume downloads, and email links work; the admin and stored contact messages need the MERN server. The frontend uses the resume snapshot if the API is unavailable. Database-backed admin edits do not change that static snapshot.

To host the complete app, use a Node-capable server and MongoDB. Build with `npm ci && npm run build`, start with `npm start`, set `NODE_ENV=production`, and use HTTPS. Set `APP_ORIGIN` to the exact HTTPS site origin if using a reverse proxy. Secure cookies require HTTPS in production. Configure your reverse proxy to preserve the Host header. If enabling Express `trust proxy`, scope it to your trusted proxy topology; do not blindly trust forwarded IP headers. For multiple server replicas, use a shared rate-limit store.

## Deploy to Vercel

Import `arish-9211/arish-portfolio` with the repository root as the Root Directory. The checked-in configuration selects Vite, runs `npm run build`, serves `dist`, and routes `/api/*` to the Express function in `api/index.js`. `/admin` remains a frontend route. Use Node.js 22.12 or newer.

Before the production deployment, add these variables in Vercel's project settings:

| Variable | Value |
| --- | --- |
| `MONGODB_URI` | Hosted MongoDB connection string including the portfolio database name. A local `127.0.0.1` database cannot be used by Vercel. |
| `ADMIN_EMAIL` | Your admin sign-in email. |
| `ADMIN_PASSWORD` | A unique password of at least 12 characters. Mark it sensitive. |
| `NODE_ENV` | `production` |
| `APP_ORIGIN` | The exact public HTTPS origin, without a trailing slash, once the production domain is assigned. |

Mark the database connection string sensitive too. Keep secrets out of GitHub, frontend source, and any variable prefixed with `VITE_`. Apply production credentials only to Production; use a separate database and credentials for Preview environments. Environment changes require a new deployment.

The database must accept connections from the selected Vercel deployment network. Configure this in your database provider; do not assume your home IP allowlist covers Vercel.

The function reuses its MongoDB connection and Express app between requests. Login and contact rate limits are stored in MongoDB so separate function instances share them. Vercel's immediate proxy is trusted for HTTPS and client IP handling. Other hosting keeps Express's default proxy behavior.

After deployment, verify `/api/health` returns JSON with `ok: true`, `/api/content` returns portfolio data, the resume downloads, and `/admin` loads directly. Submit one clearly labeled contact test and confirm it in the authenticated inbox. Check an admin save, private draft visibility, and logout before considering the full application verified. A visible portfolio alone is insufficient because the frontend has offline fallback content.

## Tests

`npm test` starts isolated temporary MongoDB instances and checks authentication, public/private content, draft visibility, validation, conflicting saves, contact storage, logout, Vercel cold starts, secure proxy cookies, and shared rate limits. Its MongoDB binary is downloaded on first use. Tests never use your production database.

## Content notes

Content comes from the supplied resume. No employment, blog posts, project screenshots, live demos, or repository URLs were invented. Community and leadership are presented as experience. Add project-specific links through the admin studio when available. Blog content is plain text, so HTML is never executed.

## Key folders

- `src/`: React portfolio, admin studio, styles, initial content.
- `server/`: Express API, MongoDB models, validation, integration tests.
- `public/`: Original resume and favicon.
- `dist/`: Production frontend generated by the build.

Admin saves publish the currently checked posts. Leave “Published” unchecked to keep a draft private. Save before leaving; conflicting edits in another session require a reload. The inbox shows the newest 200 messages.
