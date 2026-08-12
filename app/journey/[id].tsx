import { LinearGradient } from "expo-linear-gradient";
import { dialog } from "@core/ui/dialogStore";
import { palette, useTheme } from "@core/ui/theme";
import { daysBetween, todayISO } from "@core/utils/dates";
import { pickJourneyPhoto, takeJourneyPhoto } from "@core/utils/media";
import { SessionPreviewModal } from "@modules/home/SessionPreviewModal";
import {
  useDeleteJourney,
  useJourney,
  useUpdateJourney,
} from "@modules/journeys/useJourneys";
import {
  getActiveSessionForWorkout,
  getLastSessionForWorkout,
} from "@modules/session-player/repository";
import {
  useDeleteSession,
  useSessionsByJourney,
  useStartSession,
  useTodayWorkouts,
} from "@modules/session-player/useSessionPlayer";
import { useWorkoutsByJourney } from "@modules/workouts/useWorkouts";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Dumbbell,
  History,
  Map,
  Play,
  Plus,
  Quote,
  Trash2,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HISTORY_LIMIT = 3;

export default function JourneyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: journey } = useJourney(Number(id));
  const { data: workouts } = useWorkoutsByJourney(Number(id));
  const { data: sessions } = useSessionsByJourney(Number(id));
  const { data: todayWorkoutIds } = useTodayWorkouts(Number(id));
  const update = useUpdateJourney();
  const remove = useDeleteJourney();
  const startSession = useStartSession();
  const deleteSession = useDeleteSession();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [showAllSessions, setShowAllSessions] = useState(false);
  const [showCompleteSheet, setShowCompleteSheet] = useState(false);
  const [previewWorkoutId, setPreviewWorkoutId] = useState<number | null>(null);
  const [afterPhotoUri, setAfterPhotoUri] = useState<string | null>(null);
  const [completionNote, setCompletionNote] = useState("");

  useEffect(() => {
    if (!journey) return;
    setAfterPhotoUri(journey.after_photo_uri ?? null);
    setCompletionNote(journey.completion_note ?? "");
  }, [journey?.id, journey?.after_photo_uri, journey?.completion_note]);

  if (!journey)
    return <View style={[styles.root, { backgroundColor: colors.bg }]} />;

  const dayX = Math.max(1, daysBetween(journey.start_date, todayISO()) + 1);
  const total = journey.end_date
    ? daysBetween(journey.start_date, journey.end_date) + 1
    : null;
  const active = journey.status === "active";
  const completed = journey.status === "completed";

  const sortedWorkouts = [...(workouts ?? [])].sort((a, b) => {
    const aToday = todayWorkoutIds?.includes(a.id) ? 0 : 1;
    const bToday = todayWorkoutIds?.includes(b.id) ? 0 : 1;
    return aToday - bToday;
  });

  const progressPct =
    total && total > 0 ? Math.min(100, Math.max(0, (dayX / total) * 100)) : 0;

  const photoActions = () =>
    dialog.alert(
      "Journey photo",
      undefined,
      [
        {
          label: "Take photo",
          onPress: async () => {
            const uri = await takeJourneyPhoto();
            if (uri)
              update.mutate({
                id: journey.id,
                patch: { before_photo_uri: uri },
              });
          },
        },
        {
          label: "Choose from gallery",
          onPress: async () => {
            const uri = await pickJourneyPhoto();
            if (uri)
              update.mutate({
                id: journey.id,
                patch: { before_photo_uri: uri },
              });
          },
        },
      ],
      { variant: "sheet", icon: Camera },
    );

  const openCompleteSheet = () => {
    setAfterPhotoUri(journey.after_photo_uri ?? null);
    setCompletionNote(journey.completion_note ?? "");
    setShowCompleteSheet(true);
  };

  const closeCompleteSheet = () => {
    setShowCompleteSheet(false);
    setAfterPhotoUri(journey.after_photo_uri ?? null);
    setCompletionNote(journey.completion_note ?? "");
  };

  const handleAfterPhotoOptions = () => {
    dialog.alert(
      "After photo",
      undefined,
      [
        {
          label: "Take photo",
          onPress: async () => {
            const uri = await takeJourneyPhoto();
            if (uri) setAfterPhotoUri(uri);
          },
        },
        {
          label: "Choose from gallery",
          onPress: async () => {
            const uri = await pickJourneyPhoto();
            if (uri) setAfterPhotoUri(uri);
          },
        },
        ...(afterPhotoUri
          ? [
              {
                label: "Remove",
                style: "destructive" as const,
                onPress: () => setAfterPhotoUri(null),
              },
            ]
          : []),
      ],
      { variant: "sheet", icon: Camera },
    );
  };

  const confirmComplete = () => {
    const trimmed = completionNote.trim();
    update.mutate(
      {
        id: journey.id,
        patch: {
          after_photo_uri: afterPhotoUri ?? null,
          completion_note: trimmed || null,
          status: "completed",
        },
      },
      {
        onSuccess: () => {
          setShowCompleteSheet(false);
          setAfterPhotoUri(journey.after_photo_uri ?? null);
          setCompletionNote(journey.completion_note ?? "");
        },
      },
    );
  };

  const destroy = () =>
    dialog.alert(
      "Delete journey",
      "This also deletes its workouts and sessions. Cannot be undone.",
      [
        {
          label: "Delete",
          style: "destructive",
          onPress: () =>
            remove.mutate(journey.id, { onSuccess: () => router.back() }),
        },
      ],
      { icon: Trash2 },
    );

  const playWorkout = (workoutId: number) => {
    setPreviewWorkoutId(workoutId);
  };

  const confirmPlayWorkout = async () => {
    if (!previewWorkoutId) return;

    try {
      const activeSession = await getActiveSessionForWorkout(previewWorkoutId);
      if (activeSession) {
        setPreviewWorkoutId(null);
        router.push(`/session/${activeSession.id}`);
        return;
      }

      const lastSession = await getLastSessionForWorkout(previewWorkoutId);
      if (lastSession) {
        setPreviewWorkoutId(null);
        dialog.alert(
          "Session History",
          `You completed this on ${lastSession.started_at?.slice(0, 10)} (${lastSession.sets_done} sets, ${Math.round(lastSession.volume).toLocaleString()} kg)`,
          [
            {
              label: "View Last Session",
              onPress: () => router.push(`/session/${lastSession.id}`),
            },
            {
              label: "Start Fresh",
              onPress: () => doStartSession(previewWorkoutId),
            },
          ],
          { variant: "sheet", icon: History },
        );
      } else {
        doStartSession(previewWorkoutId);
        setPreviewWorkoutId(null);
      }
    } catch {
      setPreviewWorkoutId(null);
      doStartSession(previewWorkoutId);
    }
  };

  const doStartSession = (workoutId: number) => {
    startSession.mutate(
      { workoutId, journeyId: journey.id },
      { onSuccess: (sessionId) => router.push(`/session/${sessionId}`) },
    );
  };

  const handleDeleteSession = (sessionId: number) => {
    dialog.alert(
      "Delete session?",
      "This will remove the session from history.",
      [
        {
          label: "Delete",
          style: "destructive",
          onPress: () => deleteSession.mutate(sessionId),
        },
      ],
      { icon: Trash2 },
    );
  };

  const visibleSessions = showAllSessions
    ? sessions
    : sessions?.slice(0, HISTORY_LIMIT);

  const statusColor = completed
    ? palette.green
    : active
      ? palette.green
      : colors.subtext;

  return (
    <>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { backgroundColor: colors.bg, paddingBottom: insets.bottom + 32 },
        ]}
      >
        {/* ─── Hero ─── */}
        <Pressable onPress={photoActions} style={styles.heroWrap}>
          {journey.before_photo_uri ? (
            <View style={styles.heroImageWrap}>
              <Image
                source={{ uri: journey.before_photo_uri }}
                style={styles.heroImage}
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.55)"]}
                style={styles.heroGradient}
              />
            </View>
          ) : (
            <LinearGradient
              colors={["#2a2a2a", "#1a1a1a"]}
              style={styles.heroEmpty}
            >
              <View
                style={[
                  styles.heroIconCircle,
                  { backgroundColor: `${palette.green}18` },
                ]}
              >
                <Map size={28} color={palette.green} />
              </View>
              <Text style={[styles.heroHint, { color: colors.subtext }]}>
                Tap to add a photo
              </Text>
            </LinearGradient>
          )}
        </Pressable>

        {/* ─── Header ─── */}
        <View style={styles.headerCol}>
          <Text style={[styles.name, { color: colors.text }]}>
            {journey.name}
          </Text>
          <View
            style={[
              styles.chip,
              {
                backgroundColor: `${statusColor}18`,
                borderWidth: 1,
                borderColor: `${statusColor}30`,
              },
            ]}
          >
            <Text style={[styles.chipText, { color: statusColor }]}>
              {journey.status}
            </Text>
          </View>
        </View>

        {/* ─── Quote ─── */}
        {journey.purpose_quote ? (
          <View
            style={[
              styles.quoteCard,
              {
                backgroundColor: colors.surface,
                borderLeftColor: colors.accent,
              },
            ]}
          >
            <Quote size={16} color={colors.accent} style={{ marginBottom: 8 }} />
            <Text style={[styles.quote, { color: colors.text }]}>
              “{journey.purpose_quote}”
            </Text>
          </View>
        ) : null}

        {/* ─── Date / Progress ─── */}
        <View
          style={[
            styles.dateCard,
            {
              backgroundColor: colors.surface,
            },
          ]}
        >
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: `${colors.accent}15` },
            ]}
          >
            <CalendarDays size={18} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.datePrimary, { color: colors.text }]}>
              {total ? `Day ${dayX} of ${total}` : `Day ${dayX}`}
            </Text>
            <Text style={[styles.dateSecondary, { color: colors.subtext }]}>
              {journey.start_date} → {journey.end_date ?? "ongoing"}
            </Text>
            {total ? (
              <View
                style={[
                  styles.progressTrack,
                  { backgroundColor: colors.border },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progressPct}%`,
                      backgroundColor: palette.green,
                    },
                  ]}
                />
              </View>
            ) : null}
          </View>
        </View>

        {/* ─── Reflection ─── */}
        {journey.completion_note && (
          <View
            style={[
              styles.reflectionCard,
              {
                backgroundColor: colors.surface,
                borderLeftColor: palette.green,
              },
            ]}
          >
            <View style={styles.reflectionHeader}>
              <Quote size={14} color={palette.green} />
              <Text
                style={[styles.reflectionLabel, { color: colors.subtext }]}
              >
                REFLECTION
              </Text>
            </View>
            <Text style={[styles.reflectionText, { color: colors.text }]}>
              “{journey.completion_note}”
            </Text>
          </View>
        )}

        {/* ─── Workouts ─── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Workouts
          </Text>
          <Pressable
            onPress={() =>
              router.push(`/workout/create?journeyId=${journey.id}`)
            }
            style={[styles.addPill, { backgroundColor: colors.accent }]}
          >
            <Plus size={14} color="#FFFFFF" />
            <Text style={styles.addPillText}>Add</Text>
          </Pressable>
        </View>

        {sortedWorkouts.length === 0 && (
          <Text style={[styles.emptyText, { color: colors.subtext }]}>
            No workouts yet — add your first one
          </Text>
        )}

        <View style={styles.listGap}>
          {sortedWorkouts.map((w) => {
            const isToday = todayWorkoutIds?.includes(w.id);
            return (
              <View
                key={w.id}
                style={[
                  styles.workoutCard,
                  {
                    backgroundColor: colors.surface,
                    borderLeftColor: isToday ? palette.green : "transparent",
                    borderLeftWidth: isToday ? 4 : 0,
                  },
                ]}
              >
                <Pressable
                  onPress={() => router.push(`/workout/${w.id}`)}
                  style={styles.workoutInfo}
                >
                  <View
                    style={[
                      styles.workoutIconCircle,
                      {
                        backgroundColor: isToday
                          ? `${palette.green}18`
                          : colors.border,
                      },
                    ]}
                  >
                    <Dumbbell
                      size={16}
                      color={isToday ? palette.green : colors.subtext}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.workoutName,
                        { color: colors.text },
                      ]}
                    >
                      {w.name}
                    </Text>
                    {isToday && (
                      <View
                        style={[
                          styles.todayBadge,
                          { backgroundColor: `${palette.green}18` },
                        ]}
                      >
                        <Text style={styles.todayBadgeText}>TODAY</Text>
                      </View>
                    )}
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => playWorkout(w.id)}
                  style={[
                    styles.playCircle,
                    { backgroundColor: palette.green },
                  ]}
                >
                  <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
                </Pressable>
              </View>
            );
          })}
        </View>

        {/* ─── Session History ─── */}
        <View style={[styles.sectionHeader, { marginTop: 8 }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Session History
          </Text>
        </View>

        {(!sessions || sessions.length === 0) && (
          <Text style={[styles.emptyText, { color: colors.subtext }]}>
            No sessions yet — play your first workout
          </Text>
        )}

        <View style={styles.listGap}>
          {visibleSessions?.map((s) => {
            const done = s.status === "completed";
            const aborted = s.status === "aborted";
            return (
              <Pressable
                key={s.id}
                onPress={() => router.push(`/session/${s.id}`)}
                style={[
                  styles.historyCard,
                  { backgroundColor: colors.surface },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: done
                        ? palette.green
                        : aborted
                          ? "#B3261E"
                          : colors.subtext,
                    },
                  ]}
                />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text
                    style={[styles.historyName, { color: colors.text }]}
                  >
                    {s.workout_name}
                  </Text>
                  <Text
                    style={[styles.historySub, { color: colors.subtext }]}
                  >
                    {s.started_at?.slice(0, 10)} · {s.sets_done} sets ·{" "}
                    {Math.round(s.volume).toLocaleString()} kg
                  </Text>
                </View>

                <View style={styles.historyMeta}>
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: done
                          ? `${palette.green}18`
                          : aborted
                            ? "#B3261E18"
                            : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        {
                          color: done
                            ? palette.green
                            : aborted
                              ? "#B3261E"
                              : colors.subtext,
                        },
                      ]}
                    >
                      {s.status}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleDeleteSession(s.id)}
                    hitSlop={10}
                    style={styles.deleteHit}
                  >
                    <Trash2 size={15} color="#B3261E" opacity={0.8} />
                  </Pressable>
                </View>
              </Pressable>
            );
          })}
        </View>

        {(sessions?.length ?? 0) > HISTORY_LIMIT && (
          <Pressable
            onPress={() => setShowAllSessions(!showAllSessions)}
            style={styles.showMoreBtn}
          >
            {showAllSessions ? (
              <ChevronUp size={16} color={palette.green} />
            ) : (
              <ChevronDown size={16} color={palette.green} />
            )}
            <Text style={styles.showMoreText}>
              {showAllSessions ? "Show Less" : `Show All (${sessions!.length})`}
            </Text>
          </Pressable>
        )}

        {/* ─── Bottom Actions ─── */}
        <View style={{ height: 8 }} />

        {active ? (
          <View style={styles.bottomActions}>
            <Pressable
              onPress={openCompleteSheet}
              style={[
                styles.completeAction,
                { backgroundColor: colors.accent },
              ]}
            >
              <CheckCircle2 size={18} color="#FFFFFF" />
              <Text style={styles.completeActionText}>Mark as completed</Text>
            </Pressable>

            <Pressable onPress={destroy} style={styles.deleteGhost}>
              <Trash2 size={16} color="#B3261E" />
              <Text style={styles.deleteGhostText}>Delete</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={destroy} style={styles.deleteGhostWide}>
            <Trash2 size={16} color="#B3261E" />
            <Text style={styles.deleteGhostText}>Delete journey</Text>
          </Pressable>
        )}
      </ScrollView>

      <SessionPreviewModal
        open={previewWorkoutId !== null}
        workoutId={previewWorkoutId ?? 0}
        onClose={() => setPreviewWorkoutId(null)}
        onConfirm={confirmPlayWorkout}
      />

      {/* ─── Complete Sheet ─── */}
      <Modal
        visible={showCompleteSheet}
        transparent
        animationType="slide"
        onRequestClose={closeCompleteSheet}
      >
        <Pressable style={styles.sheetBackdrop} onPress={closeCompleteSheet} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={[styles.sheetWrap, { paddingBottom: insets.bottom + 16 }]}
        >
          <View style={[styles.sheet, { backgroundColor: colors.bg }]}>
            <View
              style={[styles.dragHandle, { backgroundColor: colors.border }]}
            />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              Complete "{journey.name}"
            </Text>

            <Pressable
              onPress={handleAfterPhotoOptions}
              style={[
                styles.photoTile,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              {afterPhotoUri ? (
                <Image
                  source={{ uri: afterPhotoUri }}
                  style={styles.photoImage}
                />
              ) : (
                <View style={{ alignItems: "center", gap: 10 }}>
                  <View
                    style={[
                      styles.photoIconCircle,
                      { backgroundColor: `${colors.accent}15` },
                    ]}
                  >
                    <Camera size={24} color={colors.accent} />
                  </View>
                  <Text
                    style={[styles.photoTileText, { color: colors.subtext }]}
                  >
                    Add after photo
                  </Text>
                </View>
              )}
            </Pressable>

            <Text style={[styles.label, { color: colors.text }]}>
              What do you think of this journey?
            </Text>
            <TextInput
              value={completionNote}
              onChangeText={setCompletionNote}
              multiline
              numberOfLines={5}
              placeholder="146 days. Stronger than I've ever been…"
              placeholderTextColor={colors.subtext}
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              textAlignVertical="top"
            />

            <View style={styles.sheetActions}>
              <Pressable
                onPress={closeCompleteSheet}
                style={[
                  styles.secondaryAction,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[styles.secondaryActionText, { color: colors.text }]}
                >
                  Not yet
                </Text>
              </Pressable>

              <Pressable
                onPress={confirmComplete}
                disabled={update.isPending}
                style={[
                  styles.primaryAction,
                  { opacity: update.isPending ? 0.7 : 1 },
                ]}
              >
                <CheckCircle2 size={18} color="#FFFFFF" />
                <Text style={styles.primaryActionText}>
                  {update.isPending ? "Completing..." : "Confirm & Complete"}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    padding: 20,
    gap: 0,
    paddingTop: 16,
  },

  /* Hero */
  heroWrap: {
    width: "100%",
    height: 260,
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 20,
  },
  heroImageWrap: {
    width: "100%",
    height: "100%",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  heroGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
  },
  heroEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  heroIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  heroHint: {
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.3,
  },

  /* Header */
  headerCol: {
    gap: 8,
    marginBottom: 16,
  },
  name: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  chipText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },

  /* Quote */
  quoteCard: {
    borderRadius: 16,
    padding: 18,
    borderLeftWidth: 4,
    marginBottom: 16,
  },
  quote: {
    fontSize: 15,
    fontStyle: "italic",
    lineHeight: 24,
    fontWeight: "500",
  },

  /* Date / Progress */
  dateCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  datePrimary: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  dateSecondary: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 10,
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    overflow: "hidden",
    width: "100%",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },

  /* Reflection */
  reflectionCard: {
    borderRadius: 16,
    padding: 18,
    borderLeftWidth: 4,
    marginBottom: 16,
  },
  reflectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  reflectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  reflectionText: {
    fontSize: 15,
    fontStyle: "italic",
    lineHeight: 24,
    fontWeight: "500",
  },

  /* Sections */
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 8,
  },
  listGap: {
    gap: 10,
  },

  /* Workouts */
  workoutCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 14,
  },
  workoutInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  workoutIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  workoutName: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  todayBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  todayBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: palette.green,
    letterSpacing: 0.6,
  },
  playCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
    marginLeft: 8,
  },
  addPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  addPillText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  /* History */
  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    padding: 14,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 1,
  },
  historyName: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  historySub: {
    fontSize: 12,
    fontWeight: "500",
  },
  historyMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginLeft: 8,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  deleteHit: {
    padding: 4,
  },
  showMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    marginTop: 4,
  },
  showMoreText: {
    fontSize: 13,
    fontWeight: "600",
    color: palette.green,
  },

  /* Bottom Actions */
  bottomActions: {
    gap: 10,
    marginTop: 24,
  },
  completeAction: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    height: 56,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  completeActionText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: -0.2,
  },
  deleteGhost: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    height: 48,
    borderWidth: 1,
    borderColor: "#B3261E40",
    backgroundColor: "transparent",
  },
  deleteGhostWide: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    height: 48,
    borderWidth: 1,
    borderColor: "#B3261E40",
    backgroundColor: "transparent",
    marginTop: 24,
  },
  deleteGhostText: {
    color: "#B3261E",
    fontWeight: "700",
    fontSize: 14,
  },

  /* Sheet */
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheetWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    alignSelf: "center",
    marginBottom: 18,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 20,
    letterSpacing: -0.4,
  },
  photoTile: {
    height: 170,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 20,
  },
  photoIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  photoTileText: {
    fontSize: 13,
    fontWeight: "600",
  },
  photoImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
  },
  input: {
    minHeight: 130,
    maxHeight: 200,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  sheetActions: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryAction: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryActionText: {
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: -0.2,
  },
  primaryAction: {
    flex: 1.4,
    flexDirection: "row",
    gap: 8,
    backgroundColor: palette.green,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: -0.2,
  },
});