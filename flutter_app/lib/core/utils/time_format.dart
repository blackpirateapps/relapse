String formatStreak(Duration duration) {
  final safe = duration.isNegative ? Duration.zero : duration;
  final days = safe.inDays;
  final hours = safe.inHours % 24;
  final minutes = safe.inMinutes % 60;
  final seconds = safe.inSeconds % 60;

  final h = hours.toString().padLeft(2, '0');
  final m = minutes.toString().padLeft(2, '0');
  final s = seconds.toString().padLeft(2, '0');
  return '${days}d ${h}h ${m}m ${s}s';
}
