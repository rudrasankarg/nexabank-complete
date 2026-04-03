import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Dimensions, Animated
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { format } from 'date-fns';
import axios from 'axios';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const getApiClient = async () => {
  const token = await SecureStore.getItemAsync('access_token');
  return axios.create({ baseURL: API_URL, headers: { Authorization: `Bearer ${token}` } });
};

const quickActions = [
  { icon: 'send-outline', label: 'Transfer', color: '#3366ff', route: '/(tabs)/transfer' },
  { icon: 'receipt-outline', label: 'Pay Bills', color: '#7c3aed', route: '/(tabs)/bills' },
  { icon: 'card-outline', label: 'Cards', color: '#d97706', route: '/(tabs)/cards' },
  { icon: 'analytics-outline', label: 'Loans', color: '#059669', route: '/(tabs)/loans' },
  { icon: 'qr-code-outline', label: 'Scan & Pay', color: '#dc2626', route: '/(tabs)/scan' },
  { icon: 'cash-outline', label: 'FD/RD', color: '#0891b2', route: '/(tabs)/deposits' },
];

export default function HomeTab() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync('user').then(u => u && setUser(JSON.parse(u)));
  }, []);

  const { data: accountsData, refetch: refetchAccounts } = useQuery({
    queryKey: ['mobile-accounts'],
    queryFn: async () => {
      const api = await getApiClient();
      return api.get('/accounts').then(r => r.data);
    },
  });

  const { data: txData, refetch: refetchTx } = useQuery({
    queryKey: ['mobile-transactions'],
    queryFn: async () => {
      const api = await getApiClient();
      return api.get('/transactions?limit=5').then(r => r.data);
    },
  });

  const accounts = accountsData?.accounts || [];
  const transactions = txData?.transactions || [];
  const totalBalance = accounts.reduce((s: number, a: any) => s + parseFloat(a.balance || 0), 0);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchAccounts(), refetchTx()]);
    setRefreshing(false);
  };

  const formatINR = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3366ff" />}>

      {/* Header */}
      <LinearGradient colors={['#0f172a', '#121a5c']} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.userName}>{user?.full_name?.split(' ')[0] || 'User'} 👋</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/(tabs)/notifications')}>
            <Ionicons name="notifications-outline" size={22} color="white" />
            <View style={styles.notifBadge} />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Total Portfolio Balance</Text>
            <TouchableOpacity onPress={() => setBalanceVisible(v => !v)}>
              <Ionicons name={balanceVisible ? 'eye-outline' : 'eye-off-outline'} size={18} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </View>
          <Text style={styles.balanceAmount}>
            {balanceVisible ? formatINR(totalBalance) : '₹ ••••••'}
          </Text>
          <View style={styles.balanceMeta}>
            <View>
              <Text style={styles.balanceMetaLabel}>Accounts</Text>
              <Text style={styles.balanceMetaValue}>{accounts.length}</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View>
              <Text style={styles.balanceMetaLabel}>Customer ID</Text>
              <Text style={styles.balanceMetaValue}>{user?.customer_id || '—'}</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View>
              <Text style={styles.balanceMetaLabel}>KYC</Text>
              <Text style={[styles.balanceMetaValue,
                { color: user?.kyc_status === 'approved' ? '#34d399' : '#fbbf24' }]}>
                {user?.kyc_status || 'Pending'}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickGrid}>
            {quickActions.map(({ icon, label, color, route }) => (
              <TouchableOpacity key={label} style={styles.quickItem} onPress={() => router.push(route as any)} activeOpacity={0.7}>
                <View style={[styles.quickIcon, { backgroundColor: color + '18' }]}>
                  <Ionicons name={icon as any} size={24} color={color} />
                </View>
                <Text style={styles.quickLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* My Accounts */}
        {accounts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Accounts</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/accounts')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountsScroll}>
              {accounts.map((acc: any) => (
                <LinearGradient key={acc.id} colors={['#1332e1', '#3366ff']} style={styles.accountCard}>
                  <Text style={styles.accountType}>{acc.account_type?.replace('_', ' ').toUpperCase()}</Text>
                  <Text style={styles.accountNumber}>•••• {acc.account_number?.slice(-4)}</Text>
                  <Text style={styles.accountBalance}>
                    {balanceVisible ? formatINR(parseFloat(acc.balance)) : '₹ •••••'}
                  </Text>
                  <Text style={styles.accountIfsc}>{acc.ifsc_code}</Text>
                </LinearGradient>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {transactions.length === 0 ? (
            <View style={styles.emptyTx}>
              <Ionicons name="swap-horizontal-outline" size={40} color="#334155" />
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          ) : (
            transactions.map((tx: any) => (
              <View key={tx.id} style={styles.txItem}>
                <View style={[styles.txIcon,
                  { backgroundColor: tx.type === 'credit' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }]}>
                  <Ionicons
                    name={tx.type === 'credit' ? 'arrow-down-outline' : 'arrow-up-outline'}
                    size={18}
                    color={tx.type === 'credit' ? '#10b981' : '#ef4444'}
                  />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txDesc} numberOfLines={1}>{tx.description || tx.type}</Text>
                  <Text style={styles.txDate}>{format(new Date(tx.created_at), 'dd MMM, hh:mm a')}</Text>
                </View>
                <Text style={[styles.txAmount, { color: tx.type === 'credit' ? '#10b981' : '#ef4444' }]}>
                  {tx.type === 'credit' ? '+' : '-'}{formatINR(parseFloat(tx.amount))}
                </Text>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  greeting: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  userName: { color: 'white', fontSize: 22, fontWeight: '700', marginTop: 2 },
  notifBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  notifBadge: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, backgroundColor: '#ef4444', borderRadius: 4, borderWidth: 1, borderColor: '#0f172a' },
  balanceCard: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  balanceLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  balanceAmount: { color: 'white', fontSize: 32, fontWeight: '700', marginBottom: 16 },
  balanceMeta: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  balanceMetaLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 2 },
  balanceMetaValue: { color: 'white', fontSize: 12, fontWeight: '600' },
  balanceDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.1)' },
  body: { paddingHorizontal: 20, paddingTop: 20 },
  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { color: 'white', fontSize: 16, fontWeight: '700' },
  seeAll: { color: '#3366ff', fontSize: 13, fontWeight: '600' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickItem: { width: (width - 64) / 3, alignItems: 'center', gap: 8 },
  quickIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '500', textAlign: 'center' },
  accountsScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
  accountCard: { width: 220, height: 130, borderRadius: 20, padding: 18, marginRight: 14 },
  accountType: { color: 'rgba(255,255,255,0.6)', fontSize: 11, letterSpacing: 1, marginBottom: 4 },
  accountNumber: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: 'monospace', marginBottom: 8 },
  accountBalance: { color: 'white', fontSize: 22, fontWeight: '700', marginBottom: 8 },
  accountIfsc: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: 'monospace' },
  emptyTx: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  emptyText: { color: '#475569', fontSize: 14 },
  txItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  txIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1 },
  txDesc: { color: 'white', fontSize: 14, fontWeight: '500' },
  txDate: { color: '#475569', fontSize: 12, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '700' },
});
