import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  Platform,
  Image,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { API_BASE_URL } from '../../utils/config';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../theme/theme';
import useAuthStore from '../../store/useAuthStore';
import SlideButton from '../../components/SlideButton';
import { useSocket } from '../../context/SocketContext';

export default function AttendanceScreen() {
  const insets = useSafeAreaInsets();
  const { user, fetchProfile } = useAuthStore();
  const [todayStatus, setTodayStatus] = useState(null);
  const [settings, setSettings] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selfRank, setSelfRank] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showEarlyModal, setShowEarlyModal] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const leaderboardScrollRef = useRef(null);

  const scrollToSelf = useCallback(() => {
    if (leaderboardScrollRef.current && leaderboard.length > 0) {
      const userIndex = leaderboard.findIndex(entry => entry.isSelf);
      if (userIndex > 3) {
        // Approximate row height is 57px (padding + avatar + border). 
        // Offset by one row so the user isn't glued to the very top edge.
        const offset = userIndex * 57 - 57;
        setTimeout(() => {
          leaderboardScrollRef.current?.scrollTo({ y: offset > 0 ? offset : 0, animated: true });
        }, 100);
      } else {
        setTimeout(() => {
          leaderboardScrollRef.current?.scrollTo({ y: 0, animated: true });
        }, 100);
      }
    }
  }, [leaderboard]);

  useEffect(() => {
    scrollToSelf();
  }, [scrollToSelf]);

  useFocusEffect(
    useCallback(() => {
      // Extra timeout when navigating back to ensure view is mounted properly
      setTimeout(() => scrollToSelf(), 300);
    }, [scrollToSelf])
  );

  const loadData = useCallback(async () => {
    const t = Date.now();
    try {
      fetchProfile().catch(() => { });
      const [statusRes, settingsRes, attendanceRes, lbRes] = await Promise.all([
        api.get(`/settings/today-status?t=${t}`),
        api.get(`/settings?t=${t}`),
        api.get('/attendance/me'),
        api.get('/attendance/leaderboard'),
      ]);

      setTodayStatus(statusRes.data);
      setSettings(settingsRes.data);
      setLeaderboard(lbRes.data.leaderboard || []);
      setSelfRank(lbRes.data.selfRank);

      const todayString = new Date().toISOString().slice(0, 10);
      const todayRecord = Array.isArray(attendanceRes.data)
        ? attendanceRes.data.find((r) => r.date === todayString)
        : null;
      setTodayAttendance(todayRecord || null);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, [fetchProfile]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time updates via Socket
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      console.log('Real-time attendance/leaderboard update received');
      loadData();
    };

    socket.on('leaderboard:update', handleUpdate);
    socket.on('admin:dashboard-update', handleUpdate); // For global changes
    socket.on('settings:update', handleUpdate);

    return () => {
      socket.off('leaderboard:update', handleUpdate);
      socket.off('admin:dashboard-update', handleUpdate);
      socket.off('settings:update', handleUpdate);
    };
  }, [socket, loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/attendance/check-in');
      setTodayAttendance(data.attendance);
      Alert.alert('Success', data.message);
      loadData();
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async (bypass = false) => {
    if (!bypass && settings?.checkOutTime) {
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      const [targetH, targetM] = settings.checkOutTime.split(':').map(Number);
      const targetMins = targetH * 60 + targetM;
      if (currentMins < targetMins) {
        setShowEarlyModal(true);
        return;
      }
    }

    setShowEarlyModal(false);
    setLoading(true);
    try {
      const { data } = await api.post('/attendance/check-out');
      setTodayAttendance(data.attendance);
      Alert.alert('Success', data.message);
      loadData();
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Check-out failed');
    } finally {
      setLoading(false);
    }
  };

  const isCheckOutTimeCrossed = useMemo(() => {
    if (!settings?.checkOutTime || todayAttendance) return false;
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const [outH, outM] = settings.checkOutTime.split(':').map(Number);
    const outMins = outH * 60 + outM;
    return currentMins > outMins;
  }, [settings, todayAttendance]);

  const formatSimpleTime = (timeStr) => {
    if (!timeStr) return '--:--';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  const attendanceStatus = todayAttendance?.status || 'ON_TIME';

  const profileImage = user?.profilePicture || user?.profileImage || user?.image;
  const profileUrl = profileImage
    ? (profileImage.startsWith('http') ? profileImage : `${API_BASE_URL.replace('/api', '')}/${profileImage.replace(/\\/g, '/')}`)
    : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Fixed elevated header layer */}
      <View style={styles.headerWrapper}>
        <View style={styles.headerBackground} />
        <SafeAreaView style={{ flex: 0 }}>
          <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? Math.max(insets.top, 16) : 16 }]}>
            <View style={styles.headerLeft}>
              <View style={styles.profileBorder}>
                {profileUrl ? (
                  <Image source={{ uri: profileUrl }} style={styles.profileImg} />
                ) : (
                  <View style={styles.profilePlaceholder}>
                    <Text style={styles.placeholderText}>{user?.name?.charAt(0)}</Text>
                  </View>
                )}
              </View>
              <View style={styles.nameArea}>
                <Text style={styles.welcomeText}>Hello, {user?.name?.split(' ')[0]}</Text>
                <Text style={styles.subText}>Keep up the great work!</Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              <View style={styles.pointsBadge}>
                <Ionicons name="trophy" size={14} color={COLORS.white} />
                <Text style={styles.pointsValue}>{user?.performanceScore || 0}</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Scrollable content below header */}
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={scrollEnabled}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
        >
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Team leaderboard</Text>
            {selfRank && (
              <View style={styles.rankTag}>
                <Text style={styles.rankTagText}>Rank #{selfRank}</Text>
              </View>
            )}
          </View>

          <View style={[styles.leaderboardCard, leaderboard.length === 0 && { justifyContent: 'center' }]}>
            {leaderboard.length === 0 ? (
              <Text style={styles.emptyText}>No data yet.</Text>
            ) : (
              <ScrollView
                ref={leaderboardScrollRef}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: 320 }}
                onTouchStart={() => setScrollEnabled(false)}
                onTouchEnd={() => setScrollEnabled(true)}
                onMomentumScrollEnd={() => setScrollEnabled(true)}
              >
                {leaderboard.map((entry, index) => (
                  <View key={entry.rank} style={[styles.lbRow, entry.isSelf && styles.lbRowSelf]}>
                    <Text style={[styles.lbRank, index < 3 && styles.lbRankTop]}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${entry.rank}`}
                    </Text>
                    <View style={[styles.lbAvatar, entry.isSelf && styles.lbAvatarSelf]}>
                      {entry.isSelf ? (
                        profileUrl ? (
                          <Image source={{ uri: profileUrl }} style={styles.profileImg} />
                        ) : (
                          <Text style={styles.lbAvatarText}>{entry.name.charAt(0)}</Text>
                        )
                      ) : (
                        <Ionicons name="person" size={16} color={COLORS.white} />
                      )}
                      {!entry.isSelf && <View style={styles.blur} />}
                    </View>
                    <View style={styles.lbInfo}>
                      <Text style={[styles.lbName, !entry.isSelf && styles.lbNameBlurred]}>
                        {entry.isSelf ? entry.name : 'Anonymous'}
                      </Text>
                      <Text style={styles.lbSub}>{entry.isSelf ? 'You' : 'Anonymous'}</Text>
                    </View>
                    <Text style={[styles.lbScore, entry.isSelf && styles.lbScoreSelf]}>{entry.performanceScore} pts</Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Main Attendance Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconBox}>
                <Ionicons name="time-outline" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.cardTitle}>Attendance Management</Text>
            </View>

            {todayStatus?.isHoliday ? (
              <View style={styles.holidayBox}>
                <Ionicons name="calendar-outline" size={32} color={COLORS.warning} />
                <Text style={styles.holidayTitle}>Office Closed</Text>
                <Text style={styles.holidayMessage}>{todayStatus.message}</Text>
              </View>
            ) : !todayAttendance ? (
              <View style={styles.actionArea}>
                {isCheckOutTimeCrossed ? (
                  <View style={styles.closedBox}>
                    <Ionicons name="log-out-outline" size={32} color={COLORS.danger} />
                    <Text style={styles.closedTitle}>Shift Ended</Text>
                    <Text style={styles.closedText}>
                      Check-out time ({formatSimpleTime(settings?.checkOutTime)}) has passed.
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.standardText}>
                      Standard Check-In: <Text style={styles.boldText}>{formatSimpleTime(settings?.checkInTime)}</Text>
                    </Text>
                    <SlideButton
                      text="Slide to Check In"
                      onSlide={handleCheckIn}
                      disabled={loading}
                      color={COLORS.primary}
                      onToggleScroll={setScrollEnabled}
                    />
                  </>
                )}
              </View>
            ) : todayAttendance.checkOutTime ? (
              <View style={styles.completedBox}>
                <Text style={styles.completedText}>
                  Checked Out at {new Date(todayAttendance.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            ) : (
              <View style={styles.activeArea}>
                <View style={[
                  styles.statusIndicator,
                  attendanceStatus === 'PENDING_APPROVAL' ? styles.statusPending :
                    attendanceStatus === 'LATE_REJECTED' ? styles.statusRejected : styles.statusSuccess
                ]}>
                  <Text style={[
                    styles.statusIndicatorText,
                    attendanceStatus === 'PENDING_APPROVAL' ? styles.textPending :
                      attendanceStatus === 'LATE_REJECTED' ? styles.textRejected : styles.textSuccess
                  ]}>
                    Checked in at {new Date(todayAttendance.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>

                {attendanceStatus === 'PENDING_APPROVAL' ? (
                  <View style={styles.pendingBox}>
                    <ActivityIndicator color={COLORS.primary} style={{ marginBottom: SPACING.sm }} />
                    <Text style={styles.pendingTitle}>Wait for Admin Approval</Text>
                    <Text style={styles.pendingText}>Your late check-in is under review.</Text>
                  </View>
                ) : attendanceStatus === 'LATE_REJECTED' ? (
                  <View style={styles.rejectedBox}>
                    <Ionicons name="close-circle-outline" size={32} color={COLORS.danger} />
                    <Text style={styles.rejectedTitle}>Check-In Rejected</Text>
                    <Text style={styles.rejectedText}>Please contact your administrator.</Text>
                  </View>
                ) : (
                  <View style={styles.slideContainer}>
                    <SlideButton
                      text="Slide to Check Out"
                      onSlide={handleCheckOut}
                      disabled={loading}
                      color={COLORS.textMain}
                      onToggleScroll={setScrollEnabled}
                    />
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Today Snapshot */}
          <View style={styles.snapshotCard}>
            <Text style={styles.snapshotTitle}>Today's Snapshot</Text>
            <View style={styles.snapshotGrid}>
              <View style={styles.snapBox}>
                <Text style={styles.snapLabel}>Check In</Text>
                <Text style={styles.snapValue}>
                  {todayAttendance?.checkInTime ? new Date(todayAttendance.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </Text>
              </View>
              <View style={styles.snapBox}>
                <Text style={styles.snapLabel}>Check Out</Text>
                <Text style={styles.snapValue}>
                  {todayAttendance?.checkOutTime ? new Date(todayAttendance.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Early Checkout Modal */}
      <Modal visible={showEarlyModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIcon}>
              <Ionicons name="alert-circle-outline" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.modalTitle}>Early Check-out?</Text>
            <Text style={styles.modalText}>
              You are checking out before {formatSimpleTime(settings?.checkOutTime)}. This may affect your performance score.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.confirmBtn} onPress={() => handleCheckOut(true)} activeOpacity={0.7}>
                <Text style={styles.confirmBtnText}>Confirm Early Check-out</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEarlyModal(false)} activeOpacity={0.7}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safeArea: { flex: 1 },
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileBorder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
    padding: 2,
    marginRight: SPACING.md,
  },
  profileImg: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
    backgroundColor: COLORS.indigo100,
  },
  profilePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  nameArea: {
    justifyContent: 'center',
  },
  welcomeText: { fontSize: 18, fontWeight: '800', color: COLORS.white },
  subText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  pointsValue: { fontSize: 14, fontWeight: '800', color: COLORS.white, marginLeft: 4 },
  scrollContent: { padding: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: 120 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.indigo50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textMain },
  holidayBox: { alignItems: 'center', paddingVertical: SPACING.lg },
  holidayTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textMain, marginTop: SPACING.sm },
  holidayMessage: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  actionArea: { width: '100%' },
  standardText: { textAlign: 'center', color: COLORS.textSecondary, fontSize: 14, marginBottom: SPACING.lg },
  boldText: { fontWeight: '700', color: COLORS.textMain },
  closedBox: { alignItems: 'center', paddingVertical: SPACING.lg },
  closedTitle: { fontSize: 18, fontWeight: '800', color: COLORS.danger, marginTop: SPACING.sm },
  closedText: { fontSize: 12, color: COLORS.textMuted, marginTop: 4, textAlign: 'center' },
  completedBox: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  completedText: { fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', fontSize: 12 },
  activeArea: { width: '100%' },
  statusIndicator: { padding: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center', marginBottom: SPACING.lg, borderWidth: 1 },
  statusSuccess: { backgroundColor: COLORS.emerald50, borderColor: '#d1fae5' },
  statusPending: { backgroundColor: COLORS.indigo50, borderColor: '#e0e7ff' },
  statusRejected: { backgroundColor: COLORS.red50, borderColor: '#fee2e2' },
  statusIndicatorText: { fontSize: 14, fontWeight: '700' },
  textSuccess: { color: COLORS.success },
  textPending: { color: COLORS.primary },
  textRejected: { color: COLORS.danger },
  pendingBox: { alignItems: 'center', paddingVertical: SPACING.md },
  pendingTitle: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  pendingText: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  rejectedBox: { alignItems: 'center', paddingVertical: SPACING.md },
  rejectedTitle: { fontSize: 16, fontWeight: '800', color: COLORS.danger },
  rejectedText: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  slideContainer: { marginTop: SPACING.sm },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.textMuted, textTransform: 'capitalize', letterSpacing: 1 },
  rankTag: { backgroundColor: COLORS.indigo50, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  rankTagText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  leaderboardCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    minHeight: 320, // Fixed height to prevent layout shift
  },
  lbRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  lbRowSelf: { backgroundColor: COLORS.indigo50 },
  lbRank: { width: 30, fontSize: 14, fontWeight: '700', color: COLORS.textMuted },
  lbRankTop: { fontSize: 18 },
  lbAvatar: { width: 32, height: 32, borderRadius: RADIUS.md, backgroundColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md, overflow: 'hidden' },
  lbAvatarSelf: { backgroundColor: COLORS.primary },
  lbAvatarText: { color: COLORS.white, fontWeight: '800', fontSize: 14 },
  blur: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.4)' },
  lbInfo: { flex: 1 },
  lbName: { fontSize: 14, fontWeight: '700', color: COLORS.textMain },
  lbNameBlurred: { opacity: 0.3 },
  lbSub: { fontSize: 10, color: COLORS.textMuted },
  lbScore: { fontSize: 12, fontWeight: '800', color: COLORS.textSecondary },
  lbScoreSelf: { color: COLORS.primary },
  emptyText: { textAlign: 'center', padding: SPACING.xl, color: COLORS.textMuted },
  snapshotCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.xxl },
  snapshotTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textMain, marginBottom: SPACING.md },
  snapshotGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  snapBox: { width: '48%', backgroundColor: COLORS.background, padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border },
  snapLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase' },
  snapValue: { fontSize: 16, fontWeight: '700', color: COLORS.textMain, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: SPACING.xxl },
  modalContent: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.xxl, width: '100%', alignItems: 'center' },
  modalIcon: { width: 64, height: 64, borderRadius: RADIUS.lg, backgroundColor: COLORS.indigo50, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.lg },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textMain, textAlign: 'center' },
  modalText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.md, lineHeight: 20 },
  modalButtons: { width: '100%', marginTop: SPACING.xxl },
  confirmBtn: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: RADIUS.md, alignItems: 'center', marginBottom: SPACING.md },
  confirmBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  cancelBtn: { paddingVertical: 14, borderRadius: RADIUS.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  cancelBtnText: { color: COLORS.textSecondary, fontWeight: '700', fontSize: 14 },
});
