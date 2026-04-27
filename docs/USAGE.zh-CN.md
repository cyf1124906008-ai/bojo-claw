# BajoClaw 使用教程

本文面向普通用户，说明如何下载、安装、配置模型，以及如何连接 BajoSeek Bot。

## 1. 下载并安装

1. 打开下载页：

   https://github.com/cyf1124906008-ai/bajo-claw/releases

2. 下载最新版安装包：

   `bajo-claw-1.0.5-win-x64.exe`

3. 双击安装包。
4. 根据安装向导完成安装。
5. 安装完成后，从桌面或开始菜单打开 `BajoClaw`。

## 2. 第一次打开

第一次启动时，BajoClaw 会自动准备 OpenClaw 所需环境。普通用户不需要手动安装：

- OpenClaw
- Node.js
- Git
- BajoSeek 插件

如果初始化过程中提示网络异常，请检查当前网络是否可以访问外部服务，然后重新打开应用。

## 3. 配置模型

1. 打开左侧「模型」。
2. 点击「添加提供商」。
3. 填写以下内容：

   ```text
   基础 URL：https://platform.shuyanai.com/v1
   API Key：填写你的密钥
   模型 ID：填写模型名称，例如 glm-5
   ```

4. 点击「验证」。
5. 验证通过后保存。

### 获取 API Key

如果还没有 API Key，可以点击应用里的「获取 API 链接」按钮，或打开：

https://shuyanai.com?promoter_code=cw9rju23

## 4. 连接 BajoSeek Bot

1. 打开左侧「频道」。
2. 选择 `BajoSeek`。
3. 填写：

   ```text
   Bot ID：你的 BajoSeek Bot ID
   Token / Bot Key：你的 BajoSeek Bot 密钥
   ```

4. 保存配置。
5. 等待连接状态变为已连接。

默认 WebSocket 地址已经内置为：

```text
wss://ws.bajoseek.com
```

通常不需要用户手动填写或修改。

## 5. 使用 BajoSeek 发送消息

模型和 BajoSeek 频道都配置完成后，就可以在 BajoSeek Bot 中发送消息。BajoClaw 会通过内置 OpenClaw 接收任务、调用模型、执行技能，并把结果返回到 BajoSeek。

## 6. 技能使用

BajoClaw 已内置一批常用技能，并加入了适合中国市场的投资和 A 股相关技能。用户可以在「技能」页面查看和启用。

如果需要安装更多技能：

1. 打开「技能」页面。
2. 点击安装技能。
3. 搜索关键词。
4. 点击安装。

如果技能市场因为网络原因打不开，可以访问：

https://clawd.org.cn/

下载技能压缩包并按应用提示解压到本地技能目录。

## 7. 常见错误处理

### No response received from the model

一般是模型配置问题。请检查：

- 基础 URL 是否为 `https://platform.shuyanai.com/v1`
- API Key 是否正确
- API Key 是否有额度
- 模型 ID 是否填写正确

### BajoSeek 频道无法连接

请检查：

- Bot ID 是否正确
- Token / Bot Key 是否正确
- BajoSeek 后台是否已经创建并启用 Bot
- 当前网络是否可以访问 `wss://ws.bajoseek.com`

### 技能市场 rateLimitError

可能是市场服务限流或网络异常。可以稍后重试，或访问 `https://clawd.org.cn/` 手动下载技能。

## 8. 卸载

可以通过 Windows「设置 - 应用」卸载 `BajoClaw`。卸载不会自动删除用户数据目录，如果需要完全清理，请手动删除应用提示的数据目录。
