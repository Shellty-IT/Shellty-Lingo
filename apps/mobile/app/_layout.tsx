import { useEffect } from "react";

import { NotoSansThai_500Medium } from "@expo-google-fonts/noto-sans-thai";
import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { SpaceGrotesk_700Bold } from "@expo-google-fonts/space-grotesk";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import { Sentry } from "../src/observability";

void SplashScreen.preventAutoHideAsync();

function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    NotoSansThai_500Medium,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_700Bold,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default Sentry.wrap(RootLayout);
