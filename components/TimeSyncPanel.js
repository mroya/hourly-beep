import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTimeSync } from '../hooks/useTimeSync';
import { useClock } from '../hooks/useClock';
import { triggerHapticFeedback } from '../services/vibration';
import { formatClock, getOffsetText } from '../utils/formatters';
import { COLORS, SPACING, RADIUS, GRADIENTS, TYPOGRAPHY } from '../styles/theme';

export default function TimeSyncPanel() {
  const currentTime = useClock();
  const { isSyncing, timeOffset, lastSyncTime, syncTime } = useTimeSync();

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.row}>
          <Feather name="cpu" size={20} color={COLORS.neonCyan} />
          <Text style={styles.cardTitle}>Sincronizador Temporal</Text>
        </View>
        <View style={[styles.statusIndicator, lastSyncTime ? styles.statusSync : styles.statusUnsync]}>
          <View style={[styles.miniDot, lastSyncTime ? styles.bgSync : styles.bgUnsync]} />
          <Text style={[styles.indicatorText, lastSyncTime ? styles.textSync : styles.textUnsync]}>
            {lastSyncTime ? 'COMPENSADO' : 'PENDENTE'}
          </Text>
        </View>
      </View>

      <View style={styles.clocksContainer}>
        <View style={styles.clockSubCard}>
          <Text style={styles.clockLabel}>CELULAR (SISTEMA)</Text>
          <View style={styles.digitalClockContainerSecondary}>
            <Text style={styles.clockValueBackgroundSecondary}>88:88:88.8</Text>
            <Text style={styles.clockValue}>{formatClock(currentTime, 0)}</Text>
          </View>
        </View>
        <View style={styles.clockSubCardHighlight}>
          <Text style={styles.clockLabelHighlight}>RELÓGIO ATÔMICO (NTP)</Text>
          <View style={styles.digitalClockContainer}>
            <Text style={styles.clockValueBackground}>88:88:88.8</Text>
            <Text style={styles.clockValueHighlight}>{formatClock(currentTime, timeOffset)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Drift do Sistema:</Text>
          <Text style={[
            styles.statValue,
            timeOffset === 0 && !lastSyncTime ? styles.textNeutral : (Math.abs(timeOffset) < 300 ? styles.textSuccess : styles.textWarning)
          ]}>
            {getOffsetText(timeOffset, lastSyncTime)}
          </Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Última Calibração:</Text>
          <Text style={styles.statValue}>
            {lastSyncTime ? lastSyncTime.toLocaleTimeString() : 'Nunca'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
        onPress={() => {
          triggerHapticFeedback();
          syncTime(false);
        }}
        disabled={isSyncing}
      >
        {!isSyncing && (
          <LinearGradient
            colors={GRADIENTS.syncButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFillObject, { borderRadius: RADIUS.lg }]}
          />
        )}
        {isSyncing ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <>
            <Feather name="refresh-cw" size={16} color={COLORS.white} style={styles.buttonIcon} />
            <Text style={styles.syncButtonText}>Calibrar com Hora Atômica</Text>
          </>
        )}
      </TouchableOpacity>
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
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  statusSync: {
    backgroundColor: COLORS.successDim,
    borderColor: COLORS.successBorder,
  },
  statusUnsync: {
    backgroundColor: COLORS.warningDim,
    borderColor: COLORS.warningBorder,
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  bgSync: { backgroundColor: COLORS.success },
  bgUnsync: { backgroundColor: COLORS.warning },
  indicatorText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textSync: { color: COLORS.success },
  textUnsync: { color: COLORS.warning },
  textNeutral: { color: COLORS.textTertiary },
  textSuccess: { color: COLORS.success },
  textWarning: { color: COLORS.warningLight },
  clocksContainer: {
    flexDirection: 'column',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  clockSubCard: {
    backgroundColor: COLORS.surfaceDeep,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
  },
  clockSubCardHighlight: {
    backgroundColor: COLORS.surfaceDeep,
    borderWidth: 1,
    borderColor: COLORS.neonCyanDim,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    shadowColor: COLORS.neonCyan,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  clockLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    marginBottom: SPACING.sm,
  },
  clockLabelHighlight: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.neonCyan,
    letterSpacing: 1.2,
    marginBottom: SPACING.sm,
  },
  digitalClockContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: 36,
  },
  digitalClockContainerSecondary: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: 32,
  },
  clockValueBackground: {
    position: 'absolute',
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.neonCyan,
    opacity: 0.08,
    fontFamily: TYPOGRAPHY.fontMonoBold,
    letterSpacing: 2,
    textAlign: 'center',
  },
  clockValueBackgroundSecondary: {
    position: 'absolute',
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textTertiary,
    opacity: 0.08,
    fontFamily: TYPOGRAPHY.fontMonoBold,
    letterSpacing: 2,
    textAlign: 'center',
  },
  clockValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textTertiary,
    fontFamily: TYPOGRAPHY.fontMonoBold,
    letterSpacing: 2,
    textAlign: 'center',
  },
  clockValueHighlight: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.neonCyan,
    fontFamily: TYPOGRAPHY.fontMonoBold,
    letterSpacing: 2,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 242, 254, 0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  statsContainer: {
    backgroundColor: COLORS.surfaceDeep,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  syncButton: {
    backgroundColor: COLORS.transparent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    width: '100%',
    shadowColor: COLORS.accentBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  syncButtonDisabled: {
    backgroundColor: COLORS.accentBlueDark,
    opacity: 0.8,
  },
  syncButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  buttonIcon: {
    marginRight: SPACING.sm,
  },
});
