import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    // In Cloudflare Workers, we need to handle R2 directly
    // For local dev, we'll use the filesystem
    // For production, this will be handled by the worker

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate a unique filename
    const ext = file.name.split('.').pop() || 'webp'
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`
    const key = `uploads/${filename}`

    // Try to use R2 if configured
    const R2_ENDPOINT = process.env.R2_ENDPOINT
    const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
    const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
    const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME

    if (R2_ENDPOINT && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME) {
      // Use R2
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')
      
      const s3Client = new S3Client({
        region: 'auto',
        endpoint: R2_ENDPOINT,
        credentials: {
          accessKeyId: R2_ACCESS_KEY_ID,
          secretAccessKey: R2_SECRET_ACCESS_KEY,
        },
      })

      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })

      await s3Client.send(command)

      const url = `${R2_ENDPOINT}/${R2_BUCKET_NAME}/${key}`
      return NextResponse.json({ url })
    } else {
      // Fallback to local filesystem
      const { writeFile, mkdir } = await import('fs/promises')
      const { existsSync } = await import('fs')
      const path = await import('path')

      const uploadDir = path.join(process.cwd(), 'public', 'uploads')
      if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true })
      await writeFile(path.join(uploadDir, filename), buffer)

      return NextResponse.json({ url: `/uploads/${filename}` })
    }
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}