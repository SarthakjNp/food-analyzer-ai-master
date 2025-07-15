# Android Build Guide for Food Analyzer AI

This guide will help you build the Food Analyzer AI app for Android devices.

## Prerequisites

1. Install [Node.js](https://nodejs.org/) (v18 or newer)
2. Install [Android Studio](https://developer.android.com/studio)
3. Install JDK 11 or newer
4. Configure Android SDK (via Android Studio)

## Build Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Next.js app

```bash
npm run build
```

This will create a static export in the `out` directory.

### 3. Sync with Capacitor

```bash
npx cap sync
```

This copies the web build to the native Android project and updates any plugins.

### 4. Open in Android Studio

```bash
npx cap open android
```

This will open the Android project in Android Studio.

### 5. Building the APK in Android Studio

1. Click on **Build** in the top menu
2. Select **Build Bundle(s) / APK(s)**
3. Choose **Build APK(s)**
4. Wait for the build to complete
5. The APK will be generated in `android/app/build/outputs/apk/debug/app-debug.apk`

### 6. Installing on a Device

Option 1: Direct from Android Studio
- Connect your Android device via USB with USB debugging enabled
- Click the "Run" button in Android Studio

Option 2: Manual APK install
- Transfer the APK to your Android device
- On your device, navigate to the APK file and tap it to install

## Troubleshooting

### Camera Permission Issues

Make sure your app has the necessary permissions in the Android manifest file:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.INTERNET" />
```

### Build Errors

- If you encounter Gradle sync issues, try updating Gradle in Android Studio
- Ensure your Android SDK is properly configured

### Testing Tips

- Test on a real device rather than an emulator for camera functionality
- Ensure good lighting when using the camera for food analysis
- For best results, position the food item to fill most of the camera frame