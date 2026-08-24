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
import { visitService } from '../../services/api';

export const VisitListScreen = ({ navigation }) => {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, SCHEDULED, ONLINE_WEBSITE, EMERGENCY, CALLED, IN_PROGRESS, COMPLETED
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchVisits(currentPage);
  }, [currentPage]);

  const fetchVisits = async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: 50 };
      const res = await visitService.getVisits(params);
      if (res?.data) {
        setVisits(res.data.visits || []);
        setTotalPages(res.data.pagination?.pages || 1);
      }
    } catch (err) {
      console.log('Fetch visits error:', err.message);
      Alert.alert('Gagal Memuat Data', 'Gagal mengambil daftar kunjungan dari server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchVisits(currentPage);
  };

  // Operasional Queue Actions
  const handleCall = async (visit) => {
    try {
      await visitService.callVisit(visit.id);
      Alert.alert('🔊 Antrean Dipanggil', `Nomor ${visit.queueNumberFormatted || visit.queueNumber || 'Antrean'} (${visit.patient?.name}) sedang dipanggil.`);
      fetchVisits(currentPage);
    } catch (err) {
      Alert.alert('Gagal', err.response?.data?.error || 'Gagal memanggil antrean.');
    }
  };

  const handleStart = async (visit) => {
    try {
      await visitService.startVisit(visit.id);
      Alert.alert('🩺 Pemeriksaan Dimulai', `Pasien ${visit.patient?.name} sedang diperiksa.`);
      fetchVisits(currentPage);
    } catch (err) {
      Alert.alert('Gagal', err.response?.data?.error || 'Gagal memulai pemeriksaan.');
    }
  };

  const handleComplete = async (visit) => {
    try {
      await visitService.completeVisit(visit.id);
      Alert.alert('✅ Kunjungan Selesai', `Pemeriksaan untuk ${visit.patient?.name} telah selesai.`);
      fetchVisits(currentPage);
    } catch (err) {
      Alert.alert('Gagal', err.response?.data?.error || 'Gagal menyelesaikan kunjungan.');
    }
  };

  const handleSkip = async (visit) => {
    try {
      await visitService.skipVisit(visit.id);
      Alert.alert('⏩ Antrean Dilewati', `Nomor ${visit.queueNumberFormatted || visit.queueNumber} dilewati.`);
      fetchVisits(currentPage);
    } catch (err) {
      Alert.alert('Gagal', err.response?.data?.error || 'Gagal melewati antrean.');
    }
  };

  const handleDelete = (id, queueNo) => {
    const confirmDelete = async () => {
      try {
        await visitService.deleteVisit(id);
        Alert.alert('Sukses', `Kunjungan ${queueNo} berhasil dihapus.`);
        fetchVisits(currentPage);
      } catch (err) {
        Alert.alert('Gagal Hapus', err.response?.data?.error || 'Gagal menghapus kunjungan.');
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Hapus kunjungan ${queueNo}?`)) {
        confirmDelete();
      }
    } else {
      Alert.alert('Konfirmasi Hapus', `Apakah Anda yakin ingin menghapus kunjungan ${queueNo}?`, [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: confirmDelete },
      ]);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filter Visits
  const filteredVisits = visits.filter((v) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (v.patient?.name || '').toLowerCase().includes(q) ||
      (v.patient?.medicalRecordNo || '').toLowerCase().includes(q) ||
      (v.doctor?.name || '').toLowerCase().includes(q) ||
      (v.queueNumberFormatted || v.queueNumber || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (activeTab === 'SCHEDULED') return v.status === 'SCHEDULED';
    if (activeTab === 'ONLINE_WEBSITE') return v.channel === 'ONLINE_WEBSITE';
    if (activeTab === 'EMERGENCY') return v.visitType === 'EMERGENCY';
    if (activeTab === 'CALLED') return v.status === 'CALLED';
    if (activeTab === 'IN_PROGRESS') return v.status === 'IN_PROGRESS';
    if (activeTab === 'COMPLETED') return v.status === 'COMPLETED';

    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Jadwal Visit & Antrean</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('VisitForm', { id: null })}
        >
          <Text style={styles.addBtnText}>+ Baru</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary600]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBox}>
            <TextInput
              style={styles.searchInput}
              placeholder="Cari Pasien, Dokter, atau Antrean (e.g. A-1, WEB-1)..."
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>

          {/* Queue Filter Tabs Scroll */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
            {[
              { id: 'ALL', label: `Semua (${visits.length})` },
              { id: 'SCHEDULED', label: `Menunggu (${visits.filter(v => v.status === 'SCHEDULED').length})` },
              { id: 'ONLINE_WEBSITE', label: `🌐 Web Pasien (${visits.filter(v => v.channel === 'ONLINE_WEBSITE').length})` },
              { id: 'EMERGENCY', label: `🚨 IGD (${visits.filter(v => v.visitType === 'EMERGENCY').length})` },
              { id: 'CALLED', label: `🔊 Dipanggil (${visits.filter(v => v.status === 'CALLED').length})` },
              { id: 'IN_PROGRESS', label: `🩺 Diperiksa (${visits.filter(v => v.status === 'IN_PROGRESS').length})` },
              { id: 'COMPLETED', label: `✅ Selesai (${visits.filter(v => v.status === 'COMPLETED').length})` },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabChip, activeTab === tab.id && styles.tabChipActive]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text style={[styles.tabChipText, activeTab === tab.id && styles.tabChipTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Visit Cards List */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary600} />
            <Text style={styles.loadingText}>Memuat antrean kunjungan...</Text>
          </View>
        ) : filteredVisits.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>📅</Text>
            <Text style={styles.emptyTitle}>Data Kunjungan Tidak Ditemukan</Text>
            <Text style={styles.emptySub}>Tidak ada antrean yang sesuai dengan kata kunci atau filter tab.</Text>
          </View>
        ) : (
          <View style={styles.visitListContainer}>
            {filteredVisits.map((visit) => {
              const queueNo = visit.queueNumberFormatted || visit.queueNumber || 'A-1';
              const isWeb = visit.channel === 'ONLINE_WEBSITE';
              const visitTypeMap = {
                GENERAL_CHECKUP: { label: 'Pemeriksaan Umum', bg: '#EFF6FF', color: '#1D4ED8' },
                OUTPATIENT: { label: 'Rawat Jalan', bg: '#E0F2FE', color: '#0284C7' },
                INPATIENT: { label: 'Rawat Inap', bg: '#ECFDF5', color: '#059669' },
                EMERGENCY: { label: 'IGD / Darurat', bg: '#FEF2F2', color: '#DC2626' },
                MEDICAL_ACTION: { label: 'Tindakan Medis', bg: '#FAF5FF', color: '#7E22CE' },
              };
              const typeConfig = visitTypeMap[visit.visitType] || { label: visit.visitType || 'Visit', bg: '#F1F5F9', color: '#475569' };

              return (
                <View key={visit.id} style={styles.visitCard}>
                  {/* Top Bar Card */}
                  <View style={styles.cardTopBar}>
                    <View style={styles.queueBadge}>
                      <Text style={styles.queueBadgeText}>{queueNo}</Text>
                    </View>
                    <View style={[styles.channelBadge, isWeb ? styles.channelBadgeWeb : styles.channelBadgeLoket]}>
                      <Text style={[styles.channelBadgeText, isWeb ? styles.channelBadgeTextWeb : styles.channelBadgeTextLoket]}>
                        {isWeb ? '🌐 WEB PASIEN' : '🏬 LOKET ADMISI'}
                      </Text>
                    </View>
                  </View>

                  {/* Patient & Doctor Info */}
                  <TouchableOpacity
                    onPress={() => navigation.navigate('VisitDetail', { id: visit.id })}
                  >
                    <Text style={styles.patientName}>{visit.patient?.name || 'Pasien'}</Text>
                    <Text style={styles.mrnText}>RM: {visit.patient?.medicalRecordNo || '-'}</Text>

                    <Text style={styles.doctorText}>👨‍⚕️ {visit.doctor?.name || 'Dokter DPJP'}</Text>
                    <Text style={styles.scheduleTimeText}>⏰ {formatDate(visit.scheduledAt || visit.createdAt)}</Text>
                  </TouchableOpacity>

                  {/* Type & Status Row */}
                  <View style={styles.badgeRow}>
                    <View style={[styles.typePill, { backgroundColor: typeConfig.bg }]}>
                      <Text style={[styles.typePillText, { color: typeConfig.color }]}>{typeConfig.label}</Text>
                    </View>
                    <View style={styles.statusPill}>
                      <Text style={styles.statusPillText}>{visit.status}</Text>
                    </View>
                  </View>

                  {/* Operasional Queue Actions */}
                  <View style={styles.actionGrid}>
                    {(visit.status === 'SCHEDULED' || visit.status === 'CALLED') && (
                      <TouchableOpacity style={styles.callOpBtn} onPress={() => handleCall(visit)}>
                        <Text style={styles.opBtnText}>🔊 Panggil</Text>
                      </TouchableOpacity>
                    )}

                    {(visit.status === 'CALLED' || visit.status === 'SCHEDULED') && (
                      <TouchableOpacity style={styles.startOpBtn} onPress={() => handleStart(visit)}>
                        <Text style={styles.opBtnText}>🩺 Periksa</Text>
                      </TouchableOpacity>
                    )}

                    {(visit.status === 'IN_PROGRESS' || visit.status === 'CALLED') && (
                      <TouchableOpacity style={styles.completeOpBtn} onPress={() => handleComplete(visit)}>
                        <Text style={styles.opBtnText}>✅ Selesai</Text>
                      </TouchableOpacity>
                    )}

                    {visit.status === 'SCHEDULED' && (
                      <TouchableOpacity style={styles.skipOpBtn} onPress={() => handleSkip(visit)}>
                        <Text style={styles.opBtnText}>⏩ Lewati</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.editOpBtn}
                      onPress={() => navigation.navigate('VisitForm', { id: visit.id })}
                    >
                      <Text style={styles.opBtnText}>✏️ Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteOpBtn}
                      onPress={() => handleDelete(visit.id, queueNo)}
                    >
                      <Text style={styles.opBtnText}>🗑️ Hapus</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
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
    backgroundColor: '#FFFFFF',
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  searchInput: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  tabScroll: {
    marginTop: 10,
    flexDirection: 'row',
  },
  tabChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  tabChipActive: {
    backgroundColor: COLORS.primary600,
    borderColor: COLORS.primary600,
  },
  tabChipText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  tabChipTextActive: {
    color: '#FFFFFF',
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
  visitListContainer: {
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 6,
    marginBottom: 20,
  },
  visitCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADII.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  cardTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  queueBadge: {
    backgroundColor: COLORS.primary50,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.primary200,
  },
  queueBadgeText: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.primary600,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  channelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADII.sm,
    borderWidth: 1,
  },
  channelBadgeWeb: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  channelBadgeLoket: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  channelBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  channelBadgeTextWeb: {
    color: '#4338CA',
  },
  channelBadgeTextLoket: {
    color: '#475569',
  },
  patientName: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  mrnText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  doctorText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  scheduleTimeText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADII.pill,
  },
  typePillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusPill: {
    backgroundColor: COLORS.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADII.pill,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  callOpBtn: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  startOpBtn: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  completeOpBtn: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  skipOpBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  editOpBtn: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  deleteOpBtn: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  opBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textPrimary,
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
