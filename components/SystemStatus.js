import React from 'react';
import { View, Text, Platform, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppState } from '../contexts/AppContext';
import { useTimeSync } from '../hooks/useTimeSync';
import { useClock } from '../hooks/useClock';
import CountdownRing from './CountdownRing';
import { getCountdownText } from '../utils/formatters';
import { COLORS, SPACING, RADIUS } from '../styles/theme';

export default function SystemStatus() {
  const { isEnabled, intervalTime, quietHoursEnabled, quietHoursStart, quietHoursEnd, isPremium } = useAppState();
  const { effectiveOffset, getSyncModeText } = useTimeSync();
  const currentTime = useClock();

  const getQuietHoursText = () => {
    return `${quietHoursStart.toString().padStart(2, '0')}:00 — ${quietHoursEnd.toString().padStart(2, '0')}:00`;
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.row}>
          <Feather name="activity" size={20} color={COLORS.neonCyan} />
          <Text style={styles.cardTitle}>Status do Sistema</Text>
        </View>
      </View>

      {isEnabled ? (() => {
        const intervalMs = intervalTime * 1000;
        const adjustedNow = currentTime.getTime() + effectiveOffset;
        const adjustedDate = new Date(adjustedNow);
        const msSinceMidnight =
          adjustedDate.getHours() * 3600000 +
          adjustedDate.getMinutes() * 60000 +
          adjustedDate.getSeconds() * 1000 +
          adjustedDate.getMilliseconds();
        const msIntoInterval = msSinceMidnight % intervalMs;
        const msLeft = intervalMs - msIntoInterval;
        const secondsLeft = Math.floor(msLeft / 1000);

        return (
          <View style={styles.countdownContainer}>
            <CountdownRing
              msLeft={msLeft}
              intervalMs={intervalMs}
              secondsLeft={secondsLeft}
              countdownText={getCountdownText(currentTime, effectiveOffset, intervalTime)}
              currentTime={currentTime}
            />

            <View style={styles.badgeContainer}>
              <View style={[styles.badge, styles.badgeActive]}>
                <View style={[styles.miniDot, styles.bgSync]} />
                <Text style={styles.badgeText}>
                  {getSyncModeText()} ({Platform.OS === 'ios' ? 'iOS' : 'Android'})
                </Text>
              </View>
            </View>
            {quietHoursEnabled && isPremium && (
              <View style={[styles.badge, styles.badgeQuiet, { marginTop: 8 }]}>
                <Feather name="moon" size={10} color={COLORS.purple} />
                <Text style={styles.badgeQuietText}>Silêncio {getQuietHoursText()}</Text>
              </View>
            )}
          </View>
        );
      })() : (
        <View style={styles.inactiveContainer}>
          <Feather name="alert-circle" size={32} color={COLORS.textTertiary} />
          <Text style={styles.inactiveText}>
            Ative o bip horário no painel de configurações para iniciar o cronômetro.
          </Text>
        </View>
      )}
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
  countdownContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  badgeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  badgeActive: {
    backgroundColor: COLORS.successGlowBg,
    borderColor: COLORS.successGlowBorder,
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  bgSync: { backgroundColor: COLORS.success },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.success,
  },
  badgeQuiet: {
    backgroundColor: COLORS.purpleDim,
    borderColor: COLORS.purpleBorder,
    gap: 6,
  },
  badgeQuietText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.purple,
  },
  inactiveContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.md,
  },
  inactiveText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
});
