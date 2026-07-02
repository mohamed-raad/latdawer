import { NextRequest, NextResponse } from 'next/server'
import { autoFetchPartPhotos, saveAutoFetchedPhotos } from '@/features/ai/photo-fetch'
import { rewriteToIraqiDialect } from '@/features/ai/iraqi-dialect'

interface AutoEnhanceRequest {
  partId: string
  inventoryId: string
  storeId: string
  partNameAr: string
  partNumber: string | null
  make: string
  model: string
  year: string
}

interface AutoEnhanceResponse {
  success: boolean
  photoUrls: string[]
  iraqiName: string
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<AutoEnhanceResponse>> {
  try {
    const body: AutoEnhanceRequest = await request.json()

    const { partId, inventoryId, storeId, partNameAr, partNumber, make, model, year } = body

    if (!partId || !inventoryId || !storeId || !partNameAr) {
      return NextResponse.json({
        success: false,
        photoUrls: [],
        iraqiName: '',
        error: 'Missing required fields',
      }, { status: 400 })
    }

    const photoUrls = await autoFetchPartPhotos(partNameAr, partNumber, make, model, year)

    if (photoUrls.length > 0) {
      await saveAutoFetchedPhotos(partId, inventoryId, storeId, photoUrls)
    }

    const iraqiName = await rewriteToIraqiDialect(partNameAr)

    return NextResponse.json({
      success: true,
      photoUrls,
      iraqiName,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      photoUrls: [],
      iraqiName: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
