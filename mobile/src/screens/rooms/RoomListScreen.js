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
import { roomService } from '../../services/api';

const statusConfig = {
  AVAILABLE: { label: 'TERSEDIA', bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' },
  OCCUPIED: { label: 'TERISI', bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5' },
  MAINTENANCE: { label: 'PERBAIKAN', bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' },
  CLEANING: { label: 'PEMBERSIHAN', bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD' },
  RESERVED: { label: 'RESERVASI', bg: '#F3E8FF', text: '#6B21A8', border: '#E9D5FF' },
};

export const RoomListScreen = ({ route, navigation }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE'
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'VIP' | 'KELAS_1' | 'ICU' etc.

  useEffect(() => {
    fetchRooms();
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    if (route.params?.refresh) {
      fetchRooms();
    }
  }, [route.params?.refresh]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const params = { limit: 100 };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (typeFilter !== 'ALL') params.roomType = typeFilter;

      const res = await roomService.getRooms(params);
      if (res?.data?.rooms) {
        setRooms(res.data.rooms);
      } else if (Array.isArray(res?.data)) {
        setRooms(res.data);
      } else if (Array.isArray(res)) {
        setRooms(res);
      }
    } catch (err) {
      console.log('Error fetching rooms:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRooms();
  };

  const handleDeleteRoom = (room, e) => {
    if (e && e.stopPropagation) e.stopPropagation();

    const doDelete = async () => {
      try {
        await roomService.deleteRoom(room.id);
        if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert('✅ Data kamar berhasil dihapus!');
        else Alert.alert('Berhasil', 'Data kamar berhasil dihapus!');
        fetchRooms();
      } catch (err) {
        const msg = err.response?.data?.error || err.response?.data?.message || 'Gagal menghapus kamar.';
        if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(`❌ ${msg}`);
        else Alert.alert('Error', msg);
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Hapus kamar "${room.roomNumber}"?`)) {
        doDelete();
      }
    } else {
      Alert.alert('Konfirmasi Hapus', `Hapus kamar "${room.roomNumber}"?`, [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const filteredRooms = rooms.filter((r) => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (typeFilter !== 'ALL' && r.roomType !== typeFilter) return false;

    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const rNo = (r.roomNumber || '').toLowerCase();
    const rName = (r.roomName || '').toLowerCase();
    const bld = (r.building || '').toLowerCase();
    const rType = (r.roomType || '').toLowerCase();
    return rNo.includes(query) || rName.includes(query) || bld.includes(query) || rType.includes(query);
  });

  const availableCount = rooms.filter((r) => r.status === 'AVAILABLE').length;
  const occupiedCount = rooms.filter((r) => r.status === 'OCCUPIED').length;
  const totalBeds = rooms.reduce((sum, r) => sum + (r.bedCapacity || 1), 0);
  const borPercentage = totalBeds > 0 ? Math.round((occupiedCount / rooms.length) * 100) || 0 : 0;

  const formatRupiah = (number) => {
    if (!number && number !== 0) return 'Rp 0';
    return `Rp ${Number(number).toLocaleString('id-ID')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary700} />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manajemen Kamar & Bed</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('RoomForm')}>
          <Text style={styles.addBtnText}>+ Tambah</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nomor kamar, nama, tipe, atau gedung..."
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

        {/* Filter Pills: Status */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {[
            { label: 'Semua Status', value: 'ALL' },
            { label: '🟢 Tersedia', value: 'AVAILABLE' },
            { label: '🔴 Terisi', value: 'OCCUPIED' },
            { label: '🛠️ Perbaikan', value: 'MAINTENANCE' },
            { label: '🧹 Pembersihan', value: 'CLEANING' },
          ].map((tab) => {
            const isActive = statusFilter === tab.value;
            return (
              <TouchableOpacity
                key={tab.value}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setStatusFilter(tab.value)}
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
            <Text style={styles.loadingText}>Memuat kapasitas kamar & fasilitas bangsal...</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />}
            contentContainerStyle={styles.scrollContent}
          >
            {/* BOR Summary Widget */}
            <View style={styles.borWidget}>
              <View style={styles.borWidgetCol}>
                <Text style={styles.borWidgetLabel}>Kamar Tersedia</Text>
                <Text style={styles.borWidgetValGreen}>{availableCount} Unit</Text>
              </View>
              <View style={styles.borDivider} />
              <View style={styles.borWidgetCol}>
                <Text style={styles.borWidgetLabel}>Kamar Terisi</Text>
                <Text style={styles.borWidgetValRed}>{occupiedCount} Unit</Text>
              </View>
              <View style={styles.borDivider} />
              <View style={styles.borWidgetCol}>
                <Text style={styles.borWidgetLabel}>Bed Occupancy Rate</Text>
                <Text style={styles.borWidgetValBlue}>{borPercentage}% BOR</Text>
              </View>
            </View>

            {filteredRooms.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={{ fontSize: 40, marginBottom: 8 }}>🛏️</Text>
                <Text style={styles.emptyTitle}>Kamar Tidak Ditemukan</Text>
                <Text style={styles.emptySub}>
                  {searchQuery ? `Tidak ada kamar yang cocok dengan "${searchQuery}".` : 'Belum ada data kamar di sistem.'}
                </Text>
              </View>
            ) : (
              filteredRooms.map((room, idx) => {
                const st = statusConfig[room.status] || statusConfig.AVAILABLE;
                const facilitiesList = Array.isArray(room.facilities)
                  ? room.facilities
                  : (typeof room.facilities === 'string' ? room.facilities.split(',') : ['AC', 'TV', 'BATHROOM']);

                return (
                  <TouchableOpacity
                    key={room.id || idx}
                    style={styles.roomCard}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('RoomDetail', { roomId: room.id, roomData: room })}
                  >
                    {/* Top Row: Room Number, Type & Status */}
                    <View style={styles.cardTop}>
                      <View style={styles.iconBox}>
                        <Text style={{ fontSize: 24 }}>🛏️</Text>
                      </View>

                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.roomNumberText}>{room.roomNumber}</Text>
                        <Text style={styles.roomSubText}>
                          {room.roomName || `Kamar ${room.roomType}`} • {room.building || 'Gedung Utama'} Lt.{room.floor || 1}
                        </Text>
                      </View>

                      <View style={[styles.statusBadge, { backgroundColor: st.bg, borderColor: st.border }]}>
                        <Text style={[styles.statusBadgeText, { color: st.text }]}>● {st.label}</Text>
                      </View>
                    </View>

                    {/* Price & Capacity Banner */}
                    <View style={styles.metaBanner}>
                      <View style={styles.metaCol}>
                        <Text style={styles.metaLabel}>Tarif Per Hari:</Text>
                        <Text style={styles.priceValue}>{formatRupiah(room.pricePerDay)}</Text>
                      </View>

                      <View style={styles.metaColRight}>
                        <Text style={styles.metaLabel}>Kapasitas Bed:</Text>
                        <Text style={styles.capacityValue}>🛏️ {room.bedCapacity || 1} Tempat Tidur</Text>
                      </View>
                    </View>

                    {/* Facilities Chips */}
                    <View style={styles.facilitiesGrid}>
                      {facilitiesList.slice(0, 4).map((f, fIdx) => (
                        <View key={fIdx} style={styles.facilityChip}>
                          <Text style={styles.facilityChipText}>✓ {f.trim()}</Text>
                        </View>
                      ))}
                      {facilitiesList.length > 4 ? (
                        <View style={styles.facilityChipMore}>
                          <Text style={styles.facilityChipMoreText}>+{facilitiesList.length - 4}</Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Card Footer Actions */}
                    <View style={styles.cardFooter}>
                      <Text style={styles.detailLinkText}>Detail & Status Hunian →</Text>
                      <View style={styles.cardActionsGroup}>
                        <TouchableOpacity
                          style={styles.cardActionBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            navigation.navigate('RoomForm', { roomData: room });
                          }}
                        >
                          <Text style={styles.cardActionBtnText}>✏️ Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.cardActionBtn, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}
                          onPress={(e) => handleDeleteRoom(room, e)}
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
    paddingHorizontal: 2,
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
  borWidget: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: RADII.lg,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'space-around',
    ...SHADOWS.sm,
  },
  borWidgetCol: {
    alignItems: 'center',
  },
  borWidgetLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 4,
  },
  borWidgetValGreen: {
    fontSize: 15,
    fontWeight: '900',
    color: '#16A34A',
  },
  borWidgetValRed: {
    fontSize: 15,
    fontWeight: '900',
    color: '#DC2626',
  },
  borWidgetValBlue: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.primary,
  },
  borDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
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
  roomCard: {
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
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: RADII.md,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  roomNumberText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  roomSubText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADII.sm,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  metaBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: RADII.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metaCol: {
    justifyContent: 'center',
  },
  metaColRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  metaLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.primary,
  },
  capacityValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  facilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
    marginBottom: 10,
  },
  facilityChip: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADII.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  facilityChipText: {
    fontSize: 10,
    color: '#2563EB',
    fontWeight: '600',
  },
  facilityChipMore: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: RADII.sm,
  },
  facilityChipMoreText: {
    fontSize: 10,
    color: '#2563EB',
    fontWeight: '700',
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
