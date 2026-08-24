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
import { polyclinicService, publicService } from '../../services/api';

const iconEmojiMap = {
  Stethoscope: '🏥',
  HeartPulse: '🩺',
  Users: '👶',
  Heart: '🤰',
  Activity: '❤️',
  Brain: '🧠',
  Pill: '💊',
  Building2: '🏢',
  Car: '🚑',
  ShieldCheck: '🛡️',
};

export const PolyclinicListScreen = ({ route, navigation }) => {
  const [polyclinics, setPolyclinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'

  useEffect(() => {
    fetchPolyclinics();
  }, [statusFilter]);

  // Refresh if route params request refresh
  useEffect(() => {
    if (route.params?.refresh) {
      fetchPolyclinics();
    }
  }, [route.params?.refresh]);

  const fetchPolyclinics = async () => {
    try {
      setLoading(true);
      const filterParams = statusFilter !== 'ALL' ? { status: statusFilter } : {};
      const res = await polyclinicService.getPolyclinics(filterParams);
      if (res?.data) {
        const polyList = res.data.polyclinics || res.data.data?.polyclinics || res.data || [];
        setPolyclinics(polyList);
      } else {
        // Fallback to public endpoint if staff auth token is expired
        const pubRes = await publicService.getPolyclinics();
        const polyList = pubRes?.data?.polyclinics || pubRes?.data || [];
        setPolyclinics(polyList);
      }
    } catch (err) {
      console.log('Error fetching polyclinics in mobile module:', err.message);
      try {
        const pubRes = await publicService.getPolyclinics();
        const polyList = pubRes?.data?.polyclinics || pubRes?.data || [];
        setPolyclinics(polyList);
      } catch (pubErr) {
        console.log('Fallback public polyclinics fetch error:', pubErr.message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPolyclinics();
  };

  const handleDeleteItem = (poly, e) => {
    if (e && e.stopPropagation) e.stopPropagation();

    const doDelete = async () => {
      try {
        await polyclinicService.deletePolyclinic(poly.id);
        if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert('✅ Poliklinik dihapus!');
        else Alert.alert('Berhasil', 'Poliklinik dihapus!');
        fetchPolyclinics();
      } catch (err) {
        const msg = err.response?.data?.error || 'Gagal menghapus poliklinik.';
        if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(`❌ ${msg}`);
        else Alert.alert('Error', msg);
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Apakah Anda yakin ingin menghapus "${poly.name}"?`)) {
        doDelete();
      }
    } else {
      Alert.alert('Konfirmasi Hapus', `Hapus poliklinik "${poly.name}"?`, [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const filteredPolyclinics = polyclinics.filter((poly) => {
    if (statusFilter === 'ACTIVE' && poly.isActive === false) return false;
    if (statusFilter === 'INACTIVE' && poly.isActive !== false) return false;

    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const name = (poly.name || '').toLowerCase();
    const engName = (poly.englishName || '').toLowerCase();
    const code = (poly.code || '').toLowerCase();
    const desc = (poly.description || '').toLowerCase();
    return name.includes(query) || engName.includes(query) || code.includes(query) || desc.includes(query);
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary700} />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modul Poliklinik</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('PolyclinicForm')}
        >
          <Text style={styles.addBtnText}>+ Tambah</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama, kode, atau deskripsi poliklinik..."
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

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {[
            { label: 'Semua', value: 'ALL' },
            { label: 'Aktif', value: 'ACTIVE' },
            { label: 'Non-Aktif', value: 'INACTIVE' },
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
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Memuat data poliklinik spesialis...</Text>
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
                Menampilkan <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>{filteredPolyclinics.length}</Text> dari <Text style={{ fontWeight: 'bold' }}>{polyclinics.length}</Text> unit poliklinik
              </Text>
            </View>

            {filteredPolyclinics.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={{ fontSize: 40, marginBottom: 8 }}>🏢</Text>
                <Text style={styles.emptyTitle}>Data Poliklinik Tidak Ditemukan</Text>
                <Text style={styles.emptySub}>
                  {searchQuery ? `Tidak ada poliklinik yang cocok dengan "${searchQuery}".` : 'Belum ada data poliklinik.'}
                </Text>
              </View>
            ) : (
              filteredPolyclinics.map((poly, idx) => {
                const iconEmoji = iconEmojiMap[poly.icon] || '🏥';
                const servicesList = Array.isArray(poly.services) && poly.services.length > 0
                  ? poly.services
                  : ['Konsultasi Spesialis', 'Pemeriksaan Diagnostik Presisi'];

                return (
                  <TouchableOpacity
                    key={poly.id || idx}
                    style={styles.polyCard}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('PolyclinicDetail', { polyclinicData: poly, polyclinicId: poly.id })}
                  >
                    {/* Top Row: Icon, Titles & Status */}
                    <View style={styles.polyCardTop}>
                      <View style={styles.iconBox}>
                        <Text style={{ fontSize: 26 }}>{iconEmoji}</Text>
                      </View>

                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={styles.titleRow}>
                          <Text style={styles.polyTitle}>{poly.name}</Text>
                        </View>
                        {poly.englishName ? (
                          <Text style={styles.polyEngTitle}>{poly.englishName}</Text>
                        ) : null}
                      </View>

                      <View style={styles.rightBadgeCol}>
                        <View style={[styles.statusBadge, poly.isActive !== false ? styles.activeBadge : styles.inactiveBadge]}>
                          <Text style={[styles.statusBadgeText, poly.isActive !== false ? styles.activeBadgeText : styles.inactiveBadgeText]}>
                            {poly.isActive !== false ? 'AKTIF' : 'NON-AKTIF'}
                          </Text>
                        </View>
                        <View style={styles.codeBadge}>
                          <Text style={styles.codeBadgeText}>{poly.code || `POLI-0${idx + 1}`}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Description */}
                    <Text style={styles.polyDesc} numberOfLines={2}>{poly.description || 'Layanan medis spesialis terpadu.'}</Text>
                    {poly.englishDescription ? (
                      <Text style={styles.polyEngDesc} numberOfLines={1}>{poly.englishDescription}</Text>
                    ) : null}

                    {/* Services Chips */}
                    <View style={styles.servicesGrid}>
                      {servicesList.slice(0, 3).map((srv, sIdx) => (
                        <View key={sIdx} style={styles.serviceChip}>
                          <Text style={styles.serviceChipText}>✓ {srv}</Text>
                        </View>
                      ))}
                      {servicesList.length > 3 ? (
                        <View style={styles.serviceChipMore}>
                          <Text style={styles.serviceChipMoreText}>+{servicesList.length - 3} lainnya</Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Card Footer Actions */}
                    <View style={styles.cardFooter}>
                      <Text style={styles.cardDetailLink}>Lihat Detail Lengkap →</Text>
                      <View style={styles.cardActionsGroup}>
                        <TouchableOpacity
                          style={styles.cardActionBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            navigation.navigate('PolyclinicForm', { polyclinicData: poly });
                          }}
                        >
                          <Text style={styles.cardActionBtnText}>✏️ Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.cardActionBtn, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}
                          onPress={(e) => handleDeleteItem(poly, e)}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    letterSpacing: 0.5,
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
    paddingHorizontal: 14,
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
    fontSize: 12,
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
    fontWeight: '500',
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
  polyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADII.lg,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  polyCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: RADII.md,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  polyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    flexShrink: 1,
  },
  polyEngTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
    marginTop: 2,
  },
  rightBadgeCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADII.sm,
  },
  activeBadge: {
    backgroundColor: '#DCFCE7',
  },
  inactiveBadge: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  activeBadgeText: {
    color: '#15803D',
  },
  inactiveBadgeText: {
    color: '#B91C1C',
  },
  codeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADII.sm,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  codeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
  },
  polyDesc: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 2,
  },
  polyEngDesc: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
    marginBottom: 12,
  },
  serviceChip: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADII.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  serviceChipText: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '600',
  },
  serviceChipMore: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADII.sm,
  },
  serviceChipMoreText: {
    fontSize: 11,
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
  cardDetailLink: {
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
