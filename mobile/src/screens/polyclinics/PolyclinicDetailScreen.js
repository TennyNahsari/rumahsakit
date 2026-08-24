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
import { polyclinicService, publicService } from '../../services/api';

const iconEmojiMap = {
  Stethoscope: '🏥',
  HeartPulse: '🩺',
  Users: '👶',
  Heart: '🤰',
  Activity: '❤️',
  Brain: '🧠',
  Pill: '💊',
  Building2: '🏢',
  Car: '🚑',
  ShieldCheck: '🛡️',
};

export const PolyclinicDetailScreen = ({ route, navigation }) => {
  const { polyclinicId, polyclinicData } = route.params || {};
  const [poly, setPoly] = useState(polyclinicData || null);
  const [loading, setLoading] = useState(!polyclinicData);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (polyclinicId) {
      fetchDetail();
    }
  }, [polyclinicId]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await polyclinicService.getPolyclinicById(polyclinicId);
      if (res?.data) {
        setPoly(res.data.polyclinic || res.data);
      }
    } catch (err) {
      console.log('Error fetching polyclinic detail:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    const doDelete = async () => {
      try {
        setDeleting(true);
        await polyclinicService.deletePolyclinic(poly.id);
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.alert('✅ Poliklinik berhasil dihapus!');
        } else {
          Alert.alert('Berhasil', 'Poliklinik berhasil dihapus!');
        }
        navigation.navigate('Polyclinics', { refresh: true });
      } catch (err) {
        const msg = err.response?.data?.error || 'Gagal menghapus poliklinik.';
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.alert(`❌ ${msg}`);
        } else {
          Alert.alert('Error', msg);
        }
      } finally {
        setDeleting(false);
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Apakah Anda yakin ingin menghapus "${poly?.name}"?`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Konfirmasi Hapus',
        `Apakah Anda yakin ingin menghapus poliklinik "${poly?.name}"?`,
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Hapus', style: 'destructive', onPress: doDelete },
        ]
      );
    }
  };

  if (loading || !poly) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Memuat detail poliklinik...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const iconEmoji = iconEmojiMap[poly.icon] || '🏥';
  const servicesList = Array.isArray(poly.services) && poly.services.length > 0
    ? poly.services
    : ['Konsultasi Spesialis', 'Pemeriksaan Diagnostik Presisi'];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Poliklinik</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Poliklinik</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Banner Card */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerTop}>
            <View style={styles.iconBox}>
              <Text style={{ fontSize: 32 }}>{iconEmoji}</Text>
            </View>
            <View style={styles.badgeRow}>
              <View style={[styles.statusBadge, poly.isActive !== false ? styles.activeBadge : styles.inactiveBadge]}>
                <Text style={[styles.statusBadgeText, poly.isActive !== false ? styles.activeBadgeText : styles.inactiveBadgeText]}>
                  {poly.isActive !== false ? '● AKTIF' : '○ NON-AKTIF'}
                </Text>
              </View>
              <View style={styles.codeBadge}>
                <Text style={styles.codeBadgeText}>{poly.code || 'POLI-UNIT'}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.polyName}>{poly.name}</Text>
          {poly.englishName ? <Text style={styles.polyEngName}>{poly.englishName}</Text> : null}
        </View>

        {/* Section 1: Overview & Deskripsi */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={{ fontSize: 18, marginRight: 6 }}>📝</Text>
            <Text style={styles.sectionTitle}>Deskripsi Unit Medis</Text>
          </View>
          <Text style={styles.descText}>{poly.description || 'Penanganan medis spesialis terpadu.'}</Text>
          {poly.englishDescription ? (
            <View style={styles.engDescBox}>
              <Text style={styles.engDescLabel}>ENGLISH DESCRIPTION</Text>
              <Text style={styles.engDescText}>{poly.englishDescription}</Text>
            </View>
          ) : null}
        </View>

        {/* Section 2: Layanan Spesialis Unggulan */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={{ fontSize: 18, marginRight: 6 }}>⚡</Text>
            <Text style={styles.sectionTitle}>Layanan Spesialis Unggulan</Text>
          </View>
          <View style={styles.servicesList}>
            {servicesList.map((srv, idx) => (
              <View key={idx} style={styles.serviceRow}>
                <View style={styles.checkBadge}>
                  <Text style={styles.checkBadgeText}>✓</Text>
                </View>
                <Text style={styles.serviceText}>{srv}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Section 3: Metadata & Urutan */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={{ fontSize: 18, marginRight: 6 }}>ℹ️</Text>
            <Text style={styles.sectionTitle}>Informasi Sistem</Text>
          </View>
          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Kode Poliklinik:</Text>
              <Text style={styles.infoVal}>{poly.code || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Urutan Tampilan:</Text>
              <Text style={styles.infoVal}># {poly.sortOrder || 1}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status Operasional:</Text>
              <Text style={styles.infoVal}>{poly.isActive !== false ? 'Aktif Melayani' : 'Non-Aktif'}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons (Edit & Delete) */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('PolyclinicForm', { polyclinicData: poly })}
          >
            <Text style={styles.editBtnText}>✏️ Edit Poliklinik</Text>
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
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  bannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: RADII.md,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  badgeRow: {
    alignItems: 'flex-end',
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADII.sm,
  },
  activeBadge: {
    backgroundColor: '#DCFCE7',
  },
  inactiveBadge: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  activeBadgeText: {
    color: '#15803D',
  },
  inactiveBadgeText: {
    color: '#B91C1C',
  },
  codeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADII.sm,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  codeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  polyName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  polyEngName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADII.lg,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  descText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
  },
  engDescBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: RADII.md,
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
  },
  engDescLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  engDescText: {
    fontSize: 12,
    color: '#475569',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  servicesList: {
    gap: 8,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  checkBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#2563EB',
  },
  serviceText: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '600',
  },
  infoGrid: {
    gap: 8,
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
