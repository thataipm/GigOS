// GigOS Tab Layout — 5-tab navigation with glowing cyan FAB
import { Tabs } from 'expo-router';
import { View, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/src/theme/colors';
import { Glow, Shadow } from '@/src/theme/effects';
import { ControlHeight } from '@/src/theme/spacing';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surfaceRaised,
          borderTopWidth: 1,
          borderTopColor: Colors.borderDefault,
          height: ControlHeight.tabBar + insets.bottom,
          paddingBottom: insets.bottom,
          ...Shadow.sheet,
        },
        tabBarActiveTintColor: Colors.cyan,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarLabelStyle: {
          fontFamily: 'IBMPlexMono_500Medium',
          fontSize: 9,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          marginTop: -2,
        },
        sceneStyle: { backgroundColor: Colors.surfaceApp },
      }}
    >
      <Tabs.Screen
        name="pipeline"
        options={{
          title: 'Pipeline',
          tabBarTestID: 'bottom-nav-pipeline-tab',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="queue-music" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="income"
        options={{
          title: 'Income',
          tabBarTestID: 'bottom-nav-income-tab',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="currency-rupee" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add-gig"
        options={{
          title: '',
          tabBarTestID: 'bottom-nav-add-gig-fab',
          tabBarIcon: () => (
            <View style={[styles.fab, Glow.cyan]}>
              <MaterialIcons name="add" size={28} color={Colors.textOnAccent} />
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarTestID: 'bottom-nav-calendar-tab',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="calendar-today" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarTestID: 'bottom-nav-profile-tab',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person-outline" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: ControlHeight.fab,
    height: ControlHeight.fab,
    borderRadius: ControlHeight.fab / 2,
    backgroundColor: Colors.cyan,
    borderWidth: 1,
    borderColor: Colors.cyanBright,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
  },
});
