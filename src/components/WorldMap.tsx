import { geoNaturalEarth1, geoPath } from 'd3-geo'
import type { FeatureCollection, Geometry } from 'geojson'
import { useMemo } from 'react'
import { feature } from 'topojson-client'
import worldData from 'world-atlas/countries-110m.json'

const worldTopology = worldData as unknown as Parameters<typeof feature>[0] & {
  objects: { countries: never }
}
const world = feature(
  worldTopology,
  worldTopology.objects.countries,
) as unknown as FeatureCollection<Geometry, { name: string }>

const WIDTH = 960
const HEIGHT = 480

/** 收藏数量 → 地图填充 Tailwind 类（亮/暗两套色，dark: 前缀由 .dark 祖先切换） */
function getVisitedFillClass(count: number): string {
  if (count >= 5) return 'fill-[#684833] dark:fill-[#e6c39a]'
  if (count >= 3) return 'fill-[#825c3e] dark:fill-[#d3a87c]'
  if (count >= 2) return 'fill-[#9c7350] dark:fill-[#b58f6f]'
  return 'fill-[#b58f6f] dark:fill-[#9c7350]'
}

/** 未访问国家填充类 */
const UNVISITED_FILL_CLASS = 'fill-[#eaddcc] dark:fill-[#3a3129]'

interface WorldMapProps {
  /** 国家名 → 咖啡豆数量 */
  counts: Record<string, number>
  selected?: string
  onSelect: (country: string | null) => void
}

/** SVG 世界地图：喝过的产地按收藏深度着色，可点选下钻 */
export default function WorldMap({
  counts,
  selected,
  onSelect,
}: WorldMapProps) {
  const path = useMemo(() => {
    const projection = geoNaturalEarth1().fitExtent(
      [
        [6, 6],
        [WIDTH - 6, HEIGHT - 6],
      ],
      world as never,
    )
    return geoPath(projection)
  }, [])

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-auto w-full select-none"
      role="img"
      aria-label="咖啡产地世界地图"
    >
      {world.features.map((f) => {
        const name = f.properties?.name ?? ''
        const count = counts[name] ?? 0
        const d = path(f)
        if (!d) return null

        const isVisited = count > 0
        const isSelected = name === selected

        return (
          <path
            key={name}
            d={d}
            className={`${
              isVisited
                ? getVisitedFillClass(count)
                : UNVISITED_FILL_CLASS
            } ${
              isSelected
                ? 'stroke-[#5f9e4d] dark:stroke-[#7fb069]'
                : 'stroke-[#fdfbf7] dark:stroke-[#221c15]'
            } ${
              isVisited
                ? 'cursor-pointer transition-opacity hover:opacity-80'
                : undefined
            }`}
            strokeWidth={isSelected ? 2 : 0.6}
            onClick={() => onSelect(isSelected || !isVisited ? null : name)}
          >
            <title>
              {name}
              {isVisited ? ` · ${count} 款` : ''}
            </title>
          </path>
        )
      })}
    </svg>
  )
}
