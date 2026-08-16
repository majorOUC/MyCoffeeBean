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

/** 收藏数量 → 地图填充深度 */
function countToLevel(count: number): number {
  if (count >= 5) return 700
  if (count >= 3) return 600
  if (count >= 2) return 500
  return 400
}

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
            fill={
              isVisited
                ? `var(--color-coffee-${countToLevel(count)})`
                : 'var(--color-cream-300)'
            }
            stroke={
              isSelected ? 'var(--color-leaf-500)' : 'var(--color-cream-50)'
            }
            strokeWidth={isSelected ? 2 : 0.6}
            className={
              isVisited
                ? 'cursor-pointer transition-opacity hover:opacity-80'
                : undefined
            }
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
