import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math';

import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:workmanager/workmanager.dart';

import 'api_service.dart';

const mobileQueueTask = 'mobileSequentialDownloadQueue';

class MobileQueueItem {
  MobileQueueItem({
    required this.id,
    required this.url,
    required this.title,
    this.status = 'waiting',
    this.retries = 0,
    this.error,
  });

  final String id;
  final String url;
  final String title;
  final String status;
  final int retries;
  final String? error;

  Map<String, dynamic> toJson() => {'id': id, 'url': url, 'title': title, 'status': status, 'retries': retries, 'error': error};

  MobileQueueItem copyWith({String? status, int? retries, String? error}) {
    return MobileQueueItem(id: id, url: url, title: title, status: status ?? this.status, retries: retries ?? this.retries, error: error);
  }

  static MobileQueueItem fromJson(Map<String, dynamic> json) {
    return MobileQueueItem(
      id: json['id'] as String,
      url: json['url'] as String,
      title: json['title'] as String? ?? 'Video',
      status: json['status'] as String? ?? 'waiting',
      retries: json['retries'] as int? ?? 0,
      error: json['error'] as String?,
    );
  }
}

class MobileDownloadQueue {
  MobileDownloadQueue(this._api);
  final ApiService _api;
  final _dio = Dio();
  final _random = Random();

  Future<void> enqueue(List<Map<String, dynamic>> videos) async {
    final prefs = await SharedPreferences.getInstance();
    final items = videos
        .map((video) => MobileQueueItem(id: video['id'] as String, url: video['url'] as String, title: video['title'] as String? ?? 'Video'))
        .toList();
    await prefs.setString('mobileQueue', jsonEncode(items.map((item) => item.toJson()).toList()));
    await prefs.setBool('mobileQueuePaused', false);
    await Workmanager().registerOneOffTask(mobileQueueTask, mobileQueueTask, existingWorkPolicy: ExistingWorkPolicy.replace);
  }

  Future<void> pause() async => (await SharedPreferences.getInstance()).setBool('mobileQueuePaused', true);
  Future<void> resume() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('mobileQueuePaused', false);
    await Workmanager().registerOneOffTask(mobileQueueTask, mobileQueueTask, existingWorkPolicy: ExistingWorkPolicy.replace);
  }

  Future<void> cancel() async => (await SharedPreferences.getInstance()).remove('mobileQueue');

  Future<void> process() async {
    final prefs = await SharedPreferences.getInstance();
    final encoded = prefs.getString('mobileQueue');
    if (encoded == null) return;
    final items = (jsonDecode(encoded) as List).map((item) => MobileQueueItem.fromJson(Map<String, dynamic>.from(item as Map))).toList();

    for (var index = 0; index < items.length; index += 1) {
      if (prefs.getBool('mobileQueuePaused') ?? false) return;
      final item = items[index];
      if (item.status == 'success' || item.status == 'skipped') continue;
      items[index] = await _downloadItem(item);
      await prefs.setString('mobileQueue', jsonEncode(items.map((entry) => entry.toJson()).toList()));
      await Future<void>.delayed(Duration(milliseconds: 5000 + _random.nextInt(5000)));
    }
  }

  Future<MobileQueueItem> _downloadItem(MobileQueueItem item) async {
    for (var attempt = 0; attempt <= 3; attempt += 1) {
      try {
        final resolved = await _api.resolveForMobile(item.url);
        final url = resolved['downloadUrl'] as String?;
        if (url == null || url.isEmpty) throw StateError('No download URL');
        final dir = await getDownloadsDirectory() ?? await getApplicationDocumentsDirectory();
        final file = File('${dir.path}/${_safeName(resolved['filename'] as String? ?? '${item.id}.mp4')}');
        if (await file.exists()) return item.copyWith(status: 'success', retries: attempt);
        await _dio.download(url, file.path, options: Options(responseType: ResponseType.stream), deleteOnError: true);
        return item.copyWith(status: 'success', retries: attempt);
      } catch (error) {
        if (attempt == 3) return item.copyWith(status: 'failed', retries: attempt, error: error.toString());
        await Future<void>.delayed(Duration(seconds: pow(2, attempt).toInt()));
      }
    }
    return item.copyWith(status: 'failed');
  }

  String _safeName(String value) => value.replaceAll(RegExp(r'[^a-zA-Z0-9._-]+'), '-');
}
