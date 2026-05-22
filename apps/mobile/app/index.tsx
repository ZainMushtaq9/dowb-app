import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, SafeAreaView, Text, TextInput, View } from "react-native";
import { AdBanner } from "@/components/AdBanner";
import { useDownloadQueueStore } from "@/stores/downloadQueueStore";

export default function DownloadScreen() {
  const [url, setUrl] = useState("");
  const { items, hydrate, enqueue, process, pause, resume, cancelAll, retryFailed, clearCompleted } = useDownloadQueueStore();

  useEffect(() => {
    hydrate().then(process);
  }, [hydrate, process]);

  const add = useCallback(async () => {
    if (!url.includes("tiktok.com")) return;
    await enqueue([{ id: String(Date.now()), url, title: "TikTok video", username: "unknown", thumbnailUrl: "" }]);
    setUrl("");
    process();
  }, [enqueue, process, url]);

  const completed = items.filter((item) => item.state === "completed").length;
  const active = items.find((item) => item.state === "downloading" || item.state === "retrying");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f7f2" }}>
      <View style={{ padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 28, fontWeight: "700", color: "#101214" }}>TikTok Downloader</Text>
        <TextInput
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          placeholder="Paste public TikTok URL"
          style={{ height: 48, borderWidth: 1, borderColor: "#ddd", borderRadius: 8, paddingHorizontal: 12, backgroundColor: "white" }}
        />
        <Pressable onPress={add} style={{ height: 48, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#ff5a5f" }}>
          <Text style={{ color: "white", fontWeight: "700" }}>Download Selected</Text>
        </Pressable>
        <Text style={{ color: "#333" }}>
          Downloading {Math.min(completed + (active ? 1 : 0), items.length)} of {items.length}
        </Text>
        <AdBanner />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <QueueButton label="Pause" onPress={pause} />
          <QueueButton label="Resume" onPress={() => resume().then(process)} />
          <QueueButton label="Retry Failed" onPress={() => retryFailed().then(process)} />
          <QueueButton label="Cancel All" onPress={cancelAll} />
          <QueueButton label="Clear Done" onPress={clearCompleted} />
        </View>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews
        contentContainerStyle={{ padding: 16, gap: 8 }}
        renderItem={({ item, index }) => (
          <View style={{ minHeight: 64, borderRadius: 8, backgroundColor: "white", padding: 12 }}>
            <Text numberOfLines={1} style={{ fontWeight: "700" }}>
              {index + 1}. {item.filename || item.title}
            </Text>
            <Text style={{ marginTop: 4, color: "#666" }}>
              {item.state} {item.progress ? `(${item.progress}%)` : ""} {item.retryCount ? `retry ${item.retryCount}` : ""}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

function QueueButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ minHeight: 40, borderRadius: 8, borderWidth: 1, borderColor: "#ddd", paddingHorizontal: 12, justifyContent: "center" }}>
      <Text>{label}</Text>
    </Pressable>
  );
}
