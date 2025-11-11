# Framez 📱

A modern social media app built with React Native, Expo, and Firebase. Share moments, create posts, and connect with others.

## Features

- 🔐 **Authentication**: Secure user registration and login with Firebase Auth
- 📝 **Create Posts**: Share photos and text with your network
- 💬 **Comments**: Engage with posts through comments
- 👤 **User Profiles**: View and manage your profile
- 🖼️ **Image Upload**: Upload images to Cloudinary
- 🌙 **Dark Mode**: Built-in theme toggle for light and dark modes
- 📱 **Cross-Platform**: Works on iOS and Android

## Tech Stack

- **Frontend**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: Expo Router
- **Backend**: Firebase (Firestore, Authentication)
- **Styling**: Tailwind CSS with NativeWind
- **Image Storage**: Cloudinary
- **State Management**: React Context API

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/Gbagamsyle/framez.git
   cd framez
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Setup Environment Variables

   Create a `.env.local` file in the project root with your Firebase and Cloudinary credentials:

   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
   EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
   ```

   See [SECRETS_SETUP.md](./SECRETS_SETUP.md) for detailed setup instructions.

4. Start the app

   ```bash
   npx expo start
   ```

   In the output, you'll find options to open the app in:
   - [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
   - [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
   - [Expo Go](https://expo.dev/go)

## Project Structure

```
framez/
├── app/                    # App screens and navigation
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Tab-based navigation screens
│   └── screens/           # Individual screen components
├── components/            # Reusable components
├── context/              # React Context providers
├── services/             # Firebase and API services
├── constants/            # Theme and constant values
├── hooks/                # Custom React hooks
└── assets/               # Images and fonts
```

## Key Fixes & Updates

### Firebase Comment System (v1.0.1)
- Fixed `serverTimestamp()` error in comment creation by using client-side timestamps
- Improved `arrayUnion()` usage to avoid Firebase validation errors

### UI/UX Improvements (v1.0.2)
- Fixed keyboard covering comment input field
- Implemented `KeyboardAvoidingView` with proper height handling
- Added `ScrollView` for better content scrolling on post detail screen
- Made comment input section sticky at the bottom

## Building for Production

### Production Pre-Flight Checklist

Before building, review the **[PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)** which includes:
- Firebase setup verification
- Environment variables & secrets
- Code quality checks
- Network connectivity tests
- Testing checklist
- Troubleshooting guide

### For Android

```bash
eas build --platform android
```

See [BUILD_APK.md](./BUILD_APK.md) for detailed APK building instructions.

### For iOS

```bash
eas build --platform ios
```

### For Appetize.io (Cloud Testing)

To host your app on Appetize.io for browser-based testing and sharing:

See [APPETIZE_SETUP.md](./APPETIZE_SETUP.md) for complete setup instructions including:
- Building APK/IPA files
- Uploading to Appetize.io
- Sharing preview links
- CI/CD integration
- Performance optimization

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, issues, or questions, please open an issue on [GitHub](https://github.com/Gbagamsyle/framez/issues).

## Author

**Gbagamsyle** - [GitHub](https://github.com/Gbagamsyle)
