import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { initializeBackgroundQueue } from "@/services/backgroundQueue";
import { useRuntimeConfigStore } from "@/stores/runtimeConfigStore";

const queryClient = new QueryClient();

export default function RootLayout() {
  const hydrateConfig = useRuntimeConfigStore((state) => state.hydrate);

  useEffect(() => {
    hydrateConfig();
    initializeBackgroundQueue();
  }, [hydrateConfig]);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
