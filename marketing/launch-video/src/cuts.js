// The four cuts. Each scene runs for a whole number of beats at 120 BPM
// (one beat = 0.5s), so every cut lands on the music grid.
//
// [scene, beats, options]
//   vo:    index of the voiceover line (in the cut's take) that starts here
//   voAt:  seconds into the scene where that line starts (default 0.12)
//   voPart:"last" to use only the last sentence of that line
//   short: compact version of the scene

export const BPM = 120;
export const BEAT = 60 / BPM;
export const FPS = 30;

const THIRTY = [
  ["hook", 6, { vo: 0 }],
  ["reveal", 7, { vo: 1, voAt: 0.2 }],
  ["build", 8, { vo: 2 }],
  ["connect", 8, { vo: 3 }],
  ["automate", 9, { vo: 4 }],
  ["pipeline", 10, { vo: 5 }],
  ["endcard", 12, { vo: 6, voAt: 0.5 }],
];

export const CUTS = {
  "16x9-60": {
    format: "16x9",
    take: "60",
    scenes: [
      ["hook", 10, { vo: 0, voAt: 0.1, full: true }],
      ["tension", 6, { vo: 1 }],
      ["reveal", 10, { vo: 2, voAt: 0.25 }],
      ["build", 16, { vo: 3 }],
      ["connect", 16, { vo: 4 }],
      ["automate", 18, { vo: 5 }],
      ["pipeline", 16, { vo: 6 }],
      ["engage", 14, { vo: 7 }],
      ["endcard", 14, { vo: 8, voAt: 0.5 }],
    ],
  },
  "16x9-30": { format: "16x9", take: "30", scenes: THIRTY },
  "9x16-30": { format: "9x16", take: "30", scenes: THIRTY },
  "9x16-15": {
    format: "9x16",
    take: "30",
    scenes: [
      ["hook", 6, { vo: 0 }],
      ["reveal", 4, { vo: 1, voAt: 0.15, short: true }],
      ["build", 3, { short: true }],
      ["connect", 3, { short: true }],
      ["automate", 2, { short: true }],
      ["pipeline", 7, { vo: 5, short: true }],
      ["endcard", 5, { vo: 6, voPart: "last", voAt: 0.35 }],
    ],
  },

  // Single-frame layouts for the YouTube thumbnail and the Reels/Shorts cover.
  "thumb-16x9": { format: "16x9", still: true, scenes: [["thumb", 2]] },
  "thumb-9x16": { format: "9x16", still: true, scenes: [["thumb", 2]] },
};

export const VIDEO_CUTS = Object.keys(CUTS).filter((k) => !CUTS[k].still);
