import { create } from "zustand";
import { api, setApiBaseUrl } from "@/services/api";

interface RuntimeConfigState {
  ads: Record<string, unknown>;
  features: Record<string, unknown>;
  hydrate: () => Promise<void>;
}

export const useRuntimeConfigStore = create<RuntimeConfigState>((set) => ({
  ads: {},
  features: {},
  hydrate: async () => {
    const config = await api.config().catch(() => null);
    if (config) {
      setApiBaseUrl(config.features?.api_base_url as string | undefined);
      set({ ads: config.ads, features: config.features });
    }
  }
}));
