# Build APK (Expo / EAS) — Quick Guide

This document walks through preparing and building an Android APK using EAS (Expo Application Services).

Prerequisites
- Node.js + npm installed
- EAS CLI installed globally: `npm install -g eas-cli`
- Logged in to Expo account: `eas login`
- Project configured with `eas.json` and `expo.app.json` (this repo already contains them)
- Project secrets (Firebase etc.) should be created via `eas env:create` or `eas secret:create` as documented in `SECRETS_SETUP.md`

What we changed in the repo
- `app.json` now includes `android.versionCode` (required for Android builds).
- `eas.json` preview and production profiles have `android.buildType: "apk"` and `credentialsSource: "remote"` so EAS will manage signing keys.

Step-by-step (recommended)

1. Verify env secrets exist for your project (run locally in project root):

```powershell
# lists project-scoped env vars
eas env:list --scope project
```

2. Create any missing secrets (one at a time):

```powershell
# run each of these as separate commands; replace values with your real ones
eas env:create production --name firebase_api_key --value "YOUR_VALUE" --scope project --visibility secret
eas env:create production --name firebase_auth_domain --value "YOUR_VALUE" --scope project --visibility secret
# repeat for firebase_project_id, firebase_storage_bucket, firebase_messaging_sender_id, firebase_app_id
```

3. (Optional) Let EAS manage credentials interactively or set them up manually.

By default we set `credentialsSource: "remote"` in `eas.json`, so EAS will prompt to manage keys when you run your first build.

4. Run a preview APK build (fastest way to get an installable APK):

```powershell
# Builds an APK using the `preview` profile in eas.json
eas build -p android --profile preview
```

The build log will include a download link when complete. Download and install the APK on a device or emulator to test.

5. For a production-signed APK, use the `production` profile:

```powershell
eas build -p android --profile production
```

Notes & Troubleshooting
- If EAS prompts to set up or reuse a keystore, follow the interactive choices (recommended for first build).
- If the build fails with credential errors, run `eas credentials` to inspect and manage Android keystores.
- Ensure `android.package` and `android.versionCode` are correct in `app.json`.
- If you bump `app.json` version, increment `android.versionCode` before building.

Useful commands
```powershell
# validate EAS CLI login
eas whoami

# show env variables
eas env:list --scope project

# delete an env variable from production
eas env:delete production --variable-name firebase_api_key --scope project --non-interactive

# build (preview)
eas build -p android --profile preview
```

If you'd like, I can:
- Trigger a preview build now from this environment (note: it will start a remote build and may require interactive credential confirmation), or
- Walk through creating any missing secrets you want me to create.
