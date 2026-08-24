import { Platform } from 'react-native';

// For Android emulator 10.0.2.2 connects to host computer's localhost.
// For physical devices on the same Wi-Fi, change this to computer's IP (e.g. http://192.168.1.100:5000/api)
const DEFAULT_HOST = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || `${DEFAULT_HOST}/api`;
