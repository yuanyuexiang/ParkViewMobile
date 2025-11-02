import { View, StyleSheet, ScrollView, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useWallet } from '@/mobile/contexts/WalletContext';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

/**
 * 个人中心页面
 * 显示用户信息、钱包连接状态和设置选项
 */
export default function ProfileScreen() {
  const {
    address,
    balance,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    useDemoMode,
    chainId,
    switchChain,
    walletName,
    isDemoMode,
  } = useWallet();
  const router = useRouter();
  const [language, setLanguage] = useState('zh-CN');

  const hasSession = !!address;
  const formattedAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
  const formattedBalance = balance ? parseFloat(balance).toFixed(4) : null;

  // 获取链名称
  const getChainName = (id: number) => {
    switch (id) {
      case 5003: return 'Mantle Sepolia';
      case 11155111: return 'Ethereum Sepolia';
      case 1: return 'Ethereum Mainnet';
      default: return `Chain ${id}`;
    }
  };

  useEffect(() => {
    // 加载语言设置
    AsyncStorage.getItem('language').then(lang => {
      if (lang) setLanguage(lang);
    });
  }, []);

  const MenuItem = ({ icon, title, onPress, showChevron = true }: { 
    icon: string, 
    title: string, 
    onPress: () => void,
    showChevron?: boolean 
  }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuLeft}>
        <MaterialCommunityIcons name={icon as any} size={24} color="#666" />
        <Text style={styles.menuTitle}>{title}</Text>
      </View>
      {showChevron && <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />}
    </TouchableOpacity>
  );

  const handleLanguageSettings = () => {
    Alert.alert(
      '语言设置',
      '选择应用语言',
      [
        {
          text: '中文',
          onPress: () => {
            setLanguage('zh-CN');
            AsyncStorage.setItem('language', 'zh-CN');
            Alert.alert('成功', '语言已切换为中文');
          }
        },
        {
          text: 'English',
          onPress: () => {
            setLanguage('en-US');
            AsyncStorage.setItem('language', 'en-US');
            Alert.alert('Success', 'Language changed to English');
          }
        },
        {
          text: '取消',
          style: 'cancel'
        }
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      '关于我们',
      'ParkView - 去中心化停车位租赁平台\n\n' +
      '版本: 1.0.0\n' +
      '网络: Mantle Sepolia Testnet\n' +
      '合约: 0x32cE...7a64b55\n\n' +
      '基于区块链技术的 P2P 停车位共享平台,让车位资源更高效利用。\n\n' +
      '技术栈:\n' +
      '• React Native + Expo\n' +
      '• Viem (Web3 库)\n' +
      '• WalletConnect v2\n' +
      '• Mantle Network',
      [{ text: '确定' }]
    );
  };

  const handlePrivacy = () => {
    Alert.alert(
      '隐私政策',
      '我们重视您的隐私\n\n' +
      '数据收集:\n' +
      '• 钱包地址(仅用于区块链交互)\n' +
      '• 交易记录(存储在区块链上)\n' +
      '• GPS位置(仅用于车位定位)\n\n' +
      '数据使用:\n' +
      '• 不会收集个人身份信息\n' +
      '• 不会将数据分享给第三方\n' +
      '• 所有交易数据公开透明\n\n' +
      '安全保障:\n' +
      '• 私钥由您的钱包管理\n' +
      '• 使用加密连接(WalletConnect)\n' +
      '• 智能合约已开源审计',
      [{ text: '我已了解' }]
    );
  };

  const handleContact = () => {
    Alert.alert(
      '联系我们',
      '如有问题或建议,欢迎联系我们:\n\n' +
      '📧 Email: support@parkview.app\n' +
      '🐦 Twitter: @ParkViewApp\n' +
      '💬 Discord: discord.gg/parkview\n' +
      '📱 Telegram: @parkview_support\n\n' +
      '工作时间: 周一至周五 9:00-18:00 (UTC+8)',
      [
        {
          text: '发送邮件',
          onPress: () => {
            // TODO: 打开邮件应用
            Alert.alert('提示', '请使用邮件应用发送至:\nsupport@parkview.app');
          }
        },
        {
          text: '关闭',
          style: 'cancel'
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* 钱包连接区域 */}
        <View style={styles.walletCard}>
          <Text style={styles.sectionTitle}>钱包状态</Text>
          
          {hasSession ? (
            <>
              <View style={[styles.statusBadge, isDemoMode ? styles.demoBadge : styles.connectedBadge]}>
                <Text style={[styles.statusBadgeText, isDemoMode && styles.demoBadgeText]}>
                  {isDemoMode ? '演示模式 · 只读' : '已连接'}
                </Text>
              </View>
              <View style={styles.walletInfo}>
                <MaterialCommunityIcons name="wallet" size={48} color="#1890ff" />
                {walletName && <Text style={styles.walletName}>{walletName}</Text>}
                <Text style={styles.addressText}>{formattedAddress}</Text>
                {formattedBalance && (
                  <Text style={styles.balanceText}>
                    {formattedBalance} MNT{isDemoMode ? ' (演示)' : ''}
                  </Text>
                )}
                <Text style={styles.chainText}>
                  🔗 {getChainName(chainId)}{isDemoMode ? ' · 演示网络' : ''}
                </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.disconnectButton} 
                activeOpacity={0.8}
                onPress={disconnect}
              >
                <Text style={styles.disconnectButtonText}>
                  {isDemoMode ? '退出演示模式' : '断开连接'}
                </Text>
              </TouchableOpacity>

              {isDemoMode && (
                <TouchableOpacity
                  style={[styles.connectButton, styles.secondaryButton]}
                  activeOpacity={0.8}
                  onPress={connect}
                >
                  <Text style={[styles.buttonText, styles.secondaryButtonText]}>连接真实钱包</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <Text style={styles.disconnected}>
                {isConnecting ? '🔄 正在连接...' : '🔌 未连接钱包'}
              </Text>
              
              <TouchableOpacity 
                style={styles.connectButton} 
                activeOpacity={0.8}
                onPress={connect}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>连接钱包</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.demoButton}
                activeOpacity={0.8}
                onPress={useDemoMode}
              >
                <Text style={styles.demoButtonText}>体验演示模式</Text>
                <Text style={styles.demoButtonSubtext}>无需钱包即可预览功能</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* 功能列表 */}
        <View style={styles.menuCard}>
          <Text style={styles.sectionTitle}>设置与帮助</Text>
          
          {isConnected && (
            <>
              <MenuItem 
                icon="swap-horizontal"
                title={`切换网络 (当前: ${getChainName(chainId)})`}
                onPress={() => {
                  Alert.alert(
                    '切换网络',
                    '选择要切换的网络',
                    [
                      {
                        text: 'Mantle Sepolia',
                        onPress: () => switchChain(5003)
                      },
                      {
                        text: 'Ethereum Sepolia',
                        onPress: () => switchChain(11155111)
                      },
                      {
                        text: '取消',
                        style: 'cancel'
                      }
                    ]
                  );
                }}
              />
              <View style={styles.divider} />
            </>
          )}
          
          <MenuItem 
            icon="translate"
            title={`语言设置 (${language === 'zh-CN' ? '中文' : 'English'})`}
            onPress={handleLanguageSettings}
          />
          <View style={styles.divider} />
          
          <MenuItem 
            icon="information"
            title="关于我们"
            onPress={handleAbout}
          />
          <View style={styles.divider} />
          
          <MenuItem 
            icon="shield-account"
            title="隐私政策"
            onPress={handlePrivacy}
          />
          <View style={styles.divider} />
          
          <MenuItem 
            icon="email"
            title="联系我们"
            onPress={handleContact}
          />
        </View>

        <Text style={styles.version}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  walletCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  walletInfo: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 12,
  },
  connectedBadge: {
    backgroundColor: '#e6f7ff',
  },
  demoBadge: {
    backgroundColor: '#fff7e6',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1890ff',
  },
  demoBadgeText: {
    color: '#fa8c16',
  },
  addressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginTop: 12,
  },
  walletName: {
    fontSize: 14,
    color: '#1890ff',
    marginTop: 12,
    fontWeight: '600',
  },
  balanceText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  chainText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  disconnected: {
    color: '#666',
    textAlign: 'center',
    marginVertical: 8,
  },
  connectButton: {
    backgroundColor: '#1890ff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginTop: 8,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#1890ff',
  },
  secondaryButtonText: {
    color: '#1890ff',
  },
  disconnectButton: {
    backgroundColor: '#ff4d4f',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginTop: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  demoButton: {
    backgroundColor: '#fff7e6',
    borderColor: '#faad14',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginTop: 12,
    alignItems: 'center',
  },
  demoButtonText: {
    color: '#d48806',
    fontSize: 14,
    fontWeight: '600',
  },
  demoButtonSubtext: {
    color: '#d48806',
    fontSize: 12,
    marginTop: 4,
  },
  disconnectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuTitle: {
    marginLeft: 12,
    fontSize: 16,
    color: '#000',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  version: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 20,
  },
});
