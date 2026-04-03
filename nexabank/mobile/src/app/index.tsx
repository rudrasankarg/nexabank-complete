import { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';

const { width } = Dimensions.get('window');

export default function SplashIndex() {
  const router = useRouter();
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.85);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, useNativeDriver: true }),
    ]).start();

    const checkAuth = async () => {
      await new Promise(r => setTimeout(r, 1800));
      const token = await SecureStore.getItemAsync('access_token');
      if (token) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/welcome');
      }
    };
    checkAuth();
  }, []);

  return (
    <LinearGradient colors={['#121a5c', '#1332e1', '#3366ff']} style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.logoContainer}>
          <View style={styles.logoInner}>
            <Text style={styles.logoText}>N</Text>
          </View>
        </View>
        <Text style={styles.title}>NexaBank</Text>
        <Text style={styles.subtitle}>Banking Reimagined</Text>
      </Animated.View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Secure · Smart · Simple</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { alignItems: 'center' },
  logoContainer: {
    width: 88, height: 88,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#3366ff', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6, shadowRadius: 20, elevation: 12,
  },
  logoInner: {
    width: 64, height: 64, borderRadius: 18,
    backgroundColor: 'white', alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: 32, fontWeight: '700', color: '#3366ff' },
  title: { fontSize: 36, fontWeight: '700', color: 'white', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 6, letterSpacing: 2, textTransform: 'uppercase' },
  footer: { position: 'absolute', bottom: 48 },
  footerText: { color: 'rgba(255,255,255,0.4)', fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase' },
});
