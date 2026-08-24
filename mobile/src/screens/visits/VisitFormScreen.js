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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS, RADII, SHADOWS } from '../../constants/theme';
import { visitService, patientService, publicService } from '../../services/api';

export const VisitFormScreen = ({ route, navigation }) => {
  const { id } = route.params || {};
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Selector Lists
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);

  // Form States
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [visitType, setVisitType] = useState('OUTPATIENT');
  const [channel, setChannel] = useState('ONSITE_LOKET');
  const [status, setStatus] = useState('SCHEDULED');
  const [scheduledAt, setScheduledAt] = useState(new Date().toISOString().slice(0, 16).replace('T', ' '));
  const [notes, setNotes] = useState('');

  // Dropdown UI Toggles
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, [id]);

  const loadInitialData = async () => {
    try {
      setFetching(true);
      const [patientsRes, doctorsRes] = await Promise.allSettled([
        patientService.getPatients({ limit: 50 }),
        publicService.getDoctors(),
      ]);

      if (patientsRes.status === 'fulfilled' && patientsRes.value) {
        const rawP = patientsRes.value?.data?.patients || patientsRes.value?.data || patientsRes.value;
        const pList = Array.isArray(rawP) ? rawP : [];
        setPatients(pList);
        if (!isEdit && pList.length > 0) {
          setPatientId(pList[0].id);
        }
      }

      if (doctorsRes.status === 'fulfilled' && doctorsRes.value) {
        const rawD = doctorsRes.value?.data?.doctors || doctorsRes.value?.data || doctorsRes.value;
        const dList = Array.isArray(rawD) ? rawD : [];
        setDoctors(dList);
        if (!isEdit && dList.length > 0) {
          setDoctorId(dList[0].id);
        }
      }

      if (isEdit) {
        const visitRes = await visitService.getVisitById(id);
        const v = visitRes?.data?.visit || visitRes?.data;
        if (v) {
          setPatientId(v.patientId || v.patient?.id || '');
          setDoctorId(v.doctorId || v.doctor?.id || '');
          setVisitType(v.visitType || 'OUTPATIENT');
          setChannel(v.channel || 'ONSITE_LOKET');
          setStatus(v.status || 'SCHEDULED');
          setScheduledAt(v.scheduledAt ? v.scheduledAt.slice(0, 16).replace('T', ' ') : '');
          setNotes(v.notes || '');
        }
      }
    } catch (err) {
      console.log('Load visit form data error:', err.message);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async () => {
    if (!patientId || !doctorId || !scheduledAt) {
      const msg = 'Mohon pilih Pasien, Dokter, dan Tanggal & Waktu Jadwal.';
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') window.alert(msg);
      } else {
        Alert.alert('Form Belum Lengkap', msg);
      }
      return;
    }

    try {
      setLoading(true);
      const parsedDate = new Date(scheduledAt.includes('T') ? scheduledAt : scheduledAt.replace(' ', 'T'));
      const validDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

      const payload = {
        patientId: parseInt(patientId),
        doctorId: parseInt(doctorId),
        visitType,
        channel,
        scheduledAt: validDate.toISOString(),
        notes,
        ...(isEdit ? { status } : {}),
      };

      if (isEdit) {
        await visitService.updateVisit(id, payload);
        if (Platform.OS === 'web') {
          if (typeof window !== 'undefined') window.alert('Sukses: Data kunjungan berhasil diperbarui!');
          navigation.goBack();
        } else {
          Alert.alert('Sukses', 'Data kunjungan berhasil diperbarui!', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        }
      } else {
        const res = await visitService.createVisit(payload);
        if (res?.data || res?.success) {
          const queueNo = res.data?.queueNumberFormatted || res.data?.visit?.queueNumberFormatted || 'WEB-1';
          const msg = `Nomor Antrean: ${queueNo}\n\nJadwal kunjungan baru berhasil dibuat.`;
          if (Platform.OS === 'web') {
            if (typeof window !== 'undefined') window.alert(`🎫 Kunjungan Dijadwalkan!\n\n${msg}`);
            navigation.goBack();
          } else {
            Alert.alert(
              '🎫 Kunjungan Dijadwalkan!',
              msg,
              [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
          }
        }
      }
    } catch (err) {
      console.log('Submit visit error:', err);
      const errMsg = err.response?.data?.error || err.message || 'Gagal menyimpan kunjungan.';
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') window.alert(`Gagal Simpan: ${errMsg}`);
      } else {
        Alert.alert('Gagal Simpan', errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const patientList = Array.isArray(patients) ? patients : [];
  const doctorList = Array.isArray(doctors) ? doctors : [];

  const selectedPatientName = patientList.find((p) => p.id === parseInt(patientId))?.name || 'Pilih Pasien';
  const selectedDoctorName = doctorList.find((d) => d.id === parseInt(doctorId))?.name || 'Pilih Dokter';

  if (fetching) {
    return (
      <SafeAreaView style={[styles.container, styles.centerBox]}>
        <ActivityIndicator size="large" color={COLORS.primary600} />
        <Text style={styles.loadingText}>Memuat Data Form Kunjungan...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Batal</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Kunjungan' : 'Jadwalkan Kunjungan Baru'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.formScrollView} showsVerticalScrollIndicator={false}>
          {/* Card Form */}
          <View style={styles.formCard}>
            {/* Select Patient */}
            <Text style={styles.label}>Pilih Pasien *</Text>
            <TouchableOpacity style={styles.selectBox} onPress={() => setShowPatientDropdown(!showPatientDropdown)}>
              <Text style={styles.selectBoxText}>{selectedPatientName}</Text>
              <Text style={styles.selectArrow}>{showPatientDropdown ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showPatientDropdown && (
              <View style={styles.dropdownList}>
                {patientList.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.dropdownItem, patientId === p.id && styles.dropdownItemActive]}
                    onPress={() => {
                      setPatientId(p.id);
                      setShowPatientDropdown(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, patientId === p.id && styles.dropdownItemTextActive]}>
                      👤 {p.name} (RM: {p.medicalRecordNo}) {patientId === p.id ? '✓' : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Select Doctor */}
            <Text style={styles.label}>Pilih Dokter DPJP *</Text>
            <TouchableOpacity style={styles.selectBox} onPress={() => setShowDoctorDropdown(!showDoctorDropdown)}>
              <Text style={styles.selectBoxText}>{selectedDoctorName}</Text>
              <Text style={styles.selectArrow}>{showDoctorDropdown ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showDoctorDropdown && (
              <View style={styles.dropdownList}>
                {doctorList.map((d) => (
                  <TouchableOpacity
                    key={d.id}
                    style={[styles.dropdownItem, doctorId === d.id && styles.dropdownItemActive]}
                    onPress={() => {
                      setDoctorId(d.id);
                      setShowDoctorDropdown(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, doctorId === d.id && styles.dropdownItemTextActive]}>
                      👨‍⚕️ {d.name} ({d.department || 'Poli'}) {doctorId === d.id ? '✓' : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Select Visit Type */}
            <Text style={styles.label}>Jenis Kunjungan *</Text>
            <View style={styles.chipRow}>
              {[
                { label: 'Rawat Jalan', val: 'OUTPATIENT' },
                { label: 'Rawat Inap', val: 'INPATIENT' },
                { label: 'Pemeriksaan Umum', val: 'GENERAL_CHECKUP' },
                { label: 'IGD (Darurat)', val: 'EMERGENCY' },
                { label: 'Tindakan Medis', val: 'MEDICAL_ACTION' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.val}
                  style={[styles.chipBtn, visitType === item.val && styles.chipBtnActive]}
                  onPress={() => setVisitType(item.val)}
                >
                  <Text style={[styles.chipBtnText, visitType === item.val && styles.chipBtnTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Select Channel */}
            <Text style={styles.label}>Saluran Pendaftaran</Text>
            <View style={styles.chipRow}>
              {[
                { label: '🏬 Loket Admisi Onsite', val: 'ONSITE_LOKET' },
                { label: '🌐 Online Website', val: 'ONLINE_WEBSITE' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.val}
                  style={[styles.chipBtn, channel === item.val && styles.chipBtnActive]}
                  onPress={() => setChannel(item.val)}
                >
                  <Text style={[styles.chipBtnText, channel === item.val && styles.chipBtnTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Select Status (if Edit) */}
            {isEdit && (
              <>
                <Text style={styles.label}>Status Antrean *</Text>
                <View style={styles.chipRow}>
                  {[
                    { label: 'Menunggu', val: 'SCHEDULED' },
                    { label: 'Dipanggil 🔊', val: 'CALLED' },
                    { label: 'Diperiksa 🩺', val: 'IN_PROGRESS' },
                    { label: 'Selesai ✅', val: 'COMPLETED' },
                    { label: 'Dilewati ⏩', val: 'SKIPPED' },
                    { label: 'Dibatalkan ❌', val: 'CANCELLED' },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.val}
                      style={[styles.chipBtn, status === item.val && styles.chipBtnActive]}
                      onPress={() => setStatus(item.val)}
                    >
                      <Text style={[styles.chipBtnText, status === item.val && styles.chipBtnTextActive]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Scheduled Date & Time */}
            <Text style={styles.label}>Tanggal & Waktu Jadwal (YYYY-MM-DD HH:mm) *</Text>
            <TextInput
              style={styles.input}
              value={scheduledAt}
              onChangeText={setScheduledAt}
              placeholder="2026-08-25 09:00"
            />

            {/* Notes */}
            <Text style={styles.label}>Catatan Kunjungan / Keluhan (Opsional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tuliskan keluhan awal atau catatan instruksi..."
              multiline={true}
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer Submit Button */}
      <View style={styles.footerSubmit}>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitBtnText}>{isEdit ? 'Simpan Perubahan Kunjungan →' : 'Jadwalkan Kunjungan →'}</Text>
          )}
        </TouchableOpacity>
      </View>
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
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 8,
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
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  formScrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  formCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADII.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
    ...SHADOWS.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  selectBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.primary600,
    borderRadius: RADII.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectBoxText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  selectArrow: {
    fontSize: 12,
    color: COLORS.primary600,
    fontWeight: '900',
  },
  dropdownList: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    marginTop: 4,
    maxHeight: 180,
    ...SHADOWS.sm,
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  dropdownItemActive: {
    backgroundColor: COLORS.primary50,
  },
  dropdownItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  dropdownItemTextActive: {
    color: COLORS.primary600,
    fontWeight: '800',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#F8FAFC',
  },
  chipBtnActive: {
    backgroundColor: COLORS.primary50,
    borderColor: COLORS.primary600,
  },
  chipBtnText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  chipBtnTextActive: {
    color: COLORS.primary600,
    fontWeight: '800',
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  footerSubmit: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  submitBtn: {
    backgroundColor: COLORS.primary600,
    borderRadius: RADII.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
