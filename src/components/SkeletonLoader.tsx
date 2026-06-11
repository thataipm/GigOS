// GigOS SkeletonLoader — Pulsing placeholder shapes for loading states
import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { Colors } from '@/src/theme/colors';
import { Radius, Layout } from '@/src/theme/spacing';

function SkeletonBlock({ width, height = 14, borderRadius = 6, style }: {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}) {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.75, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 750, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);
  return (
    <Animated.View
      style={[
        { backgroundColor: Colors.graphite600, borderRadius, height },
        width !== undefined ? { width } : {},
        { opacity },
        style,
      ]}
    />
  );
}

export function PipelineSkeleton() {
  return (
    <View style={{ paddingHorizontal: Layout.screenGutter, gap: 12, paddingTop: 8 }}>
      {[0, 1, 2, 3].map(i => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            backgroundColor: Colors.surfaceCard,
            borderRadius: Radius.lg,
            borderWidth: 1,
            borderColor: Colors.borderSubtle,
            overflow: 'hidden',
            height: 90,
          }}
        >
          <View style={{ width: 4, backgroundColor: Colors.graphite500 }} />
          <View style={{ flex: 1, padding: 14, gap: 10, justifyContent: 'center' }}>
            <SkeletonBlock width="40%" height={22} borderRadius={4} />
            <SkeletonBlock width="68%" height={12} borderRadius={4} />
            <SkeletonBlock width="52%" height={11} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function IncomeSkeleton() {
  const barHeights = [60, 40, 80, 50, 90, 70, 100, 45, 65, 55, 75, 85];
  return (
    <View style={{ gap: 12, paddingTop: 8 }}>
      {/* Hero */}
      <View style={{ paddingHorizontal: Layout.screenGutter, paddingVertical: 20, backgroundColor: Colors.surfaceRaised, gap: 10 }}>
        <SkeletonBlock width="38%" height={13} />
        <SkeletonBlock width="55%" height={52} borderRadius={6} />
      </View>
      {/* Stats row */}
      <View style={{ flexDirection: 'row', paddingHorizontal: Layout.screenGutter, gap: 10 }}>
        {[0, 1].map(i => (
          <View key={i} style={{ flex: 1, backgroundColor: Colors.surfaceCard, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.borderDefault, padding: 14, gap: 10 }}>
            <SkeletonBlock width="55%" height={10} />
            <SkeletonBlock width="70%" height={20} borderRadius={4} />
          </View>
        ))}
      </View>
      {/* Bar chart */}
      <View style={{ backgroundColor: Colors.surfaceCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.borderDefault, marginHorizontal: Layout.screenGutter, padding: 16, gap: 12 }}>
        <SkeletonBlock width="45%" height={10} />
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 3 }}>
          {barHeights.map((h, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <SkeletonBlock height={Math.round(h * 1.1)} borderRadius={3} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
