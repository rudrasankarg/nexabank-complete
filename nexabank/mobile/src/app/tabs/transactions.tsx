import { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, TextInput, Modal, ScrollView
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { format } from 'date-fns';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
const getApi = async () => {
  const token = await SecureStore.getItemAsync('access_token');
  return axios.create({ baseURL: API_URL, headers: { Authorization: `Bearer ${token}` } });
};

const typeConfig: Record<string, { icon: string; color: string; bg: string }> = {
  credit: { icon: 'arrow-down-outline', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  debit: { icon: 'arrow-up-outline', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  transfer: { icon: 'swap-horizontal-outline', color: '#3366ff', bg: 'rgba(51,102,255,0.1)' },
  bill_payment: { icon: 'receipt-outline', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
};

export default function TransactionsScreen() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<any>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['mobile-transactions-full', search, filter],
    queryFn: async () => {
      const api = await getApi();
      return api.get('/transactions', { params: { search, type: filter, limit: 50 } }).then(r => r.data);
    },
  });

  const transactions = data?.transactions || [];

  const renderItem = ({ item: tx }: { item: any }) => {
    const config = typeConfig[tx.type] || typeConfig.debit;
    return (
      <TouchableOpacity style={styles.txItem} onPress={() => setSelected(tx)} activeOpacity={0.7}>
        <View style={[styles.txIcon, { backgroundColor: config.bg }]}>
          <Ionicons name={config.icon as any} size={18} color={config.color} />
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txDesc} numberOfLines={1}>{tx.description || tx.type}</Text>
          <Text style={styles.txDate}>{format(new Date(tx.created_at), 'dd MMM yyyy, hh:mm a')}</Text>
          {tx.payment_mode && <Text style={styles.txMode}>{tx.payment_mode} · {tx.status}</Text>}
        </View>
        <Text style={[styles.txAmount, { color: config.color }]}>
          {tx.type === 'credit' ? '+' : '-'}₹{parseFloat(tx.amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        <Text style={styles.count}>{transactions.length} found</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={16} color="#475569" style={styles.searchIcon} />
        <TextInput value={search} onChangeText={setSearch}
          placeholder="Search transactions..." placeholderTextColor="#475569"
          style={styles.searchInput} />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color="#475569" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters} contentContainerStyle={styles.filtersContent}>
        {['', 'credit', 'debit', 'transfer', 'bill_payment'].map((f) => (
          <TouchableOpacity key={f || 'all'} style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f ? f.replace('_', ' ') : 'All'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={transactions}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#3366ff" />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="swap-horizontal-outline" size={48} color="#1e293b" />
            <Text style={styles.emptyText}>{isLoading ? 'Loading...' : 'No transactions found'}</Text>
          </View>
        }
      />

      {/* Detail Modal */}
      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            {selected && (
              <>
                <View style={[styles.modalIcon, { backgroundColor: (typeConfig[selected.type] || typeConfig.debit).bg }]}>
                  <Ionicons name={(typeConfig[selected.type] || typeConfig.debit).icon as any} size={32} color={(typeConfig[selected.type] || typeConfig.debit).color} />
                </View>
                <Text style={[styles.modalAmount, { color: (typeConfig[selected.type] || typeConfig.debit).color }]}>
                  {selected.type === 'credit' ? '+' : '-'}₹{parseFloat(selected.amount).toLocaleString('en-IN')}
                </Text>
                <Text style={styles.modalDesc}>{selected.description || selected.type}</Text>
                <View style={styles.modalDetails}>
                  {[
                    { label: 'Reference', value: selected.transaction_ref },
                    { label: 'Date', value: format(new Date(selected.created_at), 'dd MMM yyyy, hh:mm a') },
                    { label: 'Type', value: selected.type?.replace('_', ' ').toUpperCase() },
                    { label: 'Mode', value: selected.payment_mode || 'Online' },
                    { label: 'Status', value: selected.status },
                    { label: 'Balance After', value: selected.balance_after ? `₹${parseFloat(selected.balance_after).toLocaleString('en-IN')}` : '—' },
                  ].map(({ label, value }) => (
                    <View key={label} style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{label}</Text>
                      <Text style={styles.detailValue}>{value}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)}>
                  <Text style={styles.closeBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16 },
  title: { color: 'white', fontSize: 22, fontWeight: '700' },
  count: { color: '#475569', fontSize: 13, marginTop: 2 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, backgroundColor: '#1e293b', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: 'white', fontSize: 14 },
  filters: { flexGrow: 0, marginBottom: 12 },
  filtersContent: { paddingHorizontal: 20, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#334155', backgroundColor: '#1e293b' },
  filterChipActive: { borderColor: '#3366ff', backgroundColor: 'rgba(51,102,255,0.12)' },
  filterText: { color: '#64748b', fontSize: 13, fontWeight: '500', textTransform: 'capitalize' },
  filterTextActive: { color: '#3366ff' },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  txItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  txIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', shrink: 0 },
  txInfo: { flex: 1 },
  txDesc: { color: 'white', fontSize: 14, fontWeight: '500' },
  txDate: { color: '#475569', fontSize: 12, marginTop: 2 },
  txMode: { color: '#334155', fontSize: 11, marginTop: 1 },
  txAmount: { fontSize: 14, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { color: '#334155', fontSize: 14 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalCard: { backgroundColor: '#0f172a', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  modalHandle: { width: 36, height: 4, backgroundColor: '#334155', borderRadius: 2, marginBottom: 24 },
  modalIcon: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  modalAmount: { fontSize: 32, fontWeight: '700', marginBottom: 6 },
  modalDesc: { color: '#64748b', fontSize: 14, marginBottom: 20 },
  modalDetails: { width: '100%', backgroundColor: '#1e293b', borderRadius: 20, padding: 16, gap: 12, marginBottom: 20 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { color: '#64748b', fontSize: 13 },
  detailValue: { color: 'white', fontSize: 13, fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  closeBtn: { backgroundColor: '#1e293b', borderRadius: 16, paddingVertical: 14, width: '100%', alignItems: 'center' },
  closeBtnText: { color: '#94a3b8', fontSize: 15, fontWeight: '600' },
});
