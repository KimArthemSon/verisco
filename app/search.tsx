import { useTheme } from "@core/ui/theme";
import { JourneyRow } from "@modules/home/components";
import { useJourneys } from "@modules/journeys/useJourneys";
import { Search, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function SearchScreen() {
  const { colors } = useTheme();
  const { data: journeys } = useJourneys();
  const [query, setQuery] = useState("");

  const filteredJourneys = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return journeys ?? [];
    return (journeys ?? []).filter((journey) =>
      journey.name.toLowerCase().includes(value),
    );
  }, [journeys, query]);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <View
        style={[
          styles.searchRow,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Search size={18} color={colors.subtext} />
        <TextInput
          autoFocus
          value={query}
          onChangeText={setQuery}
          placeholder="Search journeys…"
          placeholderTextColor={colors.subtext}
          style={[styles.input, { color: colors.text }]}
        />
        {query ? (
          <Pressable onPress={() => setQuery("")} hitSlop={8}>
            <X size={16} color={colors.subtext} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {filteredJourneys.length === 0 ? (
          <Text style={[styles.empty, { color: colors.subtext }]}>
            No journeys match
          </Text>
        ) : (
          filteredJourneys.map((journey) => (
            <JourneyRow key={journey.id} journey={journey} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    marginHorizontal: 20,
    marginTop: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 12,
  },
  empty: {
    paddingTop: 20,
    textAlign: "center",
    fontSize: 14,
  },
});
