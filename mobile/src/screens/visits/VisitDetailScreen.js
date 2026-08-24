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
import { visitService } from '../../services/api';

export const VisitDetailScreen = ({ route, navigation }) => {
  const { id } = route.params || {};
  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchVisitDetail();
    }
  }, [id]);

  const fetchVisitDetail = async () => {
    try {
      setLoading(true);
      const res = await visitService.getVisitById(id);
      const visitData = res?.data?.visit || res?.data;
      if (visitData) {
        setVisit(visitData);
      }
    } catch (err) {
      console.log('Fetch visit detail error:', err.message);
      Alert.alert('Error', 'Gagal memuat detail kunjungan antrean.');
    } finally {
      setLoading(false);
    }
  };

  const handleCall = async () => {
    try {
      await visitService.callVisit(id);
      Alert.alert('🔊 Antrean Dipanggil', `Nomor ${visit?.queueNumberFormatted || 'Antrean'} sedang dipanggil.`);
      fetchVisitDetail();
    } catch (err) {
      Alert.alert('Gagal', err.response?.data?.error || 'Gagal memanggil antrean.');
    }
  };

  const handleStart = async () => {
    try {
      await visitService.startVisit(id);
      Alert.alert('🩺 Pemeriksaan Dimulai', 'Status kunjungan diubah menjadi Sedang Diperiksa.');
      fetchVisitDetail();
    } catch (err) {
      Alert.alert('Gagal', err.response?.data?.error || 'Gagal memulai pemeriksaan.');
    }
  };

  const handleComplete = async () => {
    try {
      await visitService.completeVisit(id);
      Alert.alert('✅ Kunjungan Selesai', 'Pemeriksaan telah diselesaikan.');
      fetchVisitDetail();
    } catch (err) {
      Alert.alert('Gagal', err.response?.data?.error || 'Gagal menyelesaikan kunjungan.');
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

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerBox]}>
        <ActivityIndicator size="large" color={COLORS.primary600} />
        <Text style={styles.loadingText}>Memuat Detail Kunjungan...</Text>
      </SafeAreaView>
    );
  }

  if (!visit) {
    return (
      <SafeAreaView style={[styles.container, styles.centerBox]}>
        <Text style={{ fontSize: 40, marginBottom: 8 }}>❌</Text>
        <Text style={styles.errorText}>Kunjungan Tidak Ditemukan</Text>
        <TouchableOpacity style={styles.backLinkBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backLinkText}>← Kembali ke Daftar Visit</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const queueNo = visit.queueNumberFormatted || visit.queueNumber || 'A-1';
  const isWeb = visit.channel === 'ONLINE_WEBSITE';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary700} />

      {/* Top Navbar */}
      <View style={styles.topNavbar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.topNavbarTitle}>Detail Ticket Antrean</Text>
        <TouchableOpacity
          style={styles.editHeaderBtn}
          onPress={() => navigation.navigate('VisitForm', { id: visit.id })}
        >
          <Text style={styles.editHeaderBtnText}>✏️ Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Ticket Hero Box */}
        <View style={styles.ticketHeroCard}>
          <Text style={styles.ticketTitle}>NOMOR ANTREAN PASIEN</Text>
          <Text style={styles.queueNumberBig}>{queueNo}</Text>
          
          <View style={styles.ticketBadgeRow}>
            <View style={[styles.channelPill, isWeb ? styles.channelPillWeb : styles.channelPillLoket]}>
              <Text style={[styles.channelPillText, isWeb ? styles.channelPillTextWeb : styles.channelPillTextLoket]}>
                {isWeb ? '🌐 PRIORTAS WEB PASIEN' : '🏬 LOKET ADMISI ONSITE'}
              </Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>{visit.status}</Text>
            </View>
          </View>

          <Text style={styles.scheduledTimeText}>📅 Waktu Jadwal: {formatDate(visit.scheduledAt || visit.createdAt)}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.opActionCard}>
          <Text style={styles.sectionTitle}>⚡ Operasional Antrean</Text>
          <View style={styles.opBtnRow}>
            {(visit.status === 'SCHEDULED' || visit.status === 'CALLED') && (
              <TouchableOpacity style={[styles.opBigBtn, { backgroundColor: '#FEF3C7' }]} onPress={handleCall}>
                <Text style={styles.opBigBtnText}>🔊 Panggil</Text>
              </TouchableOpacity>
            )}

            {(visit.status === 'CALLED' || visit.status === 'SCHEDULED') && (
              <TouchableOpacity style={[styles.opBigBtn, { backgroundColor: '#DBEAFE' }]} onPress={handleStart}>
                <Text style={styles.opBigBtnText}>🩺 Periksa</Text>
              </TouchableOpacity>
            )}

            {(visit.status === 'IN_PROGRESS' || visit.status === 'CALLED') && (
              <TouchableOpacity style={[styles.opBigBtn, { backgroundColor: '#D1FAE5' }]} onPress={handleComplete}>
                <Text style={styles.opBigBtnText}>✅ Selesai</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Section 1: Informasti Pasien */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>👤 Informasi Pasien</Text>
          <View style={styles.gridContainer}>
            <View style={styles.gridRowFull}>
              <Text style={styles.gridLabel}>Nama Pasien</Text>
              <Text style={styles.gridValue}>{visit.patient?.name || '-'}</Text>
            </View>
            <View style={styles.gridRow}>
              <Text style={styles.gridLabel}>No. Rekam Medis (MRN)</Text>
              <Text style={styles.gridValue}>{visit.patient?.medicalRecordNo || '-'}</Text>
            </View>
            <View style={styles.gridRow}>
              <Text style={styles.gridLabel}>No. Telepon / WA</Text>
              <Text style={styles.gridValue}>{visit.patient?.phone || '-'}</Text>
            </View>
          </View>
        </View>

        {/* Section 2: Dokter & Poliklinik */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>👨‍⚕️ Dokter DPJP & Poliklinik</Text>
          <View style={styles.gridContainer}>
            <View style={styles.gridRowFull}>
              <Text style={styles.gridLabel}>Dokter Spesialis</Text>
              <Text style={styles.gridValue}>{visit.doctor?.name || '-'}</Text>
            </View>
            <View style={styles.gridRow}>
              <Text style={styles.gridLabel}>Departemen / Poli</Text>
              <Text style={styles.gridValue}>{visit.doctor?.department || visit.poliklinik || 'Poliklinik'}</Text>
            </View>
            <View style={styles.gridRow}>
              <Text style={styles.gridLabel}>Tipe Kunjungan</Text>
              <Text style={styles.gridValue}>{visit.visitType}</Text>
            </View>
          </View>
        </View>

        {/* Section 3: Catatan & Gejala */}
        <View style={[styles.cardSection, { marginBottom: 30 }]}>
          <Text style={styles.sectionTitle}>📝 Catatan Kunjungan / Keluhan</Text>
          <View style={styles.noteBox}>
            <Text style={styles.noteText}>{visit.notes || 'Tidak ada catatan khusus yang ditambahkan.'}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerBox: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 10,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  backLinkBtn: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.primary600,
    borderRadius: RADII.md,
  },
  backLinkText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  topNavbar: {
    backgroundColor: COLORS.primary700,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    paddingVertical: 4,
  },
  backBtnText: {
    color: '#93C5FD',
    fontSize: 13,
    fontWeight: '800',
  },
  topNavbarTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  editHeaderBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADII.md,
  },
  editHeaderBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  scrollView: {
    flex: 1,
  },
  ticketHeroCard: {
    backgroundColor: COLORS.primary600,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: 'center',
    borderBottomLeftRadius: RADII.xl,
    borderBottomRightRadius: RADII.xl,
    ...SHADOWS.md,
  },
  ticketTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#BFDBFE',
    letterSpacing: 1,
  },
  queueNumberBig: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
  ticketBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  channelPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADII.pill,
  },
  channelPillWeb: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  channelPillLoket: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  channelPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  channelPillTextWeb: {
    color: '#E0E7FF',
  },
  channelPillTextLoket: {
    color: '#F1F5F9',
  },
  statusPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADII.pill,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  scheduledTimeText: {
    fontSize: 12,
    color: '#DBEAFE',
    fontWeight: '600',
    marginTop: 10,
  },
  opActionCard: {
    marginHorizontal: 20,
    marginTop: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: RADII.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  opBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  opBigBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  opBigBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  cardSection: {
    marginHorizontal: 20,
    marginTop: 14,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADII.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 10,
  },
  gridRow: {
    width: '50%',
  },
  gridRowFull: {
    width: '100%',
  },
  gridLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  gridValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  noteBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  noteText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
