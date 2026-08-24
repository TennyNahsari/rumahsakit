import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { COLORS, RADII, SHADOWS } from '../../constants/theme';
import { patientService } from '../../services/api';

export const PatientListScreen = ({ navigation }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchPatients(currentPage, searchTerm, genderFilter);
  }, [currentPage, genderFilter]);

  const fetchPatients = async (page = 1, search = '', gender = '') => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        ...(search ? { search } : {}),
        ...(gender ? { gender } : {}),
      };
      const res = await patientService.getPatients(params);
      if (res?.data) {
        setPatients(res.data.patients || []);
        setTotalPages(res.data.pagination?.pages || 1);
      }
    } catch (err) {
      console.log('Fetch patients error:', err.message);
      Alert.alert('Gagal Memuat Data', 'Gagal mengambil daftar pasien dari server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearchSubmit = () => {
    setCurrentPage(1);
    fetchPatients(1, searchTerm, genderFilter);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPatients(currentPage, searchTerm, genderFilter);
  };

  const handleDelete = (id, name) => {
    const confirmDelete = async () => {
      try {
        await patientService.deletePatient(id);
        Alert.alert('Sukses', `Data pasien ${name} berhasil dihapus.`);
        fetchPatients(currentPage, searchTerm, genderFilter);
      } catch (err) {
        Alert.alert('Gagal Hapus', err.response?.data?.error || 'Gagal menghapus data pasien.');
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Apakah Anda yakin ingin menghapus data pasien ${name}?`)) {
        confirmDelete();
      }
    } else {
      Alert.alert('Konfirmasi Hapus', `Apakah Anda yakin ingin menghapus data pasien ${name}?`, [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: confirmDelete },
      ]);
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return '-';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daftar Pasien</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('PatientForm', { id: null })}
        >
          <Text style={styles.addBtnText}>+ Baru</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary600]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar & Filters */}
        <View style={styles.searchSection}>
          <View style={styles.searchBox}>
            <TextInput
              style={styles.searchInput}
              placeholder="Cari Nama, No. RM, atau Telepon..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
            />
            <TouchableOpacity style={styles.searchSubmitBtn} onPress={handleSearchSubmit}>
              <Text style={styles.searchSubmitBtnText}>Cari 🔍</Text>
            </TouchableOpacity>
          </View>

          {/* Gender Filter Chips */}
          <View style={styles.filterChipRow}>
            {[
              { label: 'Semua Gender', value: '' },
              { label: 'Laki-Laki', value: 'MALE' },
              { label: 'Perempuan', value: 'FEMALE' },
            ].map((chip) => (
              <TouchableOpacity
                key={chip.value}
                style={[styles.filterChip, genderFilter === chip.value && styles.filterChipActive]}
                onPress={() => {
                  setGenderFilter(chip.value);
                  setCurrentPage(1);
                }}
              >
                <Text style={[styles.filterChipText, genderFilter === chip.value && styles.filterChipTextActive]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Patient Cards List */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary600} />
            <Text style={styles.loadingText}>Memuat data pasien...</Text>
          </View>
        ) : patients.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>👤</Text>
            <Text style={styles.emptyTitle}>Data Pasien Tidak Ditemukan</Text>
            <Text style={styles.emptySub}>Coba kata kunci pencarian lain atau tambah pasien baru.</Text>
          </View>
        ) : (
          <View style={styles.patientListContainer}>
            {patients.map((patient) => (
              <View key={patient.id} style={styles.patientCard}>
                {/* Header Card */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.patientName}>{patient.name}</Text>
                    <View style={styles.mrnBadge}>
                      <Text style={styles.mrnBadgeText}>MRN: {patient.medicalRecordNo}</Text>
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.actionIconButton}
                      onPress={() => navigation.navigate('PatientDetail', { id: patient.id })}
                    >
                      <Text style={{ fontSize: 16 }}>👁️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionIconButton}
                      onPress={() => navigation.navigate('PatientForm', { id: patient.id })}
                    >
                      <Text style={{ fontSize: 16 }}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionIconButton}
                      onPress={() => handleDelete(patient.id, patient.name)}
                    >
                      <Text style={{ fontSize: 16 }}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Details Grid */}
                <View style={styles.cardDetailGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Usia / Gender</Text>
                    <Text style={styles.detailVal}>
                      {calculateAge(patient.dateOfBirth)} thn • {patient.gender === 'MALE' ? 'Laki-Laki' : 'Perempuan'}
                    </Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>No. Telepon / WA</Text>
                    <Text style={styles.detailVal}>{patient.phone || '-'}</Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Tgl Terdaftar</Text>
                    <Text style={styles.detailVal}>{formatDate(patient.createdAt)}</Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Total Kunjungan</Text>
                    <View style={styles.visitBadge}>
                      <Text style={styles.visitBadgeText}>{patient._count?.visits || 0} visit</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <View style={styles.paginationBar}>
            <TouchableOpacity
              style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
              disabled={currentPage === 1}
              onPress={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            >
              <Text style={styles.pageBtnText}>← Prev</Text>
            </TouchableOpacity>

            <Text style={styles.pageIndicatorText}>
              Halaman {currentPage} dari {totalPages}
            </Text>

            <TouchableOpacity
              style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]}
              disabled={currentPage === totalPages}
              onPress={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            >
              <Text style={styles.pageBtnText}>Next →</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    paddingVertical: 4,
  },
  backBtnText: {
    fontSize: 13,
    color: COLORS.primary600,
    fontWeight: '800',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  addBtn: {
    backgroundColor: COLORS.primary600,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADII.md,
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  scrollView: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  searchBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  searchSubmitBtn: {
    backgroundColor: COLORS.primary600,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSubmitBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  filterChipRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary50,
    borderColor: COLORS.primary600,
  },
  filterChipText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: COLORS.primary600,
    fontWeight: '800',
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  emptyBox: {
    paddingVertical: 50,
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  patientListContainer: {
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 6,
    marginBottom: 20,
  },
  patientCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADII.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingBottom: 10,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  mrnBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary50,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADII.sm,
    marginTop: 4,
  },
  mrnBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary600,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 6,
  },
  actionIconButton: {
    padding: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: RADII.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardDetailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    rowGap: 8,
  },
  detailItem: {
    width: '50%',
  },
  detailLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  visitBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADII.pill,
    marginTop: 2,
  },
  visitBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  paginationBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  pageBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pageBtnDisabled: {
    opacity: 0.4,
  },
  pageBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  pageIndicatorText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
});
