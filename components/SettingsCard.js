import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useAppState, useAppDispatch, ACTIONS } from '../contexts/AppContext';
import { useTimeSync } from '../hooks/useTimeSync';
import { useScheduler } from '../hooks/useScheduler';
import IntervalSelector from './IntervalSelector';
import SoundSelector from './SoundSelector';
import VibrationSelector from './VibrationSelector';
import QuietHoursConfig from './QuietHoursConfig';
import { triggerHapticFeedback } from '../services/vibration';
import { trackEvent, EVENTS } from '../services/analytics';
import { COLORS, SPACING, RADIUS } from '../styles/theme';

export default function SettingsCard() {
  const { isEnabled, useAtomicSync, isPremium, lastSyncTime } = useAppState();
  const dispatch = useAppDispatch();
  const { syncTime } = useTimeSync();
  const { toggleBeeps } = useScheduler();

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.row}>
          <Feather name="sliders" size={20} color={COLORS.neonCyan} />
          <Text style={styles.cardTitle}>Configurações</Text>
        </View>
        {isPremium && (
          <View style={styles.proBadge}>
            <Ionicons name="star" size={10} color={COLORS.gold} />
            <Text style={styles.proBadgeText}>PRO</Text>
          </View>
        )}
      </View>

      {/* Intervalo */}
      <IntervalSelector />
      <View style={styles.divider} />

      {/* Som */}
      <SoundSelector />
      <View style={styles.divider} />

      {/* Vibração */}
      <VibrationSelector />
      <View style={styles.divider} />

      {/* Referência de Horário */}
      <Text style={styles.sectionSubtitle}>REFERÊNCIA DE HORÁRIO</Text>
      <View style={styles.controlRow}>
        <View style={{ flex: 1, paddingRight: SPACING.sm }}>
          <Text style={styles.statusText}>{useAtomicSync ? 'Hora Atômica (NTP)' : 'Hora do Celular'}</Text>
          <Text style={styles.controlSubText}>
            {useAtomicSync
              ? 'Compensa drift do relógio via servidores NTP'
              : 'Bipa na hora cheia exibida no celular'}
          </Text>
        </View>
        <Switch
          trackColor={{ false: COLORS.borderMedium, true: COLORS.accentBlue }}
          thumbColor={useAtomicSync ? COLORS.white : COLORS.textTertiary}
          ios_backgroundColor={COLORS.borderMedium}
          onValueChange={(value) => {
            triggerHapticFeedback();
            if (!isEnabled) {
              dispatch({ type: ACTIONS.SET_ATOMIC_SYNC, payload: value });
              trackEvent(EVENTS.ATOMIC_SYNC_TOGGLED, { enabled: value });
              if (value && !lastSyncTime) syncTime(true);
            }
          }}
          value={useAtomicSync}
          style={{ transform: [{ scaleX: 1.15 }, { scaleY: 1.15 }] }}
        />
      </View>
      <View style={styles.divider} />

      {/* Horário Silencioso */}
      <QuietHoursConfig />
      <View style={styles.divider} />

      {/* Toggle Bips */}
      {isEnabled && (
        <Text style={styles.lockedHint}>Desative os bips para alterar as configurações</Text>
      )}

      <View style={[styles.controlRow, { marginTop: isEnabled ? SPACING.md : SPACING.lg }]}>
        <View style={{ flex: 1, paddingRight: SPACING.sm }}>
          <Text style={styles.statusText}>{isEnabled ? 'Bips Ativos' : 'Bips Inativos'}</Text>
          <Text style={styles.controlSubText}>
            {isEnabled ? 'Rodando em segundo plano' : 'Toques temporizadores desligados'}
          </Text>
        </View>
        <Switch
          trackColor={{ false: COLORS.borderMedium, true: COLORS.success }}
          thumbColor={isEnabled ? COLORS.white : COLORS.textTertiary}
          ios_backgroundColor={COLORS.borderMedium}
          onValueChange={() => toggleBeeps(syncTime)}
          value={isEnabled}
          style={{ transform: [{ scaleX: 1.15 }, { scaleY: 1.15 }] }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    width: '100%',
    marginBottom: SPACING.xl,
    shadowColor: COLORS.neonCyan,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
    paddingBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.goldDimAlt,
    borderRadius: 10,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.gold,
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.surfaceDeep,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  controlSubText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  lockedHint: {
    fontSize: 11,
    color: COLORS.warning,
    textAlign: 'center',
    marginTop: SPACING.md,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.lg,
    width: '100%',
  },
});
