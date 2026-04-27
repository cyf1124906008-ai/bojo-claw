# BajoClaw

BajoClaw 是为 BajoSeek 场景定制的 OpenClaw 桌面端应用。用户下载安装后，不需要自己准备 Node.js、Git 或 OpenClaw 环境，只需要在应用里填写模型 API Key 和模型名称，就可以通过 BajoSeek Bot 连接使用。

## 下载

请到 GitHub Releases 下载最新版 Windows 安装包：

- 安装包：`bajo-claw-1.0.5-win-x64.exe`
- 系统：Windows 10 / Windows 11，64 位
- 推荐安装方式：双击安装包，按提示完成安装

发布页地址：

https://github.com/cyf1124906008-ai/bajo-claw/releases

## 内置内容

- BajoClaw 桌面界面
- OpenClaw 主体运行环境
- Windows 版 Node.js 运行时
- uv 运行时
- BajoSeek OpenClaw 插件：`@bajoseek/openclaw-bajoseek`
- 默认 BajoSeek WebSocket 地址：`wss://ws.bajoseek.com`
- 本地预装技能与中国市场常用技能
- 面向中国大陆网络环境优化的安装初始化逻辑

## 快速开始

1. 下载并安装 `bajo-claw-1.0.5-win-x64.exe`。
2. 打开 BajoClaw。
3. 进入「模型」页面，点击「添加提供商」。
4. 填写模型信息：
   - 基础 URL：默认 `https://platform.shuyanai.com/v1`
   - API Key：填写你的模型服务密钥
   - 模型 ID：例如 `glm-5`
5. 点击验证，验证通过后保存。
6. 进入「频道」页面，配置 BajoSeek Bot ID 和 Token。
7. 保存后即可通过 BajoSeek Bot 使用 OpenClaw 能力。

## 获取 API Key

应用内提供「获取 API 链接」按钮，会打开：

https://shuyanai.com?promoter_code=cw9rju23

用户可以在该页面注册或获取模型 API Key。

## BajoSeek Bot 连接

BajoClaw 内置 BajoSeek 插件，频道页面只保留 BajoSeek 连接入口。默认连接地址为：

```text
wss://ws.bajoseek.com
```

正常情况下用户不需要手动修改 WebSocket 地址，只需要填写：

- Bot ID
- Token / Bot Key

## 常见问题

### 1. 需要提前安装 OpenClaw 吗？

不需要。BajoClaw 安装包已经内置 OpenClaw 主体和运行所需环境。

### 2. 需要提前安装 Node.js 或 Git 吗？

不需要。应用已内置 Windows 版 Node.js。普通用户下载安装后即可打开使用。

### 3. 打开后模型没有响应怎么办？

请检查「模型」页面：

- 基础 URL 是否带 `/v1`，默认应为 `https://platform.shuyanai.com/v1`
- API Key 是否正确
- 模型 ID 是否填写正确
- API Key 是否有额度

### 4. BajoSeek 连接不上怎么办？

请检查：

- Bot ID 是否正确
- Token / Bot Key 是否正确
- BajoSeek Bot 后台是否已经配置完成
- 当前网络是否可以连接 `wss://ws.bajoseek.com`

### 5. 技能市场打不开怎么办？

中国大陆网络环境下，如果技能市场临时无法访问，可以访问：

https://clawd.org.cn/

手动下载技能压缩包后，解压到应用提示的技能目录。

## 使用教程

完整教程请看：

[docs/USAGE.zh-CN.md](docs/USAGE.zh-CN.md)

## 技术说明

BajoClaw 基于 OpenClaw 进行桌面端定制，面向 BajoSeek 场景重新封装了交互、模型配置、频道配置、插件内置和安装体验。

插件仓库：

https://github.com/bajoseek/openclaw-bajoseek.git

## 许可

本项目遵循原上游项目许可，并保留相关开源依赖的许可证声明。
