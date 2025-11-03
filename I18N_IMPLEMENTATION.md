# 国际化 (i18n) 实现说明

## ✅ 已完成

### 1. 国际化系统搭建
- ✅ 创建自定义 i18n 实现（`mobile/i18n/index.ts`）
- ✅ 支持中文和英文
- ✅ 默认语言设置为英语
- ✅ 支持参数插值（如：`{{count}}` 个车位）
- ✅ 支持回退机制（找不到翻译时使用英语）

### 2. 翻译文件
- ✅ `mobile/i18n/locales/en.ts` - 英文翻译
- ✅ `mobile/i18n/locales/zh.ts` - 中文翻译

### 3. 上下文管理
- ✅ 创建 `LanguageContext`（`mobile/contexts/LanguageContext.tsx`）
- ✅ 使用 AsyncStorage 持久化语言设置
- ✅ 提供 `useLanguage` hook

### 4. 完善设置功能
- ✅ 创建独立设置页面（`app/settings.tsx`）
- ✅ 语言切换功能
- ✅ 通用设置：语言、通知、主题
- ✅ 安全与隐私设置
- ✅ 帮助与支持
- ✅ 关于信息

### 5. 应用国际化
- ✅ 更新主布局添加 LanguageProvider
- ✅ 更新个人中心页面
- ✅ 更新 Tab 导航
- ✅ 所有路由标题国际化

## 📝 使用方法

### 在组件中使用翻译

```tsx
import { useLanguage } from '@/mobile/contexts/LanguageContext';

function MyComponent() {
  const { t, locale, setLocale } = useLanguage();
  
  return (
    <View>
      <Text>{t('common.confirm')}</Text>
      <Text>{t('wallet.connected')}</Text>
      
      {/* 带参数的翻译 */}
      <Text>{t('myParkings.totalSpots', { count: 5 })}</Text>
      
      {/* 切换语言 */}
      <Button onPress={() => setLocale('zh')}>中文</Button>
      <Button onPress={() => setLocale('en')}>English</Button>
    </View>
  );
}
```

### 添加新的翻译

1. 在 `mobile/i18n/locales/en.ts` 添加英文：
```typescript
export default {
  mySection: {
    myKey: 'My English Text',
  },
};
```

2. 在 `mobile/i18n/locales/zh.ts` 添加中文：
```typescript
export default {
  mySection: {
    myKey: '我的中文文本',
  },
};
```

3. 在组件中使用：
```tsx
{t('mySection.myKey')}
```

## 🎯 已国际化的内容

### 1. 通用文本
- 按钮：确认、取消、保存、删除、编辑等
- 状态：加载中、刷新、重试等

### 2. 导航标签
- 首页 (Home)
- 我的车位 (My Parkings)
- 我的租赁 (My Rentals)
- 个人中心 (Profile)

### 3. 钱包相关
- 连接状态
- 钱包信息
- 连接/断开提示

### 4. 个人中心
- 设置选项
- 安全与隐私
- 帮助与支持

### 5. 设置页面
- 语言选择
- 通知设置
- 主题设置
- 关于信息

## 🔄 TODO（待应用国际化的页面）

需要更新以下页面以使用 `useLanguage()` hook：

1. ✅ `app/(tabs)/profile.tsx` - 个人中心（已完成）
2. ⏳ `app/(tabs)/index.tsx` - 首页地图
3. ⏳ `app/(tabs)/my-parking.tsx` - 我的车位
4. ⏳ `app/(tabs)/my-rentals.tsx` - 我的租赁
5. ⏳ `app/add-parking.tsx` - 添加车位
6. ⏳ `app/edit-parking.tsx` - 编辑车位
7. ⏳ `app/rent-parking.tsx` - 租用车位

## 🌐 语言支持

- 🇺🇸 English (默认)
- 🇨🇳 简体中文

## 💾 持久化

语言设置保存在 AsyncStorage 中：
- Key: `@parkview_language`
- Value: `'en'` 或 `'zh'`

## 🔧 设置页面功能

### 通用设置
- **语言选择**：点击弹出选择器，支持英文/中文切换
- **通知设置**：管理通知偏好（即将推出）
- **主题设置**：选择应用主题（即将推出）

### 安全与隐私
- **钱包安全**：查看 WalletConnect 安全信息
- **数据隐私**：了解数据存储方式

### 帮助与支持
- **文档**：打开 docs.parkview.app
- **联系支持**：发送邮件到 support@parkview.app
- **发送反馈**：GitHub 反馈链接

### 关于
- **版本号**：显示应用版本
- **网站**：parkview.app
- **服务条款**：链接到服务条款
- **隐私政策**：链接到隐私政策
- **开源许可**：查看开源许可信息

## 📱 用户体验

1. **首次启动**：应用默认使用英语
2. **切换语言**：
   - 进入 个人中心 → 通用设置 → 语言
   - 选择语言后立即生效
   - 设置会被保存，下次启动时使用
3. **实时更新**：切换语言后，所有界面立即更新

## 🎨 UI 特点

- 清晰的分组布局
- 每个设置项都有描述文字
- 图标清晰易懂
- 支持外部链接（文档、支持等）
- 版本信息展示
