#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT_DIR/flutter_app"
MANIFEST_PATH="$APP_DIR/android/app/src/main/AndroidManifest.xml"

KEYSTORE_DIR="$APP_DIR/android/keystore"
KEYSTORE_PATH="$KEYSTORE_DIR/upload-keystore.jks"
mkdir -p "$KEYSTORE_DIR"

keytool -genkeypair -v \
  -keystore "$KEYSTORE_PATH" \
  -alias upload \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass android \
  -keypass android \
  -dname "CN=Phoenix Journey, OU=Mobile, O=BlackPirateApps, L=NA, S=NA, C=US"

if ! grep -q 'android.permission.INTERNET' "$MANIFEST_PATH"; then
  sed -i '/<manifest[^>]*>/a\
    <uses-permission android:name="android.permission.INTERNET" />' "$MANIFEST_PATH"
fi

if ! grep -q 'android.permission.POST_NOTIFICATIONS' "$MANIFEST_PATH"; then
  sed -i '/<manifest[^>]*>/a\
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />' "$MANIFEST_PATH"
fi

# Copy custom MainActivity.kt (notification handler) into the generated project
MAIN_ACTIVITY_SRC="$APP_DIR/android_src/MainActivity.kt"
MAIN_ACTIVITY_DST="$APP_DIR/android/app/src/main/kotlin/com/relapse/phoenix/MainActivity.kt"
if [ -f "$MAIN_ACTIVITY_SRC" ]; then
  mkdir -p "$(dirname "$MAIN_ACTIVITY_DST")"
  cp "$MAIN_ACTIVITY_SRC" "$MAIN_ACTIVITY_DST"
  echo "Copied custom MainActivity.kt"
fi

cd "$APP_DIR/android"
./gradlew --no-daemon assembleRelease \
  -Pandroid.injected.signing.store.file="$KEYSTORE_PATH" \
  -Pandroid.injected.signing.store.password=android \
  -Pandroid.injected.signing.key.alias=upload \
  -Pandroid.injected.signing.key.password=android
