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
import { medicineService } from '../../services/api';

export const MedicineListScreen = ({ route, navigation }) => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('ALL'); // 'ALL' | 'LOW' | 'SAFE'

  useEffect(() => {
    fetchMedicines();
  }, []);

  useEffect(() => {
    if (route.params?.refresh) {
      fetchMedicines();
    }
  }, [route.params?.refresh]);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const res = await medicineService.getMedicines({ limit: 100 });
      if (res?.data?.medicines) {
        setMedicines(res.data.medicines);
      } else if (Array.isArray(res?.data)) {
        setMedicines(res.data);
      } else if (Array.isArray(res)) {
        setMedicines(res);
      }
    } catch (err) {
      console.log('Error fetching medicines:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMedicines();
  };

  const handleDeleteMedicine = (med, e) => {
    if (e && e.stopPropagation) e.stopPropagation();

    const doDelete = async () => {
      try {
        await medicineService.deleteMedicine(med.id);
        if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert('✅ Data obat berhasil dihapus!');
        else Alert.alert('Berhasil', 'Data obat berhasil dihapus!');
        fetchMedicines();
      } catch (err) {
        const msg = err.response?.data?.error || 'Gagal menghapus data obat.';
        if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(`❌ ${msg}`);
        else Alert.alert('Error', msg);
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Apakah Anda yakin ingin menghapus obat "${med.name}"?`)) {
        doDelete();
      }
    } else {
      Alert.alert('Konfirmasi Hapus', `Apakah Anda yakin ingin menghapus obat "${med.name}"?`, [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const filteredMedicines = medicines.filter((med) => {
    const totalStock = med.totalStock !== undefined ? med.totalStock : (med.stock || 0);

    if (stockFilter === 'LOW' && totalStock >= 50) return false;
    if (stockFilter === 'SAFE' && totalStock < 50) return false;

    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const name = (med.name || '').toLowerCase();
    const code = (med.code || '').toLowerCase();
    const category = (med.category || '').toLowerCase();
    return name.includes(query) || code.includes(query) || category.includes(query);
  });

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
        <Text style={styles.headerTitle}>Modul Obat & Farmasi</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('MedicineForm')}>
          <Text style={styles.addBtnText}>+ Tambah</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama obat, kode, atau kategori farmasi..."
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
            { label: 'Semua Obat', value: 'ALL' },
            { label: '⚠️ Stok Rendah (<50)', value: 'LOW' },
            { label: '✅ Stok Aman', value: 'SAFE' },
          ].map((tab) => {
            const isActive = stockFilter === tab.value;
            return (
              <TouchableOpacity
                key={tab.value}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setStockFilter(tab.value)}
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
            <Text style={styles.loadingText}>Memuat stok obat & farmasi...</Text>
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
                Menampilkan <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>{filteredMedicines.length}</Text> dari <Text style={{ fontWeight: 'bold' }}>{medicines.length}</Text> jenis obat farmasi
              </Text>
            </View>

            {filteredMedicines.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={{ fontSize: 40, marginBottom: 8 }}>💊</Text>
                <Text style={styles.emptyTitle}>Data Obat Tidak Ditemukan</Text>
                <Text style={styles.emptySub}>
                  {searchQuery ? `Tidak ada obat yang cocok dengan "${searchQuery}".` : 'Belum ada data obat di inventori.'}
                </Text>
              </View>
            ) : (
              filteredMedicines.map((med, idx) => {
                const totalStock = med.totalStock !== undefined ? med.totalStock : (med.stock || 0);
                const isLowStock = totalStock < 50;

                return (
                  <TouchableOpacity
                    key={med.id || idx}
                    style={styles.medCard}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('MedicineDetail', { medicineData: med, medicineId: med.id })}
                  >
                    {/* Top Row: Icon, Name & Code */}
                    <View style={styles.cardTop}>
                      <View style={styles.iconBox}>
                        <Text style={{ fontSize: 26 }}>💊</Text>
                      </View>

                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.medName}>{med.name}</Text>
                        <Text style={styles.medCategory}>{med.category || 'Obat Umum'} • {med.unit || 'Tablet'}</Text>
                      </View>

                      <View style={styles.codeBadge}>
                        <Text style={styles.codeBadgeText}>{med.code || `OBT-${idx + 1}`}</Text>
                      </View>
                    </View>

                    {/* Stock & Price Banner */}
                    <View style={styles.metaBanner}>
                      <View style={styles.metaCol}>
                        <Text style={styles.metaLabel}>Harga Satuan / HET:</Text>
                        <Text style={styles.priceValue}>{formatRupiah(med.price)}</Text>
                      </View>

                      <View style={styles.metaColRight}>
                        <Text style={styles.metaLabel}>Stok Tersedia:</Text>
                        <View style={[styles.stockPill, isLowStock ? styles.stockPillLow : styles.stockPillSafe]}>
                          <Text style={[styles.stockPillText, isLowStock ? styles.stockPillTextLow : styles.stockPillTextSafe]}>
                            {isLowStock ? '⚠️ ' : '✓ '}{totalStock} {med.unit || 'Pcs'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {med.description ? (
                      <Text style={styles.descText} numberOfLines={1}>
                        ℹ️ {med.description}
                      </Text>
                    ) : null}

                    {/* Card Footer Actions */}
                    <View style={styles.cardFooter}>
                      <Text style={styles.detailLinkText}>Detail & Batch Stok →</Text>
                      <View style={styles.cardActionsGroup}>
                        <TouchableOpacity
                          style={styles.cardActionBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            navigation.navigate('MedicineForm', { medicineData: med });
                          }}
                        >
                          <Text style={styles.cardActionBtnText}>✏️ Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.cardActionBtn, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}
                          onPress={(e) => handleDeleteMedicine(med, e)}
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
  medCard: {
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
    width: 48,
    height: 48,
    borderRadius: RADII.md,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  medName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  medCategory: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  codeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADII.sm,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  codeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
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
  },
  metaLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  stockPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADII.sm,
  },
  stockPillSafe: {
    backgroundColor: '#DCFCE7',
  },
  stockPillLow: {
    backgroundColor: '#FEE2E2',
  },
  stockPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  stockPillTextSafe: {
    color: '#15803D',
  },
  stockPillTextLow: {
    color: '#B91C1C',
  },
  descText: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
    marginBottom: 8,
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
