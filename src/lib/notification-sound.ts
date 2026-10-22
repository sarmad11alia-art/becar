let ctx: AudioContext | null = null;
let unlocked = false;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

/** Must be called from a user gesture to allow autoplay of audio afterwards. */
export function unlockAudio() {
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === "suspended") void ac.resume();
  if (unlocked) return;
  try {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    gain.gain.value = 0.0001;
    osc.connect(gain).connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + 0.01);
    unlocked = true;
  } catch {}
}

export function playBeep(pattern: "new" | "card" | "otp" | "nafath" = "new") {
  if (typeof window === "undefined") return;
  if (localStorage.getItem("bcare_sound_muted") === "1") return;
  try {
    const raw = localStorage.getItem("bcare_notif_prefs");
    if (raw) {
      const p = JSON.parse(raw);
      if (p?.sound && p.sound[pattern] === false) return;
    }
  } catch {}
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === "suspended") void ac.resume();
  const notes: Record<string, number[]> = {
    new: [880, 1175],
    card: [660, 990, 1320],
    otp: [1320, 1046, 1320],
    nafath: [523, 784, 1046, 1568],
  };
  const seq: number[] = notes[pattern] ?? [880, 1175];
  const now = ac.currentTime;
  seq.forEach((freq, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const start = now + i * 0.12;
    const end = start + 0.18;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(gain).connect(ac.destination);
    osc.start(start);
    osc.stop(end + 0.02);
  });
}

export function isMuted() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("bcare_sound_muted") === "1";
}

export function setMuted(muted: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem("bcare_sound_muted", muted ? "1" : "0");
}
