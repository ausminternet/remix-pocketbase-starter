# Remix + PocketBase

Example app with complete server side registration and authentication flow (including OAuth), using Remix and PocketBase. PocketBase is not exposed to the client.

Used technologies:

- App: [Remix](https://remix.run)
- BaaS: [PocketBase](https://pocketbase.io)
- UI: [DaisyUI](https://daisyui.com/)

Demo: [https://remixpb.uber.space](https://remixpb.uber.space)

## Usage

Install and run [Pocketbase](https://pocketbase.io/) or create a hosted instance on [pockethost.io](https://pockethost.io) and enter your pocketbase url in your `.env`:

```env
POCKETBASE_URL=http://localhost:8090
```

Open the PocketBase admin ui and go to *Settings* > *Application* and change the *Application URL* to your app url (`http://localhost.3000` for Example).

Then got to *Settings* > *Mail Settings* and change the following action URLs:

- Verification: `{APP_URL}/auth/confirm-verification?token={TOKEN}`
- Password reset: `{APP_URL}/auth/confirm-password-reset?token={TOKEN}`
- Confirm email change: `{APP_URL}/auth/confirm-email-change?token={TOKEN}`

To use authentication via OAuth providers, go to *Settings* > *Auth Providers*  and configure the desired providers.

Additionally you have to add the correct OAuth callback url in your `.env`:

```env
OAUTH_CALLBACK_URL=http://localhost:3000/auth/oauth-callback
```

After you have set up your PocketBase and populated the `.env` file, clone this repository, install dependencies and run the remix app:

```bash
git clone https://github.com/ausminternet/remix-pocketbase-starter
pnpm install
pnpm run dev

```
