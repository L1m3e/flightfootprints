import type { FlagCode } from "@/features/aircraft/draw/flags"

/** Corners of a five-pointed star with one point up. */
function star(cx: number, cy: number, radius: number): string {
  const points: string[] = []
  for (let i = 0; i < 10; i++) {
    // Outer and inner corners alternate; 0.382 is the ratio that makes the edges straight.
    const r = i % 2 === 0 ? radius : radius * 0.382
    const angle = (Math.PI / 5) * i - Math.PI / 2
    points.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`)
  }
  return points.join(" ")
}

/**
 * The national flag that some airlines paint next to their name. `x` and `y` are the top
 * left corner in drawing units; the width follows from the flag's own proportions.
 */
export function Flag({ country, x, y, height }: { country: FlagCode; x: number; y: number; height: number }) {
  switch (country) {
    case "CN":
      // Laid out on the flag's official grid of 30 × 20. The small stars are left upright:
      // at this size their tilt towards the large one cannot be seen.
      return (
        <g transform={`translate(${x} ${y}) scale(${height / 20})`}>
          <rect width="30" height="20" fill="#de2910" />
          <g fill="#ffde00">
            <polygon points={star(5, 5, 3)} />
            <polygon points={star(10, 2, 1)} />
            <polygon points={star(12, 4, 1)} />
            <polygon points={star(12, 7, 1)} />
            <polygon points={star(10, 9, 1)} />
          </g>
        </g>
      )
  }
}
