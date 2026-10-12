// The four cuts. Each scene runs for a whole number of beats at 120 BPM
// (one beat = 0.5s), so every cut lands on the music grid.
//
// [scene, beats, options]

export const BPM = 120;
export const BEAT = 60 / BPM;
export const FPS = 30;

export const CUTS = {
  "16x9-60": {
    format: "16x9",
    scenes: [
      ["hook", 8],
      ["tension", 8],
      ["reveal", 10],
      ["pipeline", 28],
      ["ledger", 12],
      ["offerings", 24],
      ["hub", 10],
      ["proof", 8],
      ["endcard", 12],
    ],
  },
  "16x9-30": {
    format: "16x9",
    scenes: [
      ["hook", 6],
      ["reveal", 8],
      ["pipeline", 20],
      ["ledger", 7],
      ["offerings", 9, { short: true }],
      ["endcard", 10],
    ],
  },
  "9x16-30": {
    format: "9x16",
    scenes: [
      ["hook", 6],
      ["reveal", 8],
      ["pipeline", 20],
      ["ledger", 7],
      ["offerings", 9, { short: true }],
      ["endcard", 10],
    ],
  },
  "9x16-15": {
    format: "9x16",
    scenes: [
      ["hook", 5],
      ["reveal", 5, { short: true }],
      ["pipeline", 11, { short: true }],
      ["ledger", 3, { flash: true }],
      ["endcard", 6],
    ],
  },

  // Single-frame layouts for the YouTube thumbnail and the Reels/Shorts cover.
  "thumb-16x9": { format: "16x9", still: true, scenes: [["thumb", 2]] },
  "thumb-9x16": { format: "9x16", still: true, scenes: [["thumb", 2]] },
};

export const VIDEO_CUTS = Object.keys(CUTS).filter((k) => !CUTS[k].still);
