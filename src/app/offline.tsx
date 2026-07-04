export default function OfflinePage() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">📡</div>
        <h1 className="text-2xl font-bold mb-2">لا يوجد اتصال</h1>
        <p className="text-muted-foreground mb-6">تحقق من اتصالك بالإنترنت وحاول مرة أخرى</p>
        <button onClick={() => window.location.reload()} className="rounded-xl bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90 transition-opacity">إعادة المحاولة</button>
      </div>
    </div>
  )
}
