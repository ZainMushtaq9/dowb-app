import 'package:dio/dio.dart';
import 'package:firebase_performance/firebase_performance.dart';

const apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'https://us-central1-your-project.cloudfunctions.net/api',
);

class ApiService {
  ApiService()
      : _dio = Dio(
          BaseOptions(
            baseUrl: apiBaseUrl,
            connectTimeout: const Duration(seconds: 12),
            receiveTimeout: const Duration(seconds: 45),
            sendTimeout: const Duration(seconds: 12),
            headers: {'content-type': 'application/json'},
          ),
        );

  final Dio _dio;

  Future<Map<String, dynamic>> video(String url) async {
    return _timed('POST /video', () async {
      final response = await _dio.post('/video', data: {'url': url});
      return Map<String, dynamic>.from(response.data as Map);
    });
  }

  Future<Map<String, dynamic>> profile(String url, {String? cursor}) async {
    return _timed('POST /profile', () async {
      final response = await _dio.post('/profile', data: {'url': url, 'cursor': cursor, 'limit': 36});
      return Map<String, dynamic>.from(response.data as Map);
    });
  }

  Future<Map<String, dynamic>> createBulkJob(List<Map<String, dynamic>> videos) async {
    return _timed('POST /download-queue', () async {
      final response = await _dio.post('/download-queue', data: {'videos': videos});
      return Map<String, dynamic>.from(response.data as Map);
    });
  }

  Future<Map<String, dynamic>> resolveForMobile(String url) async {
    final queue = await createBulkJob([
      {'id': DateTime.now().microsecondsSinceEpoch.toString(), 'url': url}
    ]);
    final response = await _dio.post('/download-queue/${queue['queueId']}/resolve', data: {'url': url});
    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<T> _timed<T>(String name, Future<T> Function() run) async {
    final metric = FirebasePerformance.instance.newHttpMetric('$apiBaseUrl$name', HttpMethod.Post);
    await metric.start();
    try {
      final result = await run();
      metric.httpResponseCode = 200;
      return result;
    } catch (_) {
      metric.httpResponseCode = 500;
      rethrow;
    } finally {
      await metric.stop();
    }
  }
}
