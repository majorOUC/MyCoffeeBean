const TOKEN_EXPIRY = 7 * 24 * 60 * 60 // 秒，7 天

/** 用户信息（从 JWT 中解析） */
export interface AuthUser {
  id: string
  username: string
  displayName: string
  role: 'admin' | 'publisher' | 'user'
}

/** 密码哈希（PBKDF2-SHA256，Workers 原生支持） */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  )
  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations: 100000,
    },
    keyMaterial,
    256,
  )
  const hashArray = new Uint8Array(hash)
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  const hashHex = Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `${saltHex}:${hashHex}`
}

/** 验证密码 */
export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const [saltHex, hashHex] = storedHash.split(':')
  if (!saltHex || !hashHex) return false

  const salt = new Uint8Array(
    saltHex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)),
  )
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  )
  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations: 100000,
    },
    keyMaterial,
    256,
  )
  const hashArray = new Uint8Array(hash)
  const computedHashHex = Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return computedHashHex === hashHex
}

/** 创建 JWT token（secret 来自环境绑定，不写入源码） */
export async function createToken(
  user: AuthUser,
  secret: string,
): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' }
  const payload = {
    sub: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY,
  }

  const headerB64 = btoa(JSON.stringify(header))
  const payloadB64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
  const message = `${headerB64}.${payloadB64}`

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))

  return `${message}.${signatureB64}`
}

/** 验证 JWT token */
export async function verifyToken(
  token: string,
  secret: string,
): Promise<AuthUser | null> {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.')
    if (!headerB64 || !payloadB64 || !signatureB64) return null

    const message = `${headerB64}.${payloadB64}`
    const encoder = new TextEncoder()

    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    )

    const signature = Uint8Array.from(atob(signatureB64), (c) => c.charCodeAt(0))
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      encoder.encode(message),
    )
    if (!valid) return null

    const payload = JSON.parse(decodeURIComponent(escape(atob(payloadB64))))
    // exp 为秒级 Unix 时间戳；同时兼容历史毫秒值
    const expMs = payload.exp > 1e12 ? payload.exp : payload.exp * 1000
    if (expMs < Date.now()) return null

    return {
      id: payload.sub,
      username: payload.username,
      displayName: payload.displayName || payload.username,
      role: payload.role,
    }
  } catch {
    return null
  }
}
