import React, { useState, useEffect, useCallback } from 'react';
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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../services/api';
import { API_BASE_URL, FRONTEND_BASE_URL } from '../../utils/config';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../theme/theme';
import PageLoader from '../../components/PageLoader';

const TabButton = ({ title, active, onPress, icon }) => (
  <TouchableOpacity
    style={[styles.tabButton, active && styles.tabButtonActive]}
    onPress={onPress}
  >
    <Ionicons name={icon} size={18} color={active ? COLORS.white : COLORS.textMuted} />
    <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>{title}</Text>
  </TouchableOpacity>
);

const FilterBadge = ({ label, active, onPress }) => (
  <TouchableOpacity
    style={[styles.filterBadge, active && styles.filterBadgeActive]}
    onPress={onPress}
  >
    <Text style={[styles.filterBadgeText, active && styles.filterBadgeTextActive]}>{label}</Text>
  </TouchableOpacity>
);

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

export default function ApprovalScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('checkins'); // 'checkins' or 'accounts'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data state
  const [checkins, setCheckins] = useState([]);
  const [accounts, setAccounts] = useState([]);

  // Account Filters
  const [accountStatus, setAccountStatus] = useState('PENDING'); // ALL, PENDING, APPROVED, REJECTED
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      if (activeTab === 'checkins') {
        const { data } = await api.get('/admin/approvals');
        setCheckins(data);
      } else {
        const { data } = await api.get('/admin/account-approvals', {
          params: {
            status: accountStatus === 'ALL' ? '' : accountStatus,
            search: search
          }
        });
        setAccounts(data.users || []);
      }
    } catch (error) {
      console.error('Fetch approvals error:', error);
      Alert.alert('Error', 'Failed to fetch approval records');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, accountStatus, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    fetchData(true);
  };

  const handleCheckinAction = async (id, isApproved) => {
    try {
      await api.post(`/admin/approve/${id}`, { isApproved });
      fetchData();
    } catch (error) {
      Alert.alert('Error', 'Action failed');
    }
  };

  const handleAccountAction = (userId, status, name) => {
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${status.toLowerCase()} access for ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await api.patch(`/admin/account-approvals/${userId}`, { status });
              fetchData();
            } catch (error) {
              Alert.alert('Error', 'Failed to update account status');
            }
          }
        }
      ]
    );
  };

  const renderCheckinItem = (req) => (
    <View key={req._id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          {req.userId?.profilePicture ? (
            <Image
              source={{ uri: getImageUrl(req.userId.profilePicture) }}
              style={styles.avatarImg}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.avatarText}>{req.userId?.name?.[0]}</Text>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{req.userId?.name || 'Unknown User'}</Text>
          <Text style={styles.userEmail}>{req.userId?.email}</Text>
        </View>
      </View>

      <View style={styles.reasonBox}>
        <Text style={styles.reasonLabel}>LATE REASON</Text>
        <Text style={styles.reasonText}>{req.reason}</Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.rejectBtn]}
          onPress={() => handleCheckinAction(req._id, false)}
        >
          <Text style={[styles.actionBtnText, styles.rejectBtnText]}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.approveBtn]}
          onPress={() => handleCheckinAction(req._id, true)}
        >
          <Text style={[styles.actionBtnText, styles.approveBtnText]}>Approve</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAccountItem = (emp) => {
    const statusConfig = {
      APPROVED: { color: '#059669', bg: '#ECFDF5', icon: 'checkmark-circle' },
      REJECTED: { color: '#DC2626', bg: '#FEF2F2', icon: 'close-circle' },
      PENDING: { color: '#D97706', bg: '#FFFBEB', icon: 'time' },
    };
    const cfg = statusConfig[emp.approvalStatus] || statusConfig.PENDING;

    return (
      <View key={emp._id} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            {emp.profilePicture ? (
              <Image
                source={{ uri: getImageUrl(emp.profilePicture) }}
                style={styles.avatarImg}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarText}>{emp.name?.[0]}</Text>
            )}
          </View>
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{emp.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                <Ionicons name={cfg.icon} size={10} color={cfg.color} />
                <Text style={[styles.statusText, { color: cfg.color }]}>{emp.approvalStatus}</Text>
              </View>
            </View>
            <Text style={styles.userEmail}>{emp.email}</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          {emp.approvalStatus === 'PENDING' ? (
            <>
              <TouchableOpacity
                style={[styles.actionBtn, styles.rejectBtn, { flex: 1 }]}
                onPress={() => handleAccountAction(emp._id, 'REJECTED', emp.name)}
              >
                <Text style={[styles.actionBtnText, styles.rejectBtnText]}>Reject Account</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.approveBtn, { flex: 1 }]}
                onPress={() => handleAccountAction(emp._id, 'APPROVED', emp.name)}
              >
                <Text style={[styles.actionBtnText, styles.approveBtnText]}>Approve Account</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, { flex: 1, backgroundColor: COLORS.background, borderColor: COLORS.border, borderWidth: 1 }]}
              onPress={() => handleAccountAction(emp._id, emp.approvalStatus === 'APPROVED' ? 'REJECTED' : 'APPROVED', emp.name)}
            >
              <Text style={[styles.actionBtnText, { color: COLORS.textSecondary }]}>
                {emp.approvalStatus === 'APPROVED' ? 'Revoke Access' : 'Restore Access'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? Math.max(insets.top, 16) : 16 }]}>
        <View>
          <Text style={styles.headerLabel}>Admin Portal</Text>
          <Text style={styles.headerTitle}>Approvals</Text>
        </View>
        <TouchableOpacity style={styles.syncBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TabButton
          title="Check-ins"
          active={activeTab === 'checkins'}
          icon="time-outline"
          onPress={() => setActiveTab('checkins')}
        />
        <TabButton
          title="Accounts"
          active={activeTab === 'accounts'}
          icon="person-add-outline"
          onPress={() => setActiveTab('accounts')}
        />
      </View>

      {/* Account Filters */}
      {activeTab === 'accounts' && (
        <View style={styles.filtersWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterList}>
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(s => (
              <FilterBadge
                key={s}
                label={s}
                active={accountStatus === s}
                onPress={() => setAccountStatus(s)}
              />
            ))}
          </ScrollView>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color={COLORS.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by email..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.loaderBox}>
            <PageLoader />
          </View>
        ) : (
          <View style={styles.listContainer}>
            {activeTab === 'checkins' ? (
              checkins.length === 0 ? (
                <EmptyState icon="checkmark-circle-outline" message="No pending check-in requests" />
              ) : (
                checkins.map(renderCheckinItem)
              )
            ) : (
              accounts.length === 0 ? (
                <EmptyState icon="people-outline" message="No account records found" />
              ) : (
                accounts.map(renderAccountItem)
              )
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const EmptyState = ({ icon, message }) => (
  <View style={styles.emptyState}>
    <Ionicons name={icon} size={64} color={COLORS.border} />
    <Text style={styles.emptyText}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    ...SHADOWS.md,
  },
  headerLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '700', letterSpacing: 1.2 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: COLORS.white, marginTop: 4 },
  syncBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    margin: SPACING.md,
    borderRadius: RADIUS.lg,
    padding: 6,
    ...SHADOWS.sm,
  },
  tabButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 10, borderRadius: RADIUS.md,
  },
  tabButtonActive: { backgroundColor: COLORS.primary, ...SHADOWS.md },
  tabButtonText: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  tabButtonTextActive: { color: COLORS.white },

  // Filters
  filtersWrapper: { paddingHorizontal: SPACING.md, gap: SPACING.sm, marginBottom: SPACING.md },
  filterList: { gap: 8, paddingBottom: 4 },
  filterBadge: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.md,
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border
  },
  filterBadgeActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterBadgeText: { fontSize: 11, fontWeight: '800', color: COLORS.textSecondary },
  filterBadgeTextActive: { color: COLORS.white },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md, height: 44, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, gap: 10,
  },
  searchInput: { flex: 1, fontSize: 13, color: COLORS.textMain, fontWeight: '600' },

  scrollContent: { padding: SPACING.md },
  listContainer: { gap: SPACING.md },
  card: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: SPACING.lg },
  avatar: { width: 48, height: 48, borderRadius: 16, backgroundColor: COLORS.indigo50, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  avatarText: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '800', color: COLORS.textMain },
  userEmail: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800' },

  reasonBox: { backgroundColor: '#F8FAFC', padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.lg, borderWidth: 1, borderColor: '#E2E8F0' },
  reasonLabel: { fontSize: 10, fontWeight: '800', color: COLORS.textMuted, marginBottom: 4, letterSpacing: 0.5 },
  reasonText: { fontSize: 13, color: COLORS.textMain, fontWeight: '600', lineHeight: 18 },

  actionRow: { flexDirection: 'row', gap: SPACING.md },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  approveBtn: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0' },
  rejectBtn: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  actionBtnText: { fontSize: 13, fontWeight: '800' },
  approveBtnText: { color: '#059669' },
  rejectBtnText: { color: '#DC2626' },

  loaderBox: { paddingVertical: 100 },
  emptyState: { paddingVertical: 60, alignItems: 'center', gap: 16 },
  emptyText: { fontSize: 14, fontWeight: '700', color: COLORS.textMuted },
});
