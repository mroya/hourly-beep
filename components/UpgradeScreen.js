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
          {/* Botão fechar */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Feather name="x" size={24} color="#94a3b8" />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.starContainer}>
              <Ionicons name="star" size={40} color="#fbbf24" />
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
                  <Feather name={feature.icon} size={18} color="#fbbf24" />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureLabel}>{feature.label}</Text>
                  <Text style={styles.featureDesc}>{feature.desc}</Text>
                </View>
                <Feather name="check" size={18} color="#10b981" />
              </View>
            ))}
          </View>

          {/* Botão de compra */}
          <TouchableOpacity style={styles.purchaseButton} onPress={handlePurchase}>
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    borderTopWidth: 1,
    borderColor: '#1e293b',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  starContainer: {
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderRadius: 50,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#f8fafc',
  },
  titleAccent: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fbbf24',
    marginTop: -4,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 6,
    fontWeight: '500',
  },
  featuresContainer: {
    backgroundColor: '#131c31',
    borderRadius: 18,
    padding: 16,
    gap: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#243256',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIconContainer: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 10,
    padding: 8,
  },
  featureText: {
    flex: 1,
  },
  featureLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
  },
  featureDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  purchaseButton: {
    backgroundColor: '#fbbf24',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  purchaseButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  priceText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(15, 23, 42, 0.7)',
    marginTop: 2,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  restoreText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
});
