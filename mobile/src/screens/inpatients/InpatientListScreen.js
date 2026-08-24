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
  Modal,
  Platform,
} from 'react-native';
import { COLORS, RADII, SHADOWS } from '../../constants/theme';
import { inpatientService } from '../../services/api';

export const InpatientListScreen = ({ route, navigation }) => {
  const [inpatients, setInpatients] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ACTIVE'); // 'ACTIVE' | 'DISCHARGED'

  // Check-Out Modal States
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [selectedInpatient, setSelectedInpatient] = useState(null);
  const [dischargeNotes, setDischargeNotes] = useState('');
  const [dischargeCondition, setDischargeCondition] = useState('HEALED');
  const [submittingCheckout, setSubmittingCheckout] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    if (route.params?.refresh) {
      fetchData();
    }
  }, [route.params?.refresh]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'ACTIVE') {
        const res = await inpatientService.getInpatients({ limit: 100 });
        if (res?.data?.inpatients) setInpatients(res.data.inpatients);
        else if (Array.isArray(res?.data)) setInpatients(res.data);
        else if (Array.isArray(res)) setInpatients(res);
      } else {
        const res = await inpatientService.getHistory({ limit: 100 });
        if (res?.data?.history) setHistoryList(res.data.history);
        else if (res?.data?.inpatients) setHistoryList(res.data.inpatients);
        else if (Array.isArray(res?.data)) setHistoryList(res.data);
        else if (Array.isArray(res)) setHistoryList(res);
      }
    } catch (err) {
      console.log('Error fetching inpatients:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const openCheckoutModal = (inpItem, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setSelectedInpatient(inpItem);
    setDischargeNotes('');
    setDischargeCondition('HEALED');
    setIsCheckoutModalOpen(true);
  };

  const handleCheckOutSubmit = async () => {
    if (!selectedInpatient) return;

    try {
      setSubmittingCheckout(true);
      const payload = {
        dischargeCondition,
        notes: dischargeNotes.trim() || 'Pasien selesai menjalani masa perawatan rawat inap.',
      };

      await inpatientService.checkOut(selectedInpatient.id, payload);
      const msg = '✅ Prosedur Check-Out berhasil! Kamar telah dikosongkan dan tagihan kamar telah diterbitkan.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
      else Alert.alert('Berhasil', msg);

      setIsCheckoutModalOpen(false);
      setSelectedInpatient(null);
      fetchData();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Gagal melakukan check-out pasien.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(`❌ ${errorMsg}`);
      else Alert.alert('Error', errorMsg);
    } finally {
      setSubmittingCheckout(false);
    }
  };

  const currentList = activeTab === 'ACTIVE' ? inpatients : historyList;

  const filteredInpatients = currentList.filter((item) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const pName = (item.patient?.name || '').toLowerCase();
    const mrn = (item.patient?.medicalRecordNo || '').toLowerCase();
    const regNo = (item.registrationNo || '').toLowerCase();
    const roomNo = (item.room?.roomNumber || '').toLowerCase();
    const dName = (item.doctor?.name || '').toLowerCase();
    return pName.includes(query) || mrn.includes(query) || regNo.includes(query) || roomNo.includes(query) || dName.includes(query);
  });

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

  const calculateDays = (checkIn, checkOut) => {
    const start = new Date(checkIn);
    const end = checkOut ? new Date(checkOut) : new Date();
    const diffTime = Math.abs(end - start);
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return days === 0 ? 1 : days;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary700} />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Okupansi Rawat Inap</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('InpatientCheckIn')}>
          <Text style={styles.addBtnText}>+ Check-In</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama pasien, No.RM, No.Reg, kamar, atau DPJP..."
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

        {/* Tab Selection */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'ACTIVE' && styles.tabBtnActive]}
            onPress={() => setActiveTab('ACTIVE')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'ACTIVE' && styles.tabBtnTextActive]}>
              🏥 Pasien Dirawat ({inpatients.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'DISCHARGED' && styles.tabBtnActive]}
            onPress={() => setActiveTab('DISCHARGED')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'DISCHARGED' && styles.tabBtnTextActive]}>
              📋 Riwayat Pulang
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Memuat okupansi bangsal rawat inap...</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />}
            contentContainerStyle={styles.scrollContent}
          >
            {filteredInpatients.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={{ fontSize: 40, marginBottom: 8 }}>🏥</Text>
                <Text style={styles.emptyTitle}>Data Rawat Inap Tidak Ditemukan</Text>
                <Text style={styles.emptySub}>
                  {searchQuery
                    ? `Tidak ada pasien yang cocok dengan "${searchQuery}".`
                    : activeTab === 'ACTIVE'
                    ? 'Belum ada pasien yang sedang dirawat inap di bangsal.'
                    : 'Belum ada riwayat pasien pulang.'}
                </Text>
              </View>
            ) : (
              filteredInpatients.map((item, idx) => {
                const daysInHospital = calculateDays(item.checkInDate, item.checkOutDate);
                const isDischarged = item.status === 'DISCHARGED' || activeTab === 'DISCHARGED';

                return (
                  <TouchableOpacity
                    key={item.id || idx}
                    style={styles.inpCard}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('InpatientDetail', { inpatientId: item.id, inpatientData: item })}
                  >
                    {/* Top Row: Patient Name & Reg Badge */}
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.patientName}>{item.patient?.name || 'Pasien Rawat Inap'}</Text>
                        <Text style={styles.patientRmText}>
                          No.RM: <Text style={{ fontWeight: '700', color: COLORS.primary }}>{item.patient?.medicalRecordNo || '-'}</Text> • Reg: {item.registrationNo || `REG-${item.id}`}
                        </Text>
                      </View>

                      <View style={[styles.statusBadge, isDischarged ? styles.dischargedBadge : styles.activeBadge]}>
                        <Text style={[styles.statusBadgeText, isDischarged ? styles.dischargedBadgeText : styles.activeBadgeText]}>
                          {isDischarged ? 'PULANG' : 'DIRAWAT'}
                        </Text>
                      </View>
                    </View>

                    {/* Room & Doctor Banner */}
                    <View style={styles.roomBanner}>
                      <View style={styles.roomCol}>
                        <Text style={styles.roomBannerLabel}>Kamar Perawatan:</Text>
                        <Text style={styles.roomBannerVal}>
                          🛏️ {item.room?.roomNumber || 'Kamar'} ({item.room?.roomType || 'VIP'})
                        </Text>
                      </View>

                      <View style={styles.daysCol}>
                        <Text style={styles.roomBannerLabel}>Lama Rawat:</Text>
                        <View style={styles.daysPill}>
                          <Text style={styles.daysPillText}>⏱️ {daysInHospital} Hari</Text>
                        </View>
                      </View>
                    </View>

                    {/* Attending Doctor & Admission Date */}
                    <View style={styles.infoMetaRow}>
                      <Text style={styles.infoMetaText}>👨‍⚕️ DPJP: {item.doctor?.name || 'Dokter Spesialis'}</Text>
                      <Text style={styles.infoMetaText}>📅 Check-In: {formatDate(item.checkInDate)}</Text>
                    </View>

                    {item.initialDiagnosis ? (
                      <Text style={styles.diagText} numberOfLines={1}>
                        🩺 Diagnosis Masuk: {item.initialDiagnosis}
                      </Text>
                    ) : null}

                    {/* Card Actions */}
                    <View style={styles.cardFooter}>
                      <Text style={styles.detailLinkText}>Lihat Detail Perawatan →</Text>

                      {!isDischarged ? (
                        <TouchableOpacity
                          style={styles.checkoutBtn}
                          onPress={(e) => openCheckoutModal(item, e)}
                        >
                          <Text style={styles.checkoutBtnText}>🚗 Check-Out (Pulang)</Text>
                        </TouchableOpacity>
                      ) : (
                        <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600' }}>
                          Selesai: {formatDate(item.checkOutDate)}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        )}
      </View>

      {/* Modal Check-Out Pasien */}
      <Modal visible={isCheckoutModalOpen} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🚗 Prosedur Check-Out Pasien</Text>
              <TouchableOpacity onPress={() => setIsCheckoutModalOpen(false)}>
                <Text style={{ fontSize: 18, color: '#64748B' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedInpatient ? (
              <View style={styles.modalPatientBanner}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>{selectedInpatient.patient?.name}</Text>
                <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                  Kamar: {selectedInpatient.room?.roomNumber} ({selectedInpatient.room?.roomType}) • No. RM: {selectedInpatient.patient?.medicalRecordNo}
                </Text>
              </View>
            ) : null}

            <Text style={styles.label}>Kondisi Saat Pulang *</Text>
            <View style={styles.condGrid}>
              {[
                { label: 'Sembuh (HEALED)', value: 'HEALED' },
                { label: 'Membaik (IMPROVED)', value: 'IMPROVED' },
                { label: 'Rujuk RS Lain (TRANSFERRED)', value: 'TRANSFERRED' },
                { label: 'Meninggal (EXPIRED)', value: 'EXPIRED' },
              ].map((c) => (
                <TouchableOpacity
                  key={c.value}
                  style={[styles.condChip, dischargeCondition === c.value && styles.condChipActive]}
                  onPress={() => setDischargeCondition(c.value)}
                >
                  <Text style={[styles.condChipText, dischargeCondition === c.value && styles.condChipTextActive]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Catatan & Instruksi Pemulangan</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Catatan dokter, obat pulang yang dibawakan, dan instruksi kontrol..."
              multiline
              numberOfLines={3}
              value={dischargeNotes}
              onChangeText={setDischargeNotes}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsCheckoutModalOpen(false)}>
                <Text style={styles.modalCancelBtnText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleCheckOutSubmit} disabled={submittingCheckout}>
                {submittingCheckout ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.modalSaveBtnText}>Proses Pulang & Billing</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  tabBtnTextActive: {
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
  inpCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADII.lg,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  patientRmText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADII.sm,
  },
  activeBadge: {
    backgroundColor: '#DCFCE7',
  },
  dischargedBadge: {
    backgroundColor: '#F1F5F9',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  activeBadgeText: {
    color: '#15803D',
  },
  dischargedBadgeText: {
    color: '#64748B',
  },
  roomBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: RADII.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  roomCol: {
    justifyContent: 'center',
  },
  daysCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  roomBannerLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 2,
  },
  roomBannerVal: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  daysPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADII.sm,
  },
  daysPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
  },
  infoMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  infoMetaText: {
    fontSize: 11,
    color: '#475569',
  },
  diagText: {
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
  checkoutBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADII.sm,
  },
  checkoutBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADII.xl,
    padding: 20,
    ...SHADOWS.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalPatientBanner: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: RADII.md,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 6,
  },
  condGrid: {
    gap: 6,
    marginBottom: 10,
  },
  condChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADII.sm,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  condChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  condChipText: {
    fontSize: 12,
    color: '#475569',
  },
  condChipTextActive: {
    fontWeight: '800',
    color: '#2563EB',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: RADII.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 8,
  },
  textArea: {
    minHeight: 65,
    textAlignVertical: 'top',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: RADII.md,
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  modalSaveBtn: {
    flex: 2,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderRadius: RADII.md,
  },
  modalSaveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
