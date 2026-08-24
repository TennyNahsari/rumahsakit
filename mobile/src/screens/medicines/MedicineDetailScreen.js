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
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { COLORS, RADII, SHADOWS } from '../../constants/theme';
import { medicineService } from '../../services/api';

export const MedicineDetailScreen = ({ route, navigation }) => {
  const { medicineId, medicineData } = route.params || {};
  const [med, setMed] = useState(medicineData || null);
  const [loading, setLoading] = useState(!medicineData);
  const [deleting, setDeleting] = useState(false);

  // Batch Modal State
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchNo, setBatchNo] = useState('');
  const [batchStock, setBatchStock] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [supplier, setSupplier] = useState('');
  const [addingBatch, setAddingBatch] = useState(false);

  useEffect(() => {
    if (medicineId) {
      fetchDetail();
    }
  }, [medicineId]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await medicineService.getMedicineById(medicineId);
      if (res?.data) {
        setMed(res.data.medicine || res.data);
      }
    } catch (err) {
      console.log('Error fetching medicine detail:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBatchSubmit = async () => {
    if (!batchNo.trim() || !batchStock || isNaN(parseInt(batchStock))) {
      const msg = 'Mohon isi No. Batch dan Jumlah Stok yang valid.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
      else Alert.alert('Validasi', msg);
      return;
    }

    try {
      setAddingBatch(true);
      const payload = {
        batchNo: batchNo.trim(),
        stock: parseInt(batchStock),
        expiryDate: expiryDate ? new Date(expiryDate).toISOString() : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        supplier: supplier.trim() || null,
      };

      await medicineService.addBatch(med.id, payload);
      const msg = '✅ Batch stok obat berhasil ditambahkan!';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
      else Alert.alert('Berhasil', msg);

      setIsBatchModalOpen(false);
      setBatchNo('');
      setBatchStock('');
      setExpiryDate('');
      setSupplier('');
      fetchDetail();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Gagal menambahkan batch stok.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(`❌ ${errorMsg}`);
      else Alert.alert('Error', errorMsg);
    } finally {
      setAddingBatch(false);
    }
  };

  const handleDelete = () => {
    const doDelete = async () => {
      try {
        setDeleting(true);
        await medicineService.deleteMedicine(med.id);
        if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert('✅ Data obat berhasil dihapus!');
        else Alert.alert('Berhasil', 'Data obat berhasil dihapus!');
        navigation.navigate('Medicines', { refresh: true });
      } catch (err) {
        const msg = err.response?.data?.error || 'Gagal menghapus data obat.';
        if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(`❌ ${msg}`);
        else Alert.alert('Error', msg);
      } finally {
        setDeleting(false);
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Apakah Anda yakin ingin menghapus obat "${med?.name}"?`)) {
        doDelete();
      }
    } else {
      Alert.alert('Konfirmasi Hapus', `Apakah Anda yakin ingin menghapus obat "${med?.name}"?`, [
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
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading || !med) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Memuat detail obat & batch inventori...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalStock = med.totalStock !== undefined ? med.totalStock : (med.stock || 0);
  const isLowStock = totalStock < 50;
  const batchList = med.batches || [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Farmasi</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Inventori Obat</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Banner Card */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerTop}>
            <View style={styles.iconBox}>
              <Text style={{ fontSize: 32 }}>💊</Text>
            </View>

            <View style={styles.codeBadge}>
              <Text style={styles.codeBadgeText}>{med.code || 'OBT-UNIT'}</Text>
            </View>
          </View>

          <Text style={styles.medName}>{med.name}</Text>
          <Text style={styles.medCategory}>{med.category || 'Obat Umum'} • Satuan: {med.unit || 'Tablet'}</Text>

          <View style={styles.stockPriceGrid}>
            <View style={styles.gridBox}>
              <Text style={styles.gridLabel}>Harga HET Satuan:</Text>
              <Text style={styles.priceVal}>{formatRupiah(med.price)}</Text>
            </View>

            <View style={styles.gridBoxRight}>
              <Text style={styles.gridLabel}>Total Stok Inventori:</Text>
              <View style={[styles.stockBadge, isLowStock ? styles.stockBadgeLow : styles.stockBadgeSafe]}>
                <Text style={[styles.stockBadgeText, isLowStock ? styles.stockBadgeTextLow : styles.stockBadgeTextSafe]}>
                  {isLowStock ? '⚠️ ' : '✓ '}{totalStock} {med.unit || 'Pcs'}
                </Text>
              </View>
            </View>
          </View>

          {isLowStock ? (
            <View style={styles.lowStockWarning}>
              <Text style={styles.lowStockWarningText}>
                ⚠️ Peringatan: Stok obat berada di bawah batas minimum (50 {med.unit || 'Pcs'}). Segera tambahkan batch stok baru.
              </Text>
            </View>
          ) : null}
        </View>

        {/* Section 1: Deskripsi & Informasi */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={{ fontSize: 18, marginRight: 6 }}>📝</Text>
            <Text style={styles.cardTitle}>Deskripsi & Kategori Obat</Text>
          </View>
          <Text style={styles.bodyText}>{med.description || 'Tidak ada deskripsi spesifik.'}</Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Kode Obat:</Text>
              <Text style={styles.infoVal}>{med.code || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Kategori Farmasi:</Text>
              <Text style={styles.infoVal}>{med.category || 'Obat Bebas'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Satuan Kemasan:</Text>
              <Text style={styles.infoVal}>{med.unit || 'Tablet'}</Text>
            </View>
          </View>
        </View>

        {/* Section 2: Batch Stok Inventori */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRowBetween}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, marginRight: 6 }}>📦</Text>
              <Text style={styles.cardTitle}>Daftar Batch Inventori ({batchList.length})</Text>
            </View>

            <TouchableOpacity style={styles.addBatchBtn} onPress={() => setIsBatchModalOpen(true)}>
              <Text style={styles.addBatchBtnText}>+ Tambah Batch</Text>
            </TouchableOpacity>
          </View>

          {batchList.length === 0 ? (
            <Text style={styles.bodyText}>Belum ada data batch stok obat tercatat.</Text>
          ) : (
            <View style={styles.batchList}>
              {batchList.map((batch, idx) => (
                <View key={batch.id || idx} style={styles.batchItem}>
                  <View style={styles.batchItemHeader}>
                    <Text style={styles.batchNoText}>📦 No. Batch: {batch.batchNo}</Text>
                    <View style={styles.batchStockBadge}>
                      <Text style={styles.batchStockBadgeText}>{batch.stock} {med.unit || 'Pcs'}</Text>
                    </View>
                  </View>

                  <View style={styles.batchMetaRow}>
                    <Text style={styles.batchMetaText}>📅 Exp: {formatDate(batch.expiryDate)}</Text>
                    <Text style={styles.batchMetaText}>🏢 Supp: {batch.supplier || 'Distributor Farmasi'}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('MedicineForm', { medicineData: med })}
          >
            <Text style={styles.editBtnText}>✏️ Edit Obat</Text>
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

      {/* Modal Add Batch */}
      <Modal visible={isBatchModalOpen} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>+ Tambah Batch Stok Baru</Text>
              <TouchableOpacity onPress={() => setIsBatchModalOpen(false)}>
                <Text style={{ fontSize: 18, color: '#64748B' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Nomor Batch *</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: BATCH-2026-001"
              value={batchNo}
              onChangeText={setBatchNo}
            />

            <Text style={styles.label}>Jumlah Stok (Unit) *</Text>
            <TextInput
              style={styles.input}
              placeholder="100"
              keyboardType="numeric"
              value={batchStock}
              onChangeText={setBatchStock}
            />

            <Text style={styles.label}>Tanggal Kadaluarsa (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="2027-12-31"
              value={expiryDate}
              onChangeText={setExpiryDate}
            />

            <Text style={styles.label}>Distributor / Supplier</Text>
            <TextInput
              style={styles.input}
              placeholder="PT Kimia Farma Trading"
              value={supplier}
              onChangeText={setSupplier}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsBatchModalOpen(false)}>
                <Text style={styles.modalCancelBtnText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleAddBatchSubmit} disabled={addingBatch}>
                {addingBatch ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalSaveBtnText}>Simpan Batch</Text>}
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
  medName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  medCategory: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  stockPriceGrid: {
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
  stockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADII.sm,
  },
  stockBadgeSafe: {
    backgroundColor: '#DCFCE7',
  },
  stockBadgeLow: {
    backgroundColor: '#FEE2E2',
  },
  stockBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  stockBadgeTextSafe: {
    color: '#15803D',
  },
  stockBadgeTextLow: {
    color: '#B91C1C',
  },
  lowStockWarning: {
    marginTop: 12,
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: RADII.md,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  lowStockWarningText: {
    fontSize: 11,
    color: '#B91C1C',
    fontWeight: '600',
    lineHeight: 16,
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
  cardHeaderRowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  infoGrid: {
    marginTop: 10,
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  addBatchBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADII.sm,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  addBatchBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
  },
  batchList: {
    gap: 8,
  },
  batchItem: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  batchItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  batchNoText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  batchStockBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADII.sm,
  },
  batchStockBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
  },
  batchMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  batchMetaText: {
    fontSize: 11,
    color: '#64748B',
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
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
    marginTop: 6,
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
    backgroundColor: COLORS.primary,
    borderRadius: RADII.md,
  },
  modalSaveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
