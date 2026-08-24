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
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { COLORS, RADII, SHADOWS } from '../../constants/theme';
import { inpatientService } from '../../services/api';

export const InpatientDetailScreen = ({ route, navigation }) => {
  const { inpatientId, inpatientData } = route.params || {};
  const [inp, setInp] = useState(inpatientData || null);
  const [loading, setLoading] = useState(!inpatientData);

  // Check-out modal
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [dischargeNotes, setDischargeNotes] = useState('');
  const [dischargeCondition, setDischargeCondition] = useState('HEALED');
  const [submittingCheckout, setSubmittingCheckout] = useState(false);

  useEffect(() => {
    if (inpatientId) {
      fetchDetail();
    }
  }, [inpatientId]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await inpatientService.getInpatientById(inpatientId);
      if (res?.data) {
        setInp(res.data.inpatient || res.data);
      }
    } catch (err) {
      console.log('Error fetching inpatient detail:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOutSubmit = async () => {
    try {
      setSubmittingCheckout(true);
      const payload = {
        dischargeCondition,
        notes: dischargeNotes.trim() || 'Pasien selesai menjalani masa perawatan rawat inap.',
      };

      await inpatientService.checkOut(inp.id, payload);
      const msg = '✅ Prosedur Check-Out berhasil! Kamar telah dikosongkan dan tagihan kamar telah diterbitkan.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
      else Alert.alert('Berhasil', msg);

      setIsCheckoutModalOpen(false);
      navigation.navigate('Inpatients', { refresh: true });
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Gagal melakukan check-out pasien.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(`❌ ${errorMsg}`);
      else Alert.alert('Error', errorMsg);
    } finally {
      setSubmittingCheckout(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
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

  const formatRupiah = (number) => {
    if (!number && number !== 0) return 'Rp 0';
    return `Rp ${Number(number).toLocaleString('id-ID')}`;
  };

  if (loading || !inp) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Memuat detail rawat inap pasien...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const daysInHospital = calculateDays(inp.checkInDate, inp.checkOutDate);
  const pricePerDay = inp.room?.pricePerDay || 0;
  const estimatedCost = daysInHospital * pricePerDay;
  const isDischarged = inp.status === 'DISCHARGED';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Rawat Inap</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Rawat Inap Pasien</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Patient Banner */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerTop}>
            <View style={styles.iconBox}>
              <Text style={{ fontSize: 32 }}>🏥</Text>
            </View>

            <View style={[styles.statusBadge, isDischarged ? styles.dischargedBadge : styles.activeBadge]}>
              <Text style={[styles.statusBadgeText, isDischarged ? styles.dischargedBadgeText : styles.activeBadgeText]}>
                ● {isDischarged ? 'PULANG' : 'DIRAWAT INAP'}
              </Text>
            </View>
          </View>

          <Text style={styles.patientName}>{inp.patient?.name || 'Pasien'}</Text>
          <Text style={styles.regNoText}>No. Reg: {inp.registrationNo || `REG-${inp.id}`} • No. RM: {inp.patient?.medicalRecordNo || '-'}</Text>

          <View style={styles.metaGrid}>
            <View style={styles.gridBox}>
              <Text style={styles.gridLabel}>Lama Rawat (LOS):</Text>
              <Text style={styles.losVal}>⏱️ {daysInHospital} Hari</Text>
            </View>

            <View style={styles.gridBoxRight}>
              <Text style={styles.gridLabel}>Estimasi Biaya Kamar:</Text>
              <Text style={styles.priceVal}>{formatRupiah(estimatedCost)}</Text>
            </View>
          </View>
        </View>

        {/* Section 1: Detail Kamar & Bangsal */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={{ fontSize: 18, marginRight: 6 }}>🛏️</Text>
            <Text style={styles.cardTitle}>Kamar & Fasilitas Perawatan</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nomor Kamar:</Text>
            <Text style={styles.infoVal}>{inp.room?.roomNumber || '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tipe Kelas Kamar:</Text>
            <Text style={styles.infoVal}>{inp.room?.roomType || 'VIP'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Gedung & Lantai:</Text>
            <Text style={styles.infoVal}>{inp.room?.building || 'Gedung Utama'} Lt.{inp.room?.floor || 1}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tarif Kamar Per Hari:</Text>
            <Text style={styles.infoVal}>{formatRupiah(pricePerDay)}</Text>
          </View>
        </View>

        {/* Section 2: Dokter DPJP & Waktu Check-In */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={{ fontSize: 18, marginRight: 6 }}>👨‍⚕️</Text>
            <Text style={styles.cardTitle}>Dokter DPJP & Waktu Masuk</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Dokter Penanggung Jawab:</Text>
            <Text style={styles.infoVal}>{inp.doctor?.name || 'Dokter Spesialis'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Spesialisasi / Poli:</Text>
            <Text style={styles.infoVal}>{inp.doctor?.department || 'Spesialis Penyakit Dalam'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Waktu Check-In (Masuk):</Text>
            <Text style={styles.infoVal}>{formatDate(inp.checkInDate)}</Text>
          </View>

          {isDischarged ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Waktu Check-Out (Pulang):</Text>
              <Text style={styles.infoVal}>{formatDate(inp.checkOutDate)}</Text>
            </View>
          ) : null}
        </View>

        {/* Section 3: Diagnosis & Catatan Klinik */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={{ fontSize: 18, marginRight: 6 }}>🩺</Text>
            <Text style={styles.cardTitle}>Diagnosis Masuk & Catatan Klinik</Text>
          </View>
          <Text style={styles.bodyText}>{inp.initialDiagnosis || 'Pasien masuk rawat inap untuk observasi dan perawatan intensif.'}</Text>
        </View>

        {/* Action Button */}
        {!isDischarged ? (
          <TouchableOpacity
            style={styles.checkoutBigBtn}
            onPress={() => setIsCheckoutModalOpen(true)}
          >
            <Text style={styles.checkoutBigBtnText}>🚗 Proses Check-Out & Billing Pulang</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

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

            <View style={styles.modalPatientBanner}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>{inp.patient?.name}</Text>
              <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                Kamar: {inp.room?.roomNumber} ({inp.room?.roomType}) • Total Biaya Kamar: {formatRupiah(estimatedCost)} ({daysInHospital} Hari)
              </Text>
            </View>

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
  patientName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  regNoText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
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
  losVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563EB',
  },
  priceVal: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.primary,
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
  bodyText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
  },
  checkoutBigBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: RADII.md,
    alignItems: 'center',
    marginTop: 8,
    ...SHADOWS.md,
  },
  checkoutBigBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
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
