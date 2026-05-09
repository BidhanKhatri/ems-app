import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, Dimensions, ActivityIndicator, Text } from 'react-native';
import { COLORS } from '../theme/theme';

const { width } = Dimensions.get('window');

export default function PageLoader() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.logoContainer, 
          { 
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <Image 
          source={require('../../assets/ems-logo.png')} 
          style={styles.logo} 
          resizeMode="contain"
        />
      </Animated.View>
      
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={COLORS.primary} style={styles.loader} />
        <Text style={styles.loadingText}>Initializing EMS Portal</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: width * 0.4,
    height: width * 0.4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  loader: {
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
