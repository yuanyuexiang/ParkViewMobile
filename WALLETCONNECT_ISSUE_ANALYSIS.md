# WalletConnect "No matching" 错误 - 深度分析

## 📊 问题概述

**错误信息**: `Uncaught (in promise,id:2) Error: No matching...`
**发生时机**: 用户在 MetaMask 中批准连接后
**影响**: 应用崩溃,黑屏

## 🔍 已尝试的解决方案 (共 6 次)

### 1️⃣ 基础错误处理 (失败)
```typescript
try {
  const updatedSession = client.session.get(args.topic);
} catch (error) {
  console.error('Error handling session update:', error);
}
```
**结果**: ❌ 仍然崩溃

### 2️⃣ 会话恢复保护 (失败)
```typescript
try {
  const sessions = client.session.getAll();
  if (sessions.length > 0) { /* restore */ }
} catch (error) {
  sessions.forEach(s => client.session.delete(s.topic));
}
```
**结果**: ❌ 仍然崩溃

### 3️⃣ 添加超时保护 (失败)
```typescript
const session = await Promise.race([
  approval(), 
  timeout(60000)
]);
```
**结果**: ❌ 不是超时问题

### 4️⃣ Pairing 清理策略 (失败)
```typescript
const pairings = client.core.pairing.getPairings();
for (const pairing of pairings) {
  await client.core.pairing.disconnect({ topic: pairing.topic });
}
```
**结果**: ❌ 仍然崩溃

### 5️⃣ 完全重置策略 (失败)
```typescript
export async function resetWalletConnect() {
  // 清除所有 sessions
  // 清除所有 pairings
}
// 在启动时和错误时调用
```
**结果**: ❌ 仍然崩溃

### 6️⃣ 智能清理策略 (当前版本)
```typescript
// 只清理过期的 sessions 和非活动的 pairings
if (session.expiry * 1000 < Date.now()) {
  await client.disconnect({...});
}
```
**结果**: ⏳ 待测试

## 🎯 根本原因分析

### WalletConnect v2 在 React Native 环境的问题

1. **Pairing Topic 不匹配**
   - `approval()` Promise 尝试查找 pairing topic
   - 但该 topic 可能已被清理或不存在
   - 导致 "No matching" 错误

2. **事件时序问题**
   - MetaMask 批准后发送事件
   - 但 SignClient 的事件监听器可能还未准备好
   - 或者事件已经触发但 Promise 还在等待

3. **状态同步问题**
   - client.session 和 client.core.pairing 状态不一致
   - 清理操作可能在连接过程中误删了活动的 pairing

## 💡 可行的解决方案

### 选项 A: MetaMask SDK (推荐 ⭐⭐⭐⭐⭐)

**优势**:
- ✅ 专为 React Native 设计
- ✅ 更简单的 API
- ✅ 更稳定的连接流程
- ✅ 已安装 `@metamask/sdk-react-native@0.3.0`
- ✅ 托管构建兼容 (Expo 兼容)

**劣势**:
- ❌ 只支持 MetaMask
- ❌ 不支持其他钱包

**代码示例**:
```typescript
import { MetaMaskSDK } from '@metamask/sdk-react-native';

const sdk = new MetaMaskSDK({
  dappMetadata: {
    name: 'ParkView',
    url: 'https://parkview.app',
  },
});

// 连接
const accounts = await sdk.connect();
```

### 选项 B: WalletConnect Modal (推荐 ⭐⭐⭐⭐)

**优势**:
- ✅ 官方高级封装
- ✅ 处理了很多边缘情况
- ✅ 支持多钱包
- ✅ 内置 UI

**劣势**:
- ❌ 需要额外依赖
- ❌ 可能与托管构建有兼容性问题

**安装**:
```bash
pnpm add @walletconnect/modal-react-native
```

### 选项 C: 继续调试 WalletConnect (推荐 ⭐⭐)

**优势**:
- ✅ 已经投入大量时间
- ✅ 支持多钱包

**劣势**:
- ❌ 问题复杂,可能需要更多时间
- ❌ 可能是 SDK bug,无法在应用层解决

**下一步尝试**:
1. 监听 `session_proposal` 事件而不是等待 `approval()`
2. 使用 WalletConnect v1 (已弃用但可能更稳定)
3. 修改 `requiredNamespaces` 配置
4. 降级 WalletConnect SDK 版本

### 选项 D: 混合方案 (推荐 ⭐⭐⭐)

**策略**:
- MetaMask 用户使用 MetaMask SDK
- 其他钱包用户继续使用 WalletConnect

**实现**:
```typescript
const connect = async (walletName: string) => {
  if (walletName === 'MetaMask') {
    // 使用 MetaMask SDK
    await connectWithMetaMaskSDK();
  } else {
    // 使用 WalletConnect
    await connectWithWalletConnect(walletName);
  }
};
```

## 📋 决策建议

### 如果项目主要面向 MetaMask 用户
→ **选择 A (MetaMask SDK)**
- 实施时间: 1-2 小时
- 风险: 低
- 成功率: 95%

### 如果需要支持多钱包
→ **选择 D (混合方案)**
- 实施时间: 2-3 小时
- 风险: 中
- 成功率: 85%

### 如果想要最全面的钱包支持
→ **选择 B (WalletConnect Modal)**
- 实施时间: 2-4 小时
- 风险: 中 (兼容性未知)
- 成功率: 70%

### 如果坚持当前方案
→ **选择 C (继续调试)**
- 实施时间: 4-8 小时
- 风险: 高
- 成功率: 50%

## 🛠️ 立即行动建议

1. **先测试当前版本** (智能清理策略)
   - 完全关闭应用和 MetaMask
   - 重新打开应用
   - 尝试连接

2. **如果仍然失败**
   - 选择方案 A (MetaMask SDK) - 最快
   - 或者方案 D (混合方案) - 最灵活

3. **获取更多调试信息**
   - 在 MetaMask 批准时立即查看日志
   - 记录 pairing topics
   - 记录 session topics
   - 查看是否有时间差

## 📝 日志分析要点

当您测试时,请注意以下日志:
```
📱 WalletConnect URI generated: wc:...
🚀 Opening wallet...
⏳ Waiting for user approval...

# 关键点 1: MetaMask 批准后
✅ Session approved! <topic>  # 如果看到这个 = 成功
❌ Session approval failed     # 如果看到这个 = 失败

# 关键点 2: 如果失败,查看
Error message: No matching...
# 记录完整的错误信息
```

## ❓ 接下来

**请告诉我您的选择**:
1. 先测试当前版本 (智能清理)
2. 切换到 MetaMask SDK
3. 尝试 WalletConnect Modal
4. 使用混合方案
5. 继续深入调试 WalletConnect

我会根据您的选择提供具体的实施步骤。
