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
  RefreshControl,
  Platform,
} from 'react-native';
import { COLORS, RADII, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { dashboardService, predictionService } from '../services/api';

export const DashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // AI Prediction States
  const [isTraining, setIsTraining] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [predictions, setPredictions] = useState(null);
  const [activePredictionTab, setActivePredictionTab] = useState('visits'); // 'visits' | 'rooms'

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, activitiesRes] = await Promise.allSettled([
        dashboardService.getStats(),
        dashboardService.getActivities(),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
        setStats(statsRes.value.data);
      }
      if (activitiesRes.status === 'fulfilled' && activitiesRes.value?.data) {
        setActivities(activitiesRes.value.data);
      }
    } catch (err) {
      console.log('Dashboard fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleTrainModels = async () => {
    try {
      setIsTraining(true);
      setAiMessage('🧠 Sedang melatih model Prophet AI dengan data historis SIMRS...');
      const res = await predictionService.train();
      if (res?.success || res?.status === 'success') {
        const msg = '✅ Pelatihan model Prophet AI berhasil! Silakan jalankan generasi prediksi.';
        setAiMessage(msg);
        if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
        else Alert.alert('Pelatihan Berhasil', msg);
      }
    } catch (err) {
      console.log('Training error:', err);
      const errorMsg = err.response?.data?.error || 'Pastikan ML service Python berjalan di port 5030.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(`❌ ${errorMsg}`);
      else Alert.alert('Layanan ML Error', errorMsg);
      setAiMessage('');
    } finally {
      setIsTraining(false);
    }
  };

  const handleGetPredictions = async () => {
    try {
      setIsPredicting(true);
      setAiMessage('🔮 Menggenerasi prediksi tren 7 hari ke depan...');
      const res = await predictionService.predict(7);
      if (res?.data) {
        setPredictions(res.data);
        setAiMessage('✅ Prediksi 7 hari ke depan berhasil didapatkan!');
      }
    } catch (err) {
      console.log('Prediction error:', err);
      const errorMsg = err.response?.data?.error || 'Gagal mengambil data prediksi. Coba latih model terlebih dahulu.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(`❌ ${errorMsg}`);
      else Alert.alert('Layanan ML Error', errorMsg);
      setAiMessage('');
    } finally {
      setIsPredicting(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleLogout = () => {
    const doLogout = async () => {
      try {
        await logout();
        navigation.reset({
          index: 0,
          routes: [{ name: 'Landing' }],
        });
      } catch (err) {
        console.error('Logout error:', err);
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Apakah Anda yakin ingin keluar dari akun?')) {
        doLogout();
      }
    } else {
      Alert.alert('Konfirmasi Keluar', 'Apakah Anda yakin ingin keluar dari akun?', [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: doLogout,
        },
      ]);
    }
  };

  const handleTrainAndPredict = async () => {
    try {
      setAiLoading(true);
      setAiMessage('Sedang melatih model Prophet AI...');
      await predictionService.train();

      setAiMessage('Mengambil prediksi 7 hari ke depan...');
      const res = await predictionService.predict(7);

      if (res?.data) {
        setPredictions(res.data);
        setAiMessage('✅ Model berhasil dilatih & prediksi siap!');
      }
    } catch (err) {
      Alert.alert(
        'Layanan AI Error',
        err.response?.data?.error || 'Pastikan ML service Python berjalan di port 5030.'
      );
      setAiMessage('');
    } finally {
      setAiLoading(false);
    }
  };

  const statItems = [
    { label: 'Total Pasien', value: stats?.totalPatients || '2,543', change: '+12%', color: COLORS.primary600 },
    { label: 'Kunjungan Hari Ini', value: stats?.todayVisits || '87', change: '+5%', color: COLORS.success600 },
    { label: 'Rekam Tertunda', value: stats?.pendingRecords || '23', change: '-2%', color: COLORS.warning500 },
    { label: 'Pendapatan Bulanan', value: stats?.monthlyRevenue ? `Rp ${stats.monthlyRevenue.toLocaleString()}` : 'Rp 125.430.000', change: '+18%', color: COLORS.purple600 },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary700} />

      {/* Top Navbar */}
      <View style={styles.topNavbar}>
        <View>
          <Text style={styles.topNavbarTitle}>MediSyst HMS</Text>
          <Text style={styles.topNavbarSub}>SIMRS Terpusat Mobile</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Keluar 🚪</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary600]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* User Welcome Banner (Matching Website Blue Banner) */}
        <View style={styles.userBanner}>
          <View style={styles.rolePill}>
            <View style={styles.pulseDot} />
            <Text style={styles.rolePillText}>ROLE: {user?.role || 'DOCTOR'}</Text>
          </View>
          <Text style={styles.welcomeText}>Selamat Datang,</Text>
          <Text style={styles.userNameText}>{user?.name || 'Pengguna SIMRS'}</Text>
          <Text style={styles.userDeptText}>
            {user?.department ? `Departemen ${user.department}` : 'Sistem informasi operasional medis & bangsal rawat inap berjalan normal.'}
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistik Operasional</Text>
          <View style={styles.statsGrid}>
            {statItems.map((stat, idx) => (
              <View key={idx} style={styles.statCard}>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                <Text style={styles.statChange}>{stat.change} <Text style={styles.statSubText}>dari bulan lalu</Text></Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions - All SIMRS Modules */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Modul Utama SIMRS</Text>
          <View style={styles.actionGrid}>
            {[
              { label: 'Pasien', icon: '👤', desc: 'Data Pasien & RM', action: () => navigation.navigate('Patients') },
              { label: 'Kunjungan', icon: '📅', desc: 'Antrean & Visit', action: () => navigation.navigate('Visits') },
              { label: 'Poliklinik', icon: '🏛️', desc: 'Layanan Spesialis', action: () => navigation.navigate('Polyclinics') },
              { label: 'Rekam Medis', icon: '📋', desc: 'EMR Pasien', action: () => navigation.navigate('Records') },
              { label: 'Obat & Farmasi', icon: '💊', desc: 'Stok & Resep', action: () => navigation.navigate('Medicines') },
              { label: 'Kamar', icon: '🛏️', desc: 'Fasilitas & Bed', action: () => navigation.navigate('Rooms') },
              { label: 'Rawat Inap', icon: '🏥', desc: 'Okupansi Bangsal', action: () => navigation.navigate('Inpatients') },
              { label: 'Tagihan & Kasir', icon: '💳', desc: 'Billing & BPJS', action: () => navigation.navigate('Billings') },
              { label: 'Pengguna', icon: '👥', desc: 'Manajemen Staff', action: () => navigation.navigate('Users') },
              { label: 'Laporan', icon: '📊', desc: 'Analitik & KPI', action: () => navigation.navigate('Reports') },
              { label: 'Pengaturan', icon: '⚙️', desc: 'Konfigurasi Sistem', action: () => navigation.navigate('Settings') },
            ].map((act, idx) => (
              <TouchableOpacity key={idx} style={styles.actionBtn} onPress={act.action}>
                <Text style={{ fontSize: 22 }}>{act.icon}</Text>
                <Text style={styles.actionBtnText}>{act.label}</Text>
                <Text style={styles.actionBtnSub}>{act.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* AI Prediction Feature Box */}
        <View style={styles.aiCard}>
          <View style={styles.aiHeader}>
            <Text style={{ fontSize: 28 }}>🧠</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.aiTitle}>Prediksi AI (Prophet Model)</Text>
              <Text style={styles.aiSub}>Machine Learning Demand Forecasting 7 Hari Ke Depan</Text>
            </View>
          </View>

          {aiMessage ? (
            <View style={styles.aiStatusBanner}>
              <Text style={styles.aiStatusText}>{aiMessage}</Text>
            </View>
          ) : null}

          {/* Action Buttons Row */}
          <View style={styles.aiActionRow}>
            <TouchableOpacity
              style={[styles.aiBtn, styles.aiTrainBtn]}
              onPress={handleTrainModels}
              disabled={isTraining || isPredicting}
            >
              {isTraining ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.aiBtnText}>🧠 Latih Model</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.aiBtn, styles.aiPredictBtn]}
              onPress={handleGetPredictions}
              disabled={isTraining || isPredicting}
            >
              {isPredicting ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.aiBtnText}>🔮 Generasi Prediksi</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Prediction Results */}
          {predictions ? (
            <View style={styles.aiResultWrapper}>
              {/* Tab Switcher: Visits vs Rooms */}
              <View style={styles.aiTabRow}>
                <TouchableOpacity
                  style={[styles.aiTabChip, activePredictionTab === 'visits' && styles.aiTabChipActive]}
                  onPress={() => setActivePredictionTab('visits')}
                >
                  <Text style={[styles.aiTabChipText, activePredictionTab === 'visits' && styles.aiTabChipTextActive]}>
                    📅 Prediksi Kunjungan
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.aiTabChip, activePredictionTab === 'rooms' && styles.aiTabChipActive]}
                  onPress={() => setActivePredictionTab('rooms')}
                >
                  <Text style={[styles.aiTabChipText, activePredictionTab === 'rooms' && styles.aiTabChipTextActive]}>
                    🛏️ Prediksi Kamar
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 7-Day Forecast Cards */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.forecastList}>
                {(activePredictionTab === 'visits' ? predictions.visits : predictions.rooms)?.map((day, dIdx) => (
                  <View key={dIdx} style={styles.forecastCard}>
                    <Text style={styles.forecastDate}>
                      {new Date(day.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </Text>

                    <View style={styles.forecastItems}>
                      {day.top3?.map((item, iIdx) => (
                        <View key={iIdx} style={styles.forecastItemRow}>
                          <Text style={styles.forecastType} numberOfLines={1}>
                            {iIdx + 1}. {item.type}
                          </Text>
                          <Text style={styles.forecastVal}>{item.value}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}
        </View>

        {/* Recent Activity */}
        <View style={[styles.section, { marginBottom: 30 }]}>
          <Text style={styles.sectionTitle}>Aktivitas Terkini</Text>
          <View style={styles.activityCard}>
            {(activities.length > 0
              ? activities
              : [
                  { id: 1, title: 'Pasien Baru Registered', desc: 'Budi Santoso terdaftar via admisi loket', time: '5 menit lalu' },
                  { id: 2, title: 'Konsultasi Selesai', desc: 'dr. Ahmad menyelesaikan pemeriksaan Poli', time: '15 menit lalu' },
                  { id: 3, title: 'Update Rekam Medis', desc: 'Medical record diperbarui untuk MRN20241024001', time: '1 jam lalu' },
                ]
            ).map((act) => (
              <View key={act.id} style={styles.activityItem}>
                <View style={styles.actDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.actTitle}>{act.title || act.type}</Text>
                  <Text style={styles.actDesc}>{act.desc || act.description}</Text>
                  <Text style={styles.actTime}>{act.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topNavbar: {
    backgroundColor: COLORS.primary700,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topNavbarTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  topNavbarSub: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: '700',
  },
  logoutBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADII.md,
  },
  logoutBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  scrollView: {
    flex: 1,
  },
  userBanner: {
    backgroundColor: COLORS.primary600,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
    borderBottomLeftRadius: RADII.xl,
    borderBottomRightRadius: RADII.xl,
    ...SHADOWS.md,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADII.pill,
    marginBottom: 8,
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success500,
  },
  rolePillText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  welcomeText: {
    color: '#BFDBFE',
    fontSize: 13,
    fontWeight: '600',
  },
  userNameText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
    letterSpacing: -0.5,
  },
  userDeptText: {
    color: '#DBEAFE',
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.cardBg,
    borderRadius: RADII.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
  },
  statChange: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.success600,
    marginTop: 4,
  },
  statSubText: {
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionBtn: {
    width: '48%',
    backgroundColor: COLORS.cardBg,
    borderRadius: RADII.lg,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  actionBtnSub: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.textMuted,
    marginTop: 2,
  },
  aiCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: COLORS.purple50,
    borderRadius: RADII.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.purple100,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.purple700,
  },
  aiSub: {
    fontSize: 11,
    color: COLORS.purple600,
  },
  aiStatusBanner: {
    backgroundColor: '#F3E8FF',
    padding: 10,
    borderRadius: RADII.md,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  aiStatusText: {
    fontSize: 12,
    color: '#6B21A8',
    fontWeight: '700',
  },
  aiActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  aiBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADII.md,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  aiTrainBtn: {
    backgroundColor: '#7C3AED',
  },
  aiPredictBtn: {
    backgroundColor: '#2563EB',
  },
  aiBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  aiResultWrapper: {
    marginTop: 14,
  },
  aiTabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  aiTabChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADII.sm,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  aiTabChipActive: {
    backgroundColor: '#6D28D9',
    borderColor: '#6D28D9',
  },
  aiTabChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  aiTabChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  forecastList: {
    gap: 10,
    paddingVertical: 4,
  },
  forecastCard: {
    width: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: RADII.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  forecastDate: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6D28D9',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  forecastItems: {
    gap: 4,
  },
  forecastItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forecastType: {
    flex: 1,
    fontSize: 10,
    fontWeight: '600',
    color: '#334155',
    marginRight: 4,
  },
  forecastVal: {
    fontSize: 11,
    fontWeight: '900',
    color: '#2563EB',
  },
  activityCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADII.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 14,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  actDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary600,
    marginTop: 4,
  },
  actTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  actDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  actTime: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
