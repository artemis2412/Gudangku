# GUDANGKU Android

Native Android client built with Kotlin and Jetpack Compose.

## Current foundation
- Android application module: `app`
- Application ID: `id.artemis.gudangku`
- Minimum SDK: API 26
- Compose UI scaffold and project version catalog
- Supabase connection is not wired into Android yet; both clients will use the dedicated GUDANGKU project.

## Open and build
Open this `android/` directory in Android Studio with JDK 17 or newer and allow Gradle sync.

The Gradle wrapper scripts/JAR are not committed yet. Generate them from a compatible installed Gradle distribution using `gradle wrapper` after opening the project locally.

## Security
Do not commit `local.properties`, signing credentials, or secrets. The Android app may only use the GUDANGKU project's publishable key. Never embed a Supabase secret/service-role key in the APK.
