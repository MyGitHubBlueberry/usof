# Challenge-Based Learning Documentation — USOF Frontend

This documents the Engage → Investigate → Act process for the **Usof frontend** challenge (Full Stack track), as required by the assignment brief. For the backend's own CBL documentation and architecture notes, see [`../API/README.md`](../API/README.md).

## Engage

**Big idea:** Interface for an API.

During this stage all i planned the general direction of the development, mapped out the pages and thought of general layout. My general idea to put widgets on most pages stuck, it doesn't really contribute to suggested "simple is better" from the engage section of the usof fronted pdf, but what it does, is it makes this site look more unique. And i think widgets are pretty useful :)


## Investigate

Notes from researching the guiding questions, as applied to this specific build:

- **Single-page vs. multi-page app:** USOF is built as an SPA with `react-router` (`src/router.jsx`). Every route is lazy-loaded (`src/lazyPages.js`, `React.lazy`) so the initial bundle only pays for what's needed for the first page, while navigation afterward is instant (no full page reload).
- **Website security / vulnerabilities / frontend mitigations:** The main client-side concerns were XSS or cross site scripting (mitigated via `react-markdown` instead of raw HTML injection for post/comment content) and token handling (JWT kept out of inline scripts, attached only via the axios interceptor, and cleared on 401/logout). CSRF (Cross-site request forgery) isn't a major concern here since auth is bearer-token based rather than cookie-session based. And as for DDoS attacks that try to overwhelm the server, the only pro-caution taken so far is rate limiter.
- **How the backend interacts with the frontend:** All communication is JSON over REST, documented endpoint-by-endpoint in `API/README.md`. The frontend's `src/services/*.service.js` files are thin wrappers around a single shared axios instance; `src/constants/api.js` centralizes every endpoint path.
- **State management library:** Redux Toolkit was used (as mandated by the assignment) over plain Redux specifically for `createSlice`'s built-in Immer-based reducers and `createAsyncThunk`'s standard pending/fulfilled/rejected lifecycle, which removed a lot of the Redux boilerplate.

## Act: Basic

What was implemented against the Act: Basic requirements:

- **Header & navigation**, present on every page: service name/logo, current user's role/login/avatar (or default guest state), and a logout control, plus a menu with links to the feed, leaderboard, notifications, and (for admins) the admin panel.
- **Main page (post feed):** recently-added posts sorted by last added by default, with user-controlled sort (date/likes), filtering (category, date range, status, author), search, and page-based pagination. Post preview cards show title, author, publish date, categories, like/dislike and comment counts, and a content preview.
- **Post detail page:** full post content (rendered as Markdown), attachments, categories, like/dislike, favorite/subscribe toggles, and a comments section.
- **Comments:** nested replies (comments on comments) of arbitrary depth, sorted by number of likes by default, with edit/delete/resolve actions scoped to the right owner/admin permissions.
- **Auth pages:** registration, login, email confirmation, password reset request/confirmation, all with client-side field validation (`src/utils/validators.js`) surfacing specific errors per field.
- **User profile page:** profile info, own-post editing, avatar upload, and tabs for the user's posts/favorites/notifications/subscriptions.

## Act: Creative

Creative features actually implemented, beyond the required three:

1. **Dark mode / theme switcher**, persisted to `localStorage`.
2. **Markdown post/comment editor** with a formatting toolbar and live rendering.
3. **Page-based pagination** for the feed, leaderboard, comments, and every admin table (not infinite scroll — page-based pagination was the chosen pagination style for this build).
4. **Post drafts**, autosaved to `localStorage` while composing a new post.
5. **Comment nesting/threading**, rendered as a visual tree with collapsible branches.
6. **Keyboard shortcuts** (Ctrl/Cmd+Enter to submit posts and comments).
7. **Image attachment preview** (inline thumbnails + a lightbox for full-size viewing); non-image attachments get a download link rather than an inline preview.
8. **Admin features:** post moderation (active/inactive), user banning/unbanning, category CRUD, user role management, and a full user list — all built out in `src/pages/AdminPanel*Tab.jsx`. This is required, but as i know, most people were just using external admin panel, so this does count as a creative feature, in my opinion.

Beyond the chosen list, the build also added: real-time-ish notifications via polling + Server-Sent Events for live post/comment updates, an overall and weekly leaderboard, and post-link sharing via the Web Share API / clipboard.

## Algorithm description of the whole program

At a high level, the app is a Vite-built React SPA:

1. `src/router.jsx` defines all routes, each lazily imported via `src/lazyPages.js` so route code only loads when visited.
2. Pages read and write shared state through a Redux Toolkit store (`src/redux/store.js`), composed of one slice per concern: `auth`, `theme`, `flash`, `notifications`, `postsFeed`, `postDetail`, `comments`, and `leaderboard` (`src/redux/slices/`). Each data-fetching slice exposes `createAsyncThunk`s that call the service layer and track `pending`/`succeeded`/`failed` status, guarding against stale/out-of-order responses via a `currentRequestId` check in the reducer.
3. The service layer (`src/services/*.service.js`) wraps a single shared axios instance (`src/utils/api.js`), which attaches the JWT from the Redux auth slice to every request and normalizes every error response into a consistent `{ status, message, errors }` shape before it reaches a component.
4. Components dispatch thunks on mount/interaction and read state back via `useSelector`, rendering loading/error/empty states from the slice's `status` field rather than a separate parallel `useState`.
5. The Express/MySQL backend in `API/` is the single source of truth for all data; see `API/README.md` for its own request-flow description (router → middleware → controller → model → database).
