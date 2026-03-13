import '../constants/app_config.dart';

String _joinBaseUrl(String baseUrl, String path) {
  final trimmedBase = baseUrl.endsWith('/') ? baseUrl.substring(0, baseUrl.length - 1) : baseUrl;
  if (path.isEmpty) return trimmedBase;
  if (path.startsWith('/')) return '$trimmedBase$path';
  return '$trimmedBase/$path';
}

/// Builds an absolute URL for an asset hosted on the web server.
/// Accepts either an absolute URL, `/path`, or `path`.
String webAssetUrl(String relativeOrAbsolute) {
  if (relativeOrAbsolute.isEmpty) return '';
  final lower = relativeOrAbsolute.toLowerCase();
  if (lower.startsWith('http://') || lower.startsWith('https://')) return relativeOrAbsolute;
  return _joinBaseUrl(AppConfig.apiBaseUrl, relativeOrAbsolute);
}

/// Builds the full URL for a phoenix rank image from the web server.
/// The web server hosts SVGs at /img/{rankId}.svg
String phoenixImageUrl(String rankId) {
  return webAssetUrl('/img/$rankId.webp');
}

/// Builds the full URL for a skin's progression image.
String skinStageImageUrl(String relativePath) {
  return webAssetUrl(relativePath);
}

/// Builds the full URL for an aura preview image.
String auraImageUrl(String relativePath) {
  return webAssetUrl(relativePath);
}
