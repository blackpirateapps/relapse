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

cd "$APP_DIR/android"
./gradlew --no-daemon assembleRelease \
  -Pandroid.injected.signing.store.file="$KEYSTORE_PATH" \
  -Pandroid.injected.signing.store.password=android \
  -Pandroid.injected.signing.key.alias=upload \
  -Pandroid.injected.signing.key.password=android
