const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12
const TAG_LENGTH = 128

function getMasterKey(): string {
  const key = process.env.ENCRYPTION_KEY
  if (!key || key.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters')
  }
  return key
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}

function bufferToHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function deriveKey(masterKey: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(masterKey),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('central-stores-salt-v1'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encryptApiKey(plainText: string): Promise<string> {
  const masterKey = getMasterKey()
  const key = await deriveKey(masterKey)
  const encoder = new TextEncoder()

  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv, tagLength: TAG_LENGTH },
    key,
    encoder.encode(plainText)
  )

  // Combine IV + ciphertext, format: base64(iv:ciphertext)
  const ivHex = bufferToHex(iv)
  const ctHex = bufferToHex(new Uint8Array(ciphertext))

  return `${ivHex}:${ctHex}`
}

export async function decryptApiKey(encrypted: string): Promise<string> {
  const masterKey = getMasterKey()
  const key = await deriveKey(masterKey)

  const [ivHex, ctHex] = encrypted.split(':')
  if (!ivHex || !ctHex) {
    throw new Error('Invalid encrypted format')
  }

  const iv = hexToBuffer(ivHex)
  const ciphertext = hexToBuffer(ctHex)

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: iv as BufferSource, tagLength: TAG_LENGTH },
    key,
    ciphertext as BufferSource
  )

  return new TextDecoder().decode(decrypted)
}

export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) {
    return '****'
  }
  const prefix = apiKey.substring(0, 4)
  const suffix = apiKey.substring(apiKey.length - 4)
  return `${prefix}...${suffix}`
}
