import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../store/useAuthStore';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../theme/theme';

export default function ApprovalStatusScreen() {
  const { user, logout } = useAuthStore();
  const rejected = user?.approvalStatus === 'REJECTED';

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: rejected ? '#FEF2F2' : '#EFF6FF' }]}>
            <Ionicons
              name={rejected ? 'close-circle-outline' : 'time-outline'}
              size={64}
              color={rejected ? COLORS.danger : COLORS.primary}
            />
          </View>
          
          <Text style={styles.title}>{rejected ? 'Account Rejected' : 'Approval Pending'}</Text>
          <Text style={styles.body}>
            {rejected
              ? 'Your account application has been rejected by the administrator. Please contact support for more information.'
              : `Hi ${user?.name || 'Employee'}, your account is currently waiting for admin approval. We'll notify you once it's approved.`}
          </Text>
          
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Account Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: rejected ? COLORS.danger : COLORS.warning }]}>
              <Text style={styles.statusText}>{user?.approvalStatus || 'PENDING'}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.button} onPress={logout}>
            <Text style={styles.buttonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textMain,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  body: {
    fontSize: 16,
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xxl,
    lineHeight: 24,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginBottom: SPACING.xxl,
    ...SHADOWS.md,
  },
  cardLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statusBadge: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  statusText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  button: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 16,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.textMain,
    fontWeight: '700',
    fontSize: 16,
  },
});
