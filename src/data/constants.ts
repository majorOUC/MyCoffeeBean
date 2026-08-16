import type { BrewMethod, Process, RoastLevel } from '@/types/coffee'

export const PROCESSES: Process[] = [
  'Washed',
  'Natural',
  'Honey',
  'Anaerobic',
  'Wet-Hulled',
  'Decaf',
]

export const ROAST_LEVELS: RoastLevel[] = [
  'Light',
  'Medium',
  'Medium-Dark',
  'Dark',
]

export const BREW_METHODS: BrewMethod[] = [
  'V60',
  'Aeropress',
  'Espresso',
  'Cold Brew',
  'French Press',
  'Chemex',
  'Moka Pot',
]

export const FLAVOR_NOTES = [
  'Floral',
  'Citrus',
  'Berry',
  'Stone Fruit',
  'Tropical',
  'Chocolate',
  'Nutty',
  'Caramel',
  'Vanilla',
  'Honey',
  'Spices',
  'Tea-like',
  'Winey',
  'Earthy',
] as const

/** 处理法中文对照，用于标签展示 */
export const PROCESS_LABEL: Record<Process, string> = {
  Washed: '水洗',
  Natural: '日晒',
  Honey: '蜜处理',
  Anaerobic: '厌氧',
  'Wet-Hulled': '湿刨',
  Decaf: '低因',
}

/** 烘焙度中文对照 */
export const ROAST_LABEL: Record<RoastLevel, string> = {
  Light: '浅烘',
  Medium: '中烘',
  'Medium-Dark': '中深烘',
  Dark: '深烘',
}

/** 冲煮方式中文对照 */
export const BREW_LABEL: Record<BrewMethod, string> = {
  V60: 'V60 手冲',
  Aeropress: '爱乐压',
  Espresso: '意式浓缩',
  'Cold Brew': '冷萃',
  'French Press': '法压壶',
  Chemex: 'Chemex',
  'Moka Pot': '摩卡壶',
}

/** 产地国旗 emoji */
export const COUNTRY_FLAGS: Record<string, string> = {
  Ethiopia: '🇪🇹',
  Kenya: '🇰🇪',
  Colombia: '🇨🇴',
  Panama: '🇵🇦',
  Brazil: '🇧🇷',
  Guatemala: '🇬🇹',
  'Costa Rica': '🇨🇷',
  Honduras: '🇭🇳',
  'El Salvador': '🇸🇻',
  Nicaragua: '🇳🇮',
  Peru: '🇵🇪',
  Mexico: '🇲🇽',
  Ecuador: '🇪🇨',
  Rwanda: '🇷🇼',
  Burundi: '🇧🇮',
  Tanzania: '🇹🇿',
  Uganda: '🇺🇬',
  Yemen: '🇾🇪',
  Indonesia: '🇮🇩',
  'Papua New Guinea': '🇵🇬',
  Vietnam: '🇻🇳',
  Thailand: '🇹🇭',
  Laos: '🇱🇦',
  India: '🇮🇳',
  China: '🇨🇳',
  Taiwan: '🇹🇼',
  Japan: '🇯🇵',
  Australia: '🇦🇺',
}

/** 国家 → 封面渐变色调（Tailwind 类），未知国家回退到咖啡棕 */
export const COUNTRY_COVERS: Record<string, string> = {
  Ethiopia: 'from-amber-200 via-orange-200 to-rose-200',
  Kenya: 'from-red-300 via-rose-200 to-orange-200',
  Colombia: 'from-emerald-200 via-teal-200 to-amber-200',
  Panama: 'from-sky-200 via-emerald-200 to-amber-100',
  Brazil: 'from-yellow-300 via-amber-200 to-orange-200',
  Guatemala: 'from-lime-200 via-emerald-200 to-teal-200',
  'Costa Rica': 'from-teal-200 via-cyan-200 to-emerald-200',
  Indonesia: 'from-stone-300 via-amber-200 to-yellow-200',
  China: 'from-rose-200 via-red-200 to-amber-200',
}

export const DEFAULT_COVER = 'from-coffee-200 via-coffee-100 to-cream-300'
