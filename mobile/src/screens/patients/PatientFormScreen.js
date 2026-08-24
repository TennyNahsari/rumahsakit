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
import { patientService } from '../../services/api';

export const PatientFormScreen = ({ route, navigation }) => {
  const { id } = route.params || {};
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  // Form States matching website PatientForm.jsx
  const [formData, setFormData] = useState({
    name: '',
    nik: '',
    dateOfBirth: '',
    gender: 'MALE',
    phone: '',
    email: '',
    address: '',
    city: '',
    bloodType: 'A',
    religion: 'Islam',
    maritalStatus: 'SINGLE',
    emergencyContactName: '',
    emergencyContactRel: '',
    emergencyContactPhone: '',
    insuranceType: 'UMUM',
    insuranceNumber: '',
    allergies: '',
    medicalHistory: '',
  });

  useEffect(() => {
    if (isEdit) {
      fetchPatient();
    }
  }, [id]);

  const fetchPatient = async () => {
    try {
      setFetching(true);
      const res = await patientService.getPatientById(id);
      const p = res?.data?.patient || res?.data;
      if (p) {
        setFormData({
          name: p.name || '',
          nik: p.nik || '',
          dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split('T')[0] : '',
          gender: p.gender || 'MALE',
          phone: p.phone || '',
          email: p.email || '',
          address: p.address || '',
          city: p.city || '',
          bloodType: p.bloodType || 'A',
          religion: p.religion || 'Islam',
          maritalStatus: p.maritalStatus || 'SINGLE',
          emergencyContactName: p.emergencyContactName || '',
          emergencyContactRel: p.emergencyContactRel || '',
          emergencyContactPhone: p.emergencyContactPhone || '',
          insuranceType: p.insuranceType || 'UMUM',
          insuranceNumber: p.insuranceNumber || '',
          allergies: p.allergies || '',
          medicalHistory: p.medicalHistory || '',
        });
      }
    } catch (err) {
      Alert.alert('Error', 'Gagal mengambil data pasien untuk diedit.');
      navigation.goBack();
    } finally {
      setFetching(false);
    }
  };

  const updateField = (key, val) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.dateOfBirth) {
      Alert.alert('Form Belum Lengkap', 'Mohon isi Nama Lengkap Pasien dan Tanggal Lahir (YYYY-MM-DD).');
      return;
    }

    try {
      setLoading(true);
      if (isEdit) {
        await patientService.updatePatient(id, formData);
        Alert.alert('Sukses', 'Data pasien berhasil diperbarui!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        const res = await patientService.createPatient(formData);
        if (res?.data) {
          Alert.alert(
            '🎫 Pasien Terdaftar!',
            `Nomor Rekam Medis Pasien: ${res.data.medicalRecordNo || 'MRN-NEW'}\n\nData pasien baru berhasil tersimpan.`,
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        }
      }
    } catch (err) {
      console.log('Submit patient error:', err);
      Alert.alert('Gagal Simpan', err.response?.data?.error || 'Gagal menyimpan data pasien.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <SafeAreaView style={[styles.container, styles.centerBox]}>
        <ActivityIndicator size="large" color={COLORS.primary600} />
        <Text style={styles.loadingText}>Memuat Data Pasien...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Top Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Batal</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Data Pasien' : 'Registrasi Pasien Baru'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.formScrollView} showsVerticalScrollIndicator={false}>
          {/* Section 1: Data Identitas Pasien */}
          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>👤 Identitas Pasien</Text>

            <Text style={styles.label}>Nama Lengkap Pasien *</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Budi Santoso"
              value={formData.name}
              onChangeText={(v) => updateField('name', v)}
            />

            <Text style={styles.label}>No. KTP / NIK (16 Digit)</Text>
            <TextInput
              style={styles.input}
              placeholder="327120000000000"
              keyboardType="number-pad"
              value={formData.nik}
              onChangeText={(v) => updateField('nik', v)}
            />

            <Text style={styles.label}>Tanggal Lahir (YYYY-MM-DD) *</Text>
            <TextInput
              style={styles.input}
              placeholder="1990-05-15"
              value={formData.dateOfBirth}
              onChangeText={(v) => updateField('dateOfBirth', v)}
            />

            <Text style={styles.label}>Jenis Kelamin *</Text>
            <View style={styles.radioRow}>
              {[
                { label: 'Laki-Laki', val: 'MALE' },
                { label: 'Perempuan', val: 'FEMALE' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.val}
                  style={[styles.radioChip, formData.gender === item.val && styles.radioChipActive]}
                  onPress={() => updateField('gender', item.val)}
                >
                  <Text style={[styles.radioChipText, formData.gender === item.val && styles.radioChipTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Golongan Darah</Text>
            <View style={styles.radioRow}>
              {['A', 'B', 'AB', 'O'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.radioChip, formData.bloodType === type && styles.radioChipActive]}
                  onPress={() => updateField('bloodType', type)}
                >
                  <Text style={[styles.radioChipText, formData.bloodType === type && styles.radioChipTextActive]}>
                    Gol {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Section 2: Kontak & Alamat */}
          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>📞 Kontak & Alamat</Text>

            <Text style={styles.label}>No. Telepon / WhatsApp</Text>
            <TextInput
              style={styles.input}
              placeholder="081234567890"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(v) => updateField('phone', v)}
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="budi@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={(v) => updateField('email', v)}
            />

            <Text style={styles.label}>Alamat Tempat Tinggal</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Jl. Merdeka No. 12"
              multiline={true}
              numberOfLines={2}
              value={formData.address}
              onChangeText={(v) => updateField('address', v)}
            />

            <Text style={styles.label}>Kota / Kabupaten</Text>
            <TextInput
              style={styles.input}
              placeholder="Jakarta Selatan"
              value={formData.city}
              onChangeText={(v) => updateField('city', v)}
            />
          </View>

          {/* Section 3: Kontak Darurat */}
          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>🚨 Kontak Darurat</Text>

            <Text style={styles.label}>Nama Penanggung Jawab</Text>
            <TextInput
              style={styles.input}
              placeholder="Siti Aminah"
              value={formData.emergencyContactName}
              onChangeText={(v) => updateField('emergencyContactName', v)}
            />

            <Text style={styles.label}>Hubungan (Istri/Suami/Orang Tua/Saudara)</Text>
            <TextInput
              style={styles.input}
              placeholder="Istri"
              value={formData.emergencyContactRel}
              onChangeText={(v) => updateField('emergencyContactRel', v)}
            />

            <Text style={styles.label}>Telepon Darurat</Text>
            <TextInput
              style={styles.input}
              placeholder="081987654321"
              keyboardType="phone-pad"
              value={formData.emergencyContactPhone}
              onChangeText={(v) => updateField('emergencyContactPhone', v)}
            />
          </View>

          {/* Section 4: Penjamin / Asuransi */}
          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>💳 Penjamin & BPJS</Text>

            <Text style={styles.label}>Jenis Pembayaran</Text>
            <View style={styles.radioRow}>
              {[
                { label: 'Umum / Mandiri', val: 'UMUM' },
                { label: 'BPJS Kesehatan', val: 'BPJS' },
                { label: 'Asuransi Swasta', val: 'ASURANSI' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.val}
                  style={[styles.radioChip, formData.insuranceType === item.val && styles.radioChipActive]}
                  onPress={() => updateField('insuranceType', item.val)}
                >
                  <Text style={[styles.radioChipText, formData.insuranceType === item.val && styles.radioChipTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Nomor Kartu BPJS / Asuransi</Text>
            <TextInput
              style={styles.input}
              placeholder="0001234567890"
              value={formData.insuranceNumber}
              onChangeText={(v) => updateField('insuranceNumber', v)}
            />
          </View>

          {/* Section 5: Riwayat Alergi & Medis */}
          <View style={[styles.formCard, { marginBottom: 20 }]}>
            <Text style={styles.cardTitle}>⚠️ Catatan Alergi & Riwayat Medis</Text>

            <Text style={styles.label}>Riwayat Alergi Obat / Makanan</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Alergi Obat Penicillin, Makanan Laut..."
              multiline={true}
              numberOfLines={2}
              value={formData.allergies}
              onChangeText={(v) => updateField('allergies', v)}
            />

            <Text style={styles.label}>Riwayat Penyakit Dahulu</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Hipertensi, Diabetes Mellitus Tipe 2..."
              multiline={true}
              numberOfLines={2}
              value={formData.medicalHistory}
              onChangeText={(v) => updateField('medicalHistory', v)}
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
            <Text style={styles.submitBtnText}>{isEdit ? 'Simpan Perubahan Pasien →' : 'Daftarkan Pasien Baru →'}</Text>
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
    marginBottom: 16,
    ...SHADOWS.sm,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 10,
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
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  radioRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  radioChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#F8FAFC',
  },
  radioChipActive: {
    backgroundColor: COLORS.primary50,
    borderColor: COLORS.primary600,
  },
  radioChipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  radioChipTextActive: {
    color: COLORS.primary600,
    fontWeight: '800',
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
