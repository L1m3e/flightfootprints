/** Drawing units per metre: one unit is 10 cm, which keeps the numbers in the SVG short. */
export const UNITS_PER_METRE = 10

/**
 * Converts path data written in aircraft coordinates into SVG path data.
 *
 * Aircraft coordinates are in metres: x runs aft from the tip of the nose and z runs up
 * from the keel, the underside of the cabin section. Aircraft dimensions are published
 * this way, so a shape can be written down straight from them. SVG has its origin at the
 * top left with y pointing down, hence the flip: `top` is the height in metres that ends
 * up at y = 0.
 *
 * Only the absolute commands M, L, C, Q and Z are accepted. All of their arguments are
 * coordinate pairs, which is what keeps the conversion this simple.
 */
export function toSvgPath(path: string, top: number): string {
  let expectsX = true

  return (path.match(/[A-Za-z]|-?\d*\.?\d+/g) ?? [])
    .map((token) => {
      if (/[A-Za-z]/.test(token)) {
        if (!"MLCQZ".includes(token)) throw new Error(`Unsupported path command "${token}" in "${path}"`)
        if (!expectsX) throw new Error(`A coordinate pair is incomplete before "${token}" in "${path}"`)
        return token
      }

      const metres = Number(token)
      const units = (expectsX ? metres : top - metres) * UNITS_PER_METRE
      expectsX = !expectsX
      // Two decimals are a millimetre: plenty, and it hides floating-point noise.
      return String(Math.round(units * 100) / 100)
    })
    .join(" ")
}
