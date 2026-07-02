import { getCloudflareContext } from '@opennextjs/cloudflare'

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
  const { env } = getCloudflareContext()
  const key = `${folder}/${Date.now()}-${fileName}`

  await env.R2_STORAGE.put(key, file, {
    httpMetadata: { contentType },
  })

  const bucketName = env.R2_BUCKET_NAME || 'central-parts-finder'
  const url = `https://${bucketName}.r2.dev/${key}`

  return { url, key }
}

export async function deleteImage(key: string): Promise<void> {
  const { env } = getCloudflareContext()
  await env.R2_STORAGE.delete(key)
}

export async function getPresignedUploadUrl(
  fileName: string,
  contentType: string,
  folder: string = 'images'
): Promise<{ url: string; key: string }> {
  const { env } = getCloudflareContext()
  const key = `${folder}/${Date.now()}-${fileName}`

  const bucketName = env.R2_BUCKET_NAME || 'central-parts-finder'
  const url = `https://${bucketName}.r2.dev/${key}?contentType=${encodeURIComponent(contentType)}`

  return { url, key }
}
