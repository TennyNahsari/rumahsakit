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
import { billingService, patientService } from '../../services/api';

const PAY_METHODS = [
  { label: '💵 Tunai / Cash', value: 'CASH' },
  { label: '💳 Kartu Debit (EDC)', value: 'DEBIT_CARD' },
  { label: '💳 Kartu Kredit', value: 'CREDIT_CARD' },
  { label: '🏦 Transfer Bank / QRIS', value: 'BANK_TRANSFER' },
  { label: '🛡️ BPJS Kesehatan', value: 'BPJS' },
  { label: '🏥 Asuransi Swasta', value: 'INSURANCE' },
];

export const BillingFormScreen = ({ route, navigation }) => {
  const bData = route.params?.billingData || null;
  const isEdit = !!bData;

  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState(bData?.patientId ? String(bData.patientId) : '');

  const [registrationFee, setRegistrationFee] = useState(bData?.registrationFee ? String(bData.registrationFee) : '50000');
  const [doctorFee, setDoctorFee] = useState(bData?.doctorFee ? String(bData.doctorFee) : '150000');
  const [medicineFee, setMedicineFee] = useState(bData?.medicineFee ? String(bData.medicineFee) : '0');
  const [roomFee, setRoomFee] = useState(bData?.roomFee ? String(bData.roomFee) : '0');
  const [actionFee, setActionFee] = useState(bData?.actionFee ? String(bData.actionFee) : '0');
  const [discount, setDiscount] = useState(bData?.discount ? String(bData.discount) : '0');

  const [status, setStatus] = useState(bData?.status || 'UNPAID');
  const [paymentMethod, setPaymentMethod] = useState(bData?.paymentMethod || 'CASH');
  const [notes, setNotes] = useState(bData?.notes || '');

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Dropdown UI states
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showMethodDropdown, setShowMethodDropdown] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoadingInitial(true);
      const res = await patientService.getPatients({ limit: 100 });
      if (res?.data) {
        const list = res.data.patients || res.data || [];
        setPatients(list);
        if (!isEdit && list.length > 0 && !patientId) {
          setPatientId(String(list[0].id));
        }
      }
    } catch (err) {
      console.log('Error loading patients for BillingForm:', err.message);
    } finally {
      setLoadingInitial(false);
    }
  };

  // Calculate live total
  const calculatedTotal =
    (parseFloat(registrationFee) || 0) +
    (parseFloat(doctorFee) || 0) +
    (parseFloat(medicineFee) || 0) +
    (parseFloat(roomFee) || 0) +
    (parseFloat(actionFee) || 0) -
    (parseFloat(discount) || 0);

  const handleSubmit = async () => {
    if (!patientId) {
      const msg = 'Mohon pilih pasien penerima tagihan.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
      else Alert.alert('Validasi', msg);
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        patientId: parseInt(patientId),
        registrationFee: parseFloat(registrationFee) || 0,
        doctorFee: parseFloat(doctorFee) || 0,
        medicineFee: parseFloat(medicineFee) || 0,
        roomFee: parseFloat(roomFee) || 0,
        actionFee: parseFloat(actionFee) || 0,
        discount: parseFloat(discount) || 0,
        totalAmount: calculatedTotal > 0 ? calculatedTotal : 0,
        status: status,
        paymentMethod: paymentMethod,
        notes: notes.trim() || null,
      };

      if (isEdit) {
        await billingService.updateBilling(bData.id, payload);
      } else {
        await billingService.createBilling(payload);
      }

      const msg = isEdit ? '✅ Invoice tagihan berhasil diperbarui!' : '✅ Invoice tagihan baru berhasil diterbitkan!';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
      else Alert.alert('Berhasil', msg);

      navigation.navigate('Billings', { refresh: true });
    } catch (err) {
      console.log('Error saving billing:', err);
      const errorMsg = err.response?.data?.error || 'Gagal menyimpan invoice tagihan.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(`❌ ${errorMsg}`);
      else Alert.alert('Error', errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPatientObj = patients.find((p) => String(p.id) === String(patientId));

  const formatRupiah = (number) => {
    if (!number && number !== 0) return 'Rp 0';
    return `Rp ${Number(number).toLocaleString('id-ID')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Batal</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Invoice Kasir' : 'Buat Invoice Baru'}</Text>
        <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.saveHeaderBtnText}>{submitting ? '...' : 'Simpan'}</Text>
        </TouchableOpacity>
      </View>

      {loadingInitial ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Memuat data pasien SIMRS...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Card 1: Penerima Tagihan */}
          <View style={styles.card}>
            <Text style={styles.label}>Pilih Pasien Penerima Tagihan *</Text>
            <TouchableOpacity
              style={styles.selectBox}
              onPress={() => {
                setShowPatientDropdown(!showPatientDropdown);
                setShowStatusDropdown(false);
                setShowMethodDropdown(false);
              }}
            >
              <Text style={styles.selectBoxText}>
                {selectedPatientObj ? `👤 ${selectedPatientObj.name} (${selectedPatientObj.medicalRecordNo || 'No.RM'})` : 'Pilih Pasien'}
              </Text>
              <Text style={styles.selectArrow}>{showPatientDropdown ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showPatientDropdown && (
              <View style={styles.dropdownContainer}>
                {patients.map((pat) => (
                  <TouchableOpacity
                    key={pat.id}
                    style={[styles.dropdownItem, String(patientId) === String(pat.id) && styles.dropdownItemActive]}
                    onPress={() => {
                      setPatientId(String(pat.id));
                      setShowPatientDropdown(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, String(patientId) === String(pat.id) && styles.dropdownItemTextActive]}>
                      👤 {pat.name} - {pat.medicalRecordNo || 'RM'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Card 2: Rincian Biaya */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Rincian Komponen Biaya (Rp)</Text>

            <Text style={styles.label}>Biaya Pendaftaran & Admin SIMRS</Text>
            <TextInput
              style={styles.input}
              placeholder="50000"
              keyboardType="numeric"
              value={registrationFee}
              onChangeText={setRegistrationFee}
            />

            <Text style={styles.label}>Jasa Konsultasi Dokter Spesialis</Text>
            <TextInput
              style={styles.input}
              placeholder="150000"
              keyboardType="numeric"
              value={doctorFee}
              onChangeText={setDoctorFee}
            />

            <Text style={styles.label}>Biaya Obat & Terapi Farmasi</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              keyboardType="numeric"
              value={medicineFee}
              onChangeText={setMedicineFee}
            />

            <Text style={styles.label}>Biaya Kamar Rawat Inap</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              keyboardType="numeric"
              value={roomFee}
              onChangeText={setRoomFee}
            />

            <Text style={styles.label}>Biaya Tindakan Medis & Lab</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              keyboardType="numeric"
              value={actionFee}
              onChangeText={setActionFee}
            />

            <Text style={styles.label}>Potongan / Subsidi BPJS</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              keyboardType="numeric"
              value={discount}
              onChangeText={setDiscount}
            />

            {/* Calculated Total Live Banner */}
            <View style={styles.liveTotalBanner}>
              <Text style={styles.liveTotalLabel}>ESTIMASI TOTAL INVOICE:</Text>
              <Text style={styles.liveTotalVal}>{formatRupiah(calculatedTotal)}</Text>
            </View>
          </View>

          {/* Card 3: Pembayaran & Status */}
          <View style={styles.card}>
            <Text style={styles.label}>Status Pembayaran Tagihan *</Text>
            <TouchableOpacity
              style={styles.selectBox}
              onPress={() => {
                setShowStatusDropdown(!showStatusDropdown);
                setShowPatientDropdown(false);
                setShowMethodDropdown(false);
              }}
            >
              <Text style={styles.selectBoxText}>
                {status === 'PAID' ? '🟢 LUNAS (PAID)' : '🟡 BELUM LUNAS (UNPAID)'}
              </Text>
              <Text style={styles.selectArrow}>{showStatusDropdown ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showStatusDropdown && (
              <View style={styles.dropdownContainer}>
                {[
                  { label: '🟡 BELUM LUNAS (UNPAID)', value: 'UNPAID' },
                  { label: '🟢 LUNAS (PAID)', value: 'PAID' },
                ].map((st) => (
                  <TouchableOpacity
                    key={st.value}
                    style={[styles.dropdownItem, status === st.value && styles.dropdownItemActive]}
                    onPress={() => {
                      setStatus(st.value);
                      setShowStatusDropdown(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, status === st.value && styles.dropdownItemTextActive]}>
                      {st.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.label}>Metode Pembayaran *</Text>
            <TouchableOpacity
              style={styles.selectBox}
              onPress={() => {
                setShowMethodDropdown(!showMethodDropdown);
                setShowPatientDropdown(false);
                setShowStatusDropdown(false);
              }}
            >
              <Text style={styles.selectBoxText}>
                {PAY_METHODS.find((m) => m.value === paymentMethod)?.label || paymentMethod}
              </Text>
              <Text style={styles.selectArrow}>{showMethodDropdown ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showMethodDropdown && (
              <View style={styles.dropdownContainer}>
                {PAY_METHODS.map((pm) => (
                  <TouchableOpacity
                    key={pm.value}
                    style={[styles.dropdownItem, paymentMethod === pm.value && styles.dropdownItemActive]}
                    onPress={() => {
                      setPaymentMethod(pm.value);
                      setShowMethodDropdown(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, paymentMethod === pm.value && styles.dropdownItemTextActive]}>
                      {pm.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.label}>Catatan Tambahan Kasir</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Catatan transaksi kasir, nomor referensi EDC, BPJS, dll."
              multiline
              numberOfLines={2}
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>{isEdit ? '💾 Simpan Perubahan Invoice' : '🧾 Terbitkan Invoice Tagihan'}</Text>
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
  cardSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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
    minHeight: 60,
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
  liveTotalBanner: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: RADII.md,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveTotalLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E40AF',
  },
  liveTotalVal: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
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
