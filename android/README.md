# GUDANGKU Android

Hybrid Android client built with Kotlin, Jetpack Compose, and Android WebView.

## Current foundation
- Android application module: `app`
- Application ID: `id.artemis.gudangku`
- Minimum SDK: API 26
- Full-screen WebView host for the deployed GUDANGKU web application
- Native Compose setup screen while the production web URL is not configured
- Android back button navigates WebView history
- Shared backend: dedicated GUDANGKU Supabase project through the web application

## Configure web URL
After the web app is deployed, add this property to the Gradle user properties file (not the repository):

```properties
GUDANGKU_WEB_URL=https://your-real-gudangku-domain.example
```

Do not use the example URL literally. Use the exact HTTPS deployment URL. The app intentionally does not guess a production domain.

## Native capabilities
Bluetooth printing, camera barcode scanning, offline local storage, and background sync are separate native milestones. They are not claimed as implemented by the WebView host.

## Build
Open this `android/` directory in Android Studio with JDK 17 or newer and allow Gradle sync. A Gradle wrapper is not committed yet.

## Security
Do not commit `local.properties`, signing credentials, or secrets. Never embed a Supabase secret/service-role key in the APK. The web client uses only the public publishable key.
