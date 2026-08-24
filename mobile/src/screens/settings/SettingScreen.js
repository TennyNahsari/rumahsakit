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
  Switch,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, RADII, SHADOWS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

export const SettingScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security' | 'notifications' | 'hospital' | 'appearance'

  // Profile Form
  const [name, setName] = useState(user?.name || 'Administrator SIMRS');
  const [email, setEmail] = useState(user?.email || 'admin@klinik.com');
  const [phone, setPhone] = useState(user?.phone || '0812-3456-7890');
  const [department, setDepartment] = useState(user?.department || 'Manajemen Rumah Sakit');

  // Security Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notification Toggles
  const [emailNotif, setEmailNotif] = useState(true);
  const [waNotif, setWaNotif] = useState(true);
  const [appointmentReminder, setAppointmentReminder] = useState(true);
  const [billingAlert, setBillingAlert] = useState(true);

  // Hospital Info Form
  const [hospitalName, setHospitalName] = useState('Rumah Sakit Nahsari Medika');
  const [hospitalAddress, setHospitalAddress] = useState('Jl. Kesehatan No. 45, Jakarta Selatan');
  const [hospitalPhone, setHospitalPhone] = useState('(021) 555-1234 / Emergency 118');
  const [hospitalEmail, setHospitalEmail] = useState('info@nahsarimedika.go.id');

  // Language & Appearance
  const [language, setLanguage] = useState('id');

  useEffect(() => {
    loadSavedSettings();
  }, []);

  const loadSavedSettings = async () => {
    try {
      const savedLang = await AsyncStorage.getItem('app_language');
      if (savedLang) setLanguage(savedLang);
      const savedHospName = await AsyncStorage.getItem('hospital_name');
      if (savedHospName) setHospitalName(savedHospName);
    } catch (e) {
      console.log('Error loading saved settings:', e);
    }
  };

  const handleSaveProfile = () => {
    const msg = '✅ Profil staf berhasil diperbarui!';
    if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
    else Alert.alert('Berhasil', msg);
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword) {
      const msg = 'Mohon isi password saat ini dan password baru.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
      else Alert.alert('Validasi', msg);
      return;
    }
    if (newPassword !== confirmPassword) {
      const msg = 'Password baru dan konfirmasi password tidak cocok.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
      else Alert.alert('Validasi', msg);
      return;
    }
    const msg = '✅ Password berhasil diperbarui!';
    if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
    else Alert.alert('Berhasil', msg);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSaveHospital = async () => {
    try {
      await AsyncStorage.setItem('hospital_name', hospitalName);
      const msg = '✅ Pengaturan identitas Rumah Sakit berhasil disimpan!';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
      else Alert.alert('Berhasil', msg);
    } catch (e) {
      console.log('Save hospital error:', e);
    }
  };

  const handleSelectLanguage = async (langCode) => {
    try {
      setLanguage(langCode);
      await AsyncStorage.setItem('app_language', langCode);
      const msg = `✅ Bahasa sistem diubah ke ${langCode === 'id' ? 'Bahasa Indonesia' : 'English'}`;
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
      else Alert.alert('Bahasa', msg);
    } catch (e) {
      console.log('Set language error:', e);
    }
  };

  const handleLogout = () => {
    const doLogout = () => {
      logout();
      navigation.reset({ index: 0, routes: [{ name: 'Landing' }] });
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Keluar dari sesi akun SIMRS?')) {
        doLogout();
      }
    } else {
      Alert.alert('Konfirmasi Logout', 'Apakah Anda yakin ingin keluar dari sesi akun SIMRS?', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Keluar', style: 'destructive', onPress: doLogout },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary700} />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pengaturan & Konfigurasi</Text>
        <TouchableOpacity style={styles.logoutHeaderBtn} onPress={handleLogout}>
          <Text style={styles.logoutHeaderBtnText}>🚪 Keluar</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation Tab Bar */}
      <View style={styles.tabBarWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
          {[
            { key: 'profile', label: '👤 Profil Staf' },
            { key: 'security', label: '🔐 Keamanan' },
            { key: 'notifications', label: '🔔 Notifikasi' },
            { key: 'hospital', label: '🏥 Rumah Sakit' },
            { key: 'appearance', label: '🌐 Bahasa & Tampilan' },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabChip, isActive && styles.tabChipActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabChipText, isActive && styles.tabChipTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Tab 1: Profil Staf */}
        {activeTab === 'profile' && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={{ fontSize: 20, marginRight: 8 }}>👤</Text>
              <View>
                <Text style={styles.cardTitle}>Profil Pengguna SIMRS</Text>
                <Text style={styles.cardSub}>Perbarui data pribadi dan kontak penugasan Anda</Text>
              </View>
            </View>

            <Text style={styles.label}>Nama Lengkap Staf *</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />

            <Text style={styles.label}>Alamat Email Login *</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" />

            <Text style={styles.label}>Nomor Telepon / WhatsApp *</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

            <Text style={styles.label}>Departemen / Unit Medis *</Text>
            <TextInput style={styles.input} value={department} onChangeText={setDepartment} />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
              <Text style={styles.saveBtnText}>💾 Simpan Perubahan Profil</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tab 2: Keamanan & Password */}
        {activeTab === 'security' && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={{ fontSize: 20, marginRight: 8 }}>🔐</Text>
              <View>
                <Text style={styles.cardTitle}>Keamanan Akun & Kata Sandi</Text>
                <Text style={styles.cardSub}>Perbarui kata sandi untuk melindungi akses SIMRS</Text>
              </View>
            </View>

            <Text style={styles.label}>Password Saat Ini *</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />

            <Text style={styles.label}>Password Baru *</Text>
            <TextInput
              style={styles.input}
              placeholder="Minimal 6 karakter"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <Text style={styles.label}>Konfirmasi Password Baru *</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword}>
              <Text style={styles.saveBtnText}>🔒 Ubah Password</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tab 3: Notifikasi */}
        {activeTab === 'notifications' && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={{ fontSize: 20, marginRight: 8 }}>🔔</Text>
              <View>
                <Text style={styles.cardTitle}>Preferensi Notifikasi SIMRS</Text>
                <Text style={styles.cardSub}>Atur notifikasi pengingat & alert otomatis</Text>
              </View>
            </View>

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchTitle}>Notifikasi Email System</Text>
                <Text style={styles.switchSub}>Kirim email untuk laporan harian dan pembaruan sistem</Text>
              </View>
              <Switch value={emailNotif} onValueChange={setEmailNotif} trackColor={{ true: COLORS.primary }} />
            </View>

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchTitle}>Notifikasi WhatsApp & SMS Pasien</Text>
                <Text style={styles.switchSub}>Kirim pengingat antrean otomatis ke HP pasien</Text>
              </View>
              <Switch value={waNotif} onValueChange={setWaNotif} trackColor={{ true: COLORS.primary }} />
            </View>

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchTitle}>Alert Janji Dokter & Jadwal Visit</Text>
                <Text style={styles.switchSub}>Pengingat otomatis jadwal praktik dokter spesialis</Text>
              </View>
              <Switch value={appointmentReminder} onValueChange={setAppointmentReminder} trackColor={{ true: COLORS.primary }} />
            </View>

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchTitle}>Alert Kasir & Pembayaran Lunas</Text>
                <Text style={styles.switchSub}>Notifikasi saat invoice berhasil dilunasi</Text>
              </View>
              <Switch value={billingAlert} onValueChange={setBillingAlert} trackColor={{ true: COLORS.primary }} />
            </View>
          </View>
        )}

        {/* Tab 4: Identitas Rumah Sakit */}
        {activeTab === 'hospital' && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={{ fontSize: 20, marginRight: 8 }}>🏥</Text>
              <View>
                <Text style={styles.cardTitle}>Profil Identitas Rumah Sakit</Text>
                <Text style={styles.cardSub}>Informasi yang dicetak pada kuitansi dan rekam medis</Text>
              </View>
            </View>

            <Text style={styles.label}>Nama Resmi Rumah Sakit / Klinik *</Text>
            <TextInput style={styles.input} value={hospitalName} onChangeText={setHospitalName} />

            <Text style={styles.label}>Alamat Lengkap *</Text>
            <TextInput style={styles.input} value={hospitalAddress} onChangeText={setHospitalAddress} multiline numberOfLines={2} />

            <Text style={styles.label}>Nomor Telepon Layanan 24 Jam *</Text>
            <TextInput style={styles.input} value={hospitalPhone} onChangeText={setHospitalPhone} />

            <Text style={styles.label}>Email Kontak Utama *</Text>
            <TextInput style={styles.input} value={hospitalEmail} onChangeText={setHospitalEmail} keyboardType="email-address" />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveHospital}>
              <Text style={styles.saveBtnText}>🏬 Simpan Identitas Rumah Sakit</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tab 5: Bahasa & Tampilan */}
        {activeTab === 'appearance' && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={{ fontSize: 20, marginRight: 8 }}>🌐</Text>
              <View>
                <Text style={styles.cardTitle}>Pilihan Bahasa & Tampilan</Text>
                <Text style={styles.cardSub}>Sesuaikan bahasa dan format antarmuka SIMRS</Text>
              </View>
            </View>

            <Text style={styles.label}>Bahasa Sistem / App Language</Text>
            <View style={styles.langGrid}>
              <TouchableOpacity
                style={[styles.langChip, language === 'id' && styles.langChipActive]}
                onPress={() => handleSelectLanguage('id')}
              >
                <Text style={[styles.langChipText, language === 'id' && styles.langChipTextActive]}>
                  🇮🇩 Bahasa Indonesia (Indonesian)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.langChip, language === 'en' && styles.langChipActive]}
                onPress={() => handleSelectLanguage('en')}
              >
                <Text style={[styles.langChipText, language === 'en' && styles.langChipTextActive]}>
                  🇬🇧 English (US / UK)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Red Logout Big Card */}
        <TouchableOpacity style={styles.logoutBigCard} onPress={handleLogout}>
          <Text style={styles.logoutBigCardText}>🚪 Keluar dari Sesi Akun SIMRS</Text>
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
  logoutHeaderBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#EF4444',
    borderRadius: RADII.sm,
  },
  logoutHeaderBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  tabBarWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 8,
  },
  tabBar: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADII.sm,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  tabChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADII.lg,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
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
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADII.md,
    alignItems: 'center',
    marginTop: 12,
    ...SHADOWS.md,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  switchSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  langGrid: {
    gap: 8,
    marginTop: 6,
  },
  langChip: {
    padding: 12,
    borderRadius: RADII.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  langChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  langChipText: {
    fontSize: 13,
    color: '#334155',
  },
  langChipTextActive: {
    fontWeight: '800',
    color: '#2563EB',
  },
  logoutBigCard: {
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: RADII.md,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  logoutBigCardText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
