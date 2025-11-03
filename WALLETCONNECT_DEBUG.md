# WalletConnect 连接调试指南

## 当前问题
MetaMask 没有显示批准连接的界面

## 已实施的修改

### 1. 改用 `optionalNamespaces` ✅
```typescript
// 从 requiredNamespaces 改为 optionalNamespaces
optionalNamespaces: {
  eip155: {
    chains: [
      'eip155:5003',  // Mantle Sepolia
      'eip155:1',     // Ethereum
      'eip155:56',    // BSC
      'eip155:137',   // Polygon
    ],
    methods: [
      'eth_sendTransaction',
      'personal_sign',
      'eth_signTypedData',
      'eth_signTypedData_v4',
    ],
    events: ['chainChanged', 'accountsChanged'],
  },
}
```

**原因**: `requiredNamespaces` 要求钱包必须支持指定的链，如果当前网络不匹配，MetaMask 可能拒绝显示批准界面。

### 2. 使用 Universal Link ✅
```typescript
// 优先使用 Universal Link
const universalLink = `https://metamask.app.link/wc?uri=${encodeURIComponent(uri)}`;

// 备用 Deep Link
const deepLink = `metamask://wc?uri=${encodeURIComponent(uri)}`;
```

**原因**: Universal Link 在 iOS 和 Android 上的兼容性更好，可以更可靠地唤起 MetaMask。

### 3. 添加调试日志 ✅
- 添加了 `session_proposal` 事件监听器
- 输出完整的 URI 内容
- 记录 Universal Link 和 Deep Link 的使用情况

## 调试步骤

### 第一步：检查日志
在点击"连接钱包"后，查看以下日志：

1. **URI 生成**
   ```
   ✅ URI 已生成，长度: 187
   🔗 URI 内容: wc:xxxxx...
   ```

2. **Proposal 事件**
   ```
   📨 收到 Session Proposal: {...}
   ```
   - 如果看到这个日志：说明 WalletConnect 服务器收到了请求
   - 如果没有：说明连接请求没有正确发送

3. **MetaMask 启动**
   ```
   ✅ MetaMask 已通过 Universal Link 启动
   ```
   或
   ```
   ✅ MetaMask 已通过 Deep Link 启动
   ```

### 第二步：在 MetaMask 中检查
1. 打开 MetaMask app
2. 查看是否有通知或待处理的连接请求
3. 检查 MetaMask 设置 -> 连接的网站/应用

### 第三步：可能的问题

#### 问题 A: MetaMask 打开但没有显示任何内容
**可能原因**:
- MetaMask 没有正确接收 WalletConnect URI
- Deep Link / Universal Link 格式不正确

**解决方案**:
1. 检查 MetaMask app 版本（需要较新版本支持 WC v2）
2. 尝试卸载并重新安装 MetaMask
3. 查看 `🔗 URI 内容` 日志，确保 URI 格式正确

#### 问题 B: MetaMask 没有打开
**可能原因**:
- MetaMask 没有安装
- Deep Link scheme 配置问题

**解决方案**:
```bash
# 检查 MetaMask 是否安装
adb shell pm list packages | grep metamask  # Android
```

#### 问题 C: Proposal 事件没有触发
**可能原因**:
- WalletConnect 服务器连接问题
- SignClient 配置问题

**解决方案**:
1. 检查网络连接
2. 检查 PROJECT_ID 是否有效
3. 查看 WalletConnect 控制台是否有错误

## 下一步计划

如果以上方法都不行，考虑以下备选方案：

### 方案 A: 使用 WalletConnect Modal
虽然我们之前避免使用 Web3Modal，但可以尝试使用官方的 `@walletconnect/modal-react-native`：

```bash
npm install @walletconnect/modal-react-native
```

**优点**: 
- 官方支持，兼容性更好
- 处理了很多边缘情况

**缺点**:
- 需要额外的依赖
- UI 定制性较差

### 方案 B: 使用 Reown AppKit
最新的 WalletConnect 已经更名为 Reown，可以尝试使用他们的新 SDK：

```bash
npm install @reown/appkit-react-native
```

### 方案 C: 回退到 WalletConnect v1
如果 v2 一直有问题，可以暂时使用 v1（不推荐，因为 v1 已经被废弃）

## 测试清单

- [ ] 查看 `📨 收到 Session Proposal` 日志
- [ ] 确认 MetaMask 能被正确唤起
- [ ] 检查 MetaMask 中是否有待处理请求
- [ ] 尝试手动在 MetaMask 中扫描 WalletConnect QR 码
- [ ] 检查 MetaMask 版本（建议 >= 7.0.0）
- [ ] 测试其他钱包（如 Trust Wallet）是否能正常连接

## 参考资料
- [WalletConnect v2 文档](https://docs.walletconnect.com/2.0/)
- [MetaMask Mobile Deep Linking](https://docs.metamask.io/wallet/how-to/connect/set-up-sdk/mobile/react-native/)
- [Reown AppKit](https://docs.reown.com/appkit/react-native/core/installation)
