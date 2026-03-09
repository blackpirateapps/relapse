import '../constants/app_config.dart';

/// Builds the full URL for a phoenix rank image from the web server.
/// The web server hosts SVGs at /img/{rankId}.svg
String phoenixImageUrl(String rankId) {
  return '${AppConfig.apiBaseUrl}/img/$rankId.svg';
}

/// Builds the full URL for a skin's progression image.
String skinStageImageUrl(String relativePath) {
  if (relativePath.startsWith('http')) return relativePath;
  return '${AppConfig.apiBaseUrl}$relativePath';
}

/// Builds the full URL for an aura preview image.
String auraImageUrl(String relativePath) {
  if (relativePath.startsWith('http')) return relativePath;
  return '${AppConfig.apiBaseUrl}$relativePath';
}
