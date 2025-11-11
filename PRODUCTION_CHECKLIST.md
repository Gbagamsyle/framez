# Production Pre-Flight Checklist

Before building for Appetize.io or releasing to production, verify all items below.

## Firebase Setup ✅

- [x] Firebase project is created and accessible
- [x] Firebase is registered as a **Web App** (this is fine for React Native + Expo)
- [ ] **Authentication** > **Sign-in method** has Email/Password enabled (or your chosen auth method)
- [ ] **Firestore Database** is created and deployed in production mode (or with permissive rules for testing)
- [ ] **Firestore Security Rules** allow:
  - Reads/writes for authenticated users (if required by your rules)
  - Or public read/write if testing with unauth users (NOT recommended for production)
- [ ] Android package `com.gbagamscott.framez` is registered in Firebase Console (optional but recommended)
  - Go to **Project Settings** > **Your apps** and add the Android package name
  - Firebase Project ID: `framez-123c7`
  - Firebase Project Number: `595656282981`

## Environment Variables & Secrets ✅

### Firebase Secrets (Required for Production Build)

Run the following to verify all Firebase secrets are set:
```bash
eas secret:list
```

All of these should exist:
- `firebase_api_key`
- `firebase_auth_domain`
- `firebase_project_id`
- `firebase_storage_bucket`
- `firebase_messaging_sender_id`
- `firebase_app_id`

If any are missing, create them:
```bash
eas secret:create --scope project --name firebase_api_key --value "YOUR_API_KEY"
eas secret:create --scope project --name firebase_auth_domain --value "your-project.firebaseapp.com"
# ... etc for each missing secret
```

Reference: [SECRETS_SETUP.md](./SECRETS_SETUP.md)

### Cloudinary Secrets (Required for Image Uploads)

Verify these Cloudinary secrets are set in EAS:
- `cloudinary_cloud_name` = your Cloudinary cloud name
- `cloudinary_upload_preset` = `framez` (or your preset name)

Create if missing:
```bash
eas secret:create --scope project --name cloudinary_cloud_name --value "dgbcfpym4"
eas secret:create --scope project --name cloudinary_upload_preset --value "framez"
```

### Cloudinary Dashboard Verification

- [ ] Log in to your [Cloudinary Dashboard](https://cloudinary.com/console)
- [ ] Verify your **Cloud Name** (appears in API Configuration section)
- [ ] Go to **Settings** > **Upload**
- [ ] Verify the `framez` upload preset exists
- [ ] Ensure it is set to **Unsigned** (for client-side uploads without backend signing)
- [ ] Note: Preset must allow file uploads (type = image by default)

## App Configuration ✅

### app.json
- [x] `name`: "framez"
- [x] `slug`: "framez"
- [x] `version`: "1.0.0" (increment as needed for releases)
- [x] `icon`: Points to valid image file
- [x] `android.package`: "com.gbagamscott.framez"
- [x] `android.versionCode`: 1 (increment with each build)
- [x] `ios` and `android` icons/splash images exist and are properly sized

### eas.json
- [x] Production profile includes all Firebase env vars from secrets
- [x] Production profile includes Cloudinary env vars
- [x] Preview profile configured (optional but recommended for faster test builds)
- [x] Android `buildType`: "apk" or "aab"

Reference: [eas.json](./eas.json)

## Code Quality ✅

### Feed Display & Posts
- [x] `FeedScreen.tsx`: Subscribes to posts via `listenToPosts()`, displays in FlatList, handles loading/empty states
- [x] `PostCard.tsx`: 
  - Safely renders optional fields (imageUrl, authorPhotoUrl)
  - Clamps image aspect ratios to avoid layout breaks
  - Uses defensive timestamp: `format(post.timestamp ?? new Date(), ...)`
  - Displays author, text, image (if present), comments preview
- [x] `services/firebase.ts`:
  - `createPost()` omits undefined fields (Firebase doesn't allow undefined)
  - `listenToPosts()` queries posts descending by timestamp
  - `toDate()` helper converts Firestore Timestamp and Date objects
  - `addComment()` uses client-side `new Date()` for timestamps

### Network & Errors
- [x] Cloudinary upload includes error logging (check `services/cloudinary.ts`)
- [x] Firebase errors logged to console
- [x] No console errors or warnings that indicate data type mismatches

## Network & Connectivity

- [ ] Your internet connection is stable
- [ ] Can access `https://api.expo.dev` (test: `ping api.expo.dev` or curl)
- [ ] No VPN/proxy blocking access to EAS servers
- [ ] No firewall rules blocking Expo/Firebase/Cloudinary domains

## Building for Production

### Step 1: Verify EAS Login
```bash
eas account:view
```
Should show your Expo account details.

### Step 2: Verify Secrets Are Set
```bash
eas secret:list
```
All 8 secrets (6 Firebase + 2 Cloudinary) should be listed.

### Step 3: Build APK (Recommended First Step)
```bash
eas build --platform android --profile production
```

This will:
- Take 10–15 minutes
- Compile your React Native code
- Download and APK file link when done
- Automatically inject secrets from EAS

### Step 4: Download & Test Locally (Optional)
- Download the APK from the EAS build link
- Install on Android emulator or device
- Test all core features (auth, feed, posts, comments, image upload)

### Step 5: Upload to Appetize.io
See [APPETIZE_SETUP.md](./APPETIZE_SETUP.md) for detailed instructions:
1. Go to https://appetize.io/dashboard
2. Sign up or log in
3. Upload the APK
4. Configure device settings
5. Share the preview link

## Testing Checklist (On Appetize or Emulator)

Before sharing with stakeholders, verify:

### Authentication
- [ ] Sign up with new email works
- [ ] Login with existing email works
- [ ] Logout works (returns to login)
- [ ] Can access feed after login

### Feed Display
- [ ] Feed loads with posts from your Firestore
- [ ] Pull-to-refresh works
- [ ] Stories carousel displays (if posts have images)
- [ ] Posts display author name, text, timestamp, image (if present)
- [ ] Comments preview shows for posts with comments
- [ ] "View all comments" link appears when > 2 comments

### Creating Posts
- [ ] Can navigate to Create screen
- [ ] Can type post text
- [ ] Can pick image from device
- [ ] Can submit post without image
- [ ] Can submit post with image (Cloudinary upload happens)
- [ ] New post appears in feed immediately after creation

### Commenting
- [ ] Can tap on a post to open detail screen
- [ ] Can type a comment in the text input
- [ ] Can submit a comment
- [ ] Comment appears in the feed or detail screen
- [ ] Multiple comments are displayed correctly

### User Profile
- [ ] Profile screen shows user's posts
- [ ] Can edit profile info (if implemented)
- [ ] Logout button works from profile

### Image Handling
- [ ] Images render without distortion (aspect ratio clamped)
- [ ] Placeholder images show when missing (avatar, post image)
- [ ] No "Image failed to load" errors in console

## Troubleshooting Common Issues

### EAS Build Fails: "api.expo.dev not found"
- **Cause**: Network/DNS issue or firewall blocking EAS
- **Fix**:
  ```bash
  ping api.expo.dev
  nslookup api.expo.dev
  ```
  - If ping fails, check internet connection and firewall
  - Restart router or try different network
  - Check https://status.expo.dev for EAS outages

### App Crashes on Launch
- **Cause**: Missing Firebase config or EAS secrets not injected
- **Fix**: 
  - Verify `eas secret:list` shows all 8 secrets
  - Check Firebase config is correct
  - Look at device logs: `eas device logs`

### Images Not Uploading
- **Cause**: Cloudinary credentials missing or preset not found
- **Fix**:
  - Verify `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` is set
  - Verify `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET` is set to `framez`
  - Check Cloudinary preset exists and is **Unsigned**
  - Check Cloudinary error logs on device (Appetize DevTools)

### Feed Shows No Posts
- **Cause**: Firestore empty or rules blocking reads
- **Fix**:
  - Ensure posts exist in Firestore (check Console)
  - Check Firestore Security Rules allow reads
  - Verify Firebase API key is correct
  - Check browser console (Appetize) for Firebase errors

### Timestamps Show as Invalid Date
- **Cause**: `post.timestamp` is null or undefined
- **Fix**: 
  - Already fixed in `PostCard.tsx` with `post.timestamp ?? new Date()`
  - Verify all posts have a `timestamp` field in Firestore

## Performance Notes

- Cloudinary upload may take a few seconds on slow networks
- FlatList is optimized for large post feeds
- Images are cached by React Native

## After Production Build

Once your build is live on Appetize.io:
- Monitor for errors in browser console
- Test with multiple users (create test accounts)
- Gather feedback on UX/performance
- Be ready to patch and redeploy quickly if issues found

## Next Steps

1. ✅ **Verify all checklist items above**
2. ✅ **Confirm EAS secrets are set** (`eas secret:list`)
3. ✅ **Confirm internet connection is stable**
4. ✅ **Run build**: `eas build --platform android --profile production`
5. ✅ **Download APK and upload to Appetize.io**
6. ✅ **Test thoroughly on Appetize**
7. ✅ **Share link with team**

---

**Questions?** See:
- [SECRETS_SETUP.md](./SECRETS_SETUP.md) — Environment variables
- [APPETIZE_SETUP.md](./APPETIZE_SETUP.md) — Hosting on Appetize.io
- [README.md](./README.md) — Project overview
