import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { COLORS, RADII, SHADOWS } from '../../constants/theme';
import { polyclinicService } from '../../services/api';

const AVAILABLE_ICONS = [
  { name: 'Stethoscope', icon: '🏥', label: 'Stetoskop' },
  { name: 'HeartPulse', icon: '🩺', label: 'Denyut Jantung' },
  { name: 'Users', icon: '👶', label: 'Anak & Kebidanan' },
  { name: 'Heart', icon: '🤰', label: 'Kandungan / Obgyn' },
  { name: 'Activity', icon: '❤️', label: 'Jantung & Kardio' },
  { name: 'Brain', icon: '🧠', label: 'Saraf & Stroke' },
  { name: 'Pill', icon: '💊', label: 'Obat & Farmasi' },
  { name: 'Building2', icon: '🏢', label: 'Gedung / RS' },
  { name: 'Car', icon: '🚑', label: 'UGD & Ambulans' },
];

export const PolyclinicFormScreen = ({ route, navigation }) => {
  const polyData = route.params?.polyclinicData || null;
  const isEdit = !!polyData;

  const [name, setName] = useState(polyData?.name || '');
  const [englishName, setEnglishName] = useState(polyData?.englishName || '');
  const [code, setCode] = useState(polyData?.code || '');
  const [description, setDescription] = useState(polyData?.description || '');
  const [englishDescription, setEnglishDescription] = useState(polyData?.englishDescription || '');
  const [servicesInput, setServicesInput] = useState(
    Array.isArray(polyData?.services) ? polyData.services.join(', ') : polyData?.services || ''
  );
  const [icon, setIcon] = useState(polyData?.icon || 'Stethoscope');
  const [isActive, setIsActive] = useState(polyData ? polyData.isActive !== false : true);
  const [sortOrder, setSortOrder] = useState(String(polyData?.sortOrder || 1));
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      const msg = 'Mohon isi Nama Poliklinik.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
      else Alert.alert('Validasi', msg);
      return;
    }

    try {
      setSubmitting(true);
      const servicesArray = servicesInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        name: name.trim(),
        englishName: englishName.trim() || null,
        code: code.trim().toUpperCase() || null,
        description: description.trim() || null,
        englishDescription: englishDescription.trim() || null,
        services: servicesArray,
        icon,
        color: 'bg-blue-50 text-[#0052CC] border-blue-200',
        isActive,
        sortOrder: parseInt(sortOrder) || 1,
      };

      if (isEdit) {
        await polyclinicService.updatePolyclinic(polyData.id, payload);
      } else {
        await polyclinicService.createPolyclinic(payload);
      }

      const msg = isEdit ? '✅ Poliklinik berhasil diperbarui!' : '✅ Poliklinik baru berhasil ditambahkan!';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
      else Alert.alert('Berhasil', msg);

      navigation.navigate('Polyclinics', { refresh: true });
    } catch (err) {
      console.log('Polyclinic save error:', err);
      const errorMsg = err.response?.data?.error || 'Gagal menyimpan data poliklinik.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(`❌ ${errorMsg}`);
      else Alert.alert('Error', errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Batal</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Poliklinik' : 'Tambah Poliklinik'}</Text>
        <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.saveHeaderBtnText}>{submitting ? '...' : 'Simpan'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Nama & Nama Bahasa Inggris */}
        <View style={styles.card}>
          <Text style={styles.label}>Nama Poliklinik (Bahasa Indonesia) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: Poli Penyakit Dalam"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Nama Poliklinik (English Name)</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: Internal Medicine Clinic"
            value={englishName}
            onChangeText={setEnglishName}
          />

          <Text style={styles.label}>Kode Unit Poliklinik</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: POLI-INT"
            autoCapitalize="characters"
            value={code}
            onChangeText={setCode}
          />
        </View>

        {/* Deskripsi (ID & EN) */}
        <View style={styles.card}>
          <Text style={styles.label}>Deskripsi Layanan (Bahasa Indonesia)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Deskripsi singkat mengenai poliklinik spesialis ini..."
            multiline
            numberOfLines={3}
            value={description}
            onChangeText={setDescription}
          />

          <Text style={styles.label}>Deskripsi Layanan (English Description)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Short overview of this specialty clinic..."
            multiline
            numberOfLines={3}
            value={englishDescription}
            onChangeText={setEnglishDescription}
          />
        </View>

        {/* Layanan Spesialis (Comma separated) */}
        <View style={styles.card}>
          <Text style={styles.label}>Layanan Spesialis Unggulan</Text>
          <Text style={styles.subLabel}>Pisahkan setiap poin layanan menggunakan tanda koma (,)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Konsultasi Senior, Pemeriksaan EKG, USG Abdomen"
            multiline
            numberOfLines={2}
            value={servicesInput}
            onChangeText={setServicesInput}
          />
        </View>

        {/* Pilihan Ikon */}
        <View style={styles.card}>
          <Text style={styles.label}>Pilih Ikon Visual</Text>
          <View style={styles.iconGrid}>
            {AVAILABLE_ICONS.map((item) => {
              const isSelected = icon === item.name;
              return (
                <TouchableOpacity
                  key={item.name}
                  style={[styles.iconChip, isSelected && styles.iconChipSelected]}
                  onPress={() => setIcon(item.name)}
                >
                  <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                  <Text style={[styles.iconLabel, isSelected && styles.iconLabelSelected]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Status Aktif & Sort Order */}
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchTitle}>Status Operasional Aktif</Text>
              <Text style={styles.switchSub}>Poliklinik akan tampil di pendaftaran landing page & mobile.</Text>
            </View>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: '#CBD5E1', true: '#BFDBFE' }}
              thumbColor={isActive ? COLORS.primary : '#94A3B8'}
            />
          </View>

          <View style={{ marginTop: 12 }}>
            <Text style={styles.label}>Urutan Tampilan (Sort Order)</Text>
            <TextInput
              style={styles.input}
              placeholder="1"
              keyboardType="numeric"
              value={sortOrder}
              onChangeText={setSortOrder}
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>{isEdit ? '💾 Simpan Perubahan' : '➕ Tambah Poliklinik Baru'}</Text>
          )}
        </TouchableOpacity>
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
  subLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 6,
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
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  iconChip: {
    width: '31%',
    backgroundColor: '#F8FAFC',
    borderRadius: RADII.md,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconChipSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
    borderWidth: 2,
  },
  iconLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  iconLabelSelected: {
    color: '#2563EB',
    fontWeight: '800',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  switchSub: {
    fontSize: 11,
    color: '#64748B',
    maxWidth: 220,
    marginTop: 2,
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
