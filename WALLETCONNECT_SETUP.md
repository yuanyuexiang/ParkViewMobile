# WalletConnect Project ID 设置指南

## 🚨 当前问题

错误信息：
```
WebSocket connection closed abnormally with code: 3000 (Project not found)
```

**原因**：使用的 Project ID 无效或不存在。

## ✅ 解决步骤

### 1. 注册 WalletConnect Cloud 账号

访问：https://cloud.walletconnect.com/

- 点击 "Sign In" 或 "Get Started"
- 使用 GitHub 账号登录（推荐）或 Email 注册

### 2. 创建新项目

1. 登录后点击 "Create Project"
2. 填写项目信息：
   - **Project Name**: `ParkView`
   - **Project Homepage**: `https://github.com/yuanyuexiang/ParkView`（或你的实际网站）
   
3. 点击 "Create"

### 3. 获取 Project ID

创建成功后，你会看到：
```
Project ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**复制这个 Project ID！**

### 4. 更新配置文件

打开文件：`mobile/config/walletconnect.ts`

找到这一行：
```typescript
export const PROJECT_ID = '3c0f853ec8c67f02d869a67a82301dcc';
```

替换为你的新 Project ID：
```typescript
export const PROJECT_ID = '你复制的ProjectID';
```

### 5. 重启应用

```bash
# 重新加载开发服务器
npx expo start --clear
```

然后在手机上重新打开应用。

## 📝 注意事项

1. **免费额度**：WalletConnect Cloud 提供免费的入门计划
   - 每月 1,000,000 次请求
   - 对于开发和小型应用完全够用

2. **Project ID 是公开的**：可以安全地放在客户端代码中

3. **不要共享别人的 Project ID**：每个项目应该有自己的 ID

## 🎯 验证成功

更新 Project ID 后，如果看到以下日志，说明成功：

```
✅ WalletConnect SignClient initialized
🔗 Session proposal created
```

而不是之前的 `code: 3000 (Project not found)` 错误。

## 🆘 如果还有问题

1. 确认 Project ID 复制完整（没有多余空格）
2. 确认 WalletConnect Cloud 项目状态为 "Active"
3. 检查网络连接是否正常
4. 清除应用缓存重新安装

---

**告诉我你获取到 Project ID 后，我会帮你更新配置！**
