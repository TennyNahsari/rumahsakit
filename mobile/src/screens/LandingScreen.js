import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Linking,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SHADOWS, RADII } from '../constants/theme';
import { publicService } from '../services/api';
import { BookingModal } from '../components/BookingModal';
import { useAuth } from '../context/AuthContext';

export const LandingScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [polyclinics, setPolyclinics] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedPoly, setSelectedPoly] = useState('Poli Penyakit Dalam');
  const [selectedVisitType, setSelectedVisitType] = useState('OUTPATIENT');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [docRes, polyRes] = await Promise.allSettled([
        publicService.getDoctors(),
        publicService.getPolyclinics(),
      ]);

      if (docRes.status === 'fulfilled' && docRes.value?.data?.doctors) {
        setDoctors(docRes.value.data.doctors);
      }

      if (polyRes.status === 'fulfilled' && polyRes.value?.data) {
        const polyList = polyRes.value.data.polyclinics || polyRes.value.data.data?.polyclinics || [];
        setPolyclinics(polyList);
      }
    } catch (e) {
      console.log('Error fetching initial data on mobile landing:', e.message);
    }
  };

  const handleOpenBooking = (docName = '', polyName = 'Poli Penyakit Dalam', vType = 'OUTPATIENT') => {
    setSelectedDoctor(docName);
    setSelectedPoly(polyName);
    setSelectedVisitType(vType);
    setModalVisible(true);
  };

  const handleCallEmergency = () => {
    Linking.openURL('tel:0215559999');
  };

  // Medical Clinics
  const medicalServices = [
    {
      id: 'internal',
      title: 'Poliklinik Penyakit Dalam',
      sub: 'Internal Medicine Clinic',
      icon: '🩺',
      color: '#EFF6FF',
      borderColor: '#BFDBFE',
      desc: 'Penanganan penyakit metabolik, diabetes, hipertensi, pencernaan & ginjal oleh konsultan senior.',
      features: ['Konsultasi Diabetes & Endokrin', 'Endoskopi Saluran Cerna', 'Skrining Kardiometabolik'],
    },
    {
      id: 'pediatric',
      title: 'Poliklinik Anak & Tumbuh Kembang',
      sub: 'Pediatric & Child Health',
      icon: '👶',
      color: '#ECFDF5',
      borderColor: '#A7F3D0',
      desc: 'Imunisasi rutin lengkap, pemantauan tumbuh kembang, hingga penanganan PICU/NICU anak.',
      features: ['Imunisasi Lengkap Anak', 'Klinik Tumbuh Kembang & Terapi', 'Rawat Intensif Anak (PICU/NICU)'],
    },
    {
      id: 'obgyn',
      title: 'Kebidanan & Kandungan (Obgyn)',
      sub: 'Obstetrics & Gynecology',
      icon: '🤰',
      color: '#FDF2F8',
      borderColor: '#FBCFE8',
      desc: 'Pemeriksaan USG 4D, persalinan metode ERACS nyaman, dan kesehatan reproduksi.',
      features: ['Pemeriksaan Kehamilan USG 4D', 'Persalinan Metode ERACS', 'Skrining Kanker Serviks'],
    },
    {
      id: 'cardio',
      title: 'Pusat Jantung & Pembuluh Darah',
      sub: 'Cardiovascular Center',
      icon: '❤️',
      color: '#FEF2F2',
      borderColor: '#FECACA',
      desc: 'Echocardiography Doppler, EKG 12 Lead, treadmill stress test & rehabilitasi jantung.',
      features: ['Echocardiography Doppler', 'Treadmill Stress Test', 'Unit Perawatan Intensi Jantung (ICCU)'],
    },
    {
      id: 'surgery',
      title: 'Bedah Umum & Ortopedi',
      sub: 'General & Orthopedic Surgery',
      icon: '🏥',
      color: '#EEF2FF',
      borderColor: '#C7D2FE',
      desc: 'Bedah minimal invasif (Laparoskopi), operasi fraktur tulang & kamar bedah steril HEPA Filter.',
      features: ['Bedah Laparoskopi Minimal Invasif', 'Operasi Tulang & Sendi (Ortopedi)', 'Kamar Bedah Steril HEPA Filter'],
    },
    {
      id: 'emergency',
      title: 'Instalasi Gawat Darurat 24 Jam',
      sub: '24/7 Emergency Center',
      icon: '🚑',
      color: '#FFFBEB',
      borderColor: '#FDE68A',
      desc: 'Tim resusitasi darurat 24 jam dengan sertifikasi ACLS/ATLS siap tanggap medis.',
      features: ['Hotline Ambulans Jemput 24 Jam', 'Ruang Resusitasi Kritis', 'Laboratorium & Radiologi Cepat'],
    },
  ];

  // Inpatient Wards
  const inpatientRooms = [
    { class: 'Suite VVIP MediSyst', beds: '1 Bed / Room', price: 'Rp 2.500.000 / hari', features: ['Ruang Tamu Keluarga Terpisah', 'Bed Pasien Elektrik Otomatis', 'Smart TV 50" & WiFi High-Speed', 'Sofa Bed Keluarga & Mini Bar'] },
    { class: 'VIP Executive', beds: '1 Bed / Room', price: 'Rp 1.500.000 / hari', features: ['Bed Pasien Elektrik', 'Smart TV & AC Sentral', 'Sofa Penunggu Pasien', 'Kamar Mandi Dalam'] },
    { class: 'Kelas 1 (Deluxe)', beds: '2 Bed / Room', price: 'Rp 750.000 / hari', features: ['2 Tempat Tidur dengan Tirai Penyekat', 'AC & TV LED', 'Nurses Call Button di Setiap Bed'] },
    { class: 'Kelas 2 & 3 (Standard)', beds: '3-4 Bed / Room', price: 'BPJS Kesehatan Ready', features: ['Tirai Penyekat Privasi', 'Pemantauan Keperawatan 24 Jam', 'Tercover Penuh BPJS Kesehatan'] },
  ];

  // Patient Journey Steps
  const patientJourneySteps = [
    { number: '01', title: 'Pendaftaran & Janji Temu', role: 'Pasien / Keluarga', desc: 'Mendaftar secara online via aplikasi mobile atau langsung di loket admisi.' },
    { number: '02', title: 'Triase & Asesmen Vital', role: 'Perawat Poliklinik', desc: 'Pemeriksaan tekanan darah, suhu, berat badan, dan riwayat alergi.' },
    { number: '03', title: 'Konsultasi Spesialis', role: 'Dokter Spesialis', desc: 'Pemeriksaan fisik langsung oleh dokter spesialis dan pencatatan EMR.' },
    { number: '04', title: 'Penunjang & E-Resep', role: 'Lab & Farmasi 24H', desc: 'Pemeriksaan darah/radiologi dan pengambilan obat ber-barcode.' },
    { number: '05', title: 'Pemulangan / Admisi', role: 'Kasir & Wards', desc: 'Pelunasan billing (BPJS / Asuransi / Umum) atau admisi bangsal.' },
  ];
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

  const getDisplayServices = () => {
    if (polyclinics && Array.isArray(polyclinics) && polyclinics.length > 0) {
      return polyclinics.map((poly, index) => {
        const iconEmoji = iconEmojiMap[poly.icon] || '🏥';
        const features = Array.isArray(poly.services) && poly.services.length > 0
          ? poly.services
          : [`Konsultasi ${poly.name}`, 'Pemeriksaan Diagnostik Presisi'];

        return {
          id: poly.id || `poly-${index}`,
          title: poly.name,
          sub: poly.englishName || 'SPECIALTY CLINIC',
          icon: iconEmoji,
          color: '#EFF6FF',
          borderColor: '#BFDBFE',
          desc: poly.description || 'Penanganan medis spesialis terpadu oleh konsultan senior.',
          features: features,
        };
      });
    }
    return medicalServices || [];
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 1. Website Style Header Bar */}
      <View style={styles.header}>
        <View style={styles.brandGroup}>
          <View style={styles.logoBadge}>
            <Text style={{ fontSize: 20 }}>⚡</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>
              Medi<Text style={{ color: COLORS.primary }}>Syst</Text>{' '}
              <Text style={styles.brandTag}>HOSPITAL</Text>
            </Text>
            <Text style={styles.brandSub}>RUMAH SAKIT UMUM TERPADU</Text>
          </View>
        </View>

        {user ? (
          <TouchableOpacity style={styles.headerBtnPrimary} onPress={() => navigation.navigate('Dashboard')}>
            <Text style={styles.headerBtnPrimaryText}>Dashboard →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.headerBtnSecondary} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.headerBtnSecondaryText}>Masuk Staff</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 2. Hero Section */}
        <View style={styles.heroBg}>
          <View style={styles.heroCard}>
            {/* Pill Badge */}
            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>✨ RS UMUM TERPADU • SIMRS TERPUSAT</Text>
            </View>

            <Text style={styles.heroTitle}>
              Pelayanan Medis Presisi &{'\n'}
              <Text style={{ color: COLORS.primary }}>Layanan Berkelas</Text>
            </Text>

            <Text style={styles.heroSubtitle}>
              RS MediSyst menghadirkan standar pelayanan medis terpadu dengan dokter spesialis senior, rekam medis elektronik (EMR), serta integrasi penuh BPJS Kesehatan.
            </Text>

            {/* Hero CTAs */}
            <View style={styles.ctaGroup}>
              <TouchableOpacity style={styles.btnPrimary} onPress={() => handleOpenBooking()}>
                <Text style={styles.btnPrimaryText}>📅 Buat Janji Temu Online  →</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.btnEmergency} onPress={handleCallEmergency}>
                <Text style={styles.btnEmergencyText}>🚑 Hotline IGD 24 Jam: (021) 555-9999</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Highlights Stat Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>24/7</Text>
            <Text style={styles.statLabel}>Layanan IGD</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>50+</Text>
            <Text style={styles.statLabel}>Dokter Spesialis</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>100%</Text>
            <Text style={styles.statLabel}>Rekam Medis EMR</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>BPJS</Text>
            <Text style={styles.statLabel}>Bridging Ready</Text>
          </View>
        </View>

        {/* 3. Poliklinik & Layanan Spesialis */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionBadge}>POLIKLINIK & SPESIALIS</Text>
            <Text style={styles.sectionTitle}>Layanan Medis Unggulan</Text>
            <Text style={styles.sectionSubtitle}>
              Pilihan poliklinik spesialis terlengkap yang didukung fasilitas medis modern dan peralatan diagnostik presisi.
            </Text>
          </View>

          <View style={styles.clinicsList}>
            {getDisplayServices().map((service) => (
              <View key={service.id} style={styles.clinicCard}>
                <View style={styles.clinicCardHeader}>
                  <View style={[styles.clinicIconBox, { backgroundColor: service.color, borderColor: service.borderColor }]}>
                    <Text style={{ fontSize: 24 }}>{service.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.clinicSubTitle}>{service.sub}</Text>
                    <Text style={styles.clinicTitle}>{service.title}</Text>
                  </View>
                </View>

                <Text style={styles.clinicDesc}>{service.desc}</Text>

                <View style={styles.featureList}>
                  {service.features.map((feat, fIdx) => (
                    <View key={fIdx} style={styles.featureRow}>
                      <Text style={{ color: COLORS.primary, fontWeight: '900', marginRight: 6 }}>✓</Text>
                      <Text style={styles.featureText}>{feat}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.clinicBookBtn}
                  onPress={() => handleOpenBooking('', service.title)}
                >
                  <Text style={styles.clinicBookBtnText}>Konsultasi Spesialis →</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* 4. Dokter Spesialis */}
        <View style={[styles.section, { backgroundColor: '#F8F9FB' }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionBadge}>DOKTER SPESIALIS</Text>
            <Text style={styles.sectionTitle}>Tim Dokter Konsultan</Text>
            <Text style={styles.sectionSubtitle}>
              Tim dokter spesialis dan konsultan senior siap memberikan pelayanan kesehatan komprehensif.
            </Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}>
            {(doctors.length > 0
              ? doctors
              : [
                  { name: 'dr. Hendra Wijaya, Sp.PD', department: 'Penyakit Dalam', phone: '+62 812-3456-7891' },
                  { name: 'dr. Siti Nurhaliza, Sp.A', department: 'Anak', phone: '+62 812-3456-7892' },
                  { name: 'dr. Budi Santoso, Sp.OG', department: 'Obstetri & Ginekologi', phone: '+62 812-3456-7893' },
                  { name: 'dr. Rina Kusuma, Sp.JP', department: 'Jantung & Pembuluh Darah', phone: '+62 812-3456-7894' },
                ]
            ).map((doc, idx) => (
              <View key={idx} style={styles.doctorCard}>
                <View style={styles.docAvatarBox}>
                  <Text style={{ fontSize: 36 }}>👨‍⚕️</Text>
                </View>
                <Text style={styles.docBadgeTag}>KONSULTAN SENIOR</Text>
                <Text style={styles.docName}>{doc.name}</Text>
                <Text style={styles.docDept}>Spesialis {doc.department || 'Medis'}</Text>
                <Text style={styles.docPhone}>📞 {doc.phone || '+62 812-3456-7890'}</Text>

                <TouchableOpacity
                  style={styles.docActionBtn}
                  onPress={() => handleOpenBooking(doc.name, `Poli ${doc.department || 'Umum'}`)}
                >
                  <Text style={styles.docActionBtnText}>📅 Pilih Dokter</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* 5. Bangsal & Kamar Rawat Inap */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionBadge}>FASILITAS BANGSAL</Text>
            <Text style={styles.sectionTitle}>Kamar Rawat Inap</Text>
            <Text style={styles.sectionSubtitle}>
              Kenyamanan ruang perawatan rawat inap dengan fasilitas keluarga lengkap dan pemantauan perawat 24 jam.
            </Text>
          </View>

          <View style={{ paddingHorizontal: 20, gap: 14 }}>
            {inpatientRooms.map((room, idx) => (
              <View key={idx} style={styles.roomCard}>
                <View style={styles.roomCardTop}>
                  <Text style={styles.roomClass}>{room.class}</Text>
                  <Text style={styles.roomBedsPill}>{room.beds}</Text>
                </View>
                <Text style={styles.roomPrice}>{room.price}</Text>

                <View style={styles.roomFeatureBox}>
                  {room.features.map((f, i) => (
                    <View key={i} style={styles.featureRow}>
                      <Text style={{ color: COLORS.primary, fontWeight: '900', marginRight: 6 }}>✓</Text>
                      <Text style={styles.featureText}>{f}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 6. Patient Care Journey (5 Steps) */}
        <View style={[styles.section, { backgroundColor: '#F8F9FB' }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionBadge}>ALUR PELAYANAN</Text>
            <Text style={styles.sectionTitle}>Alur Pasien RS MediSyst</Text>
          </View>

          <View style={{ paddingHorizontal: 20, gap: 12 }}>
            {patientJourneySteps.map((step, idx) => (
              <View key={idx} style={styles.journeyCard}>
                <View style={styles.journeyHeader}>
                  <View style={styles.journeyNumBox}>
                    <Text style={styles.journeyNumText}>{step.number}</Text>
                  </View>
                  <Text style={styles.journeyRoleBadge}>{step.role}</Text>
                </View>
                <Text style={styles.journeyTitle}>{step.title}</Text>
                <Text style={styles.journeyDesc}>{step.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 7. Emergency Banner */}
        <View style={styles.emergencyBanner}>
          <Text style={styles.emergencyBadge}>🚑 CALL CENTER 24 JAM</Text>
          <Text style={styles.emergencyTitle}>Kondisi Gawat Darurat Medis?</Text>
          <Text style={styles.emergencySub}>
            Tim dokter IGD dan perawat resusitasi bersertifikasi ACLS/ATLS siap menangani 24 jam.
          </Text>

          <TouchableOpacity style={styles.callHotlineBtn} onPress={handleCallEmergency}>
            <Text style={styles.callHotlineBtnText}>📞 Hubungi Hotline (021) 555-9999</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Public Booking Modal */}
      <BookingModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        initialDoctor={selectedDoctor}
        initialPoly={selectedPoly}
        initialVisitType={selectedVisitType}
        doctors={doctors}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: RADII.md,
    backgroundColor: COLORS.primary600,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  brandTag: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary600,
    backgroundColor: COLORS.primary50,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADII.sm,
  },
  brandSub: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  headerBtnSecondary: {
    backgroundColor: COLORS.primary50,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.primary200,
  },
  headerBtnSecondaryText: {
    color: COLORS.primary600,
    fontSize: 12,
    fontWeight: '800',
  },
  headerBtnPrimary: {
    backgroundColor: COLORS.primary600,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADII.md,
  },
  headerBtnPrimaryText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  scrollView: {
    flex: 1,
  },
  heroBg: {
    backgroundColor: COLORS.heroBg, // Slate 900 (#0F172A)
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 28,
  },
  heroCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: RADII.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    ...SHADOWS.lg,
  },
  badgePill: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary50,
    borderWidth: 1,
    borderColor: COLORS.primary200,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    marginBottom: 14,
  },
  badgePillText: {
    color: COLORS.primary600,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.textPrimary,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 10,
    lineHeight: 20,
    fontWeight: '500',
  },
  ctaGroup: {
    marginTop: 20,
    gap: 10,
  },
  btnPrimary: {
    backgroundColor: COLORS.primary600,
    paddingVertical: 14,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  btnPrimaryText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  btnEmergency: {
    backgroundColor: COLORS.danger50,
    borderWidth: 1,
    borderColor: COLORS.danger100,
    paddingVertical: 12,
    borderRadius: RADII.md,
    alignItems: 'center',
  },
  btnEmergencyText: {
    color: COLORS.danger600,
    fontSize: 13,
    fontWeight: '800',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: RADII.md,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: '#60A5FA',
  },
  statLabel: {
    fontSize: 9,
    color: '#CBD5E1',
    marginTop: 2,
    textAlign: 'center',
    fontWeight: '700',
  },
  section: {
    paddingVertical: 24,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary600,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginTop: 2,
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    lineHeight: 18,
    fontWeight: '500',
  },
  clinicsList: {
    paddingHorizontal: 20,
    gap: 14,
  },
  clinicCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADII.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  clinicCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clinicIconBox: {
    width: 46,
    height: 46,
    borderRadius: RADII.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clinicSubTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  clinicTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  clinicDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 10,
    lineHeight: 18,
  },
  featureList: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: 6,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 11,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  clinicBookBtn: {
    marginTop: 14,
    backgroundColor: COLORS.primary50,
    borderWidth: 1,
    borderColor: COLORS.primary200,
    paddingVertical: 10,
    borderRadius: RADII.md,
    alignItems: 'center',
  },
  clinicBookBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary600,
  },
  doctorCard: {
    width: 200,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADII.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  docAvatarBox: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.primary50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  docBadgeTag: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.primary600,
    backgroundColor: COLORS.primary50,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADII.sm,
    marginBottom: 6,
  },
  docName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  docDept: {
    fontSize: 11,
    color: COLORS.primary600,
    fontWeight: '700',
    marginTop: 2,
  },
  docPhone: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  docActionBtn: {
    marginTop: 14,
    backgroundColor: COLORS.primary600,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: RADII.md,
    width: '100%',
    alignItems: 'center',
  },
  docActionBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  roomCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADII.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  roomCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomClass: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  roomBedsPill: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary600,
    backgroundColor: COLORS.primary50,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADII.sm,
  },
  roomPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.success600,
    marginTop: 4,
  },
  roomFeatureBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: 4,
  },
  journeyCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADII.md,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  journeyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  journeyNumBox: {
    width: 28,
    height: 28,
    borderRadius: RADII.sm,
    backgroundColor: COLORS.primary600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  journeyNumText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
  },
  journeyRoleBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    backgroundColor: COLORS.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADII.sm,
  },
  journeyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  journeyDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  emergencyBanner: {
    marginHorizontal: 20,
    marginVertical: 28,
    backgroundColor: COLORS.primary600,
    borderRadius: RADII.xl,
    padding: 20,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  emergencyBadge: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFF',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADII.pill,
    marginBottom: 10,
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFF',
    textAlign: 'center',
  },
  emergencySub: {
    fontSize: 12,
    color: '#DBEAFE',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  callHotlineBtn: {
    marginTop: 16,
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: RADII.md,
  },
  callHotlineBtnText: {
    color: COLORS.danger600,
    fontSize: 13,
    fontWeight: '900',
  },
});
