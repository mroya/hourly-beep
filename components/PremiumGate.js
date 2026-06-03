import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

/**
 * Componente que sobrepõe um cadeado em features premium.
 * Se isPremium=true, renderiza os children normalmente.
 * Se isPremium=false, mostra um overlay com cadeado que abre o upgrade.
 */
export default function PremiumGate({ isPremium, onUpgrade, children, style }) {
  if (isPremium) {
    return <View style={style}>{children}</View>;
  }

  return (
    <View style={[styles.container, style]}>
      {children}
      <TouchableOpacity
        style={styles.overlay}
        onPress={onUpgrade}
        activeOpacity={0.85}
      >
        <View style={styles.badge}>
          <Feather name="lock" size={12} color="#fbbf24" />
          <Text style={styles.badgeText}>PRO</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(9, 13, 22, 0.65)',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderColor: 'rgba(251, 191, 36, 0.3)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  badgeText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
