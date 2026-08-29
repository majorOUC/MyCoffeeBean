import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '@/components/AuthContext'
import AccessDenied from '@/components/AccessDenied'
import { useToast } from '@/components/toastContext'
import { coffeeService } from '@/services/coffeeService'
import type { BrewCard, BrewCardInput } from '@/types/coffee'
import { resolveImageUrl } from '@/utils/url'

const inputClass =
  'w-full rounded-xl border border-coffee-300/70 bg-cream-50 px-3.5 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-coffee-500 focus:ring-2 focus:ring-coffee-300/40 focus:outline-none'

/** 表单内部状态：所有参数用空字符串表示"未填写" */
interface BrewFormState {
  beanName: string
  dose: string
  water: string
  ratio: string
  temperature: string
  grindSize: string
  bloomTime: string
  bloomWater: string
  stage1Water: string
  stage2Water: string
  stage3Water: string
  imageUrl: string | undefined
}

const emptyForm: BrewFormState = {
  beanName: '',
  dose: '',
  water: '',
  ratio: '',
  temperature: '',
  grindSize: '',
  bloomTime: '',
  bloomWater: '',
  stage1Water: '',
  stage2Water: '',
  stage3Water: '',
  imageUrl: undefined,
}

function toForm(card: BrewCard): BrewFormState {
  return {
    beanName: card.beanName,
    dose: card.dose ?? '',
    water: card.water ?? '',
    ratio: card.ratio ?? '',
    temperature: card.temperature ?? '',
    grindSize: card.grindSize ?? '',
    bloomTime: card.bloomTime ?? '',
    bloomWater: card.bloomWater ?? '',
    stage1Water: card.stage1Water ?? '',
    stage2Water: card.stage2Water ?? '',
    stage3Water: card.stage3Water ?? '',
    imageUrl: card.imageUrl,
  }
}

function toInput(f: BrewFormState): BrewCardInput {
  return {
    beanName: f.beanName.trim(),
    dose: f.dose.trim() || undefined,
    water: f.water.trim() || undefined,
    ratio: f.ratio.trim() || undefined,
    temperature: f.temperature.trim() || undefined,
    grindSize: f.grindSize.trim() || undefined,
    bloomTime: f.bloomTime.trim() || undefined,
    bloomWater: f.bloomWater.trim() || undefined,
    stage1Water: f.stage1Water.trim() || undefined,
    stage2Water: f.stage2Water.trim() || undefined,
    stage3Water: f.stage3Water.trim() || undefined,
    imageUrl: f.imageUrl,
  }
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium tracking-wide text-ink-500">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
    </div>
  )
}

export default function BrewCardFormPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()

  const [form, setForm] = useState<BrewFormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user || user.role !== 'admin') return
    void coffeeService.getBrewCard().then((card) => {
      if (card) setForm(toForm(card))
    })
  }, [user])

  if (!user || user.role !== 'admin') {
    return (
      <AccessDenied
        message="只有管理员才能编辑手冲参数。"
        backTo="/"
        backLabel="返回首页"
      />
    )
  }

  const set = <K extends keyof BrewFormState>(
    key: K,
    value: BrewFormState[K],
  ) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const handleFile = async (file: File) => {
    setUploading(true)
    try {
      const url = await coffeeService.uploadImage(file)
      set('imageUrl', url)
    } catch {
      toast.show('图片上传失败，请重试', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.beanName.trim()) {
      toast.show('请填写方案名', 'error')
      return
    }
    setSaving(true)
    try {
      await coffeeService.saveBrewCard(toInput(form))
      toast.show('手冲参数已更新', 'success')
      navigate('/')
    } catch {
      toast.show('保存失败，请重试', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      <h1 className="font-display text-3xl font-bold text-coffee-900">
        手冲参数
      </h1>
      <p className="mt-1 text-sm text-ink-400">
        设置主页展示的冲煮方案，保存后立即生效
      </p>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="mt-8 space-y-6"
      >
        <div className="rounded-3xl border border-coffee-200/70 bg-cream-50 p-5 shadow-sm sm:p-6">
          <h2 className="mb-4 font-display text-base font-semibold text-coffee-800">
            基本参数
          </h2>
          <div className="space-y-4">
            <Field
              label="方案名 *"
              value={form.beanName}
              onChange={(v) => set('beanName', v)}
              placeholder="例如：耶加雪菲 水洗 G1"
            />
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="粉量（g）"
                value={form.dose}
                onChange={(v) => set('dose', v)}
                placeholder="15"
              />
              <Field
                label="总水量（g）"
                value={form.water}
                onChange={(v) => set('water', v)}
                placeholder="225"
              />
              <Field
                label="粉水比"
                value={form.ratio}
                onChange={(v) => set('ratio', v)}
                placeholder="1:15"
              />
              <Field
                label="水温（°C）"
                value={form.temperature}
                onChange={(v) => set('temperature', v)}
                placeholder="88-92"
              />
              <Field
                label="研磨度"
                value={form.grindSize}
                onChange={(v) => set('grindSize', v)}
                placeholder="中细 / C40 24格"
              />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-coffee-200/70 bg-cream-50 p-5 shadow-sm sm:p-6">
          <h2 className="font-display text-base font-semibold text-coffee-800">
            分段冲煮
          </h2>
          <p className="mb-4 mt-1 text-xs text-ink-400">
            留空的段落不会显示在主页
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field
              label="闷蒸时间"
              value={form.bloomTime}
              onChange={(v) => set('bloomTime', v)}
              placeholder="30s"
            />
            <Field
              label="闷蒸克重（g）"
              value={form.bloomWater}
              onChange={(v) => set('bloomWater', v)}
              placeholder="45"
            />
            <Field
              label="第一段（g）"
              value={form.stage1Water}
              onChange={(v) => set('stage1Water', v)}
              placeholder="120"
            />
            <Field
              label="第二段（g）"
              value={form.stage2Water}
              onChange={(v) => set('stage2Water', v)}
              placeholder="180"
            />
            <Field
              label="第三段（g）"
              value={form.stage3Water}
              onChange={(v) => set('stage3Water', v)}
              placeholder="225"
            />
          </div>
        </div>

        <div className="rounded-3xl border border-coffee-200/70 bg-cream-50 p-5 shadow-sm sm:p-6">
          <h2 className="mb-4 font-display text-base font-semibold text-coffee-800">
            冲煮照片
          </h2>
          <div className="flex items-start gap-4">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-coffee-300 bg-cream-50">
              {uploading ? (
                <span className="text-xs text-ink-400">上传中…</span>
              ) : form.imageUrl ? (
                <img
                  src={resolveImageUrl(form.imageUrl)}
                  alt="冲煮照片预览"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-3xl" aria-hidden>
                  📷
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void handleFile(file)
                }}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="rounded-full border border-coffee-300 px-4 py-2 text-sm text-coffee-700 transition-colors hover:bg-coffee-100 disabled:opacity-50"
              >
                {uploading ? '上传中…' : '选择图片'}
              </button>
              {form.imageUrl && (
                <button
                  type="button"
                  onClick={() => set('imageUrl', undefined)}
                  className="text-left text-xs text-ink-400 hover:text-red-500"
                >
                  移除图片
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-coffee-200/60 pt-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-full px-5 py-2.5 text-sm text-ink-500 hover:text-coffee-700"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-coffee-700 px-6 py-2.5 text-sm font-medium text-cream-50 shadow-sm transition-all hover:bg-coffee-800 hover:shadow-md disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </div>
  )
}
