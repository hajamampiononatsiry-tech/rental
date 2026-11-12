import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');
const isSmallDevice = width < 380;

// Composant Helper pour les icônes vectorielles professionnelles
const TabVectorIcon = ({ name, color, size = isSmallDevice ? 18 : 22 }) => {
  switch (name) {
    case 'Home':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <Path d="M9 22V12h6v10" />
        </Svg>
      );
    case 'Catalogue':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <Rect x="3" y="3" width="7" height="7" rx="2" />
          <Rect x="14" y="3" width="7" height="7" rx="2" />
          <Rect x="14" y="14" width="7" height="7" rx="2" />
          <Rect x="3" y="14" width="7" height="7" rx="2" />
        </Svg>
      );
    case 'Payment':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <Rect x="2" y="5" width="20" height="14" rx="3" />
          <Path d="M2 10h20" />
        </Svg>
      );
    case 'History':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="12" cy="12" r="9" />
          <Path d="M12 6v6l4 2" />
        </Svg>
      );
    case 'Profile':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <Circle cx="12" cy="7" r="4" />
        </Svg>
      );
    default:
      return null;
  }
};

export default function BottomTabBar({ activeTab, onSelectTab, badges = {}, t, theme }) {
  const accentColor = theme?.accent || '#eab308';
  const inactiveColor = theme?.subText || '#94a3b8';
  const cardBg = theme?.cardBg || '#1e293b';

  const tabs = [
    { key: 'Home', label: t?.tabHome || 'Accueil' },
    { key: 'Catalogue', label: t?.tabCatalogue || 'Catalogue' },
    { key: 'Payment', label: t?.tabPayment || 'Paiement' },
    { key: 'History', label: t?.tabHistory || 'Historique' },
    { key: 'Profile', label: t?.tabProfile || 'Profil' },
  ];

  return (
    <View style={styles.outerWrapper}>
      <View style={[styles.container, { backgroundColor: cardBg }]}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const badgeCount = badges[tab.key] || 0;
          const currentColor = isActive ? accentColor : inactiveColor;

          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabButton,
                isActive && [styles.activeTabButton, { backgroundColor: 'rgba(234, 179, 8, 0.12)' }]
              ]}
              onPress={() => onSelectTab(tab.key)}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <TabVectorIcon name={tab.key} color={currentColor} />
                
                {badgeCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </Text>
                  </View>
                )}
              </View>

              <Text 
                style={[styles.tabLabel, { color: currentColor }, isActive && styles.activeTabLabel]} 
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: isSmallDevice ? 6 : 12,
    paddingBottom: 8,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
  container: {
    flexDirection: 'row',
    borderRadius: 30,
    paddingVertical: isSmallDevice ? 6 : 8,
    paddingHorizontal: isSmallDevice ? 4 : 6,
    justifyContent: 'space-around',
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: isSmallDevice ? 4 : 8,
    borderRadius: 20,
    flex: 1,
  },
  activeTabButton: {
    transform: [{ scale: 1.02 }],
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: isSmallDevice ? 8.5 : 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeTabLabel: {
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
    borderWidth: 1,
    borderColor: '#1e293b',
    zIndex: 10,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
  },
});