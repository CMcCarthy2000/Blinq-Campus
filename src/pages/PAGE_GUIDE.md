# Pages + Feature Guide (src/pages)

This guide helps you locate page features quickly and understand where to modify behavior/UI in the Blinq-Campus client.

## 1. Top-level routing hub

File: `src/pages/app.tsx`

- `App` component defines top-level route handling using `react-router-dom`.
- Auth gate wrapper: `CheckAuth` in `src/controllers/client/jsx/CheckAuth.tsx` (used to redirect signed-in users away from login).
- Routed sections:
    - `/login/verify/:token`, `/login/reset/:token`, `/login` -> `<Login />`
    - `/delete/:token` -> `<ConfirmDelete />`
    - `/invite/:code` -> `<Invite />` (with `CheckAuth` both blockRender/unblocked states)
    - `/` -> `<RevoltApp />` (main app)

## 2. Login section

Folder: `src/pages/login`

### Main login container

- `src/pages/login/Login.tsx`
    - top-level login page layout
    - native `Titlebar` supports desktop app style
    - optional `StatusBar` via `useSystemAlert` (update/banner messages)
    - `LocaleSelector` and logo display
    - nested internal `<Switch>` for login sub-routes:
        - `/login/create` -> `FormCreate`
        - `/login/resend` -> `FormResend`
        - `/login/verify/:token` -> `FormVerify`
        - `/login/reset/:token` -> `FormReset`
        - `/login/reset` -> `FormSendReset`
        - `/login` -> `FormLogin`

### Form system

- `src/pages/login/forms/Form.tsx`
    - shared form logic for login/create/reset/resend flows
    - uses `react-hook-form`
    - handles captcha flow (`CaptchaBlock`) when required
    - handles success state (`MailProvider` email instructions) and error mapping with `takeError`
    - page-specific fields and button text based on `page` prop
    - login uses Google OAuth and can toggle admin test login.

### Per-route form wrappers

- `src/pages/login/forms/FormLogin.tsx` -> `Form({ page: "login", callback: clientController.login })`
- `FormCreate`, `FormResend`, `FormVerify`, `FormReset`, `FormSendReset` in same folder (each wire to relevant controller callbacks and path redirects)

### Style/Assets

- `src/pages/login/Login.module.scss` (login page styling)
- `src/pages/login/background-*.jpg`, `wide.svg` (brand assets)

## 3. Main Application shell

File: `src/pages/RevoltApp.tsx`

- Main app layout and panel system using `react-overlapping-panels`
- `LeftSidebar`, `RightSidebar`, `BottomNavigation`
- `StatusBar` for update toasts in-app
- Routes inside main UI:
    - `/server/*` and `/channel/*` -> `Channel` plus server/channel settings
    - `/settings` -> `Settings`
    - `/discover` -> `Discover`
    - `/dev` -> `Developer`
    - `/friends` -> `Friends`
    - `/open/:id` -> `Open`
    - `/bot/:id` -> `InviteBot`
    - `/` -> `Home`

## 4. Page-specific entries

### Home

- `src/pages/home/Home.tsx`
- Features: main home screen buttons, seasonal effects (snow/halloween), quick paths to discover/settings/server invite.
- Uses `PageHeader` and `@revoltchat/ui` `CategoryButton`.

### Discover

- `src/pages/discover/Discover.tsx`
- Embedded iframe to external discovery service (`https://rvlt.gg`) with theme bridge via `window.postMessage` + state sync.
- Uses `useApplicationState`, `useHistory`, `useLocation`, and URL sync.

### Friends

- `src/pages/friends/Friends.tsx`
- Friends list split by relationship status, collapsible sections.
- Buttons open modals (`create_group`, `add_friend`) using `modalController`.
- `Friend` row component in same folder.

### Settings

- Folder: `src/pages/settings`
- Entry: `Settings.tsx` and `GenericSettings.tsx`
- Subpages: `ServerSettings.tsx`, `ChannelSettings.tsx`, plus assets and pane components in `settings/assets`, `settings/panes`.

### Developer

- `src/pages/developer/Developer.tsx` (dev tools and debugging view)

### Invite

- `src/pages/invite/Invite.tsx` and `InviteBot.tsx` (invite link handling)

## 5. How to use this guide

1. Resolve route via `app.tsx` / `RevoltApp.tsx`.
2. Find page component in root `/src/pages` or its subfolder.
3. For a UI feature change, check related SCSS module in same folder (`*.module.scss`).
4. For behavior or actions, trace to: controllers in `src/controllers` (e.g., login uses `clientController` callbacks in `src/controllers/client/ClientController.ts`).
5. Use `Context` and `mobx` stores when state is global.

---

## Quick utility references

- `src/context` contains theme/locale providers.
- `src/components` contains reusable UI primitives used by pages.
- `src/controllers` includes business logic (login, session, modals).
- `src/mobx` contains app state definitions.

> Tip: when modifying page logic, search for the route path (e.g., `/login`, `/friends`) in the codebase using grep to find all related files quickly.
