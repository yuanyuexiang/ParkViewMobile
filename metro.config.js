const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 配置额外的文件扩展名
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs'];

// 移除 resolverMainFields,使用默认的解析逻辑
// config.resolver.resolverMainFields = ['main', 'module'];

// 自定义解析器,处理目录导入
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // 对于 @web3modal/ui-react-native 的目录导入,手动添加 /index
  if (moduleName.startsWith('./layout/') && 
      context.originModulePath.includes('@web3modal/ui-react-native')) {
    const indexPath = moduleName + '/index';
    try {
      return context.resolveRequest(context, indexPath, platform);
    } catch (e) {
      // 如果失败,回退到默认解析
    }
  }
  
  // 默认解析
  return context.resolveRequest(context, moduleName, platform);
};

// 配置别名
config.resolver.extraNodeModules = {
  '@': __dirname,
};

// 排除不需要打包的文件和目录
config.resolver.blockList = [
  // 排除 Next.js 相关文件
  /\.next\/.*/,
  /out\/.*/,
];

// 监听文件变化
config.watchFolders = [
  __dirname,
];

module.exports = config;


