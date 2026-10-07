import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const code = ts.transpileModule(readFileSync(new URL('../src/film/score.ts', import.meta.url), 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText;
const { FilmScore } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const parameter = () => ({ value: 0, setTargetAtTime() {}, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} });
const node = () => ({ gain: parameter(), frequency: parameter(), pan: parameter(), threshold: parameter(), ratio: parameter(), Q: parameter(), connect(target) { return target; }, disconnect() {}, start() {}, stop() {} });
class AudioContextMock {
  static allowed = false;
  static latest;
  state = 'suspended'; currentTime = 0; sampleRate = 8; destination = node(); pending = [];
  constructor() { AudioContextMock.latest = this; }
  createGain = node; createDynamicsCompressor = node; createConvolver = node;
  createOscillator = node; createStereoPanner = node;
  createBuffer() { return { getChannelData: () => new Float32Array(28) }; }
  resume() {
    if (AudioContextMock.allowed) { this.transition('running'); return Promise.resolve(); }
    return new Promise(resolve => this.pending.push(resolve));
  }
  transition(state) { this.state = state; this.onstatechange?.(); }
  allow() { AudioContextMock.allowed = true; this.transition('running'); this.pending.splice(0).forEach(resolve => resolve()); }
  suspend() { this.transition('suspended'); return Promise.resolve(); }
  close() { this.transition('closed'); this.pending.splice(0).forEach(resolve => resolve()); return Promise.resolve(); }
}
globalThis.AudioContext = AudioContextMock;
globalThis.document = { hidden: false };

test('audio starts automatically when the browser permits it', async t => {
  AudioContextMock.allowed = true;
  const states = [], score = new FilmScore(running => states.push(running));
  t.after(() => score.dispose());
  assert.equal(await score.enable(), true);
  assert.equal(score.enabled, true);
  assert.equal(states.at(-1), true);
});

test('a blocked start can retry, and interruptions update the sound indicator', async t => {
  AudioContextMock.allowed = false;
  const states = [], score = new FilmScore(running => states.push(running));
  t.after(() => score.dispose());
  const blocked = score.enable();
  const ctx = AudioContextMock.latest;
  assert.equal(score.enabled, false);
  AudioContextMock.allowed = true;
  const gesture = score.enable();
  ctx.allow();
  assert.equal(await gesture, true);
  assert.equal(await blocked, false);
  ctx.transition('interrupted');
  assert.equal(score.enabled, false);
  assert.equal(states.at(-1), false);
  assert.equal(await score.enable(), true);
  assert.equal(states.at(-1), true);
});

test('muting cancels a pending autoplay attempt', async t => {
  AudioContextMock.allowed = false;
  const score = new FilmScore();
  t.after(() => score.dispose());
  const pending = score.enable();
  score.mute();
  AudioContextMock.latest.allow();
  assert.equal(await pending, false);
  assert.equal(score.enabled, false);
});

test('disposed audio never reports playback after a pending resume', async () => {
  AudioContextMock.allowed = false;
  const states = [], score = new FilmScore(running => states.push(running));
  const pending = score.enable();
  score.dispose();
  assert.equal(await pending, false);
  assert.deepEqual(states, []);
});
