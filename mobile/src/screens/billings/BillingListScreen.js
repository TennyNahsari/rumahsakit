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
import { billingService } from '../../services/api';

const statusConfig = {
  PAID: { label: 'LUNAS', bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' },
  UNPAID: { label: 'BELUM BAYAR', bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' },
  PARTIAL: { label: 'LUNAS SEBAGIAN', bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD' },
  CANCELLED: { label: 'DIBATALKAN', bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5' },
};

export const BillingListScreen = ({ route, navigation }) => {
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'UNPAID' | 'PAID' | 'CANCELLED'

  // Payment modal state
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [processingPay, setProcessingPay] = useState(false);

  useEffect(() => {
    fetchBillings();
  }, [statusFilter]);

  useEffect(() => {
    if (route.params?.refresh) {
      fetchBillings();
    }
  }, [route.params?.refresh]);

  const fetchBillings = async () => {
    try {
      setLoading(true);
      const res = await billingService.getBillings({ limit: 100 });
      let list = [];
      if (res?.data?.billings) list = res.data.billings;
      else if (res?.billings) list = res.billings;
      else if (Array.isArray(res?.data)) list = res.data;
      else if (Array.isArray(res)) list = res;

      const normalized = list.map((b) => ({
        ...b,
        totalAmount: b.totalAmount !== undefined ? b.totalAmount : (b.total !== undefined ? b.total : (b.subtotal || 0)),
        invoiceNo: b.invoiceNo || `INV-2026-${String(b.id).padStart(4, '0')}`,
        paymentMethod: b.paymentMethod || 'CASH',
      }));

      setBillings(normalized);
    } catch (err) {
      console.log('Error fetching billings:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBillings();
  };

  const openPayModal = (bItem, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setSelectedBilling(bItem);
    setPaymentMethod('CASH');
    setIsPayModalOpen(true);
  };

  const handlePaySubmit = async () => {
    if (!selectedBilling) return;

    try {
      setProcessingPay(true);
      await billingService.processPayment(selectedBilling.id, {
        status: 'PAID',
        paymentMethod: paymentMethod,
      });

      const msg = `✅ Pembayaran invoice ${selectedBilling.invoiceNo || 'Tagihan'} berhasil diproses via ${paymentMethod}!`;
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
      else Alert.alert('Berhasil', msg);

      setIsPayModalOpen(false);
      setSelectedBilling(null);
      fetchBillings();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Gagal memproses pelunasan kasir.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(`❌ ${errorMsg}`);
      else Alert.alert('Error', errorMsg);
    } finally {
      setProcessingPay(false);
    }
  };

  const handleDeleteBilling = (bItem, e) => {
    if (e && e.stopPropagation) e.stopPropagation();

    const doDelete = async () => {
      try {
        await billingService.deleteBilling(bItem.id);
        if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert('✅ Invoice tagihan berhasil dihapus!');
        else Alert.alert('Berhasil', 'Invoice tagihan berhasil dihapus!');
        fetchBillings();
      } catch (err) {
        const msg = err.response?.data?.error || 'Gagal menghapus tagihan.';
        if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(`❌ ${msg}`);
        else Alert.alert('Error', msg);
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Hapus invoice "${bItem.invoiceNo || bItem.id}"?`)) {
        doDelete();
      }
    } else {
      Alert.alert('Konfirmasi Hapus', `Hapus invoice "${bItem.invoiceNo || bItem.id}"?`, [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const filteredBillings = billings.filter((b) => {
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;

    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const inv = (b.invoiceNo || '').toLowerCase();
    const pName = (b.patient?.name || '').toLowerCase();
    const mrn = (b.patient?.medicalRecordNo || '').toLowerCase();
    const payMethod = (b.paymentMethod || '').toLowerCase();
    return inv.includes(query) || pName.includes(query) || mrn.includes(query) || payMethod.includes(query);
  });

  const totalRevenue = billings.filter((b) => b.status === 'PAID').reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
  const totalUnpaid = billings.filter((b) => b.status === 'UNPAID').reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

  const formatRupiah = (number) => {
    if (!number && number !== 0) return 'Rp 0';
    return `Rp ${Number(number).toLocaleString('id-ID')}`;
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
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary700} />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tagihan & Kasir (Billing)</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('BillingForm')}>
          <Text style={styles.addBtnText}>+ Tagihan</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Cari No. Invoice, nama pasien, No.RM, atau metode..."
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {[
            { label: 'Semua Tagihan', value: 'ALL' },
            { label: '🟡 Belum Lunas', value: 'UNPAID' },
            { label: '🟢 Lunas', value: 'PAID' },
            { label: '🔴 Dibatalkan', value: 'CANCELLED' },
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
            <Text style={styles.loadingText}>Memuat invoice & data transaksi kasir...</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Financial Summary Widget */}
            <View style={styles.finWidget}>
              <View style={styles.finWidgetCol}>
                <Text style={styles.finWidgetLabel}>Pendapatan Lunas Kasir</Text>
                <Text style={styles.finWidgetValGreen}>{formatRupiah(totalRevenue)}</Text>
              </View>
              <View style={styles.finDivider} />
              <View style={styles.finWidgetCol}>
                <Text style={styles.finWidgetLabel}>Piutang Belum Bayar</Text>
                <Text style={styles.finWidgetValRed}>{formatRupiah(totalUnpaid)}</Text>
              </View>
            </View>

            {filteredBillings.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={{ fontSize: 40, marginBottom: 8 }}>💳</Text>
                <Text style={styles.emptyTitle}>Invoice Tagihan Tidak Ditemukan</Text>
                <Text style={styles.emptySub}>
                  {searchQuery ? `Tidak ada tagihan yang cocok dengan "${searchQuery}".` : 'Belum ada data tagihan di sistem kasir.'}
                </Text>
              </View>
            ) : (
              filteredBillings.map((bItem, idx) => {
                const st = statusConfig[bItem.status] || statusConfig.UNPAID;
                const isPaid = bItem.status === 'PAID';

                return (
                  <TouchableOpacity
                    key={bItem.id || idx}
                    style={styles.billingCard}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('BillingDetail', { billingId: bItem.id, billingData: bItem })}
                  >
                    {/* Top Row: Invoice No & Status Badge */}
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.invNoText}>{bItem.invoiceNo || `INV-2026-00${bItem.id}`}</Text>
                        <Text style={styles.patientName}>{bItem.patient?.name || 'Pasien Umum'}</Text>
                        <Text style={styles.rmText}>No. RM: {bItem.patient?.medicalRecordNo || '-'}</Text>
                      </View>

                      <View style={[styles.statusBadge, { backgroundColor: st.bg, borderColor: st.border }]}>
                        <Text style={[styles.statusBadgeText, { color: st.text }]}>● {st.label}</Text>
                      </View>
                    </View>

                    {/* Total Amount & Payment Method Banner */}
                    <View style={styles.amountBanner}>
                      <View style={styles.amountCol}>
                        <Text style={styles.amountLabel}>Total Tagihan Invoice:</Text>
                        <Text style={styles.amountVal}>{formatRupiah(bItem.totalAmount)}</Text>
                      </View>

                      <View style={styles.methodCol}>
                        <Text style={styles.amountLabel}>Metode Bayar:</Text>
                        <View style={styles.methodPill}>
                          <Text style={styles.methodPillText}>💳 {bItem.paymentMethod || 'CASH'}</Text>
                        </View>
                      </View>
                    </View>

                    <Text style={styles.dateText}>📅 Tanggal Diterbitkan: {formatDate(bItem.createdAt)}</Text>

                    {/* Card Actions */}
                    <View style={styles.cardFooter}>
                      <Text style={styles.detailLinkText}>Lihat Detail Rincian →</Text>

                      <View style={styles.cardActionsGroup}>
                        {!isPaid ? (
                          <TouchableOpacity
                            style={styles.payBtn}
                            onPress={(e) => openPayModal(bItem, e)}
                          >
                            <Text style={styles.payBtnText}>💳 Pelunasan Kasir</Text>
                          </TouchableOpacity>
                        ) : null}

                        <TouchableOpacity
                          style={[styles.cardActionBtn, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}
                          onPress={(e) => handleDeleteBilling(bItem, e)}
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

            {selectedBilling ? (
              <View style={styles.modalPatientBanner}>
                <Text style={{ fontSize: 13, color: '#64748B' }}>{selectedBilling.invoiceNo}</Text>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#0F172A', marginTop: 2 }}>
                  {selectedBilling.patient?.name}
                </Text>
                <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.primary, marginTop: 4 }}>
                  Total: {formatRupiah(selectedBilling.totalAmount)}
                </Text>
              </View>
            ) : null}

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
                {processingPay ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.modalSaveBtnText}>Proses Pelunasan Lunas</Text>
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
  finWidget: {
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
  finWidgetCol: {
    alignItems: 'center',
  },
  finWidgetLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 4,
  },
  finWidgetValGreen: {
    fontSize: 15,
    fontWeight: '900',
    color: '#16A34A',
  },
  finWidgetValRed: {
    fontSize: 15,
    fontWeight: '900',
    color: '#DC2626',
  },
  finDivider: {
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
  billingCard: {
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
  invNoText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  rmText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
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
  amountBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: RADII.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  amountCol: {
    justifyContent: 'center',
  },
  methodCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amountLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 2,
  },
  amountVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  methodPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADII.sm,
  },
  methodPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
  },
  dateText: {
    fontSize: 11,
    color: '#64748B',
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
  payBtn: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADII.sm,
  },
  payBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
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
