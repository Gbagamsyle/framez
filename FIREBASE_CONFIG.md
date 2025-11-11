# Firebase Project Configuration

## Project Details

| Field | Value |
|-------|-------|
| **Project Name** | framez |
| **Project ID** | framez-123c7 |
| **Project Number** | 595656282981 |
| **Type** | Web App |
| **Android Package Name** | com.gbagamscott.framez |

**Note**: The Firebase Project ID (`framez-123c7`) is different from the Android package name (`com.gbagamscott.framez`). This is normal and expected — they serve different purposes:
- **Project ID**: Used internally by Firebase and in API calls
- **Package Name**: Identifies your app on Google Play Store and Android devices

## Firebase Services Enabled

- ✅ **Authentication** — Email/Password sign-in
- ✅ **Firestore Database** — NoSQL document store for posts, users, comments
- ✅ **Cloud Storage** (optional) — Not currently used; images stored on Cloudinary instead

## Environment Variables

Your app uses the following Firebase environment variables. These must be set in:
- **Development**: `.env.local` file (never commit to git)
- **Production**: EAS secrets (via `eas secret:create`)

### Required Variables

```
EXPO_PUBLIC_FIREBASE_API_KEY=<your-api-key>
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=framez-123c7.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=framez-123c7
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=framez-123c7.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=595656282981
EXPO_PUBLIC_FIREBASE_APP_ID=<your-app-id>
```

### How to Find These Values

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select **framez** project
3. Click the gear icon ⚙️ > **Project Settings**
4. Under **Your apps**, find your web app
5. Copy all values from the config object shown

### How to Set Secrets in EAS

For production builds:

```bash
# Create each secret once
eas secret:create --scope project --name firebase_api_key --value "YOUR_API_KEY"
eas secret:create --scope project --name firebase_auth_domain --value "framez-123c7.firebaseapp.com"
eas secret:create --scope project --name firebase_project_id --value "framez-123c7"
eas secret:create --scope project --name firebase_storage_bucket --value "framez-123c7.appspot.com"
eas secret:create --scope project --name firebase_messaging_sender_id --value "595656282981"
eas secret:create --scope project --name firebase_app_id --value "YOUR_APP_ID"

# Verify they were created
eas secret:list
```

## Firestore Database Structure

### Collections

#### `posts`
Documents representing user posts.

**Document Structure**:
```javascript
{
  id: "auto-generated",
  authorId: "user-uid",
  authorName: "User Name",
  authorPhotoUrl: "https://...", // optional
  text: "Post content text",
  imageUrl: "https://res.cloudinary.com/...", // optional, from Cloudinary
  timestamp: Timestamp, // server timestamp from Firebase
  comments: [
    {
      id: "timestamp",
      authorId: "user-uid",
      authorName: "User Name",
      text: "Comment text",
      timestamp: Date // client-side timestamp
    }
  ]
}
```

**Indexes**:
- Default: `timestamp` (descending) — used in `listenToPosts()`
- Composite (if needed): `authorId` + `timestamp` — for user-specific feed

#### `users`
Optional collection for user profile metadata.

**Document Structure**:
```javascript
{
  id: "user-uid",
  displayName: "User Name",
  photoUrl: "https://...",
  bio: "User bio", // optional
  createdAt: Timestamp
}
```

## Security Rules

### Current Rules (Development/Testing)

For development and testing, Firestore rules should allow:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write for authenticated users
    match /posts/{document=**} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.authorId;
    }

    match /users/{document=**} {
      allow read: if request.auth != null;
      allow create, update: if request.auth.uid == resource.id;
      allow delete: if request.auth.uid == resource.id;
    }
  }
}
```

### Production Rules (Recommended)

For production, enforce stricter rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Posts: allow read for all, write only for authenticated authors
    match /posts/{postId} {
      allow read: if true; // public read
      allow create: if request.auth != null 
        && request.auth.uid == request.resource.data.authorId;
      allow update, delete: if request.auth != null 
        && request.auth.uid == resource.data.authorId;
      
      // Comments: nested in posts (if using subcollections in future)
      match /comments/{commentId} {
        allow read: if true;
        allow create: if request.auth != null;
        allow delete: if request.auth.uid == resource.data.authorId;
      }
    }

    // Users: allow read for all, write only for own profile
    match /users/{userId} {
      allow read: if true;
      allow create, update: if request.auth.uid == userId;
      allow delete: if request.auth.uid == userId;
    }
  }
}
```

**How to Update Rules**:
1. Go to **Firebase Console** > **Firestore Database** > **Rules** tab
2. Copy one of the rule sets above
3. Click **Publish**
4. Test changes in the **Rules Playground**

## Authentication

### Sign-In Methods Enabled

Go to **Firebase Console** > **Authentication** > **Sign-in method**:

- ✅ **Email/Password** — Required for your app
- (Optional) **Google Sign-In** — Can add for convenience
- (Optional) **Anonymous** — Can add for guest access

### Android Package Registration (Recommended)

For production builds on Android:

1. Go to **Firebase Console** > **Project Settings** > **Your apps**
2. Click **Add app** > **Android**
3. Enter:
   - **Android package name**: `com.gbagamscott.framez`
   - **SHA-1 certificate fingerprint**: (get from `eas credentials`)
4. Download and follow setup (optional; not always required for basic auth)

### Web App Configuration

Your app is already registered as a **Web App** in Firebase. This is sufficient for React Native + Expo since we use the web SDK.

## Firebase Emulator (Optional for Local Development)

To test Firestore locally without affecting production:

```bash
# Install Firebase tools
npm install -g firebase-tools

# Start emulator
firebase emulators:start

# In your app, configure to use emulator (only in development)
# See firebase.js for how to add this
```

This is optional but useful for rapid iteration without affecting real database.

## Monitoring & Debugging

### Check Authentication Logs
- **Firebase Console** > **Authentication** > **Logs**
- See all sign-in attempts, errors, user creation

### Check Firestore Activity
- **Firebase Console** > **Firestore Database** > **Logs**
- See reads, writes, and any rule-enforcement errors

### Real-Time Debugging
In your app, Firebase operations log to console:
- Successful operations print to device logs
- Errors show in browser console (on Appetize or web)
- Use `firebase.js` debug logging for masking API keys

### Check Usage Quotas
- **Firebase Console** > **Quotas**
- Monitor reads/writes to avoid exceeding free tier limits
- Set up alerts if approaching quota

## Common Tasks

### Create a Post
```javascript
import { createPost } from './services/firebase';

await createPost(
  userId,           // authUser.uid
  displayName,      // authUser.displayName
  'Post text here',
  imageFile         // optional File or URI
);
```

### Listen to Posts
```javascript
import { listenToPosts } from './services/firebase';

const unsubscribe = listenToPosts((posts) => {
  console.log('Posts updated:', posts);
});

// Cleanup
return () => unsubscribe();
```

### Add Comment
```javascript
import { addComment } from './services/firebase';

await addComment(
  postId,
  userId,
  displayName,
  'Comment text'
);
```

## Troubleshooting

### "Firebase projectId is missing"
**Cause**: Environment variable not set
**Fix**: 
- Development: Add to `.env.local`
- Production: Create EAS secret with `eas secret:create`

### "Permission denied" errors in Firestore
**Cause**: Security rules are too restrictive
**Fix**:
- Check your Firestore Security Rules
- Verify user is authenticated
- Check rule conditions match your auth UID

### Authentication not persisting after app restart
**Cause**: AsyncStorage not initialized
**Fix**: This is handled in `firebase.js` with `getReactNativePersistence(AsyncStorage)` — should work automatically

### Slow Firestore queries
**Cause**: Large number of posts without proper indexing
**Fix**: 
- Create composite indexes for complex queries
- Use pagination or limit query results
- Monitor Firestore usage in Console

## References

- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Firebase Emulator](https://firebase.google.com/docs/emulator-suite)

## Next Steps

1. ✅ Verify all environment variables are set in `.env.local` (dev) or EAS secrets (prod)
2. ✅ Review and update Firestore Security Rules for your use case
3. ✅ Enable Email/Password authentication in Firebase Console
4. ✅ (Optional) Register Android package in Firebase Console
5. ✅ Test authentication and Firestore operations in development
6. ✅ Deploy to production via EAS build
