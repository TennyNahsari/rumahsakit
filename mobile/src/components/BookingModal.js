import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { COLORS, RADII, SHADOWS } from '../constants/theme';
import { publicService } from '../services/api';

export const BookingModal = ({
  visible,
  onClose,
  initialDoctor,
  initialPoly,
  initialVisitType = 'OUTPATIENT',
  doctors = []
}) => {
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [poly, setPoly] = useState(initialPoly || 'Poli Penyakit Dalam');
  const [doctor, setDoctor] = useState(initialDoctor || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [visitType, setVisitType] = useState(initialVisitType || 'OUTPATIENT');
  const [paymentType, setPaymentType] = useState('BPJS Kesehatan');
  const [complaint, setComplaint] = useState('');
  const [loading, setLoading] = useState(false);

  // Dropdown UI States
  const [showPolyDropdown, setShowPolyDropdown] = useState(false);
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
  const [showVisitTypeDropdown, setShowVisitTypeDropdown] = useState(false);

  const visitTypeOptions = [
    { label: '📋 Rawat Jalan (Outpatient)', value: 'OUTPATIENT' },
    { label: '🩺 General Checkup / MCU', value: 'GENERAL_CHECKUP' },
    { label: '🛏️ Rawat Inap (Inpatient)', value: 'INPATIENT' },
    { label: '🚨 Gawat Darurat / UGD (Emergency)', value: 'EMERGENCY' },
    { label: '💉 Tindakan Medis (Medical Action)', value: 'MEDICAL_ACTION' },
  ];

  // Calendar DatePicker UI States
  const [showCalendar, setShowCalendar] = useState(false);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  const polyOptions = [
    'Poli Penyakit Dalam',
    'Poli Anak & Tumbuh Kembang',
    'Poli Kebidanan & Kandungan',
    'Pusat Jantung & Pembuluh Darah',
    'Poli Bedah Umum & Ortopedi',
    'Poli Saraf & Stroke Unit',
    'Instalasi Gawat Darurat (IGD)',
  ];

  const defaultDoctors = [
    { name: 'dr. Hendra Wijaya, Sp.PD', department: 'Penyakit Dalam' },
    { name: 'dr. Siti Nurhaliza, Sp.A', department: 'Anak' },
    { name: 'dr. Budi Santoso, Sp.OG', department: 'Obstetri & Ginekologi' },
    { name: 'dr. Rina Kusuma, Sp.JP', department: 'Jantung & Pembuluh Darah' },
  ];

  const doctorList = doctors.length > 0 ? doctors : defaultDoctors;

  const mapDeptToClinic = (dept = '') => {
    if (!dept) return 'Poli Penyakit Dalam';
    const lower = dept.toLowerCase();
    if (lower.includes('anak')) return 'Poli Anak & Tumbuh Kembang';
    if (lower.includes('obgyn') || lower.includes('kebidanan') || lower.includes('ginekologi') || lower.includes('kandungan')) return 'Poli Kebidanan & Kandungan';
    if (lower.includes('jantung') || lower.includes('kardio') || lower.includes('pembuluh')) return 'Pusat Jantung & Pembuluh Darah';
    if (lower.includes('bedah')) return 'Poli Bedah Umum & Ortopedi';
    if (lower.includes('saraf') || lower.includes('neuro') || lower.includes('stroke')) return 'Poli Saraf & Stroke Unit';
    if (lower.includes('penyakit dalam') || lower.includes('dalam')) return 'Poli Penyakit Dalam';
    return dept.startsWith('Poli') ? dept : `Poli ${dept}`;
  };

  useEffect(() => {
    if (visible) {
      setVisitType(initialVisitType || 'OUTPATIENT');
      const targetPoly = initialPoly || 'Poli Penyakit Dalam';
      setPoly(targetPoly);

      let targetDoc = initialDoctor;

      if (!targetDoc) {
        const polyLower = targetPoly.toLowerCase();
        const matchDoc = doctorList.find((d) => {
          const dDept = (typeof d === 'object' && d.department ? d.department : '').toLowerCase();
          return dDept && (
            polyLower.includes(dDept) || dDept.includes(polyLower) ||
            (polyLower.includes('anak') && dDept.includes('anak')) ||
            (polyLower.includes('obgyn') && (dDept.includes('obgyn') || dDept.includes('kebidanan') || dDept.includes('kandungan'))) ||
            (polyLower.includes('jantung') && (dDept.includes('jantung') || dDept.includes('kardio'))) ||
            (polyLower.includes('dalam') && dDept.includes('dalam')) ||
            (polyLower.includes('bedah') && dDept.includes('bedah')) ||
            (polyLower.includes('saraf') && dDept.includes('saraf'))
          );
        });

        if (matchDoc) {
          targetDoc = typeof matchDoc === 'string' ? matchDoc : matchDoc.name;
        } else {
          const defaultDocObj = doctorList[0];
          targetDoc = (typeof defaultDocObj === 'string' ? defaultDocObj : defaultDocObj?.name) || 'dr. Hendra Wijaya, Sp.PD';
        }
      }

      setDoctor(targetDoc);

      const todayStr = new Date().toISOString().split('T')[0];
      setDate(todayStr);
    }
  }, [visible, initialDoctor, initialPoly, doctors]);

  const handleBooking = async () => {
    if (!patientName || !phone || !date) {
      const msg = 'Mohon lengkapi Nama Pasien, No. Telepon, dan Tanggal Kunjungan.';
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') window.alert(msg);
      } else {
        Alert.alert('Data Belum Lengkap', msg);
      }
      return;
    }

    try {
      setLoading(true);
      const selectedDoc = doctor || doctorList[0]?.name || 'dr. Hendra Wijaya, Sp.PD';
      const res = await publicService.bookPublicAppointment({
        patientName,
        phone,
        email,
        poly,
        doctor: selectedDoc,
        date,
        visitType,
        paymentType,
        complaint,
      });

      if (res?.success || res?.data) {
        const queueNumberFormatted = res.data?.queueNumberFormatted || res.data?.visit?.queueNumberFormatted || 'WEB-1';
        const msg = `Nomor Antrean Web Anda: ${queueNumberFormatted}\n\nSilakan tunjukkan nomor antrean ini saat tiba di loket admisi RS MediSyst.`;

        if (Platform.OS === 'web') {
          if (typeof window !== 'undefined') {
            window.alert(`🎫 Janji Temu Berhasil!\n\n${msg}`);
          }
          setPatientName('');
          setPhone('');
          setEmail('');
          setComplaint('');
          if (onClose) onClose();
        } else {
          Alert.alert(
            '🎫 Janji Temu Berhasil!',
            msg,
            [
              {
                text: 'OK',
                onPress: () => {
                  setPatientName('');
                  setPhone('');
                  setEmail('');
                  setComplaint('');
                  if (onClose) onClose();
                },
              },
            ]
          );
        }
      }
    } catch (err) {
      console.log('Booking error:', err);
      const errMsg = err.response?.data?.error || err.message || 'Gagal membuat janji temu online.';
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') window.alert(`Gagal Pendaftaran: ${errMsg}`);
      } else {
        Alert.alert('Gagal Pendaftaran', errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Calendar Days Generator
  const getCalendarDays = () => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();
    const days = [];

    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      days.push(d);
    }
    return days;
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (dayNum) => {
    if (!dayNum) return;
    const dateObj = new Date(viewYear, viewMonth, dayNum);
    const todayObj = new Date();
    todayObj.setHours(0, 0, 0, 0);

    if (dateObj < todayObj) {
      Alert.alert('Tanggal Tidak Valid', 'Silakan pilih tanggal hari ini atau tanggal mendatang.');
      return;
    }

    const monthStr = String(viewMonth + 1).padStart(2, '0');
    const dayStr = String(dayNum).padStart(2, '0');
    const formatted = `${viewYear}-${monthStr}-${dayStr}`;
    setDate(formatted);
    setShowCalendar(false);
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'Pilih Tanggal Kunjungan';
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0]);
      const m = parseInt(parts[1]) - 1;
      const d = parseInt(parts[2]);
      const dateObj = new Date(y, m, d);
      return dateObj.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
    return dateString;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Pendaftaran Janji Temu Online</Text>
              <Text style={styles.headerSubtitle}>RS MediSyst • Prioritas Antrean Web Pasien</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Nama Lengkap Pasien *</Text>
            <TextInput
              style={styles.input}
              placeholder="Masukkan nama lengkap pasien"
              value={patientName}
              onChangeText={setPatientName}
            />

            <Text style={styles.label}>Nomor WhatsApp / Telepon *</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: 081234567890"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <Text style={styles.label}>Email (Opsional)</Text>
            <TextInput
              style={styles.input}
              placeholder="email@contoh.com"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            {/* Select Dropdown: Dokter Spesialis FIRST */}
            <Text style={styles.label}>Dokter Spesialis *</Text>
            <TouchableOpacity
              style={styles.selectBox}
              onPress={() => {
                setShowDoctorDropdown(!showDoctorDropdown);
                setShowPolyDropdown(false);
                setShowCalendar(false);
              }}
            >
              <Text style={styles.selectBoxText}>{doctor || 'Pilih Dokter Spesialis'}</Text>
              <Text style={styles.selectArrow}>{showDoctorDropdown ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showDoctorDropdown && (
              <View style={styles.dropdownContainer}>
                {doctorList.map((docItem, idx) => {
                  const docLabel = typeof docItem === 'string' ? docItem : docItem.name;
                  const docDept = typeof docItem === 'object' && docItem.department ? docItem.department : '';
                  const fullLabel = `${docLabel}${docDept ? ` (${docDept})` : ''}`;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.dropdownItem, doctor === docLabel && styles.dropdownItemActive]}
                      onPress={() => {
                        setDoctor(docLabel);
                        let targetDept = docDept;
                        if (!targetDept) {
                          if (docLabel.includes('Sp.PD')) targetDept = 'Penyakit Dalam';
                          else if (docLabel.includes('Sp.A')) targetDept = 'Anak';
                          else if (docLabel.includes('Sp.OG')) targetDept = 'Kebidanan & Kandungan';
                          else if (docLabel.includes('Sp.JP')) targetDept = 'Jantung';
                          else if (docLabel.includes('Sp.B')) targetDept = 'Bedah';
                          else if (docLabel.includes('Sp.N') || docLabel.includes('Sp.S')) targetDept = 'Saraf';
                        }
                        setPoly(mapDeptToClinic(targetDept));
                        setShowDoctorDropdown(false);
                      }}
                    >
                      <Text style={[styles.dropdownItemText, doctor === docLabel && styles.dropdownItemTextActive]}>
                        👨‍⚕️ {fullLabel} {doctor === docLabel ? '✓' : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Select Dropdown: Poliklinik Tujuan SECOND */}
            <Text style={styles.label}>Poliklinik Tujuan *</Text>
            <TouchableOpacity
              style={styles.selectBox}
              onPress={() => {
                setShowPolyDropdown(!showPolyDropdown);
                setShowDoctorDropdown(false);
                setShowCalendar(false);
              }}
            >
              <Text style={styles.selectBoxText}>{poly || 'Pilih Poliklinik'}</Text>
              <Text style={styles.selectArrow}>{showPolyDropdown ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showPolyDropdown && (
              <View style={styles.dropdownContainer}>
                {(polyOptions.includes(poly) ? polyOptions : [...polyOptions, poly]).map((opt, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.dropdownItem, poly === opt && styles.dropdownItemActive]}
                    onPress={() => {
                      setPoly(opt);
                      const polyLower = opt.toLowerCase();
                      const matchDoc = doctorList.find((d) => {
                        const dDept = (typeof d === 'object' && d.department ? d.department : '').toLowerCase();
                        return dDept && (
                          polyLower.includes(dDept) || dDept.includes(polyLower) ||
                          (polyLower.includes('anak') && dDept.includes('anak')) ||
                          (polyLower.includes('obgyn') && (dDept.includes('obgyn') || dDept.includes('kebidanan') || dDept.includes('kandungan'))) ||
                          (polyLower.includes('jantung') && (dDept.includes('jantung') || dDept.includes('kardio'))) ||
                          (polyLower.includes('dalam') && dDept.includes('dalam')) ||
                          (polyLower.includes('bedah') && dDept.includes('bedah')) ||
                          (polyLower.includes('saraf') && dDept.includes('saraf'))
                        );
                      });
                      if (matchDoc) {
                        setDoctor(typeof matchDoc === 'string' ? matchDoc : matchDoc.name);
                      }
                      setShowPolyDropdown(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, poly === opt && styles.dropdownItemTextActive]}>
                      {opt} {poly === opt ? '✓' : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Interactive Visual DatePicker Component */}
            <Text style={styles.label}>Tanggal Kunjungan *</Text>
            <TouchableOpacity
              style={styles.datePickerBox}
              onPress={() => {
                setShowCalendar(!showCalendar);
                setShowPolyDropdown(false);
                setShowDoctorDropdown(false);
              }}
            >
              <View style={styles.datePickerLeft}>
                <Text style={{ fontSize: 18, marginRight: 8 }}>📅</Text>
                <Text style={styles.datePickerText}>{formatDisplayDate(date)}</Text>
              </View>
              <Text style={styles.selectArrow}>{showCalendar ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {/* Calendar Grid Picker */}
            {showCalendar && (
              <View style={styles.calendarContainer}>
                {/* Calendar Header Month Navigator */}
                <View style={styles.calendarNav}>
                  <TouchableOpacity style={styles.navArrowBtn} onPress={handlePrevMonth}>
                    <Text style={styles.navArrowText}>◀</Text>
                  </TouchableOpacity>

                  <Text style={styles.calendarMonthTitle}>
                    {monthNames[viewMonth]} {viewYear}
                  </Text>

                  <TouchableOpacity style={styles.navArrowBtn} onPress={handleNextMonth}>
                    <Text style={styles.navArrowText}>▶</Text>
                  </TouchableOpacity>
                </View>

                {/* Day Names Header */}
                <View style={styles.dayNamesRow}>
                  {dayNames.map((name) => (
                    <Text key={name} style={styles.dayNameCell}>
                      {name}
                    </Text>
                  ))}
                </View>

                {/* Calendar Days Grid */}
                <View style={styles.daysGrid}>
                  {getCalendarDays().map((dayNum, idx) => {
                    if (!dayNum) {
                      return <View key={idx} style={styles.dayCellEmpty} />;
                    }

                    const checkDateObj = new Date(viewYear, viewMonth, dayNum);
                    const todayZero = new Date();
                    todayZero.setHours(0, 0, 0, 0);
                    const isPast = checkDateObj < todayZero;

                    const dateFormattedStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const isSelected = date === dateFormattedStr;

                    return (
                      <TouchableOpacity
                        key={idx}
                        disabled={isPast}
                        style={[
                          styles.dayCell,
                          isSelected && styles.dayCellSelected,
                          isPast && styles.dayCellDisabled,
                        ]}
                        onPress={() => handleSelectDay(dayNum)}
                      >
                        <Text
                          style={[
                            styles.dayCellText,
                            isSelected && styles.dayCellTextSelected,
                            isPast && styles.dayCellTextDisabled,
                          ]}
                        >
                          {dayNum}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Quick Preset Date Chips */}
            <View style={styles.quickDateRow}>
              {[
                { label: 'Hari Ini', days: 0 },
                { label: 'Besok', days: 1 },
                { label: 'Lusa (+2d)', days: 2 },
                { label: '+7 Hari', days: 7 },
              ].map((item) => {
                const targetDate = new Date();
                targetDate.setDate(targetDate.getDate() + item.days);
                const dateStr = targetDate.toISOString().split('T')[0];
                const isActive = date === dateStr;

                return (
                  <TouchableOpacity
                    key={item.days}
                    style={[styles.quickDateChip, isActive && styles.quickDateChipActive]}
                    onPress={() => setDate(dateStr)}
                  >
                    <Text style={[styles.quickDateChipText, isActive && styles.quickDateChipTextActive]}>
                      ⚡ {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Tipe Kunjungan Dropdown */}
            <Text style={styles.label}>Tipe Kunjungan *</Text>
            <TouchableOpacity
              style={styles.selectBox}
              onPress={() => {
                setShowVisitTypeDropdown(!showVisitTypeDropdown);
                setShowPolyDropdown(false);
                setShowDoctorDropdown(false);
                setShowCalendar(false);
              }}
            >
              <Text style={styles.selectBoxText}>
                {visitTypeOptions.find((v) => v.value === visitType)?.label || '📋 Rawat Jalan (Outpatient)'}
              </Text>
              <Text style={styles.selectArrow}>{showVisitTypeDropdown ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showVisitTypeDropdown && (
              <View style={styles.dropdownContainer}>
                {visitTypeOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.dropdownItem, visitType === opt.value && styles.dropdownItemActive]}
                    onPress={() => {
                      setVisitType(opt.value);
                      setShowVisitTypeDropdown(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, visitType === opt.value && styles.dropdownItemTextActive]}>
                      {opt.label} {visitType === opt.value ? '✓' : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.label}>Jenis Pembayaran</Text>
            <View style={styles.radioGroup}>
              {['BPJS Kesehatan', 'Asuransi Swasta', 'Umum / Mandiri'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.radioButton, paymentType === type && styles.radioButtonActive]}
                  onPress={() => setPaymentType(type)}
                >
                  <Text style={[styles.radioText, paymentType === type && styles.radioTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Keluhan Utama (Opsional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tuliskan keluhan atau gejala singkat..."
              multiline={true}
              numberOfLines={3}
              value={complaint}
              onChangeText={setComplaint}
            />
          </ScrollView>

          {/* Footer Submit */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.submitBtn} onPress={handleBooking} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitBtnText}>Konfirmasi & Ambil Antrean →</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: RADII.xl,
    borderTopRightRadius: RADII.xl,
    maxHeight: '90%',
    paddingBottom: 24,
    ...SHADOWS.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.primary600,
    fontWeight: '700',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 14,
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
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  selectBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.primary600,
    borderRadius: RADII.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectBoxText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  selectArrow: {
    fontSize: 12,
    color: COLORS.primary600,
    fontWeight: '900',
  },
  dropdownContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    marginTop: 4,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  dropdownItemActive: {
    backgroundColor: COLORS.primary50,
  },
  dropdownItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  dropdownItemTextActive: {
    color: COLORS.primary600,
    fontWeight: '800',
  },

  /* DatePicker Component Styles */
  datePickerBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: COLORS.primary600,
    borderRadius: RADII.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  datePickerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  datePickerText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary600,
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.lg,
    padding: 14,
    marginTop: 6,
    ...SHADOWS.md,
  },
  calendarNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  navArrowBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: RADII.md,
  },
  navArrowText: {
    fontSize: 12,
    color: COLORS.primary600,
    fontWeight: '900',
  },
  calendarMonthTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  dayNamesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingBottom: 6,
    marginBottom: 6,
  },
  dayNameCell: {
    width: '14%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellEmpty: {
    width: '14%',
    height: 36,
  },
  dayCell: {
    width: '14%',
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.md,
    marginVertical: 2,
  },
  dayCellSelected: {
    backgroundColor: COLORS.primary600,
  },
  dayCellDisabled: {
    opacity: 0.25,
  },
  dayCellText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  dayCellTextSelected: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  dayCellTextDisabled: {
    color: COLORS.textMuted,
  },

  quickDateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  quickDateChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickDateChipActive: {
    backgroundColor: COLORS.primary50,
    borderColor: COLORS.primary600,
  },
  quickDateChipText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  quickDateChipTextActive: {
    color: COLORS.primary600,
    fontWeight: '800',
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  radioButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#F8FAFC',
  },
  radioButtonActive: {
    backgroundColor: COLORS.primary50,
    borderColor: COLORS.primary600,
  },
  radioText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  radioTextActive: {
    color: COLORS.primary600,
    fontWeight: '800',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  submitBtn: {
    backgroundColor: COLORS.primary600,
    borderRadius: RADII.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
