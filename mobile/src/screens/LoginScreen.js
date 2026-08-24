import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { COLORS, RADII, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

export const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@klinik.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Form Belum Lengkap', 'Silakan masukkan Email dan Password Anda.');
      return;
    }

    try {
      setLoading(true);
      const res = await login(email, password);
      if (res.success) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Dashboard' }],
        });
      }
    } catch (err) {
      console.log('Login error:', err);
      Alert.alert(
        'Gagal Masuk',
        err.response?.data?.error || 'Email atau password tidak sesuai, atau server backend tidak terhubung.'
      );
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('admin123');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Back Button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>← Kembali ke Beranda</Text>
          </TouchableOpacity>

          {/* Logo & Header */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Text style={{ fontSize: 30 }}>⚡</Text>
            </View>
            <Text style={styles.title}>
              Masuk ke Medi<Text style={{ color: COLORS.primary600 }}>Syst</Text>
            </Text>
            <Text style={styles.subtitle}>
              Sistem Informasi Manajemen Rumah Sakit & Operasional Medis
            </Text>
          </View>

          {/* Card Form */}
          <View style={styles.card}>
            <Text style={styles.label}>Alamat Email Staff / Dokter *</Text>
            <TextInput
              style={styles.input}
              placeholder="admin@klinik.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.label}>Kata Sandi (Password) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Masukkan password"
              secureTextEntry={true}
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.loginBtnText}>Masuk Sistem SIMRS →</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Quick Demo Credentials */}
          <View style={styles.demoSection}>
            <Text style={styles.demoTitle}>💡 Quick Login Akun Demo:</Text>
            <View style={styles.demoChipGrid}>
              {[
                { label: 'Admin Sistem', email: 'admin@klinik.com' },
                { label: 'dr. Ahmad (Dokter)', email: 'ahmad.hidayat@klinik.com' },
                { label: 'Dewi (Perawat)', email: 'dewi.lestari@klinik.com' },
                { label: 'Rudi (Front Desk)', email: 'rudi.hartono@klinik.com' },
              ].map((account) => (
                <TouchableOpacity
                  key={account.email}
                  style={styles.demoChip}
                  onPress={() => setDemoCredentials(account.email)}
                >
                  <Text style={styles.demoChipText}>{account.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: {
    marginBottom: 20,
  },
  backBtnText: {
    fontSize: 13,
    color: COLORS.primary600,
    fontWeight: '800',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: RADII.lg,
    backgroundColor: COLORS.primary600,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...SHADOWS.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
    fontWeight: '500',
    lineHeight: 18,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADII.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
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
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  loginBtn: {
    backgroundColor: COLORS.primary600,
    borderRadius: RADII.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    ...SHADOWS.md,
  },
  loginBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  demoSection: {
    marginTop: 24,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADII.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  demoChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  demoChip: {
    backgroundColor: COLORS.primary50,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.primary200,
  },
  demoChipText: {
    fontSize: 11,
    color: COLORS.primary600,
    fontWeight: '800',
  },
});
