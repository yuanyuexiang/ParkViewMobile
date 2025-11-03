import { View, StyleSheet, ScrollView, TouchableOpacity, Text, RefreshControl, Alert, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMyParkingSpots, useBurnParkingSpot } from '@/mobile/hooks/useParkingContractViem';
import { useWallet } from '@/mobile/contexts/WalletContext';
import { formatEther } from 'viem';
import { useState } from 'react';

/**
 * 我的车位页面
 * 显示用户创建的车位并提供管理功能
 */
export default function MyParkingScreen() {
  const router = useRouter();
  const { isConnected } = useWallet();
  const { parkingSpots, isLoading, refetch } = useMyParkingSpots();
  const { burnParkingSpot, isPending: isDeleting } = useBurnParkingSpot();
  const [deletingSpotId, setDeletingSpotId] = useState<string | null>(null);

  const handleRefresh = () => {
    refetch();
  };

  const handleCreateParking = () => {
    if (!isConnected) {
      Alert.alert('提示', '请先连接钱包');
      return;
    }
    router.push({ pathname: '/add-parking' } as any);
  };

  // 编辑车位
  const handleEditParking = (spot: any) => {
    const latitude = Number(spot.latitude) / 1000000;
    const longitude = Number(spot.longitude) / 1000000;

    router.push({
      pathname: '/edit-parking',
      params: {
        id: spot.id.toString(),
        name: spot.name,
        location: spot.location,
        rentPrice: formatEther(spot.rent_price),
        picture: spot.picture,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
      }
    } as any);
  };

  // 删除车位
  const handleDeleteParking = (spot: any) => {
    // 检查是否正在被租用
    if (spot.renter !== '0x0000000000000000000000000000000000000000') {
      Alert.alert(
        '无法删除',
        '该车位正在被租用中，无法删除。\n\n请等待租期结束后再删除。',
        [{ text: '知道了' }]
      );
      return;
    }

    // 确认删除
    Alert.alert(
      '确认删除',
      `确定要删除车位 "${spot.name}" 吗？\n\n此操作不可撤销！`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingSpotId(spot.id.toString());
              console.log('🔥 开始删除车位:', spot.id.toString());
              
              await burnParkingSpot(spot.id.toString());
              
              console.log('✅ 车位删除成功');
              Alert.alert('删除成功', '车位已成功删除');
              
              // 刷新列表
              setTimeout(() => {
                refetch();
                setDeletingSpotId(null);
              }, 1000);
            } catch (error: any) {
              console.error('❌ 删除车位失败:', error);
              Alert.alert('删除失败', error.message || '删除车位失败，请重试');
              setDeletingSpotId(null);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.content}>
          <Text style={styles.title}>我的车位</Text>
          
          {!isConnected ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>🔌 请先连接钱包</Text>
              <Text style={styles.emptySubtext}>
                前往个人中心连接您的钱包
              </Text>
            </View>
          ) : parkingSpots.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>🏠 暂无车位</Text>
              <Text style={styles.emptySubtext}>
                点击右下角的 + 按钮创建您的第一个车位
              </Text>
            </View>
          ) : (
            <>
              {parkingSpots.map((spot) => {
                // 处理图片 URL
                let pictureUrl = spot.picture;
                if (pictureUrl === '/tcw.jpg' || !pictureUrl || pictureUrl.startsWith('/')) {
                  pictureUrl = 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=280&h=160&fit=crop';
                }
                
                const isBeingDeleted = deletingSpotId === spot.id.toString();
                
                return (
                  <View key={spot.id.toString()} style={styles.parkingCard}>
                    {/* 车位图片 */}
                    <Image 
                      source={{ uri: pictureUrl }} 
                      style={styles.parkingImage}
                      resizeMode="cover"
                    />
                  
                    <View style={styles.parkingInfo}>
                      <Text style={styles.parkingName}>{spot.name}</Text>
                      <Text style={styles.parkingLocation}>📍 {spot.location}</Text>
                      <Text style={styles.parkingPrice}>
                        💰 {formatEther(spot.rent_price)} MNT/天
                      </Text>
                      {spot.renter !== '0x0000000000000000000000000000000000000000' && (
                        <Text style={styles.rentStatus}>🔒 已租出</Text>
                      )}

                      {/* 操作按钮 */}
                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.editButton]}
                          onPress={() => handleEditParking(spot)}
                          disabled={isBeingDeleted}
                        >
                          <MaterialCommunityIcons name="pencil" size={18} color="#fff" />
                          <Text style={styles.actionButtonText}>编辑</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.actionButton,
                            styles.deleteButton,
                            isBeingDeleted && styles.actionButtonDisabled
                          ]}
                          onPress={() => handleDeleteParking(spot)}
                          disabled={isBeingDeleted}
                        >
                          {isBeingDeleted ? (
                            <>
                              <Text style={styles.actionButtonText}>删除中...</Text>
                            </>
                          ) : (
                            <>
                              <MaterialCommunityIcons name="delete" size={18} color="#fff" />
                              <Text style={styles.actionButtonText}>删除</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </>
          )}
          
          <Text style={styles.note}>
            �💡 此页面显示您创建的所有车位及收益信息
          </Text>
        </View>
      </ScrollView>

      <TouchableOpacity 
        style={styles.fab}
        onPress={handleCreateParking}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 80, // 为 FAB 留出空间
  },
  title: {
    fontSize: 20,
    marginBottom: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 16,
    color: '#000',
  },
  emptySubtext: {
    textAlign: 'center',
    color: '#666',
  },
  note: {
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 12,
  },
  parkingCard: {
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
  parkingImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  placeholderImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  parkingInfo: {
    padding: 16,
  },
  parkingName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  parkingLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  parkingPrice: {
    fontSize: 16,
    color: '#1890ff',
    fontWeight: '600',
    marginBottom: 4,
  },
  rentStatus: {
    fontSize: 12,
    color: '#52c41a',
    marginTop: 8,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  editButton: {
    backgroundColor: '#ff9800',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  actionButtonDisabled: {
    backgroundColor: '#ccc',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1890ff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
