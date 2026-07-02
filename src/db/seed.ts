import { db } from './index'
import { categories, manufacturers, parts, vehicles, compatibility, stores, inventory, users, partAlternatives } from './schema'
import bcrypt from 'bcryptjs'

async function seed() {
  console.log('Seeding database...')

  const now = new Date()

  const [admin] = await db.insert(users).values({
    id: crypto.randomUUID(),
    email: 'mr991199@gmail.com',
    passwordHash: await bcrypt.hash('moha99raadA@', 12),
    name: 'مصطفى رعد',
    role: 'Admin',
    city: 'البصرة',
    createdAt: now,
    updatedAt: now,
  }).returning()
  console.log(`Created admin user: ${admin.email}`)

  const [cat1] = await db.insert(categories).values({
    id: crypto.randomUUID(), name: 'Auto Parts', nameAr: 'قطع سيارات', slug: 'auto-parts', createdAt: now,
  }).returning()

  const [cat2] = await db.insert(categories).values({
    id: crypto.randomUUID(), name: 'Electrical', nameAr: 'كهربائيات', slug: 'electrical', createdAt: now,
  }).returning()

  const [cat3] = await db.insert(categories).values({
    id: crypto.randomUUID(), name: 'Tools', nameAr: 'عدد صناعية', slug: 'tools', createdAt: now,
  }).returning()

  const brandData = [
    { name: 'Toyota', nameAr: 'تويوتا', slug: 'toyota', country: 'Japan' },
    { name: 'Nissan', nameAr: 'نيسان', slug: 'nissan', country: 'Japan' },
    { name: 'Hyundai', nameAr: 'هيونداي', slug: 'hyundai', country: 'South Korea' },
    { name: 'Kia', nameAr: 'كيا', slug: 'kia', country: 'South Korea' },
    { name: 'Chevrolet', nameAr: 'شيفروليه', slug: 'chevrolet', country: 'USA' },
    { name: 'Ford', nameAr: 'فورد', slug: 'ford', country: 'USA' },
    { name: 'BMW', nameAr: 'بي إم دبليو', slug: 'bmw', country: 'Germany' },
    { name: 'Mercedes', nameAr: 'مرسيدس', slug: 'mercedes', country: 'Germany' },
    { name: 'Honda', nameAr: 'هوندا', slug: 'honda', country: 'Japan' },
    { name: 'Mitsubishi', nameAr: 'ميتسوبيشي', slug: 'mitsubishi', country: 'Japan' },
    { name: 'Suzuki', nameAr: 'سوزوكي', slug: 'suzuki', country: 'Japan' },
    { name: 'Mazda', nameAr: 'مازدا', slug: 'mazda', country: 'Japan' },
    { name: 'Volkswagen', nameAr: 'فولكس فاجن', slug: 'volkswagen', country: 'Germany' },
    { name: 'Renault', nameAr: 'رينو', slug: 'renault', country: 'France' },
    { name: 'Peugeot', nameAr: 'بيجو', slug: 'peugeot', country: 'France' },
    { name: 'Bosch', nameAr: 'بوش', slug: 'bosch', country: 'Germany' },
  ]

  const createdBrands: { id: string; name: string; nameAr: string; slug: string; country: string | null; createdAt: Date }[] = []
  for (const b of brandData) {
    const [mfr] = await db.insert(manufacturers).values({
      id: crypto.randomUUID(), ...b, createdAt: now,
    }).returning()
    createdBrands.push(mfr)
  }
  console.log(`Created ${createdBrands.length} manufacturers`)

  function findBrand(name: string) {
    return createdBrands.find((b) => b.name === name)!.id
  }

  const partsData = [
    { nameAr: 'بكرة دينمو', nameEn: 'Alternator Pulley', partNumber: '27415-0W040', oemNumber: '274150W040', categoryId: cat1.id, manufacturerId: findBrand('Toyota'), brand: 'Toyota', tags: JSON.stringify(['بكرة', 'دينمو', 'alternator', 'pulley']), alternativeNames: JSON.stringify(['OAP', 'Freewheel Pulley', 'Overrunning Alternator Pulley']) },
    { nameAr: 'فلتر زيت', nameEn: 'Oil Filter', partNumber: '04152-0V010', oemNumber: '041520V010', categoryId: cat1.id, manufacturerId: findBrand('Toyota'), brand: 'Toyota', tags: JSON.stringify(['فلتر', 'زيت', 'oil', 'filter']), alternativeNames: JSON.stringify(['Oil Filter Element', 'فلتر زيت محرك']) },
    { nameAr: 'بواجي شرارة', nameEn: 'Spark Plug', partNumber: '90919-01251', oemNumber: '9091901251', categoryId: cat1.id, manufacturerId: findBrand('Bosch'), brand: 'Bosch', tags: JSON.stringify(['بواجي', 'شرارة', 'spark', 'plug']), alternativeNames: JSON.stringify(['شمعة احتراق', 'Spark Plug Iridium']) },
    { nameAr: 'بطارية سيارة', nameEn: 'Car Battery', partNumber: 'BATT-55D23L', oemNumber: '55D23L', categoryId: cat2.id, manufacturerId: findBrand('Bosch'), brand: 'Bosch', tags: JSON.stringify(['بطارية', 'battery', 'car']), alternativeNames: JSON.stringify(['بطارية 55 أمبير', 'Battery 55Ah']) },
    { nameAr: 'دينمو', nameEn: 'Alternator', partNumber: 'ALT-27060-0C010', oemNumber: '270600C010', categoryId: cat1.id, manufacturerId: findBrand('Toyota'), brand: 'Toyota', tags: JSON.stringify(['دينمو', 'alternator']), alternativeNames: JSON.stringify(['مولد كهرباء', 'Generator']) },
    { nameAr: 'مكينة مساحات', nameEn: 'Wiper Motor', partNumber: 'WM-85110-0K020', oemNumber: '851100K020', categoryId: cat2.id, manufacturerId: findBrand('Toyota'), brand: 'Toyota', tags: JSON.stringify(['مساحات', 'wiper', 'motor']), alternativeNames: JSON.stringify(['محرك مساحات', 'Wiper Blade Motor']) },
    { nameAr: 'طقم عدة يدوية', nameEn: 'Tool Set', partNumber: 'TLS-100PC', oemNumber: '', categoryId: cat3.id, manufacturerId: findBrand('Bosch'), brand: 'Bosch', tags: JSON.stringify(['عدد', 'tools', 'set']), alternativeNames: JSON.stringify(['طقم أدوات', 'Socket Set']) },
    { nameAr: 'بواجي ديزل', nameEn: 'Glow Plug', partNumber: 'GP-19878-1', oemNumber: '198781', categoryId: cat1.id, manufacturerId: findBrand('Bosch'), brand: 'Bosch', tags: JSON.stringify(['ديزل', 'glow', 'plug', 'بواجي']), alternativeNames: JSON.stringify(['شمعة توهج', 'Diesel Glow Plug']) },
  ]

  const createdParts = []
  for (const p of partsData) {
    const [part] = await db.insert(parts).values({
      id: crypto.randomUUID(), ...p, condition: 'new', origin: 'OEM', createdAt: now, updatedAt: now,
    }).returning()
    createdParts.push(part)
  }

  console.log(`Created ${createdParts.length} parts`)

  const [store1] = await db.insert(stores).values({
    id: crypto.randomUUID(),
    name: 'Al-Rashed Auto Parts', nameAr: 'مؤسسة الراشد لقطع الغيار',
    description: 'Leading supplier of genuine auto parts in the Eastern Province',
    descriptionAr: 'المورد الرائد لقطع الغيار الأصلية في المنطقة الشرقية',
    address: 'King Fahd Road, Dammam',
    city: 'الدمام',
    phone: '+966500000001', whatsapp: '+966500000001',
    workingHours: 'Sat-Thu 8:00AM-8:00PM', verified: 'verified', rating: '4.5',
    ownerId: null, createdAt: now, updatedAt: now,
  }).returning()

  const [store2] = await db.insert(stores).values({
    id: crypto.randomUUID(),
    name: 'Bosch Service Center', nameAr: 'مركز بوش للخدمة',
    description: 'Authorized Bosch service center and parts dealer',
    descriptionAr: 'مركز خدمة وقطع غيار بوش المعتمد',
    address: 'Olaya Street, Riyadh',
    city: 'الرياض',
    phone: '+966500000002', whatsapp: '+966500000002',
    workingHours: 'Sat-Thu 9:00AM-9:00PM', verified: 'verified', rating: '4.8',
    ownerId: null, createdAt: now, updatedAt: now,
  }).returning()

  const [store3] = await db.insert(stores).values({
    id: crypto.randomUUID(),
    name: 'Al-Haramain Salvage Yard', nameAr: 'مؤسسة الحرمين للتشليح',
    description: 'Specialized in used and salvaged parts from GCC vehicles',
    descriptionAr: 'متخصصون في قطع الغيار المستعملة والمشلحة من سيارات الخليج',
    address: 'Abu Hadriyah Highway, Jubail',
    city: 'الجبيل',
    phone: '+966500000003', whatsapp: '+966500000003',
    workingHours: 'Sat-Thu 7:00AM-6:00PM', verified: 'verified', rating: '4.2',
    ownerId: null, createdAt: now, updatedAt: now,
  }).returning()

  console.log('Created 3 stores')

  const inventoryData = [
    { partId: createdParts[0].id, storeId: store1.id, price: 120, quantity: 50, condition: 'new' },
    { partId: createdParts[1].id, storeId: store1.id, price: 35, quantity: 200, condition: 'new' },
    { partId: createdParts[3].id, storeId: store1.id, price: 250, quantity: 30, condition: 'new' },
    { partId: createdParts[4].id, storeId: store1.id, price: 450, quantity: 15, condition: 'new' },
    { partId: createdParts[5].id, storeId: store1.id, price: 180, quantity: 25, condition: 'new' },
    { partId: createdParts[2].id, storeId: store2.id, price: 45, quantity: 300, condition: 'new' },
    { partId: createdParts[3].id, storeId: store2.id, price: 280, quantity: 40, condition: 'new' },
    { partId: createdParts[6].id, storeId: store2.id, price: 150, quantity: 100, condition: 'new' },
    { partId: createdParts[7].id, storeId: store2.id, price: 55, quantity: 150, condition: 'new' },
    { partId: createdParts[0].id, storeId: store3.id, price: 65, quantity: 5, condition: 'used' },
    { partId: createdParts[1].id, storeId: store3.id, price: 15, quantity: 8, condition: 'used' },
    { partId: createdParts[4].id, storeId: store3.id, price: 180, quantity: 3, condition: 'salvage' },
    { partId: createdParts[5].id, storeId: store3.id, price: 75, quantity: 6, condition: 'used' },
  ]

  for (const inv of inventoryData) {
    await db.insert(inventory).values({
      id: crypto.randomUUID(), ...inv, currency: 'IQD', status: 'active', createdAt: now, updatedAt: now,
    })
  }

  console.log(`Created ${inventoryData.length} inventory items`)

  const vehicleData = [
    { make: 'Toyota', makeAr: 'تويوتا', model: 'Land Cruiser', modelAr: 'لاند كروزر', year: '2024', engine: '4.0L V6', trim: 'GXR', region: 'GCC' },
    { make: 'Toyota', makeAr: 'تويوتا', model: 'Camry', modelAr: 'كامري', year: '2024', engine: '2.5L 4-cyl', trim: 'LE', region: 'GCC' },
    { make: 'Nissan', makeAr: 'نيسان', model: 'Patrol', modelAr: 'باترول', year: '2024', engine: '4.0L V6', trim: 'XE', region: 'GCC' },
    { make: 'Hyundai', makeAr: 'هيونداي', model: 'Sonata', modelAr: 'سوناتا', year: '2024', engine: '2.5L 4-cyl', trim: 'GL', region: 'GCC' },
    { make: 'Toyota', makeAr: 'تويوتا', model: 'Corolla', modelAr: 'كورولا', year: '2024', engine: '1.8L 4-cyl', trim: 'LE', region: 'GCC' },
    { make: 'Nissan', makeAr: 'نيسان', model: 'Sunny', modelAr: 'صني', year: '2024', engine: '1.5L 4-cyl', trim: 'S', region: 'GCC' },
  ]

  const createdVehicles = []
  for (const v of vehicleData) {
    const [vehicle] = await db.insert(vehicles).values({
      id: crypto.randomUUID(), ...v, createdAt: now,
    }).returning()
    createdVehicles.push(vehicle)
  }

  console.log(`Created ${createdVehicles.length} vehicles`)

  const compatibilityData = [
    { partId: createdParts[0].id, vehicleId: createdVehicles[0].id },
    { partId: createdParts[0].id, vehicleId: createdVehicles[1].id },
    { partId: createdParts[1].id, vehicleId: createdVehicles[0].id },
    { partId: createdParts[1].id, vehicleId: createdVehicles[4].id },
    { partId: createdParts[2].id, vehicleId: createdVehicles[0].id },
    { partId: createdParts[2].id, vehicleId: createdVehicles[1].id },
    { partId: createdParts[2].id, vehicleId: createdVehicles[4].id },
    { partId: createdParts[4].id, vehicleId: createdVehicles[0].id },
    { partId: createdParts[4].id, vehicleId: createdVehicles[2].id },
    { partId: createdParts[5].id, vehicleId: createdVehicles[1].id },
    { partId: createdParts[5].id, vehicleId: createdVehicles[4].id },
    { partId: createdParts[7].id, vehicleId: createdVehicles[2].id },
    { partId: createdParts[2].id, vehicleId: createdVehicles[3].id },
  ]

  for (const c of compatibilityData) {
    await db.insert(compatibility).values({
      id: crypto.randomUUID(), ...c, createdAt: now,
    })
  }

  console.log(`Created ${compatibilityData.length} compatibility links`)

  const alternativesData = [
    { partId: createdParts[0].id, altPartId: createdParts[4].id, type: 'equivalent' as const, notes: 'بكرة الدينمو بديلة عن الدينمو الكامل' },
    { partId: createdParts[2].id, altPartId: createdParts[7].id, type: 'equivalent' as const, notes: 'شمعات احتراق بديلة' },
    { partId: createdParts[1].id, altPartId: createdParts[0].id, type: 'replaces' as const, notes: 'فلتر زيت مع بكرة الدينمو' },
  ]

  for (const alt of alternativesData) {
    await db.insert(partAlternatives).values([{
      id: crypto.randomUUID(),
      partId: alt.partId,
      altPartId: alt.altPartId,
      type: alt.type,
      notes: alt.notes,
      createdAt: now,
    }, {
      id: crypto.randomUUID(),
      partId: alt.altPartId,
      altPartId: alt.partId,
      type: alt.type,
      notes: alt.notes,
      createdAt: now,
    }])
  }

  console.log(`Created ${alternativesData.length} alternative links`)
  console.log('Seed complete!')
}

seed().catch(console.error)
