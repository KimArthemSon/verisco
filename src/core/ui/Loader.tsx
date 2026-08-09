import { Leaf } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { palette, useTheme } from './theme';

type Props = { done: boolean; onHidden: () => void };

export function Loader({ done, onHidden }: Props) {
  const { colors } = useTheme();
  const fade = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const bar = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.1, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
      ]),
    );
    loop.start();
    Animated.timing(bar, { toValue: 1, duration: 1100, useNativeDriver: false }).start();
    return () => loop.stop();
  }, [pulse, bar]);

  useEffect(() => {
    if (done) {
      Animated.timing(fade, { toValue: 0, duration: 300, useNativeDriver: true }).start(() =>
        onHidden(),
      );
    }
  }, [done, fade, onHidden]);

  return (
    <Animated.View
      pointerEvents={done ? 'none' : 'auto'}
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: colors.bg, opacity: fade, zIndex: 50, elevation: 50 },
      ]}
    >
      <View style={styles.center}>
        <Animated.View style={[styles.iconWrap, { transform: [{ scale: pulse }] }]}>
          <Leaf size={34} color={palette.green} />
        </Animated.View>
        <Text style={[styles.wordmark, { color: colors.text }]}>VIRESCO</Text>
        <Text style={[styles.tag, { color: colors.subtext }]}>grow strong</Text>
        <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
          <Animated.View
            style={[
              styles.barFill,
              { width: bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
            ]}
          />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: palette.green + '1A', // 10% green halo
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: { fontSize: 22, fontWeight: '700', letterSpacing: 6, marginTop: 20 },
  tag: { fontSize: 12, letterSpacing: 2, marginTop: 4 },
  barTrack: { width: 140, height: 3, borderRadius: 2, marginTop: 32, overflow: 'hidden' },
  barFill: { height: 3, backgroundColor: palette.green, borderRadius: 2 },
});