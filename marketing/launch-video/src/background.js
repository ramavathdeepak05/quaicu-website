// Persistent backdrop from og-card.png: near-black, a faint 56px grid that
// drifts, and slow green glows.

export function buildBackground(el, { fmt }) {
  const grid = el.querySelector(".grid");
  const g1 = el.querySelector(".g1");
  const g2 = el.querySelector(".g2");
  const W = fmt === "16x9" ? 1920 : 1080;
  const H = fmt === "16x9" ? 1080 : 1920;

  return {
    update(t) {
      const gx = -((t * 9) % 56);
      const gy = -((t * 5) % 56);
      grid.style.transform = `translate3d(${gx}px, ${gy}px, 0)`;

      const a = t * 0.21;
      g1.style.transform = `translate3d(${W * 0.62 + Math.sin(a) * 90 - 800}px, ${H * 0.08 + Math.cos(a * 0.8) * 60 - 800}px, 0)`;
      g2.style.transform = `translate3d(${W * 0.12 + Math.cos(a * 0.7) * 80 - 800}px, ${H * 0.96 + Math.sin(a * 0.9) * 50 - 800}px, 0)`;
    },
  };
}
