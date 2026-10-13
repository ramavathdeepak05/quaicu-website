// The film's clock: ten 3-second shots at 24 fps, the voiceover lines, the
// three typography moments and the sound cues the score is built from.

export const FPS = 24;
const names = [
  ["s01_awakening", "The Awakening"],
  ["s02_demo", "The Perfect Demo"],
  ["s03_realworld", "The Real World"],
  ["s04_connections", "The Hidden Connections"],
  ["s05_gaps", "Governance Gaps"],
  ["s06_diagnosis", "The Diagnosis"],
  ["s07_safeguards", "Engineering the Safeguards"],
  ["s08_evidence", "Human Control and Evidence"],
  ["s09_readiness", "Real-World Readiness"],
  ["s10_reveal", "The QUAICU Reveal"],
];
export const SHOTS = names.map(([file, title], i) => ({ file, title, start: i * 3, dur: 3 }));
export const DURATION = 30;

// Voiceover: exact script, one line per shot. `at` is the start time.
export const VO = [
  { at: 0.55, text: "The model works." },
  { at: 3.3, text: "The demo looks ready." },
  { at: 6.25, text: "But production is different." },
  { at: 9.2, text: "Data moves. Systems connect." },
  { at: 12.3, text: "Hidden gaps appear." },
  { at: 15.2, text: "QUAICU finds them before deployment." },
  { at: 18.15, text: "We engineer boundaries and controls." },
  { at: 21.1, text: "Build human checkpoints. Capture evidence." },
  { at: 24.25, text: "So AI can enter the real world." },
  { at: 27.05, text: "QUAICU. Engineered for safer deployment." },
];

// On-screen typography (the only three moments in the film).
export const TYPE = {
  beyond: { in: 4.45, out: 5.85, text: "Beyond the model." },
  reality: { in: 18.85, out: 20.75, text: "Engineered for reality." },
  end: { in: 28.15 },
};

// Sound design cues, consumed by audio/score.py.
export const CUES = [
  { t: 0.0, k: "sub_swell" },
  { t: 0.0, k: "core_pulse" },
  { t: 1.0, k: "activate" },
  { t: 2.7, k: "whoosh_in" },
  { t: 3.0, k: "cut_tick" },
  { t: 3.0, k: "process", n: 6, every: 0.5 },
  { t: 5.7, k: "whoosh_in" },
  { t: 6.0, k: "cut_low" },
  { t: 6.0, k: "fly", dur: 3.0 },
  { t: 9.0, k: "cut_tick" },
  { t: 9.1, k: "data", n: 9, every: 0.3 },
  { t: 11.45, k: "flicker" },
  { t: 12.0, k: "impact_low" },
  { t: 12.45, k: "warning" },
  { t: 13.2, k: "risk_tick" },
  { t: 13.85, k: "risk_tick" },
  { t: 15.0, k: "cut_tick" },
  { t: 15.15, k: "scan", dur: 1.85 },
  { t: 17.25, k: "isolate" },
  { t: 17.55, k: "isolate" },
  { t: 17.85, k: "isolate" },
  { t: 18.0, k: "cut_low" },
  { t: 18.5, k: "lock" },
  { t: 19.0, k: "lock" },
  { t: 19.5, k: "lock" },
  { t: 20.0, k: "lock" },
  { t: 20.35, k: "reroute" },
  { t: 21.0, k: "cut_tick" },
  { t: 21.95, k: "checkpoint_hold" },
  { t: 22.45, k: "confirm" },
  { t: 23.15, k: "record", n: 5, every: 0.16 },
  { t: 24.0, k: "whoosh_out" },
  { t: 24.0, k: "swell", dur: 3.0 },
  { t: 26.35, k: "power_down" },
  { t: 27.25, k: "final_pulse" },
  { t: 28.15, k: "impact_final" },
];
