import { View, StyleSheet, ScrollView, Text, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { useWallet } from '@/mobile/contexts/WalletContext';
import { useAllParkingSpots } from '@/mobile/hooks/useParkingContractViem';
import { formatEther } from 'viem';
import { useEffect, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * 我的租赁页面
 * 显示用户当前租用的车位列表
 */
export default function MyRentalsScreen() {
  const { address, isConnected } = useWallet();
  const { parkingSpots, isLoading, error, refetch } = useAllParkingSpots();
  const [myRentals, setMyRentals] = useState<any[]>([]);

  // 筛选出用户租用的车位
  useEffect(() => {
    if (address && parkingSpots.length > 0) {
      const rentals = parkingSpots.filter(spot => 
        spot.renter.toLowerCase() === address.toLowerCase() &&
        spot.renter !== '0x0000000000000000000000000000000000000000'
      );
      setMyRentals(rentals);
      console.log('我的租赁车位:', rentals.length);
    } else {
      setMyRentals([]);
    }
  }, [address, parkingSpots]);

  // 格式化时间
  const formatTime = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString('zh-CN');
  };

  // 计算剩余天数
  const getRemainingDays = (endTime: bigint) => {
    const now = Math.floor(Date.now() / 1000);
    const end = Number(endTime);
    const remainingSeconds = end - now;
    const days = Math.floor(remainingSeconds / (24 * 60 * 60));
    return days > 0 ? days : 0;
  };

  if (!isConnected) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="wallet-outline" size={48} color="#999" />
            <Text style={styles.emptyText}>请先连接钱包</Text>
            <Text style={styles.emptySubtext}>
              前往个人中心连接钱包后,即可查看您的租赁记录
            </Text>
          </View>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1890ff" />
        <Text style={styles.loadingText}>正在从链上加载租赁数据...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>❌ 加载失败</Text>
            <Text style={styles.errorSubtext}>{error.message}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={refetch}>
              <Text style={styles.buttonText}>重试</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>我的租赁</Text>
          <TouchableOpacity onPress={refetch}>
            <MaterialCommunityIcons name="refresh" size={24} color="#1890ff" />
          </TouchableOpacity>
        </View>

        {myRentals.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="car-off" size={48} color="#999" />
            <Text style={styles.emptyText}>暂无租赁记录</Text>
            <Text style={styles.emptySubtext}>去地图上找一个车位租用吧!</Text>
          </View>
        ) : (
          <>
            <Text style={styles.countText}>共 {myRentals.length} 个租赁中的车位</Text>
            
            {myRentals.map((spot) => {
              const remainingDays = getRemainingDays(spot.rent_end_time);
              const rentPrice = formatEther(spot.rent_price);
              const lat = (Number(spot.latitude) / 1000000).toFixed(6);
              const lng = (Number(spot.longitude) / 1000000).toFixed(6);

              return (
                <View key={spot.id.toString()} style={styles.rentalCard}>
                  {/* 车位图片 */}
                  {spot.picture ? (
                    <Image 
                      source={{ uri: spot.picture }} 
                      style={styles.rentalImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.placeholderImage}>
                      <MaterialCommunityIcons name="parking" size={40} color="#ccc" />
                    </View>
                  )}
                  
                  <View style={styles.cardHeader}>
                    <Text style={styles.spotName}>{spot.name}</Text>
                    {remainingDays > 0 ? (
                      <Text style={styles.activeTag}>🟢 租赁中</Text>
                    ) : (
                      <Text style={styles.expiredTag}>🔴 已过期</Text>
                    )}
                  </View>

                  <View style={styles.cardContent}>
                    <View style={styles.infoRow}>
                      <MaterialCommunityIcons name="map-marker" size={16} color="#666" />
                      <Text style={styles.infoText}>{spot.location}</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <MaterialCommunityIcons name="crosshairs-gps" size={16} color="#666" />
                      <Text style={styles.infoText}>{lat}, {lng}</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <MaterialCommunityIcons name="cash" size={16} color="#666" />
                      <Text style={styles.infoText}>{rentPrice} MNT/天</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <MaterialCommunityIcons name="account" size={16} color="#666" />
                      <Text style={styles.infoText}>
                        车主: {spot.owner.slice(0, 6)}...{spot.owner.slice(-4)}
                      </Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.timeInfo}>
                      <View style={styles.timeRow}>
                        <Text style={styles.timeLabel}>到期时间:</Text>
                        <Text style={styles.timeValue}>{formatTime(spot.rent_end_time)}</Text>
                      </View>
                      <View style={styles.timeRow}>
                        <Text style={styles.timeLabel}>剩余天数:</Text>
                        <Text style={[styles.timeValue, remainingDays <= 3 && styles.warningText]}>
                          {remainingDays} 天
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.cardActions}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => {
                        Alert.alert(
                          '车位详情',
                          `ID: ${spot.id}\n位置: ${lat}, ${lng}\n点击地图标签页可在地图上查看此车位`
                        );
                      }}
                    >
                      <MaterialCommunityIcons name="map" size={16} color="#1890ff" />
                      <Text style={styles.actionButtonText}>在地图查看</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.actionButton, styles.terminateButton]}
                      onPress={() => {
                        Alert.alert(
                          '终止租赁',
                          '确定要终止此车位的租赁吗?',
                          [
                            { text: '取消', style: 'cancel' },
                            { 
                              text: '确定', 
                              onPress: () => {
                                console.log('终止租赁:', spot.id);
                                Alert.alert('提示', '终止租赁功能开发中...');
                              }
                            }
                          ]
                        );
                      }}
                    >
                      <MaterialCommunityIcons name="close-circle" size={16} color="#ff4d4f" />
                      <Text style={[styles.actionButtonText, styles.terminateText]}>终止租赁</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        )}

        <Text style={styles.note}>
          💡 数据来自 Mantle Sepolia 链
        </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  countText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  emptySubtext: {
    marginTop: 8,
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
  errorCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff4d4f',
    marginBottom: 8,
  },
  errorSubtext: {
    color: '#666',
    fontSize: 14,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#1890ff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
  },
  rentalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  rentalImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#f0f0f0',
  },
  placeholderImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  spotName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
  },
  activeTag: {
    fontSize: 12,
    color: '#52c41a',
    fontWeight: '600',
  },
  expiredTag: {
    fontSize: 12,
    color: '#ff4d4f',
    fontWeight: '600',
  },
  cardContent: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 12,
  },
  timeInfo: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 4,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
  },
  timeValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  warningText: {
    color: '#ff4d4f',
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#1890ff',
    marginLeft: 4,
  },
  terminateButton: {
    borderLeftWidth: 1,
    borderLeftColor: '#f0f0f0',
  },
  terminateText: {
    color: '#ff4d4f',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  note: {
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
    fontSize: 12,
  },
});
