import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppState } from '../contexts/AppContext';
import { COLORS, SPACING, RADIUS, GRADIENTS } from '../styles/theme';

export default function Header() {
  const { isEnabled, useAtomicSync } = useAppState();

  return (
    <View style={styles.header}>
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={GRADIENTS.neonCyanSoft}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Ionicons name="notifications-outline" size={34} color={COLORS.neonCyan} style={styles.bellIcon} />
        {isEnabled && <View style={styles.pulseDot} />}
      </View>
      <Text style={styles.title}>Bip Horário</Text>
      <Text style={styles.subtitle}>
        {useAtomicSync ? 'Sincronização Atômica Ativa' : 'Sincronizado com Relógio do Celular'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.xxxl,
  },
  iconContainer: {
    position: 'relative',
    backgroundColor: COLORS.surfaceSolid,
    padding: SPACING.lg,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
    marginBottom: SPACING.lg,
    shadowColor: COLORS.neonCyan,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  bellIcon: {
    transform: [{ rotate: '5deg' }],
  },
  pulseDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.success,
    borderWidth: 1.5,
    borderColor: COLORS.surfaceSolid,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textTertiary,
    marginTop: SPACING.xs,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

