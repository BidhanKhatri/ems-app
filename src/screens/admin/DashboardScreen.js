import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Platform,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  Modal,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../services/api';
import { API_BASE_URL, FRONTEND_BASE_URL } from '../../utils/config';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../theme/theme';
import PageLoader from '../../components/PageLoader';
import { useSocket } from '../../context/SocketContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Responsive Calculations
const HORIZONTAL_PADDING = SPACING.md + 4; // scrollContent padding + podiumList padding
const PODIUM_CARD_WIDTH = (SCREEN_WIDTH - (HORIZONTAL_PADDING * 2) - SPACING.md) / 2;

const getImageUrl = (url) => {
  if (!url || url === 'null' || url === 'undefined') return null;
  // Handle case where profilePicture might be an object { url: '...', secure_url: '...' }
  const actualUrl = typeof url === 'object' ? (url.secure_url || url.url || url.path) : url;
  if (!actualUrl || typeof actualUrl !== 'string' || actualUrl === 'null' || actualUrl === 'undefined') return null;

  if (actualUrl.startsWith('http')) return actualUrl;

  // Handle static assets from the frontend web app
  if (actualUrl.includes('assets/') || actualUrl.includes('emp_')) {
    return `${FRONTEND_BASE_URL}${actualUrl.startsWith('/') ? '' : '/'}${actualUrl}`;
  }

  const baseUrl = API_BASE_URL.replace('/api', '');
  return `${baseUrl}${actualUrl.startsWith('/') ? '' : '/'}${actualUrl}`;
};

const StatCard = ({ title, value, icon, color, bgColor }) => (
  <View style={[styles.statCard, { backgroundColor: bgColor }]}>
    <View style={[styles.statIconBox, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <View style={styles.statInfo}>
      <Text style={styles.statLabel}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  </View>
);

const PodiumCard = ({ user, rank }) => {
  const rankConfig = {
    1: { color: '#EAB308', label: '1st', bg: '#FEF9C3' },
    2: { color: '#94A3B8', label: '2nd', bg: '#F1F5F9' },
    3: { color: '#D97706', label: '3rd', bg: '#FFEDD5' },
  };
  const cfg = rankConfig[rank];
  const initials = (user.name || '').split(' ').map(n => n[0]).filter(Boolean).join('').slice(0, 2).toUpperCase() || '??';

  return (
    <View style={[styles.podiumCard, { borderColor: cfg.color }]}>
      <View style={[styles.podiumRankBadge, { backgroundColor: cfg.color }]}>
        <Text style={styles.podiumRankText}>{cfg.label}</Text>
      </View>
      <View style={styles.podiumAvatar}>
        {user.profilePicture ? (
          <Image
            source={{ uri: getImageUrl(user.profilePicture) }}
            style={styles.podiumImg}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.podiumInitials}>{initials}</Text>
        )}
      </View>
      <Text style={styles.podiumName} numberOfLines={1}>{user.name}</Text>
      <View style={styles.podiumStats}>
        <View style={styles.podiumStatItem}>
          <Text style={styles.podiumStatValue}>{user.performanceScore}</Text>
          <Text style={styles.podiumStatLabel}>PTS</Text>
        </View>
        <View style={styles.podiumStatDivider} />
        <View style={styles.podiumStatItem}>
          <Text style={styles.podiumStatValue}>{user.totalAttendance}</Text>
          <Text style={styles.podiumStatLabel}>DAYS</Text>
        </View>
      </View>
    </View>
  );
};

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedEmp, setSelectedEmp] = useState(null);

  // Feedback States
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackPoints, setFeedbackPoints] = useState(0);
  const [feedbackImage, setFeedbackImage] = useState(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/dashboard');
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Socket for Real-time updates
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      console.log('Real-time dashboard update received');
      fetchDashboardData();
    };

    socket.on('admin:dashboard-update', handleUpdate);
    socket.on('leaderboard:update', handleUpdate);

    return () => {
      socket.off('admin:dashboard-update', handleUpdate);
      socket.off('leaderboard:update', handleUpdate);
    };
  }, [socket, fetchDashboardData]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFeedbackImage(result.assets[0].uri);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim()) {
      Alert.alert('Error', 'Please enter feedback text');
      return;
    }

    setSubmittingFeedback(true);
    try {
      const formData = new FormData();
      formData.append('text', feedbackText);
      formData.append('points', feedbackPoints.toString());

      if (feedbackImage) {
        const uriParts = feedbackImage.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formData.append('image', {
          uri: feedbackImage,
          name: `photo.${fileType}`,
          type: `image/${fileType}`,
        });
      }

      await api.post(`/admin/users/${selectedEmp._id}/feedback`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      Alert.alert('Success', 'Feedback submitted successfully');
      setFeedbackText('');
      setFeedbackPoints(0);
      setFeedbackImage(null);
      setShowFeedbackForm(false);
      fetchDashboardData();
    } catch (error) {
      console.error('Feedback error:', error);
      Alert.alert('Error', 'Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const filteredLeaderboard = useMemo(() => {
    if (!stats) return [];
    const q = search.toLowerCase().trim();
    if (!q) return stats.leaderboard || [];
    return (stats.leaderboard || []).filter(e =>
      e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q)
    );
  }, [stats, search]);

  if (loading && !refreshing) return <PageLoader />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? Math.max(insets.top, 16) : 16 }]}>
        <View>
          <Text style={styles.headerLabel}>Performance Monitor</Text>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
        </View>
        <TouchableOpacity style={styles.syncBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Stat Cards Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard title="Total Staff" value={stats?.totalEmployees || 0} icon="people" color="#2563EB" bgColor="#EFF6FF" />
            <StatCard title="Active Groups" value={stats?.totalGroups || 0} icon="grid" color="#7C3AED" bgColor="#F5F3FF" />
          </View>
          <View style={styles.statsRow}>
            <StatCard title="Pending" value={stats?.pendingApprovals || 0} icon="time" color="#DC2626" bgColor="#FEF2F2" />
            <StatCard title="Today Presence" value={stats?.todayAttendances || 0} icon="calendar" color="#059669" bgColor="#ECFDF5" />
          </View>
        </View>

        {/* Podium - Top Performers */}
        {stats?.topPerformers?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="trophy" size={20} color="#EAB308" />
              <Text style={styles.sectionTitle}>Monthly Top Performers</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.podiumList}
              snapToInterval={PODIUM_CARD_WIDTH + SPACING.md}
              decelerationRate="fast"
            >
              {stats.topPerformers.map((user, idx) => (
                <TouchableOpacity key={user._id} onPress={() => setSelectedEmp(user)} activeOpacity={0.9}>
                  <PodiumCard user={user} rank={idx + 1} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Full Leaderboard */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Full Leaderboard</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{filteredLeaderboard.length}</Text>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or email..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor={COLORS.textMuted}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* List */}
          <View style={styles.leaderboardList}>
            {filteredLeaderboard.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color={COLORS.border} />
                <Text style={styles.emptyText}>No results found</Text>
              </View>
            ) : (
              filteredLeaderboard.map((item, idx) => (
                <TouchableOpacity
                  key={item._id}
                  style={styles.leaderRow}
                  onPress={() => setSelectedEmp(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.leaderRank}>
                    <Text style={[styles.rankText, item.rank <= 3 && styles.rankTextTop]}>
                      {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : `#${item.rank}`}
                    </Text>
                  </View>
                  <View style={styles.listAvatar}>
                    {item.profilePicture ? (
                      <Image
                        source={{ uri: getImageUrl(item.profilePicture) }}
                        style={styles.avatarImg}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.listAvatarText}>{item.name?.[0]}</Text>
                    )}
                  </View>
                  <View style={styles.leaderInfo}>
                    <Text style={styles.leaderName}>{item.name}</Text>
                    <Text style={styles.leaderEmail}>{item.email}</Text>
                  </View>
                  <View style={styles.leaderStats}>
                    <Text style={styles.leaderScore}>{item.performanceScore}</Text>
                    <View style={styles.trendRow}>
                      <Ionicons
                        name={item.trend >= 0 ? 'trending-up' : 'trending-down'}
                        size={12}
                        color={item.trend >= 0 ? '#059669' : '#DC2626'}
                      />
                      <Text style={[styles.trendText, { color: item.trend >= 0 ? '#059669' : '#DC2626' }]}>
                        {item.trend >= 0 ? '+' : ''}{item.trend}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        {/* Footer spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Employee Detail Modal */}
      <Modal
        visible={!!selectedEmp}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedEmp(null)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <TouchableOpacity style={styles.closeBtn} onPress={() => {
                setSelectedEmp(null);
                setShowFeedbackForm(false);
              }}>
                <Ionicons name="close" size={24} color={COLORS.textMain} />
              </TouchableOpacity>
            </View>

            {selectedEmp && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                <View style={styles.modalProfileSection}>
                  <View style={styles.modalAvatar}>
                    {selectedEmp.profilePicture ? (
                      <Image
                        source={{ uri: getImageUrl(selectedEmp.profilePicture) }}
                        style={styles.modalImg}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.modalInitials}>
                        {(selectedEmp.name || '').split(' ').map(n => n[0]).filter(Boolean).join('').slice(0, 2).toUpperCase() || '??'}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.modalName}>{selectedEmp.name}</Text>
                  <Text style={styles.modalEmail}>{selectedEmp.email}</Text>
                  <View style={[styles.rankBadge, { backgroundColor: selectedEmp.rank <= 3 ? '#FEF9C3' : COLORS.indigo50 }]}>
                    <Text style={[styles.rankBadgeText, { color: selectedEmp.rank <= 3 ? '#A16207' : COLORS.primary }]}>
                      RANK #{selectedEmp.rank}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalStatsGrid}>
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatValue}>{selectedEmp.performanceScore}</Text>
                    <Text style={styles.modalStatLabel}>POINTS</Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatValue}>{selectedEmp.totalAttendance}</Text>
                    <Text style={styles.modalStatLabel}>DAYS</Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Text style={[styles.modalStatValue, { color: selectedEmp.trend >= 0 ? '#059669' : '#DC2626' }]}>
                      {selectedEmp.trend >= 0 ? '+' : ''}{selectedEmp.trend}
                    </Text>
                    <Text style={styles.modalStatLabel}>TREND</Text>
                  </View>
                </View>



                {/* <View style={styles.modalInfoSection}>
                  <Text style={styles.modalSectionTitle}>Performance Insights</Text>
                  <View style={styles.insightCard}>
                    <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
                    <Text style={styles.insightText}>
                      This employee is currently ranked in the top {Math.round((selectedEmp.rank / (stats?.totalEmployees || 1)) * 100)}% of the workforce.
                    </Text>
                  </View>
                </View> */}
                {/* 
                <TouchableOpacity
                  style={styles.modalActionBtn}
                  onPress={() => {
                    setSelectedEmp(null);
                    setShowFeedbackForm(false);
                  }}
                >
                  <Text style={styles.modalActionText}>Close Details</Text>
                </TouchableOpacity> */}

                <View style={styles.modalInfoSection}>
                  <Text style={styles.modalSectionTitle}>Admin Controls</Text>
                  {!showFeedbackForm ? (
                    <TouchableOpacity
                      style={styles.giveFeedbackBtn}
                      onPress={() => {
                        setFeedbackPoints(0);
                        setFeedbackText('');
                        setFeedbackImage(null);
                        setShowFeedbackForm(true);
                      }}
                    >
                      <Ionicons name="chatbubble-ellipses-outline" size={20} color={COLORS.white} />
                      <Text style={styles.giveFeedbackText}>Send Feedback & Points</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.feedbackForm}>
                      <View style={styles.formHeader}>
                        <Text style={styles.formTitle}>New Feedback</Text>
                        <TouchableOpacity onPress={() => setShowFeedbackForm(false)}>
                          <Text style={styles.cancelLink}>Cancel</Text>
                        </TouchableOpacity>
                      </View>

                      <TextInput
                        style={styles.feedbackInput}
                        placeholder="What would you like to tell the employee?"
                        multiline
                        numberOfLines={4}
                        value={feedbackText}
                        onChangeText={setFeedbackText}
                        placeholderTextColor={COLORS.textMuted}
                      />

                      <View style={styles.pointsRow}>
                        <Text style={styles.pointsLabel}>Adjustment Points:</Text>
                        <View style={styles.pointsControls}>
                          <TouchableOpacity onPress={() => setFeedbackPoints(p => p - 1)} style={styles.pointBtnSmall}>
                            <Ionicons name="remove" size={14} color={COLORS.textMain} />
                          </TouchableOpacity>

                          <View style={styles.pointsInputWrapper}>
                            <TextInput
                              style={[styles.pointsInput, feedbackPoints > 0 ? styles.positive : feedbackPoints < 0 ? styles.negative : null]}
                              keyboardType="numbers-and-punctuation"
                              value={feedbackPoints === 0 ? '' : feedbackPoints.toString()}
                              placeholder="0"
                              onChangeText={(val) => {
                                if (val === '' || val === '-') {
                                  setFeedbackPoints(val === '-' ? '-' : 0);
                                  return;
                                }
                                const num = parseInt(val);
                                if (!isNaN(num)) setFeedbackPoints(num);
                              }}
                            />
                          </View>

                          <TouchableOpacity onPress={() => setFeedbackPoints(p => (typeof p === 'number' ? p : 0) + 1)} style={styles.pointBtnSmall}>
                            <Ionicons name="add" size={14} color={COLORS.textMain} />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <TouchableOpacity style={styles.imagePickerBtn} onPress={handlePickImage}>
                        <Ionicons name="camera-outline" size={20} color={COLORS.primary} />
                        <Text style={styles.imagePickerText}>
                          {feedbackImage ? 'Image Attached' : 'Attach Photo (Optional)'}
                        </Text>
                        {feedbackImage && (
                          <TouchableOpacity onPress={() => setFeedbackImage(null)} style={styles.removeImage}>
                            <Ionicons name="close-circle" size={18} color="#ef4444" />
                          </TouchableOpacity>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.submitFeedbackBtn, submittingFeedback && styles.disabledBtn]}
                        onPress={handleFeedbackSubmit}
                        disabled={submittingFeedback}
                      >
                        {submittingFeedback ? (
                          <Text style={styles.submitFeedbackText}>Submitting...</Text>
                        ) : (
                          <>
                            <Ionicons name="send" size={18} color={COLORS.white} />
                            <Text style={styles.submitFeedbackText}>Send Message</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                <View style={{ height: insets.bottom + 20 }} />
              </ScrollView>
            )}
          </KeyboardAvoidingView>
        </View>
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
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    ...SHADOWS.md,
  },
  headerLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '700', letterSpacing: 1.2 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: COLORS.white, marginTop: 4, letterSpacing: -0.5 },
  syncBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  scrollContent: { padding: SPACING.md },

  // Stats Grid
  statsGrid: { marginBottom: SPACING.lg },
  statsRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
  statCard: {
    flex: 1, padding: SPACING.lg, borderRadius: RADIUS.xl,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)',
  },
  statIconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  statLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 20, fontWeight: '900', color: COLORS.textMain, marginTop: 2 },

  // Sections
  section: { marginBottom: SPACING.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.lg, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textMain },
  countBadge: { backgroundColor: COLORS.indigo50, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  countText: { fontSize: 12, fontWeight: '800', color: COLORS.primary },

  // Podium
  podiumList: { paddingHorizontal: 4, paddingBottom: 10, paddingTop: 16, gap: SPACING.md },
  podiumCard: {
    width: PODIUM_CARD_WIDTH,
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: SPACING.lg, alignItems: 'center', borderWidth: 2,
    ...SHADOWS.md,
  },
  podiumRankBadge: {
    position: 'absolute', top: -14, alignSelf: 'center',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    zIndex: 10, ...SHADOWS.sm,
  },
  podiumRankText: { color: COLORS.white, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  podiumAvatar: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.background,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    borderWidth: 3, borderColor: COLORS.white, overflow: 'hidden',
  },
  podiumImg: { width: '100%', height: '100%' },
  podiumInitials: { fontSize: 24, fontWeight: '800', color: COLORS.primary },
  podiumName: { fontSize: 14, fontWeight: '800', color: COLORS.textMain, marginBottom: 12 },
  podiumStats: { flexDirection: 'row', alignItems: 'center', width: '100%', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10 },
  podiumStatItem: { flex: 1, alignItems: 'center' },
  podiumStatValue: { fontSize: 14, fontWeight: '900', color: COLORS.textMain },
  podiumStatLabel: { fontSize: 9, fontWeight: '700', color: COLORS.textMuted, marginTop: 2 },
  podiumStatDivider: { width: 1, height: 20, backgroundColor: COLORS.border },

  // Search
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, height: 50,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: '100%', color: COLORS.textMain, fontSize: 14, fontWeight: '600' },

  // Leaderboard
  leaderboardList: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  leaderRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  leaderRank: { width: 40, alignItems: 'center' },
  rankText: { fontSize: 14, fontWeight: '800', color: COLORS.textMuted },
  rankTextTop: { fontSize: 18 },
  listAvatar: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: COLORS.indigo50, justifyContent: 'center',
    alignItems: 'center', overflow: 'hidden'
  },
  avatarImg: { width: '100%', height: '100%' },
  listAvatarText: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  leaderInfo: { flex: 1, paddingHorizontal: 12 },
  leaderName: { fontSize: 14, fontWeight: '700', color: COLORS.textMain },
  leaderEmail: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  leaderStats: { alignItems: 'flex-end' },
  leaderScore: { fontSize: 15, fontWeight: '900', color: COLORS.textMain },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  trendText: { fontSize: 11, fontWeight: '800' },
  emptyState: { padding: 40, alignItems: 'center', gap: 12 },
  emptyText: { color: COLORS.textMuted, fontWeight: '600' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '80%',
    ...SHADOWS.lg,
  },
  modalHeader: {
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginBottom: 8,
  },
  closeBtn: { position: 'absolute', right: 20, top: 15 },
  modalScroll: { padding: SPACING.xl },
  modalProfileSection: { alignItems: 'center', marginBottom: SPACING.xxl },
  modalAvatar: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.background,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    borderWidth: 4, borderColor: COLORS.white, ...SHADOWS.md, overflow: 'hidden',
  },
  modalImg: { width: '100%', height: '100%' },
  modalInitials: { fontSize: 32, fontWeight: '800', color: COLORS.primary },
  modalName: { fontSize: 24, fontWeight: '900', color: COLORS.textMain, marginBottom: 4 },
  modalEmail: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 16 },
  rankBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: RADIUS.full },
  rankBadgeText: { fontSize: 11, fontWeight: '900' },

  modalStatsGrid: {
    flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: RADIUS.xl,
    padding: SPACING.lg, marginBottom: SPACING.xxl, borderWidth: 1, borderColor: COLORS.border,
  },
  modalStatItem: { flex: 1, alignItems: 'center' },
  modalStatValue: { fontSize: 22, fontWeight: '900', color: COLORS.textMain },
  modalStatLabel: { fontSize: 10, fontWeight: '800', color: COLORS.textMuted, marginTop: 4 },

  modalInfoSection: { marginBottom: SPACING.xxl },
  modalSectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textMain, marginBottom: 16 },

  // Feedback Form
  giveFeedbackBtn: {
    flexDirection: 'row', backgroundColor: COLORS.primary, padding: 16,
    borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', gap: 10,
    ...SHADOWS.md,
  },
  giveFeedbackText: { color: COLORS.white, fontSize: 14, fontWeight: '800' },

  feedbackForm: {
    backgroundColor: '#F1F5F9', padding: SPACING.lg, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border,
  },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  formTitle: { fontSize: 14, fontWeight: '800', color: COLORS.textMain },
  cancelLink: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  feedbackInput: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: 12,
    fontSize: 14, color: COLORS.textMain, height: 100, textAlignVertical: 'top',
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 16,
  },
  pointsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  pointsLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  pointsControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pointBtnSmall: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.white,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  pointsInputWrapper: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: 60,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointsInput: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textMain,
    textAlign: 'center',
    width: '100%',
    padding: 0,
  },
  positive: { color: '#059669' },
  negative: { color: '#DC2626' },

  imagePickerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.white,
    padding: 12, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
    marginBottom: 20,
  },
  imagePickerText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  removeImage: { position: 'absolute', right: 10 },

  submitFeedbackBtn: {
    flexDirection: 'row', backgroundColor: COLORS.primary, padding: 14,
    borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  disabledBtn: { opacity: 0.7 },
  submitFeedbackText: { color: COLORS.white, fontSize: 14, fontWeight: '800' },

  insightCard: {
    flexDirection: 'row', backgroundColor: COLORS.indigo50, padding: SPACING.lg,
    borderRadius: RADIUS.lg, gap: 12, alignItems: 'center',
  },
  insightText: { flex: 1, fontSize: 10, color: COLORS.primary, fontWeight: '600', lineHeight: 18 },

  modalActionBtn: {
    backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: RADIUS.xl,
    alignItems: 'center', ...SHADOWS.md,
  },
  modalActionText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
});
