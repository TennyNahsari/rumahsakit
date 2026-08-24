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
import { recordService } from '../../services/api';

export const RecordListScreen = ({ route, navigation }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRecords();
  }, []);

  useEffect(() => {
    if (route.params?.refresh) {
      fetchRecords();
    }
  }, [route.params?.refresh]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await recordService.getRecords({ limit: 50 });
      if (res?.data?.records) {
        setRecords(res.data.records);
      } else if (Array.isArray(res?.data)) {
        setRecords(res.data);
      } else if (Array.isArray(res)) {
        setRecords(res);
      }
    } catch (err) {
      console.log('Error fetching EMR records:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRecords();
  };

  const handleDeleteRecord = (recordItem, e) => {
    if (e && e.stopPropagation) e.stopPropagation();

    const doDelete = async () => {
      try {
        await recordService.deleteRecord(recordItem.id);
        if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert('✅ Rekam medis berhasil dihapus!');
        else Alert.alert('Berhasil', 'Rekam medis berhasil dihapus!');
        fetchRecords();
      } catch (err) {
        const msg = err.response?.data?.error || 'Gagal menghapus rekam medis.';
        if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(`❌ ${msg}`);
        else Alert.alert('Error', msg);
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Hapus rekam medis pasien "${recordItem.patient?.name || 'Pasien'}"?`)) {
        doDelete();
      }
    } else {
      Alert.alert('Konfirmasi Hapus', `Hapus rekam medis pasien "${recordItem.patient?.name || 'Pasien'}"?`, [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const filteredRecords = records.filter((rec) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const pName = (rec.patient?.name || '').toLowerCase();
    const mrn = (rec.patient?.medicalRecordNo || '').toLowerCase();
    const dName = (rec.doctor?.name || '').toLowerCase();
    const diag = (rec.diagnosis || '').toLowerCase();
    const code = (rec.diagnosisCode || '').toLowerCase();
    return pName.includes(query) || mrn.includes(query) || dName.includes(query) || diag.includes(query) || code.includes(query);
  });

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
        <Text style={styles.headerTitle}>Rekam Medis (EMR)</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('RecordForm')}>
          <Text style={styles.addBtnText}>+ Tambah</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama pasien, No.RM, ICD-10, atau dokter..."
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

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Memuat rekam medis digital...</Text>
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
                Total Rekam Medis: <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>{filteredRecords.length}</Text> Entri EMR
              </Text>
            </View>

            {filteredRecords.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={{ fontSize: 40, marginBottom: 8 }}>📋</Text>
                <Text style={styles.emptyTitle}>Rekam Medis Tidak Ditemukan</Text>
                <Text style={styles.emptySub}>
                  {searchQuery ? `Tidak ada rekam medis yang cocok dengan "${searchQuery}".` : 'Belum ada data rekam medis di database.'}
                </Text>
              </View>
            ) : (
              filteredRecords.map((rec, idx) => (
                <TouchableOpacity
                  key={rec.id || idx}
                  style={styles.recordCard}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('RecordDetail', { recordId: rec.id, recordData: rec })}
                >
                  {/* Top Row: Patient Info & ICD Badge */}
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.patientName}>{rec.patient?.name || 'Pasien Tanpa Nama'}</Text>
                      <Text style={styles.patientRmText}>
                        No.RM: <Text style={{ fontWeight: '700', color: COLORS.primary }}>{rec.patient?.medicalRecordNo || '-'}</Text>
                      </Text>
                    </View>

                    {rec.diagnosisCode ? (
                      <View style={styles.icdBadge}>
                        <Text style={styles.icdBadgeText}>ICD: {rec.diagnosisCode}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Diagnosis & Symptoms Preview */}
                  <View style={styles.diagnosisBox}>
                    <Text style={styles.diagTitle}>Diagnosis:</Text>
                    <Text style={styles.diagValue} numberOfLines={2}>
                      {rec.diagnosis || 'Belum ada diagnosis tercatat.'}
                    </Text>
                  </View>

                  {rec.symptoms ? (
                    <Text style={styles.symptomsText} numberOfLines={1}>
                      🗣️ Keluhan: {rec.symptoms}
                    </Text>
                  ) : null}

                  {/* Card Footer: Doctor & Date */}
                  <View style={styles.cardFooter}>
                    <View style={styles.docInfoCol}>
                      <Text style={styles.docNameText}>👨‍⚕️ {rec.doctor?.name || 'Dokter Spesialis'}</Text>
                      <Text style={styles.dateText}>📅 {formatDate(rec.createdAt)}</Text>
                    </View>

                    <View style={styles.cardActionsGroup}>
                      <TouchableOpacity
                        style={styles.cardActionBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          navigation.navigate('RecordForm', { recordData: rec });
                        }}
                      >
                        <Text style={styles.cardActionBtnText}>✏️ Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.cardActionBtn, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}
                        onPress={(e) => handleDeleteRecord(rec, e)}
                      >
                        <Text style={[styles.cardActionBtnText, { color: '#B91C1C' }]}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
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
    marginBottom: 14,
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
  recordCard: {
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
  icdBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADII.sm,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  icdBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
  },
  diagnosisBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: RADII.md,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  diagTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  diagValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  symptomsText: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  docInfoCol: {
    gap: 2,
  },
  docNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  dateText: {
    fontSize: 11,
    color: '#64748B',
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
