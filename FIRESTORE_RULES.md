# Firestore Security Rules Guide

## Issue: Can't See Other Users' Posts

If you're seeing a blank feed or only your own posts, your Firestore Security Rules are likely too restrictive.

## ✅ Correct Rules for Feed to Work

Use these rules in your **Firestore Database** > **Rules** tab:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Posts: Anyone authenticated can read, only author can modify
    match /posts/{document=**} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.authorId;
    }

    // Users: Anyone authenticated can read, only owner can modify
    match /users/{document=**} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null && request.auth.uid == resource.id;
      allow delete: if request.auth != null && request.auth.uid == resource.id;
    }
  }
}
```

## How to Update Your Rules

### Step 1: Open Firestore Rules
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your **framez** project
3. Click **Firestore Database** on the left sidebar
4. Click the **Rules** tab at the top

### Step 2: Replace the Rules
1. Select all text in the editor (Ctrl+A)
2. Delete it
3. Paste the rules above
4. Click **Publish**

### Step 3: Test the Rules
1. Click the **Rules Playground** tab (next to Rules)
2. Test with:
   - **Service**: `Cloud Firestore`
   - **Document**: `posts`
   - **Action**: `get` (read)
   - **As UID**: `any-user-id`
   - **Expected Result**: ✅ **Allow** (green checkmark)

## Verification Checklist

- [ ] You updated the Firestore Rules from Firebase Console
- [ ] Rules allow `read` for authenticated users (`request.auth != null`)
- [ ] Rules allow `create` for authenticated users
- [ ] Rules allow `update`/`delete` only by post author
- [ ] You clicked **Publish** to apply the rules
- [ ] Rules Playground shows ✅ Allow for `get` on posts collection

## Troubleshooting

### "Permission denied" when creating post
- Make sure you're authenticated (logged in)
- Check rule allows `create: if request.auth != null`

### "Permission denied" when reading posts
- Make sure `allow read: if request.auth != null` is in rules
- Verify you're logged in before the app tries to fetch posts

### Rules Playground shows deny, but rules look correct
- Make sure **UID** field is filled in (any string like `test-user` works)
- Rules require `request.auth != null`, so you must set a UID in playground

## After Fixing Rules

Once you update the rules:

1. **Rebuild the app** (or restart Expo)
2. **Log in** to your account
3. **Create a post** from one account
4. **Create another account** and log in
5. **Verify** you can see both users' posts on the feed

## Rule Explanation

```javascript
match /posts/{document=**} {
  // Anyone with auth (logged in) can READ all posts
  allow read: if request.auth != null;
  
  // Anyone with auth can CREATE a new post
  allow create: if request.auth != null;
  
  // Only the author (user who created the post) can UPDATE or DELETE
  allow update, delete: if request.auth != null && request.auth.uid == resource.data.authorId;
}
```

The key part is:
- **`request.auth != null`** = "User is authenticated/logged in"
- **`request.auth.uid == resource.data.authorId`** = "User ID matches the post creator's ID"
- **`{document=**}`** = "This rule applies to all documents in this collection and subcollections"

## Production Rules (Optional)

For maximum security in production, you can make posts publicly readable:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Posts: Public read, but only authenticated users can create/edit
    match /posts/{document=**} {
      allow read: if true; // Anyone can read (no auth required)
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.authorId;
    }

    match /users/{document=**} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null && request.auth.uid == resource.id;
      allow delete: if request.auth != null && request.auth.uid == resource.id;
    }
  }
}
```

This allows:
- ✅ Anyone to view the feed (don't need to be logged in to see posts)
- ✅ Only logged-in users can create posts
- ✅ Only post authors can edit/delete their posts

## Firebase Console Reference

- **Rules Tab**: Edit and publish security rules
- **Rules Playground**: Test rules without affecting real data
- **Logs**: See all Firestore operations and rule denials
- **Quotas**: Monitor read/write usage

## Next Steps

1. Update your Firestore Security Rules (5 min)
2. Publish the rules (automatic)
3. Rebuild/restart your Expo app
4. Test by creating posts with different accounts
5. ✅ Verify you can see other users' posts on the feed
