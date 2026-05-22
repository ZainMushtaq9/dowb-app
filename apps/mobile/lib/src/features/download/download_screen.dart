import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'download_controller.dart';

class DownloadScreen extends ConsumerStatefulWidget {
  const DownloadScreen({super.key});

  @override
  ConsumerState<DownloadScreen> createState() => _DownloadScreenState();
}

class _DownloadScreenState extends ConsumerState<DownloadScreen> {
  final controller = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(downloadControllerProvider);
    final notifier = ref.read(downloadControllerProvider.notifier);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Image.asset('assets/app-logo.png', width: 28, height: 28),
            const SizedBox(width: 8),
            const Text('TikTok Downloader'),
          ],
        ),
      ),
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverPadding(
              padding: const EdgeInsets.all(12),
              sliver: SliverList.list(
                children: [
                  SegmentedButton<DownloadMode>(
                    segments: const [
                      ButtonSegment(value: DownloadMode.video, label: Text('Single')),
                      ButtonSegment(value: DownloadMode.profile, label: Text('Profile')),
                    ],
                    selected: {state.mode},
                    onSelectionChanged: (value) => notifier.setMode(value.first),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: controller,
                    decoration: const InputDecoration(border: OutlineInputBorder(), hintText: 'Paste public TikTok URL'),
                  ),
                  const SizedBox(height: 10),
                  FilledButton(
                    onPressed: state.loading ? null : () => notifier.submit(controller.text),
                    child: Text(state.loading ? 'Loading' : 'Download'),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(child: FilledButton.tonal(onPressed: state.videos.isEmpty ? null : notifier.startQueue, child: const Text('Download Selected'))),
                      const SizedBox(width: 8),
                      IconButton(onPressed: notifier.pauseQueue, icon: const Icon(Icons.pause)),
                      IconButton(onPressed: notifier.resumeQueue, icon: const Icon(Icons.play_arrow)),
                      IconButton(onPressed: notifier.cancelQueue, icon: const Icon(Icons.close)),
                    ],
                  ),
                  if (state.message.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 8), child: Text(state.message)),
                ],
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              sliver: SliverGrid.builder(
                gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                  maxCrossAxisExtent: 190,
                  mainAxisSpacing: 8,
                  crossAxisSpacing: 8,
                  childAspectRatio: .72,
                ),
                itemCount: state.videos.length,
                itemBuilder: (context, index) {
                  final video = state.videos[index];
                  final id = video['id'] as String;
                  return RepaintBoundary(
                    child: Card(
                      clipBehavior: Clip.antiAlias,
                      child: InkWell(
                        onTap: () => notifier.toggle(id, !state.selected.contains(id)),
                        child: Column(
                          children: [
                            Expanded(
                              child: CachedNetworkImage(
                                imageUrl: video['thumbnailUrl'] as String? ?? '',
                                fit: BoxFit.cover,
                                memCacheWidth: 240,
                                errorWidget: (_, __, ___) => const ColoredBox(color: Color(0xffeeeeee)),
                              ),
                            ),
                            CheckboxListTile(
                              dense: true,
                              value: state.selected.contains(id),
                              onChanged: (value) => notifier.toggle(id, value ?? false),
                              title: Text(video['title'] as String? ?? 'Video', maxLines: 1, overflow: TextOverflow.ellipsis),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            if (state.hasMore)
              SliverPadding(
                padding: const EdgeInsets.all(12),
                sliver: SliverToBoxAdapter(
                  child: OutlinedButton(onPressed: state.loading ? null : () => notifier.submit(controller.text, append: true), child: const Text('Load More')),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
