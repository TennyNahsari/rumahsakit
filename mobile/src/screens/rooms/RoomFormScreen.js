import React, { useState } from 'react';
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
import { roomService } from '../../services/api';

const ROOM_TYPES = ['VIP', 'KELAS_1', 'KELAS_2', 'KELAS_3', 'ICU', 'NICU', 'PICU', 'ISOLATION'];
const ROOM_STATUSES = [
  { label: '🟢 Tersedia (AVAILABLE)', value: 'AVAILABLE' },
  { label: '🛠️ Perbaikan (MAINTENANCE)', value: 'MAINTENANCE' },
  { label: '🧹 Pembersihan (CLEANING)', value: 'CLEANING' },
];
const FACILITY_OPTIONS = ['AC', 'TV', 'BATHROOM', 'FRIDGE', 'WIFI', 'PHONE', 'SOFA', 'WARDROBE'];

export const RoomFormScreen = ({ route, navigation }) => {
  const roomData = route.params?.roomData || null;
  const isEdit = !!roomData;

  const [roomNumber, setRoomNumber] = useState(roomData?.roomNumber || '');
  const [roomName, setRoomName] = useState(roomData?.roomName || '');
  const [roomType, setRoomType] = useState(roomData?.roomType || 'VIP');
  const [floor, setFloor] = useState(roomData?.floor ? String(roomData.floor) : '1');
  const [building, setBuilding] = useState(roomData?.building || 'Gedung Utama');
  const [bedCapacity, setBedCapacity] = useState(roomData?.bedCapacity ? String(roomData.bedCapacity) : '1');
  const [pricePerDay, setPricePerDay] = useState(roomData?.pricePerDay ? String(roomData.pricePerDay) : '');
  const [status, setStatus] = useState(roomData?.status || 'AVAILABLE');
  const [facilities, setFacilities] = useState(() => {
    if (roomData?.facilities) {
      if (Array.isArray(roomData.facilities)) return roomData.facilities;
      if (typeof roomData.facilities === 'string') return roomData.facilities.split(',').map((s) => s.trim());
    }
    return ['AC', 'TV', 'BATHROOM', 'WIFI'];
  });
  const [description, setDescription] = useState(roomData?.description || '');
  const [submitting, setSubmitting] = useState(false);

  // Dropdown UI states
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const toggleFacility = (fac) => {
    if (facilities.includes(fac)) {
      setFacilities(facilities.filter((f) => f !== fac));
    } else {
      setFacilities([...facilities, fac]);
    }
  };

  const handleSubmit = async () => {
    if (!roomNumber.trim() || !pricePerDay) {
      const msg = 'Mohon isi Nomor Kamar dan Tarif Per Hari.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
      else Alert.alert('Validasi', msg);
      return;
    }

    const numPrice = parseFloat(pricePerDay);
    if (isNaN(numPrice) || numPrice < 0) {
      const msg = 'Tarif per hari harus berupa angka positif.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
      else Alert.alert('Validasi', msg);
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        roomNumber: roomNumber.trim().toUpperCase(),
        roomName: roomName.trim() || null,
        roomType: roomType,
        floor: parseInt(floor) || 1,
        building: building.trim() || null,
        bedCapacity: parseInt(bedCapacity) || 1,
        pricePerDay: numPrice,
        facilities: facilities,
        description: description.trim() || null,
        status: status,
      };

      if (isEdit) {
        await roomService.updateRoom(roomData.id, payload);
      } else {
        await roomService.createRoom(payload);
      }

      const msg = isEdit ? '✅ Data kamar berhasil diperbarui!' : '✅ Data kamar baru berhasil ditambahkan!';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
      else Alert.alert('Berhasil', msg);

      navigation.navigate('Rooms', { refresh: true });
    } catch (err) {
      console.log('Error saving room:', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Gagal menyimpan data kamar.';
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
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Data Kamar' : 'Tambah Kamar Baru'}</Text>
        <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.saveHeaderBtnText}>{submitting ? '...' : 'Simpan'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Card 1: Informasi Utama Kamar */}
        <View style={styles.card}>
          <Text style={styles.label}>Nomor Kamar *</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: VIP-101"
            autoCapitalize="characters"
            value={roomNumber}
            onChangeText={setRoomNumber}
          />

          <Text style={styles.label}>Nama Kamar (Opsional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: Kamar Suite VVIP A"
            value={roomName}
            onChangeText={setRoomName}
          />

          <Text style={styles.label}>Tipe Kelas Kamar *</Text>
          <TouchableOpacity
            style={styles.selectBox}
            onPress={() => {
              setShowTypeDropdown(!showTypeDropdown);
              setShowStatusDropdown(false);
            }}
          >
            <Text style={styles.selectBoxText}>{roomType}</Text>
            <Text style={styles.selectArrow}>{showTypeDropdown ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showTypeDropdown && (
            <View style={styles.dropdownContainer}>
              {ROOM_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.dropdownItem, roomType === t && styles.dropdownItemActive]}
                  onPress={() => {
                    setRoomType(t);
                    setShowTypeDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, roomType === t && styles.dropdownItemTextActive]}>
                    {t} {roomType === t ? '✓' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Lantai *</Text>
              <TextInput
                style={styles.input}
                placeholder="1"
                keyboardType="numeric"
                value={floor}
                onChangeText={setFloor}
              />
            </View>
            <View style={{ flex: 2 }}>
              <Text style={styles.label}>Gedung / Bangsal</Text>
              <TextInput
                style={styles.input}
                placeholder="Gedung Utama"
                value={building}
                onChangeText={setBuilding}
              />
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Kapasitas Bed *</Text>
              <TextInput
                style={styles.input}
                placeholder="1"
                keyboardType="numeric"
                value={bedCapacity}
                onChangeText={setBedCapacity}
              />
            </View>
            <View style={{ flex: 2 }}>
              <Text style={styles.label}>Tarif Per Hari (Rp) *</Text>
              <TextInput
                style={styles.input}
                placeholder="1500000"
                keyboardType="numeric"
                value={pricePerDay}
                onChangeText={setPricePerDay}
              />
            </View>
          </View>

          <Text style={styles.label}>Status Operasional Kamar *</Text>
          <TouchableOpacity
            style={styles.selectBox}
            onPress={() => {
              setShowStatusDropdown(!showStatusDropdown);
              setShowTypeDropdown(false);
            }}
          >
            <Text style={styles.selectBoxText}>
              {ROOM_STATUSES.find((s) => s.value === status)?.label || status}
            </Text>
            <Text style={styles.selectArrow}>{showStatusDropdown ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showStatusDropdown && (
            <View style={styles.dropdownContainer}>
              {ROOM_STATUSES.map((st) => (
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
        </View>

        {/* Card 2: Fasilitas Kamar & Deskripsi */}
        <View style={styles.card}>
          <Text style={styles.label}>Fasilitas Kamar Perawatan</Text>
          <View style={styles.facilityGrid}>
            {FACILITY_OPTIONS.map((fac) => {
              const isSelected = facilities.includes(fac);
              return (
                <TouchableOpacity
                  key={fac}
                  style={[styles.facilityChip, isSelected && styles.facilityChipActive]}
                  onPress={() => toggleFacility(fac)}
                >
                  <Text style={[styles.facilityChipText, isSelected && styles.facilityChipTextActive]}>
                    {isSelected ? '✓ ' : '+ '}{fac}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.label, { marginTop: 12 }]}>Deskripsi & Catatan SIMRS</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Deskripsi fasilitas, view pemandangan, atau instruksi perawat..."
            multiline
            numberOfLines={3}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>{isEdit ? '💾 Simpan Perubahan Kamar' : '➕ Tambah Kamar Baru'}</Text>
          )}
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
  textArea: {
    minHeight: 70,
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
  facilityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  facilityChip: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADII.sm,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  facilityChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  facilityChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  facilityChipTextActive: {
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
