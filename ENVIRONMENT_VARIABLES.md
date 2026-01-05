# Environment Variables Guide for Vercel Deployment

This guide explains how to configure environment variables for your Flint monolith deployment on Vercel.

## Quick Answer

**For Single Project Deployment (Recommended):**

- ✅ **YES, combine ALL environment variables** from both frontend and backend into one Vercel project
- Vercel will make them available to both frontend and backend during build and runtime
- Frontend variables prefixed with `NEXT_PUBLIC_` will be exposed to the browser
- Backend variables (without `NEXT_PUBLIC_`) remain server-side only

**For Separate Projects:**

- Frontend project: Only frontend variables
- Backend project: Only backend variables

## Complete Environment Variables List

### Frontend Variables (NEXT*PUBLIC*\*)

These variables are exposed to the browser and must be prefixed with `NEXT_PUBLIC_`:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://your-domain.vercel.app
# OR if using separate backend project:
# NEXT_PUBLIC_API_URL=https://your-backend.vercel.app

# Google OAuth (Frontend)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

### Backend Variables (Server-Side Only)

These variables are only available on the server and should NOT be prefixed with `NEXT_PUBLIC_`:

```bash
# Server Configuration
PORT=9999  # Optional, Vercel sets this automatically
CLIENT_URL=https://your-frontend-domain.vercel.app

# Database
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net
MONGO_DB=your-database-name

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars

# Google OAuth (Backend)
GOOGLE_CLIENT_ID=your-google-client-id

# Email Service (Nodemailer)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# Cloudinary (Image/Media Storage) - Optional but recommended
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Agora (Video/Voice Calls) - Optional
AGORA_APP_ID=your-agora-app-id
AGORA_APP_CERTIFICATE=your-agora-certificate

# Twilio (SMS/Video) - Optional
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
```

## How to Add Environment Variables in Vercel

### Option 1: Single Project (Monolith)

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add **ALL** variables from both frontend and backend lists above
4. Select the environments where they apply:
   - **Production**: For production deployments
   - **Preview**: For preview deployments (PRs, branches)
   - **Development**: For local development (if using Vercel CLI)

### Option 2: Separate Projects

#### Frontend Project:

Add only these variables:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

#### Backend Project:

Add all backend variables (everything except `NEXT_PUBLIC_*`)

## Important Notes

### 1. NEXT*PUBLIC* Prefix Rule

- ✅ Variables starting with `NEXT_PUBLIC_` are **exposed to the browser**
- ❌ Never use `NEXT_PUBLIC_` for secrets (JWT_SECRET, API keys, passwords)
- ✅ Use `NEXT_PUBLIC_` for public configuration (API URLs, public client IDs)

### 2. Variable Visibility

```
Frontend Code (Browser):
  ✅ Can access: NEXT_PUBLIC_*
  ❌ Cannot access: JWT_SECRET, MONGO_URL, etc.

Backend Code (Server):
  ✅ Can access: ALL variables (both NEXT_PUBLIC_* and regular)
```

### 3. Single Project vs Separate Projects

**Single Project (Recommended for Monolith):**

- All variables in one place
- Easier to manage
- Both frontend and backend can access their respective variables
- Vercel automatically handles variable scoping

**Separate Projects:**

- Frontend only sees `NEXT_PUBLIC_*` variables
- Backend only sees backend variables
- Need to set `NEXT_PUBLIC_API_URL` in frontend to point to backend URL

## Example Configuration

### Single Project Setup:

```bash
# In Vercel Dashboard → Settings → Environment Variables

# Frontend Public Variables
NEXT_PUBLIC_API_URL=https://flint-app.vercel.app
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com

# Backend Server Variables
CLIENT_URL=https://flint-app.vercel.app
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net
MONGO_DB=flint_production
JWT_SECRET=your-super-secret-key-here
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
EMAIL_USER=noreply@flint.app
EMAIL_PASS=your-app-password
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
```

### Separate Projects Setup:

**Frontend Project (`flint-frontend`):**

```bash
NEXT_PUBLIC_API_URL=https://flint-backend.vercel.app
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
```

**Backend Project (`flint-backend`):**

```bash
CLIENT_URL=https://flint-frontend.vercel.app
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net
MONGO_DB=flint_production
JWT_SECRET=your-super-secret-key-here
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
EMAIL_USER=noreply@flint.app
EMAIL_PASS=your-app-password
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
```

## Security Best Practices

1. **Never commit `.env` files** to Git
2. **Use strong secrets** for JWT_SECRET (minimum 32 characters)
3. **Rotate secrets regularly**, especially if exposed
4. **Use different values** for Production, Preview, and Development
5. **Limit access** to Vercel project settings
6. **Review variables** before each deployment

## Troubleshooting

### Variable Not Found

- Check spelling (case-sensitive)
- Ensure variable is added to correct environment (Production/Preview)
- Redeploy after adding new variables
- Check Vercel function logs for errors

### Frontend Can't Access Variable

- Ensure it's prefixed with `NEXT_PUBLIC_`
- Rebuild the frontend after adding the variable
- Check browser console for errors

### Backend Can't Access Variable

- Ensure it's NOT prefixed with `NEXT_PUBLIC_`
- Check serverless function logs in Vercel dashboard
- Verify variable is added to the project

## Verification

After setting up variables, verify they're working:

1. **Frontend**: Check browser console and network requests
2. **Backend**: Check Vercel function logs
3. **Database**: Test a simple API call that requires DB connection
4. **Auth**: Test login/signup functionality

## Quick Reference

| Variable Type | Prefix         | Accessible In    | Example               |
| ------------- | -------------- | ---------------- | --------------------- |
| Public Config | `NEXT_PUBLIC_` | Browser + Server | `NEXT_PUBLIC_API_URL` |
| Server Secret | None           | Server Only      | `JWT_SECRET`          |
| Database      | None           | Server Only      | `MONGO_URL`           |
| API Keys      | None           | Server Only      | `CLOUDINARY_API_KEY`  |
