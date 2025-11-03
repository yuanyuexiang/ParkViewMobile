# 真实钱包交易集成 🔐

## 📋 更新概述

已将所有模拟交易更新为通过 WalletConnect 发送的真实链上交易！现在每个操作都需要在 MetaMask 钱包中确认批准。

---

## 🔧 技术实现

### 1. WalletContext 更新

**文件**: `mobile/contexts/WalletContext.tsx`

**更改**:
- ✅ 将 `signClient` 暴露给外部使用
- ✅ 将 `session` 暴露给外部使用

```typescript
// 之前
interface WalletContextType {
  address: string | null;
  chainId: number;
  // ... 其他属性
}

// 现在
interface WalletContextType {
  address: string | null;
  chainId: number;
  signClient: SignClient | null;  // ✨ 新增
  session: SessionTypes.Struct | null;  // ✨ 新增
  // ... 其他属性
}
```

---

### 2. 新增交易发送辅助函数

**文件**: `mobile/hooks/useParkingContractViem.ts`

**功能**: 统一处理所有链上交易的发送和确认

```typescript
async function sendTransaction(
  signClient: any,
  session: any,
  chainId: number,
  from: string,
  to: string,
  data: string,
  value: string = '0x0'
): Promise<string> {
  // 1. 构建交易对象
  const tx = { from, to, data, value };
  
  // 2. 通过 WalletConnect 发送到钱包
  const txHash = await signClient.request({
    topic: session.topic,
    chainId: `eip155:${chainId}`,
    request: {
      method: 'eth_sendTransaction',
      params: [tx],
    },
  });
  
  // 3. 等待链上确认
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
  });
  
  return txHash;
}
```

---

### 3. 更新的 Hooks

所有写操作 hooks 已更新为真实交易：

#### ① useMintParkingSpot (创建车位)

**之前**:
```typescript
// 模拟交易
await new Promise(resolve => setTimeout(resolve, 2000));
const mockHash = '0x' + Math.random().toString(16);
```

**现在**:
```typescript
// 真实交易
const data = encodeFunctionData({
  abi: ParkingLotABI,
  functionName: 'mintParkingSpot',
  args: [name, picture, location, rentPriceWei, longitudeScaled, latitudeScaled],
});

const txHash = await sendTransaction(
  signClient, session, chainId, address, CONTRACT_ADDRESS, data
);
```

#### ② useRentParkingSpot (租用车位)

**特点**: 需要发送 MNT 作为租金

```typescript
// 获取租金
const spot = await publicClient.readContract({...});
const rentValue = spot.rent_price;

// 编码调用
const data = encodeFunctionData({
  abi: ParkingLotABI,
  functionName: 'rentParkingSpot',
  args: [spotId, endTime],
});

// 发送交易 (包含租金支付)
const txHash = await sendTransaction(
  signClient, session, chainId, address, CONTRACT_ADDRESS, data,
  `0x${rentValue.toString(16)}`  // 租金作为 value
);
```

#### ③ useTerminateRental (终止租赁)

```typescript
const data = encodeFunctionData({
  abi: ParkingLotABI,
  functionName: 'terminateRental',
  args: [spotId],
});

const txHash = await sendTransaction(
  signClient, session, chainId, address, CONTRACT_ADDRESS, data
);
```

#### ④ useUpdateParkingSpot (更新车位)

```typescript
const data = encodeFunctionData({
  abi: ParkingLotABI,
  functionName: 'updateParkingSpot',
  args: [tokenId, name, picture, location, rentPriceWei, longitudeScaled, latitudeScaled],
});

const txHash = await sendTransaction(
  signClient, session, chainId, address, CONTRACT_ADDRESS, data
);
```

#### ⑤ useBurnParkingSpot (删除车位)

```typescript
const data = encodeFunctionData({
  abi: ParkingLotABI,
  functionName: 'burnParkingSpot',
  args: [spotId],
});

const txHash = await sendTransaction(
  signClient, session, chainId, address, CONTRACT_ADDRESS, data
);
```

---

## 🎯 用户操作流程

### 完整的交易确认流程

1. **用户在 App 中操作**
   - 例如: 点击"创建车位"按钮
   - App 显示加载状态

2. **自动跳转到 MetaMask**
   - App 调用 `sendTransaction()`
   - WalletConnect 打开 MetaMask

3. **在 MetaMask 中确认**
   - 用户查看交易详情
   - 查看 Gas 费用
   - 点击"确认"或"拒绝"

4. **等待链上确认**
   - 交易发送到 Mantle Sepolia 网络
   - 等待区块确认 (约 10-30 秒)
   - App 显示"等待确认..."

5. **返回结果**
   - 成功: 显示成功提示，跳转页面
   - 失败: 显示错误信息

---

## 📱 示例流程

### 创建车位示例

```
用户操作:
1. 填写车位信息 (名称、位置、租金等)
2. 点击"创建车位"

系统处理:
1. App 显示"创建中..."
2. 自动打开 MetaMask
3. MetaMask 显示交易详情:
   ┌─────────────────────────┐
   │ 函数: mintParkingSpot   │
   │ 合约: 0x32cE...b55      │
   │ Gas: ~0.0001 MNT       │
   │                         │
   │ [拒绝]    [确认] ✓     │
   └─────────────────────────┘
4. 用户点击"确认"
5. 交易发送到链上
6. App 等待确认 (10-30s)
7. 成功后跳转到"我的车位"
```

### 租用车位示例

```
用户操作:
1. 选择租期 (例如: 7天)
2. 查看费用 (例如: 0.07 MNT)
3. 点击"确认租用"

系统处理:
1. App 显示"租用中..."
2. 自动打开 MetaMask
3. MetaMask 显示交易详情:
   ┌─────────────────────────┐
   │ 函数: rentParkingSpot   │
   │ 合约: 0x32cE...b55      │
   │ 支付: 0.07 MNT         │
   │ Gas: ~0.0001 MNT       │
   │                         │
   │ [拒绝]    [确认] ✓     │
   └─────────────────────────┘
4. 用户点击"确认"
5. 支付 0.07 MNT + Gas
6. 交易发送到链上
7. App 等待确认
8. 成功后跳转到"我的租赁"
```

---

## ⚠️ 重要提示

### 钱包连接要求

所有写操作现在都要求:
- ✅ 钱包已连接 (`isConnected === true`)
- ✅ WalletConnect SignClient 已初始化
- ✅ Session 已建立

如果缺少任何条件，会抛出错误:
```typescript
if (!address) {
  throw new Error('请先连接钱包');
}

if (!signClient || !session) {
  throw new Error('WalletConnect 未连接');
}
```

### Gas 费用

每个操作都需要支付 Gas 费:
- 创建车位: ~0.0001-0.0005 MNT
- 租用车位: ~0.0001 MNT + 租金
- 更新车位: ~0.0001-0.0003 MNT
- 删除车位: ~0.0001 MNT
- 退租: ~0.0001 MNT

### 网络要求

- **链 ID**: 5003 (Mantle Sepolia)
- **RPC**: https://rpc.sepolia.mantle.xyz
- **区块浏览器**: https://explorer.sepolia.mantle.xyz

---

## 🔍 调试信息

所有交易都会输出详细日志:

```typescript
// 开始交易
console.log('🚀 开始铸造车位 NFT:', {...});

// 发送到钱包
console.log('📝 发送交易请求到钱包...');

// 交易已发送
console.log('✅ 交易已发送:', txHash);

// 等待确认
console.log('⏳ 等待交易确认...');

// 确认成功
console.log('✅ 交易已确认!', receipt);
```

---

## 🆚 对比

### 之前 (模拟模式)

```typescript
// 假装等待 2 秒
await new Promise(resolve => setTimeout(resolve, 2000));

// 生成假的交易哈希
const mockHash = '0x' + Math.random().toString(16);

console.log('✅ 交易成功 (模拟):', mockHash);
console.log('💡 提示: 连接真实钱包后将发送真实交易');
```

**问题**:
- ❌ 不会真正上链
- ❌ 数据不会永久保存
- ❌ 刷新后数据丢失

### 现在 (真实交易)

```typescript
// 编码函数调用
const data = encodeFunctionData({...});

// 通过 WalletConnect 发送真实交易
const txHash = await sendTransaction(
  signClient, session, chainId, address, CONTRACT_ADDRESS, data
);

// 等待链上确认
await publicClient.waitForTransactionReceipt({ hash: txHash });

console.log('✅ 车位创建成功!');
```

**优势**:
- ✅ 真正写入区块链
- ✅ 数据永久保存
- ✅ 可在区块浏览器查看
- ✅ 完整的去中心化体验

---

## 📊 影响范围

### 已更新的操作

| 操作 | Hook | 文件 | 钱包确认 |
|-----|------|------|---------|
| 创建车位 | useMintParkingSpot | add-parking.tsx | ✅ 需要 |
| 租用车位 | useRentParkingSpot | rent-parking.tsx | ✅ 需要 |
| 退租 | useTerminateRental | my-rentals.tsx | ✅ 需要 |
| 更新车位 | useUpdateParkingSpot | edit-parking.tsx | ✅ 需要 |
| 删除车位 | useBurnParkingSpot | my-parking.tsx | ✅ 需要 |

### 只读操作 (无需钱包确认)

| 操作 | Hook | 说明 |
|-----|------|------|
| 获取所有车位 | useAllParkingSpots | 直接读取链上数据 |
| 获取我的车位 | useMyParkingSpots | 直接读取链上数据 |

---

## ✅ 测试清单

在测试时请确认:

- [ ] 钱包连接成功
- [ ] 网络切换到 Mantle Sepolia
- [ ] 账户有足够的 MNT (用于 Gas)
- [ ] 创建车位时 MetaMask 弹出
- [ ] 租用车位时 MetaMask 弹出并显示支付金额
- [ ] 交易确认后数据正确显示
- [ ] 可以在区块浏览器查看交易
- [ ] 错误处理正常 (如用户拒绝)

---

## 🎉 总结

现在 ParkView 已经是一个完全去中心化的应用 (DApp)！

- ✅ 所有数据写入 Mantle Sepolia 区块链
- ✅ 每个操作都需要钱包签名确认
- ✅ 真实的 Gas 费用支付
- ✅ 交易可在区块浏览器追溯
- ✅ 完整的 Web3 用户体验

**不再是演示模式，而是真实的区块链应用！** 🚀
