import { RestRing } from "@core/ui/RestRing";
import { palette, useTheme } from "@core/ui/theme";
import { usePlayerStore } from "@modules/session-player/playerStore";
import {
  useFinishSession,
  useSessionDetail,
  useToggleSessionSetComplete,
  useUpdateSessionSet,
} from "@modules/session-player/useSessionPlayer";
import { ResizeMode, Video } from "expo-av";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Check,
  Image as ImageIcon,
  Pause,
  Play,
  Plus,
  SkipForward,
  X,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  AppState,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { data: session } = useSessionDetail(Number(id));

  const toggleComplete = useToggleSessionSetComplete();
  const updateSet = useUpdateSessionSet();
  const finish = useFinishSession();

  const store = usePlayerStore();
  const [mediaModalUri, setMediaModalUri] = useState<string | null>(null);
  const appState = useRef(AppState.currentState);
  const restoredFor = useRef<number | null>(null);

  // Reset player state every time we open a (different) session
  useEffect(() => {
    store.reset();
    restoredFor.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Timer tick logic
  useEffect(() => {
    if (!store.timerRunning) return;
    const interval = setInterval(() => store.tickRest(), 1000);
    return () => clearInterval(interval);
  }, [store.timerRunning]);

  // Auto-advance when timer hits 0
  useEffect(() => {
    if (
      store.view === "resting" &&
      store.restSeconds === 0 &&
      !store.timerRunning
    ) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      store.stopRest();
    }
  }, [store.restSeconds, store.timerRunning, store.view]);

  // Pause timer when app goes to background
  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (
        appState.current.match(/active/) &&
        nextState.match(/inactive|background/)
      ) {
        store.setTimerRunning(false);
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, []);

  // ✅ Restore state exactly ONCE per session (not on every refetch)
  useEffect(() => {
    if (!session) return;
    if (restoredFor.current === session.id) return;
    restoredFor.current = session.id;

    // Finished (completed / aborted) → read-only summary
    if (session.status !== "in_progress") {
      store.showSummary();
      return;
    }

    // Find first uncompleted set → jump straight into playing
    for (let exIdx = 0; exIdx < session.exercises.length; exIdx++) {
      const ex = session.exercises[exIdx];
      for (let setIdx = 0; setIdx < ex.sets.length; setIdx++) {
        if (ex.sets[setIdx].completed === 0) {
          store.setIndices(exIdx, setIdx);
          store.setView("playing");
          return;
        }
      }
    }

    // in_progress but every set done → summary so you can Save & Finish
    store.showSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  if (!session)
    return <View style={[styles.root, { backgroundColor: colors.bg }]} />;

  const currentEx = session.exercises[store.currentExerciseIndex];
  const currentSet = currentEx?.sets[store.currentSetIndex];

  const isReadOnly = session.status !== "in_progress";
  const wasCompleted = session.status === "completed";
  const wasAborted = session.status === "aborted";

  const handleStart = () => store.setView("playing");

  const handleCompleteSet = () => {
    if (!currentSet) return;
    toggleComplete.mutate({ setId: currentSet.id, completed: true });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const isLastSetOfExercise =
      store.currentSetIndex === currentEx.sets.length - 1;
    const isLastExercise =
      store.currentExerciseIndex === session.exercises.length - 1;
    const restTime = currentSet.rest_seconds;

    if (isLastSetOfExercise && isLastExercise) {
      store.showSummary();
      return;
    }

    if (restTime > 0) store.startRest(restTime);

    if (isLastSetOfExercise) {
      store.setIndices(store.currentExerciseIndex + 1, 0);
    } else {
      store.setIndices(store.currentExerciseIndex, store.currentSetIndex + 1);
    }
  };

  const handleToggleComplete = (
    setId: number,
    isCurrentlyCompleted: boolean,
  ) => {
    toggleComplete.mutate({ setId, completed: !isCurrentlyCompleted });
  };

  const handleSaveSession = (status: "completed" | "aborted") => {
    finish.mutate(
      { sessionId: session.id, status },
      { onSuccess: () => router.back() },
    );
  };

  const handleAbandon = () => {
    Alert.alert("Abandon session?", "Your progress will be saved as aborted.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Abandon",
        style: "destructive",
        onPress: () => handleSaveSession("aborted"),
      },
    ]);
  };

  const handleClose = () => router.back();

  const totalSets = session.exercises.reduce(
    (acc, ex) => acc + ex.sets.length,
    0,
  );
  const completedSets = session.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0,
  );
  const progress = totalSets > 0 ? completedSets / totalSets : 0;

  const volume = session.exercises.reduce(
    (vol, ex) =>
      vol +
      ex.sets.reduce(
        (sv, s) =>
          sv + (s.completed && s.weight > 0 ? (s.reps || 0) * s.weight : 0),
        0,
      ),
    0,
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={isReadOnly ? handleClose : handleAbandon}
          style={styles.closeBtn}
        >
          <X size={24} color={colors.text} />
        </Pressable>
        <View style={styles.progressWrap}>
          <View
            style={[styles.progressBar, { backgroundColor: colors.border }]}
          >
            <View
              style={[styles.progressFill, { width: `${progress * 100}%` }]}
            />
          </View>
          <Text style={[styles.progressText, { color: colors.subtext }]}>
            {completedSets}/{totalSets} sets
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* OVERVIEW */}
          {store.view === "overview" && !isReadOnly && (
            <View style={styles.center}>
              <Text style={[styles.title, { color: colors.text }]}>Ready?</Text>
              <Text style={[styles.sub, { color: colors.subtext }]}>
                {session.exercises.length} exercises • {totalSets} sets
              </Text>
              <Pressable onPress={handleStart} style={styles.primaryBtn}>
                <Play size={20} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>Start Workout</Text>
              </Pressable>
            </View>
          )}

          {/* PLAYING */}
          {store.view === "playing" &&
            currentEx &&
            currentSet &&
            !isReadOnly && (
              <View style={styles.playingWrap}>
                <View style={styles.exHeader}>
                  <View>
                    <Text style={[styles.exNum, { color: colors.subtext }]}>
                      Exercise {store.currentExerciseIndex + 1} of{" "}
                      {session.exercises.length}
                    </Text>
                    <Text style={[styles.exName, { color: colors.text }]}>
                      {currentEx.exercise_name}
                    </Text>
                    <Text style={[styles.exSub, { color: colors.subtext }]}>
                      {currentEx.exercise_muscle_group}
                    </Text>
                  </View>
                  {currentEx.exercise_media_uri && (
                    <Pressable
                      onPress={() =>
                        setMediaModalUri(currentEx.exercise_media_uri)
                      }
                      style={styles.formBtn}
                    >
                      {currentEx.exercise_media_uri.endsWith(".mp4") ? (
                        <Play size={16} color={palette.green} />
                      ) : (
                        <ImageIcon size={16} color={palette.green} />
                      )}
                      <Text style={styles.formBtnText}>Form</Text>
                    </Pressable>
                  )}
                </View>

                <View
                  style={[styles.setsCard, { backgroundColor: colors.surface }]}
                >
                  <View style={styles.setRow}>
                    <Text
                      style={[
                        styles.setHead,
                        { color: colors.subtext, width: 30 },
                      ]}
                    >
                      Set
                    </Text>
                    <Text
                      style={[
                        styles.setHead,
                        styles.setInput,
                        { color: colors.subtext },
                      ]}
                    >
                      Reps
                    </Text>
                    <Text
                      style={[
                        styles.setHead,
                        styles.setInput,
                        { color: colors.subtext },
                      ]}
                    >
                      Weight
                    </Text>
                    <View style={{ width: 30 }} />
                  </View>

                  {currentEx.sets.map((s, idx) => {
                    const isCurrent = idx === store.currentSetIndex;
                    return (
                      <View
                        key={s.id}
                        style={[
                          styles.setRow,
                          isCurrent && {
                            backgroundColor: palette.green + "11",
                            borderRadius: 8,
                            paddingHorizontal: 4,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.setNum,
                            { color: isCurrent ? colors.text : colors.subtext },
                          ]}
                        >
                          {idx + 1}
                        </Text>

                        {s.completed === 1 ? (
                          <Pressable
                            onPress={() => handleToggleComplete(s.id, true)}
                            style={[styles.setInput, { alignItems: "center" }]}
                          >
                            <Text
                              style={[
                                styles.completedText,
                                { color: palette.green },
                              ]}
                            >
                              {s.reps ?? "-"}
                            </Text>
                          </Pressable>
                        ) : (
                          <TextInput
                            style={[
                              styles.setInput,
                              {
                                backgroundColor: colors.bg,
                                color: colors.text,
                              },
                            ]}
                            keyboardType="number-pad"
                            value={s.reps?.toString() ?? ""}
                            onChangeText={(t) =>
                              updateSet.mutate({
                                setId: s.id,
                                reps: t === "" ? null : Number(t),
                                weight: s.weight,
                              })
                            }
                          />
                        )}

                        {s.completed === 1 ? (
                          <Pressable
                            onPress={() => handleToggleComplete(s.id, true)}
                            style={[styles.setInput, { alignItems: "center" }]}
                          >
                            <Text
                              style={[
                                styles.completedText,
                                { color: palette.green },
                              ]}
                            >
                              {s.weight === 0 ? "BW" : `${s.weight}`}
                            </Text>
                          </Pressable>
                        ) : (
                          <TextInput
                            style={[
                              styles.setInput,
                              {
                                backgroundColor: colors.bg,
                                color: colors.text,
                              },
                            ]}
                            keyboardType="number-pad"
                            value={s.weight.toString()}
                            onChangeText={(t) =>
                              updateSet.mutate({
                                setId: s.id,
                                reps: s.reps,
                                weight: Number(t) || 0,
                              })
                            }
                          />
                        )}

                        {s.completed === 1 ? (
                          <Pressable
                            onPress={() => handleToggleComplete(s.id, true)}
                            hitSlop={8}
                          >
                            <Check size={20} color={palette.green} />
                          </Pressable>
                        ) : (
                          <View style={{ width: 20 }} />
                        )}
                      </View>
                    );
                  })}
                </View>

                <Pressable
                  onPress={handleCompleteSet}
                  disabled={currentSet.completed === 1}
                  style={[
                    styles.completeBtn,
                    currentSet.completed === 1 && { opacity: 0.5 },
                  ]}
                >
                  <Check size={20} color="#FFFFFF" />
                  <Text style={styles.completeBtnText}>Complete Set</Text>
                </Pressable>
              </View>
            )}

          {/* RESTING */}
          {store.view === "resting" && !isReadOnly && (
            <View style={styles.center}>
              <RestRing
                seconds={store.restSeconds}
                totalSeconds={currentSet?.rest_seconds ?? 60}
              />

              <View style={styles.restActions}>
                <Pressable
                  onPress={() => store.addTime(30)}
                  style={[styles.restBtn, { backgroundColor: colors.surface }]}
                >
                  <Plus size={20} color={colors.text} />
                  <Text style={[styles.restBtnText, { color: colors.text }]}>
                    +30s
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => store.setTimerRunning(!store.timerRunning)}
                  style={[styles.restBtn, { backgroundColor: colors.surface }]}
                >
                  {store.timerRunning ? (
                    <Pause size={20} color={colors.text} />
                  ) : (
                    <Play size={20} color={colors.text} />
                  )}
                </Pressable>

                <Pressable
                  onPress={() => store.stopRest()}
                  style={[styles.restBtn, { backgroundColor: colors.surface }]}
                >
                  <SkipForward size={20} color={colors.text} />
                  <Text style={[styles.restBtnText, { color: colors.text }]}>
                    Skip
                  </Text>
                </Pressable>
              </View>

              {session.exercises[store.currentExerciseIndex] && (
                <Text style={[styles.nextText, { color: colors.subtext }]}>
                  Next:{" "}
                  {session.exercises[store.currentExerciseIndex].exercise_name}{" "}
                  • Set {store.currentSetIndex + 1}
                </Text>
              )}
            </View>
          )}

          {/* SUMMARY */}
          {store.view === "summary" && (
            <View style={styles.summaryWrap}>
              {wasAborted ? (
                <X size={48} color="#B3261E" />
              ) : (
                <Check size={48} color={palette.green} />
              )}

              <Text
                style={[
                  styles.title,
                  { color: colors.text, marginTop: 16, textAlign: "center" },
                ]}
              >
                {wasAborted
                  ? "Session Aborted"
                  : wasCompleted
                    ? "Session Complete"
                    : "Session Complete!"}
              </Text>

              {isReadOnly && session.started_at && (
                <Text
                  style={[
                    styles.sub,
                    { color: colors.subtext, textAlign: "center" },
                  ]}
                >
                  {new Date(session.started_at).toLocaleString()}
                </Text>
              )}

              <View
                style={[styles.statsCard, { backgroundColor: colors.surface }]}
              >
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, { color: colors.subtext }]}>
                    Volume
                  </Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {Math.round(volume).toLocaleString()} kg
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, { color: colors.subtext }]}>
                    Sets done
                  </Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {completedSets}/{totalSets}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, { color: colors.subtext }]}>
                    Status
                  </Text>
                  <Text
                    style={[
                      styles.statValue,
                      { color: wasAborted ? "#B3261E" : palette.green },
                    ]}
                  >
                    {session.status}
                  </Text>
                </View>
              </View>

              {/* Per-exercise breakdown */}
              <View
                style={[styles.statsCard, { backgroundColor: colors.surface }]}
              >
                {session.exercises.map((ex) => (
                  <View key={ex.exercise_id} style={styles.breakdownEx}>
                    <Text
                      style={[styles.breakdownName, { color: colors.text }]}
                    >
                      {ex.exercise_name}
                    </Text>
                    {ex.sets.map((s) => (
                      <View key={s.id} style={styles.breakdownRow}>
                        {s.completed === 1 ? (
                          <Check size={14} color={palette.green} />
                        ) : (
                          <View
                            style={[
                              styles.dashDot,
                              { borderColor: colors.subtext },
                            ]}
                          />
                        )}
                        <Text
                          style={[
                            styles.breakdownSet,
                            { color: colors.subtext },
                          ]}
                        >
                          Set {s.set_number}: {s.reps ?? "—"} ×{" "}
                          {s.weight === 0 ? "BW" : `${s.weight} kg`}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>

              {isReadOnly ? (
                <Pressable onPress={handleClose} style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>Close</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => handleSaveSession("completed")}
                  style={styles.primaryBtn}
                >
                  <Text style={styles.primaryBtnText}>Save & Finish</Text>
                </Pressable>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Media Modal */}
      <Modal visible={!!mediaModalUri} transparent animationType="fade">
        <View style={[styles.modalBg, { backgroundColor: "rgba(0,0,0,0.9)" }]}>
          <Pressable
            onPress={() => setMediaModalUri(null)}
            style={styles.modalClose}
          >
            <X size={28} color="#FFFFFF" />
          </Pressable>
          {mediaModalUri?.endsWith(".mp4") ? (
            <Video
              source={{ uri: mediaModalUri }}
              style={{ width: "100%", height: 300 }}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
            />
          ) : (
            <Image
              source={{ uri: mediaModalUri! }}
              style={{ width: "100%", height: 400 }}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    gap: 12,
  },
  closeBtn: { padding: 4 },
  progressWrap: { flex: 1, gap: 4 },
  progressBar: { height: 4, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: 4, backgroundColor: palette.green, borderRadius: 2 },
  progressText: { fontSize: 11, textAlign: "center" },
  content: { padding: 20, flexGrow: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  summaryWrap: { alignItems: "center", gap: 16, paddingBottom: 24 },
  title: { fontSize: 24, fontWeight: "700" },
  sub: { fontSize: 14 },
  primaryBtn: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.green,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 8,
  },
  primaryBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },

  playingWrap: { flex: 1, gap: 20 },
  exHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  exNum: { fontSize: 12, fontWeight: "600" },
  exName: { fontSize: 20, fontWeight: "700", marginTop: 2 },
  exSub: { fontSize: 13, marginTop: 2 },
  formBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.green,
  },
  formBtnText: { fontSize: 12, fontWeight: "600", color: palette.green },

  setsCard: { borderRadius: 16, padding: 16, gap: 10 },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  setHead: { fontSize: 11, fontWeight: "700" },
  setNum: { width: 30, fontSize: 14, fontWeight: "600" },
  setInput: {
    flex: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    textAlign: "center",
  },
  completedText: { fontSize: 15, fontWeight: "700" },

  completeBtn: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.green,
    borderRadius: 16,
    paddingVertical: 18,
  },
  completeBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },

  restActions: { flexDirection: "row", gap: 20, marginTop: 24 },
  restBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  restBtnText: { fontSize: 10, fontWeight: "700" },
  nextText: { fontSize: 14, marginTop: 24 },

  statsCard: { width: "100%", borderRadius: 16, padding: 20, gap: 12 },
  statRow: { flexDirection: "row", justifyContent: "space-between" },
  statLabel: { fontSize: 14 },
  statValue: { fontSize: 16, fontWeight: "700" },

  breakdownEx: { gap: 6, marginBottom: 8 },
  breakdownName: { fontSize: 14, fontWeight: "700" },
  breakdownRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  breakdownSet: { fontSize: 13 },
  dashDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5 },

  modalBg: { flex: 1, alignItems: "center", justifyContent: "center" },
  modalClose: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
});
