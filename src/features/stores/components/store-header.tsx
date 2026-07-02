import { STORE_STATUS_LABELS, STORE_STATUS_COLORS } from '@/constants'

interface StoreHeaderProps {
  store: {
    id: string
    nameAr: string | null
    name: string
    logo: string | null
    verified: string
    rating: string | null
    descriptionAr: string | null
    description: string | null
  }
}

export function StoreHeader({ store }: StoreHeaderProps) {
  const storeName = store.nameAr || store.name

  return (
    <div className="rounded-xl border p-6">
      {store.logo ? (
        <img
          src={store.logo}
          alt={storeName}
          className="mx-auto h-24 w-24 rounded-full object-cover"
        />
      ) : (
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm">
          شعار
        </div>
      )}

      <h1 className="mt-4 text-center text-2xl font-bold">{storeName}</h1>

      <div className="mt-2 flex items-center justify-center gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${STORE_STATUS_COLORS[store.verified] ?? ''}`}
        >
          {STORE_STATUS_LABELS[store.verified] ?? store.verified}
        </span>
        {store.rating && Number(store.rating) > 0 && (
          <span className="text-sm text-muted-foreground">
            {'★'.repeat(Math.round(Number(store.rating)))}
            {'☆'.repeat(5 - Math.round(Number(store.rating)))}
            {' '}{store.rating}
          </span>
        )}
      </div>

      {(store.descriptionAr || store.description) && (
        <p className="mt-4 text-sm leading-relaxed">{store.descriptionAr || store.description}</p>
      )}
    </div>
  )
}