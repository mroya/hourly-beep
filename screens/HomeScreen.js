import React, { useEffect } from 'react';
import { StyleSheet, Text, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

// Context
import { useAppState, useAppDispatch, ACTIONS } from '../contexts/AppContext';

// Hooks
import { useTimeSync } from '../hooks/useTimeSync';
import { useSettings } from '../hooks/useSettings';
import { useScheduler } from '../hooks/useScheduler';

// Components
import Header from '../components/Header';
import TimeSyncPanel from '../components/TimeSyncPanel';
import DeviceClockPanel from '../components/DeviceClockPanel';
import SettingsCard from '../components/SettingsCard';
import SystemStatus from '../components/SystemStatus';
import UpgradeBanner from '../components/UpgradeBanner';
import UpgradeScreen from '../components/UpgradeScreen';

// Services
import { usePremium } from '../services/premium';
import { trackEvent, EVENTS } from '../services/analytics';

// Styles
import { COLORS, SPACING, GRADIENTS } from '../styles/theme';

export default function HomeScreen() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const { useAtomicSync, isPremium, showUpgrade } = state;

  // ─── Hooks ───────────────────────────────────────────────────────────────────
  const { syncTime } = useTimeSync();
  const { hydrateSettings } = useSettings();
  const { initializeScheduler } = useScheduler();
  const { isPremium: premiumFromHook, unlockPremium, restorePurchase } = usePremium();

  // ─── Sync estado premium do hook usePremium → AppContext ──────────────────
  useEffect(() => {
    dispatch({ type: ACTIONS.SET_PREMIUM, payload: premiumFromHook });
  }, [premiumFromHook]);

  // ─── Inicialização ─────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      // Carregar configurações salvas
      const saved = await hydrateSettings();

      // Sincronizar tempo
      await syncTime(true);

      // Inicializar agendamento
      await initializeScheduler(saved);
    })();
  }, []);

  // ─── Handlers de compra ──────────────────────────────────────────────────
  const handlePurchase = async () => {
    const success = await unlockPremium();
    if (success) {
      dispatch({ type: ACTIONS.SET_PREMIUM, payload: true });
      trackEvent(EVENTS.PURCHASE_COMPLETED);
    }
    return success;
  };

  const handleRestore = async () => {
    const restored = await restorePurchase();
    if (restored) {
      dispatch({ type: ACTIONS.SET_PREMIUM, payload: true });
      trackEvent(EVENTS.PURCHASE_RESTORED);
    }
    return restored;
  };

  // ─── UI ──────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={GRADIENTS.background}
        style={StyleSheet.absoluteFillObject}
      />
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

        <Header />

        {useAtomicSync ? <TimeSyncPanel /> : <DeviceClockPanel />}

        <SettingsCard />

        <SystemStatus />

        <UpgradeBanner />

        <Text style={styles.footerText}>
          Desenvolvido com precisão atômica por Marcio Roya{'\n'}Versão 2.0.0 {isPremium ? '(Premium)' : '(Free)'}
        </Text>

      </ScrollView>

      <UpgradeScreen
        visible={showUpgrade}
        onClose={() => dispatch({ type: ACTIONS.TOGGLE_UPGRADE, payload: false })}
        onPurchase={handlePurchase}
        onRestore={handleRestore}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 11,
    color: COLORS.textDark,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: SPACING.xl,
    fontWeight: '500',
  },
});
