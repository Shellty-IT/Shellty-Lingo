import { useEffect, useState } from "react";

import { NotoSansThai_500Medium } from "@expo-google-fonts/noto-sans-thai";
import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { SpaceGrotesk_700Bold } from "@expo-google-fonts/space-grotesk";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import { isRetryableRequestError } from "../src/api";
import { Sentry } from "../src/observability";

void SplashScreen.preventAutoHideAsync();

function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    NotoSansThai_500Medium,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_700Bold,
    SpaceGrotesk_700Bold,
  });
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: (failureCount, error) =>
              failureCount < 2 && isRetryableRequestError(error),
            staleTime: 30_000,
          },
          mutations: {
            retry: false,
          },
        },
      }),
  );

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}

export default Sentry.wrap(RootLayout);
