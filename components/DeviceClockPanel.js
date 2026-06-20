import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useClock } from '../hooks/useClock';
import { formatClock } from '../utils/formatters';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../styles/theme';

export default function DeviceClockPanel() {
  const currentTime = useClock();

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.row}>
          <Feather name="smartphone" size={20} color={COLORS.neonCyan} />
          <Text style={styles.cardTitle}>Relógio do Celular</Text>
        </View>
        <View style={[styles.statusIndicator, styles.statusSync]}>
          <View style={[styles.miniDot, styles.bgSync]} />
          <Text style={[styles.indicatorText, styles.textSync]}>ATIVO</Text>
        </View>
      </View>
      <View style={styles.clockSubCardHighlight}>
        <Text style={styles.clockLabelHighlight}>HORÁRIO DO SISTEMA</Text>
        <View style={styles.digitalClockContainer}>
          <Text style={styles.clockValueBackground}>88:88:88.8</Text>
          <Text style={styles.clockValueHighlight}>{formatClock(currentTime, 0)}</Text>
        </View>
      </View>
      <Text style={styles.clockModeDescription}>
        O bip tocará exatamente na hora cheia exibida no seu celular.
      </Text>
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
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  bgSync: { backgroundColor: COLORS.success },
  indicatorText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textSync: { color: COLORS.success },
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
  clockModeDescription: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.lg,
    lineHeight: 18,
    fontWeight: '500',
  },
});

