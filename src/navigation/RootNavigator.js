import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import useAuthStore from '../store/useAuthStore';
import LoginScreen from '../screens/auth/LoginScreen';
import ApprovalStatusScreen from '../screens/auth/ApprovalStatusScreen';
import PageLoader from '../components/PageLoader';
import EmployeeTabs from './EmployeeTabs';
import AdminTabs from './AdminTabs';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { isLoading, isAuthenticated, user, bootstrap } = useAuthStore();

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated || !user) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    );
  }

  if (user.role === 'ADMIN') {
    return (
      <Stack.Navigator>
        <Stack.Screen name="AdminPortal" component={AdminTabs} options={{ headerShown: false }} />
      </Stack.Navigator>
    );
  }

  if (user.role !== 'EMPLOYEE') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          initialParams={{ forceMessage: 'Invalid role detected.' }}
        />
      </Stack.Navigator>
    );
  }

  if (user.approvalStatus !== 'APPROVED') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="ApprovalStatus" component={ApprovalStatusScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator>
      <Stack.Screen name="EmployeePortal" component={EmployeeTabs} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
