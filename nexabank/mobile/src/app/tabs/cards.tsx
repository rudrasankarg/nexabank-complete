import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, Dimensions
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import axios from 'axios';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
const getApi = async () => {
  const token = await SecureStore.getItemAsync('access_token');
  return axios.create({ baseURL: API_URL, headers: { Authorization: `Bearer ${token}` } });
};

const cardGradients: Record<string, [string, string]> = {
  debit: ['#1332e1', '#3366ff'],
  credit: ['#7c3aed', '#a78bfa'],
  prepaid: ['#065f46', '#10b981'],
};

export default function CardsScreen() {
  const qc = useQueryClient();
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [showNumber, setShowNumber] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['mobile-cards'],
    queryFn: async () => { const api = await getApi(); return api.get('/cards').then(r => r.data); },
  });

  const cards = data?.cards || [];

  const updateSettings = useMutation({
    mutationFn: async ({ id, settings }: { id: string; settings: any }) => {
      const api = await getApi();
      return api.patch(`/cards/${id}/settings`, settings).then(r => r.data);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mobile-cards'] }); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); },
    onError: () => Alert.alert('Error', 'Failed to update settings'),
  });

  const blockCard = useMutation({
    mutationFn: async (id: string) => {
      const api = await getApi();
      return api.post(`/cards/${id}/block`, { reason: 'User request' }).then(r => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mobile-cards'] });
      setSelectedCard(null);
      Alert.alert('Done', 'Card has been blocked');
    },
  });

  const handleBlockCard = (card: any) => {
    Alert.alert('Block Card', `Are you sure you want to block this card ending in ${card.card_number_masked?.slice(-4)}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Block Card', style: 'destructive', onPress: () => blockCard.mutate(card.id) },
    ]);
  };

  if (!selectedCard) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>My Cards</Text>
          <Text style={styles.subtitle}>{cards.length} card{cards.length !== 1 ? 's' : ''}</Text>
        </View>

        {isLoading ? (
          <View style={styles.loading}>
            <Text style={styles.loadingText}>Loading cards...</Text>
          </View>
        ) : cards.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="card-outline" size={64} color="#1e293b" />
            <Text style={styles.emptyTitle}>No Cards Yet</Text>
            <Text style={styles.emptyText}>Apply for a debit or credit card from the web portal</Text>
          </View>
        ) : (
          <View>
            {cards.map((card: any) => (
              <TouchableOpacity key={card.id} style={styles.cardWrap} onPress={() => setSelectedCard(card)} activeOpacity={0.9}>
                <LinearGradient colors={cardGradients[card.card_type] || cardGradients.debit} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View>
                      <Text style={styles.bankName}>NexaBank</Text>
                      <Text style={styles.cardType}>{card.card_type} Card</Text>
                    </View>
                    <View style={[styles.statusBadge, card.status === 'active' ? styles.badgeGreen : styles.badgeRed]}>
                      <Text style={styles.statusText}>{card.status}</Text>
                    </View>
                  </View>
                  <View style={styles.chip} />
                  <Text style={styles.cardNumber}>•••• •••• •••• {card.card_number_masked?.slice(-4)}</Text>
                  <View style={styles.cardBottom}>
                    <View>
                      <Text style={styles.cardMetaLabel}>Card Holder</Text>
                      <Text style={styles.cardMetaValue}>{card.card_holder_name}</Text>
                    </View>
                    <View>
                      <Text style={styles.cardMetaLabel}>Expires</Text>
                      <Text style={styles.cardMetaValue}>{card.expiry_month}/{card.expiry_year?.slice(-2)}</Text>
                    </View>
                    <Text style={styles.network}>{card.network}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.features}>
          {[
            { icon: 'shield-checkmark-outline', label: 'Zero Liability', desc: 'Protected against fraud' },
            { icon: 'wifi-outline', label: 'Contactless', desc: 'Tap & pay anywhere' },
            { icon: 'globe-outline', label: 'Global Use', desc: '150+ countries' },
            { icon: 'lock-closed-outline', label: '3D Secure', desc: 'OTP for online use' },
          ].map(({ icon, label, desc }) => (
            <View key={label} style={styles.feature}>
              <View style={styles.featureIcon}>
                <Ionicons name={icon as any} size={20} color="#3366ff" />
              </View>
              <Text style={styles.featureLabel}>{label}</Text>
              <Text style={styles.featureDesc}>{desc}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  // Card detail view
  const card = selectedCard;
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSelectedCard(null)} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#94a3b8" />
          <Text style={styles.backText}>Cards</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Card Settings</Text>
      </View>

      <LinearGradient colors={cardGradients[card.card_type] || cardGradients.debit} style={[styles.card, styles.detailCard]}>
        <View style={styles.cardTop}>
          <Text style={styles.bankName}>NexaBank</Text>
          <Ionicons name="wifi-outline" size={20} color="rgba(255,255,255,0.6)" />
        </View>
        <View style={styles.chip} />
        <Text style={styles.cardNumber}>
          {showNumber ? card.card_number_masked : `•••• •••• •••• ${card.card_number_masked?.slice(-4)}`}
        </Text>
        <View style={styles.cardBottom}>
          <View>
            <Text style={styles.cardMetaLabel}>Card Holder</Text>
            <Text style={styles.cardMetaValue}>{card.card_holder_name}</Text>
          </View>
          <View>
            <Text style={styles.cardMetaLabel}>Expires</Text>
            <Text style={styles.cardMetaValue}>{card.expiry_month}/{card.expiry_year?.slice(-2)}</Text>
          </View>
          <Text style={styles.network}>{card.network}</Text>
        </View>
      </LinearGradient>

      <View style={styles.settingsCard}>
        <Text style={styles.settingsTitle}>Card Controls</Text>
        {[
          { label: 'International Transactions', key: 'is_international_enabled', icon: 'globe-outline' },
          { label: 'Contactless Payments', key: 'is_contactless_enabled', icon: 'wifi-outline' },
          { label: 'Online Transactions', key: 'is_online_enabled', icon: 'phone-portrait-outline' },
          { label: 'ATM Withdrawals', key: 'is_atm_enabled', icon: 'cash-outline' },
        ].map(({ label, key, icon }) => (
          <View key={key} style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Ionicons name={icon as any} size={16} color="#64748b" />
              </View>
              <Text style={styles.settingLabel}>{label}</Text>
            </View>
            <Switch
              value={card[key] || false}
              onValueChange={(val) => {
                updateSettings.mutate({ id: card.id, settings: { [key]: val } });
                setSelectedCard({ ...card, [key]: val });
              }}
              trackColor={{ false: '#334155', true: '#3366ff' }}
              thumbColor="white"
            />
          </View>
        ))}
      </View>

      <View style={styles.limitsCard}>
        <Text style={styles.settingsTitle}>Daily Limits</Text>
        {[
          { label: 'ATM Withdrawal', value: `₹${(card.daily_atm_limit / 1000).toFixed(0)}K` },
          { label: 'POS / Swipe', value: `₹${(card.daily_pos_limit / 1000).toFixed(0)}K` },
          { label: 'Online', value: `₹${(card.daily_online_limit / 1000).toFixed(0)}K` },
        ].map(({ label, value }) => (
          <View key={label} style={styles.limitRow}>
            <Text style={styles.limitLabel}>{label}</Text>
            <Text style={styles.limitValue}>{value}</Text>
          </View>
        ))}
      </View>

      {card.status === 'active' && (
        <TouchableOpacity style={styles.blockBtn} onPress={() => handleBlockCard(card)}>
          <Ionicons name="lock-closed-outline" size={18} color="#ef4444" />
          <Text style={styles.blockBtnText}>Block This Card</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16 },
  title: { color: 'white', fontSize: 22, fontWeight: '700' },
  subtitle: { color: '#475569', fontSize: 13, marginTop: 2 },
  loading: { padding: 40, alignItems: 'center' },
  loadingText: { color: '#475569', fontSize: 14 },
  empty: { alignItems: 'center', padding: 40, gap: 12 },
  emptyTitle: { color: 'white', fontSize: 18, fontWeight: '600' },
  emptyText: { color: '#475569', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  cardWrap: { marginHorizontal: 20, marginBottom: 16 },
  card: { borderRadius: 24, padding: 22, height: 190 },
  detailCard: { marginHorizontal: 20, marginBottom: 16 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  bankName: { color: 'white', fontSize: 16, fontWeight: '700' },
  cardType: { color: 'rgba(255,255,255,0.6)', fontSize: 12, textTransform: 'capitalize' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeGreen: { backgroundColor: 'rgba(16,185,129,0.25)' },
  badgeRed: { backgroundColor: 'rgba(239,68,68,0.25)' },
  statusText: { color: 'white', fontSize: 11, fontWeight: '600' },
  chip: { width: 38, height: 28, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 6, marginBottom: 14 },
  cardNumber: { color: 'white', fontSize: 18, fontFamily: 'monospace', letterSpacing: 3, marginBottom: 18 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardMetaLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginBottom: 2 },
  cardMetaValue: { color: 'white', fontSize: 13, fontWeight: '600' },
  network: { color: 'white', fontSize: 18, fontWeight: '900', fontStyle: 'italic' },
  features: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12, paddingBottom: 24 },
  feature: { width: (width - 56) / 2, backgroundColor: '#1e293b', borderRadius: 18, padding: 16 },
  featureIcon: { width: 40, height: 40, backgroundColor: 'rgba(51,102,255,0.12)', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  featureLabel: { color: 'white', fontSize: 13, fontWeight: '600', marginBottom: 2 },
  featureDesc: { color: '#475569', fontSize: 11 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  backText: { color: '#94a3b8', fontSize: 14 },
  settingsCard: { marginHorizontal: 20, backgroundColor: '#1e293b', borderRadius: 20, padding: 16, marginBottom: 12 },
  settingsTitle: { color: '#64748b', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#0f172a' },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  settingIcon: { width: 32, height: 32, backgroundColor: '#0f172a', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { color: '#e2e8f0', fontSize: 14 },
  limitsCard: { marginHorizontal: 20, backgroundColor: '#1e293b', borderRadius: 20, padding: 16, marginBottom: 12 },
  limitRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#0f172a' },
  limitLabel: { color: '#64748b', fontSize: 14 },
  limitValue: { color: 'white', fontSize: 14, fontWeight: '600' },
  blockBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 20, marginBottom: 32, paddingVertical: 14, backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  blockBtnText: { color: '#ef4444', fontSize: 15, fontWeight: '600' },
});
