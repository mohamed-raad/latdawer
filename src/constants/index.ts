export const IRAQI_CITIES = [
  'بغداد', 'البصرة', 'نينوى', 'أربيل', 'كركوك',
  'الأنبار', 'بابل', 'كربلاء', 'النجف', 'ديالى',
  'ذي قار', 'السليمانية', 'دهوك', 'واسط', 'المثنى',
  'القادسية', 'صلاح الدين', 'ميسان',
]

export const CONDITION_LABELS: Record<string, string> = {
  new: 'نو',
  used: 'مستعمل',
  refurbished: 'مجدد',
  salvage: 'تشليح',
}

export const CONDITION_COLORS: Record<string, string> = {
  new: 'bg-green-100 text-green-800',
  used: 'bg-amber-100 text-amber-800',
  refurbished: 'bg-blue-100 text-blue-800',
  salvage: 'bg-gray-100 text-gray-800',
}

export const STATUS_LABELS: Record<string, string> = {
  active: 'متوفر',
  inactive: 'غير متوفر',
  out_of_stock: 'نفد',
}

export const STORE_STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الانتظار',
  verified: 'موثق',
  rejected: 'مرفوض',
}

export const STORE_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
  verified: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
}

export const ORIGIN_LABELS: Record<string, string> = {
  gcc: 'خليجي',
  iraqi: 'عراقي',
  usa: 'أمريكي',
  japan: 'ياباني',
  europe: 'أوروبي',
  china: 'صيني',
  korea: 'كوري',
  oem: 'أصلي',
  aftermarket: 'بديل',
}

export const QUICK_SEARCH_EXAMPLES = [
  { label: 'برقم القطعة', query: '27415-0W040' },
  { label: 'بالاسم', query: 'بكرة دينمو' },
  { label: 'بالماركة', query: 'تويوتا' },
]

export const INVENTORY_SORT_OPTIONS = [
  { value: 'price_asc', labelAr: 'السعر: الأقل أولاً', labelEn: 'Price: Low to High' },
  { value: 'price_desc', labelAr: 'السعر: الأعلى أولاً', labelEn: 'Price: High to Low' },
  { value: 'newest', labelAr: 'الأحدث', labelEn: 'Newest' },
  { value: 'quantity_desc', labelAr: 'الكمية: الأكثر أولاً', labelEn: 'Quantity: Most First' },
]