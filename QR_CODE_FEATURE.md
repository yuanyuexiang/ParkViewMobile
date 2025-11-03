# WalletConnect QR 码连接功能

## ✅ 已完成的修改

### 1. 安装了 QR 码库
```bash
pnpm add react-native-qrcode-svg react-native-svg
```

### 2. 创建了 QR 码弹窗组件
**文件**: `mobile/components/WalletConnectQRModal.tsx`

这是一个全屏弹窗，显示 WalletConnect QR 码和连接说明。

**功能**:
- 显示 280x280 像素的 QR 码
- 提供详细的连接步骤说明
- 支持关闭按钮

### 3. 修改了 WalletContext
**文件**: `mobile/contexts/WalletContext.tsx`

**新增状态**:
- `wcUri: string | null` - 存储 WalletConnect URI

**新增方法**:
- `closeQRModal()` - 关闭 QR 码弹窗

**修改了 connect() 函数**:
- 生成 URI 后，保存到 `wcUri` 状态
- 尝试打开 MetaMask (Universal Link 和 Deep Link)
- 如果打开失败，提示用户扫描 QR 码
- **QR 码会自动显示**，作为连接的备选方案

### 4. 修改了 Profile 页面
**文件**: `app/(tabs)/profile.tsx`

**新增**:
- 导入 `WalletConnectQRModal` 组件
- 从 context 中获取 `wcUri` 和 `closeQRModal`
- 在页面底部添加 QR 码弹窗

## 🎯 使用方法

### 方式 A: 自动打开 MetaMask (推荐)
1. 点击"连接钱包"按钮
2. App 会自动尝试打开 MetaMask
3. 在 MetaMask 中批准连接请求

### 方式 B: 扫描 QR 码 (可靠)
1. 点击"连接钱包"按钮
2. 会弹出一个显示 QR 码的窗口
3. 打开 MetaMask 钱包 App
4. 点击顶部的扫描图标 📷
5. 扫描 ParkView App 中显示的 QR 码
6. 在 MetaMask 中批准连接请求
7. 返回 ParkView App，连接应该已建立

## 🔍 工作原理

```
点击"连接钱包"
    ↓
生成 WalletConnect URI
    ↓
├─→ 保存到 wcUri state (触发 QR 码显示)
├─→ 尝试打开 MetaMask (Universal Link)
└─→ 如果失败 → 提示扫描 QR 码
    ↓
用户选择连接方式:
├─→ 方式 A: MetaMask 自动打开 → 批准
└─→ 方式 B: 手动扫描 QR 码 → 批准
    ↓
WalletConnect 建立连接
    ↓
approval() Promise 解析
    ↓
连接成功 ✅
```

## 📱 用户体验流程

### 场景 1: MetaMask 正常打开
```
用户点击"连接钱包"
    ↓
QR 码弹窗显示
    ↓
MetaMask 自动打开
    ↓
用户在 MetaMask 中批准
    ↓
返回 ParkView
    ↓
QR 码弹窗自动关闭 (连接成功后)
```

### 场景 2: MetaMask 没有打开
```
用户点击"连接钱包"
    ↓
QR 码弹窗显示
    ↓
MetaMask 没有打开 (或打开失败)
    ↓
用户看到 QR 码和说明
    ↓
手动打开 MetaMask → 扫描 QR 码
    ↓
在 MetaMask 中批准
    ↓
返回 ParkView
    ↓
连接成功 ✅
```

## 🎨 QR 码弹窗设计

**特点**:
- ✅ 暗色主题 (符合现代钱包 UI 风格)
- ✅ 280x280 大尺寸 QR 码 (易于扫描)
- ✅ 白色背景的 QR 码区域 (最佳对比度)
- ✅ 详细的操作步骤说明
- ✅ 支持滚动 (适配小屏幕)
- ✅ 模态遮罩层 (半透明黑色)
- ✅ 圆角设计 (现代美观)

## 🔧 技术细节

### WalletConnect URI 格式
```
wc:6f432c7d...@2?expiryTimestamp=1762174219&relay-protocol=irn&symKey=cda34cb2...
```

**组成部分**:
- `wc:` - WalletConnect 协议标识
- `6f432c7d...` - Session ID
- `@2` - WalletConnect v2 协议版本
- `expiryTimestamp` - 过期时间戳
- `relay-protocol=irn` - 使用 WalletConnect IRN 中继
- `symKey` - 对称加密密钥

### QR 码库配置
```typescript
<QRCode
  value={uri}        // WalletConnect URI
  size={280}         // 280x280 像素
  backgroundColor="white"  // 白色背景
  color="black"      // 黑色码点
/>
```

## 🐛 调试

### 如果 QR 码不显示
1. 检查 `wcUri` state 是否有值
   ```typescript
   console.log('🔗 wcUri:', wcUri);
   ```

2. 检查 Modal 的 `visible` 属性
   ```typescript
   visible={!!wcUri}  // 应该是 true
   ```

### 如果扫描后没有连接
1. 检查 MetaMask 版本 (建议 >= 7.0.0)
2. 查看 approval() 是否被调用
3. 检查 session_proposal 事件是否触发

## 🎯 优势

相比之前的方法，QR 码连接有以下优势：

1. **更可靠**: QR 码扫描是 WalletConnect 官方推荐的连接方式
2. **更直观**: 用户可以清楚地看到连接过程
3. **兼容性好**: 不依赖于 Deep Link 或 Universal Link
4. **跨平台**: iOS 和 Android 都完美支持
5. **调试友好**: 可以手动查看和测试 WalletConnect URI

## 📊 预期结果

用户点击"连接钱包"后：
- ✅ 立即看到 QR 码弹窗
- ✅ 可以选择自动打开 MetaMask 或扫描 QR 码
- ✅ 连接成功率大幅提高
- ✅ 更好的用户反馈和指导

## 下一步

1. **测试 QR 码连接**
   - 点击"连接钱包"
   - 查看 QR 码是否显示
   - 使用 MetaMask 扫描 QR 码
   - 验证连接是否成功

2. **如果成功**
   - QR 码方式将作为主要连接方式
   - Deep Link 作为辅助方式
   - 可以考虑添加"使用 QR 码连接"的明确按钮

3. **如果失败**
   - 检查日志中的错误信息
   - 验证 MetaMask 版本
   - 考虑使用其他钱包测试 (Trust Wallet, Rainbow 等)
