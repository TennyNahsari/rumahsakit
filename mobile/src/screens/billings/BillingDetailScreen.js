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
  Alert,
  Platform,
} from 'react-native';
import { COLORS, RADII, SHADOWS } from '../../constants/theme';
import { billingService } from '../../services/api';

const statusConfig = {
  PAID: { label: 'LUNAS', bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' },
  UNPAID: { label: 'BELUM BAYAR', bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' },
  PARTIAL: { label: 'LUNAS SEBAGIAN', bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD' },
  CANCELLED: { label: 'DIBATALKAN', bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5' },
};

export const BillingDetailScreen = ({ route, navigation }) => {
  const { billingId, billingData } = route.params || {};
  const [bItem, setBItem] = useState(billingData || null);
  const [loading, setLoading] = useState(!billingData);

  // Pay Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [processingPay, setProcessingPay] = useState(false);

  useEffect(() => {
    if (billingId) {
      fetchDetail();
    }
  }, [billingId]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await billingService.getBillingById(billingId);
      if (res?.data) {
        setBItem(res.data.billing || res.data);
      }
    } catch (err) {
      console.log('Error fetching billing detail:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaySubmit = async () => {
    try {
      setProcessingPay(true);
      await billingService.processPayment(bItem.id, {
        status: 'PAID',
        paymentMethod: paymentMethod,
      });

      const msg = `✅ Pembayaran invoice ${bItem.invoiceNo || 'Tagihan'} berhasil diproses via ${paymentMethod}!`;
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
      else Alert.alert('Berhasil', msg);

      setIsPayModalOpen(false);
      fetchDetail();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Gagal memproses pelunasan kasir.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(`❌ ${errorMsg}`);
      else Alert.alert('Error', errorMsg);
    } finally {
      setProcessingPay(false);
    }
  };

  const handleDelete = () => {
    const doDelete = async () => {
      try {
        await billingService.deleteBilling(bItem.id);
        if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert('✅ Invoice tagihan berhasil dihapus!');
        else Alert.alert('Berhasil', 'Invoice tagihan berhasil dihapus!');
        navigation.navigate('Billings', { refresh: true });
      } catch (err) {
        const msg = err.response?.data?.error || 'Gagal menghapus tagihan.';
        if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(`❌ ${msg}`);
        else Alert.alert('Error', msg);
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Hapus invoice "${bItem?.invoiceNo}"?`)) {
        doDelete();
      }
    } else {
      Alert.alert('Konfirmasi Hapus', `Hapus invoice "${bItem?.invoiceNo}"?`, [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const formatRupiah = (number) => {
    if (!number && number !== 0) return 'Rp 0';
    return `Rp ${Number(number).toLocaleString('id-ID')}`;
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

  if (loading || !bItem) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Memuat detail invoice rincian billing...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const st = statusConfig[bItem.status] || statusConfig.UNPAID;
  const isPaid = bItem.status === 'PAID';

  // Fee breakdown items
  const regFee = Number(bItem.registrationFee) || 50000;
  const docFee = Number(bItem.doctorFee) || 150000;
  const medFee = Number(bItem.medicineFee) || 0;
  const roomFee = Number(bItem.roomFee) || 0;
  const actionFee = Number(bItem.actionFee) || 0;
  const discount = Number(bItem.discount) || 0;
  const totalAmount = Number(bItem.totalAmount) || (regFee + docFee + medFee + roomFee + actionFee - discount);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Kasir</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Invoice Kasir</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Invoice Banner */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerTop}>
            <View style={styles.iconBox}>
              <Text style={{ fontSize: 32 }}>🧾</Text>
            </View>

            <View style={[styles.statusBadge, { backgroundColor: st.bg, borderColor: st.border }]}>
              <Text style={[styles.statusBadgeText, { color: st.text }]}>● {st.label}</Text>
            </View>
          </View>

          <Text style={styles.invNoText}>{bItem.invoiceNo || `INV-${bItem.id}`}</Text>
          <Text style={styles.patientName}>{bItem.patient?.name || 'Pasien Umum'}</Text>
          <Text style={styles.patientRm}>No. RM: {bItem.patient?.medicalRecordNo || '-'} • Telepon: {bItem.patient?.phone || '-'}</Text>

          <View style={styles.metaGrid}>
            <View style={styles.gridBox}>
              <Text style={styles.gridLabel}>Metode Bayar:</Text>
              <Text style={styles.methodVal}>💳 {bItem.paymentMethod || 'CASH'}</Text>
            </View>

            <View style={styles.gridBoxRight}>
              <Text style={styles.gridLabel}>Total Harus Dibayar:</Text>
              <Text style={styles.totalVal}>{formatRupiah(totalAmount)}</Text>
            </View>
          </View>
        </View>

        {/* Breakdown Items Table */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={{ fontSize: 18, marginRight: 6 }}>📋</Text>
            <Text style={styles.cardTitle}>Rincian Biaya Transaksi</Text>
          </View>

          <View style={styles.breakdownList}>
            <View style={styles.breakdownRow}>
              <Text style={styles.itemLabel}>1. Biaya Administrasi & Pendaftaran</Text>
              <Text style={styles.itemVal}>{formatRupiah(regFee)}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.itemLabel}>2. Jasa Konsultasi Dokter Spesialis</Text>
              <Text style={styles.itemVal}>{formatRupiah(docFee)}</Text>
            </View>
            {medFee > 0 ? (
              <View style={styles.breakdownRow}>
                <Text style={styles.itemLabel}>3. Resep & Obat Farmasi</Text>
                <Text style={styles.itemVal}>{formatRupiah(medFee)}</Text>
              </View>
            ) : null}
            {roomFee > 0 ? (
              <View style={styles.breakdownRow}>
                <Text style={styles.itemLabel}>4. Akumulasi Biaya Kamar Rawat Inap</Text>
                <Text style={styles.itemVal}>{formatRupiah(roomFee)}</Text>
              </View>
            ) : null}
            {actionFee > 0 ? (
              <View style={styles.breakdownRow}>
                <Text style={styles.itemLabel}>5. Tindakan Medis & Laboratorium</Text>
                <Text style={styles.itemVal}>{formatRupiah(actionFee)}</Text>
              </View>
            ) : null}
            {discount > 0 ? (
              <View style={styles.breakdownRow}>
                <Text style={[styles.itemLabel, { color: '#16A34A' }]}>6. Potongan / Subsidi BPJS</Text>
                <Text style={[styles.itemVal, { color: '#16A34A' }]}>-{formatRupiah(discount)}</Text>
              </View>
            ) : null}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabelText}>GRAND TOTAL</Text>
              <Text style={styles.totalValText}>{formatRupiah(totalAmount)}</Text>
            </View>
          </View>
        </View>

        {/* Section Metadata */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={{ fontSize: 18, marginRight: 6 }}>ℹ️</Text>
            <Text style={styles.cardTitle}>Informasi Transaksi Kasir</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Waktu Penerbitan:</Text>
            <Text style={styles.infoVal}>{formatDate(bItem.createdAt)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status Pembayaran:</Text>
            <Text style={[styles.infoVal, { color: st.text, fontWeight: '900' }]}>{st.label}</Text>
          </View>
          {bItem.notes ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Catatan Kasir:</Text>
              <Text style={styles.infoVal}>{bItem.notes}</Text>
            </View>
          ) : null}
        </View>

        {/* Action Row */}
        <View style={styles.actionRow}>
          {!isPaid ? (
            <TouchableOpacity style={styles.payBigBtn} onPress={() => setIsPayModalOpen(true)}>
              <Text style={styles.payBigBtnText}>💳 Pelunasan Kasir</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteBtnText}>🗑️ Hapus Tagihan</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal Pelunasan Kasir */}
      <Modal visible={isPayModalOpen} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>💳 Pelunasan Tagihan Kasir</Text>
              <TouchableOpacity onPress={() => setIsPayModalOpen(false)}>
                <Text style={{ fontSize: 18, color: '#64748B' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalPatientBanner}>
              <Text style={{ fontSize: 13, color: '#64748B' }}>{bItem.invoiceNo}</Text>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#0F172A', marginTop: 2 }}>{bItem.patient?.name}</Text>
              <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.primary, marginTop: 4 }}>
                Total: {formatRupiah(totalAmount)}
              </Text>
            </View>

            <Text style={styles.label}>Pilih Metode Pembayaran *</Text>
            <View style={styles.payMethodGrid}>
              {[
                { label: '💵 Tunai / Cash', value: 'CASH' },
                { label: '💳 Kartu Debit (EDC)', value: 'DEBIT_CARD' },
                { label: '💳 Kartu Kredit', value: 'CREDIT_CARD' },
                { label: '🏦 Transfer Bank / QRIS', value: 'BANK_TRANSFER' },
                { label: '🛡️ BPJS Kesehatan', value: 'BPJS' },
                { label: '🏥 Asuransi Swasta', value: 'INSURANCE' },
              ].map((pm) => (
                <TouchableOpacity
                  key={pm.value}
                  style={[styles.payMethodChip, paymentMethod === pm.value && styles.payMethodChipActive]}
                  onPress={() => setPaymentMethod(pm.value)}
                >
                  <Text style={[styles.payMethodChipText, paymentMethod === pm.value && styles.payMethodChipTextActive]}>
                    {pm.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsPayModalOpen(false)}>
                <Text style={styles.modalCancelBtnText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalSaveBtn} onPress={handlePaySubmit} disabled={processingPay}>
                {processingPay ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalSaveBtnText}>Proses Pelunasan</Text>}
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
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  invNoText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  patientName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  patientRm: {
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
  methodVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563EB',
  },
  totalVal: {
    fontSize: 16,
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
  breakdownList: {
    gap: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  itemLabel: {
    fontSize: 12,
    color: '#334155',
  },
  itemVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 6,
    borderTopWidth: 2,
    borderTopColor: '#E2E8F0',
  },
  totalLabelText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  totalValText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
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
    gap: 10,
    marginTop: 8,
  },
  payBigBtn: {
    flex: 2,
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: RADII.md,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  payBigBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
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
    padding: 12,
    borderRadius: RADII.md,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 4,
  },
  payMethodGrid: {
    gap: 6,
    marginBottom: 12,
  },
  payMethodChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADII.sm,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  payMethodChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  payMethodChipText: {
    fontSize: 12,
    color: '#475569',
  },
  payMethodChipTextActive: {
    fontWeight: '800',
    color: '#2563EB',
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
    backgroundColor: '#16A34A',
    borderRadius: RADII.md,
  },
  modalSaveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
