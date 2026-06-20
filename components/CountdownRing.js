import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { COLORS, TYPOGRAPHY } from '../styles/theme';

/**
 * Anel circular SVG animado que mostra o progresso até o próximo bip.
 * Inclui efeito de glow pulsante nos últimos 10 segundos.
 */
export default function CountdownRing({ msLeft, intervalMs, secondsLeft, countdownText, currentTime }) {
  const progressRatio = msLeft / intervalMs;

  // Configurações do SVG
  const size = 180;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressRatio);

  // Pulsação luminosa (glow) nos últimos 10 segundos
  const pulse = 0.5 + 0.5 * Math.sin((currentTime.getMilliseconds() / 1000) * Math.PI * 2);
  const glowWidth = strokeWidth + 6 * pulse;
  const opacityGlow = 0.1 + 0.25 * pulse;

  return (
    <View style={styles.circularProgressContainer}>
      <Svg width={size} height={size}>
        <Defs>
          {/* Gradiente Cyan/Azul para contagem normal */}
          <LinearGradient id="normalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={COLORS.neonCyan} />
            <Stop offset="100%" stopColor={COLORS.accentBlue} />
          </LinearGradient>
          {/* Gradiente Vermelho/Laranja para últimos 10 segundos */}
          <LinearGradient id="alertGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={COLORS.error} />
            <Stop offset="100%" stopColor={COLORS.warning} />
          </LinearGradient>
        </Defs>

        {/* Círculo de fundo */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={COLORS.borderMedium}
          strokeWidth={strokeWidth}
          fill="transparent"
          opacity={0.2}
        />
        {/* Círculo de brilho pulsante (glow) quando segundos < 10 */}
        {secondsLeft < 10 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#alertGrad)"
            strokeWidth={glowWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
            opacity={opacityGlow}
          />
        )}
        {/* Círculo principal de progresso */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={secondsLeft < 10 ? 'url(#alertGrad)' : 'url(#normalGrad)'}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      <View style={styles.circularProgressTextContainer}>
        <Text style={styles.countdownLabel}>PRÓXIMO BIP EM</Text>
        <Text style={[
          styles.countdownValue,
          secondsLeft < 10 ? styles.countdownValueAlert : styles.countdownValueNormal
        ]}>
          {countdownText}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  circularProgressContainer: {
    position: 'relative',
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  circularProgressTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  countdownValue: {
    fontSize: 28,
    fontWeight: '800',
    fontFamily: TYPOGRAPHY.fontMonoBold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  countdownValueNormal: {
    color: COLORS.neonCyan,
    textShadowColor: 'rgba(0, 242, 254, 0.35)',
  },
  countdownValueAlert: {
    color: COLORS.error,
    textShadowColor: COLORS.errorGlow,
  },
});

