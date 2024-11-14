'use client'

import { useState } from 'react'
import { auth } from '@/lib/firebase'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  PhoneAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier
} from 'firebase/auth'
import { motion, AnimatePresence } from 'framer-motion'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

type AuthMode = 'login' | 'register' | 'phone' | 'forgot' | 'reset'

// 添加国家代码类型
type CountryCode = {
  code: string;
  name: string;
  prefix: string;
};

// 支持的国家代码列表
const countryCodes: CountryCode[] = [
  { code: 'CN', name: '中国', prefix: '+86' },
  { code: 'US', name: '美国', prefix: '+1' },
  { code: 'HK', name: '香港', prefix: '+852' },
  { code: 'TW', name: '台湾', prefix: '+886' },
  { code: 'JP', name: '日本', prefix: '+81' },
  { code: 'KR', name: '韩国', prefix: '+82' },
];

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmationResult, setConfirmationResult] = useState<any>(null)
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(countryCodes[0]);
  const [showCountryList, setShowCountryList] = useState(false);

  // 初始化 reCAPTCHA
  const setupRecaptcha = () => {
    try {
      // 清除现有的 reCAPTCHA
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear()
      }

      // 设置 reCAPTCHA verifier
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'normal',
        'callback': () => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
          setError('')
        },
        'expired-callback': () => {
          setError('reCAPTCHA 已过期，请重试')
          if ((window as any).recaptchaVerifier) {
            (window as any).recaptchaVerifier.clear()
          }
        }
      })

      return true
    } catch (error) {
      console.error('reCAPTCHA 初始化失败:', error)
      setError('reCAPTCHA 初始化失败，请刷新页面重试')
      return false
    }
  }

  // 格式化手机号为 E.164 格式
  const formatPhoneNumber = (phone: string) => {
    // 移除所有非数字字符
    const digits = phone.replace(/\D/g, '');
    
    // 根据不同国家的手机号规则验证
    switch (selectedCountry.code) {
      case 'CN':
        // 中国手机号：11位数字，以1开头
        if (/^1\d{10}$/.test(digits)) {
          return `${selectedCountry.prefix}${digits}`;
        }
        break;
      case 'US':
        // 美国手机号：10位数字
        if (/^\d{10}$/.test(digits)) {
          return `${selectedCountry.prefix}${digits}`;
        }
        break;
      case 'HK':
        // 香港手机号：8位数字
        if (/^\d{8}$/.test(digits)) {
          return `${selectedCountry.prefix}${digits}`;
        }
        break;
      // ... 可以添加其他国家的验证规则
      default:
        // 默认规则：至少7位数字
        if (/^\d{7,}$/.test(digits)) {
          return `${selectedCountry.prefix}${digits}`;
        }
    }
    return null;
  };

  // 验证手机号格式
  const isValidPhoneNumber = (phone: string): boolean => {
    switch (selectedCountry.code) {
      case 'CN':
        return /^1\d{10}$/.test(phone);
      case 'US':
        return /^\d{10}$/.test(phone);
      case 'HK':
        return /^\d{8}$/.test(phone);
      default:
        return /^\d{7,}$/.test(phone);
    }
  };

  // 获取手机号输入提示
  const getPhoneNumberHint = (): string => {
    switch (selectedCountry.code) {
      case 'CN':
        return '请输入11位手机号';
      case 'US':
        return '请输入10位手机号';
      case 'HK':
        return '请输入8位手机号';
      default:
        return '请输入有效的手机号';
    }
  };

  // 发送验证码
  const handleSendVerificationCode = async () => {
    try {
      setLoading(true)
      setError('')
      
      const formattedPhone = formatPhoneNumber(phone)
      if (!formattedPhone) {
        setError('请输入正确的手机号码')
        return
      }

      // 如果是测试手机号，直接模拟发送成功
      if (formattedPhone === '+18143215634') {
        setConfirmationResult({
          confirm: async (code: string) => {
            if (code === '666666') {
              // 测试验证码正确
              return Promise.resolve()
            } else {
              // 测试验证码错误
              return Promise.reject(new Error('Invalid verification code'))
            }
          }
        })
        setMessage('验证码已发送到您的手机')
        return
      }

      // 初始化 reCAPTCHA
      if (!setupRecaptcha()) return

      // 发送验证码
      const appVerifier = (window as any).recaptchaVerifier
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier)
      setConfirmationResult(confirmation)
      setMessage('验证码已发送到您的手机')

    } catch (error: any) {
      console.error('发送验证码失败:', error)
      if (error.code === 'auth/invalid-phone-number') {
        setError('无效的手机号码')
      } else if (error.code === 'auth/too-many-requests') {
        setError('发送次数过多，请稍后再试')
      } else {
        setError('发送验证码失败，请重试')
      }
      
      // 清除 reCAPTCHA
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear()
        // 重置 reCAPTCHA
        if ((window as any).grecaptcha) {
          (window as any).grecaptcha.reset((window as any).recaptchaWidgetId)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  // 验证码登录
  const handlePhoneSignIn = async () => {
    if (!confirmationResult) {
      setError('请先获取验证码')
      return
    }

    try {
      setLoading(true)
      await confirmationResult.confirm(verificationCode)
      onClose()
    } catch (error) {
      console.error('验证码验证失败:', error)
      setError('验证码错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 邮箱密码登录
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password)
        onClose()
      } else if (mode === 'register') {
        await createUserWithEmailAndPassword(auth, email, password)
        onClose()
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '认证失败')
    } finally {
      setLoading(false)
    }
  }

  // Google 登录
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      onClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Google 登录失败')
    } finally {
      setLoading(false)
    }
  }

  // 发送重置密码邮件
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError('请输入邮箱地址')
      return
    }

    try {
      setLoading(true)
      await sendPasswordResetEmail(auth, email)
      setMessage('重置密码链接已发送到您的邮箱')
      setTimeout(() => setMode('login'), 3000)
    } catch (error) {
      setError(error instanceof Error ? error.message : '发送重置邮件失败')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-md"
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-black/60 p-8 rounded-2xl border border-purple-500/30 w-full max-w-md 
            shadow-2xl shadow-purple-500/10 backdrop-blur-xl"
        >
          <h2 className="text-3xl font-bold text-purple-300 mb-8 font-mono text-center">
            {mode === 'login' && '欢迎回来'}
            {mode === 'register' && '创建账号'}
            {mode === 'phone' && '手机号登录'}
            {mode === 'forgot' && '重置密码'}
          </h2>

          {mode === 'phone' ? (
            <div className="space-y-6">
              <div>
                <div className="relative">
                  {/* 国家选择下拉框 */}
                  <div className="absolute left-0 top-0 bottom-0 flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowCountryList(!showCountryList)}
                      className="flex items-center space-x-1 px-3 py-2 text-purple-300 hover:bg-purple-500/10 
                        rounded-l-xl transition-colors"
                    >
                      <span>{selectedCountry.prefix}</span>
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>

                  {/* 国家列表弹出框 */}
                  {showCountryList && (
                    <div className="absolute left-0 top-full mt-1 w-48 bg-black/90 border border-purple-500/30 
                      rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto backdrop-blur-xl">
                      {countryCodes.map((country) => (
                        <button
                          key={country.code}
                          onClick={() => {
                            setSelectedCountry(country);
                            setShowCountryList(false);
                          }}
                          className="w-full px-4 py-2 text-left text-purple-300 hover:bg-purple-500/20 
                            flex items-center space-x-2"
                        >
                          <span>{country.name}</span>
                          <span className="text-purple-300/70">{country.prefix}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* 手机号输入框 */}
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setPhone(value);
                    }}
                    placeholder={getPhoneNumberHint()}
                    className="w-full bg-black/50 text-purple-300 placeholder-purple-500/50 rounded-xl 
                      px-4 py-3 pl-20 border border-purple-500/30 focus:outline-none 
                      focus:border-purple-500/50 font-mono focus:ring-2 focus:ring-purple-500/20 
                      transition-all"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    required
                  />
                </div>

                {/* 手机号格式提示 */}
                {phone && !isValidPhoneNumber(phone) && (
                  <p className="mt-1 text-xs text-red-400">
                    {getPhoneNumberHint()}
                  </p>
                )}
              </div>
              
              {/* reCAPTCHA 容器 */}
              <div 
                id="recaptcha-container" 
                className="flex justify-center items-center min-h-[100px] bg-black/20 rounded-lg my-4"
              ></div>

              {!confirmationResult ? (
                <button
                  onClick={handleSendVerificationCode}
                  disabled={loading || !phone || !isValidPhoneNumber(phone)}
                  className="w-full py-3 rounded-xl bg-purple-500/20 text-purple-300 
                    hover:bg-purple-500/30 transition-all duration-300 font-mono
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '发送中...' : '发送验证码'}
                </button>
              ) : (
                <>
                  <div>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="验证码"
                      className="w-full bg-black/50 text-purple-300 placeholder-purple-500/50 rounded-xl px-4 py-3 
                        border border-purple-500/30 focus:outline-none focus:border-purple-500/50 font-mono
                        focus:ring-2 focus:ring-purple-500/20 transition-all"
                      required
                    />
                  </div>
                  <button
                    onClick={handlePhoneSignIn}
                    disabled={loading || !verificationCode}
                    className="w-full py-3 rounded-xl bg-purple-500/20 text-purple-300 
                      hover:bg-purple-500/30 transition-all duration-300 font-mono
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '验证中...' : '登录'}
                  </button>
                </>
              )}
            </div>
          ) : mode === 'forgot' ? (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="邮箱地址"
                  className="w-full bg-black/50 text-purple-300 placeholder-purple-500/50 rounded-xl px-4 py-3 
                    border border-purple-500/30 focus:outline-none focus:border-purple-500/50 font-mono
                    focus:ring-2 focus:ring-purple-500/20 transition-all"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-purple-500/20 text-purple-300 
                  hover:bg-purple-500/30 transition-all duration-300 font-mono
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '发送中...' : '发送重置链接'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleEmailAuth} className="space-y-6">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="邮箱地址"
                  className="w-full bg-black/50 text-purple-300 placeholder-purple-500/50 rounded-xl px-4 py-3 
                    border border-purple-500/30 focus:outline-none focus:border-purple-500/50 font-mono
                    focus:ring-2 focus:ring-purple-500/20 transition-all"
                  required
                />
              </div>
              
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="密码"
                  className="w-full bg-black/50 text-purple-300 placeholder-purple-500/50 rounded-xl px-4 py-3 
                    border border-purple-500/30 focus:outline-none focus:border-purple-500/50 font-mono
                    focus:ring-2 focus:ring-purple-500/20 transition-all"
                  required
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-purple-500/20 text-purple-300 
                  hover:bg-purple-500/30 transition-all duration-300 font-mono
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
              </motion.button>
            </form>
          )}

          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-purple-500/20"></div>
            <span className="px-4 text-purple-500/50 text-sm font-mono">或</span>
            <div className="flex-1 border-t border-purple-500/20"></div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-white/5 text-purple-300 border border-purple-500/30 
              hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-2 font-mono
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
            </svg>
            使用 Google 账号登录
          </motion.button>

          <div className="mt-6 text-center space-y-2">
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-purple-400/70 hover:text-purple-400 text-sm font-mono transition-colors"
            >
              {mode === 'login' ? '没有账号？点击注册' : '已有账号？点击录'}
            </button>
            
            <button
              onClick={() => setMode('phone')}
              className="block w-full text-purple-400/70 hover:text-purple-400 text-sm font-mono transition-colors"
            >
              使用手机号登录
            </button>
            
            {mode === 'login' && (
              <button
                onClick={() => setMode('forgot')}
                className="block w-full text-purple-400/70 hover:text-purple-400 text-sm font-mono transition-colors"
              >
                忘记密码？
              </button>
            )}
          </div>

          {(error || message) && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 text-sm text-center font-mono ${
                error ? 'text-red-400' : 'text-green-400'
              }`}
            >
              {error || message}
            </motion.p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
} 