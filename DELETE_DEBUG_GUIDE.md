# 🔍 删除车位功能调试指南

## 问题描述
删除车位操作没有触发钱包授权弹窗

## 预期行为
1. 用户点击"删除"按钮
2. 显示确认对话框
3. 用户确认删除
4. **应该拉起 MetaMask 钱包请求授权交易**
5. 用户在钱包中确认交易
6. 交易发送到区块链
7. 等待交易确认
8. 显示删除成功

## 代码流程分析

### 1. 删除按钮点击 (`my-parking.tsx`)
```typescript
// 用户点击删除按钮
handleDeleteParking(spot)
  ↓
// 检查是否被租用
if (spot.renter !== '0x0000...') return;
  ↓
// 显示确认对话框
Alert.alert('确认删除', ...)
  ↓
// 用户点击"删除"
await burnParkingSpot(spot.id.toString())
```

### 2. Hook 执行 (`useBurnParkingSpot`)
```typescript
burnParkingSpot(spotId)
  ↓
// 检查钱包连接状态
if (!address) throw Error
if (!signClient || !session) throw Error
  ↓
// 编码交易数据
encodeFunctionData({
  abi: ParkingLotABI,
  functionName: 'burnParkingSpot',
  args: [BigInt(spotId)]
})
  ↓
// 发送交易
sendTransaction(signClient, session, chainId, address, CONTRACT_ADDRESS, data)
```

### 3. 发送交易 (`sendTransaction`)
```typescript
sendTransaction(...)
  ↓
// 🔑 关键步骤：通过 WalletConnect 调用钱包
await signClient.request({
  topic: session.topic,
  chainId: `eip155:${chainId}`,
  request: {
    method: 'eth_sendTransaction',  // ⭐ 这应该触发钱包授权
    params: [tx]
  }
})
  ↓
// 等待交易确认
publicClient.waitForTransactionReceipt({ hash })
```

## 可能的问题原因

### ❌ 问题 1: WalletConnect 未正确连接
**检查方式**:
```typescript
console.log('WalletConnect 状态:', {
  hasSignClient: !!signClient,
  hasSession: !!session,
  sessionTopic: session?.topic,
  address,
  chainId,
});
```

**解决方案**:
- 确保钱包已连接
- 检查 WalletConnect session 是否有效
- 尝试断开并重新连接钱包

### ❌ 问题 2: Session 过期
**现象**: signClient 存在但 session 无效

**解决方案**:
```typescript
// 在 WalletContext 中添加 session 有效性检查
if (session && !session.expiry || session.expiry < Date.now()) {
  // Session 已过期，需要重新连接
  await disconnect();
  await connect();
}
```

### ❌ 问题 3: 错误被提前捕获
**检查方式**:
查看控制台是否有 "WalletConnect 未连接" 错误

**解决方案**:
在删除前检查连接状态：
```typescript
if (!isConnected || !signClient || !session) {
  Alert.alert('错误', '钱包连接已断开，请重新连接');
  return;
}
```

### ❌ 问题 4: ChainId 不匹配
**检查方式**:
```typescript
console.log('链信息:', {
  expectedChainId: 5003,
  currentChainId: chainId,
  sessionChainId: session?.namespaces?.eip155?.chains,
});
```

**解决方案**:
确保 session 中包含正确的链 ID

## 调试步骤

### 第 1 步：检查 Console 日志
运行应用并尝试删除车位，查找以下日志：

```
✅ 应该看到的日志：
🔥 准备销毁车位: { spotId, address, hasSignClient, hasSession, chainId }
📝 已编码交易数据: { to, from, data, functionName }
🚀 开始发送交易到钱包...
📝 准备发送交易请求到钱包...
📱 调用 WalletConnect 请求钱包授权...  ← 这里应该触发钱包弹窗
✅ 交易已发送: 0x...
⏳ 等待交易确认...
✅ 交易已确认!

❌ 如果看到这些错误：
❌ WalletConnect 状态检查失败
❌ WalletConnect 未连接
❌ 发送交易失败
```

### 第 2 步：验证钱包连接状态
在个人中心页面检查：
- [ ] 地址是否显示
- [ ] "已连接" 状态是否正确
- [ ] 链信息是否正确（Mantle Sepolia Testnet）

### 第 3 步：测试其他交易功能
尝试以下操作来对比：
- [ ] 创建车位（mintParkingSpot） - 是否能触发钱包？
- [ ] 租用车位（rentParkingSpot） - 是否能触发钱包？
- [ ] 退租（terminateRental） - 是否能触发钱包？

**如果其他操作也无法触发钱包**:
- 问题在于 WalletConnect 连接
- 需要检查 WalletContext 实现

**如果只有删除无法触发**:
- 问题可能在于 burnParkingSpot 的实现
- 检查合约 ABI 中是否有 burnParkingSpot 函数

### 第 4 步：检查合约 ABI
```typescript
// 查看 app/abi/ParkingLot.json
// 确认是否包含 burnParkingSpot 函数
```

预期格式：
```json
{
  "name": "burnParkingSpot",
  "type": "function",
  "inputs": [
    {
      "name": "tokenId",
      "type": "uint256"
    }
  ],
  "outputs": [],
  "stateMutability": "nonpayable"
}
```

### 第 5 步：使用 Expo 开发工具调试
```bash
# 查看完整日志
npx expo start

# 在控制台输入 j 打开 Debugger
# 在 Sources 中设置断点：
# - mobile/hooks/useParkingContractViem.ts:537 (burnParkingSpot 开始)
# - mobile/hooks/useParkingContractViem.ts:14 (sendTransaction 开始)
```

## 临时解决方案

如果问题持续存在，可以添加手动检查：

```typescript
// 在 my-parking.tsx 的 handleDeleteParking 中添加
const handleDeleteParking = (spot: any) => {
  // ... 现有代码 ...
  
  Alert.alert(
    t('myParkings.deleteConfirm'),
    t('myParkings.deleteMessage', { name: spot.name }),
    [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('myParkings.delete'),
        style: 'destructive',
        onPress: async () => {
          // ⭐ 添加连接状态检查
          if (!isConnected) {
            Alert.alert('错误', '钱包未连接');
            return;
          }
          
          // ⭐ 添加详细日志
          console.log('删除操作前的状态:', {
            spotId: spot.id.toString(),
            isConnected,
            address,
            hasSignClient: !!signClient,
            hasSession: !!session,
          });
          
          try {
            setDeletingSpotId(spot.id.toString());
            console.log('🔥 开始删除车位:', spot.id.toString());
            
            await burnParkingSpot(spot.id.toString());
            
            // ... 其余代码
```

## 增强版错误处理

```typescript
// 在 useBurnParkingSpot 中
const burnParkingSpot = useCallback(async (spotId: string) => {
  // 详细的前置检查
  if (!address) {
    const error = new Error('钱包地址不存在，请先连接钱包');
    Alert.alert('错误', error.message);
    throw error;
  }

  if (!signClient) {
    const error = new Error('WalletConnect SignClient 未初始化');
    Alert.alert('错误', '钱包服务未就绪，请重启应用');
    throw error;
  }

  if (!session) {
    const error = new Error('WalletConnect Session 不存在');
    Alert.alert('错误', '钱包连接已断开，请重新连接');
    throw error;
  }

  // 检查 session 是否过期
  if (session.expiry && session.expiry * 1000 < Date.now()) {
    const error = new Error('WalletConnect Session 已过期');
    Alert.alert('错误', '钱包连接已过期，请重新连接');
    throw error;
  }

  // ... 继续执行删除逻辑
}, [address, signClient, session, chainId]);
```

## 期望的完整日志输出

正常情况下，删除操作应该产生以下完整日志：

```
[用户点击删除按钮]
🔥 开始删除车位: 1

[Hook 开始执行]
🔥 准备销毁车位: {
  spotId: "1",
  address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  hasSignClient: true,
  hasSession: true,
  chainId: 5003
}

[编码交易数据]
📝 已编码交易数据: {
  to: "0x...",
  from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  data: "0x...",
  functionName: "burnParkingSpot"
}

[准备发送交易]
🚀 开始发送交易到钱包...
📝 准备发送交易请求到钱包... {
  from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  to: "0x...",
  chainId: 5003,
  hasData: true,
  value: "0x0",
  sessionTopic: "..."
}

[调用钱包]
📱 调用 WalletConnect 请求钱包授权...
⏳ 钱包应该弹出授权界面...  ← 🔑 关键点

[用户在钱包中确认]
✅ 交易已发送: 0x123abc...
⏳ 等待交易确认...

[交易确认]
✅ 交易已确认! {
  hash: "0x123abc...",
  blockNumber: 12345,
  status: "success"
}

[UI 更新]
✅ 车位销毁成功! TxHash: 0x123abc...
✅ 车位删除成功
[显示成功提示]
```

## 下一步行动

1. **立即执行**: 运行应用并尝试删除车位，复制所有 Console 日志
2. **对比日志**: 将实际日志与期望日志对比，找出在哪一步停止
3. **检查钱包**: 打开 MetaMask 应用，查看是否有待处理的请求
4. **测试其他功能**: 尝试创建车位或租用车位，看是否能触发钱包
5. **报告问题**: 如果问题持续，提供完整的日志输出

## 常见问题

### Q1: 为什么创建/租用可以触发钱包，但删除不行？
A: 检查合约 ABI 中是否包含 `burnParkingSpot` 函数，以及函数签名是否正确。

### Q2: 日志显示"WalletConnect 未连接"，但个人中心显示已连接？
A: 可能是 session 过期或 signClient 状态不同步，尝试断开并重新连接。

### Q3: 看到"📱 调用 WalletConnect 请求钱包授权..."但钱包没反应？
A: 可能是 MetaMask 应用的问题，尝试：
- 完全关闭并重启 MetaMask
- 检查 MetaMask 是否在后台运行
- 切换到 MetaMask 应用查看是否有待处理请求

### Q4: 错误信息："User rejected the request"
A: 用户在钱包中点击了"拒绝"，这是正常行为。

## 技术支持

如果以上步骤都无法解决问题，请提供：
1. 完整的 Console 日志
2. 钱包连接状态截图
3. 是否能成功执行其他交易（创建/租用/退租）
4. MetaMask 版本号
5. 设备型号和系统版本
