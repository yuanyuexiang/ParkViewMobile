// ========================================
// CRITICAL: 这些必须在所有其他导入之前!
// ========================================
// 1. 加密随机数生成器(必须第一个导入!)
import 'react-native-get-random-values';

// 2. 其他 polyfills
import '@/mobile/polyfills';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
// @ts-ignore - wagmi 1.x types compatibility
import { WagmiConfig } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { WalletProvider } from '@/mobile/contexts/WalletContext';
import { wagmiConfig } from '@/mobile/config/wagmiConfig';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <WagmiConfig config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <WalletProvider>
            <StatusBar style="auto" />
            <Stack
              screenOptions={{
                headerStyle: {
                  backgroundColor: '#1890ff',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            >
              <Stack.Screen
                name="(tabs)"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="add-parking"
                options={{
                  title: '创建车位',
                  presentation: 'modal'
                }}
              />
            </Stack>
          </WalletProvider>
        </QueryClientProvider>
      </WagmiConfig>
    </SafeAreaProvider>
  );
}
