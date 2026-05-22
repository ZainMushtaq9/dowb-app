import 'dart:async';
import 'dart:ui';

import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:firebase_performance/firebase_performance.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:workmanager/workmanager.dart';

import 'src/features/download/download_screen.dart';
import 'src/services/api_service.dart';
import 'src/services/mobile_download_queue.dart';
import 'src/services/performance_service.dart';

@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    WidgetsFlutterBinding.ensureInitialized();
    await Firebase.initializeApp();
    if (task == mobileQueueTask) {
      await MobileDownloadQueue(ApiService()).process();
    }
    return true;
  });
}

Future<void> main() async {
  final startup = Stopwatch()..start();
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  await MobileAds.instance.initialize();
  await Workmanager().initialize(callbackDispatcher, isInDebugMode: false);
  FlutterError.onError = FirebaseCrashlytics.instance.recordFlutterFatalError;
  PlatformDispatcher.instance.onError = (error, stack) {
    FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
    return true;
  };
  await PerformanceService.instance.recordStartup(startup.elapsedMilliseconds);

  runApp(const ProviderScope(child: DownloaderApp()));
}

class DownloaderApp extends StatelessWidget {
  const DownloaderApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TikTok Downloader',
      debugShowCheckedModeBanner: false,
      navigatorObservers: [FirebaseAnalyticsObserver(analytics: FirebaseAnalytics.instance)],
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xff2dd4bf)),
        useMaterial3: true,
      ),
      builder: (context, child) {
        return PerformanceOverlayTracker(child: child ?? const SizedBox.shrink());
      },
      home: const DownloadScreen(),
    );
  }
}
