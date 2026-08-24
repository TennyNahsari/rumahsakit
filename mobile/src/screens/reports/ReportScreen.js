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
  TextInput,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { COLORS, RADII, SHADOWS } from '../../constants/theme';
import { dashboardService, billingService, patientService, visitService, roomService } from '../../services/api';

export const ReportScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Default to last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const todayStr = new Date().toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(todayStr);

  const [metrics, setMetrics] = useState({
    patients: { total: 0, new: 0 },
    visits: { total: 0, completed: 0, cancelled: 0, completionRate: 0 },
    billing: { total: 0, paid: 0, unpaid: 0, revenue: 0, unpaidAmount: 0 },
    rooms: { totalRooms: 0, occupiedRooms: 0, bor: 0 },
    visitTypeBreakdown: {},
    paymentMethodBreakdown: {},
  });

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);

      const [dashRes, billingsRes, patientsRes, visitsRes, roomsRes] = await Promise.all([
        dashboardService.getStats().catch(() => ({ data: {} })),
        billingService.getBillings({ limit: 1000 }).catch(() => ({ data: [] })),
        patientService.getPatients({ limit: 1000 }).catch(() => ({ data: [] })),
        visitService.getVisits({ limit: 1000 }).catch(() => ({ data: [] })),
        roomService.getRooms({ limit: 1000 }).catch(() => ({ data: [] })),
      ]);

      const allPatients = patientsRes?.data?.patients || patientsRes?.data || patientsRes || [];
      const allVisits = visitsRes?.data?.visits || visitsRes?.data || visitsRes || [];
      const allBillings = billingsRes?.data?.billings || billingsRes?.billings || billingsRes?.data || billingsRes || [];
      const allRooms = roomsRes?.data?.rooms || roomsRes?.rooms || roomsRes?.data || roomsRes || [];

      const sDate = new Date(startDate);
      const eDate = new Date(endDate);
      eDate.setHours(23, 59, 59, 999);

      // Filter Range
      const newPatientsInRange = allPatients.filter((p) => {
        const cDate = new Date(p.createdAt);
        return cDate >= sDate && cDate <= eDate;
      });

      const visitsInRange = allVisits.filter((v) => {
        const vDate = new Date(v.scheduledAt || v.createdAt);
        return vDate >= sDate && vDate <= eDate;
      });

      const billingsInRange = allBillings.filter((b) => {
        const bDate = new Date(b.createdAt);
        return bDate >= sDate && bDate <= eDate;
      });

      // Visit Statistics
      const completedVisits = visitsInRange.filter((v) => v.status === 'COMPLETED').length;
      const cancelledVisits = visitsInRange.filter((v) => v.status === 'CANCELLED').length;
      const completionRate = visitsInRange.length > 0 ? Math.round((completedVisits / visitsInRange.length) * 100) : 0;

      // Visit Type Breakdown
      const typeMap = {};
      visitsInRange.forEach((v) => {
        const vt = v.visitType || 'OUTPATIENT';
        typeMap[vt] = (typeMap[vt] || 0) + 1;
      });

      // Billing Statistics
      const paidBillings = billingsInRange.filter((b) => b.status === 'PAID');
      const unpaidBillings = billingsInRange.filter((b) => b.status === 'UNPAID');

      const totalRevenue = paidBillings.reduce((sum, b) => {
        const val = Number(b.totalAmount !== undefined ? b.totalAmount : b.total) || 0;
        return sum + val;
      }, 0);

      const totalUnpaidAmount = unpaidBillings.reduce((sum, b) => {
        const val = Number(b.totalAmount !== undefined ? b.totalAmount : b.total) || 0;
        return sum + val;
      }, 0);

      // Payment Method Breakdown
      const methodMap = {};
      paidBillings.forEach((b) => {
        const pm = b.paymentMethod || 'CASH';
        methodMap[pm] = (methodMap[pm] || 0) + 1;
      });

      // Rooms BOR Statistics
      const occupiedRoomsCount = allRooms.filter((r) => r.status === 'OCCUPIED' || r.isOccupied).length;
      const borValue = allRooms.length > 0 ? Math.round((occupiedRoomsCount / allRooms.length) * 100) : 0;

      setMetrics({
        patients: {
          total: allPatients.length,
          new: newPatientsInRange.length,
        },
        visits: {
          total: visitsInRange.length,
          completed: completedVisits,
          cancelled: cancelledVisits,
          completionRate,
        },
        billing: {
          total: billingsInRange.length,
          paid: paidBillings.length,
          unpaid: unpaidBillings.length,
          revenue: totalRevenue,
          unpaidAmount: totalUnpaidAmount,
        },
        rooms: {
          totalRooms: allRooms.length,
          occupiedRooms: occupiedRoomsCount,
          bor: borValue,
        },
        visitTypeBreakdown: typeMap,
        paymentMethodBreakdown: methodMap,
      });
    } catch (err) {
      console.log('Error loading report metrics:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReportData();
  };

  const setPresetRange = (days) => {
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setStartDate(start);
    setEndDate(end);
  };

  const formatRupiah = (number) => {
    return `Rp ${Number(number || 0).toLocaleString('id-ID')}`;
  };

  const handleExportCSV = () => {
    const summaryMsg =
      `📊 LAPORAN KINERJA SIMRS RUMAH SAKIT\n` +
      `Periode: ${startDate} s/d ${endDate}\n\n` +
      `👤 Pasien SIMRS:\n- Total Pasien: ${metrics.patients.total}\n- Pasien Baru Periode Ini: ${metrics.patients.new}\n\n` +
      `📅 Kunjungan:\n- Total Kunjungan: ${metrics.visits.total}\n- Kunjungan Selesai: ${metrics.visits.completed} (${metrics.visits.completionRate}%)\n- Kunjungan Dibatalkan: ${metrics.visits.cancelled}\n\n` +
      `💰 Keuangan Kasir:\n- Total Pendapatan Lunas: ${formatRupiah(metrics.billing.revenue)}\n- Piutang Belum Bayar: ${formatRupiah(metrics.billing.unpaidAmount)}\n- Invoice Lunas: ${metrics.billing.paid} invoice\n- Invoice Belum Bayar: ${metrics.billing.unpaid} invoice\n\n` +
      `🛏️ Okupansi Kamar (BOR):\n- Bed Terpakai: ${metrics.rooms.occupiedRooms}/${metrics.rooms.totalRooms} (${metrics.rooms.bor}%)`;

    if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(summaryMsg);
    else Alert.alert('Laporan Kinerja SIMRS', summaryMsg);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary700} />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Laporan & Analitik KPI</Text>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExportCSV}>
          <Text style={styles.exportBtnText}>📊 Ekspor</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Date Filter & Presets Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Filter Periode Laporan</Text>

          <View style={styles.dateInputsRow}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Text style={styles.label}>Dari Tanggal</Text>
              <TextInput
                style={styles.dateInput}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
              />
            </View>

            <View style={{ flex: 1, marginLeft: 6 }}>
              <Text style={styles.label}>Sampai Tanggal</Text>
              <TextInput
                style={styles.dateInput}
                value={endDate}
                onChangeText={setEndDate}
                placeholder="YYYY-MM-DD"
              />
            </View>
          </View>

          {/* Quick Preset Buttons */}
          <View style={styles.presetRow}>
            <TouchableOpacity style={styles.presetChip} onPress={() => setPresetRange(7)}>
              <Text style={styles.presetChipText}>7 Hari</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetChip} onPress={() => setPresetRange(30)}>
              <Text style={styles.presetChipText}>30 Hari</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetChip} onPress={() => setPresetRange(90)}>
              <Text style={styles.presetChipText}>3 Bulan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={fetchReportData}>
              <Text style={styles.applyBtnText}>🔄 Terapkan</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Kalkulasi indikator analitik & KPI...</Text>
          </View>
        ) : (
          <>
            {/* KPI Section 1: Financial & Revenue */}
            <View style={styles.sectionHeaderRow}>
              <Text style={{ fontSize: 18, marginRight: 6 }}>💰</Text>
              <Text style={styles.sectionHeaderTitle}>Pendapatan Keuangan Kasir</Text>
            </View>

            <View style={styles.kpiGrid}>
              <View style={[styles.kpiCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                <Text style={styles.kpiLabel}>Total Pendapatan Lunas</Text>
                <Text style={[styles.kpiValue, { color: '#15803D' }]}>{formatRupiah(metrics.billing.revenue)}</Text>
                <Text style={styles.kpiSub}>Dari {metrics.billing.paid} invoice lunas</Text>
              </View>

              <View style={[styles.kpiCard, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
                <Text style={styles.kpiLabel}>Piutang Belum Lunas</Text>
                <Text style={[styles.kpiValue, { color: '#B45309' }]}>{formatRupiah(metrics.billing.unpaidAmount)}</Text>
                <Text style={styles.kpiSub}>Dari {metrics.billing.unpaid} invoice menggantung</Text>
              </View>
            </View>

            {/* KPI Section 2: Patients & Visits */}
            <View style={styles.sectionHeaderRow}>
              <Text style={{ fontSize: 18, marginRight: 6 }}>📊</Text>
              <Text style={styles.sectionHeaderTitle}>Performa Operasional Pasien & Kunjungan</Text>
            </View>

            <View style={styles.kpiGrid}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Total Pasien Terdaftar</Text>
                <Text style={styles.kpiValue}>{metrics.patients.total}</Text>
                <Text style={styles.kpiSub}>+{metrics.patients.new} pasien baru pada periode ini</Text>
              </View>

              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Tingkat Penyelesaian (Completion Rate)</Text>
                <Text style={[styles.kpiValue, { color: COLORS.primary }]}>{metrics.visits.completionRate}%</Text>
                <Text style={styles.kpiSub}>{metrics.visits.completed} dari {metrics.visits.total} kunjungan selesai</Text>
              </View>
            </View>

            {/* KPI Section 3: Room Capacity (BOR %) */}
            <View style={styles.kpiGrid}>
              <View style={[styles.kpiCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                <Text style={styles.kpiLabel}>Tingkat Okupansi Bangsal (BOR %)</Text>
                <Text style={[styles.kpiValue, { color: '#1E40AF' }]}>{metrics.rooms.bor}%</Text>
                <Text style={styles.kpiSub}>{metrics.rooms.occupiedRooms} dari {metrics.rooms.totalRooms} kamar terisi</Text>
              </View>
            </View>

            {/* Breakdown Card: Visit Types */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Breakdown Tipe Kunjungan Pasien</Text>
              <View style={styles.breakdownList}>
                {[
                  { key: 'GENERAL_CHECKUP', label: '🩺 General Checkup' },
                  { key: 'OUTPATIENT', label: '🚶 Rawat Jalan (Outpatient)' },
                  { key: 'INPATIENT', label: '🛏️ Rawat Inap (Inpatient)' },
                  { key: 'EMERGENCY', label: '🚨 UGD / Emergency' },
                ].map((item) => {
                  const count = metrics.visitTypeBreakdown[item.key] || 0;
                  const pct = metrics.visits.total > 0 ? Math.round((count / metrics.visits.total) * 100) : 0;
                  return (
                    <View key={item.key} style={styles.progressRow}>
                      <View style={styles.progressTopRow}>
                        <Text style={styles.progressLabel}>{item.label}</Text>
                        <Text style={styles.progressVal}>{count} ({pct}%)</Text>
                      </View>
                      <View style={styles.progressBarTrack}>
                        <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}
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
  exportBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: RADII.sm,
  },
  exportBtnText: {
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
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  dateInputsRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  dateInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: RADII.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0F172A',
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADII.sm,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  applyBtn: {
    flex: 1,
    paddingVertical: 7,
    backgroundColor: COLORS.primary,
    borderRadius: RADII.sm,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
  },
  loadingBox: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  kpiGrid: {
    gap: 12,
    marginBottom: 14,
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADII.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 4,
  },
  kpiSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  breakdownList: {
    gap: 10,
    marginTop: 4,
  },
  progressRow: {
    gap: 4,
  },
  progressTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  progressVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
});
