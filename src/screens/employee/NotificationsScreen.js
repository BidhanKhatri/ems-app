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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../theme/theme';

export default function NotificationsScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  useEffect(() => {
    load();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    load(false);
  };

  const markRead = async (id) => {
    try {
      await api.patch(`/activity/notifications/${id}/read`);
      setItems((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to mark read');
    }
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
      <StatusBar barStyle="light-content" />
      
      {/* Fixed elevated header layer */}
      <View style={styles.headerWrapper}>
        <View style={styles.headerBackground} />
        <SafeAreaView style={{ flex: 0 }}>
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="notifications" size={24} color={COLORS.white} style={{ marginRight: SPACING.sm }} />
              <Text style={styles.headerTitle}>Alerts & Notifications</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <SafeAreaView style={styles.safeArea}>

        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={64} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.card, !item.isRead && styles.unreadCard]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: !item.isRead ? COLORS.primary : COLORS.background }]}>
                  <Ionicons
                    name={item.title.toLowerCase().includes('attendance') ? 'calendar' : 'information-circle'}
                    size={20}
                    color={!item.isRead ? COLORS.white : COLORS.textSecondary}
                  />
                </View>
                <View style={styles.titleArea}>
                  <Text style={[styles.title, !item.isRead && styles.unreadTitle]}>{item.title}</Text>
                  <Text style={styles.time}>{new Date(item.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</Text>
                </View>
              </View>
              <Text style={styles.message}>{item.message}</Text>
              {!item.isRead && (
                <TouchableOpacity style={styles.markReadBtn} onPress={() => markRead(item._id)}>
                  <Text style={styles.markReadText}>Mark as read</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
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
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
    marginTop: Platform.OS === 'android' ? 10 : 0,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  emptyText: {
    marginTop: SPACING.md,
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  unreadCard: {
    borderColor: COLORS.primaryLight,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  titleArea: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  unreadTitle: {
    color: COLORS.primary,
  },
  time: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  message: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginLeft: 40,
  },
  markReadBtn: {
    alignSelf: 'flex-end',
    marginTop: 4,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  markReadText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
  },
});
