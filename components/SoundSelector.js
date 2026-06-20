import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppState, useAppDispatch, ACTIONS } from '../contexts/AppContext';
import { SOUNDS, playPreviewSound } from '../services/audio';
import { triggerHapticFeedback } from '../services/vibration';
import { trackEvent, EVENTS } from '../services/analytics';
import { COLORS, SPACING, RADIUS } from '../styles/theme';

export default function SoundSelector() {
  const { selectedSound, isEnabled, isPremium } = useAppState();
  const dispatch = useAppDispatch();

  return (
    <View>
      <Text style={styles.sectionSubtitle}>SOM DO ALERTA</Text>
      <View style={styles.soundList}>
        {SOUNDS.map((sound) => {
          const isActive = selectedSound === sound.id;
          const isLocked = sound.isPremium && !isPremium;
          return (
            <TouchableOpacity
              key={sound.id}
              style={[styles.soundRow, isActive && styles.soundRowActive]}
              onPress={() => {
                triggerHapticFeedback();
                if (isEnabled) return;
                if (isLocked) {
                  dispatch({ type: ACTIONS.TOGGLE_UPGRADE, payload: true });
                  return;
                }
                dispatch({ type: ACTIONS.SET_SOUND, payload: sound.id });
                trackEvent(EVENTS.SOUND_CHANGED, { sound: sound.id });
              }}
              activeOpacity={isEnabled ? 1 : 0.7}
            >
              {isActive && (
                <LinearGradient
                  colors={['rgba(0, 242, 254, 0.12)', 'rgba(79, 172, 254, 0.02)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[StyleSheet.absoluteFillObject, { borderRadius: RADIUS.md }]}
                />
              )}
              <Feather name={sound.icon} size={18} color={isActive ? COLORS.neonCyan : COLORS.textMuted} style={styles.soundIcon} />
              <Text style={[styles.soundName, isActive && styles.soundNameActive]}>
                {sound.name}
              </Text>
              {isLocked && (
                <View style={styles.soundLockBadge}>
                  <Feather name="lock" size={10} color={COLORS.gold} />
                  <Text style={styles.soundLockText}>PRO</Text>
                </View>
              )}
              {!isLocked && (
                <TouchableOpacity
                  style={styles.soundPlayButton}
                  onPress={() => {
                    triggerHapticFeedback();
                    playPreviewSound(sound.id);
                  }}
                >
                  <Feather name="play" size={14} color={isActive ? COLORS.neonCyan : COLORS.textMuted} />
                </TouchableOpacity>
              )}
              {isActive && !isLocked && (
                <Feather name="check-circle" size={16} color={COLORS.success} style={{ marginLeft: 8 }} />
              )}
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
  soundList: {
    gap: 6,
    marginBottom: SPACING.xl,
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceDeep,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: SPACING.md,
  },
  soundRowActive: {
    borderColor: 'rgba(0, 242, 254, 0.4)',
    backgroundColor: COLORS.transparent,
    overflow: 'hidden',
  },
  soundIcon: {
    marginRight: SPACING.md,
  },
  soundName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textTertiary,
  },
  soundNameActive: {
    color: COLORS.textSecondary,
  },
  soundLockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.goldDim,
    borderRadius: 10,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    gap: 4,
  },
  soundLockText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.gold,
    letterSpacing: 0.5,
  },
  soundPlayButton: {
    padding: 6,
  },
});
