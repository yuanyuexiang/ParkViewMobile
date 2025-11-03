import { View, StyleSheet, ScrollView, Text, TouchableOpacity, ActivityIndicator, Alert, Image, RefreshControl } from 'react-native';
import { useWallet } from '@/mobile/contexts/WalletContext';
import { useAllParkingSpots, useTerminateRental } from '@/mobile/hooks/useParkingContractViem';
import { formatEther } from 'viem';
import { useEffect, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * 我的租赁页面 - 优化版
 * 显示用户当前租用的车位列表，支持倒计时和退租
 */
export default function MyRentalsScreen() {
  const { address, isConnected } = useWallet();
  const { parkingSpots, isLoading, error, refetch } = useAllParkingSpots();
  const { terminateRental, isPending: isTerminating } = useTerminateRental();
  const [myRentals, setMyRentals] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // 下拉刷新
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

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

  // 计算剩余时间（详细）
  const getRemainingTime = (endTime: bigint) => {
    const now = Math.floor(Date.now() / 1000);
    const end = Number(endTime);
    const remainingSeconds = end - now;
    
    if (remainingSeconds <= 0) {
      return { days: 0, hours: 0, minutes: 0, expired: true };
    }
    
    const days = Math.floor(remainingSeconds / (24 * 60 * 60));
    const hours = Math.floor((remainingSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((remainingSeconds % (60 * 60)) / 60);
    
    return { days, hours, minutes, expired: false };
  };

  // 获取租用状态
  const getRentalStatus = (endTime: bigint) => {
    const { days, expired } = getRemainingTime(endTime);
    
    if (expired) return { text: '已到期', color: '#f5222d', icon: 'alert-circle' };
    if (days <= 1) return { text: '即将到期', color: '#ff9800', icon: 'clock-alert' };
    return { text: '租用中', color: '#52c41a', icon: 'check-circle' };
  };

  // 处理退租
  const handleTerminateRental = async (spotId: bigint, spotName: string) => {
    Alert.alert(
      '确认退租',
      `确定要退租 "${spotName}" 吗?\n\n注意: 退租后不会退还已支付的租金`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定退租',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🚀 开始退租车位:', spotId);
              await terminateRental(spotId);
              console.log('✅ 退租成功');
              await refetch(); // 刷新列表
            } catch (error: any) {
              console.error('❌ 退租失败:', error);
              Alert.alert('退租失败', error.message || '无法完成退租，请重试');
            }
          },
        },
      ]
    );
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
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
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
              const remainingTime = getRemainingTime(spot.rent_end_time);
              const status = getRentalStatus(spot.rent_end_time);
              const rentPrice = formatEther(spot.rent_price);
              const lat = (Number(spot.latitude) / 1000000).toFixed(6);
              const lng = (Number(spot.longitude) / 1000000).toFixed(6);
              
              // 处理图片 URL
              let pictureUrl = spot.picture;
              if (pictureUrl === '/tcw.jpg' || !pictureUrl || pictureUrl.startsWith('/')) {
                pictureUrl = 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=280&h=160&fit=crop';
              }

              return (
                <View key={spot.id.toString()} style={styles.rentalCard}>
                  {/* 车位图片 */}
                  <Image 
                    source={{ uri: pictureUrl }} 
                    style={styles.rentalImage}
                    resizeMode="cover"
                  />
                  
                  {/* 状态标签 */}
                  <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
                    <MaterialCommunityIcons name={status.icon as any} size={14} color="#fff" />
                    <Text style={styles.statusText}>{status.text}</Text>
                  </View>
                  
                  <View style={styles.cardContent}>
                    <Text style={styles.spotName}>{spot.name}</Text>

                    <View style={styles.infoRow}>
                      <MaterialCommunityIcons name="map-marker" size={16} color="#666" />
                      <Text style={styles.infoText}>{spot.location}</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <MaterialCommunityIcons name="cash" size={16} color="#666" />
                      <Text style={styles.infoText}>{rentPrice} MNT/天</Text>
                    </View>

                    {/* 倒计时 */}
                    <View style={styles.countdownCard}>
                      <MaterialCommunityIcons name="timer" size={20} color="#1890ff" />
                      {remainingTime.expired ? (
                        <Text style={styles.countdownExpired}>租期已到期</Text>
                      ) : (
                        <View style={styles.countdownContent}>
                          <Text style={styles.countdownLabel}>剩余时间:</Text>
                          <View style={styles.timeBlocks}>
                            {remainingTime.days > 0 && (
                              <View style={styles.timeBlock}>
                                <Text style={styles.timeValue}>{remainingTime.days}</Text>
                                <Text style={styles.timeUnit}>天</Text>
                              </View>
                            )}
                            <View style={styles.timeBlock}>
                              <Text style={styles.timeValue}>{remainingTime.hours}</Text>
                              <Text style={styles.timeUnit}>时</Text>
                            </View>
                            <View style={styles.timeBlock}>
                              <Text style={styles.timeValue}>{remainingTime.minutes}</Text>
                              <Text style={styles.timeUnit}>分</Text>
                            </View>
                          </View>
                        </View>
                      )}
                    </View>

                    {/* 租期信息 */}
                    <View style={styles.infoRow}>
                      <MaterialCommunityIcons name="calendar-clock" size={16} color="#666" />
                      <Text style={styles.infoText}>
                        到期时间: {formatTime(spot.rent_end_time)}
                      </Text>
                    </View>

                    {/* 退租按钮 */}
                    <TouchableOpacity
                      style={[
                        styles.terminateButton,
                        isTerminating && styles.terminateButtonDisabled,
                      ]}
                      onPress={() => handleTerminateRental(spot.id, spot.name)}
                      disabled={isTerminating}
                    >
                      {isTerminating ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <MaterialCommunityIcons name="close-circle" size={18} color="#fff" />
                          <Text style={styles.terminateButtonText}>退租</Text>
                        </>
                      )}
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
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
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
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardContent: {
    padding: 16,
  },
  spotName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
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
  countdownCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
  },
  countdownExpired: {
    fontSize: 14,
    color: '#f5222d',
    fontWeight: '600',
  },
  countdownContent: {
    flex: 1,
  },
  countdownLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  timeBlocks: {
    flexDirection: 'row',
    gap: 12,
  },
  timeBlock: {
    alignItems: 'center',
  },
  timeValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1890ff',
  },
  timeUnit: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  terminateButton: {
    backgroundColor: '#ff4d4f',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  terminateButtonDisabled: {
    backgroundColor: '#ccc',
  },
  terminateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  note: {
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
    fontSize: 12,
  },
});
