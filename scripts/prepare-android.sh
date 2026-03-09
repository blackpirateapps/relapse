#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

node scripts/set-cap-server-url.mjs

if [ ! -d "android" ]; then
  npx cap add android
fi

npx cap sync android

ANDROID_JAVA_DIR="android/app/src/main/java/com/relapse/phoenix"
mkdir -p "$ANDROID_JAVA_DIR"
cp mobile/android/com/relapse/phoenix/MainActivity.java "$ANDROID_JAVA_DIR/MainActivity.java"
cp mobile/android/com/relapse/phoenix/StreakNotificationPlugin.java "$ANDROID_JAVA_DIR/StreakNotificationPlugin.java"
cp mobile/android/com/relapse/phoenix/StreakNotificationService.java "$ANDROID_JAVA_DIR/StreakNotificationService.java"

MANIFEST_PATH="android/app/src/main/AndroidManifest.xml"

if ! grep -q 'android.permission.INTERNET' "$MANIFEST_PATH"; then
  sed -i '/<manifest[^>]*>/a\
    <uses-permission android:name="android.permission.INTERNET" />' "$MANIFEST_PATH"
fi

if ! grep -q 'android.permission.POST_NOTIFICATIONS' "$MANIFEST_PATH"; then
  sed -i '/<manifest[^>]*>/a\
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />\
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />' "$MANIFEST_PATH"
fi

if ! grep -q 'StreakNotificationService' "$MANIFEST_PATH"; then
  sed -i '/<\/application>/i\
        <service\
            android:name=".StreakNotificationService"\
            android:enabled="true"\
            android:exported="false"\
            android:foregroundServiceType="dataSync" />' "$MANIFEST_PATH"
fi

echo "Android project prepared."
