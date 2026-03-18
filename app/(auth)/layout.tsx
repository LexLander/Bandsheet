import AuthBrandBlock from '@/components/layout/AuthBrandBlock'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <AuthBrandBlock />
        </div>
        {children}
      </div>
    </div>
  )
}
