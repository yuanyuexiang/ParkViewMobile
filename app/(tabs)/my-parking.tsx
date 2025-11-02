import { View, StyleSheet, ScrollView, TouchableOpacity, Text, RefreshControl, Alert, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMyParkingSpots } from '@/mobile/hooks/useParkingContractViem';
import { useWallet } from '@/mobile/contexts/WalletContext';
import { formatEther } from 'viem';

/**
 * 我的车位页面
 * 显示用户创建的车位并提供管理功能
 */
export default function MyParkingScreen() {
  const router = useRouter();
  const { isConnected } = useWallet();
  const { parkingSpots, isLoading, refetch } = useMyParkingSpots();

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
              {parkingSpots.map((spot) => (
                <View key={spot.id.toString()} style={styles.parkingCard}>
                  {/* 车位图片 */}
                  {spot.picture ? (
                    <Image 
                      source={{ uri: spot.picture }} 
                      style={styles.parkingImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.placeholderImage}>
                      <MaterialCommunityIcons name="parking" size={48} color="#ccc" />
                    </View>
                  )}
                  
                  <View style={styles.parkingInfo}>
                    <Text style={styles.parkingName}>{spot.name}</Text>
                    <Text style={styles.parkingLocation}>📍 {spot.location}</Text>
                    <Text style={styles.parkingPrice}>
                      💰 {formatEther(spot.rent_price)} MNT/天
                    </Text>
                    {spot.renter !== '0x0000000000000000000000000000000000000000' && (
                      <Text style={styles.rentStatus}>🔒 已租出</Text>
                    )}
                  </View>
                </View>
              ))}
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
