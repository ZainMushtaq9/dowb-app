import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import { useDownloadQueueStore } from "@/stores/downloadQueueStore";

const TASK_NAME = "persistent-download-queue";

TaskManager.defineTask(TASK_NAME, async () => {
  await useDownloadQueueStore.getState().hydrate();
  await useDownloadQueueStore.getState().process();
  return BackgroundFetch.BackgroundFetchResult.NewData;
});

export async function initializeBackgroundQueue() {
  const registered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
  if (!registered) {
    await BackgroundFetch.registerTaskAsync(TASK_NAME, {
      minimumInterval: 15 * 60,
      stopOnTerminate: false,
      startOnBoot: true
    });
  }
}
