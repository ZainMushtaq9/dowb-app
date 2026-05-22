import 'dart:async';

import 'package:dio/dio.dart';
import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';

import 'api_service.dart';

class PerformanceService {
  PerformanceService._();
  static final instance = PerformanceService._();
  final _dio = Dio(BaseOptions(baseUrl: apiBaseUrl, connectTimeout: const Duration(seconds: 5)));

  Future<void> recordStartup(int millis) async {
    await FirebaseAnalytics.instance.logEvent(name: 'app_startup', parameters: {'ms': millis});
    unawaited(_metric('app_startup', millis, 'ms'));
  }

  Future<void> recordFrameDrop(int frameMillis) => _metric('frame_drop', frameMillis, 'ms');
  Future<void> recordMemory(double mb) => _metric('memory_usage', mb, 'mb');

  Future<void> _metric(String event, num value, String unit) async {
    try {
      await _dio.post('/metrics', data: {'event': event, 'value': value, 'unit': unit, 'deviceClass': 'low'});
    } catch (_) {}
  }
}

class PerformanceOverlayTracker extends StatefulWidget {
  const PerformanceOverlayTracker({required this.child, super.key});
  final Widget child;

  @override
  State<PerformanceOverlayTracker> createState() => _PerformanceOverlayTrackerState();
}

class _PerformanceOverlayTrackerState extends State<PerformanceOverlayTracker> {
  @override
  void initState() {
    super.initState();
    SchedulerBinding.instance.addTimingsCallback((timings) {
      for (final timing in timings) {
        final frameMs = timing.totalSpan.inMilliseconds;
        if (frameMs > 24) PerformanceService.instance.recordFrameDrop(frameMs);
      }
    });
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
