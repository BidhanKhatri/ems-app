import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../theme/theme';

const BUTTON_HEIGHT = 68;
const THUMB_SIZE = 60;
const PADDING = 4;

export default function SlideButton({ text, onSlide, disabled, color = COLORS.primary, onToggleScroll }) {
  const pan = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0.5)).current;
  const [containerWidth, setContainerWidth] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const maxTranslationRef = useRef(0);

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.5,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, [shimmerAnim]);

  const reset = () => {
    Animated.spring(pan, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 0,
    }).start(() => setIsCompleted(false));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled && !isCompleted,
      onMoveShouldSetPanResponder: (e, gestureState) => {
        const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
        if (isHorizontal && onToggleScroll) {
          onToggleScroll(false); // Disable scroll
        }
        return isHorizontal;
      },
      onPanResponderGrant: () => {
        if (onToggleScroll) onToggleScroll(false);
      },
      onPanResponderMove: (e, gestureState) => {
        if (disabled || isCompleted) return;
        const maxTranslation = maxTranslationRef.current;
        if (maxTranslation <= 0) return;

        let x = gestureState.dx;
        if (x < 0) x = 0;
        if (x > maxTranslation) x = maxTranslation;
        pan.setValue(x);
      },
      onPanResponderRelease: (e, gestureState) => {
        if (onToggleScroll) onToggleScroll(true); // Re-enable scroll
        
        if (disabled || isCompleted) return;
        const maxTranslation = maxTranslationRef.current;
        
        if (gestureState.dx > maxTranslation * 0.7) {
          Animated.timing(pan, {
            toValue: maxTranslation,
            duration: 150,
            useNativeDriver: true,
          }).start(() => {
            setIsCompleted(true);
            onSlide();
            setTimeout(reset, 1500);
          });
        } else {
          Animated.spring(pan, {
            toValue: 0,
            useNativeDriver: true,
            tension: 40,
            friction: 7,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        if (onToggleScroll) onToggleScroll(true); // Re-enable scroll
        Animated.spring(pan, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
        }).start();
      },
      onTerminationRequest: () => false,
    })
  ).current;

  const onLayout = (e) => {
    const { width } = e.nativeEvent.layout;
    setContainerWidth(width);
    maxTranslationRef.current = width - THUMB_SIZE - PADDING * 2;
  };

  const textOpacity = pan.interpolate({
    inputRange: [0, Math.max(1, (containerWidth - THUMB_SIZE) * 0.5)],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: disabled ? COLORS.background : '#F1F5F9', borderColor: COLORS.border },
        disabled && styles.disabled,
      ]}
      onLayout={onLayout}
    >
      <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
        <Animated.Text style={[styles.text, { opacity: shimmerAnim }]}>
          {text}
        </Animated.Text>
      </Animated.View>
      
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.thumb,
          {
            backgroundColor: color,
            transform: [{ translateX: pan }],
          },
          SHADOWS.sm,
        ]}
      >
        <Ionicons name="chevron-forward" size={24} color={COLORS.white} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: BUTTON_HEIGHT,
    borderRadius: BUTTON_HEIGHT / 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    paddingHorizontal: PADDING,
    overflow: 'hidden',
    position: 'relative',
  },
  textContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: THUMB_SIZE / 2,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: PADDING,
    zIndex: 10,
  },
  text: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  disabled: {
    opacity: 0.5,
  },
});
