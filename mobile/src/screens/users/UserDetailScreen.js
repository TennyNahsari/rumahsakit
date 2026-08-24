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
import { userService } from '../../services/api';

const roleConfig = {
  ADMIN: { label: 'ADMINISTRATOR', bg: '#FEE2E2', text: '#B91C1C', icon: '👑' },
  DOCTOR: { label: 'DOKTER SPESIALIS', bg: '#EFF6FF', text: '#1D4ED8', icon: '👨‍⚕️' },
  NURSE: { label: 'PERAWAT', bg: '#DCFCE7', text: '#15803D', icon: '👩‍⚕️' },
  FRONT_DESK: { label: 'FRONT DESK / KASIR', bg: '#FEF3C7', text: '#B45309', icon: '🏥' },
  PHARMACY: { label: 'APOTEKER / FARMASI', bg: '#E0F2FE', text: '#0369A1', icon: '💊' },
  LABORATORY: { label: 'ANALIS LAB', bg: '#F3E8FF', text: '#6B21A8', icon: '🔬' },
  PATIENT: { label: 'PASIEN', bg: '#F1F5F9', text: '#475569', icon: '👤' },
};

export const UserDetailScreen = ({ route, navigation }) => {
  const { userId, userData } = route.params || {};
  const [user, setUser] = useState(userData || null);
  const [loading, setLoading] = useState(!userData);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchDetail();
    }
  }, [userId]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await userService.getUserById(userId);
      if (res?.data) {
        setUser(res.data.user || res.data);
      }
    } catch (err) {
      console.log('Error fetching user detail:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    const doDelete = async () => {
      try {
        setDeleting(true);
        await userService.deleteUser(user.id);
        if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert('✅ Akun pengguna berhasil dihapus!');
        else Alert.alert('Berhasil', 'Akun pengguna berhasil dihapus!');
        navigation.navigate('Users', { refresh: true });
      } catch (err) {
        const msg = err.response?.data?.error || err.response?.data?.message || 'Gagal menghapus akun pengguna.';
        if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(`❌ ${msg}`);
        else Alert.alert('Error', msg);
      } finally {
        setDeleting(false);
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Apakah Anda yakin ingin menghapus akun "${user?.name}"?`)) {
        doDelete();
      }
    } else {
      Alert.alert('Konfirmasi Hapus', `Apakah Anda yakin ingin menghapus akun "${user?.name}"?`, [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Memuat detail profil pengguna...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const rc = roleConfig[user.role] || roleConfig.PATIENT;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Pengguna</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Profil Staff</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Banner Card */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerTop}>
            <View style={styles.avatarBox}>
              <Text style={{ fontSize: 32 }}>{rc.icon}</Text>
            </View>

            <View style={[styles.roleBadge, { backgroundColor: rc.bg }]}>
              <Text style={[styles.roleBadgeText, { color: rc.text }]}>{rc.label}</Text>
            </View>
          </View>

          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.userDept}>🏛️ Departemen: {user.department || 'Manajemen Rumah Sakit'}</Text>
        </View>

        {/* Section 1: Informasi Kontak */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={{ fontSize: 18, marginRight: 6 }}>📞</Text>
            <Text style={styles.cardTitle}>Informasi Kontak & Akun</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Alamat Email:</Text>
            <Text style={styles.infoVal}>{user.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nomor Telepon:</Text>
            <Text style={styles.infoVal}>{user.phone || '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Departemen / Poli:</Text>
            <Text style={styles.infoVal}>{user.department || 'Manajemen RS'}</Text>
          </View>
        </View>

        {/* Section 2: Informasi Hak Akses & Sistem */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={{ fontSize: 18, marginRight: 6 }}>🔐</Text>
            <Text style={styles.cardTitle}>Hak Akses & Metadata SIMRS</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role Hak Akses:</Text>
            <Text style={[styles.infoVal, { color: rc.text, fontWeight: '900' }]}>{rc.label}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tanggal Dibuat:</Text>
            <Text style={styles.infoVal}>{formatDate(user.createdAt)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('UserForm', { userData: user })}
          >
            <Text style={styles.editBtnText}>✏️ Edit Pengguna</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.deleteBtnText}>🗑️ Hapus</Text>
            )}
          </TouchableOpacity>
        </View>
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
  bannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADII.xl,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  bannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  avatarBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADII.sm,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  userName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  userEmail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  userDept: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 6,
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
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  infoVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  editBtn: {
    flex: 2,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADII.md,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  editBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: RADII.md,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  deleteBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
