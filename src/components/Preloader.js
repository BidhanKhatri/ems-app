import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, Dimensions, ActivityIndicator } from 'react-native';

const { width } = Dimensions.get('window');

const Preloader = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start pulse animation immediately to match the native splash
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.logoContainer, 
          { 
            transform: [{ scale: pulseAnim }]
          }
        ]}
      >
        <Image 
          source={require('../../assets/ems-logo.png')} 
          style={styles.logo} 
          resizeMode="contain"
        />
      </Animated.View>
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="small" color="#4F46E5" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: width * 0.7, 
    height: width * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  loaderContainer: {
    position: 'absolute',
    bottom: 80,
  },
});

export default Preloader;
