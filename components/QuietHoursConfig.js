import React from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppState, useAppDispatch, ACTIONS } from '../contexts/AppContext';
import PremiumGate from './PremiumGate';
import { triggerHapticFeedback } from '../services/vibration';
import { trackEvent, EVENTS } from '../services/analytics';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../styles/theme';

export default function QuietHoursConfig() {
  const { quietHoursEnabled, quietHoursStart, quietHoursEnd, isEnabled, isPremium } = useAppState();
  const dispatch = useAppDispatch();

  const getQuietHoursText = () => {
    return `${quietHoursStart.toString().padStart(2, '0')}:00 — ${quietHoursEnd.toString().padStart(2, '0')}:00`;
  };

  return (
    <View>
      <Text style={[styles.sectionSubtitle, { marginTop: SPACING.xl }]}>HORÁRIO SILENCIOSO</Text>
      <PremiumGate isPremium={isPremium} onUpgrade={() => dispatch({ type: ACTIONS.TOGGLE_UPGRADE, payload: true })}>
        <View style={styles.controlRow}>
          <View style={{ flex: 1, paddingRight: SPACING.sm }}>
            <Text style={styles.statusText}>Não Perturbe</Text>
            <Text style={styles.controlSubText}>
              {quietHoursEnabled ? getQuietHoursText() : 'Desativado'}
            </Text>
          </View>
          <Switch
            trackColor={{ false: COLORS.borderMedium, true: COLORS.purple }}
            thumbColor={quietHoursEnabled ? COLORS.white : COLORS.textTertiary}
            ios_backgroundColor={COLORS.borderMedium}
            onValueChange={(value) => {
              triggerHapticFeedback();
              if (!isEnabled && isPremium) {
                dispatch({ type: ACTIONS.SET_QUIET_HOURS_ENABLED, payload: value });
                trackEvent(EVENTS.QUIET_HOURS_TOGGLED, { enabled: value });
              }
            }}
            value={quietHoursEnabled}
            style={{ transform: [{ scaleX: 1.3 }, { scaleY: 1.3 }] }}
          />
        </View>
        {quietHoursEnabled && isPremium && (
          <View style={styles.quietHoursConfig}>
            <View style={styles.hourPickerRow}>
              <Text style={styles.hourPickerLabel}>Início:</Text>
              <View style={styles.hourPicker}>
                <TouchableOpacity
                  style={styles.hourButton}
                  onPress={() => {
                    triggerHapticFeedback();
                    if (!isEnabled) dispatch({ type: ACTIONS.SET_QUIET_HOURS_START, payload: (quietHoursStart - 1 + 24) % 24 });
                  }}
                >
                  <Feather name="minus" size={14} color={COLORS.textTertiary} />
                </TouchableOpacity>
                <Text style={styles.hourValue}>{quietHoursStart.toString().padStart(2, '0')}:00</Text>
                <TouchableOpacity
                  style={styles.hourButton}
                  onPress={() => {
                    triggerHapticFeedback();
                    if (!isEnabled) dispatch({ type: ACTIONS.SET_QUIET_HOURS_START, payload: (quietHoursStart + 1) % 24 });
                  }}
                >
                  <Feather name="plus" size={14} color={COLORS.textTertiary} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.hourPickerRow}>
              <Text style={styles.hourPickerLabel}>Fim:</Text>
              <View style={styles.hourPicker}>
                <TouchableOpacity
                  style={styles.hourButton}
                  onPress={() => {
                    triggerHapticFeedback();
                    if (!isEnabled) dispatch({ type: ACTIONS.SET_QUIET_HOURS_END, payload: (quietHoursEnd - 1 + 24) % 24 });
                  }}
                >
                  <Feather name="minus" size={14} color={COLORS.textTertiary} />
                </TouchableOpacity>
                <Text style={styles.hourValue}>{quietHoursEnd.toString().padStart(2, '0')}:00</Text>
                <TouchableOpacity
                  style={styles.hourButton}
                  onPress={() => {
                    triggerHapticFeedback();
                    if (!isEnabled) dispatch({ type: ACTIONS.SET_QUIET_HOURS_END, payload: (quietHoursEnd + 1) % 24 });
                  }}
                >
                  <Feather name="plus" size={14} color={COLORS.textTertiary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </PremiumGate>
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
  quietHoursConfig: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.surfaceDeep,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
    gap: 10,
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  hourPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hourPickerLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textTertiary,
    width: 50,
  },
  hourPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  hourButton: {
    backgroundColor: COLORS.surfaceSolid,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
    borderRadius: 999,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hourValue: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.purple,
    fontFamily: TYPOGRAPHY.fontMonoBold,
    minWidth: 55,
    textAlign: 'center',
  },
});
