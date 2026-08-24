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
import { recordService } from '../../services/api';

export const RecordDetailScreen = ({ route, navigation }) => {
  const { recordId, recordData } = route.params || {};
  const [record, setRecord] = useState(recordData || null);
  const [loading, setLoading] = useState(!recordData);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (recordId) {
      fetchRecordDetail();
    }
  }, [recordId]);

  const fetchRecordDetail = async () => {
    try {
      setLoading(true);
      const res = await recordService.getRecordById(recordId);
      if (res?.data) {
        setRecord(res.data.record || res.data);
      }
    } catch (err) {
      console.log('Error fetching record detail:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    const doDelete = async () => {
      try {
        setDeleting(true);
        await recordService.deleteRecord(record.id);
        if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert('✅ Rekam medis berhasil dihapus!');
        else Alert.alert('Berhasil', 'Rekam medis berhasil dihapus!');
        navigation.navigate('Records', { refresh: true });
      } catch (err) {
        const msg = err.response?.data?.error || 'Gagal menghapus rekam medis.';
        if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(`❌ ${msg}`);
        else Alert.alert('Error', msg);
      } finally {
        setDeleting(false);
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Apakah Anda yakin ingin menghapus rekam medis ini?')) {
        doDelete();
      }
    } else {
      Alert.alert('Konfirmasi Hapus', 'Apakah Anda yakin ingin menghapus rekam medis ini?', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: doDelete },
      ]);
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

  if (loading || !record) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Memuat detail EMR pasien...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Parse Prescription Items
  let prescriptionItems = [];
  if (record.prescription) {
    if (Array.isArray(record.prescription)) {
      prescriptionItems = record.prescription;
    } else if (typeof record.prescription === 'string') {
      try {
        prescriptionItems = JSON.parse(record.prescription);
      } catch (e) {
        prescriptionItems = [{ medicine: record.prescription, dosage: '', frequency: '' }];
      }
    } else if (typeof record.prescription === 'object') {
      prescriptionItems = [record.prescription];
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Rekam Medis</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Rekam Medis (EMR)</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Patient Card Banner */}
        <View style={styles.patientCard}>
          <View style={styles.patientTopRow}>
            <View style={styles.avatarBox}>
              <Text style={{ fontSize: 28 }}>👤</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.patientName}>{record.patient?.name || 'Pasien'}</Text>
              <Text style={styles.rmText}>No. RM: <Text style={{ fontWeight: '800', color: COLORS.primary }}>{record.patient?.medicalRecordNo || '-'}</Text></Text>
            </View>
            {record.diagnosisCode ? (
              <View style={styles.icdBadge}>
                <Text style={styles.icdBadgeText}>ICD-10: {record.diagnosisCode}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.patientMetaGrid}>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Jenis Kelamin:</Text>
              <Text style={styles.metaValue}>{record.patient?.gender === 'MALE' ? 'Laki-Laki' : record.patient?.gender === 'FEMALE' ? 'Perempuan' : '-'}</Text>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>No. Telepon:</Text>
              <Text style={styles.metaValue}>{record.patient?.phone || '-'}</Text>
            </View>
          </View>
        </View>

        {/* Doctor & Examination Header */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={{ fontSize: 18, marginRight: 6 }}>👨‍⚕️</Text>
            <Text style={styles.cardTitle}>Pemeriksa & Tanggal</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Dokter Pemeriksa:</Text>
            <Text style={styles.infoVal}>{record.doctor?.name || 'Dokter Spesialis'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Departemen / Poli:</Text>
            <Text style={styles.infoVal}>{record.doctor?.department || 'Poliklinik Spesialis'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tanggal Pemeriksaan:</Text>
            <Text style={styles.infoVal}>{formatDate(record.createdAt)}</Text>
          </View>
        </View>

        {/* Symptoms & Complaint Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={{ fontSize: 18, marginRight: 6 }}>🗣️</Text>
            <Text style={styles.cardTitle}>Keluhan Utama & Anamnesis</Text>
          </View>
          <Text style={styles.bodyText}>{record.symptoms || 'Tidak ada catatan keluhan spesifik.'}</Text>
        </View>

        {/* Diagnosis Card */}
        <View style={[styles.card, { borderColor: '#BFDBFE', backgroundColor: '#F8FAFC' }]}>
          <View style={styles.cardHeaderRow}>
            <Text style={{ fontSize: 18, marginRight: 6 }}>🩺</Text>
            <Text style={[styles.cardTitle, { color: COLORS.primary }]}>Diagnosis Medis (Primary Diagnosis)</Text>
          </View>
          <Text style={styles.diagPrimaryText}>{record.diagnosis || 'Belum ada diagnosis tercatat.'}</Text>
        </View>

        {/* Treatment Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={{ fontSize: 18, marginRight: 6 }}>💉</Text>
            <Text style={styles.cardTitle}>Tindakan & Penanganan Medis</Text>
          </View>
          <Text style={styles.bodyText}>{record.treatment || 'Pemeriksaan fisik standar & konsultasi.'}</Text>
        </View>

        {/* Prescription E-Resep Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={{ fontSize: 18, marginRight: 6 }}>💊</Text>
            <Text style={styles.cardTitle}>E-Resep / Terapi Obat</Text>
          </View>

          {prescriptionItems.length === 0 ? (
            <Text style={styles.bodyText}>Tidak ada resep obat tertulis.</Text>
          ) : (
            <View style={styles.prescriptionList}>
              {prescriptionItems.map((item, idx) => (
                <View key={idx} style={styles.rxItem}>
                  <View style={styles.rxItemHeader}>
                    <Text style={styles.rxName}>💊 {item.medicineName || item.medicine || item.name || `Obat #${idx + 1}`}</Text>
                    <Text style={styles.rxDosage}>{item.dosage || item.dosis || '-'}</Text>
                  </View>
                  {item.frequency || item.aturanPakai ? (
                    <Text style={styles.rxFreq}>Aturan Pakai: {item.frequency || item.aturanPakai}</Text>
                  ) : null}
                  {item.notes ? <Text style={styles.rxNotes}>Catatan: {item.notes}</Text> : null}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Actions Row */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('RecordForm', { recordData: record })}
          >
            <Text style={styles.editBtnText}>✏️ Edit Rekam Medis</Text>
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
  patientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADII.xl,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  patientTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  patientName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  rmText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  icdBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADII.sm,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  icdBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
  },
  patientMetaGrid: {
    flexDirection: 'row',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 2,
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
  diagPrimaryText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 22,
  },
  prescriptionList: {
    gap: 8,
  },
  rxItem: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rxItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rxName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  rxDosage: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  rxFreq: {
    fontSize: 11,
    color: '#475569',
    marginTop: 4,
  },
  rxNotes: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 2,
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
