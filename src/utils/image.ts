/**
 * 把用户选择的图片压缩为 JPEG dataURL。
 * Mock 阶段直接存 dataURL；Phase 4 起，同一函数产出的 Blob 会改为上传 R2。
 */
export async function compressImage(
  file: File,
  maxEdge = 1200,
  quality = 0.85,
): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 不可用')
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return canvas.toDataURL('image/jpeg', quality)
}
