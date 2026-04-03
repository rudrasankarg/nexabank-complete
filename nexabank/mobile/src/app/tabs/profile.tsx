import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Switch
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';

const menuItems = [
  { section: 'Account', items: [
    { icon: 'person-outline', label: 'Personal Information', route: null },
    { icon: 'shield-checkmark-outline', label: 'KYC Status', route: null },
    { icon: 'card-outline', label: 'Manage Cards', route: '/(tabs)/cards' },
    { icon: 'business-outline', label: 'Branch Details', route: null },
  ]},
  { section: 'Security', items: [
    { icon: 'lock-closed-outline', label: 'Change Password', route: null },
    { icon: 'finger-print-outline', label: 'Biometric Login', toggle: true, key: 'biometric' },
    { icon: 'shield-outline', label: 'Two-Factor Auth', route: null },
    { icon: 'phone-portrait-outline', label: 'Linked Devices', route: null },
  ]},
  { section: 'Preferences', items: [
    { icon: 'notifications-outline', label: 'Notifications', toggle: true, key: 'notifications' },
    { icon: 'moon-outline', label: 'Dark Mode', toggle: true, key: 'darkMode' },
    { icon: 'language-outline', label: 'Language', value: 'English' },
  ]},
  { section: 'Support', items: [
    { icon: 'help-circle-outline', label: 'Help Center', route: null },
    { icon: 'chatbubble-outline', label: 'Chat Support', route: null },
    { icon: 'call-outline', label: 'Call: 1800-XXX-XXXX', route: null },
    { icon: 'document-text-outline', label: 'Terms & Privacy', route: null },
  ]},
];

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [toggles, setToggles] = useState({ biometric: false, notifications: true, darkMode: true });

  useEffect(() => {
    SecureStore.getItemAsync('user').then(u => u && setUser(JSON.parse(u)));
    SecureStore.getItemAsync('biometric_enabled').then(v => {
      if (v === 'true') setToggles(prev => ({ ...prev, biometric: true }));
    });
  }, []);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive', onPress: async () => {
          await SecureStore.deleteItemAsync('access_token');
          await SecureStore.deleteItemAsync('refresh_token');
          await SecureStore.deleteItemAsync('user');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.replace('/auth/login');
        }
      }
    ]);
  };

  const toggleBiometric = async (val: boolean) => {
    if (val) {
      const supported = await LocalAuthentication.hasHardwareAsync();
      if (!supported) { Alert.alert('Not Supported', 'Biometric not available on this device'); return; }
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Enable biometric login' });
      if (!result.success) return;
    }
    setToggles(prev => ({ ...prev, biometric: val }));
    await SecureStore.setItemAsync('biometric_enabled', val.toString());
  };

  const handleToggle = (key: string, val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (key === 'biometric') { toggleBiometric(val); return; }
    setToggles(prev => ({ ...prev, [key]: val }));
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.full_name?.charAt(0) || 'U'}</Text>
          </View>
          <TouchableOpacity style={styles.editAvatar}>
            <Ionicons name="camera-outline" size={14} color="white" />
          </TouchableOpacity>
        </View>
        <Text style={styles.name}>{user?.full_name || 'User'}</Text>
        <Text style={styles.customerId}>{user?.customer_id || 'NexaBank Customer'}</Text>
        <View style={styles.statusRow}>
          <View style={[styles.badge, user?.kyc_status === 'approved' ? styles.badgeGreen : styles.badgeAmber]}>
            <Text style={styles.badgeText}>KYC: {user?.kyc_status || 'Pending'}</Text>
          </View>
          <View style={styles.badgeBlue}>
            <Text style={styles.badgeText}>Active</Text>
          </View>
        </View>
      </View>

      {/* Quick stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'Accounts', value: '1', icon: 'business-outline' },
          { label: 'Cards', value: '1', icon: 'card-outline' },
          { label: 'Loans', value: '0', icon: 'cash-outline' },
        ].map(({ label, value, icon }) => (
          <View key={label} style={styles.statItem}>
            <Ionicons name={icon as any} size={20} color="#3366ff" />
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Menu sections */}
      {menuItems.map(section => (
        <View key={section.section} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.section}</Text>
          <View style={styles.sectionCard}>
            {section.items.map((item, idx) => (
              <TouchableOpacity key={item.label}
                style={[styles.menuItem, idx < section.items.length - 1 && styles.menuItemBorder]}
                onPress={() => {
                  if (item.route) router.push(item.route as any);
                  else if (!item.toggle) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={item.toggle ? 1 : 0.7}>
                <View style={styles.menuLeft}>
                  <View style={styles.menuIconWrap}>
                    <Ionicons name={item.icon as any} size={18} color="#64748b" />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                </View>
                {item.toggle && item.key ? (
                  <Switch
                    value={toggles[item.key as keyof typeof toggles]}
                    onValueChange={val => handleToggle(item.key!, val)}
                    trackColor={{ false: '#334155', true: '#3366ff' }}
                    thumbColor="white"
                  />
                ) : item.value ? (
                  <Text style={styles.menuValue}>{item.value}</Text>
                ) : (
                  <Ionicons name="chevron-forward" size={16} color="#334155" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>NexaBank v1.0.0 · © 2024</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20 },
  avatarContainer: { position: 'relative', marginBottom: 14 },
  avatar: { width: 84, height: 84, borderRadius: 24, backgroundColor: '#3366ff', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: 'white', fontSize: 36, fontWeight: '700' },
  editAvatar: { position: 'absolute', bottom: -4, right: -4, width: 28, height: 28, backgroundColor: '#1e293b', borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#0f172a' },
  name: { color: 'white', fontSize: 20, fontWeight: '700', marginBottom: 4 },
  customerId: { color: '#64748b', fontSize: 13, fontFamily: 'monospace', marginBottom: 10 },
  statusRow: { flexDirection: 'row', gap: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeGreen: { backgroundColor: 'rgba(16,185,129,0.15)' },
  badgeAmber: { backgroundColor: 'rgba(245,158,11,0.15)' },
  badgeBlue: { backgroundColor: 'rgba(51,102,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: '#94a3b8', fontSize: 12, fontWeight: '500' },
  statsRow: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: '#1e293b', borderRadius: 20, padding: 16, marginBottom: 24 },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { color: 'white', fontSize: 18, fontWeight: '700' },
  statLabel: { color: '#64748b', fontSize: 11 },
  section: { paddingHorizontal: 20, marginBottom: 16 },
  sectionTitle: { color: '#64748b', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  sectionCard: { backgroundColor: '#1e293b', borderRadius: 20, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#0f172a' },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuIconWrap: { width: 36, height: 36, backgroundColor: '#0f172a', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { color: '#e2e8f0', fontSize: 14, fontWeight: '500' },
  menuValue: { color: '#64748b', fontSize: 13 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginHorizontal: 20, marginTop: 8, paddingVertical: 14, backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  logoutText: { color: '#ef4444', fontSize: 15, fontWeight: '600' },
  version: { color: '#1e293b', fontSize: 12, textAlign: 'center', marginTop: 16, marginBottom: 40 },
});
