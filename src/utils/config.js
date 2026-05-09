import { Platform } from 'react-native';

// 1. FOR PHYSICAL DEVICES: Use your computer's IP address (e.g., '192.168.1.113')
// 2. FOR ANDROID EMULATORS: Use '10.0.2.2'
// 3. FOR IOS SIMULATORS: Use 'localhost' or your computer's IP

const MAC_IP = '192.168.1.95';

const host = Platform.select({
  android: MAC_IP, // Change to '10.0.2.2' if using Android Emulator
  ios: MAC_IP,     // Using Mac IP for both physical device and simulator consistency
  default: MAC_IP,
});

export const API_BASE_URL = `http://${host}:5001/api`;
