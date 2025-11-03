/**
 * WalletConnect 钱包上下文 - 纯 SignClient 实现
 * 不依赖 Web3Modal,使用自定义 UI
 */

import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { Alert, Linking, AppState } from 'react-native';
import SignClient from '@walletconnect/sign-client';
import type { SessionTypes } from '@walletconnect/types';
import { formatEther } from 'viem';
import { publicClient } from '../config/wagmi';
import { walletConnectStorage } from '../utils/walletConnectStorage';

const PROJECT_ID = '9f5e5740b1d939c695c50b1111a7d90d';
const MANTLE_SEPOLIA_CHAIN_ID = 5003;

interface WalletContextType {
  address: string | null;
  chainId: number;
  balance: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  isInitialized: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchNetwork: (chainId: number) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number>(MANTLE_SEPOLIA_CHAIN_ID);
  const [balance, setBalance] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [signClient, setSignClient] = useState<SignClient | null>(null);
  const [session, setSession] = useState<SessionTypes.Struct | null>(null);

  // 初始化 SignClient
  useEffect(() => {
    const init = async () => {
      try {
        console.log('🔄 Initializing WalletConnect SignClient...');
        
        const client = await SignClient.init({
          projectId: PROJECT_ID,
          metadata: {
            name: 'ParkView',
            description: '去中心化停车位租赁平台',
            url: 'https://parkview.app',
            icons: ['https://parkview.app/icon.png'],
          },
          storage: walletConnectStorage as any,
          logger: 'error', // 只显示错误日志，避免太多警告信息
        });
        
        setSignClient(client);
        setIsInitialized(true);
        console.log('✅ WalletConnect SignClient initialized successfully');
      } catch (error) {
        console.error('❌ Failed to init SignClient:', error);
        setIsInitialized(false);
      }
    };

    init();
  }, []);

  // 获取余额
  const fetchBalance = useCallback(async (addr: string) => {
    try {
      const bal = await publicClient.getBalance({
        address: addr as `0x${string}`,
      });
      setBalance(formatEther(bal));
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      setBalance('0');
    }
  }, []);

  // 监听地址变化获取余额
  useEffect(() => {
    if (address) {
      fetchBalance(address);
    }
  }, [address, fetchBalance]);

  // 连接钱包
  const connect = useCallback(async () => {
    if (!signClient) {
      Alert.alert('错误', 'WalletConnect 正在初始化，请稍后再试');
      return;
    }

    try {
      setIsConnecting(true);
      console.log('🔄 Starting WalletConnect connection...');

      const { uri, approval } = await signClient.connect({
        requiredNamespaces: {
          eip155: {
            chains: [`eip155:${MANTLE_SEPOLIA_CHAIN_ID}`],
            methods: [
              'eth_sendTransaction',
              'eth_signTransaction',
              'eth_sign',
              'personal_sign',
              'eth_signTypedData',
              'eth_signTypedData_v4',
            ],
            events: ['chainChanged', 'accountsChanged'],
          },
        },
      });

      if (uri) {
        console.log('📱 Opening MetaMask with WC URI...');
        // 打开 MetaMask
        const wcUri = `metamask://wc?uri=${encodeURIComponent(uri)}`;
        const canOpen = await Linking.canOpenURL(wcUri);
        
        if (canOpen) {
          await Linking.openURL(wcUri);
          console.log('✅ MetaMask opened');
        } else {
          console.log('⚠️ Cannot open MetaMask deep link');
          Alert.alert(
            '打开 MetaMask',
            `请在 MetaMask 中扫描二维码:\n\n${uri}`,
            [
              { text: '取消', style: 'cancel' },
              { text: '复制 URI', onPress: () => {
                // 这里可以复制到剪贴板
                console.log('WC URI:', uri);
              }},
            ]
          );
        }
      }

      // 等待批准
      console.log('⏳ Waiting for user approval...');
      const newSession = await approval();
      setSession(newSession);

      const addr = newSession.namespaces.eip155.accounts[0].split(':')[2];
      setAddress(addr);

      console.log('✅ Connected to:', addr);
      Alert.alert('连接成功', `已连接到 ${addr.slice(0, 6)}...${addr.slice(-4)}`);
    } catch (error: any) {
      console.error('❌ Connection error:', error);
      if (error.message?.includes('User rejected')) {
        Alert.alert('连接取消', '用户拒绝了连接请求');
      } else {
        Alert.alert('连接失败', error.message || '无法连接钱包');
      }
    } finally {
      setIsConnecting(false);
    }
  }, [signClient]);

  // 断开连接
  const disconnect = useCallback(async () => {
    if (!signClient || !session) return;

    try {
      await signClient.disconnect({
        topic: session.topic,
        reason: {
          code: 6000,
          message: 'User disconnected',
        },
      });

      setSession(null);
      setAddress(null);
      setBalance(null);

      Alert.alert('已断开', '钱包已断开连接');
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }, [signClient, session]);

  // 切换网络
  const switchNetwork = useCallback(async (newChainId: number) => {
    if (!signClient || !session) {
      Alert.alert('错误', '请先连接钱包');
      return;
    }

    try {
      await signClient.request({
        topic: session.topic,
        chainId: `eip155:${newChainId}`,
        request: {
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${newChainId.toString(16)}` }],
        },
      });

      setChainId(newChainId);
      Alert.alert('网络切换成功', `已切换到链 ID: ${newChainId}`);
    } catch (error: any) {
      console.error('Switch network error:', error);
      Alert.alert('切换失败', error.message || '无法切换网络');
    }
  }, [signClient, session]);

  const value: WalletContextType = {
    address,
    chainId,
    balance,
    isConnected: !!address,
    isConnecting,
    isInitialized,
    connect,
    disconnect,
    switchNetwork,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}
