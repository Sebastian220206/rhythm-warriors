# ⚡ Rhythm Warriors

A high-intensity web-based rhythm-action game playable on both **mobile** and **laptop/desktop**. Players strike, hold, and dodge musical attacks in time with the beat. As difficulty increases, the player faces faster tempos, syncopation, and polyrhythms.

---

## 🎮 How to Play

### Controls
| Action | Laptop / Keyboard | Mobile / Touch |
|---|---|---|
| **Strike Left** | `F`, `D`, `A`, or `←` | Tap left half of screen |
| **Strike Right** | `J`, `K`, `L`, or `→` | Tap right half of screen |
| **Hold Note** | Press and hold corresponding key | Press and hold corresponding lane |
| **Dodge Attack** | `Space`, `↑`, or `W` | Swipe up anywhere on screen |
| **Double Strike** | `F` + `J` or `←` + `→` | Tap both lanes with two fingers |

---

## 🎵 Musical Skill Curve & Worlds

1. **World 1: Training Grounds (Quarter Notes - 92 BPM)**
   - Steady 4/4 downbeats, learning alternating left and right strikes.
2. **World 2: The March (Eighth Notes & Holds - 105 BPM)**
   - Rapid 8th-note alternating sequences and sustained hold beams.
3. **World 3: Offbeat Ambush (Syncopation - 115 BPM)**
   - Striking on the "&" upbeats while dodging cross-lane shockwaves.
4. **World 4: Triplet Temple (Triplets & Swing - 120 BPM)**
   - 3-note per beat subdivisions (`1-trip-let 2-trip-let`) and swing feel.
5. **World 5: Sixteenth Storm (16th Flurries - 128 BPM)**
   - High-speed 16th-note bursts and simultaneous dual-blade impacts.
6. **World 6: Polyrhythm Peak (3:2 & 4:3 Polyrhythms - 135 BPM)**
   - Left hand strikes 3 evenly spaced pulses against the right hand striking 2 pulses.
7. **Endless Arena**
   - Procedural endless battle of evolving rhythmic challenges.

---

## 🎧 Latency Calibration
Bluetooth headphones or mobile audio pipelines can introduce 100–250ms of audio latency.
Use the built-in **"Calibrate Latency"** tool in the menu to tap along with the metronome and automatically offset audio delay.

---

## 🛠 Tech Stack
- **TypeScript** + **Vite**
- **HTML5 Canvas 2D**: Responsive landscape and portrait rendering, DPI-aware (`devicePixelRatio`).
- **Web Audio API**: Sample-accurate `AudioContext.currentTime` master clock and procedural multi-voice synthesizer (Kick, Snare, Hi-Hat, Sub-Bass, Lead Synth).
- **PWA Ready**: Manifest, touch-action locks, Wake Lock API.
- **Vitest**: Unit testing suite for Conductor, Judge, ScoreSystem, and PatternGenerator.

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev

# Run unit tests
npm test

# Production build
npm run build
```
