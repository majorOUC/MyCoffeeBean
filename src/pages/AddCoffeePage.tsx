import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import RatingStars from '@/components/RatingStars'
import Tag from '@/components/Tag'
import {
  FLAVOR_NOTES,
  PROCESSES,
  PROCESS_LABEL,
  ROAST_LABEL,
  ROAST_LEVELS,
} from '@/data/constants'
import { coffeeService } from '@/services/coffeeService'
import type { CoffeeInput, Process, RoastLevel } from '@/types/coffee'
import { resolveImageUrl } from '@/utils/url'

const COMMON_COUNTRIES = [
  'Ethiopia',
  'Kenya',
  'Colombia',
  'Panama',
  'Brazil',
  'Guatemala',
  'Costa Rica',
  'Indonesia',
  'China',
  'Rwanda',
  'Yemen',
]

const emptyForm: CoffeeInput = {
  name: '',
  roaster: '',
  country: '',
  region: '',
  farm: '',
  variety: '',
  process: 'Washed',
  altitude: undefined,
  roastLevel: 'Light',
  flavorNotes: [],
  rating: 4,
  description: '',
  imageUrl: undefined,
}

export default function AddCoffeePage() {
  const [params] = useSearchParams()
  const editId = params.get('id')
  const navigate = useNavigate()

  const [form, setForm] = useState<CoffeeInput>(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editId) return
    void coffeeService.getCoffee(editId).then((coffee) => {
      if (!coffee) return
      const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = coffee
      setForm(rest)
    })
  }, [editId])

  const set = <K extends keyof CoffeeInput>(key: K, value: CoffeeInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: '' }))
  }

  const toggleNote = (note: string) => {
    setForm((f) => ({
      ...f,
      flavorNotes: f.flavorNotes.includes(note)
        ? f.flavorNotes.filter((n) => n !== note)
        : [...f.flavorNotes, note],
    }))
  }

  const [uploading, setUploading] = useState(false)

  const handleFile = async (file: File) => {
    setUploading(true)
    try {
      const url = await coffeeService.uploadImage(file)
      set('imageUrl', url)
    } catch {
      window.alert('图片上传失败，请重试。')
    } finally {
      setUploading(false)
    }
  }

  const validate = (): boolean => {
    const next: Record<string, string> = {}
    if (!form.name.trim()) next.name = '请填写名称'
    if (!form.roaster.trim()) next.roaster = '请填写烘焙商'
    if (!form.country.trim()) next.country = '请填写国家'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      const payload: CoffeeInput = {
        ...form,
        name: form.name.trim(),
        roaster: form.roaster.trim(),
        country: form.country.trim(),
        region: form.region.trim(),
        farm: form.farm?.trim() || undefined,
        variety: form.variety?.trim() || undefined,
        description: form.description?.trim() || undefined,
      }
      const coffee = editId
        ? await coffeeService.updateCoffee(editId, payload)
        : await coffeeService.addCoffee(payload)
      navigate(coffee ? `/coffees/${coffee.id}` : '/coffees')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      <h1 className="font-display text-3xl font-bold text-coffee-900">
        {editId ? '编辑咖啡豆' : '记一款咖啡豆'}
      </h1>
      <p className="mt-1 text-sm text-ink-400">
        {editId ? '更新这款豆子的档案信息' : '为你的图鉴收录一款新豆子'}
      </p>

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-8">
        {/* 基本 */}
        <Section title="基本信息">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="名称" required error={errors.name}>
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="如 Huila Pink Bourbon"
              />
            </Field>
            <Field label="烘焙商" required error={errors.roaster}>
              <input
                className={inputClass}
                value={form.roaster}
                onChange={(e) => set('roaster', e.target.value)}
                placeholder="如 治光师"
              />
            </Field>
            <Field label="国家" required error={errors.country}>
              <input
                className={inputClass}
                value={form.country}
                onChange={(e) => set('country', e.target.value)}
                list="common-countries"
                placeholder="如 Ethiopia"
              />
              <datalist id="common-countries">
                {COMMON_COUNTRIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field label="产区">
              <input
                className={inputClass}
                value={form.region}
                onChange={(e) => set('region', e.target.value)}
                placeholder="如 Yirgacheffe"
              />
            </Field>
            <Field label="庄园">
              <input
                className={inputClass}
                value={form.farm ?? ''}
                onChange={(e) => set('farm', e.target.value)}
                placeholder="如 Chelbesa Station"
              />
            </Field>
            <Field label="品种">
              <input
                className={inputClass}
                value={form.variety ?? ''}
                onChange={(e) => set('variety', e.target.value)}
                placeholder="如 Heirloom / SL28"
              />
            </Field>
            <Field label="处理法">
              <select
                className={inputClass}
                value={form.process}
                onChange={(e) => set('process', e.target.value as Process)}
              >
                {PROCESSES.map((p) => (
                  <option key={p} value={p}>
                    {PROCESS_LABEL[p]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="烘焙度">
              <select
                className={inputClass}
                value={form.roastLevel}
                onChange={(e) =>
                  set('roastLevel', e.target.value as RoastLevel)
                }
              >
                {ROAST_LEVELS.map((r) => (
                  <option key={r} value={r}>
                    {ROAST_LABEL[r]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="海拔（米）">
              <input
                type="number"
                min={0}
                max={3000}
                className={inputClass}
                value={form.altitude ?? ''}
                onChange={(e) =>
                  set(
                    'altitude',
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
                placeholder="如 1900"
              />
            </Field>
          </div>
        </Section>

        {/* 风味 */}
        <Section title="风味" hint="点选你喝到的风味，可多选">
          <div className="flex flex-wrap gap-2">
            {FLAVOR_NOTES.map((note) => (
              <Tag
                key={note}
                active={form.flavorNotes.includes(note)}
                tone="leaf"
                onClick={() => toggleNote(note)}
              >
                {note}
              </Tag>
            ))}
          </div>
        </Section>

        {/* 评分与笔记 */}
        <Section title="评分与笔记">
          <div className="flex items-center gap-3">
            <RatingStars
              value={form.rating}
              size="lg"
              onChange={(v) => set('rating', v)}
            />
            <span className="font-display text-xl font-semibold text-coffee-800">
              {form.rating.toFixed(1)}
            </span>
          </div>
          <textarea
            className={`${inputClass} mt-4 min-h-28 resize-y`}
            value={form.description ?? ''}
            onChange={(e) => set('description', e.target.value)}
            placeholder="这款豆子给你留下了什么印象？酸质、甜感、body、余韵……"
          />
        </Section>

        {/* 图片 */}
        <Section title="包装照片" hint="可选，将自动压缩后上传">
          <div className="flex items-start gap-4">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-coffee-300 bg-cream-50">
              {uploading ? (
                <span className="text-xs text-ink-400">上传中…</span>
              ) : form.imageUrl ? (
                <img
                  src={resolveImageUrl(form.imageUrl)}
                  alt="包装照片预览"
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
                  className="text-xs text-ink-400 hover:text-red-500"
                >
                  移除图片
                </button>
              )}
            </div>
          </div>
        </Section>

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
            {saving ? '保存中…' : editId ? '保存修改' : '收入图鉴'}
          </button>
        </div>
      </form>
    </div>
  )
}

const inputClass =
  'w-full rounded-xl border border-coffee-300/70 bg-cream-50 px-3.5 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-coffee-500 focus:ring-2 focus:ring-coffee-300/40 focus:outline-none'

function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-3xl border border-coffee-200/70 bg-cream-50 p-5 shadow-sm sm:p-6">
      <h2 className="font-display text-base font-semibold text-coffee-800">
        {title}
      </h2>
      {hint && <p className="mt-0.5 mb-4 text-xs text-ink-400">{hint}</p>}
      <div className={hint ? '' : 'mt-4'}>{children}</div>
    </section>
  )
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium tracking-wide text-ink-500">
        {label}
        {required && <span className="ml-0.5 text-red-400">*</span>}
      </span>
      {children}
      {error && (
        <span className="mt-1 block text-xs text-red-500">{error}</span>
      )}
    </label>
  )
}
