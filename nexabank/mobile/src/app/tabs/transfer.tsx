import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
const getApi = async () => {
  const token = await SecureStore.getItemAsync('access_token');
  return axios.create({ baseURL: API_URL, headers: { Authorization: `Bearer ${token}` } });
};

const modes = ['IMPS', 'NEFT', 'RTGS', 'UPI'];

export default function TransferScreen() {
  const qc = useQueryClient();
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');
  const [formData, setFormData] = useState({ from_account_id: '', to_account_number: '', amount: '', description: '', payment_mode: 'IMPS', ifsc_code: '' });
  const [otp, setOtp] = useState('');
  const [result, setResult] = useState<any>(null);

  const { data: accData } = useQuery({
    queryKey: ['mobile-accounts'],
    queryFn: async () => { const api = await getApi(); return api.get('/accounts').then(r => r.data); },
  });
  const accounts = accData?.accounts || [];

  const sendOTPMutation = useMutation({
    mutationFn: async () => { const api = await getApi(); return api.post('/transactions/request-otp').then(r => r.data); },
    onSuccess: () => { setStep('otp'); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); },
    onError: (err: any) => Alert.alert('Error', err.response?.data?.error || 'Failed to send OTP'),
  });

  const transferMutation = useMutation({
    mutationFn: async () => {
      const api = await getApi();
      return api.post('/transactions/transfer', { ...formData, amount: parseFloat(formData.amount), otp }).then(r => r.data);
    },
    onSuccess: (data) => {
      setResult(data);
      setStep('success');
      qc.invalidateQueries({ queryKey: ['mobile-accounts'] });
      qc.invalidateQueries({ queryKey: ['mobile-transactions'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: any) => Alert.alert('Transfer Failed', err.response?.data?.error || 'Transfer failed'),
  });

  const validateForm = () => {
    if (!formData.from_account_id) { Alert.alert('Error', 'Select source account'); return false; }
    if (!formData.to_account_number || formData.to_account_number.length < 9) { Alert.alert('Error', 'Enter valid account number'); return false; }
    if (!formData.amount || parseFloat(formData.amount) <= 0) { Alert.alert('Error', 'Enter valid amount'); return false; }
    return true;
  };

  const selectedAccount = accounts.find((a: any) => a.id === formData.from_account_id);

  if (step === 'success' && result) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color="#10b981" />
          </View>
          <Text style={styles.successTitle}>Transfer Successful!</Text>
          <Text style={styles.successAmount}>₹{parseFloat(result.amount).toLocaleString('en-IN')}</Text>
          <View style={styles.resultCard}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Reference No.</Text>
              <Text style={styles.resultValue}>{result.transaction_ref}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>New Balance</Text>
              <Text style={styles.resultValue}>₹{parseFloat(result.balance).toLocaleString('en-IN')}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => { setStep('form'); setOtp(''); setResult(null); setFormData({ from_account_id: '', to_account_number: '', amount: '', description: '', payment_mode: 'IMPS', ifsc_code: '' }); }}>
            <Text style={styles.primaryBtnText}>New Transfer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (step === 'otp') {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep('form')}>
            <Ionicons name="arrow-back" size={20} color="#94a3b8" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <View style={styles.otpContainer}>
            <View style={styles.otpIcon}>
              <Ionicons name="phone-portrait-outline" size={36} color="#3366ff" />
            </View>
            <Text style={styles.otpTitle}>Verify Transfer</Text>
            <Text style={styles.otpSubtitle}>Enter the 6-digit OTP sent to your registered mobile</Text>
            <View style={styles.otpAmount}>
              <Text style={styles.otpAmountLabel}>Transferring</Text>
              <Text style={styles.otpAmountValue}>₹{parseFloat(formData.amount).toLocaleString('en-IN')}</Text>
            </View>
            <TextInput
              value={otp} onChangeText={setOtp}
              placeholder="Enter 6-digit OTP"
              placeholderTextColor="#475569"
              keyboardType="numeric" maxLength={6}
              style={styles.otpInput}
            />
            <TouchableOpacity
              style={[styles.primaryBtn, (otp.length < 6 || transferMutation.isPending) && styles.disabledBtn]}
              disabled={otp.length < 6 || transferMutation.isPending}
              onPress={() => transferMutation.mutate()}>
              {transferMutation.isPending
                ? <ActivityIndicator color="white" />
                : <Text style={styles.primaryBtnText}>Confirm Transfer</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.pageTitle}>Fund Transfer</Text>
        <Text style={styles.pageSubtitle}>Send money instantly to any bank</Text>

        {/* From Account */}
        <View style={styles.field}>
          <Text style={styles.label}>From Account</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountPicker}>
            {accounts.length === 0
              ? <Text style={styles.noAccounts}>No accounts found</Text>
              : accounts.map((acc: any) => (
                <TouchableOpacity key={acc.id}
                  style={[styles.accountChip, formData.from_account_id === acc.id && styles.accountChipActive]}
                  onPress={() => setFormData(f => ({ ...f, from_account_id: acc.id }))}>
                  <Text style={[styles.accountChipNum, formData.from_account_id === acc.id && styles.accountChipTextActive]}>
                    ••{acc.account_number?.slice(-4)}
                  </Text>
                  <Text style={[styles.accountChipBal, formData.from_account_id === acc.id && styles.accountChipTextActive]}>
                    ₹{parseFloat(acc.balance).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </Text>
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>

        {/* To Account */}
        <View style={styles.field}>
          <Text style={styles.label}>To Account Number</Text>
          <TextInput
            value={formData.to_account_number} onChangeText={v => setFormData(f => ({ ...f, to_account_number: v }))}
            placeholder="Enter account number" placeholderTextColor="#475569"
            keyboardType="numeric" style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>IFSC Code (other banks)</Text>
          <TextInput
            value={formData.ifsc_code} onChangeText={v => setFormData(f => ({ ...f, ifsc_code: v.toUpperCase() }))}
            placeholder="e.g. HDFC0001234" placeholderTextColor="#475569"
            autoCapitalize="characters" style={styles.input}
          />
        </View>

        {/* Amount */}
        <View style={styles.field}>
          <Text style={styles.label}>Amount (₹)</Text>
          <TextInput
            value={formData.amount} onChangeText={v => setFormData(f => ({ ...f, amount: v }))}
            placeholder="0" placeholderTextColor="#334155"
            keyboardType="numeric" style={styles.amountInput}
          />
          <View style={styles.quickAmounts}>
            {[1000, 5000, 10000, 25000].map(amt => (
              <TouchableOpacity key={amt} style={styles.quickAmtBtn} onPress={() => setFormData(f => ({ ...f, amount: amt.toString() }))}>
                <Text style={styles.quickAmtText}>₹{(amt / 1000).toFixed(0)}K</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Mode */}
        <View style={styles.field}>
          <Text style={styles.label}>Payment Mode</Text>
          <View style={styles.modeRow}>
            {modes.map(mode => (
              <TouchableOpacity key={mode}
                style={[styles.modeBtn, formData.payment_mode === mode && styles.modeBtnActive]}
                onPress={() => setFormData(f => ({ ...f, payment_mode: mode }))}>
                <Text style={[styles.modeBtnText, formData.payment_mode === mode && styles.modeBtnTextActive]}>{mode}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Remarks (optional)</Text>
          <TextInput
            value={formData.description} onChangeText={v => setFormData(f => ({ ...f, description: v }))}
            placeholder="Add a note" placeholderTextColor="#475569"
            style={styles.input}
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, sendOTPMutation.isPending && styles.disabledBtn]}
          disabled={sendOTPMutation.isPending}
          onPress={() => { if (validateForm()) sendOTPMutation.mutate(); }}>
          {sendOTPMutation.isPending
            ? <ActivityIndicator color="white" />
            : <Text style={styles.primaryBtnText}>Send OTP to Verify</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { padding: 20, paddingTop: 60 },
  pageTitle: { color: 'white', fontSize: 22, fontWeight: '700', marginBottom: 4 },
  pageSubtitle: { color: '#64748b', fontSize: 14, marginBottom: 24 },
  field: { marginBottom: 18 },
  label: { color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, color: 'white', fontSize: 15 },
  amountInput: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, color: 'white', fontSize: 28, fontWeight: '700' },
  accountPicker: { flexDirection: 'row' },
  noAccounts: { color: '#475569', fontSize: 14, paddingVertical: 12 },
  accountChip: { borderWidth: 1, borderColor: '#334155', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, marginRight: 10, backgroundColor: '#1e293b' },
  accountChipActive: { borderColor: '#3366ff', backgroundColor: 'rgba(51,102,255,0.12)' },
  accountChipNum: { color: '#94a3b8', fontSize: 12, fontFamily: 'monospace' },
  accountChipBal: { color: '#64748b', fontSize: 12, marginTop: 2 },
  accountChipTextActive: { color: '#3366ff' },
  quickAmounts: { flexDirection: 'row', gap: 8, marginTop: 8 },
  quickAmtBtn: { flex: 1, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  quickAmtText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeBtn: { flex: 1, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  modeBtnActive: { borderColor: '#3366ff', backgroundColor: 'rgba(51,102,255,0.12)' },
  modeBtnText: { color: '#64748b', fontSize: 13, fontWeight: '600' },
  modeBtnTextActive: { color: '#3366ff' },
  primaryBtn: { backgroundColor: '#3366ff', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  disabledBtn: { opacity: 0.5 },
  primaryBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24 },
  backText: { color: '#94a3b8', fontSize: 14 },
  otpContainer: { alignItems: 'center' },
  otpIcon: { width: 80, height: 80, backgroundColor: 'rgba(51,102,255,0.12)', borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  otpTitle: { color: 'white', fontSize: 22, fontWeight: '700', marginBottom: 8 },
  otpSubtitle: { color: '#64748b', fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  otpAmount: { backgroundColor: '#1e293b', borderRadius: 16, paddingHorizontal: 24, paddingVertical: 16, marginBottom: 24, alignItems: 'center', width: '100%' },
  otpAmountLabel: { color: '#64748b', fontSize: 12 },
  otpAmountValue: { color: 'white', fontSize: 28, fontWeight: '700', marginTop: 4 },
  otpInput: { backgroundColor: '#1e293b', borderWidth: 2, borderColor: '#3366ff', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 16, color: 'white', fontSize: 24, fontWeight: '700', letterSpacing: 8, textAlign: 'center', width: '100%', marginBottom: 24 },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  successIcon: { marginBottom: 16 },
  successTitle: { color: 'white', fontSize: 24, fontWeight: '700', marginBottom: 8 },
  successAmount: { color: '#10b981', fontSize: 36, fontWeight: '700', marginBottom: 24 },
  resultCard: { backgroundColor: '#1e293b', borderRadius: 20, padding: 20, width: '100%', gap: 12, marginBottom: 24 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between' },
  resultLabel: { color: '#64748b', fontSize: 14 },
  resultValue: { color: 'white', fontSize: 14, fontWeight: '600', fontFamily: 'monospace' },
});
