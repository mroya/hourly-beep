import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppState, useAppDispatch, ACTIONS } from '../contexts/AppContext';
import { triggerHapticFeedback } from '../services/vibration';
import { trackEvent, EVENTS } from '../services/analytics';
import { COLORS, SPACING, RADIUS, GRADIENTS } from '../styles/theme';

export default function UpgradeBanner() {
  const { isPremium } = useAppState();
  const dispatch = useAppDispatch();

  if (isPremium) return null;

  return (
    <TouchableOpacity
      style={styles.upgradeBanner}
      onPress={() => {
        triggerHapticFeedback();
        dispatch({ type: ACTIONS.TOGGLE_UPGRADE, payload: true });
        trackEvent(EVENTS.UPGRADE_CLICK, { source: 'banner' });
      }}
    >
      <LinearGradient
        colors={GRADIENTS.premium}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFillObject, { borderRadius: RADIUS.xxl }]}
      />
      <LinearGradient
        colors={GRADIENTS.premiumShine}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[StyleSheet.absoluteFillObject, { borderRadius: RADIUS.xxl }]}
      />
      <View style={styles.upgradeBannerContent}>
        <Ionicons name="star" size={20} color={COLORS.white} />
        <View style={{ flex: 1, marginLeft: SPACING.md }}>
          <Text style={styles.upgradeBannerTitle}>Upgrade para Premium</Text>
          <Text style={styles.upgradeBannerDesc}>Sons exclusivos, intervalos custom e mais</Text>
        </View>
        <Feather name="chevron-right" size={20} color={COLORS.white} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  upgradeBanner: {
    width: '100%',
    backgroundColor: COLORS.transparent,
    borderRadius: RADIUS.xxl,
    marginBottom: SPACING.xl,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  upgradeBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  upgradeBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.white,
  },
  upgradeBannerDesc: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
    fontWeight: '600',
  },
});
