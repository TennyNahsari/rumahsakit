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
  Alert,
  Platform,
} from 'react-native';
import { COLORS, RADII, SHADOWS } from '../../constants/theme';
import { roomService } from '../../services/api';

const statusConfig = {
  AVAILABLE: { label: 'TERSEDIA', bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' },
  OCCUPIED: { label: 'TERISI / OCCUPIED', bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5' },
  MAINTENANCE: { label: 'PERBAIKAN', bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' },
  CLEANING: { label: 'PEMBERSIHAN', bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD' },
  RESERVED: { label: 'RESERVASI', bg: '#F3E8FF', text: '#6B21A8', border: '#E9D5FF' },
};

const facilityIconMap = {
  AC: '❄️ AC Air Conditioner',
  TV: '📺 Televisi Smart TV',
  BATHROOM: '🚿 Kamar Mandi Dalam',
  FRIDGE: '🧊 Kulkas / Refrigerator',
  WIFI: '📶 Wi-Fi High Speed',
  PHONE: '📞 Telepon Interkom',
  SOFA: '🛋️ Sofa Bed Keluarga',
  WARDROBE: '🚪 Lemari Pakaian',
};

export const RoomDetailScreen = ({ route, navigation }) => {
  const { roomId, roomData } = route.params || {};
  const [room, setRoom] = useState(roomData || null);
  const [loading, setLoading] = useState(!roomData);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (roomId) {
      fetchRoomDetail();
    }
  }, [roomId]);

  const fetchRoomDetail = async () => {
    try {
      setLoading(true);
      const res = await roomService.getRoomById(roomId);
      if (res?.data) {
        setRoom(res.data.room || res.data);
      }
    } catch (err) {
      console.log('Error fetching room detail:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    const doDelete = async () => {
      try {
        setDeleting(true);
        await roomService.deleteRoom(room.id);
        if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert('✅ Kamar berhasil dihapus!');
        else Alert.alert('Berhasil', 'Kamar berhasil dihapus!');
        navigation.navigate('Rooms', { refresh: true });
      } catch (err) {
        const msg = err.response?.data?.error || err.response?.data?.message || 'Gagal menghapus kamar.';
        if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(`❌ ${msg}`);
        else Alert.alert('Error', msg);
      } finally {
        setDeleting(false);
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Apakah Anda yakin ingin menghapus kamar "${room?.roomNumber}"?`)) {
        doDelete();
      }
    } else {
      Alert.alert('Konfirmasi Hapus', `Apakah Anda yakin ingin menghapus kamar "${room?.roomNumber}"?`, [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const formatRupiah = (number) => {
    if (!number && number !== 0) return 'Rp 0';
    return `Rp ${Number(number).toLocaleString('id-ID')}`;
  };

  if (loading || !room) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Memuat detail kamar & hunian...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const st = statusConfig[room.status] || statusConfig.AVAILABLE;
  const facilitiesList = Array.isArray(room.facilities)
    ? room.facilities
    : (typeof room.facilities === 'string' ? room.facilities.split(',') : []);

  const activeOccupancy = room.occupancies && room.occupancies.length > 0 ? room.occupancies[0] : null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Kamar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Fasilitas Kamar</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Banner Card */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerTop}>
            <View style={styles.iconBox}>
              <Text style={{ fontSize: 32 }}>🛏️</Text>
            </View>

            <View style={[styles.statusBadge, { backgroundColor: st.bg, borderColor: st.border }]}>
              <Text style={[styles.statusBadgeText, { color: st.text }]}>● {st.label}</Text>
            </View>
          </View>

          <Text style={styles.roomNumber}>{room.roomNumber}</Text>
          <Text style={styles.roomName}>{room.roomName || `Kamar Perawatan ${room.roomType}`}</Text>
          <Text style={styles.locationText}>
            🏛️ {room.building || 'Gedung Utama RS'} • Lantai {room.floor || 1}
          </Text>

          <View style={styles.metaGrid}>
            <View style={styles.gridBox}>
              <Text style={styles.gridLabel}>Tarif Per Hari:</Text>
              <Text style={styles.priceVal}>{formatRupiah(room.pricePerDay)}</Text>
            </View>

            <View style={styles.gridBoxRight}>
              <Text style={styles.gridLabel}>Kapasitas Bed:</Text>
              <Text style={styles.capacityVal}>🛏️ {room.bedCapacity || 1} Tempat Tidur</Text>
            </View>
          </View>
        </View>

        {/* Active Inpatient Occupancy (If Occupied) */}
        {activeOccupancy ? (
          <View style={styles.occupiedCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={{ fontSize: 18, marginRight: 6 }}>👤</Text>
              <Text style={styles.occupiedTitle}>Pasien Rawat Inap Aktif</Text>
            </View>

            <Text style={styles.patientName}>{activeOccupancy.patient?.name || 'Pasien Rawat Inap'}</Text>
            <Text style={styles.patientRm}>No. RM: {activeOccupancy.patient?.medicalRecordNo || '-'}</Text>

            <View style={styles.occMetaGrid}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tanggal Check-In:</Text>
                <Text style={styles.infoVal}>{new Date(activeOccupancy.checkInDate).toLocaleDateString('id-ID')}</Text>
              </View>
              {activeOccupancy.doctor ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Dokter Penanggung Jawab:</Text>
                  <Text style={styles.infoVal}>{activeOccupancy.doctor.name}</Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* Section 1: Fasilitas Kamar */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={{ fontSize: 18, marginRight: 6 }}>✨</Text>
            <Text style={styles.cardTitle}>Fasilitas Kamar Perawatan</Text>
          </View>

          {facilitiesList.length === 0 ? (
            <Text style={styles.bodyText}>Fasilitas standar perawatan rawat inap.</Text>
          ) : (
            <View style={styles.facilitiesGrid}>
              {facilitiesList.map((fKey, idx) => {
                const cleanKey = fKey.trim().toUpperCase();
                const labelText = facilityIconMap[cleanKey] || `✓ ${fKey.trim()}`;
                return (
                  <View key={idx} style={styles.facilityCardItem}>
                    <Text style={styles.facilityCardText}>{labelText}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Section 2: Deskripsi & Catatan */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={{ fontSize: 18, marginRight: 6 }}>📝</Text>
            <Text style={styles.cardTitle}>Deskripsi Kamar & Catatan SIMRS</Text>
          </View>
          <Text style={styles.bodyText}>{room.description || 'Kenyamanan ruang perawatan rawat inap dengan fasilitas keluarga lengkap dan pemantauan perawat 24 jam.'}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('RoomForm', { roomData: room })}
          >
            <Text style={styles.editBtnText}>✏️ Edit Kamar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.deleteBtnText}>🗑️ Hapus</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    padding: 16,
    paddingBottom: 32,
  },
  bannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADII.xl,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  bannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: RADII.md,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADII.sm,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  roomNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  roomName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  metaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: RADII.md,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gridBox: {
    justifyContent: 'center',
  },
  gridBoxRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  gridLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 2,
  },
  priceVal: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
  },
  capacityVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  occupiedCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: RADII.lg,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    ...SHADOWS.sm,
  },
  occupiedTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#991B1B',
  },
  patientName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#7F1D1D',
  },
  patientRm: {
    fontSize: 12,
    color: '#991B1B',
    marginTop: 2,
  },
  occMetaGrid: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#FECACA',
    gap: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADII.lg,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  bodyText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
  },
  facilitiesGrid: {
    gap: 8,
  },
  facilityCardItem: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  facilityCardText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  infoVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  editBtn: {
    flex: 2,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADII.md,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  editBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: RADII.md,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  deleteBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
