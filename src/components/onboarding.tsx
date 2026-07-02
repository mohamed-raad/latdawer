'use client'

import { useState } from 'react'

interface OnboardingStep {
  id: string
  title: string
  titleAr: string
  description: string
  descriptionAr: string
  icon: string
  target?: string
}

const STORE_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Central Parts Finder',
    titleAr: 'مرحباً بك في سنترال بارتس فايندر',
    description: 'Let\'s set up your store in minutes',
    descriptionAr: 'دعنا نعد متجرك في دقائق',
    icon: '👋',
  },
  {
    id: 'store-profile',
    title: 'Store Profile',
    titleAr: 'ملف المتجر',
    description: 'Add your store name, description, and contact info',
    descriptionAr: 'أضف اسم متجرك ووصفه ومعلومات التواصل',
    icon: '🏪',
    target: '/dashboard/stores',
  },
  {
    id: 'add-inventory',
    title: 'Add Inventory',
    titleAr: 'إضافة المخزون',
    description: 'Add your parts with photos and prices',
    descriptionAr: 'أضف قطعك بصور وأسعار',
    icon: '📦',
    target: '/dashboard/inventory/new',
  },
  {
    id: 'ai-assistant',
    title: 'AI Assistant',
    titleAr: 'المساعد الذكي',
    description: 'Use AI to add items faster - just describe what you have',
    descriptionAr: 'استخدم المساعد الذكي لإضافة الأصناف بسرعة - فقط وصف ما عندك',
    icon: '🤖',
    target: '/dashboard/ai',
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp Integration',
    titleAr: 'تكامل واتساب',
    description: 'Receive orders directly on WhatsApp',
    descriptionAr: 'استقبل الطلبات مباشرة على واتساب',
    icon: '📱',
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    titleAr: 'كل شيء جاهز!',
    description: 'Your store is ready to receive orders',
    descriptionAr: 'متجرك جاهز لاستقبال الطلبات',
    icon: '🎉',
  },
]

const CUSTOMER_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome!',
    titleAr: 'مرحباً!',
    description: 'Find any part in seconds',
    descriptionAr: 'أي قطعة في ثوانٍ',
    icon: '👋',
  },
  {
    id: 'search',
    title: 'Search Parts',
    titleAr: 'ابحث عن القطع',
    description: 'Search by name, part number, or vehicle',
    descriptionAr: 'ابحث بالاسم أو رقم القطعة أو نوع السيارة',
    icon: '🔍',
    target: '/search',
  },
  {
    id: 'compare',
    title: 'Compare Prices',
    titleAr: 'قارن الأسعار',
    description: 'Find the best price across stores',
    descriptionAr: 'أفضل سعر بين المتاجر',
    icon: '💰',
  },
  {
    id: 'garage',
    title: 'My Garage',
    titleAr: 'مرآبي',
    description: 'Save your vehicles for quick part finding',
    descriptionAr: 'احفظ مركباتك للبحث السريع',
    icon: '🚗',
    target: '/garage',
  },
  {
    id: 'cart',
    title: 'Shopping Cart',
    titleAr: 'سلة المشتريات',
    description: 'Add parts and order via WhatsApp',
    descriptionAr: 'أضف القطع واطلب عبر واتساب',
    icon: '🛒',
  },
  {
    id: 'complete',
    title: 'Ready to Go!',
    titleAr: 'جاهز للبدء!',
    description: 'Start finding your parts',
    descriptionAr: 'ابدأ في العثور على قطعك',
    icon: '🚀',
  },
]

interface OnboardingProps {
  type: 'store' | 'customer'
  onComplete?: () => void
}

export function Onboarding({ type, onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = type === 'store' ? STORE_ONBOARDING_STEPS : CUSTOMER_ONBOARDING_STEPS
  const storageKey = `onboarding_${type}_completed`

  const [show, setShow] = useState(() => {
    if (typeof window === 'undefined') return false
    return !localStorage.getItem(storageKey)
  })

  const handleComplete = () => {
    localStorage.setItem(storageKey, 'true')
    setShow(false)
    onComplete?.()
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  if (!show) return null

  const step = steps[currentStep]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md rounded-2xl bg-background p-8 text-center shadow-xl">
        <button
          onClick={handleSkip}
          className="absolute top-4 left-4 text-sm text-muted-foreground hover:text-foreground"
        >
         تخطي
        </button>

        <div className="text-6xl mb-4">{step.icon}</div>
        <h2 className="text-xl font-bold mb-2">{step.titleAr}</h2>
        <p className="text-muted-foreground mb-6">{step.descriptionAr}</p>

        <div className="flex justify-center gap-2 mb-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-colors ${
                i === currentStep ? 'w-8 bg-foreground' : 'w-2 bg-muted'
              }`}
            />
          ))}
        </div>

        <div className="flex gap-2">
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex-1 rounded-lg border py-2 text-sm"
            >
              السابق
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 rounded-lg bg-foreground py-2 text-sm text-background"
          >
            {currentStep === steps.length - 1 ? 'ابدأ' : 'التالي'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function useOnboarding(type: 'store' | 'customer') {
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window === 'undefined') return false
    return !localStorage.getItem(`onboarding_${type}_completed`)
  })

  const completeOnboarding = () => {
    localStorage.setItem(`onboarding_${type}_completed`, 'true')
    setShowOnboarding(false)
  }

  const resetOnboarding = () => {
    localStorage.removeItem(`onboarding_${type}_completed`)
    setShowOnboarding(true)
  }

  return { showOnboarding, completeOnboarding, resetOnboarding }
}