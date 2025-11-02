import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useWallet } from '@/mobile/contexts/WalletContext';
import { useMintParkingSpot } from '@/mobile/hooks/useParkingContractViem';

export default function AddParkingScreen() {
  const router = useRouter();
  const { isConnected, address } = useWallet();
  const { mintParkingSpot, isPending, isSuccess } = useMintParkingSpot();

  // 表单状态
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [rentPrice, setRentPrice] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // 选择图片
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  // 获取当前位置
  const getCurrentLocation = async () => {
    try {
      setIsLoadingLocation(true);

      // 请求位置权限
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('权限被拒绝', '需要位置权限才能获取当前位置');
        return;
      }

      // 获取位置
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLatitude(location.coords.latitude);
      setLongitude(location.coords.longitude);

      // 反向地理编码获取地址
      const addresses = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (addresses[0]) {
        const addr = addresses[0];
        const locationText = `${addr.city || ''} ${addr.district || ''} ${addr.street || ''}`.trim();
        setLocation(locationText || '未知位置');
      }

      Alert.alert(
        '位置获取成功',
        `经度: ${location.coords.longitude.toFixed(6)}\n纬度: ${location.coords.latitude.toFixed(6)}`
      );
    } catch (error) {
      console.error('获取位置失败:', error);
      Alert.alert('错误', '获取位置失败,请重试');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    // 验证表单
    if (!isConnected) {
      Alert.alert('提示', '请先连接钱包');
      return;
    }

    if (!name.trim()) {
      Alert.alert('提示', '请输入车位名称');
      return;
    }

    if (!location.trim()) {
      Alert.alert('提示', '请输入或获取位置信息');
      return;
    }

    if (!rentPrice || parseFloat(rentPrice) <= 0) {
      Alert.alert('提示', '请输入有效的租金价格');
      return;
    }

    if (latitude === null || longitude === null) {
      Alert.alert('提示', '请获取GPS坐标');
      return;
    }

    try {
      const hash = await mintParkingSpot(
        name.trim(),
        imageUri || '', // 如果没有图片,使用空字符串
        location.trim(),
        rentPrice,
        longitude,
        latitude
      );

      Alert.alert(
        '成功!',
        `车位已创建 (模拟)\n\n交易哈希:\n${hash?.substring(0, 10)}...${hash?.substring(hash.length - 8)}`,
        [
          {
            text: '查看我的车位',
            onPress: () => router.push('/(tabs)/my-parking' as any),
          },
          {
            text: '继续添加',
            onPress: () => {
              // 重置表单
              setName('');
              setLocation('');
              setRentPrice('');
              setImageUri(null);
              setLatitude(null);
              setLongitude(null);
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('失败', error.message || '创建车位失败');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>添加车位</Text>
        <Text style={styles.subtitle}>
          {isConnected ? `已连接: ${address?.substring(0, 6)}...${address?.substring(address.length - 4)}` : '未连接钱包'}
        </Text>
      </View>

      <View style={styles.form}>
        {/* 车位名称 */}
        <View style={styles.field}>
          <Text style={styles.label}>车位名称 *</Text>
          <TextInput
            style={styles.input}
            placeholder="例如: 北京天安门停车位"
            value={name}
            onChangeText={setName}
            maxLength={50}
          />
        </View>

        {/* 位置 */}
        <View style={styles.field}>
          <Text style={styles.label}>位置 *</Text>
          <TextInput
            style={styles.input}
            placeholder="例如: 北京市东城区"
            value={location}
            onChangeText={setLocation}
            maxLength={100}
          />
          <TouchableOpacity
            style={styles.locationButton}
            onPress={getCurrentLocation}
            disabled={isLoadingLocation}
          >
            {isLoadingLocation ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.locationButtonText}>📍 获取当前位置</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* GPS 坐标显示 */}
        {latitude !== null && longitude !== null && (
          <View style={styles.coordsDisplay}>
            <Text style={styles.coordsText}>
              📍 经度: {longitude.toFixed(6)} | 纬度: {latitude.toFixed(6)}
            </Text>
          </View>
        )}

        {/* 租金 */}
        <View style={styles.field}>
          <Text style={styles.label}>租金 (MNT/天) *</Text>
          <TextInput
            style={styles.input}
            placeholder="例如: 0.01"
            value={rentPrice}
            onChangeText={setRentPrice}
            keyboardType="decimal-pad"
          />
        </View>

        {/* 照片 */}
        <View style={styles.field}>
          <Text style={styles.label}>照片 (可选)</Text>
          <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>📷 点击选择照片</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* 提交按钮 */}
        <TouchableOpacity
          style={[styles.submitButton, (!isConnected || isPending) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!isConnected || isPending}
        >
          {isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isConnected ? '创建车位' : '请先连接钱包'}
            </Text>
          )}
        </TouchableOpacity>

        {/* 取消按钮 */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={isPending}
        >
          <Text style={styles.cancelButtonText}>取消</Text>
        </TouchableOpacity>
      </View>

      {/* 提示信息 */}
      <View style={styles.tipBox}>
        <Text style={styles.tipTitle}>💡 提示</Text>
        <Text style={styles.tipText}>• 所有标记 * 的字段为必填项</Text>
        <Text style={styles.tipText}>• 点击"获取当前位置"可自动填充位置和GPS坐标</Text>
        <Text style={styles.tipText}>• 照片可选,建议上传真实车位照片</Text>
        <Text style={styles.tipText}>• 当前为演示模式,不会消耗真实 Gas</Text>
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
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  form: {
    padding: 16,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  locationButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  locationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  coordsDisplay: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  coordsText: {
    fontSize: 14,
    color: '#1976d2',
  },
  imagePickerButton: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  imagePlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  imagePlaceholderText: {
    fontSize: 16,
    color: '#999',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  submitButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
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
    marginTop: 12,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  tipBox: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 4,
  },
});
