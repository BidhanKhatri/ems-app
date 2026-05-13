import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useAuthStore from '../../store/useAuthStore';
import { COLORS, SPACING, RADIUS } from '../../theme/theme';

export default function AdminProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(false);
    logout();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? Math.max(insets.top, 16) : 16 }]}>
        <View>
          <Text style={styles.headerLabel}>Admin Portal</Text>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="person" size={22} color={COLORS.white} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'A'}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.name || 'Admin'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'admin@company.com'}</Text>
          </View>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role || 'ADMIN'}</Text>
          </View>
        </View>

        {/* Info Group */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>Account Details</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <View style={styles.iconBox}>
                <Ionicons name="person-outline" size={18} color={COLORS.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Full Name</Text>
                <Text style={styles.infoValue}>{user?.name || '—'}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <View style={styles.iconBox}>
                <Ionicons name="mail-outline" size={18} color={COLORS.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email Address</Text>
                <Text style={styles.infoValue}>{user?.email || '—'}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <View style={styles.iconBox}>
                <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Role</Text>
                <Text style={styles.infoValue}>{user?.role || '—'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.logoutBtn} onPress={() => setShowLogoutModal(true)} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color="#e11d48" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>StaffingBetit Admin v1.0.0</Text>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal visible={showLogoutModal} transparent animationType="fade" onRequestClose={() => setShowLogoutModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowLogoutModal(false)}>
          <View style={styles.sheetContent}>
            <View style={styles.sheetIndicator} />
            <View style={styles.sheetHeader}>
              <View style={styles.warningIconBox}>
                <Ionicons name="log-out" size={28} color="#e11d48" />
              </View>
              <Text style={styles.sheetTitle}>Sign Out</Text>
              <Text style={styles.sheetSubtitle}>Are you sure you want to log out of your account?</Text>
            </View>
            <View style={styles.sheetButtons}>
              <TouchableOpacity style={styles.confirmLogoutBtn} onPress={handleLogout} activeOpacity={0.8}>
                <Text style={styles.confirmLogoutText}>Yes, Log Out</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelLogoutBtn} onPress={() => setShowLogoutModal(false)} activeOpacity={0.7}>
                <Text style={styles.cancelLogoutText}>Stay Logged In</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: Math.max(insets.bottom, 20) }} />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600', letterSpacing: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white, marginTop: 2 },
  headerIcon: {
    width: 42, height: 42, borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  scrollContent: { padding: SPACING.md, paddingBottom: 120 },
  profileCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.lg,
    flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.border,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.primary, justifyContent: 'center',
    alignItems: 'center', marginRight: SPACING.md,
  },
  avatarText: { fontSize: 20, fontWeight: '800', color: COLORS.white },
  profileInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '800', color: COLORS.textMain },
  userEmail: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  roleBadge: {
    backgroundColor: COLORS.indigo50, paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: RADIUS.full, marginLeft: SPACING.sm,
  },
  roleText: { fontSize: 9, fontWeight: '800', color: COLORS.primary, textTransform: 'uppercase' },
  group: { marginBottom: SPACING.lg },
  groupTitle: {
    fontSize: 11, fontWeight: '800', color: COLORS.textMuted,
    textTransform: 'uppercase', letterSpacing: 1.2,
    marginBottom: SPACING.xs, marginLeft: 4,
  },
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md },
  iconBox: {
    width: 36, height: 36, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.background, justifyContent: 'center',
    alignItems: 'center', marginRight: SPACING.md,
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 14, fontWeight: '600', color: COLORS.textMain, marginTop: 2 },
  divider: { height: 1, backgroundColor: COLORS.border, marginLeft: 64 },
  logoutBtn: {
    flexDirection: 'row', backgroundColor: COLORS.white,
    paddingVertical: 14, borderRadius: RADIUS.md,
    justifyContent: 'center', alignItems: 'center',
    marginTop: SPACING.xl, borderWidth: 1, borderColor: '#fee2e2',
  },
  logoutText: { color: '#e11d48', fontSize: 14, fontWeight: '700', marginLeft: 8 },
  versionText: { textAlign: 'center', fontSize: 10, color: COLORS.textMuted, marginTop: SPACING.xl },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheetContent: {
    backgroundColor: COLORS.white, borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl, paddingHorizontal: SPACING.xl, paddingTop: SPACING.md,
  },
  sheetIndicator: {
    width: 40, height: 4, backgroundColor: COLORS.border,
    borderRadius: 2, alignSelf: 'center', marginBottom: SPACING.lg,
  },
  sheetHeader: { alignItems: 'center', marginBottom: SPACING.xxl },
  warningIconBox: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff1f2',
    justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md,
  },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textMain, marginBottom: SPACING.xs },
  sheetSubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: SPACING.md },
  sheetButtons: { gap: SPACING.md },
  confirmLogoutBtn: {
    backgroundColor: '#fff1f2', paddingVertical: 16, borderRadius: RADIUS.md,
    alignItems: 'center', borderWidth: 1, borderColor: '#fecdd3',
  },
  confirmLogoutText: { color: '#e11d48', fontSize: 16, fontWeight: '700' },
  cancelLogoutBtn: {
    backgroundColor: COLORS.background, paddingVertical: 16,
    borderRadius: RADIUS.md, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  cancelLogoutText: { color: COLORS.textSecondary, fontSize: 16, fontWeight: '600' },
});
