import React, { createContext, useState, useContext, useCallback, useEffect, useMemo } from 'react';
import { Alert, AppState } from 'react-native';
// @ts-ignore - Web3Modal 1.x types compatibility
import { useWeb3Modal } from '@web3modal/wagmi-react-native';
// @ts-ignore - wagmi 1.x types compatibility
import { useAccount, useBalance, useDisconnect, useSwitchNetwork, useNetwork } from 'wagmi';
import { formatEther } from 'viem';

import { APPKIT_NETWORKS } from '../config/appkit';

const MANTLE_SEPOLIA_CHAIN_ID = 5003;
const DEMO_ADDRESS = '0x1234567890123456789012345678901234567890';

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number;
  balance: string | null;
  walletName: string | null;
  isDemoMode: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchChain: (chainId: number) => Promise<void>;
  useDemoMode: () => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { open } = useWeb3Modal();
  const { address: connectedAddress, isConnected: wagmiConnected, connector } = useAccount();
  const { chain } = useNetwork();
  const activeChainId = chain?.id;
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { switchNetwork: wagmiSwitchNetwork } = useSwitchNetwork();
  const { data: balanceData } = useBalance({
    address: connectedAddress
  });

  const [walletName, setWalletName] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoAddress, setDemoAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const effectiveAddress = isDemoMode ? demoAddress : connectedAddress ?? null;
  const effectiveChainId = useMemo(() => {
    if (isDemoMode) return MANTLE_SEPOLIA_CHAIN_ID;
    if (typeof activeChainId === 'number') return activeChainId;
    if (typeof activeChainId === 'string') return Number(activeChainId);
    return MANTLE_SEPOLIA_CHAIN_ID;
  }, [activeChainId, isDemoMode]);

  const balance = balanceData ? formatEther(balanceData.value) : null;
  const isConnected = !!effectiveAddress && !isDemoMode && wagmiConnected;

  // 更新 connector 名称
  useEffect(() => {
    if (isDemoMode) {
      setWalletName('演示钱包');
      setDemoAddress(prev => prev ?? DEMO_ADDRESS);
      return;
    }

    if (connector?.name) {
      setWalletName(connector.name);
    } else {
      setWalletName(null);
    }
  }, [connector, isDemoMode]);

  const connect = useCallback(async () => {
    setIsDemoMode(false);
    setDemoAddress(null);
    setWalletName(null);
    setIsConnecting(true);
    try {
      await open();
    } catch (error) {
      console.error('❌ Web3Modal connect error:', error);
      Alert.alert('连接失败', '无法打开钱包连接界面,请重试');
    } finally {
      setIsConnecting(false);
    }
  }, [open]);

  const useDemoMode = useCallback(() => {
    setIsDemoMode(true);
    setDemoAddress(DEMO_ADDRESS);
  }, []);

  const disconnect = useCallback(async () => {
    setIsDemoMode(false);
    setDemoAddress(null);
    setWalletName(null);
    try {
      wagmiDisconnect();
    } catch (error) {
      console.error('❌ Wagmi disconnect error:', error);
    }
  }, [wagmiDisconnect]);

  const switchChain = useCallback(
    async (targetChainId: number) => {
      if (isDemoMode) {
        Alert.alert('演示模式', '演示模式无法切换网络,请连接真实钱包');
        return;
      }

      const target = APPKIT_NETWORKS.find(network => Number(network.id) === targetChainId);
      if (!target) {
        Alert.alert('提示', '暂不支持该网络');
        return;
      }

      try {
        wagmiSwitchNetwork?.(targetChainId);
      } catch (error: any) {
        console.error('❌ 切换网络失败:', error);
        const message = error?.message ?? '切换网络失败,请在钱包中手动选择 Mantle Sepolia';
        Alert.alert('切换失败', message);
      }
    },
    [isDemoMode, wagmiSwitchNetwork]
  );

  return (
    <WalletContext.Provider
      value={{
        address: effectiveAddress,
        isConnected,
        isConnecting,
        chainId: effectiveChainId,
        balance,
        walletName,
        isDemoMode,
        connect,
        disconnect,
        switchChain,
        useDemoMode
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within WalletProvider');
  return context;
}
