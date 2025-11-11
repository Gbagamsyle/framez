# Appetize.io Setup Guide

This guide explains how to build and host your Framez app on [Appetize.io](https://appetize.io) for cloud-based iOS and Android testing.

## What is Appetize.io?

Appetize.io is a cloud-based mobile app emulator that allows you to:
- Test your iOS/Android app in a browser without needing physical devices or local emulators
- Share interactive demos with stakeholders
- Run automated tests
- Generate shareable preview links

## Prerequisites

1. **Expo Account** - Already set up (you use EAS)
2. **Build artifacts** - APK file for Android or IPA for iOS
3. **Appetize.io Account** - Free tier available at https://appetize.io

## Step 1: Build for Appetize.io

### Option A: Build Android APK (Recommended for quick testing)

```bash
# Build a production-ready APK
eas build --platform android --profile production

# Or build a preview APK for faster builds
eas build --platform android --profile preview
```

The APK will be available for download after the build completes.

### Option B: Build iOS IPA (Requires Apple Developer Account)

```bash
# Build iOS app (requires simulator build or real device provisioning)
eas build --platform ios --profile preview
```

## Step 2: Prepare Your Build for Appetize.io

### Android APK
- Size: Should be under 500MB for optimal performance
- Format: `.apk` or `.aab` (Android App Bundle)
- Appetize.io supports both

### iOS IPA
- Must be built for simulator (ARM64 simulator or x86_64)
- Size: Typically larger than APK

## Step 3: Upload to Appetize.io

### Option A: Via Web Dashboard

1. Go to [https://appetize.io/dashboard](https://appetize.io/dashboard)
2. Sign up or login to your Appetize.io account
3. Click **"New App"** or **"Upload APK"**
4. Drag and drop your APK/IPA file or select from your computer
5. Configure app settings:
   - **Device**: Select Android or iOS
   - **Device Model**: Choose specific device (Pixel 4, iPhone 12, etc.)
   - **OS Version**: Select compatible OS version
6. Click **Upload** and wait for processing

### Option B: Via API (For CI/CD Integration)

```bash
# Install Appetize CLI
npm install -g appetize

# Upload APK
appetize upload --path ./path/to/your/app.apk --apiToken YOUR_API_TOKEN

# You'll get a public URL like: https://appetize.io/app/abc123def456
```

Get your API token from: https://appetize.io/dashboard#/account

## Step 4: Configure Your App Settings on Appetize.io

After uploading, configure:

1. **Device Settings**
   - Screen size and orientation
   - Network simulation (4G, WiFi, etc.)

2. **Permissions**
   - Camera access
   - Microphone access
   - Location services
   - Storage permissions

3. **App Behavior**
   - Auto-play on load
   - Fullscreen mode
   - Device frame display

## Step 5: Generate Shareable Links

Once your app is uploaded:

1. Copy the app URL: `https://appetize.io/app/YOUR_APP_ID`
2. Share with team/stakeholders
3. Customize the URL:
   - Add device frame: `?device=iphone12`
   - Set device scale: `?scale=75`
   - Enable fullscreen: `?fullscreen=true`

Example:
```
https://appetize.io/app/YOUR_APP_ID?device=pixel6&scale=80&fullscreen=true
```

## Step 6: Configure Environment Variables

Appetize.io uses your app's built-in environment variables. Make sure:

1. **In `eas.json`**: Environment variables are set in your build profiles
2. **In `.env.local`** (development only): Not needed for Appetize
3. **EAS Secrets**: Firebase and Cloudinary credentials are already configured in your production build

### Verify Your Configuration

Check `eas.json` includes:
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_FIREBASE_API_KEY": "@firebase_api_key",
        "EXPO_PUBLIC_FIREBASE_PROJECT_ID": "@firebase_project_id",
        "EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME": "dgbcfpym4",
        "EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET": "framez"
      }
    }
  }
}
```

## Step 7: Test on Appetize.io

1. **Load your app** from the shareable link
2. **Test core features**:
   - User authentication (login/signup)
   - Create posts with images
   - Add comments
   - View feed
   - User profile

3. **Check network requests** using Appetize DevTools:
   - Open browser DevTools (F12)
   - Check Console for any errors
   - Verify Firebase connectivity
   - Test Cloudinary image uploads

## Troubleshooting

### App Won't Load
- Verify the APK was built successfully
- Check Firebase credentials are set in EAS secrets
- Ensure Cloudinary preset is correct

### Images Not Uploading
- Check Cloudinary credentials in production build
- Verify upload preset exists in Cloudinary dashboard
- Check network connectivity in Appetize DevTools

### Authentication Issues
- Verify Firebase API key is correct
- Check Firebase project allows your app's package ID
- Ensure Firebase Auth is enabled for your project

### Performance Issues
- Reduce image sizes before upload
- Use lower quality for thumbnails
- Monitor network requests in DevTools

## Advanced: CI/CD Integration

### GitHub Actions Integration

Create `.github/workflows/appetize-upload.yml`:

```yaml
name: Upload to Appetize

on:
  push:
    branches: [main]

jobs:
  build-and-upload:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Build APK
        run: eas build --platform android --non-interactive
      
      - name: Upload to Appetize
        run: |
          npm install -g appetize
          appetize upload --path ./app.apk --apiToken ${{ secrets.APPETIZE_API_TOKEN }}
```

## Performance Optimization for Appetize.io

1. **Reduce App Bundle Size**
   - Use dynamic imports for screens
   - Optimize image assets
   - Enable Hermes (JavaScript engine)

2. **Optimize Network Usage**
   - Implement lazy loading for posts
   - Cache images locally
   - Minimize Firebase queries

3. **Improve Load Times**
   - Pre-load critical screens
   - Implement skeleton loaders
   - Use efficient image formats (WebP)

## Security Considerations

1. **Credentials in Appetize Links**
   - Never share sensitive data in URL parameters
   - Use Appetize's built-in auth flows
   - Test with dummy accounts

2. **Data Privacy**
   - Be aware that Appetize records sessions
   - Don't upload production data to test accounts
   - Use separate Firebase project for staging

3. **App Signing**
   - Ensure APK is properly signed
   - Use release signing for production builds
   - Never share private keys

## Pricing

- **Free Tier**: 1 app, limited device options, 10 minutes/month
- **Pro**: $99/month - unlimited apps, all devices, 200 hours/month
- **Enterprise**: Custom pricing for large teams

See: https://appetize.io/pricing

## Resources

- **Appetize.io Docs**: https://appetize.io/docs
- **API Reference**: https://appetize.io/docs/api
- **Troubleshooting**: https://appetize.io/docs/troubleshooting
- **Device Models**: https://appetize.io/docs/device-selection

## Next Steps

1. ✅ Build your Android APK using `eas build --platform android`
2. ✅ Create an Appetize.io account
3. ✅ Upload your APK
4. ✅ Test all features
5. ✅ Share the preview link with your team
6. ✅ Iterate based on feedback

## Support

- **Appetize.io Support**: support@appetize.io
- **Expo Support**: https://expo.dev/help
- **Firebase Support**: https://firebase.google.com/support
- **GitHub Issues**: Your repo issues page
