import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useWallet } from '@/mobile/contexts/WalletContext';
import { useRentParkingSpot } from '@/mobile/hooks/useParkingContractViem';
import { formatEther, parseEther } from 'viem';

// 预设租用时长选项
const DURATION_OPTIONS = [
  { label: '1天', days: 1, popular: false },
  { label: '3天', days: 3, popular: true },
  { label: '7天', days: 7, popular: true },
  { label: '15天', days: 15, popular: false },
  { label: '30天', days: 30, popular: true },
];

export default function RentParkingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isConnected, address } = useWallet();
  const { rentParkingSpot, isPending } = useRentParkingSpot();

  // 从路由参数获取车位信息
  const spotId = params.id as string;
  const spotName = params.name as string;
  const spotLocation = params.location as string;
  const spotPicture = params.picture as string;
  const spotRentPrice = params.rentPrice as string; // MNT
  const spotLatitude = params.latitude as string;
  const spotLongitude = params.longitude as string;
  const spotOwner = params.owner as string;

  const [selectedDuration, setSelectedDuration] = useState(3); // 默认3天
  const [totalCost, setTotalCost] = useState('0');

  // 计算总费用
  useEffect(() => {
    if (spotRentPrice) {
      const cost = parseFloat(spotRentPrice) * selectedDuration;
      setTotalCost(cost.toFixed(4));
    }
  }, [selectedDuration, spotRentPrice]);

  // 处理租用
  const handleRent = async () => {
    if (!isConnected) {
      Alert.alert('提示', '请先连接钱包');
      return;
    }

    if (address?.toLowerCase() === spotOwner?.toLowerCase()) {
      Alert.alert('提示', '您不能租用自己的车位');
      return;
    }

    Alert.alert(
      '确认租用',
      `车位: ${spotName}\n租期: ${selectedDuration} 天\n总费用: ${totalCost} MNT\n\n确定要租用吗?`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定租用',
          onPress: async () => {
            try {
              console.log('🚀 开始租用车位...');
              console.log('车位 ID:', spotId);
              console.log('租用天数:', selectedDuration);
              console.log('支付金额:', totalCost, 'MNT');

              // 计算租用结束时间 (当前时间 + 租用天数)
              const currentTime = Math.floor(Date.now() / 1000); // 当前时间戳(秒)
              const durationSeconds = BigInt(selectedDuration * 24 * 60 * 60); // 天数转秒
              const endTime = BigInt(currentTime) + durationSeconds;

              const hash = await rentParkingSpot(
                BigInt(spotId),
                endTime
              );

              console.log('✅ 租用成功! Hash:', hash);

              // 跳转到我的租赁页面
              router.replace('/(tabs)/my-rentals' as any);
            } catch (error: any) {
              console.error('❌ 租用失败:', error);
              Alert.alert('租用失败', error.message || '无法完成租用，请重试');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>租用车位</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* 车位信息卡片 */}
      <View style={styles.spotCard}>
        {spotPicture && (
          <Image
            source={{ uri: spotPicture }}
            style={styles.spotImage}
            resizeMode="cover"
          />
        )}
        
        <View style={styles.spotInfo}>
          <Text style={styles.spotName}>{spotName}</Text>
          
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="map-marker" size={18} color="#666" />
            <Text style={styles.spotLocation}>{spotLocation}</Text>
          </View>

          {spotLatitude && spotLongitude && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="crosshairs-gps" size={18} color="#666" />
              <Text style={styles.coordsText}>
                {Number(spotLatitude).toFixed(6)}, {Number(spotLongitude).toFixed(6)}
              </Text>
            </View>
          )}

          <View style={styles.priceCard}>
            <MaterialCommunityIcons name="cash" size={24} color="#2196F3" />
            <View style={styles.priceInfo}>
              <Text style={styles.priceLabel}>每天租金</Text>
              <Text style={styles.priceValue}>{spotRentPrice} MNT</Text>
              <Text style={styles.priceSubtext}>
                ≈ ¥{(parseFloat(spotRentPrice || '0') * 6.5).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 选择租期 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>选择租期</Text>
        
        <View style={styles.durationGrid}>
          {DURATION_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.days}
              style={[
                styles.durationOption,
                selectedDuration === option.days && styles.durationOptionSelected,
              ]}
              onPress={() => setSelectedDuration(option.days)}
            >
              {option.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>热门</Text>
                </View>
              )}
              <Text
                style={[
                  styles.durationLabel,
                  selectedDuration === option.days && styles.durationLabelSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 费用明细 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>费用明细</Text>
        
        <View style={styles.costCard}>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>单价</Text>
            <Text style={styles.costValue}>{spotRentPrice} MNT/天</Text>
          </View>
          
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>租期</Text>
            <Text style={styles.costValue}>{selectedDuration} 天</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.costRow}>
            <Text style={styles.totalLabel}>总费用</Text>
            <View style={styles.totalValue}>
              <Text style={styles.totalAmount}>{totalCost} MNT</Text>
              <Text style={styles.totalSubtext}>
                ≈ ¥{(parseFloat(totalCost) * 6.5).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 租用说明 */}
      <View style={styles.section}>
        <View style={styles.tipBox}>
          <MaterialCommunityIcons name="information" size={20} color="#1890ff" />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>租用说明</Text>
            <Text style={styles.tipText}>• 租金将直接支付给车位拥有者</Text>
            <Text style={styles.tipText}>• 租期到期后自动解除租用关系</Text>
            <Text style={styles.tipText}>• 可以提前退租，但不退还租金</Text>
            <Text style={styles.tipText}>• 需要支付少量 Gas 费用</Text>
          </View>
        </View>
      </View>

      {/* 租用按钮 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.rentButton,
            (!isConnected || isPending) && styles.rentButtonDisabled,
          ]}
          onPress={handleRent}
          disabled={!isConnected || isPending}
        >
          {isPending ? (
            <>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.rentButtonText}>租用中...</Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons name="check-circle" size={24} color="#fff" />
              <Text style={styles.rentButtonText}>
                {isConnected ? `确认租用 ${totalCost} MNT` : '请先连接钱包'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={isPending}
        >
          <Text style={styles.cancelButtonText}>取消</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  spotCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  spotImage: {
    width: '100%',
    height: 200,
  },
  spotInfo: {
    padding: 16,
  },
  spotName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  spotLocation: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  coordsText: {
    fontSize: 12,
    color: '#999',
  },
  priceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  priceInfo: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
    marginVertical: 2,
  },
  priceSubtext: {
    fontSize: 12,
    color: '#999',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  durationOption: {
    flex: 0,
    minWidth: '30%',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  durationOptionSelected: {
    borderColor: '#2196F3',
    backgroundColor: '#e3f2fd',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ff9800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  popularText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  durationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  durationLabelSelected: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  costCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  costLabel: {
    fontSize: 14,
    color: '#666',
  },
  costValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    alignItems: 'flex-end',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  totalSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  tipBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#1890ff',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1890ff',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  rentButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  rentButtonDisabled: {
    backgroundColor: '#ccc',
  },
  rentButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});
