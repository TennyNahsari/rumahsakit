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
import { recordService, patientService, publicService } from '../../services/api';

export const RecordFormScreen = ({ route, navigation }) => {
  const recData = route.params?.recordData || null;
  const isEdit = !!recData;

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [patientId, setPatientId] = useState(String(recData?.patientId || ''));
  const [doctorId, setDoctorId] = useState(String(recData?.doctorId || ''));
  const [visitId, setVisitId] = useState(recData?.visitId ? String(recData.visitId) : '');
  const [diagnosisCode, setDiagnosisCode] = useState(recData?.diagnosisCode || '');
  const [diagnosis, setDiagnosis] = useState(recData?.diagnosis || '');
  const [symptoms, setSymptoms] = useState(recData?.symptoms || '');
  const [treatment, setTreatment] = useState(recData?.treatment || '');

  // Prescription List items state
  const [prescriptionItems, setPrescriptionItems] = useState(() => {
    if (recData?.prescription) {
      if (Array.isArray(recData.prescription)) return recData.prescription;
      if (typeof recData.prescription === 'string') {
        try { return JSON.parse(recData.prescription); } catch (e) {}
      }
    }
    return [{ medicineName: '', dosage: '', frequency: '' }];
  });

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Dropdown UI visibility states
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoadingInitial(true);
      const [patRes, docRes] = await Promise.allSettled([
        patientService.getPatients({ limit: 100 }),
        publicService.getDoctors(),
      ]);

      if (patRes.status === 'fulfilled' && patRes.value?.data) {
        const list = patRes.value.data.patients || patRes.value.data || [];
        setPatients(list);
        if (!isEdit && list.length > 0 && !patientId) {
          setPatientId(String(list[0].id));
        }
      }

      if (docRes.status === 'fulfilled' && docRes.value?.data?.doctors) {
        const dList = docRes.value.data.doctors;
        setDoctors(dList);
        if (!isEdit && dList.length > 0 && !doctorId) {
          setDoctorId(String(dList[0].id));
        }
      }
    } catch (err) {
      console.log('Error loading initial data for RecordForm:', err.message);
    } finally {
      setLoadingInitial(false);
    }
  };

  const handleAddRxItem = () => {
    setPrescriptionItems([...prescriptionItems, { medicineName: '', dosage: '', frequency: '' }]);
  };

  const handleRemoveRxItem = (index) => {
    const updated = prescriptionItems.filter((_, i) => i !== index);
    setPrescriptionItems(updated.length > 0 ? updated : [{ medicineName: '', dosage: '', frequency: '' }]);
  };

  const handleRxChange = (index, field, value) => {
    const updated = [...prescriptionItems];
    updated[index][field] = value;
    setPrescriptionItems(updated);
  };

  const handleSubmit = async () => {
    if (!patientId || !doctorId || !diagnosis.trim()) {
      const msg = 'Mohon lengkapi Pasien, Dokter Pemeriksa, dan Diagnosis Utama.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
      else Alert.alert('Validasi', msg);
      return;
    }

    try {
      setSubmitting(true);

      const validRx = prescriptionItems.filter((item) => item.medicineName && item.medicineName.trim());

      const payload = {
        patientId: parseInt(patientId),
        doctorId: parseInt(doctorId),
        visitId: visitId ? parseInt(visitId) : null,
        diagnosisCode: diagnosisCode.trim().toUpperCase() || null,
        diagnosis: diagnosis.trim(),
        symptoms: symptoms.trim() || null,
        treatment: treatment.trim() || null,
        prescription: validRx.length > 0 ? validRx : null,
      };

      if (isEdit) {
        await recordService.updateRecord(recData.id, payload);
      } else {
        await recordService.createRecord(payload);
      }

      const msg = isEdit ? '✅ Rekam medis berhasil diperbarui!' : '✅ Rekam medis baru berhasil ditambahkan!';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
      else Alert.alert('Berhasil', msg);

      navigation.navigate('Records', { refresh: true });
    } catch (err) {
      console.log('Error saving record:', err);
      const errorMsg = err.response?.data?.error || 'Gagal menyimpan rekam medis.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(`❌ ${errorMsg}`);
      else Alert.alert('Error', errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPatientObj = patients.find((p) => String(p.id) === String(patientId));
  const selectedDoctorObj = doctors.find((d) => String(d.id) === String(doctorId));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Batal</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Rekam Medis' : 'Entri EMR Baru'}</Text>
        <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.saveHeaderBtnText}>{submitting ? '...' : 'Simpan'}</Text>
        </TouchableOpacity>
      </View>

      {loadingInitial ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Memuat data pasien & dokter...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Section 1: Pasien & Dokter */}
          <View style={styles.card}>
            <Text style={styles.label}>Pilih Pasien *</Text>
            <TouchableOpacity
              style={styles.selectBox}
              onPress={() => {
                setShowPatientDropdown(!showPatientDropdown);
                setShowDoctorDropdown(false);
              }}
            >
              <Text style={styles.selectBoxText}>
                {selectedPatientObj ? `${selectedPatientObj.name} (${selectedPatientObj.medicalRecordNo || 'No.RM'})` : 'Pilih Pasien'}
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

            <Text style={styles.label}>Dokter Pemeriksa *</Text>
            <TouchableOpacity
              style={styles.selectBox}
              onPress={() => {
                setShowDoctorDropdown(!showDoctorDropdown);
                setShowPatientDropdown(false);
              }}
            >
              <Text style={styles.selectBoxText}>
                {selectedDoctorObj ? `${selectedDoctorObj.name} (${selectedDoctorObj.department || 'Spesialis'})` : 'Pilih Dokter'}
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

          {/* Section 2: Anamnesis & Diagnosis */}
          <View style={styles.card}>
            <Text style={styles.label}>Kode Diagnosis ICD-10</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: I10, E11.9, J00"
              autoCapitalize="characters"
              value={diagnosisCode}
              onChangeText={setDiagnosisCode}
            />

            <Text style={styles.label}>Diagnosis Utama (Primary Diagnosis) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Hipertensi Primer / Essensial"
              value={diagnosis}
              onChangeText={setDiagnosis}
            />

            <Text style={styles.label}>Keluhan & Gejala (Anamnesis / Symptoms)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Deskripsi keluhan pasien, durasi gejala, dan riwayat alergi..."
              multiline
              numberOfLines={3}
              value={symptoms}
              onChangeText={setSymptoms}
            />

            <Text style={styles.label}>Penanganan & Tindakan Medis (Treatment)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tindakan medis yang diberikan, konsultasi, dan rekomendasi..."
              multiline
              numberOfLines={3}
              value={treatment}
              onChangeText={setTreatment}
            />
          </View>

          {/* Section 3: E-Resep / Resep Obat */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>E-Resep / Terapi Obat</Text>
              <TouchableOpacity style={styles.addRxBtn} onPress={handleAddRxItem}>
                <Text style={styles.addRxBtnText}>+ Obat</Text>
              </TouchableOpacity>
            </View>

            {prescriptionItems.map((item, idx) => (
              <View key={idx} style={styles.rxFormBox}>
                <View style={styles.rxFormTop}>
                  <Text style={styles.rxNumberText}>Item Obat #{idx + 1}</Text>
                  {prescriptionItems.length > 1 ? (
                    <TouchableOpacity onPress={() => handleRemoveRxItem(idx)}>
                      <Text style={{ fontSize: 12, color: '#EF4444', fontWeight: '800' }}>Hapus ✕</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Nama Obat (contoh: Amoxicillin 500mg)"
                  value={item.medicineName || item.medicine || ''}
                  onChangeText={(val) => handleRxChange(idx, 'medicineName', val)}
                />

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Dosis (10 Tablet)"
                    value={item.dosage || ''}
                    onChangeText={(val) => handleRxChange(idx, 'dosage', val)}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Aturan Pakai (3x1 Hari)"
                    value={item.frequency || ''}
                    onChangeText={(val) => handleRxChange(idx, 'frequency', val)}
                  />
                </View>
              </View>
            ))}
          </View>

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>{isEdit ? '💾 Simpan Perubahan EMR' : '➕ Simpan Rekam Medis'}</Text>
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
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
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
  addRxBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADII.sm,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  addRxBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
  },
  rxFormBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  rxFormTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  rxNumberText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
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
