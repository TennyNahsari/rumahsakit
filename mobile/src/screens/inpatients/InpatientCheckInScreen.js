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
  Platform,
} from 'react-native';
import { COLORS, RADII, SHADOWS } from '../../constants/theme';
import { inpatientService, patientService, roomService, publicService } from '../../services/api';

export const InpatientCheckInScreen = ({ navigation }) => {
  const [patients, setPatients] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [patientId, setPatientId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [initialDiagnosis, setInitialDiagnosis] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [notes, setNotes] = useState('');

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Dropdown UI visibility states
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [showRoomDropdown, setShowRoomDropdown] = useState(false);
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoadingInitial(true);
      const [patRes, roomRes, docRes] = await Promise.allSettled([
        patientService.getPatients({ limit: 100 }),
        roomService.getRooms({ status: 'AVAILABLE', limit: 100 }),
        publicService.getDoctors(),
      ]);

      if (patRes.status === 'fulfilled' && patRes.value?.data) {
        const list = patRes.value.data.patients || patRes.value.data || [];
        setPatients(list);
        if (list.length > 0) setPatientId(String(list[0].id));
      }

      if (roomRes.status === 'fulfilled' && roomRes.value?.data) {
        const rList = roomRes.value.data.rooms || roomRes.value.data || [];
        setRooms(rList);
        if (rList.length > 0) setRoomId(String(rList[0].id));
      }

      if (docRes.status === 'fulfilled' && docRes.value?.data?.doctors) {
        const dList = docRes.value.data.doctors;
        setDoctors(dList);
        if (dList.length > 0) setDoctorId(String(dList[0].id));
      }
    } catch (err) {
      console.log('Error loading initial data for CheckIn:', err.message);
    } finally {
      setLoadingInitial(false);
    }
  };

  const handleSubmit = async () => {
    if (!patientId || !roomId || !doctorId) {
      const msg = 'Mohon lengkapi Pasien, Kamar Perawatan, dan Dokter DPJP.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
      else Alert.alert('Validasi', msg);
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        patientId: parseInt(patientId),
        roomId: parseInt(roomId),
        doctorId: parseInt(doctorId),
        initialDiagnosis: initialDiagnosis.trim() || 'Rujukan rawat inap bangsal',
        depositAmount: depositAmount ? parseFloat(depositAmount) : 0,
        notes: notes.trim() || null,
      };

      await inpatientService.checkIn(payload);

      const msg = '✅ Pasien berhasil di-Check-In ke kamar rawat inap!';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
      else Alert.alert('Berhasil', msg);

      navigation.navigate('Inpatients', { refresh: true });
    } catch (err) {
      console.log('Error checking in patient:', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Gagal melakukan check-in rawat inap.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(`❌ ${errorMsg}`);
      else Alert.alert('Error', errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPatientObj = patients.find((p) => String(p.id) === String(patientId));
  const selectedRoomObj = rooms.find((r) => String(r.id) === String(roomId));
  const selectedDoctorObj = doctors.find((d) => String(d.id) === String(doctorId));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Batal</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Check-In Rawat Inap Baru</Text>
        <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.saveHeaderBtnText}>{submitting ? '...' : 'Simpan'}</Text>
        </TouchableOpacity>
      </View>

      {loadingInitial ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Memuat data pasien, kamar & dokter DPJP...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Card 1: Data Admisi Pasien & Kamar */}
          <View style={styles.card}>
            <Text style={styles.label}>Pilih Pasien Rawat Inap *</Text>
            <TouchableOpacity
              style={styles.selectBox}
              onPress={() => {
                setShowPatientDropdown(!showPatientDropdown);
                setShowRoomDropdown(false);
                setShowDoctorDropdown(false);
              }}
            >
              <Text style={styles.selectBoxText}>
                {selectedPatientObj ? `👤 ${selectedPatientObj.name} (${selectedPatientObj.medicalRecordNo || 'No.RM'})` : 'Pilih Pasien'}
              </Text>
              <Text style={styles.selectArrow}>{showPatientDropdown ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showPatientDropdown && (
              <View style={styles.dropdownContainer}>
                {patients.map((pat) => (
                  <TouchableOpacity
                    key={pat.id}
                    style={[styles.dropdownItem, String(patientId) === String(pat.id) && styles.dropdownItemActive]}
                    onPress={() => {
                      setPatientId(String(pat.id));
                      setShowPatientDropdown(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, String(patientId) === String(pat.id) && styles.dropdownItemTextActive]}>
                      👤 {pat.name} - {pat.medicalRecordNo || 'RM'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.label}>Pilih Kamar Perawatan (Tersedia) *</Text>
            <TouchableOpacity
              style={styles.selectBox}
              onPress={() => {
                setShowRoomDropdown(!showRoomDropdown);
                setShowPatientDropdown(false);
                setShowDoctorDropdown(false);
              }}
            >
              <Text style={styles.selectBoxText}>
                {selectedRoomObj ? `🛏️ Kamar ${selectedRoomObj.roomNumber} (${selectedRoomObj.roomType}) - Rp ${Number(selectedRoomObj.pricePerDay).toLocaleString('id-ID')}/Hari` : 'Pilih Kamar Available'}
              </Text>
              <Text style={styles.selectArrow}>{showRoomDropdown ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showRoomDropdown && (
              <View style={styles.dropdownContainer}>
                {rooms.length === 0 ? (
                  <View style={{ padding: 12 }}>
                    <Text style={{ fontSize: 12, color: '#EF4444' }}>⚠️ Tidak ada kamar dengan status AVAILABLE.</Text>
                  </View>
                ) : (
                  rooms.map((rm) => (
                    <TouchableOpacity
                      key={rm.id}
                      style={[styles.dropdownItem, String(roomId) === String(rm.id) && styles.dropdownItemActive]}
                      onPress={() => {
                        setRoomId(String(rm.id));
                        setShowRoomDropdown(false);
                      }}
                    >
                      <Text style={[styles.dropdownItemText, String(roomId) === String(rm.id) && styles.dropdownItemTextActive]}>
                        🛏️ Kamar {rm.roomNumber} ({rm.roomType}) - Rp {Number(rm.pricePerDay).toLocaleString('id-ID')}/Hari
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}

            <Text style={styles.label}>Dokter Penanggung Jawab (DPJP) *</Text>
            <TouchableOpacity
              style={styles.selectBox}
              onPress={() => {
                setShowDoctorDropdown(!showDoctorDropdown);
                setShowPatientDropdown(false);
                setShowRoomDropdown(false);
              }}
            >
              <Text style={styles.selectBoxText}>
                {selectedDoctorObj ? `👨‍⚕️ ${selectedDoctorObj.name} (${selectedDoctorObj.department || 'Spesialis'})` : 'Pilih Dokter DPJP'}
              </Text>
              <Text style={styles.selectArrow}>{showDoctorDropdown ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showDoctorDropdown && (
              <View style={styles.dropdownContainer}>
                {doctors.map((doc) => (
                  <TouchableOpacity
                    key={doc.id}
                    style={[styles.dropdownItem, String(doctorId) === String(doc.id) && styles.dropdownItemActive]}
                    onPress={() => {
                      setDoctorId(String(doc.id));
                      setShowDoctorDropdown(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, String(doctorId) === String(doc.id) && styles.dropdownItemTextActive]}>
                      👨‍⚕️ {doc.name} ({doc.department || 'Spesialis'})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Card 2: Diagnosis Masuk & Uang Muka */}
          <View style={styles.card}>
            <Text style={styles.label}>Diagnosis Masuk Rawat Inap (Initial Diagnosis)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Contoh: Demam Berdarah Dengue (DBD) Grade II, Obstruksi Usus, dll."
              multiline
              numberOfLines={3}
              value={initialDiagnosis}
              onChangeText={setInitialDiagnosis}
            />

            <Text style={styles.label}>Deposit Uang Muka (Rp Opsional)</Text>
            <TextInput
              style={styles.input}
              placeholder="1000000"
              keyboardType="numeric"
              value={depositAmount}
              onChangeText={setDepositAmount}
            />

            <Text style={styles.label}>Catatan Tambahan Admisi Bangsal</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Kebutuhan khusus pasien, pendamping keluarga, atau instruksi diet..."
              multiline
              numberOfLines={2}
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>🏥 Check-In & Alokasi Kamar Pasien</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
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
  saveHeaderBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: RADII.sm,
  },
  saveHeaderBtnText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 12,
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADII.lg,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
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
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  selectBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: RADII.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
  selectBoxText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  selectArrow: {
    fontSize: 12,
    color: '#64748B',
  },
  dropdownContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: RADII.md,
    marginBottom: 12,
    maxHeight: 180,
    ...SHADOWS.md,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemActive: {
    backgroundColor: '#EFF6FF',
  },
  dropdownItemText: {
    fontSize: 12,
    color: '#334155',
  },
  dropdownItemTextActive: {
    fontWeight: '800',
    color: '#2563EB',
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADII.md,
    alignItems: 'center',
    marginTop: 8,
    ...SHADOWS.md,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
