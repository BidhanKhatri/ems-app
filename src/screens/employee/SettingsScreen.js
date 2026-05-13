import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, StatusBar, Platform, Image, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../store/useAuthStore';
import { API_BASE_URL, FRONTEND_BASE_URL } from '../../utils/config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../theme/theme';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();

  const profileImage = user?.profilePicture || user?.profileImage || user?.image;
  const profileUrl = profileImage
    ? (profileImage.startsWith('http') ? profileImage : `${API_BASE_URL.replace('/api', '')}/${profileImage.replace(/\\/g, '/')}`)
    : null;

  const SettingItem = ({ icon, label, value, color = COLORS.textMain, showArrow = true }) => (
    <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
      <View style={styles.settingLeft}>
        <View style={[styles.iconBox, { backgroundColor: COLORS.background }]}>
          <Ionicons name={icon} size={20} color={COLORS.primary} />
        </View>
        <View>
          <Text style={styles.settingLabel}>{label}</Text>
          {value && <Text style={[styles.settingValue, { color }]}>{value}</Text>}
        </View>
      </View>
      {showArrow && <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Fixed elevated header layer */}
      <View style={styles.headerWrapper}>
        <View style={styles.headerBackground} />
        <SafeAreaView style={{ flex: 0 }}>
          <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? Math.max(insets.top, 16) : 16 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="person" size={24} color={COLORS.white} style={{ marginRight: SPACING.sm }} />
              <Text style={styles.headerTitle}>Profile & Settings</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              {profileUrl ? (
                <Image source={{ uri: profileUrl }} style={styles.profileImg} />
              ) : (
                <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'E'}</Text>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user?.name || 'Employee'}</Text>
              <Text style={styles.userEmail}>{user?.email || 'email@company.com'}</Text>
            </View>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user?.role || 'EMPLOYEE'}</Text>
            </View>
          </View>

          {/* Settings Groups */}
          <View style={styles.group}>
            <Text style={styles.groupTitle}>Quick Access</Text>
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.settingItem}
                activeOpacity={0.7}
                onPress={() => Linking.openURL(FRONTEND_BASE_URL)}
              >
                <View style={styles.settingLeft}>
                  <View style={[styles.iconBox, { backgroundColor: COLORS.indigo50 }]}>
                    <Ionicons name="globe-outline" size={20} color={COLORS.primary} />
                  </View>
                  <View>
                    <Text style={styles.settingLabel}>Web Portal</Text>
                    <Text style={styles.settingValue}>Full web access</Text>
                  </View>
                </View>
                <Ionicons name="open-outline" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.group}>
            <Text style={styles.groupTitle}>Personal Information</Text>
            <View style={styles.card}>
              <SettingItem icon="person-outline" label="Full Name" value={user?.name} showArrow={false} />
              <View style={styles.divider} />
              <SettingItem icon="mail-outline" label="Email Address" value={user?.email} showArrow={false} />
              <View style={styles.divider} />
              <SettingItem icon="shield-checkmark-outline" label="Account Role" value={user?.role} showArrow={false} />
            </View>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>

          <Text style={styles.versionText}>Version 1.0.0 (Build 2024.05.04)</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  headerWrapper: {
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
    zIndex: 100,
    elevation: 100,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  headerBackground: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: COLORS.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    overflow: 'hidden',
  },
  profileImg: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textMain,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: COLORS.indigo50,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginLeft: SPACING.sm,
  },
  roleText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  group: {
    marginBottom: SPACING.lg,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: SPACING.xs,
    marginLeft: 4,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  settingValue: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 64,
  },
  logoutBtn: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xl,
    borderWidth: 1,
    borderColor: '#fee2e2', // Light red border
    ...SHADOWS.sm,
  },
  logoutText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: SPACING.xl,
  },
});
