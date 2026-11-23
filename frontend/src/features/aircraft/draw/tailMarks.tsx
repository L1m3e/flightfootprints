// The airlines' marks for the fin, each drawn by hand for this project as a simplified
// version of the real logo and laid out in a box of 100 × 100 units. The logos themselves
// belong to the airlines; they are shown only to tell whose aircraft it is.

/** Air China: a red phoenix whose feathers form the letters "VIP". */
export function AirChinaMark() {
  return (
    <g fill="#d6131b">
      {/* Crest: two tufts swept back from the head */}
      <path d="M 19 14 C 23 5, 33 3, 40 8 C 34 8, 29 11, 26 17 Z" />
      <path d="M 31 12 C 37 4, 47 4, 53 10 C 46 9, 40 11, 36 16 Z" />
      {/* Beak, head and neck, down to the foot of the V */}
      <path d="M 2 32 L 15 22 C 19 15, 29 14, 33 21 C 36 27, 35 33, 36 40 C 38 58, 42 72, 48 82 L 43 93 C 30 78, 20 58, 17 35 Z" />
      {/* The wing, rising from the foot of the V */}
      <path d="M 43 93 C 49 80, 54 58, 55 31 C 55 25, 66 24, 67 30 C 67 55, 62 77, 53 90 Z" />
      {/* Two tail feathers: the I, and the P with its bowl */}
      <path d="M 74 25 C 78 25, 79 28, 79 33 L 78 78 C 78 84, 73 88, 69 89 C 69 70, 69 45, 69 30 C 69 27, 71 25, 74 25 Z" />
      <path
        fillRule="evenodd"
        d="M 82 28 C 82 25, 84 23, 88 23 C 98 23, 102 34, 99 45 C 97 53, 93 56, 91 56 L 91 74 C 91 80, 87 83, 82 84 Z
           M 91 31 C 93 32, 94 39, 93 45 C 92 47, 92 48, 91 48 Z"
      />
    </g>
  )
}
