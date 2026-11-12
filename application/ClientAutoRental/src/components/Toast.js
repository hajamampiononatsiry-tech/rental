import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, TouchableOpacity, View, Platform } from 'react-native';

export default function Toast({ visible, message, type = 'error', onClose }) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, { toValue: Platform.OS === 'ios' ? 50 : 20, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true })
      ]).start();

      const timer = setTimeout(() => {
        hideToast();
      }, 4000);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -100, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true })
    ]).start(() => {
      if (onClose) onClose();
    });
  };

  if (!visible && opacity._value === 0) return null;

  const getBackgroundColor = () => {
    switch (type) {
      case 'success': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      case 'error': default: return '#ef4444';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return '✓';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'error': default: return '✕';
    }
  };

  return (
    <Animated.View 
      style={[
        styles.toastContainer, 
        { backgroundColor: getBackgroundColor(), opacity, transform: [{ translateY }] }
      ]}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.iconText}>{getIcon()}</Text>
      </View>
      <Text style={styles.messageText}>{message}</Text>
      <TouchableOpacity onPress={hideToast} style={styles.closeBtn}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    zIndex: 99999,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  iconContainer: { marginRight: 8 },
  iconText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  messageText: { flex: 1, color: '#ffffff', fontSize: 12.5, fontWeight: '600' },
  closeBtn: { paddingLeft: 8 },
  closeText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 'bold' }
});