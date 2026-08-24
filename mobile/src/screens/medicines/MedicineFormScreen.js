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
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { COLORS, RADII, SHADOWS } from '../../constants/theme';
import { medicineService } from '../../services/api';

const CATEGORY_OPTIONS = [
  'Obat Bebas',
  'Obat Bebas Terbatas',
  'Obat Keras',
  'Narkotika & Psikotropika',
  'Alat Kesehatan (Alkes)',
  'Lainnya',
];

const UNIT_OPTIONS = [
  'Tablet',
  'Kapsul',
  'Botol',
  'Strip',
  'Box',
  'Ampul',
  'Pcs',
  'Tube',
];

export const MedicineFormScreen = ({ route, navigation }) => {
  const medData = route.params?.medicineData || null;
  const isEdit = !!medData;

  const [name, setName] = useState(medData?.name || '');
  const [code, setCode] = useState(medData?.code || '');
  const [category, setCategory] = useState(medData?.category || 'Obat Bebas');
  const [unit, setUnit] = useState(medData?.unit || 'Tablet');
  const [price, setPrice] = useState(medData?.price ? String(medData.price) : '');
  const [description, setDescription] = useState(medData?.description || '');
  const [submitting, setSubmitting] = useState(false);

  // Dropdowns
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !unit || !price) {
      const msg = 'Mohon isi Nama Obat, Satuan, dan Harga HET.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
      else Alert.alert('Validasi', msg);
      return;
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      const msg = 'Harga HET harus berupa angka positif.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
      else Alert.alert('Validasi', msg);
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        name: name.trim(),
        code: code.trim().toUpperCase() || null,
        category: category || 'Obat Bebas',
        unit: unit.trim() || 'Tablet',
        price: numPrice,
        description: description.trim() || null,
      };

      if (isEdit) {
        await medicineService.updateMedicine(medData.id, payload);
      } else {
        await medicineService.createMedicine(payload);
      }

      const msg = isEdit ? '✅ Data obat berhasil diperbarui!' : '✅ Data obat baru berhasil ditambahkan!';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
      else Alert.alert('Berhasil', msg);

      navigation.navigate('Medicines', { refresh: true });
    } catch (err) {
      console.log('Error saving medicine:', err);
      const errorMsg = err.response?.data?.error || 'Gagal menyimpan data obat.';
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
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Data Obat' : 'Tambah Obat Baru'}</Text>
        <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.saveHeaderBtnText}>{submitting ? '...' : 'Simpan'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Form Card */}
        <View style={styles.card}>
          <Text style={styles.label}>Nama Obat / Sediaan *</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: Paracetamol 500mg"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Kode Obat (SKU / Barcode)</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: OBT-PCT-500"
            autoCapitalize="characters"
            value={code}
            onChangeText={setCode}
          />

          <Text style={styles.label}>Kategori Farmasi *</Text>
          <TouchableOpacity
            style={styles.selectBox}
            onPress={() => {
              setShowCategoryDropdown(!showCategoryDropdown);
              setShowUnitDropdown(false);
            }}
          >
            <Text style={styles.selectBoxText}>{category}</Text>
            <Text style={styles.selectArrow}>{showCategoryDropdown ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showCategoryDropdown && (
            <View style={styles.dropdownContainer}>
              {CATEGORY_OPTIONS.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.dropdownItem, category === cat && styles.dropdownItemActive]}
                  onPress={() => {
                    setCategory(cat);
                    setShowCategoryDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, category === cat && styles.dropdownItemTextActive]}>
                    {cat} {category === cat ? '✓' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Satuan Kemasan *</Text>
          <TouchableOpacity
            style={styles.selectBox}
            onPress={() => {
              setShowUnitDropdown(!showUnitDropdown);
              setShowCategoryDropdown(false);
            }}
          >
            <Text style={styles.selectBoxText}>{unit}</Text>
            <Text style={styles.selectArrow}>{showUnitDropdown ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showUnitDropdown && (
            <View style={styles.dropdownContainer}>
              {UNIT_OPTIONS.map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[styles.dropdownItem, unit === u && styles.dropdownItemActive]}
                  onPress={() => {
                    setUnit(u);
                    setShowUnitDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, unit === u && styles.dropdownItemTextActive]}>
                    {u} {unit === u ? '✓' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Harga HET / Satuan (Rp) *</Text>
          <TextInput
            style={styles.input}
            placeholder="15000"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />

          <Text style={styles.label}>Deskripsi & Petunjuk Pakai</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Keterangan dosis umum, indikasi obat, dan efek samping..."
            multiline
            numberOfLines={3}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>{isEdit ? '💾 Simpan Perubahan Obat' : '➕ Tambah Obat Baru'}</Text>
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
