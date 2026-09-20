import { useEffect } from "react";
import * as Updates from "expo-updates";

import { Sentry } from "./observability";

let reloadRequested = false;

export const useAutomaticUpdates = (): void => {
  const { isUpdatePending } = Updates.useUpdates();

  useEffect(() => {
    if (!isUpdatePending || reloadRequested) return;
    reloadRequested = true;
    void Updates.reloadAsync().catch((error: unknown) => {
      reloadRequested = false;
      Sentry.captureException(error, {
        tags: { operation: "apply_automatic_update" },
      });
    });
  }, [isUpdatePending]);
};
