import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomTabBar from '../components/BottomTabBar';
import AIChatBubble from '../components/AIChatBubble';
import HomeScreen from './HomeScreen';
import CatalogueScreen from './CatalogueScreen';
import NotificationsScreen from './NotificationsScreen';
import PaymentScreen from './PaymentScreen';
import ProfileScreen from './ProfileScreen';
import api from '../services/api';
import { ThemeContext } from '../context/ThemeContext';

export default function MainTabContainer({ navigation, route }) {
  const { theme, t } = useContext(ThemeContext);
  const [activeTab, setActiveTab] = useState('Home');
  const [historyCount, setHistoryCount] = useState(0);

  useEffect(() => {
    fetchHistoryCount();
    const interval = setInterval(fetchHistoryCount, 20000);
    return () => clearInterval(interval);
  }, []);

  const fetchHistoryCount = async () => {
    try {
      const response = await api.get('reservations/');
      const data = response.data.results || response.data;
      if (Array.isArray(data)) {
        const readIdsJson = await AsyncStorage.getItem('read_mobile_reservations');
        const readIds = readIdsJson ? JSON.parse(readIdsJson) : [];
        const unreadItems = data.filter(item => !readIds.includes(String(item.id)));
        setHistoryCount(unreadItems.length);
      }
    } catch (error) {
      console.log("Erreur lors de la récupération du nombre de réservations :", error);
    }
  };

  const handleSelectTab = async (tabKey) => {
    setActiveTab(tabKey);

    if (tabKey === 'History') {
      try {
        const response = await api.get('reservations/');
        const data = response.data.results || response.data;
        if (Array.isArray(data)) {
          const allIds = data.map(item => String(item.id));
          await AsyncStorage.setItem('read_mobile_reservations', JSON.stringify(allIds));
          setHistoryCount(0);
        }
      } catch (error) {
        console.log("Erreur lors du marquage des lectures :", error);
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.content}>
        <View style={[styles.tabScreen, activeTab === 'Home' ? styles.visible : styles.hidden]}>
          <HomeScreen 
            navigation={navigation} 
            route={route} 
            onNavigateToCatalogue={() => handleSelectTab('Catalogue')} 
          />
        </View>
        <View style={[styles.tabScreen, activeTab === 'Catalogue' ? styles.visible : styles.hidden]}>
          <CatalogueScreen navigation={navigation} route={route} />
        </View>
        <View style={[styles.tabScreen, activeTab === 'Payment' ? styles.visible : styles.hidden]}>
          <PaymentScreen navigation={navigation} route={route} />
        </View>
        <View style={[styles.tabScreen, activeTab === 'History' ? styles.visible : styles.hidden]}>
          <NotificationsScreen navigation={navigation} route={route} />
        </View>
        <View style={[styles.tabScreen, activeTab === 'Profile' ? styles.visible : styles.hidden]}>
          <ProfileScreen navigation={navigation} route={route} />
        </View>
      </View>

      <AIChatBubble />

      <BottomTabBar 
        activeTab={activeTab} 
        onSelectTab={handleSelectTab} 
        badges={{
          History: historyCount 
        }}
        theme={theme}
        t={t}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  tabScreen: { flex: 1 },
  visible: { display: 'flex' },
  hidden: { display: 'none' },
});