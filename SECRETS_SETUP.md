# Firebase Secrets Management Guide

This guide explains how to securely manage Firebase and Cloudinary credentials in development and production environments.

## Overview

- **Development**: Use a local `.env.local` file (never commit to git).
- **Production (EAS Build)**: Use `eas secret:create` to store secrets encrypted on EAS servers.
- **Environment Variables**: Prefix with `EXPO_PUBLIC_` so Expo automatically exposes them to the app.

---

## Development Setup

### 1. Create a local `.env.local` file

```bash
cp .env.example .env.local
```

### 2. Fill in your Firebase credentials

Edit `.env.local` and replace the placeholders with your Firebase project credentials:

```
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
EXPO_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
```

You can find these values in your Firebase Console:
1. Go to **Project Settings** (gear icon in top-right).
2. Under **Your apps**, find your Web app.
3. Copy the config object values.

### 3. Add Cloudinary credentials

Add the following to your `.env.local` file:

```
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=framez
```

To get these values:
1. Go to your [Cloudinary Dashboard](https://cloudinary.com/console/dashboard)
2. Find your **Cloud Name** in the top-left area
3. Go to **Settings** → **Upload** → **Upload presets**
4. Use the existing `framez` preset (must be **Unsigned** for public uploads)

### 4. Verify `.env.local` is in `.gitignore`

The workspace should already have `.env*` in `.gitignore`, but verify:

```bash
cat .gitignore | grep ".env"
```

You should see `.env.local` or `.env.*` listed.

### 5. Start development

```bash
npm start
```

Expo will automatically load variables from `.env.local` and inject them into the app.

---

## Production Setup (EAS Build)

### Prerequisites

- EAS CLI installed: `npm install -g eas-cli`
- Logged in to Expo: `eas login`
- Your Firebase project credentials ready

### 1. Create secrets on EAS

Replace the values with your actual Firebase and Cloudinary credentials:

```bash
eas secret:create --scope project --name firebase_api_key --value "AIzaSy..."
eas secret:create --scope project --name firebase_auth_domain --value "your-project.firebaseapp.com"
eas secret:create --scope project --name firebase_project_id --value "your-project-id"
eas secret:create --scope project --name firebase_storage_bucket --value "your-project.appspot.com"
eas secret:create --scope project --name firebase_messaging_sender_id --value "1234567890"
eas secret:create --scope project --name firebase_app_id --value "1:1234567890:web:abcdef123456"
eas secret:create --scope project --name cloudinary_cloud_name --value "your-cloud-name"
eas secret:create --scope project --name cloudinary_upload_preset --value "framez"
```

### 2. Verify secrets were created

```bash
eas secret:list
```

You should see all 6 Firebase secrets listed with their names (without values for security).

### 3. Build for preview or production

**Preview build** (for testing on a device/emulator):

```bash
eas build -p android --profile preview
```

**Production build** (for release):

```bash
eas build -p android --profile production
```

EAS will automatically inject the secrets from step 1 into the build environment.

### 4. Download and test the build

Once the build completes, EAS provides a download link or QR code. Test the APK on a real device or emulator.

---

## How It Works

1. **`.env.local` (Development)**
   - Expo reads from this file when running `npm start`.
   - Variables are available to JavaScript via `process.env.EXPO_PUBLIC_*`.
   - Never committed to git (listed in `.gitignore`).

2. **`eas.json` (EAS Build Configuration)**
   - References secrets using `@secret_name` format (e.g., `@firebase_api_key`).
   - EAS substitutes these with the actual secret values during build.
   - Separates `preview` and `production` profiles with different build types.

3. **`firebase.js` (Runtime)**
   - Reads environment variables: `process.env.EXPO_PUBLIC_FIREBASE_*`.
   - Validates that required config (projectId) is present.
   - Works identically whether running locally or in a production build.

---

## Troubleshooting

### Secrets not being injected into build

**Issue**: EAS build completes, but app fails to initialize Firebase.

**Solutions**:
- Verify secret names match `eas.json` references: `eas secret:list`
- Ensure environment variable format is correct: `"EXPO_PUBLIC_FIREBASE_API_KEY": "@firebase_api_key"`
- Check that you created the secrets in the correct scope: `--scope project` (not `--scope account`)

### Firebase config returns undefined in development

**Issue**: App crashes with "Firebase projectId is missing" warning.

**Solutions**:
- Verify `.env.local` exists in project root: `ls -la .env.local` (macOS/Linux) or `dir .env.local` (Windows)
- Restart Expo dev server: `npm start` (fresh load)
- Check `.env.local` file syntax (no extra spaces or quotes around values)
- Test with: `console.log(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID)` in `firebase.js`

### Build fails with "Firebase authentication failed"

**Issue**: App builds successfully, but Firebase Auth doesn't work at runtime.

**Solutions**:
- Verify Firebase credentials are correct and haven't expired.
- Check Firebase Console **Authentication** tab is enabled.
- Ensure your app's bundle ID (iOS) or package name (Android) is registered in Firebase Console:
  1. Go to **Project Settings** → **Your apps**.
  2. Add your bundle ID (iOS) or package name (Android) if missing.
- Verify Firestore and Storage security rules allow your app to read/write.

### `npm start` shows wrong Firebase config values

**Issue**: Local app is using different credentials than expected.

**Solutions**:
- Verify you're loading the right `.env.local` file: `npm start -- --env-file=.env.local`
- Check for multiple `.env*` files: `ls -la .env*`
- Ensure no `.env.production.local` or `.env.development.local` is overriding `.env.local`
- Clear Expo cache: `npx expo start -c`

---

## Security Best Practices

1. **Never commit `.env.local` to git**
   - Add to `.gitignore` (already done)
   - Use `.env.example` as a template for team members

2. **Rotate Firebase API keys periodically**
   - Visit Firebase Console → **Service Accounts** → **Firebase Admin SDK**
   - Generate new keys and update EAS secrets: `eas secret:update --name firebase_api_key --value "new_key"`

3. **Use separate Firebase projects for dev and production**
   - Development: Relaxed Firestore rules for testing
   - Production: Strict security rules, limited quota
   - Switch `.env.local` or secrets based on environment

4. **Restrict Firebase API key usage**
   - Go to **APIs & Services** → **Credentials**
   - Click your API key → **Restrict Key**
   - Select **Mobile App** and add bundle IDs/package names

5. **Enable Firebase Security Rules**
   - Firestore: Require authentication, enforce ownership checks
   - Storage: Restrict uploads by UID and file size
   - Real-time Database: Similar ownership-based rules

6. **Monitor Firebase usage**
   - Visit Firebase Console → **Usage** tab
   - Set up alerts for unusual activity
   - Review **Firestore** → **Rules Playground** for security testing

---

## Environment Variable Reference

| Variable | Example | Required |
|----------|---------|----------|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | `AIzaSy...` | Yes |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | `framez-123c7.firebaseapp.com` | Yes |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | `framez-123c7` | Yes |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | `framez-123c7.appspot.com` | Yes |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `595656282981` | Yes |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | `1:595656282981:web:3c5f1250d54e3fcb60c78c` | Yes |
| `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` | `dgbcfpym4` | Yes |
| `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | `framez` | Yes |

---

## References

- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [EAS Secrets and Environment Variables](https://docs.expo.dev/eas-update/environment-variables/)
- [Firebase Project Settings](https://firebase.google.com/docs/projects/learn-more)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
