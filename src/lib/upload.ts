import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const R2_ENDPOINT = process.env.R2_ENDPOINT
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME

if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  console.warn('R2 configuration missing. Image uploads will use local storage.')
}

const s3Client = R2_ENDPOINT
  ? new S3Client({
      region: 'auto',
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
      },
    })
  : null

export interface UploadResult {
  url: string
  key: string
}

export async function uploadImage(
  file: Buffer,
  fileName: string,
  contentType: string,
  folder: string = 'images'
): Promise<UploadResult> {
  if (!s3Client) {
    return uploadToLocal(file, fileName, folder)
  }

  const key = `${folder}/${Date.now()}-${fileName}`

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
  })

  await s3Client.send(command)

  const url = `${R2_ENDPOINT}/${R2_BUCKET_NAME}/${key}`

  return { url, key }
}

export async function deleteImage(key: string): Promise<void> {
  if (!s3Client) {
    return deleteFromLocal(key)
  }

  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  })

  await s3Client.send(command)
}

export async function getPresignedUploadUrl(
  fileName: string,
  contentType: string,
  folder: string = 'images'
): Promise<{ url: string; key: string }> {
  if (!s3Client) {
    throw new Error('R2 not configured')
  }

  const key = `${folder}/${Date.now()}-${fileName}`

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  })

  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 })

  return { url, key }
}

async function uploadToLocal(
  file: Buffer,
  fileName: string,
  folder: string
): Promise<UploadResult> {
  const fs = await import('fs/promises')
  const path = await import('path')

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder)
  await fs.mkdir(uploadDir, { recursive: true })

  const key = `${folder}/${Date.now()}-${fileName}`
  const filePath = path.join(process.cwd(), 'public', 'uploads', key)

  await fs.writeFile(filePath, file)

  const url = `/uploads/${key}`

  return { url, key }
}

async function deleteFromLocal(key: string): Promise<void> {
  const fs = await import('fs/promises')
  const path = await import('path')

  const filePath = path.join(process.cwd(), 'public', 'uploads', key)

  try {
    await fs.unlink(filePath)
  } catch {
    // File might not exist
  }
}