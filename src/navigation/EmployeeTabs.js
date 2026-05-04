import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AttendanceScreen from '../screens/employee/AttendanceScreen';
import NotificationsScreen from '../screens/employee/NotificationsScreen';
import SettingsScreen from '../screens/employee/SettingsScreen';
import { COLORS, SHADOWS } from '../theme/theme';

const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'Notifications', activeIcon: 'notifications', inactiveIcon: 'notifications-outline', label: 'Alerts' },
  { name: 'Attendance', activeIcon: 'calendar', inactiveIcon: 'calendar-outline', label: 'Attendance' },
  { name: 'Settings', activeIcon: 'person', inactiveIcon: 'person-outline', label: 'Profile' },
];

const BAR_HEIGHT = 72;
const FAB_SIZE = 56;
const SIDE_BTN_SIZE = 42;

function CustomTabBar({ state, navigation }) {
  return (
    <View style={styles.outerWrap}>
      {/* Main bar card */}
      <View style={styles.barCard}>
        <View style={styles.bar}>
          {TABS.map((tab, index) => {
            const isFocused = state.index === index;
            const isCenter = index === 1;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: state.routes[index].key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(tab.name);
              }
            };

            if (isCenter) {
              // Center space reserved — FAB rendered outside
              return (
                <View key={tab.name} style={styles.centerPlaceholder}>
                  <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                    {tab.label}
                  </Text>
                </View>
              );
            }

            return (
              <TouchableOpacity
                key={tab.name}
                onPress={onPress}
                style={styles.tabItem}
                activeOpacity={0.8}
              >
                {/* Circular button matching FAB style */}
                <View style={[
                  styles.sideBtn,
                  isFocused ? styles.sideBtnActive : styles.sideBtnInactive,
                ]}>
                  <Ionicons
                    name={isFocused ? tab.activeIcon : tab.inactiveIcon}
                    size={20}
                    color={COLORS.white}
                  />
                </View>
                <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* FAB — outside barCard so it can overflow freely */}
      {(() => {
        const centerIndex = 1;
        const isFocused = state.index === centerIndex;
        const tab = TABS[centerIndex];

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: state.routes[centerIndex].key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(tab.name);
          }
        };

        return (
          <TouchableOpacity
            onPress={onPress}
            style={styles.fabWrap}
            activeOpacity={0.85}
          >
            <View style={[styles.fab, isFocused ? styles.fabActive : styles.fabInactive]}>
              <Ionicons
                name={isFocused ? tab.activeIcon : tab.inactiveIcon}
                size={26}
                color={COLORS.white}
              />
            </View>
          </TouchableOpacity>
        );
      })()}
    </View>
  );
}

export default function EmployeeTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Attendance"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Attendance" component={AttendanceScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  outerWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingTop: FAB_SIZE / 2, // room for FAB to pop above
  },
  barCard: {
    backgroundColor: COLORS.indigo50,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#c7d2fe', // indigo-200 for a soft themed border
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    height: BAR_HEIGHT,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  centerPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  sideBtn: {
    width: SIDE_BTN_SIZE,
    height: SIDE_BTN_SIZE,
    borderRadius: 12, // Rounded square
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
    ...SHADOWS.md,
  },
  sideBtnActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
  },
  sideBtnInactive: {
    backgroundColor: COLORS.textMuted,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    elevation: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMain,
    letterSpacing: 0.3,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  // FAB (Attendance center)
  fabWrap: {
    position: 'absolute',
    alignSelf: 'center',
    top: 18,
    zIndex: 10,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: 16, // Rounded square
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
    ...SHADOWS.lg,
  },
  fabActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.5,
    elevation: 18,
  },
  fabInactive: {
    backgroundColor: COLORS.textMuted,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    elevation: 12,
  },
});
