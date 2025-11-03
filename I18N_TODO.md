# 待国际化的文件清单

## ⚠️ 发现的问题

扫描发现以下6个主要页面文件中仍有大量硬编码的中文文本，需要使用 `useLanguage()` hook 进行国际化处理。

## 📋 需要国际化的文件

### 1. ✅ 已完成国际化
- `app/(tabs)/profile.tsx` - 个人中心 
- `app/(tabs)/_layout.tsx` - Tab 导航
- `app/settings.tsx` - 设置页面
- `app/_layout.tsx` - 主布局

### 2. ⏳ 待处理（优先级高）

#### `app/(tabs)/index.tsx` - 首页地图
**中文数量**: 约30处  
**主要内容**:
- "正在从 Mantle Sepolia 链上加载车位..."
- "加载失败"  
- "链上车位数量"
- "链上暂无车位数据"
- "请先创建车位或等待其他用户创建"
- Alert 对话框文本
- 地图信息窗口内容 ("已出租"/"可租用")

#### `app/(tabs)/my-rentals.tsx` - 我的租赁  
**中文数量**: 约40处  
**主要内容**:
- "我的租赁"
- "请先连接钱包"
- "暂无租赁记录"
- "去地图上找一个车位租用吧!"
- "共 X 个租赁中的车位"
- "已到期" / "即将到期" / "租用中"
- "剩余时间" / "天" / "时" / "分"
- "到期时间"
- "退租" 按钮
- "确认退租" 对话框
- Alert 提示文本

#### `app/(tabs)/my-parking.tsx` - 我的车位
**中文数量**: 约35处  
**主要内容**:
- "我的车位"
- "请先连接钱包"
- "暂无车位"
- "点击右下角的 + 按钮创建您的第一个车位"
- "已租出"
- "编辑" / "删除" 按钮
- "删除中..."
- "无法删除" / "确认删除" 对话框
- Alert 提示文本
- "此页面显示您创建的所有车位及收益信息"

#### `app/add-parking.tsx` - 添加车位
**中文数量**: 约50处  
**主要内容**:
- "添加车位"
- "未连接钱包"  
- "车位名称" / "位置" / "租金"
- "例如: 北京天安门停车位"
- "点击下方按钮在地图上选择位置"
- "在地图上选择位置" / "重新选择位置"
- "经度" / "纬度"
- "约 ¥X 人民币/天"
- "照片" / "(可选)"
- "上传中..." / "已上传"
- "点击选择照片"
- "推荐 16:9 比例"
- "创建中..." / "提交"
- Alert 验证提示
- "确认创建" 对话框

#### `app/edit-parking.tsx` - 编辑车位  
**中文数量**: 约45处  
**主要内容**:
- "编辑车位"
- 类似 add-parking 的表单文本
- "更新中..."
- "确认更新" 对话框
- Alert 验证提示

#### `app/rent-parking.tsx` - 租用车位
**中文数量**: 约25处  
**主要内容**:
- "租用车位"
- "1天" / "3天" / "7天" / "15天" / "30天"
- "热门" 标签
- "租金详情"
- "总费用"
- "租用中..."
- "确认租用" 对话框
- "您不能租用自己的车位"
- Alert 提示文本

## 🎯 建议的实施步骤

### 步骤1: 导入 useLanguage hook
在每个文件顶部添加:
```typescript
import { useLanguage } from '@/mobile/contexts/LanguageContext';

// 在组件内
const { t } = useLanguage();
```

### 步骤2: 替换硬编码文本
将所有中文字符串替换为 `t()` 函数调用:
```typescript
// 之前
<Text>我的租赁</Text>

// 之后  
<Text>{t('myRentals.title')}</Text>
```

### 步骤3: 替换 Alert 对话框
```typescript
// 之前
Alert.alert('确认删除', '确定要删除吗?');

// 之后
Alert.alert(
  t('myParkings.deleteConfirm'), 
  t('myParkings.deleteMessage', { name: spot.name })
);
```

### 步骤4: 替换动态文本
```typescript
// 之前
<Text>共 {count} 个车位</Text>

// 之后
<Text>{t('myParkings.totalSpots', { count })}</Text>
```

## 📦 翻译文件已准备就绪

所有需要的翻译都已在以下文件中完整定义:
- ✅ `mobile/i18n/locales/en.ts` - 200+ 条英文翻译
- ✅ `mobile/i18n/locales/zh.ts` - 200+ 条中文翻译

包含所有页面需要的翻译键值，例如:
- `myRentals.*` - 我的租赁相关
- `myParkings.*` - 我的车位相关  
- `addParking.*` - 添加车位相关
- `editParking.*` - 编辑车位相关
- `rentParking.*` - 租用车位相关
- `home.*` - 首页相关

## 📊 工作量估计

| 文件 | 中文数量 | 预计时间 | 难度 |
|------|---------|---------|------|
| index.tsx | 30处 | 30分钟 | 中 |
| my-rentals.tsx | 40处 | 40分钟 | 中 |
| my-parking.tsx | 35处 | 35分钟 | 中 |
| add-parking.tsx | 50处 | 50分钟 | 高 |
| edit-parking.tsx | 45处 | 45分钟 | 高 |
| rent-parking.tsx | 25处 | 25分钟 | 低 |
| **总计** | **225处** | **3.7小时** | - |

## ⚡ 快速开始

由于工作量较大，建议采用以下策略之一:

### 选项1: 逐个文件处理（推荐）
1. 从简单的 `rent-parking.tsx` 开始  
2. 然后处理 `my-parking.tsx`
3. 再处理 `my-rentals.tsx`
4. 最后处理复杂的 `add-parking.tsx` 和 `edit-parking.tsx`

### 选项2: 分批处理
- **第一批** (核心功能): my-parking, my-rentals
- **第二批** (创建/编辑): add-parking, edit-parking  
- **第三批** (其他): index, rent-parking

### 选项3: 一次性处理
使用批量查找替换工具，但需要仔细检查每一处替换

## ✨ 参考示例

参考已完成的 `profile.tsx` 文件查看国际化实现方式:
```typescript
const { t } = useLanguage();

// 简单文本
<Text>{t('wallet.connected')}</Text>

// 按钮文本  
<Text>{t('wallet.disconnect')}</Text>

// Alert
Alert.alert(t('common.error'), t('errors.networkError'));
```

## 🔍 验证清单

完成国际化后，需要验证:
- [ ] 所有中文文本都已替换为 `t()` 调用
- [ ] 翻译键值在 en.ts 和 zh.ts 中都存在
- [ ] 动态参数正确传递（如 `{ count }`, `{ name }`）
- [ ] Alert 对话框正确翻译
- [ ] 在英语和中文模式下都能正常显示
- [ ] console.log 的调试信息可以保留中文（仅UI文本需要翻译）
- [ ] 注释可以保留中文（仅用户可见文本需要翻译）
