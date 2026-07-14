"use client";

import { useState } from "react";

import type { HealthResponse } from "@shellty/api-contracts";

type State = "idle" | "loading" | "online" | "offline";

export function HealthStatus() {
  const [state, setState] = useState<State>("idle");
  const [health, setHealth] = useState<HealthResponse>();

  async function check(): Promise<void> {
    setState("loading");
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/v1";
      const response = await fetch(`${baseUrl}/health/live`);
      const body = (await response.json()) as HealthResponse;
      if (!response.ok || body.status !== "ok")
        throw new Error("Unhealthy API");
      setHealth(body);
      setState("online");
    } catch {
      setHealth(undefined);
      setState("offline");
    }
  }

  return (
    <section className="health-card" aria-live="polite">
      <div>
        <span className={`status-dot status-${state}`} aria-hidden="true" />
        <strong>API foundation</strong>
        <p>
          {state === "online" && health
            ? `Działa · ${health.environment} · ${health.version}`
            : state === "offline"
              ? "Brak połączenia z API"
              : "Sprawdź lokalny healthcheck i correlation ID"}
        </p>
      </div>
      <button
        type="button"
        onClick={() => void check()}
        disabled={state === "loading"}
      >
        {state === "loading" ? "Sprawdzanie…" : "Sprawdź połączenie"}
      </button>
    </section>
  );
}
