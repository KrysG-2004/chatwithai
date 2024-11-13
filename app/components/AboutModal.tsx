'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

export default function AboutModal() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="absolute top-full right-0 mt-2 w-[380px] bg-black/80 backdrop-blur-xl 
        border border-indigo-500/20 rounded-2xl p-6 text-indigo-300 text-sm
        shadow-2xl shadow-indigo-500/10"
    >
      <div className="relative">
        {/* Logo Animation */}
        <motion.div 
          className="absolute -top-12 left-1/2 -translate-x-1/2"
          animate={{ 
            rotateY: [0, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="relative w-16 h-16">
            <Image
              src="/ai-logo.svg"
              alt="AI Logo"
              width={64}
              height={64}
              className="filter hue-rotate-180 drop-shadow-[0_0_15px_rgba(129,140,248,0.5)]"
            />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h3 
          className="font-medium text-xl text-center mt-6 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          AI Terminal
        </motion.h3>

        {/* Feature Cards */}
        <div className="space-y-3 mt-6">
          {[
            {
              title: "智能对话",
              description: "基于最新的 AI 模型，提供流畅自然的对话体验",
              icon: "💡"
            },
            {
              title: "文件分析",
              description: "支持多种文件格式的智能分析和内容理解",
              icon: "📄"
            },
            {
              title: "历史记录",
              description: "自动保存并智能总结对话内容，随时回顾",
              icon: "📚"
            }
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="group relative overflow-hidden rounded-xl bg-indigo-500/5 p-4 
                hover:bg-indigo-500/10 transition-all duration-300
                border border-transparent hover:border-indigo-500/20"
            >
              {/* Animated Background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-0 
                  group-hover:opacity-100 transition-opacity duration-300"
                initial={false}
                animate={{ 
                  scale: [1, 1.2],
                  rotate: [0, 90],
                }}
                transition={{ 
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
              
              <div className="relative flex items-center space-x-3">
                <span className="text-2xl">{feature.icon}</span>
                <div>
                  <h4 className="font-medium mb-1">{feature.title}</h4>
                  <p className="text-xs text-indigo-300/70">{feature.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 新增：详细功能介绍 */}
        <div className="mt-8 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h4 className="text-sm font-medium mb-3 text-indigo-200">核心功能</h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: "🤖", text: "GPT-4 模型支持" },
                { icon: "⚡", text: "实时流式响应" },
                { icon: "🔄", text: "上下文连续对话" },
                { icon: "🎯", text: "精准意图理解" }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="flex items-center space-x-2 text-xs bg-indigo-500/5 
                    rounded-lg p-2 border border-indigo-500/10"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span>{item.icon}</span>
                  <span className="text-indigo-300/90">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <h4 className="text-sm font-medium mb-3 text-indigo-200">文件支持</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                "PDF 文档解析",
                "Word 文档处理",
                "TXT 文本分析",
                "Markdown 支持"
              ].map((text, i) => (
                <motion.div
                  key={i}
                  className="flex items-center space-x-2 bg-indigo-500/5 
                    rounded-lg p-2 border border-indigo-500/10"
                  whileHover={{ scale: 1.02 }}
                >
                  <span className="text-indigo-300/90">{text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <h4 className="text-sm font-medium mb-3 text-indigo-200">高级特性</h4>
            <div className="space-y-2">
              {[
                {
                  title: "智能摘要生成",
                  desc: "自动总结对话内容，快速回顾重点"
                },
                {
                  title: "多设备同步",
                  desc: "云端数据同步，随时随地访问对话历史"
                },
                {
                  title: "隐私保护",
                  desc: "端到端加密，确保数据安全"
                }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="bg-indigo-500/5 rounded-lg p-3 border border-indigo-500/10
                    hover:bg-indigo-500/10 transition-colors duration-300"
                  whileHover={{ x: 5 }}
                >
                  <h5 className="font-medium text-xs mb-1">{item.title}</h5>
                  <p className="text-xs text-indigo-300/70">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* 技术规格 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="pt-4 border-t border-indigo-500/20"
          >
            <h4 className="text-sm font-medium mb-3 text-indigo-200">技术规格</h4>
            <div className="grid grid-cols-2 gap-4 text-xs text-indigo-300/70">
              <div>
                <span className="text-indigo-300">模型版本：</span>GPT-4
              </div>
              <div>
                <span className="text-indigo-300">响应速度：</span>≤ 50ms
              </div>
              <div>
                <span className="text-indigo-300">文件大小：</span>≤ 10MB
              </div>
              <div>
                <span className="text-indigo-300">支持格式：</span>多种类型
              </div>
            </div>
          </motion.div>
        </div>

        {/* Version & Credits 部分移到最后 */}
        <motion.div 
          className="mt-8 pt-4 border-t border-indigo-500/20 text-center text-xs text-indigo-300/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          <p>Version 1.0.0</p>
          <p className="mt-1">Powered by Advanced AI Technology</p>
          <p className="mt-1">© 2024 AI Terminal. All rights reserved.</p>
        </motion.div>

        {/* Decorative Elements */}
        <div className="absolute -inset-[1px] bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 
          rounded-2xl opacity-50 group-hover:opacity-100 transition-opacity blur-xl pointer-events-none" />
        
        {/* Floating Particles */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-indigo-400/30 rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -10, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </motion.div>
  )
} 