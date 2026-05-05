import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  RefreshControl,
  StatusBar,
  Platform,
  Modal,
  Image,
  Pressable,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { API_BASE_URL } from '../../utils/config';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../theme/theme';

// ─── Filter tabs ────────────────────────────────────────────────────────────
const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'old', label: 'Earlier' },
];

// ─── Helper: icon per notification title ────────────────────────────────────
function getIcon(title = '', isRead) {
  const t = title.toLowerCase();
  if (t.includes('attendance')) return { name: 'calendar-outline', color: '#4F8EF7' };
  if (t.includes('payment') || t.includes('fee')) return { name: 'card-outline', color: '#22C55E' };
  if (t.includes('alert') || t.includes('warning')) return { name: 'warning-outline', color: '#F59E0B' };
  if (t.includes('event')) return { name: 'star-outline', color: '#A855F7' };
  if (t.includes('leave')) return { name: 'time-outline', color: '#EC4899' };
  return { name: 'notifications-outline', color: isRead ? COLORS.textSecondary : COLORS.primary };
}

// ─── Helper: is notification "new" (within last 48 h) ───────────────────────
function isNew(createdAt) {
  return Date.now() - new Date(createdAt).getTime() < 48 * 60 * 60 * 1000;
}

// ─── Image Preview Modal ─────────────────────────────────────────────────────
function ImagePreviewModal({ uri, visible, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.modalCard}>
          <TouchableOpacity style={styles.modalClose} onPress={onClose}>
            <Ionicons name="close-circle" size={30} color={COLORS.white} />
          </TouchableOpacity>
          {uri ? (
            <Image source={{ uri }} style={styles.previewImage} resizeMode="contain" />
          ) : (
            <View style={styles.previewPlaceholder}>
              <Ionicons name="image-outline" size={64} color={COLORS.textMuted} />
              <Text style={styles.previewPlaceholderText}>No image attached</Text>
            </View>
          )}
        </View>
      </Pressable>
    </Modal>
  );
}

// ─── Notification Card ───────────────────────────────────────────────────────
function NotificationCard({ item, onMarkRead, onPreviewImage }) {
  const icon = getIcon(item.title, item.isRead);
  const timeLabel = new Date(item.createdAt).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const rawImage = item.imageUrl || item.image || item.metadata?.imageUrl || item.metadata?.image;
  const fullImageUrl = rawImage
    ? (rawImage.startsWith('http') ? rawImage : `${API_BASE_URL.replace('/api', '')}/${rawImage.replace(/\\/g, '/')}`)
    : null;

  return (
    <View style={[styles.card, !item.isRead && styles.unreadCard]}>
      {/* Unread accent dot */}
      {!item.isRead && <View style={styles.unreadDot} />}

      <View style={styles.cardInner}>
        {/* Announcement Icon */}
        <View style={[styles.iconCircle, { backgroundColor: !item.isRead ? COLORS.primary + '15' : '#F0F2F5' }]}>
          <Ionicons
            name="megaphone"
            size={20}
            color={!item.isRead ? COLORS.primary : COLORS.textSecondary}
          />
        </View>

        {/* Body */}
        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.cardMessage} numberOfLines={2}>{item.message}</Text>
            </View>
            {/* Image preview icon — only shown when admin attaches an image */}
            {fullImageUrl ? (
              <TouchableOpacity
                style={styles.imageIconBtn}
                onPress={() => onPreviewImage(fullImageUrl)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="image-outline" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.timeRow}>
              <Ionicons name="time-outline" size={11} color={COLORS.textMuted} />
              <Text style={styles.cardTime}>{timeLabel}</Text>
            </View>
            {!item.isRead && (
              <TouchableOpacity
                style={styles.markReadChip}
                onPress={() => onMarkRead(item._id)}
                activeOpacity={0.7}
              >
                <Ionicons name="checkmark-done" size={12} color={COLORS.primary} />
                <Text style={styles.markReadText}>Mark read</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function NotificationsScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [previewUri, setPreviewUri] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  // ── API (unchanged) ──────────────────────────────────────────────────────
  const load = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const { data } = await api.get('/activity/notifications', { params: { sort: 'latest' } });
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = () => { setRefreshing(true); load(false); };

  const markRead = async (id) => {
    try {
      await api.patch(`/activity/notifications/${id}/read`);
      setItems((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to mark read');
    }
  };
  // ────────────────────────────────────────────────────────────────────────

  const unreadCount = items.filter((n) => !n.isRead).length;

  const filtered = items.filter((n) => {
    if (activeFilter === 'new') return !n.isRead || isNew(n.createdAt);
    if (activeFilter === 'old') return n.isRead && !isNew(n.createdAt);
    return true;
  });

  const handlePreviewImage = (uri) => {
    setPreviewUri(uri);
    setPreviewVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* ── Header ── */}
      <View style={styles.headerWrapper}>
        <SafeAreaView style={{ flex: 0 }}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Notifications</Text>
              {unreadCount > 0 && (
                <Text style={styles.headerSubtitle}>{unreadCount} unread</Text>
              )}
            </View>
            <View style={styles.headerBadgeWrap}>
              <Ionicons name="notifications" size={22} color={COLORS.white} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              )}
            </View>
          </View>

          {/* ── Filter tabs ── */}
          <View style={styles.filterRow}>
            {FILTERS.map((f) => {
              const isActive = activeFilter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => setActiveFilter(f.key)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterLabel, isActive && styles.filterLabelActive]}>
                    {f.label}
                  </Text>
                  {f.key === 'new' && unreadCount > 0 && (
                    <View style={[styles.filterBadge, isActive && styles.filterBadgeActive]}>
                      <Text style={[styles.filterBadgeText, isActive && { color: COLORS.primary }]}>
                        {unreadCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>
      </View>

      {/* ── List ── */}
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          ListHeaderComponent={
            filtered.length > 0 ? (
              <Text style={styles.sectionLabel}>
                {activeFilter === 'new'
                  ? 'Recent & Unread'
                  : activeFilter === 'old'
                    ? 'Earlier'
                    : 'All Notifications'}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="notifications-off-outline" size={40} color={COLORS.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>Nothing here</Text>
              <Text style={styles.emptyText}>
                {activeFilter === 'new'
                  ? "You're all caught up! No new notifications."
                  : activeFilter === 'old'
                    ? 'No older notifications found.'
                    : 'You have no notifications yet.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <NotificationCard
              item={item}
              onMarkRead={markRead}
              onPreviewImage={handlePreviewImage}
            />
          )}
        />
      </SafeAreaView>

      {/* ── Image Preview Modal ── */}
      <ImagePreviewModal
        uri={previewUri}
        visible={previewVisible}
        onClose={() => setPreviewVisible(false)}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6FB',
  },
  safeArea: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F6FB',
  },

  // Header
  headerWrapper: {
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    ...SHADOWS.md,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
    marginTop: 2,
  },
  headerBadgeWrap: {
    position: 'relative',
    padding: 6,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: COLORS.white },

  // Filter tabs
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    gap: 5,
  },
  filterChipActive: {
    backgroundColor: COLORS.white,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  filterLabelActive: {
    color: COLORS.primary,
  },
  filterBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: COLORS.primary + '18',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.white,
  },

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
    marginLeft: 2,
  },

  // List
  listContent: {
    padding: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: 100,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 72,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF0F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textMain,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 19,
  },

  // Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8EAF0',
    paddingVertical: 4,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  unreadCard: {
    backgroundColor: '#EBF5FF',
  },
  unreadDot: {
    position: 'absolute',
    top: '50%',
    right: 16,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    marginTop: -6,
    zIndex: 1,
  },
  cardInner: {
    flexDirection: 'row',
    padding: 12,
    paddingRight: 36, // room for unread dot
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
    marginTop: 2,
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textMain,
    marginBottom: 2,
  },
  imageIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginLeft: 8,
  },
  cardMessage: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cardTime: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  markReadChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '12',
  },
  markReadText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#111',
    position: 'relative',
  },
  modalClose: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  previewImage: {
    width: '100%',
    height: 320,
    backgroundColor: '#000',
  },
  previewPlaceholder: {
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  previewPlaceholderText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
});