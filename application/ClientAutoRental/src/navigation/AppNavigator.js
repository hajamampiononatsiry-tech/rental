import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import VerifyOTPScreen from '../screens/verifyOTPScreen';
import MainTabContainer from '../screens/MainTabContainer';
import DetailCarScreen from '../screens/DetailCarScreen';
import ReservationScreen from '../screens/ReservationScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen} 
        options={{
          title: 'Inscription',
          headerStyle: { backgroundColor: '#0f172a', elevation: 0, shadowOpacity: 0, borderBottomWidth: 0 },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="ResetPasswordMobile" 
        component={ResetPasswordScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="VerifyOTP" 
        component={VerifyOTPScreen} 
        options={{ title: 'Vérification' }} 
      />
      <Stack.Screen 
        name="Catalogue" 
        component={MainTabContainer} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="DetailCar" 
        component={DetailCarScreen} 
        options={{ title: 'Détail du véhicule' }} 
      />
      <Stack.Screen 
        name="Reservation" 
        component={ReservationScreen} 
        options={{
          title: 'Réservation',
          headerStyle: { backgroundColor: '#1e293b', elevation: 0, shadowOpacity: 0, borderBottomWidth: 0 },
          headerTintColor: '#ffffff',
        }}
      />
    </Stack.Navigator>
  );
}