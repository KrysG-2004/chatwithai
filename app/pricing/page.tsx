'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCredits } from '@/app/hooks/useCredits'
import { motion } from 'framer-motion'
import { auth } from '@/lib/firebase'
import { useAuthState } from 'react-firebase-hooks/auth'

export default function PricingPage() {
  const [user] = useAuthState(auth)
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null)
  const [processing, setProcessing] = useState<number | null>(null)

  const plans = [
    {
      name: '基础套餐',
      credits: 100,
      price: 10,
      features: [
        '基础AI对话功能',
        '文本分析能力',
        '基础文件处理',
        '7天历史记录',
        '标准响应速度'
      ],
      description: '适合个人日常使用，满足基本的AI对话需求',
      color: 'from-blue-500/20 to-purple-500/20',
      icon: '🌟'
    },
    {
      name: '专业套餐',
      credits: 500,
      price: 45,
      features: [
        '高级AI对话功能',
        '深度文本分析',
        '多种文件格式支持',
        '30天历史记录',
        '优先响应速度',
        '专业技术支持'
      ],
      description: '为专业用户打造，提供更强大的功能和更好的体验',
      color: 'from-purple-500/20 to-pink-500/20',
      icon: '⭐',
      popular: true
    },
    {
      name: '企业套餐',
      credits: 1200,
      price: 99,
      features: [
        '企业级AI对话',
        'API集成支持',
        '无限文件处理',
        '永久历史记录',
        'VIP响应速度',
        '24/7专属支持',
        '自定义模型训练'
      ],
      description: '为企业级用户提供最强大的功能和最优质的服务',
      color: 'from-pink-500/20 to-rose-500/20',
      icon: '💫'
    }
  ]

  const handlePurchase = async (plan: typeof plans[0]) => {
    if (!user) {
      router.push('/')
      return
    }

    // 暂时只显示提示信息
    alert('支付功能正在开发中，敬请期待！')
  }

  // 修改导航逻辑
  useEffect(() => {
    if (user) {
      window.history.pushState({ from: 'pricing' }, '', '/pricing')
    }

    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault()
      if (user) {
        router.push('/chat')
      } else {
        router.push('/')
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [user, router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-black py-20">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text mb-4">
            选择最适合你的套餐
          </h1>
          <p className="text-purple-300/70 max-w-2xl mx-auto">
            我们提供多种灵活的套餐选择，满足不同用户的不同需求。所有套餐都包含核心AI功能，
            随着套餐等级提升，您将获得更多高级特性和优先支持。
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              className={`relative bg-gradient-to-br ${plan.color} 
                rounded-2xl border border-purple-500/20 p-8
                hover:border-purple-500/40 transition-all duration-300
                backdrop-blur-xl shadow-lg`}
              onMouseEnter={() => setSelectedPlan(index)}
              onMouseLeave={() => setSelectedPlan(null)}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-500/90 
                  text-white text-xs px-4 py-1 rounded-full">
                  最受欢迎
                </div>
              )}
              
              <div className="text-4xl mb-4">{plan.icon}</div>
              <h2 className="text-2xl font-bold text-purple-300 mb-2">{plan.name}</h2>
              <div className="text-3xl font-bold text-purple-300 mb-4">
                ¥{plan.price}
                <span className="text-sm text-purple-300/70 ml-2">/ {plan.credits} 积分</span>
              </div>
              
              <p className="text-purple-300/70 text-sm mb-6">
                {plan.description}
              </p>
              
              <div className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <motion.div
                    key={feature}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.2 + i * 0.1 }}
                    className="flex items-center text-sm text-purple-300/90"
                  >
                    <svg className="w-4 h-4 mr-2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </motion.div>
                ))}
              </div>
              
              <motion.button
                onClick={() => handlePurchase(plan)}
                disabled={processing === plan.credits}
                className={`w-full py-3 rounded-xl bg-purple-500/20 text-purple-300 
                  hover:bg-purple-500/30 transition-all duration-300
                  border border-purple-500/30 text-sm font-medium
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${selectedPlan === index ? 'scale-105' : 'scale-100'}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {processing === plan.credits ? '处理中...' : '立即购买'}
              </motion.button>
              
              {/* 装饰性粒子 */}
              {selectedPlan === index && [...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-purple-400/30 rounded-full"
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
            </motion.div>
          ))}
        </div>

        {/* 底部说明 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center text-purple-300/50 text-sm"
        >
          <p>所有套餐均支持随时升级或续费</p>
          <p className="mt-2">如需企业定制方案，请联系我们的客服团队</p>
        </motion.div>
      </div>
    </div>
  )
} 