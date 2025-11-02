# JVM 目标版本不兼容修复

## ❌ 问题

```
Inconsistent JVM-target compatibility detected for tasks 
'compileDebugJavaWithJavac' (17) and 'compileDebugKotlin' (11).
```

**原因**: MetaMask SDK 的 Kotlin 代码默认使用 JVM 11,但项目的 Java 编译使用 JVM 17。

## ✅ 解决方案 (Expo 托管模式)

### 1. 在 `eas.json` 中添加环境变量

```json
{
  "build": {
    "development": {
      "android": {
        "env": {
          "ORG_GRADLE_PROJECT_kotlinJvmTarget": "17"
        }
      }
    }
  }
}
```

### 2. 重新构建

```bash
npx eas build --profile development --platform android --local
```

## 📝 说明

- **托管模式 (Managed)**: 不能直接修改 `android/build.gradle`,必须通过环境变量
- **`ORG_GRADLE_PROJECT_*`**: Gradle 环境变量前缀
- **`kotlinJvmTarget`**: 强制 Kotlin 编译器使用指定的 JVM 版本

## ⚠️ 重要提醒

**这是 Expo 托管模式项目!**
- ❌ 不能运行 `npx expo prebuild`
- ❌ 不能直接修改 `android/` 目录
- ✅ 只能通过 `eas.json` 和 `app.json` 配置

## 🔍 验证

构建成功后应该看到:
```
BUILD SUCCESSFUL
```

不应该再有 JVM 版本不兼容错误。
