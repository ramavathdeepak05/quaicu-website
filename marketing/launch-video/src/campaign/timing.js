// Voiceover-first timing for the campaign videos.
//
// A scene's narration is opts.say: a string, or an array of phrases (one per
// checklist item, chart beat, line...). The renderer synthesises every phrase
// first, measures it, and then sizes each scene to fit its narration, so the
// voice runs continuously instead of leaving silences between short lines.
// Scenes without narration keep their length in beats.
//
// Shared by render.mjs (with measured durations) and the page (which uses the
// measured plan when given one, or estimates from word counts for previews).

// The campaign music runs at 144 BPM (matched to the Zelios reference).
export const BPM = 144;
export const BEAT = 60 / BPM;
const Q = BEAT / 2;      // scene lengths snap up to an eighth note, so cuts stay on the music
const LEAD_FIRST = 0.05; // first phrase of the video starts almost immediately
const LEAD = 0.1;        // a phrase starts this long after its scene cuts in
const GAP = 0.14;        // pause between phrases inside a scene
const TAIL = 0.12;       // after a scene's last phrase, before the cut
const END_HOLD = 1.3;    // the end card holds this long after its line
const WPS = 3.3;         // Kokoro words per second at speed 1.0 (measured)

export const sayList = (opts = {}) => (opts.say == null ? [] : Array.isArray(opts.say) ? opts.say : [opts.say]);

// Every phrase in the video, in order: [{ scene, k, text }]
export function phrasesOf(video) {
  const out = [];
  video.scenes.forEach(([, , opts], i) => sayList(opts).forEach((text, k) => out.push({ scene: i, k, text })));
  return out;
}

export const estimate = (text, speed = 1.1) => text.split(/\s+/).filter(Boolean).length / (WPS * speed) + 0.12;

// durations: seconds per phrase in phrasesOf order (measured), or null to estimate.
// Returns { scenes: [{ dur, voAt: [s], voDur: [s], voEnd }], phrases: [{ t, dur, text }], duration }
export function planTiming(video, durations = null, { speed = 1.1 } = {}) {
  const scenes = [];
  const phrases = [];
  let t = 0, pi = 0;
  video.scenes.forEach(([name, beats, opts = {}], i) => {
    const says = sayList(opts);
    if (!says.length) {
      const dur = beats * 0.5; // unnarrated scenes count beats at the launch video's 120 BPM
      scenes.push({ dur, voAt: [], voDur: [], voEnd: 0 });
      t += dur;
      return;
    }
    let local = i === 0 ? LEAD_FIRST : LEAD;
    const voAt = [];
    const voDur = [];
    says.forEach((text, k) => {
      const d = durations ? durations[pi] : estimate(text, speed);
      voAt.push(+local.toFixed(3));
      voDur.push(+d.toFixed(3));
      phrases.push({ t: +(t + local).toFixed(3), dur: +d.toFixed(3), text });
      local += d + (k < says.length - 1 ? GAP : 0);
      pi++;
    });
    const min = opts.min != null ? opts.min : name === "endcard" ? 3 : 1.5;
    const dur = Math.ceil(Math.max(min, local + (name === "endcard" ? END_HOLD : TAIL)) / Q - 1e-6) * Q;
    scenes.push({ dur, voAt, voDur, voEnd: +local.toFixed(3) });
    t += dur;
  });
  return { scenes, phrases, duration: +t.toFixed(3) };
}
