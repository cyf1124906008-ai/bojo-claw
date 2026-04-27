# BojoClaw 发布说明

## v1.0.4

这是 BojoClaw 面向 BojoSeek 使用场景的 Windows 首个交付版本。

### 主要内容

- 桌面应用名称调整为 `BojoClaw`
- 用户可见品牌统一为 `BojoSeek`
- 内置 OpenClaw 主体运行环境
- 内置 Windows 版 Node.js 运行时
- 内置 uv 运行时
- 内置 BojoSeek OpenClaw 插件
- 频道页只保留 BojoSeek 连接入口
- 默认 WebSocket 地址为 `wss://ws.bajoseek.com`
- 模型配置简化为基础 URL、API Key、模型 ID
- 默认模型基础 URL 为 `https://platform.shuyanai.com/v1`
- 添加「获取 API 链接」入口
- 技能页完成中文化，并预装常用本地技能
- UI 改为黄、蓝、红为主的 BojoSeek 风格
- 安装向导与许可证信息统一为 BojoClaw / BojoSeek 口径

### 下载文件

- `bojo-claw-1.0.4-win-x64.exe`：Windows 64 位安装包
- `bojo-claw-1.0.4-win-x64.exe.blockmap`：自动更新差分文件

### 安装说明

普通用户只需要下载并运行 `bojo-claw-1.0.4-win-x64.exe`。安装后打开应用，填写模型 API Key、模型 ID，再配置 BojoSeek Bot ID 和 Token 即可使用。
