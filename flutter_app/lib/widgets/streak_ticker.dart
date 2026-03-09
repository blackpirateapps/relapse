import 'dart:async';

import 'package:flutter/material.dart';

/// Self-contained streak timer widget that only rebuilds itself every second
/// instead of triggering full widget tree rebuilds through AppState.
class StreakTicker extends StatefulWidget {
  const StreakTicker({
    super.key,
    required this.lastRelapse,
    this.style,
    this.textAlign,
  });

  final DateTime lastRelapse;
  final TextStyle? style;
  final TextAlign? textAlign;

  @override
  State<StreakTicker> createState() => _StreakTickerState();
}

class _StreakTickerState extends State<StreakTicker> {
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final duration = DateTime.now().difference(widget.lastRelapse);
    final safe = duration.isNegative ? Duration.zero : duration;
    final days = safe.inDays;
    final hours = (safe.inHours % 24).toString().padLeft(2, '0');
    final minutes = (safe.inMinutes % 60).toString().padLeft(2, '0');
    final seconds = (safe.inSeconds % 60).toString().padLeft(2, '0');

    return Text(
      '${days}d ${hours}h ${minutes}m ${seconds}s',
      style: widget.style ?? const TextStyle(fontSize: 20, color: Color(0xFF73F0A9)),
      textAlign: widget.textAlign ?? TextAlign.center,
    );
  }
}
