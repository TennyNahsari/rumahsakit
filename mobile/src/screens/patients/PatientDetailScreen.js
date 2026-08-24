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
import { patientService } from '../../services/api';

export const PatientDetailScreen = ({ route, navigation }) => {
  const { id } = route.params || {};
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPatientDetail();
    }
  }, [id]);

  const fetchPatientDetail = async () => {
    try {
      setLoading(true);
      const res = await patientService.getPatientById(id);
      const p = res?.data?.patient || res?.data;
      if (p) {
        setPatient(p);
      }
    } catch (err) {
      console.log('Fetch patient detail error:', err.message);
      Alert.alert('Error', 'Gagal memuat detail data pasien.');
    } finally {
      setLoading(false);
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
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerBox]}>
        <ActivityIndicator size="large" color={COLORS.primary600} />
        <Text style={styles.loadingText}>Memuat Profil Pasien...</Text>
      </SafeAreaView>
    );
  }

  if (!patient) {
    return (
      <SafeAreaView style={[styles.container, styles.centerBox]}>
        <Text style={{ fontSize: 40, marginBottom: 8 }}>❌</Text>
        <Text style={styles.errorText}>Data Pasien Tidak Ditemukan</Text>
        <TouchableOpacity style={styles.backLinkBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backLinkText}>← Kembali ke Daftar Pasien</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary700} />

      {/* Top Navbar */}
      <View style={styles.topNavbar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.topNavbarTitle}>Detail Rekam Pasien</Text>
        <TouchableOpacity
          style={styles.editHeaderBtn}
          onPress={() => navigation.navigate('PatientForm', { id: patient.id })}
        >
          <Text style={styles.editHeaderBtnText}>✏️ Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Banner Profile */}
        <View style={styles.profileBanner}>
          <View style={styles.avatarCircle}>
            <Text style={{ fontSize: 32 }}>👤</Text>
          </View>
          <Text style={styles.patientName}>{patient.name}</Text>
          <View style={styles.mrnBadge}>
            <Text style={styles.mrnBadgeText}>NOMOR REKAM MEDIS: {patient.medicalRecordNo}</Text>
          </View>
          <Text style={styles.patientSubText}>
            {calculateAge(patient.dateOfBirth)} Tahun • {patient.gender === 'MALE' ? 'Laki-Laki' : 'Perempuan'} • Goldar: {patient.bloodType || '-'}
          </Text>
        </View>

        {/* Section 1: Informasi Demografi & Identitas */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>📌 Informasi Demografi Pasien</Text>
          <View style={styles.gridContainer}>
            <View style={styles.gridRow}>
              <Text style={styles.gridLabel}>NIK / Identitas</Text>
              <Text style={styles.gridValue}>{patient.nik || '-'}</Text>
            </View>
            <View style={styles.gridRow}>
              <Text style={styles.gridLabel}>Tanggal Lahir</Text>
              <Text style={styles.gridValue}>{formatDate(patient.dateOfBirth)}</Text>
            </View>
            <View style={styles.gridRow}>
              <Text style={styles.gridLabel}>Agama</Text>
              <Text style={styles.gridValue}>{patient.religion || '-'}</Text>
            </View>
            <View style={styles.gridRow}>
              <Text style={styles.gridLabel}>Status Perkawinan</Text>
              <Text style={styles.gridValue}>{patient.maritalStatus || '-'}</Text>
            </View>
          </View>
        </View>

        {/* Section 2: Kontak & Alamat */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>📞 Kontak & Alamat Tempat Tinggal</Text>
          <View style={styles.gridContainer}>
            <View style={styles.gridRow}>
              <Text style={styles.gridLabel}>No. Telepon / WA</Text>
              <Text style={styles.gridValue}>{patient.phone || '-'}</Text>
            </View>
            <View style={styles.gridRow}>
              <Text style={styles.gridLabel}>Email</Text>
              <Text style={styles.gridValue}>{patient.email || '-'}</Text>
            </View>
            <View style={styles.gridRowFull}>
              <Text style={styles.gridLabel}>Alamat Lengkap</Text>
              <Text style={styles.gridValue}>{patient.address || '-'}, {patient.city || ''}</Text>
            </View>
          </View>
        </View>

        {/* Section 3: Kontak Darurat */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>🚨 Kontak Darurat Pasien</Text>
          <View style={styles.gridContainer}>
            <View style={styles.gridRow}>
              <Text style={styles.gridLabel}>Nama Penanggung Jawab</Text>
              <Text style={styles.gridValue}>{patient.emergencyContactName || '-'}</Text>
            </View>
            <View style={styles.gridRow}>
              <Text style={styles.gridLabel}>Hubungan</Text>
              <Text style={styles.gridValue}>{patient.emergencyContactRel || '-'}</Text>
            </View>
            <View style={styles.gridRowFull}>
              <Text style={styles.gridLabel}>Telepon Darurat</Text>
              <Text style={styles.gridValue}>{patient.emergencyContactPhone || '-'}</Text>
            </View>
          </View>
        </View>

        {/* Section 4: Penjamin & Asuransi */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>💳 Penjamin & Asuransi Kesehatan</Text>
          <View style={styles.gridContainer}>
            <View style={styles.gridRow}>
              <Text style={styles.gridLabel}>Jenis Pembayaran</Text>
              <Text style={styles.gridValue}>{patient.insuranceType || 'UMUM'}</Text>
            </View>
            <View style={styles.gridRow}>
              <Text style={styles.gridLabel}>No. BPJS / Kartu Asuransi</Text>
              <Text style={styles.gridValue}>{patient.insuranceNumber || '-'}</Text>
            </View>
          </View>
        </View>

        {/* Section 5: Riwayat Alergi & Medis */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>⚠️ Catatan Alergi & Riwayat Medis</Text>
          <View style={styles.noteBox}>
            <Text style={styles.noteTitle}>Alergi Obat / Makanan:</Text>
            <Text style={styles.noteBody}>{patient.allergies || 'Tidak ada riwayat alergi yang dicatat.'}</Text>
          </View>
          <View style={[styles.noteBox, { marginTop: 10 }]}>
            <Text style={styles.noteTitle}>Riwayat Penyakit Dahulu:</Text>
            <Text style={styles.noteBody}>{patient.medicalHistory || 'Tidak ada riwayat penyakit kronis terdahulu.'}</Text>
          </View>
        </View>

        {/* Section 6: Riwayat Kunjungan Pasien */}
        <View style={[styles.cardSection, { marginBottom: 30 }]}>
          <Text style={styles.sectionTitle}>📋 Riwayat Kunjungan (Visits)</Text>
          {patient.visits && patient.visits.length > 0 ? (
            patient.visits.map((v, i) => {
              const visitTypeMap = {
                GENERAL_CHECKUP: { label: 'Pemeriksaan Umum', bg: '#EFF6FF', color: '#1D4ED8' },
                OUTPATIENT: { label: 'Rawat Jalan', bg: '#E0F2FE', color: '#0284C7' },
                INPATIENT: { label: 'Rawat Inap', bg: '#ECFDF5', color: '#059669' },
                EMERGENCY: { label: 'IGD / Darurat', bg: '#FEF2F2', color: '#DC2626' },
                MEDICAL_ACTION: { label: 'Tindakan Medis', bg: '#FAF5FF', color: '#7E22CE' },
              };
              const typeConfig = visitTypeMap[v.visitType] || { label: v.visitType || 'Visit', bg: '#F1F5F9', color: '#475569' };

              return (
                <View key={v.id || i} style={styles.visitItemCard}>
                  <View style={styles.visitHeader}>
                    <View style={styles.visitTypeBadgeRow}>
                      <View style={[styles.visitTypePill, { backgroundColor: typeConfig.bg }]}>
                        <Text style={[styles.visitTypePillText, { color: typeConfig.color }]}>
                          {typeConfig.label}
                        </Text>
                      </View>
                      {v.poliklinik ? <Text style={styles.visitPolyText}>• {v.poliklinik}</Text> : null}
                    </View>
                    <Text style={styles.visitDateText}>{formatDate(v.scheduledAt || v.createdAt)}</Text>
                  </View>
                  <Text style={styles.visitDoctorText}>Dokter DPJP: {v.doctorName || v.doctor?.name || '-'}</Text>
                  <Text style={styles.visitStatusText}>Status: {v.status || 'SCHEDULED'}</Text>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyVisitBox}>
              <Text style={styles.emptyVisitText}>Belum ada riwayat kunjungan yang tercatat.</Text>
            </View>
          )}
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
  profileBanner: {
    backgroundColor: COLORS.primary600,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: 'center',
    borderBottomLeftRadius: RADII.xl,
    borderBottomRightRadius: RADII.xl,
    ...SHADOWS.md,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    ...SHADOWS.sm,
  },
  patientName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  mrnBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADII.pill,
    marginTop: 6,
  },
  mrnBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#BFDBFE',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  patientSubText: {
    fontSize: 12,
    color: '#DBEAFE',
    fontWeight: '600',
    marginTop: 6,
  },
  cardSection: {
    marginHorizontal: 20,
    marginTop: 18,
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
    marginBottom: 12,
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
    marginTop: 4,
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
  noteTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  noteBody: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  visitItemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: RADII.md,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  visitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  visitTypeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  visitTypePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADII.sm,
  },
  visitTypePillText: {
    fontSize: 10,
    fontWeight: '900',
  },
  visitPolyText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  visitDateText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  visitDoctorText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  visitStatusText: {
    fontSize: 11,
    color: COLORS.success600,
    fontWeight: '700',
    marginTop: 2,
  },
  emptyVisitBox: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  emptyVisitText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});
