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
import { userService, publicService, polyclinicService } from '../../services/api';

const ROLE_OPTIONS = [
  { label: '👑 ADMINISTRATOR', value: 'ADMIN' },
  { label: '👨‍⚕️ DOKTER SPESIALIS', value: 'DOCTOR' },
  { label: '👩‍⚕️ PERAWAT', value: 'NURSE' },
  { label: '🏥 FRONT DESK / KASIR', value: 'FRONT_DESK' },
  { label: '💊 APOTEKER / FARMASI', value: 'PHARMACY' },
  { label: '🔬 ANALIS LAB', value: 'LABORATORY' },
];

export const UserFormScreen = ({ route, navigation }) => {
  const userData = route.params?.userData || null;
  const isEdit = !!userData;

  const [name, setName] = useState(userData?.name || '');
  const [email, setEmail] = useState(userData?.email || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(userData?.role || 'FRONT_DESK');
  const [department, setDepartment] = useState(userData?.department || '');
  const [phone, setPhone] = useState(userData?.phone || '');

  const [polyclinics, setPolyclinics] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Dropdowns
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);

  useEffect(() => {
    loadPolyclinics();
  }, []);

  const loadPolyclinics = async () => {
    try {
      setLoadingInitial(true);
      const res = await publicService.getPolyclinics().catch(() => polyclinicService.getPolyclinics());
      const list = res?.data?.polyclinics || res?.data || res?.polyclinics || [];
      setPolyclinics(list);
      if (!isEdit && list.length > 0 && !department) {
        setDepartment(list[0].name);
      }
    } catch (err) {
      console.log('Error loading polyclinics for UserForm:', err.message);
    } finally {
      setLoadingInitial(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || (!isEdit && !password.trim())) {
      const msg = 'Mohon isi Nama Lengkap, Email Login, dan Password.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
      else Alert.alert('Validasi', msg);
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: role,
        department: department.trim() || null,
        phone: phone.trim() || null,
      };

      if (password.trim()) {
        payload.password = password.trim();
      }

      if (isEdit) {
        await userService.updateUser(userData.id, payload);
      } else {
        await userService.createUser(payload);
      }

      const msg = isEdit ? '✅ Data pengguna berhasil diperbarui!' : '✅ Pengguna baru berhasil ditambahkan!';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
      else Alert.alert('Berhasil', msg);

      navigation.navigate('Users', { refresh: true });
    } catch (err) {
      console.log('Error saving user:', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Gagal menyimpan pengguna.';
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
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Akun Staff' : 'Tambah Staff Baru'}</Text>
        <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.saveHeaderBtnText}>{submitting ? '...' : 'Simpan'}</Text>
        </TouchableOpacity>
      </View>

      {loadingInitial ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Memuat departemen poliklinik...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Card Form */}
          <View style={styles.card}>
            <Text style={styles.label}>Nama Lengkap *</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: dr. Ahmad Subagyo, Sp.PD"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Alamat Email Login *</Text>
            <TextInput
              style={styles.input}
              placeholder="ahmad@rumahsakit.id"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.label}>{isEdit ? 'Password Baru (Kosongkan jika tidak diubah)' : 'Password Login *'}</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <Text style={styles.label}>Peran Hak Akses (Role) *</Text>
            <TouchableOpacity
              style={styles.selectBox}
              onPress={() => {
                setShowRoleDropdown(!showRoleDropdown);
                setShowDeptDropdown(false);
              }}
            >
              <Text style={styles.selectBoxText}>
                {ROLE_OPTIONS.find((r) => r.value === role)?.label || role}
              </Text>
              <Text style={styles.selectArrow}>{showRoleDropdown ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showRoleDropdown && (
              <View style={styles.dropdownContainer}>
                {ROLE_OPTIONS.map((r) => (
                  <TouchableOpacity
                    key={r.value}
                    style={[styles.dropdownItem, role === r.value && styles.dropdownItemActive]}
                    onPress={() => {
                      setRole(r.value);
                      setShowRoleDropdown(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, role === r.value && styles.dropdownItemTextActive]}>
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.label}>Departemen / Poliklinik *</Text>
            <TouchableOpacity
              style={styles.selectBox}
              onPress={() => {
                setShowDeptDropdown(!showDeptDropdown);
                setShowRoleDropdown(false);
              }}
            >
              <Text style={styles.selectBoxText}>{department || 'Pilih Departemen'}</Text>
              <Text style={styles.selectArrow}>{showDeptDropdown ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showDeptDropdown && (
              <View style={styles.dropdownContainer}>
                {polyclinics.map((poly) => (
                  <TouchableOpacity
                    key={poly.id}
                    style={[styles.dropdownItem, department === poly.name && styles.dropdownItemActive]}
                    onPress={() => {
                      setDepartment(poly.name);
                      setShowDeptDropdown(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, department === poly.name && styles.dropdownItemTextActive]}>
                      🏛️ {poly.name} ({poly.code})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.label}>Nomor Telepon / WhatsApp</Text>
            <TextInput
              style={styles.input}
              placeholder="08123456789"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>{isEdit ? '💾 Simpan Perubahan Akun' : '➕ Tambah Staff Baru'}</Text>
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
