import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { COLORS, RADII, SHADOWS } from '../../constants/theme';
import { userService, publicService } from '../../services/api';

const roleConfig = {
  ADMIN: { label: 'ADMINISTRATOR', bg: '#FEE2E2', text: '#B91C1C', icon: '👑' },
  DOCTOR: { label: 'DOKTER SPESIALIS', bg: '#EFF6FF', text: '#1D4ED8', icon: '👨‍⚕️' },
  NURSE: { label: 'PERAWAT', bg: '#DCFCE7', text: '#15803D', icon: '👩‍⚕️' },
  FRONT_DESK: { label: 'FRONT DESK / KASIR', bg: '#FEF3C7', text: '#B45309', icon: '🏥' },
  PHARMACY: { label: 'APOTEKER / FARMASI', bg: '#E0F2FE', text: '#0369A1', icon: '💊' },
  LABORATORY: { label: 'ANALIS LAB', bg: '#F3E8FF', text: '#6B21A8', icon: '🔬' },
  PATIENT: { label: 'PASIEN', bg: '#F1F5F9', text: '#475569', icon: '👤' },
};

export const UserListScreen = ({ route, navigation }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  useEffect(() => {
    if (route.params?.refresh) {
      fetchUsers();
    }
  }, [route.params?.refresh]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await userService.getUsers({ limit: 100 });
      let list = [];
      if (res?.data?.users) list = res.data.users;
      else if (res?.users) list = res.users;
      else if (Array.isArray(res?.data)) list = res.data;
      else if (Array.isArray(res)) list = res;
      setUsers(list);
    } catch (err) {
      console.log('Error fetching users in mobile:', err.message);
      try {
        const pubRes = await publicService.getDoctors();
        const docList = pubRes?.data?.doctors || pubRes?.doctors || [];
        setUsers(docList);
      } catch (pubErr) {
        console.log('Public doctors fallback error:', pubErr.message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleDeleteUser = (usr, e) => {
    if (e && e.stopPropagation) e.stopPropagation();

    const doDelete = async () => {
      try {
        await userService.deleteUser(usr.id);
        if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert('✅ Pengguna berhasil dihapus!');
        else Alert.alert('Berhasil', 'Pengguna berhasil dihapus!');
        fetchUsers();
      } catch (err) {
        const msg = err.response?.data?.error || err.response?.data?.message || 'Gagal menghapus pengguna.';
        if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(`❌ ${msg}`);
        else Alert.alert('Error', msg);
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Apakah Anda yakin ingin menghapus akun "${usr.name}"?`)) {
        doDelete();
      }
    } else {
      Alert.alert('Konfirmasi Hapus', `Apakah Anda yakin ingin menghapus akun "${usr.name}"?`, [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;

    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const name = (u.name || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const dept = (u.department || '').toLowerCase();
    const phone = (u.phone || '').toLowerCase();
    return name.includes(query) || email.includes(query) || dept.includes(query) || phone.includes(query);
  });

  const doctorCount = users.filter((u) => u.role === 'DOCTOR').length;
  const nurseCount = users.filter((u) => u.role === 'NURSE').length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary700} />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manajemen Pengguna & Role</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('UserForm')}>
          <Text style={styles.addBtnText}>+ Tambah</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama staff, email, departemen, atau nomor telepon..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Pills: Role */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {[
            { label: 'Semua Staff', value: 'ALL' },
            { label: '👑 Admin', value: 'ADMIN' },
            { label: '👨‍⚕️ Dokter', value: 'DOCTOR' },
            { label: '👩‍⚕️ Perawat', value: 'NURSE' },
            { label: '🏥 Front Desk', value: 'FRONT_DESK' },
            { label: '💊 Farmasi', value: 'PHARMACY' },
            { label: '🔬 Lab', value: 'LABORATORY' },
          ].map((tab) => {
            const isActive = roleFilter === tab.value;
            return (
              <TouchableOpacity
                key={tab.value}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setRoleFilter(tab.value)}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Memuat akun staf & pengguna SIMRS...</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header Counter Badge */}
            <View style={styles.counterBadgeRow}>
              <Text style={styles.counterBadgeText}>
                Total Pengguna: <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>{filteredUsers.length}</Text> Staff | <Text style={{ fontWeight: 'bold' }}>{doctorCount}</Text> Dokter | <Text style={{ fontWeight: 'bold' }}>{nurseCount}</Text> Perawat
              </Text>
            </View>

            {filteredUsers.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={{ fontSize: 40, marginBottom: 8 }}>👥</Text>
                <Text style={styles.emptyTitle}>Pengguna Tidak Ditemukan</Text>
                <Text style={styles.emptySub}>
                  {searchQuery ? `Tidak ada pengguna yang cocok dengan "${searchQuery}".` : 'Belum ada data pengguna.'}
                </Text>
              </View>
            ) : (
              filteredUsers.map((usr, idx) => {
                const rc = roleConfig[usr.role] || roleConfig.PATIENT;

                return (
                  <TouchableOpacity
                    key={usr.id || idx}
                    style={styles.userCard}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('UserDetail', { userId: usr.id, userData: usr })}
                  >
                    {/* Top Row: Avatar, Name & Role Badge */}
                    <View style={styles.cardTop}>
                      <View style={styles.avatarBox}>
                        <Text style={{ fontSize: 24 }}>{rc.icon}</Text>
                      </View>

                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.userName}>{usr.name}</Text>
                        <Text style={styles.userEmail}>{usr.email}</Text>
                      </View>

                      <View style={[styles.roleBadge, { backgroundColor: rc.bg }]}>
                        <Text style={[styles.roleBadgeText, { color: rc.text }]}>{rc.label}</Text>
                      </View>
                    </View>

                    {/* Department & Phone Info */}
                    <View style={styles.metaRow}>
                      <Text style={styles.metaText}>🏛️ Dept: <Text style={{ fontWeight: '700', color: COLORS.primary }}>{usr.department || 'Manajemen RS'}</Text></Text>
                      <Text style={styles.metaText}>📞 {usr.phone || '-'}</Text>
                    </View>

                    {/* Card Footer Actions */}
                    <View style={styles.cardFooter}>
                      <Text style={styles.detailLinkText}>Detail Hak Akses & Profil →</Text>
                      <View style={styles.cardActionsGroup}>
                        <TouchableOpacity
                          style={styles.cardActionBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            navigation.navigate('UserForm', { userData: usr });
                          }}
                        >
                          <Text style={styles.cardActionBtnText}>✏️ Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.cardActionBtn, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}
                          onPress={(e) => handleDeleteUser(usr, e)}
                        >
                          <Text style={[styles.cardActionBtnText, { color: '#B91C1C' }]}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: RADII.sm,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  addBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: RADII.sm,
  },
  addBtnText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: RADII.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    ...SHADOWS.sm,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
  },
  clearSearchText: {
    fontSize: 14,
    color: '#64748B',
    paddingHorizontal: 4,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADII.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  counterBadgeRow: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  counterBadgeText: {
    fontSize: 12,
    color: '#64748B',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADII.lg,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  userEmail: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADII.sm,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: RADII.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metaText: {
    fontSize: 11,
    color: '#475569',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  detailLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  cardActionsGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  cardActionBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADII.sm,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cardActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
});
