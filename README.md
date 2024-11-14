# AI Chat Assistant

一个基于 Next.js 14 和 Firebase 构建的智能聊天助手应用。支持实时对话、文件分析、聊天记录管理等功能。

在线体验: [https://www.kgchatnova.top](https://www.kgchatnova.top)

## 功能预览

### 智能对话
- 支持连续对话,保持上下文
- 实时流式响应,打字机效果
- 支持 Markdown 格式化显示
- 代码高亮
- 数学公式渲染

### 文件处理能力
- 支持上传 PDF、TXT、DOC 等多种格式
- 智能分析文件内容
- 基于文件内容进行问答

### 用户体验
- 深色主题界面
- 响应式设计,支持移动端
- 实时保存对话历史

## 技术栈

### 前端
- Next.js 14 (React Framework)
- TypeScript
- Tailwind CSS (样式)
- Firebase Auth (身份认证)
- Firebase Hooks (状态管理)

### 后端
- Firebase Cloud Firestore (数据库)
- Firebase Authentication (用户认证)
- Next.js API Routes (API 接口)

## 主要功能

- 🔐 用户认证
  - 邮箱密码登录
  - Google 账号登录
  - 忘记密码
  - 邮箱验证

- 💬 实时对话
  - 流式响应
  - 打字机效果
  - 支持中断生成
  - Markdown 渲染

- 📁 文件处理
  - 支持上传文件
  - 自动分析文件内容
  - 支持多种文件格式

- 📝 聊天管理
  - 多会话管理
  - 历史记录保存
  - 实时同步
  - 会话导出

- 💎 积分系统
  - 使用限制
  - 积分查询
  - 积分充值

## 本地开发

1. 克隆项目
```bash
git clone [repository-url]
cd ai-chat-assistant

2. 安装依赖
bash
npm install

3. 配置环境变量
创建 `.env.local` 文件并添加以下配置:

NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

4. 启动开发服务器
```bash
npm run dev
```

## 部署

项目可以轻松部署到 Vercel:

1. Fork 本项目
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 完成部署

## 项目结构

```
ai-chat-assistant/
├── app/                    # Next.js 应用目录
│   ├── api/               # API 路由
│   ├── components/        # React 组件
│   ├── hooks/            # 自定义 Hooks
│   ├── types/            # TypeScript 类型定义
│   └── utils/            # 工具函数
├── lib/                   # 共享库文件
├── public/               # 静态资源
└── styles/               # 全局样式
```

## 主要组件

- `ChatInterface`: 主聊天界面
- `MessageList`: 消息列表展示
- `ChatInput`: 输入框组件
- `ChatHistory`: 历史记录管理
- `AuthModal`: 认证模态框
- `FileUpload`: 文件上传组件

## 数据库结构

Firebase Firestore 集合:

- `users`: 用户信息
- `chatSessions`: 聊天会话
- `messages`: 聊天消息
- `credits`: 用户积分

## 注意事项

1. 确保 Firebase 项目已正确配置
2. 本地开发需要完整的环境变量
3. 部署前请检查 Firebase 安全规则
4. 注意 API 使用限制和计费

## 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交变更
4. 发起 Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交 Issue 或联系维护者。

## 快速开始

1. 访问 [https://www.kgchatnova.top](https://www.kgchatnova.top)
2. 使用邮箱注册账号
3. 登录后即可开始对话
4. 可以通过右上角菜单查看积分、历史记录等

## 使用提示

1. 首次注册即赠送 500 积分
2. 每次对话消耗 1 积分
3. 文件分析根据大小消耗 5-20 积分不等
4. 可以随时中断 AI 的回复生成
5. 支持实时保存对话记录

## 更新日志

### v1.0.0 (2024-11.12)
- 初始版本发布
- 支持基础对话功能
- 集成 Firebase 认证

### v1.1.0 (2024-11.13)
- 添加文件处理功能
- 优化用户界面
- 添加积分系统