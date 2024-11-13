'use client'

import { useState } from 'react'
import Link from 'next/link'

interface PricingFeature {
  name: string
  basic: boolean
  pro: boolean
  enterprise: boolean
}

const features: PricingFeature[] = [
  { name: 'AI 对话', basic: true, pro: true, enterprise: true },
  { name: 'GPT-3.5 模型', basic: true, pro: true, enterprise: true },
  { name: '每日对话限制', basic: true, pro: false, enterprise: false },
  { name: 'GPT-4 模型', basic: false, pro: true, enterprise: true },
  { name: '文件处理能力', basic: false, pro: true, enterprise: true },
  { name: '图片生成', basic: false, pro: true, enterprise: true },
  { name: '高级 API 访问', basic: false, pro: false, enterprise: true },
  { name: '定制模型训练', basic: false, pro: false, enterprise: true },
  { name: '团队协作功能', basic: false, pro: false, enterprise: true },
  { name: '优先技术支持', basic: false, pro: true, enterprise: true },
]

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')

  const getPrice = (plan: 'basic' | 'pro' | 'enterprise') => {
    if (plan === 'basic') return '0'
    if (plan === 'pro') return billingPeriod === 'monthly' ? '99' : '990'
    return '定制'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black py-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-medium text-green-400 mb-4">选择适合您的方案</h1>
          <p className="text-green-400/70 mb-8">所有方案均提供 14 天免费试用</p>
          
          {/* 计费周期切换 */}
          <div className="inline-flex items-center bg-black/40 rounded-lg p-1 border border-green-500/20">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 rounded-md text-sm transition-colors ${
                billingPeriod === 'monthly'
                  ? 'bg-green-500/20 text-green-400'
                  : 'text-green-400/70 hover:text-green-400'
              }`}
            >
              月付
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-4 py-2 rounded-md text-sm transition-colors ${
                billingPeriod === 'yearly'
                  ? 'bg-green-500/20 text-green-400'
                  : 'text-green-400/70 hover:text-green-400'
              }`}
            >
              年付
              <span className="ml-1 text-xs text-green-500">省20%</span>
            </button>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* 基础版 */}
          <div className="bg-gray-900 rounded-xl border border-green-500/20 p-6 hover:border-green-500/40 transition-all hover:transform hover:scale-[1.02]">
            <h3 className="text-xl font-medium text-green-400 mb-2">基础版</h3>
            <div className="text-3xl text-green-500 mb-4">
              ¥{getPrice('basic')}
              <span className="text-sm text-green-400/70 ml-1">/{billingPeriod === 'monthly' ? '月' : '年'}</span>
            </div>
            <p className="text-sm text-green-400/70 mb-6">适合个人用户和学习使用</p>
            <div className="space-y-4 mb-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center text-sm">
                  {feature.basic ? (
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-green-500/30 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className={feature.basic ? 'text-green-400' : 'text-green-400/50'}>
                    {feature.name}
                  </span>
                </div>
              ))}
            </div>
            <Link
              href="/"
              className="block w-full py-2 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 text-center text-sm transition-colors"
            >
              开始使用
            </Link>
          </div>

          {/* 专业版 */}
          <div className="bg-gray-900 rounded-xl border border-green-500/30 p-6 transform scale-105 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-black text-xs px-3 py-1 rounded-full">
              最受欢迎
            </div>
            <h3 className="text-xl font-medium text-green-400 mb-2">专业版</h3>
            <div className="text-3xl text-green-500 mb-4">
              ¥{getPrice('pro')}
              <span className="text-sm text-green-400/70 ml-1">/{billingPeriod === 'monthly' ? '月' : '年'}</span>
            </div>
            <p className="text-sm text-green-400/70 mb-6">适合专业用户和小型团队</p>
            <div className="space-y-4 mb-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center text-sm">
                  {feature.pro ? (
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-green-500/30 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className={feature.pro ? 'text-green-400' : 'text-green-400/50'}>
                    {feature.name}
                  </span>
                </div>
              ))}
            </div>
            <Link
              href="/contact?plan=pro"
              className="block w-full py-2 rounded-lg bg-green-500 text-black hover:bg-green-600 text-center text-sm transition-colors"
            >
              立即升级
            </Link>
          </div>

          {/* 企业版 */}
          <div className="bg-gray-900 rounded-xl border border-green-500/20 p-6 hover:border-green-500/40 transition-all hover:transform hover:scale-[1.02]">
            <h3 className="text-xl font-medium text-green-400 mb-2">企业版</h3>
            <div className="text-3xl text-green-500 mb-4">
              {getPrice('enterprise')}
              <span className="text-sm text-green-400/70 ml-1">方案</span>
            </div>
            <p className="text-sm text-green-400/70 mb-6">适合大型企业和高级需求</p>
            <div className="space-y-4 mb-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center text-sm">
                  {feature.enterprise ? (
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-green-500/30 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className={feature.enterprise ? 'text-green-400' : 'text-green-400/50'}>
                    {feature.name}
                  </span>
                </div>
              ))}
            </div>
            <Link
              href="/contact?plan=enterprise"
              className="block w-full py-2 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 text-center text-sm transition-colors"
            >
              联系销售
            </Link>
          </div>
        </div>

        {/* FAQ 部分 */}
        <div className="mt-20">
          <h2 className="text-2xl font-medium text-green-400 text-center mb-8">常见问题</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-900/50 rounded-lg p-6 border border-green-500/20">
              <h3 className="text-green-400 font-medium mb-2">如何开始使用？</h3>
              <p className="text-green-400/70 text-sm">注册账号后即可开始 14 天免费试用，无需信用卡。试用期间可以体验所有专业版功能。</p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-6 border border-green-500/20">
              <h3 className="text-green-400 font-medium mb-2">可以随时更改计划吗？</h3>
              <p className="text-green-400/70 text-sm">是的，您可以随时升级或降级您的计划。费用会按比例计算。</p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-6 border border-green-500/20">
              <h3 className="text-green-400 font-medium mb-2">支持哪些付款方式？</h3>
              <p className="text-green-400/70 text-sm">我们支持支付宝、微信支付、银行卡等多种付款方式。企业用户可以申请对公转账。</p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-6 border border-green-500/20">
              <h3 className="text-green-400 font-medium mb-2">有退款政策吗？</h3>
              <p className="text-green-400/70 text-sm">如果您在购买后 7 天内不满意，我们提供无条件退款。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 