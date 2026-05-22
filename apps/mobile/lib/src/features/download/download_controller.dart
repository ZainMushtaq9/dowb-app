import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../services/api_service.dart';
import '../../services/mobile_download_queue.dart';

final apiProvider = Provider<ApiService>((ref) => ApiService());
final downloadControllerProvider = StateNotifierProvider<DownloadController, DownloadState>((ref) {
  return DownloadController(ref.read(apiProvider));
});

class DownloadState {
  const DownloadState({
    this.loading = false,
    this.mode = DownloadMode.video,
    this.videos = const [],
    this.selected = const {},
    this.cursor,
    this.hasMore = false,
    this.message = '',
  });

  final bool loading;
  final DownloadMode mode;
  final List<Map<String, dynamic>> videos;
  final Set<String> selected;
  final String? cursor;
  final bool hasMore;
  final String message;

  DownloadState copyWith({
    bool? loading,
    DownloadMode? mode,
    List<Map<String, dynamic>>? videos,
    Set<String>? selected,
    String? cursor,
    bool? hasMore,
    String? message,
  }) {
    return DownloadState(
      loading: loading ?? this.loading,
      mode: mode ?? this.mode,
      videos: videos ?? this.videos,
      selected: selected ?? this.selected,
      cursor: cursor ?? this.cursor,
      hasMore: hasMore ?? this.hasMore,
      message: message ?? this.message,
    );
  }
}

enum DownloadMode { video, profile }

class DownloadController extends StateNotifier<DownloadState> {
  DownloadController(this._api) : _queue = MobileDownloadQueue(_api), super(const DownloadState());
  final ApiService _api;
  final MobileDownloadQueue _queue;

  void setMode(DownloadMode mode) => state = state.copyWith(mode: mode, videos: [], selected: {});

  Future<void> submit(String url, {bool append = false}) async {
    state = state.copyWith(loading: true, message: '');
    try {
      if (state.mode == DownloadMode.video) {
        final result = await _api.video(url);
        final video = Map<String, dynamic>.from(result['video'] as Map);
        state = state.copyWith(loading: false, videos: [video], selected: {video['id'] as String});
      } else {
        final result = await _api.profile(url, cursor: append ? state.cursor : null);
        final nextVideos = (result['videos'] as List).map((item) => Map<String, dynamic>.from(item as Map)).toList();
        final merged = append ? [...state.videos, ...nextVideos] : nextVideos;
        state = state.copyWith(
          loading: false,
          videos: merged,
          selected: merged.map((item) => item['id'] as String).toSet(),
          cursor: result['nextCursor'] as String?,
          hasMore: result['hasMore'] as bool? ?? false,
        );
      }
    } catch (error) {
      state = state.copyWith(loading: false, message: error.toString());
    }
  }

  void toggle(String id, bool selected) {
    final next = {...state.selected};
    selected ? next.add(id) : next.remove(id);
    state = state.copyWith(selected: next);
  }

  Future<void> startQueue() async {
    final selectedVideos = state.videos.where((video) => state.selected.contains(video['id'] as String)).toList();
    await _api.createBulkJob(selectedVideos);
    await _queue.enqueue(selectedVideos);
    state = state.copyWith(message: 'Download queue started');
  }

  Future<void> pauseQueue() => _queue.pause();
  Future<void> resumeQueue() => _queue.resume();
  Future<void> cancelQueue() => _queue.cancel();
}
