import { useEffect, useRef, useState } from "react";
import { AppState, Text, View } from "react-native";
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import type {
  CourseLanguage,
  LearnerExercise,
  LessonAudioResponse,
} from "@shellty/api-contracts";
import type { TranslationMap } from "@shellty/i18n";
import { apiRequest } from "../api";
import { speak, stopSpeech } from "../speech";
import { SpeechRateControl, type SpeechRate } from "../ui/speech-rate-control";
import { SmallButton } from "./shared";
import { styles } from "./styles";
import { sendTelemetry } from "../queries/release";

export function LessonAudioControls({
  token,
  sessionId,
  exercise,
  language,
  copy,
  disabled,
  reading,
  onReading,
}: {
  token: string;
  sessionId: string;
  exercise: LearnerExercise;
  language: CourseLanguage;
  copy: TranslationMap;
  disabled: boolean;
  reading: boolean;
  onReading: () => void;
}) {
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const [phase, setPhase] = useState<"idle" | "loading" | "playing" | "failed">(
    "idle",
  );
  const [source, setSource] = useState<"recording" | "tts">(
    exercise.mediaAssetId ? "recording" : "tts",
  );
  const [rate, setRate] = useState<SpeechRate>(1);
  const generation = useRef(0);
  const active = useRef(false);
  const fallback = useRef(false);
  const mounted = useRef(true);
  const stop = () => {
    generation.current++;
    active.current = false;
    try {
      player.pause();
    } catch {
      /* The native player may already be released during unmount. */
    }
    void stopSpeech().catch(() => undefined);
    if (mounted.current) setPhase("idle");
  };
  useEffect(() => {
    mounted.current = true;
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") stop();
    });
    return () => {
      mounted.current = false;
      stop();
      subscription.remove();
    };
  }, [player]);
  useEffect(() => {
    if (disabled || reading) stop();
  }, [disabled, reading]);

  const playTts = async (epoch: number) => {
    if (!mounted.current || epoch !== generation.current || fallback.current)
      return;
    player.pause();
    fallback.current = true;
    if (exercise.mediaAssetId)
      sendTelemetry(token, "audio_problem", {
        language,
        exerciseId: exercise.id,
        source: "recording",
      });
    setSource("tts");
    try {
      await speak(exercise.prompt, language, rate, () => {
        if (mounted.current && epoch === generation.current)
          setPhase("playing");
      });
      if (mounted.current && epoch === generation.current) {
        active.current = false;
        setPhase("idle");
      }
    } catch {
      if (mounted.current && epoch === generation.current) {
        sendTelemetry(token, "audio_problem", {
          language,
          exerciseId: exercise.id,
          source: "tts",
        });
        active.current = false;
        setPhase("failed");
      }
    }
  };
  useEffect(() => {
    if (!active.current || source !== "recording" || fallback.current) return;
    if (status.error) void playTts(generation.current);
    else if (status.didJustFinish) {
      active.current = false;
      setPhase("idle");
    } else if (status.playing) setPhase("playing");
  }, [status.error, status.didJustFinish, status.playing, source]);
  useEffect(() => {
    if (phase !== "loading" || source !== "recording") return;
    const timer = setTimeout(() => {
      if (active.current && !fallback.current) void playTts(generation.current);
    }, 12000);
    return () => clearTimeout(timer);
  }, [phase, source]);
  const play = async () => {
    if (disabled || reading || active.current) return;
    active.current = true;
    fallback.current = false;
    const epoch = ++generation.current;
    setPhase("loading");
    try {
      await stopSpeech();
      if (!mounted.current || epoch !== generation.current) return;
      await setAudioModeAsync({ playsInSilentMode: true });
      if (!mounted.current || epoch !== generation.current) return;
      if (exercise.mediaAssetId) {
        setSource("recording");
        const audio = await apiRequest<LessonAudioResponse>(
          `/learning/sessions/${sessionId}/exercises/${exercise.id}/audio`,
          { token },
        );
        if (
          !mounted.current ||
          epoch !== generation.current ||
          fallback.current
        )
          return;
        player.replace({ uri: audio.url });
        player.setPlaybackRate(rate);
        player.play();
      } else await playTts(epoch);
    } catch {
      await playTts(epoch);
    }
  };
  return (
    <View style={styles.options}>
      <Text style={styles.detail}>
        {source === "recording" ? copy.audioRecording : copy.audioSynthetic}
      </Text>
      <Text accessibilityLiveRegion="polite" style={styles.detail}>
        {phase === "loading"
          ? copy.loading
          : phase === "playing"
            ? copy.audioPlaying
            : phase === "failed"
              ? copy.audioUnavailableReading
              : ""}
      </Text>
      <View style={styles.listeningActions}>
        <SmallButton
          label={copy.listen}
          disabled={
            disabled || reading || phase === "loading" || phase === "playing"
          }
          onPress={() => void play()}
        />
        {phase === "loading" || phase === "playing" ? (
          <SmallButton label={copy.audioStop} onPress={stop} />
        ) : null}
        <SpeechRateControl
          value={rate}
          onChange={setRate}
          disabled={disabled || active.current || reading}
        />
      </View>
      {!reading ? (
        <SmallButton
          label={copy.readingAlternative}
          disabled={disabled}
          onPress={() => {
            stop();
            onReading();
          }}
        />
      ) : null}
    </View>
  );
}
