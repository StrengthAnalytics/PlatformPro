# Deployment Guide

## Environment Variables Setup

This application requires the following environment variables to be configured:

### Required Variables

#### `VITE_CLERK_PUBLISHABLE_KEY`
Your Clerk publishable key for authentication.

**Value:** `pk_test_c3RhYmxlLXBlYWNvY2stOTAuY2xlcmsuYWNjb3VudHMuZGV2JA`

---

## Vercel Deployment

### Setting Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variable:
   - **Name:** `VITE_CLERK_PUBLISHABLE_KEY`
   - **Value:** Your Clerk publishable key (see above)
   - **Environment:** Select all environments (Production, Preview, Development)
4. Click **Save**
5. **Redeploy** your application for changes to take effect

### Important Notes

- Environment variables with the `VITE_` prefix are embedded into the client-side code at build time
- After adding or changing environment variables, you **must redeploy** for the changes to take effect
- The app will display a helpful error message if the Clerk key is missing

---

## Local Development

For local development, the environment variable is stored in `.env.local`:

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_c3RhYmxlLXBlYWNvY2stOTAuY2xlcmsuYWNjb3VudHMuZGV2JA
```

**Note:** `.env.local` is gitignored and should never be committed to version control.

---

## Troubleshooting

### Blank White Screen
If you see a blank white screen or a red error message about missing environment variables:
1. Verify the environment variable is set in Vercel
2. Ensure the variable name is exactly `VITE_CLERK_PUBLISHABLE_KEY`
3. Redeploy the application after adding the variable

### Build Errors
If TypeScript build fails:
- Ensure `vite-env.d.ts` exists in the project root
- Check that the Clerk SDK is properly installed: `npm install @clerk/clerk-react`

---

## Clerk Configuration

In your [Clerk Dashboard](https://dashboard.clerk.com):

1. Ensure your application is properly configured
2. Add your Vercel deployment URL to the allowed origins
3. Configure sign-in/sign-up options as needed
4. Set up any additional authentication providers (Google, GitHub, etc.)
