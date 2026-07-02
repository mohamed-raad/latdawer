import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <h2 className="mt-4 text-2xl font-bold">الصفحة غير موجودة</h2>
      <p className="mt-2 text-muted-foreground">
        عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-foreground px-6 py-3 text-background hover:opacity-90"
      >
        العودة للرئيسية
      </Link>
    </div>
  )
}