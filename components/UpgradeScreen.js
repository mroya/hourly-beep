import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS, SHADOWS, GRADIENTS, TYPOGRAPHY } from '../styles/theme';

const FEATURES = [
  { icon: 'volume-x', label: 'Remover anúncios', desc: 'Experiência limpa e sem interrupções' },
  { icon: 'music', label: '5 sons exclusivos', desc: 'Sino, gongo, digital, suave e mais' },
  { icon: 'sliders', label: 'Intervalos customizados', desc: '15min, 30min, 2h e 3h' },
  { icon: 'moon', label: 'Horário silencioso', desc: 'Defina quando não quer ser alertado' },
  { icon: 'gift', label: 'Atualizações futuras', desc: 'Temas visuais, widget e mais' },
];

export default function UpgradeScreen({ visible, onClose, onPurchase, onRestore }) {
  const handlePurchase = () => {
    // Simulação de compra (será substituído por RevenueCat)
    Alert.alert(
      'Desbloquear Premium',
      'Deseja ativar todos os recursos premium?\n\n(Em breve: integração com Google Play para compra real)',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Ativar Premium',
          onPress: async () => {
            const success = await onPurchase();
            if (success) {
              Alert.alert('🎉 Parabéns!', 'Todos os recursos premium foram desbloqueados!');
              onClose();
            }
          },
        },
      ]
    );
  };

  const handleRestore = async () => {
    const restored = await onRestore();
    if (restored) {
      Alert.alert('✅ Restaurado', 'Compra restaurada com sucesso!');
      onClose();
    } else {
      Alert.alert('Nenhuma compra encontrada', 'Não encontramos compras anteriores nesta conta.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={GRADIENTS.background}
            style={[StyleSheet.absoluteFillObject, { borderTopLeftRadius: 28, borderTopRightRadius: 28 }]}
          />
          {/* Botão fechar */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Feather name="x" size={20} color={COLORS.textTertiary} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.starContainer}>
              <Ionicons name="star" size={40} color={COLORS.gold} />
            </View>
            <Text style={styles.title}>Bip Horário</Text>
            <Text style={styles.titleAccent}>Premium</Text>
            <Text style={styles.subtitle}>Desbloqueie todo o potencial</Text>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            {FEATURES.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <View style={styles.featureIconContainer}>
                  <Feather name={feature.icon} size={18} color={COLORS.gold} />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureLabel}>{feature.label}</Text>
                  <Text style={styles.featureDesc}>{feature.desc}</Text>
                </View>
                <Feather name="check" size={18} color={COLORS.success} />
              </View>
            ))}
          </View>

          {/* Botão de compra */}
          <TouchableOpacity style={styles.purchaseButton} onPress={handlePurchase}>
            <LinearGradient
              colors={GRADIENTS.premium}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]}
            />
            <LinearGradient
              colors={GRADIENTS.premiumShine}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]}
            />
            <Text style={styles.purchaseButtonText}>Desbloquear Premium</Text>
            <Text style={styles.priceText}>R$ 9,90 · Compra única</Text>
          </TouchableOpacity>

          {/* Restaurar */}
          <TouchableOpacity style={styles.restoreButton} onPress={handleRestore}>
            <Text style={styles.restoreText}>Restaurar compra anterior</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.backgroundAlt,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    borderTopWidth: 1,
    borderColor: COLORS.borderSubtle,
    overflow: 'hidden',
    position: 'relative',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 6,
    backgroundColor: COLORS.surfaceSolid,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  starContainer: {
    backgroundColor: COLORS.goldDimAlt,
    borderRadius: RADIUS.circle,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  titleAccent: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.gold,
    marginTop: -4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textTertiary,
    marginTop: 6,
    fontWeight: '600',
  },
  featuresContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: 16,
    gap: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIconContainer: {
    backgroundColor: COLORS.goldDim,
    borderRadius: RADIUS.md,
    padding: 8,
  },
  featureText: {
    flex: 1,
  },
  featureLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  featureDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  purchaseButton: {
    backgroundColor: COLORS.transparent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  purchaseButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textOnDark,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(15, 23, 42, 0.75)',
    marginTop: 2,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  restoreText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
});
