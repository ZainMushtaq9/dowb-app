import { View } from "react-native";
import { BannerAd, BannerAdSize, TestIds } from "react-native-google-mobile-ads";
import { useRuntimeConfigStore } from "@/stores/runtimeConfigStore";

export function AdBanner() {
  const ads = useRuntimeConfigStore((state) => state.ads);

  if (!ads.mobile_ads_enabled || ads.emergency_disable) {
    return <View style={{ minHeight: 56 }} />;
  }

  const unitId = typeof ads.banner_ad_unit === "string" && ads.banner_ad_unit ? ads.banner_ad_unit : TestIds.BANNER;

  return (
    <View style={{ minHeight: 56, alignItems: "center", justifyContent: "center" }}>
      <BannerAd unitId={unitId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} requestOptions={{ requestNonPersonalizedAdsOnly: true }} />
    </View>
  );
}
