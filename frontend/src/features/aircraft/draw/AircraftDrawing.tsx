import { useId, type ReactNode } from "react"

import { Flag } from "@/features/aircraft/draw/Flag"
import { FLAG_ASPECT } from "@/features/aircraft/draw/flags"
import type { Livery } from "@/features/aircraft/draw/liveries"
import type { AircraftShape, Engine } from "@/features/aircraft/draw/shape"
import { toSvgPath, UNITS_PER_METRE as U } from "@/features/aircraft/draw/sketch"

/** Empty space around the aircraft, in metres. */
const MARGIN = 0.6

const OUTLINE = "#3d4552"
/** Grey paint of the wing and the tailplane, a shade darker than a typical belly so they stand out against it. */
const GREY = "#c0c8d2"
/** Engine cowls, lighter again: they hang in front of the wing. */
const COWL = "#d4d9e0"
const GREY_DARK = "#a7afba"
const GREY_LIGHT = "#eef1f5"
const GLASS = "#39424f"

/** Cabin windows are about the same size on every airliner. Metres. */
const WINDOW = { width: 0.25, height: 0.36, pitch: 0.52 }

/** Thin outlines that stay the same width however large the drawing is shown. */
const outline = {
  stroke: OUTLINE,
  strokeWidth: 0.75,
  strokeLinejoin: "round",
  vectorEffect: "non-scaling-stroke",
} as const

/**
 * A flat side view of an aircraft in an airline's colours, nose to the left.
 *
 * The shape and the livery are separate pieces of data, so every aircraft type can wear
 * every livery without anyone drawing that combination. The picture is built in layers,
 * back to front: fin, fuselage with its paint, windows and lettering, then the tailplane,
 * the wing and the engines, which are in front of the fuselage for someone looking from
 * the side.
 */
export function AircraftDrawing({
  shape,
  livery,
  label,
  className,
}: {
  shape: AircraftShape
  livery: Livery
  /** Says what the drawing shows. Leave it out where the text beside it already does. */
  label?: string
  className?: string
}) {
  // Several drawings share a page, and ids in an SVG are global to the page.
  const id = useId()
  const fuselageClip = `${id}-fuselage`
  const finClip = `${id}-fin`

  const top = shape.top + MARGIN
  const width = (shape.length + 2 * MARGIN) * U
  const height = (shape.top - shape.bottom + 2 * MARGIN) * U
  const d = (path: string) => toSvgPath(path, top)
  const x = (metres: number) => metres * U
  const y = (metres: number) => (top - metres) * U

  const fuselage = d(shape.fuselage)
  const fin = d(shape.fin)

  const stripes = cheatlines(livery, shape.beltline)
  const mark = shape.tailMark

  return (
    <svg
      viewBox={`${-MARGIN * U} 0 ${width} ${height}`}
      className={className}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      <defs>
        <clipPath id={fuselageClip}>
          <path d={fuselage} />
        </clipPath>
        <clipPath id={finClip}>
          <path d={fin} />
        </clipPath>
      </defs>

      <path d={fin} fill={livery.fin} />
      {livery.TailMark && (
        <g clipPath={`url(#${finClip})`}>
          <g
            transform={`translate(${x(mark.x - mark.size / 2)} ${y(mark.z + mark.size / 2)}) scale(${(mark.size * U) / 100})`}
          >
            <livery.TailMark />
          </g>
        </g>
      )}
      <path d={fin} fill="none" {...outline} />

      <path d={fuselage} fill={livery.upper} />
      {/* Paint is cut to the outline of the fuselage, so it may be drawn as plain rectangles. */}
      <g clipPath={`url(#${fuselageClip})`}>
        <rect x={-MARGIN * U} y={y(shape.beltline)} width={width} height={height} fill={livery.belly} />
        {stripes.map((stripe) => (
          <rect
            key={stripe.top}
            x={-MARGIN * U}
            y={y(stripe.top)}
            width={width}
            height={stripe.width * U}
            fill={stripe.colour}
          />
        ))}
      </g>

      {shape.windowRows.flatMap((row) =>
        row.spans.map(([from, to]) => (
          // One dashed line per stretch of windows instead of a rectangle for each window.
          <line
            key={`${row.z}-${from}`}
            x1={x(from)}
            x2={x(to)}
            y1={y(row.z)}
            y2={y(row.z)}
            stroke={GLASS}
            strokeWidth={WINDOW.height * U}
            strokeDasharray={`${WINDOW.width * U} ${(WINDOW.pitch - WINDOW.width) * U}`}
          />
        )),
      )}
      {shape.doors.map((door) => (
        <rect
          key={`${door.x}-${door.z}`}
          x={x(door.x)}
          y={y(door.z + door.height)}
          width={door.width * U}
          height={door.height * U}
          rx={1.5}
          fill="none"
          {...outline}
          strokeWidth={0.6}
        />
      ))}
      <path d={d(shape.cockpit)} fill={GLASS} />
      <Titles shape={shape} livery={livery} y={y} />
      <path d={fuselage} fill="none" {...outline} />

      <path d={d(shape.stabiliser)} fill={GREY} {...outline} />
      <path d={d(shape.wing)} fill={GREY} {...outline} />
      {shape.flapFairings?.map(({ x: nose, z, length }) => (
        // A slim pod hanging under the trailing edge, blunt in front and pointed behind.
        <path
          key={nose}
          d={d(`M ${nose} ${z} C ${nose + 0.15 * length} ${z - 0.5}, ${nose + 0.6 * length} ${z - 0.5}, ${nose + length} ${z - 0.05}
                L ${nose + 0.3 * length} ${z + 0.15} Z`)}
          fill={GREY}
          {...outline}
        />
      ))}
      {shape.engines.map((engine) => (
        <Nacelle key={engine.x} engine={engine} top={top} colour={livery.engines ?? COWL} />
      ))}
    </svg>
  )
}

/** The stripes of a livery, centred on the beltline, each with the height of its upper edge. */
function cheatlines(livery: Livery, beltline: number) {
  const total = livery.cheatlines.reduce((sum, stripe) => sum + stripe.width, 0)
  let top = beltline + total / 2
  return livery.cheatlines.map((stripe) => {
    const placed = { ...stripe, top }
    top -= stripe.width
    return placed
  })
}

/**
 * Flag, name in Latin letters and name in Chinese characters, in one row.
 *
 * How wide text comes out depends on the font the browser ends up using, so each piece is
 * given a fixed length with `textLength`: the row then always fits the space the shape
 * sets aside for it, between doors and windows.
 */
function Titles({ shape, livery, y }: { shape: AircraftShape; livery: Livery; y: (metres: number) => number }) {
  const { titles, flag } = livery
  if (!titles) return null

  const room = shape.titles
  // Rough widths at a letter height of 1: capitals with some tracking, square characters.
  const flagWidth = flag ? 0.85 * FLAG_ASPECT[flag] : 0
  const latinWidth = titles.latin.length * 0.7
  const cjkWidth = (titles.cjk?.length ?? 0) * 1.02
  const gap = 0.55
  const natural = flagWidth + latinWidth + cjkWidth + gap * ((flag ? 1 : 0) + (titles.cjk ? 1 : 0))

  // Shrink the lettering when the row would be longer than the room there is.
  const size = Math.min(room.size, room.width / natural)
  const baseline = y(room.z)
  let cursor = room.x

  const pieces: ReactNode[] = []
  if (flag) {
    pieces.push(
      <Flag key="flag" country={flag} x={cursor * U} y={baseline - 0.85 * size * U} height={0.85 * size * U} />,
    )
    cursor += (flagWidth + gap) * size
  }
  pieces.push(
    <text
      key="latin"
      x={cursor * U}
      y={baseline}
      fontSize={size * U}
      fontWeight={700}
      fontFamily={titles.serif ? 'Georgia, "Times New Roman", serif' : undefined}
      textLength={latinWidth * size * U}
      lengthAdjust="spacingAndGlyphs"
      fill={titles.colour}
    >
      {titles.latin}
    </text>,
  )
  cursor += (latinWidth + gap) * size
  if (titles.cjk) {
    pieces.push(
      <text
        key="cjk"
        x={cursor * U}
        y={baseline}
        fontSize={size * U}
        fontWeight={titles.brush ? 400 : 600}
        fontFamily={titles.brush ? '"Kaiti SC", STKaiti, KaiTi, "AR PL UKai CN", serif' : undefined}
        textLength={cjkWidth * size * U}
        lengthAdjust="spacingAndGlyphs"
        fill={titles.colour}
      >
        {titles.cjk}
      </text>,
    )
  }
  return <>{pieces}</>
}

/**
 * A turbofan under the wing: the pylon it hangs from, the narrow core with its exhaust
 * cone, the wide cowl around the fan and the polished lip of the intake.
 */
function Nacelle({ engine, top, colour }: { engine: Engine; top: number; colour: string }) {
  const { x: x0, z: z0, cowl, length, pylon } = engine
  const r = engine.diameter / 2
  const d = (path: string) => toSvgPath(path, top)
  // Coordinates are computed, so they are rounded before they go into a path.
  const p = (x: number, z: number) => `${x.toFixed(3)} ${z.toFixed(3)}`
  const back = x0 + cowl

  // The rear edge of the cowl, top to bottom: straight, or a row of teeth pointing aft.
  const teeth = 8
  const edge = Array.from({ length: teeth }, (_, i) => {
    const z = z0 + 0.82 * r - ((i + 1) * 1.64 * r) / teeth
    const tip = engine.chevrons && i % 2 === 0
    return `L ${p(tip ? back + 0.24 : back, z)}`
  }).join(" ")

  return (
    <>
      <path
        d={d(`M ${p(x0 + 0.3 * cowl, z0 + 0.97 * r)} L ${p(pylon.x, pylon.z)}
              L ${p(pylon.x + 1.5, pylon.z - 0.3)} L ${p(back + 0.2, z0 + 0.7 * r)} Z`)}
        fill={GREY}
        {...outline}
      />
      <path
        d={d(`M ${p(back - 0.4, z0 + 0.55 * r)} L ${p(back + 0.9, z0 + 0.4 * r)} L ${p(back + 1.0, z0 + 0.24 * r)}
              L ${p(x0 + length, z0 + 0.05 * r)} L ${p(x0 + length, z0 - 0.05 * r)}
              L ${p(back + 1.0, z0 - 0.24 * r)} L ${p(back + 0.9, z0 - 0.4 * r)} L ${p(back - 0.4, z0 - 0.55 * r)} Z`)}
        fill={GREY_DARK}
        {...outline}
      />
      <path
        d={d(`M ${p(x0 + 0.1, z0 + 0.86 * r)}
              C ${p(x0 + 0.25 * cowl, z0 + 1.06 * r)} ${p(x0 + 0.7 * cowl, z0 + r)} ${p(back, z0 + 0.82 * r)}
              ${edge}
              C ${p(x0 + 0.7 * cowl, z0 - r)} ${p(x0 + 0.25 * cowl, z0 - 1.06 * r)} ${p(x0 + 0.16, z0 - 0.86 * r)}
              Q ${p(x0 - 0.04, z0)} ${p(x0 + 0.1, z0 + 0.86 * r)} Z`)}
        fill={colour}
        {...outline}
      />
      <path
        d={d(`M ${p(x0 + 0.1, z0 + 0.86 * r)} Q ${p(x0 - 0.04, z0)} ${p(x0 + 0.16, z0 - 0.86 * r)}
              L ${p(x0 + 0.44, z0 - 0.91 * r)} Q ${p(x0 + 0.26, z0)} ${p(x0 + 0.38, z0 + 0.91 * r)} Z`)}
        fill={GREY_LIGHT}
        {...outline}
      />
    </>
  )
}
