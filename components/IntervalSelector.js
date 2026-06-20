import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppState, useAppDispatch, ACTIONS } from '../contexts/AppContext';
import { INTERVALS } from '../services/notifications';
import { triggerHapticFeedback } from '../services/vibration';
import { trackEvent, EVENTS } from '../services/analytics';
import { COLORS, SPACING, RADIUS, GRADIENTS } from '../styles/theme';

export default function IntervalSelector() {
  const { intervalTime, isEnabled, isPremium } = useAppState();
  const dispatch = useAppDispatch();

  return (
    <View>
      <Text style={styles.sectionSubtitle}>INTERVALO DOS ALERTAS</Text>
      <View style={styles.intervalGrid}>
        {INTERVALS.map((interval) => {
          const isActive = intervalTime === interval.seconds;
          const isLocked = interval.isPremium && !isPremium;
          return (
            <TouchableOpacity
              key={interval.seconds}
              style={[
                styles.intervalButton,
                isActive && styles.intervalActive,
                isLocked && styles.intervalLocked,
              ]}
              onPress={() => {
                triggerHapticFeedback();
                if (isEnabled) return;
                if (isLocked) {
                  dispatch({ type: ACTIONS.TOGGLE_UPGRADE, payload: true });
                  return;
                }
                dispatch({ type: ACTIONS.SET_INTERVAL, payload: interval.seconds });
                trackEvent(EVENTS.INTERVAL_CHANGED, { interval: interval.seconds, label: interval.label });
              }}
              activeOpacity={isEnabled ? 1 : 0.7}
            >
              {isActive && (
                <LinearGradient
                  colors={GRADIENTS.interval}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[StyleSheet.absoluteFillObject, { borderRadius: 11 }]}
                />
              )}
              <Text style={[
                styles.intervalText,
                isActive && styles.intervalTextActive,
                isLocked && styles.intervalTextLocked,
              ]}>
                {interval.label}
              </Text>
              {isLocked && <Feather name="lock" size={10} color={COLORS.textMuted} style={styles.intervalLockIcon} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  intervalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  intervalButton: {
    width: '31%',
    backgroundColor: COLORS.surfaceDeep,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intervalActive: {
    backgroundColor: COLORS.transparent,
    borderColor: 'rgba(0, 242, 254, 0.4)',
    shadowColor: COLORS.neonCyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  intervalLocked: {
    borderColor: COLORS.borderSubtle,
    opacity: 0.6,
  },
  intervalText: {
    color: COLORS.textMuted,
    fontWeight: '600',
    fontSize: 13,
  },
  intervalTextActive: {
    color: COLORS.white,
  },
  intervalTextLocked: {
    color: COLORS.textDark,
  },
  intervalLockIcon: {
    marginTop: 2,
  },
});
