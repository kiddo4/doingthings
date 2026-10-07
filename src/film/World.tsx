import { useEffect, useRef, useState, type RefObject } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { clamp, smooth, type FilmState } from './story';

type Props = { state: RefObject<FilmState>; onReady: () => void };

function sculpt(geometry: THREE.BufferGeometry, intensity: number) {
  const position = geometry.attributes.position;
  const normals = geometry.attributes.normal;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), y = position.getY(i), z = position.getZ(i);
    const wave = Math.sin(x * 8 + z * 3) * Math.cos(y * 7 - z * 5) * 0.5 + Math.sin(x * 19 + y * 11 + z * 13) * 0.18;
    position.setXYZ(i, x + normals.getX(i) * wave * intensity, y + normals.getY(i) * wave * intensity, z + normals.getZ(i) * wave * intensity);
  }
  geometry.computeVertexNormals();
  return geometry;
}

export default function World({ state, onReady }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const ready = useRef(onReady);
  const [failed, setFailed] = useState(false);
  useEffect(() => { ready.current = onReady; }, [onReady]);
  useEffect(() => {
    const element = host.current!;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' }); }
    catch { requestAnimationFrame(() => { setFailed(true); ready.current(); }); return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.25 : 1.6));
    renderer.setClearColor(0x050505, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.85;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    element.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050505, 0.022);
    const camera = new THREE.PerspectiveCamera(39, 1, 0.1, 100);
    camera.position.set(0, 0, 8.7);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const studio = new THREE.Scene();
    studio.background = new THREE.Color(0x070708);
    const panels: THREE.Mesh[] = [];
    for (const [x, y, z, w, h, power] of [[-4, 2, 2, 2, 7, 3], [5, 1, -2, 2, 5, 4], [0, 6, 0, 6, 1.5, 2.5], [1, -4, 3, 3, 1, 1.5]]) {
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(power, power, power * 0.96), side: THREE.DoubleSide }));
      panel.position.set(x, y, z); panel.lookAt(0, 0, 0); studio.add(panel); panels.push(panel);
    }
    const env = pmrem.fromScene(studio, 0.03);
    scene.environment = env.texture;
    panels.forEach(panel => { panel.geometry.dispose(); (panel.material as THREE.Material).dispose(); });
    const key = new THREE.DirectionalLight(0xf8f4e7, 4.5); key.position.set(-3, 4, 4); scene.add(key);
    const rim = new THREE.DirectionalLight(0xd2dbe5, 3.5); rim.position.set(5, -1, -2); scene.add(rim);
    const fill = new THREE.PointLight(0xffffff, 25, 20, 2); fill.position.set(0, 3, 4); scene.add(fill);
    const heart = new THREE.PointLight(0xffe3b1, 0, 18, 2); scene.add(heart);
    const silver = new THREE.MeshStandardMaterial({ color: 0xa8aaa7, metalness: 1, roughness: 0.19, envMapIntensity: 1.05 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x313330, metalness: 0.82, roughness: 0.36, envMapIntensity: 1.2 });
    const pearl = new THREE.MeshPhysicalMaterial({ color: 0xe8e4d9, metalness: 0.5, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.14 });
    const filament = new THREE.MeshStandardMaterial({ color: 0xbab8a8, metalness: 0.8, roughness: 0.25, emissive: 0x3e382b, emissiveIntensity: 0.14 });

    // Hero relic: actual sculpted geometry with polished ridges and orbiting filaments.
    const relic = new THREE.Group();
    const torus = sculpt(new THREE.TorusGeometry(1.42, 0.32, 48, 240), 0.23);
    const positions = torus.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i), angle = Math.atan2(y, x);
      positions.setXYZ(i, x * (1 + Math.sin(angle * 3) * 0.075), y * 1.14, z + Math.sin(angle * 3) * 0.22);
    }
    torus.computeVertexNormals();
    const ring = new THREE.Mesh(torus, silver); relic.add(ring);
    const ridge = new THREE.Mesh(sculpt(new THREE.TorusKnotGeometry(1.2, 0.12, 260, 12, 2, 3), 0.035), dark);
    ridge.scale.set(1.05, 1.22, 0.58); relic.add(ridge);
    for (let n = 0; n < 6; n++) {
      const points = Array.from({ length: 181 }, (_, i) => {
        const angle = i / 180 * Math.PI * 2;
        const radius = 1.67 + 0.12 * Math.sin(angle * 3 + n);
        return new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius * 1.1, Math.sin(angle * 2 + n) * 0.4);
      });
      const thread = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, true), 180, 0.004, 4, true), filament);
      thread.rotation.set(n * 0.045, n * 0.075, n * 0.07); relic.add(thread);
    }
    scene.add(relic);

    // Five gifts, each with its own silhouette and movement.
    const gods: THREE.Group[] = [];
    for (let i = 0; i < 5; i++) { const group = new THREE.Group(); scene.add(group); gods.push(group); }
    const tech = new THREE.Mesh(sculpt(new THREE.IcosahedronGeometry(1.02, 1), 0.12), silver); gods[0].add(tech);
    for (let i = 0; i < 3; i++) { const hoop = new THREE.Mesh(new THREE.TorusGeometry(1.35 + i * 0.11, 0.016, 8, 120), filament); hoop.rotation.set(i * 0.8, i * 0.9, i * 0.5); gods[0].add(hoop); }
    for (let i = 0; i < 7; i++) { const wave = new THREE.Mesh(sculpt(new THREE.TorusGeometry(0.45 + i * 0.13, 0.035 + i * 0.003, 12, 140), 0.01), silver); wave.position.z = (i - 3) * 0.14; gods[1].add(wave); }
    // Design: a suspended interface, assembled from planes with real depth.
    for (let i = 0; i < 5; i++) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(1.65, i === 0 ? 1.95 : 0.22, 0.075), i === 0 ? dark : pearl);
      panel.position.set(i === 0 ? 0 : 0.13, i === 0 ? 0 : 0.87 - i * 0.36, i === 0 ? -0.3 : 0.08 + i * 0.12);
      panel.rotation.y = -0.2; gods[2].add(panel);
    }
    // Engineering: connected modules form a working structure.
    for (let i = 0; i < 8; i++) {
      const x = (i & 1 ? 1 : -1) * 0.64, y = (i & 2 ? 1 : -1) * 0.64, z = (i & 4 ? 1 : -1) * 0.64;
      const node = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), silver);
      node.position.set(x, y, z); gods[3].add(node);
      for (let axis = 0; axis < 3; axis++) {
        if (i & (1 << axis)) continue;
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.28, 10), filament);
        beam.position.set(axis === 0 ? 0 : x, axis === 1 ? 0 : y, axis === 2 ? 0 : z);
        if (axis === 0) beam.rotation.z = Math.PI / 2;
        if (axis === 2) beam.rotation.x = Math.PI / 2;
        gods[3].add(beam);
      }
    }
    for (let i = 0; i < 7; i++) { const y = (i - 3) * 0.28; const disc = new THREE.Mesh(new THREE.CylinderGeometry(Math.sqrt(1.25 - y * y), Math.sqrt(1.25 - y * y), 0.2, 80), i % 2 ? dark : silver); disc.position.y = y; gods[4].add(disc); }

    // Instanced shards travel through real depth during the fall and the handover.
    const shards = new THREE.InstancedMesh(new THREE.TetrahedronGeometry(0.07, 0), silver, 150);
    const dummy = new THREE.Object3D();
    const shardSeeds = Array.from({ length: 150 }, (_, i) => ({ a: i * 2.39996, r: 1.4 + Math.sin(i * 4.13) * 0.4, z: Math.sin(i * 7.71) * 1.2, size: 0.4 + (Math.sin(i * 17.21) + 1) * 0.6 }));
    scene.add(shards);
    const dustGeometry = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(1800 * 3);
    for (let i = 0; i < 1800; i++) { dustPositions[i * 3] = Math.sin(i * 12.9898) * 18; dustPositions[i * 3 + 1] = Math.sin(i * 78.233) * 12; dustPositions[i * 3 + 2] = -30 + (Math.sin(i * 31.173) + 1) * 19; }
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const moteCanvas = document.createElement('canvas'); moteCanvas.width = 32; moteCanvas.height = 32;
    const moteContext = moteCanvas.getContext('2d')!;
    const moteGradient = moteContext.createRadialGradient(16, 16, 0, 16, 16, 16);
    moteGradient.addColorStop(0, '#ffffff'); moteGradient.addColorStop(0.2, '#ffffffbb'); moteGradient.addColorStop(1, '#ffffff00');
    moteContext.fillStyle = moteGradient; moteContext.fillRect(0, 0, 32, 32);
    const moteTexture = new THREE.CanvasTexture(moteCanvas);
    const dustMaterial = new THREE.PointsMaterial({ color: 0xc8c6bb, map: moteTexture, size: 0.045, transparent: true, opacity: 0.55, depthWrite: false, sizeAttenuation: true });
    const dust = new THREE.Points(dustGeometry, dustMaterial); scene.add(dust);
    const halo = new THREE.Mesh(new THREE.SphereGeometry(0.085, 32, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 3.5, 2.5) })); scene.add(halo);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.13, 0.45, 1.55); composer.addPass(bloom);
    const outputPass = new OutputPass(); composer.addPass(outputPass);
    let width = 1, height = 1, frame = 0, time = 0, last = 0, smoothed = state.current.progress, inView = true;
    let first = true, pulse = 0, previousPulse = 0, lost = false;
    const size = () => { width = element.clientWidth; height = element.clientHeight; renderer.setSize(width, height); composer.setSize(width, height); camera.aspect = width / height; camera.updateProjectionMatrix(); };
    const draw = (timestamp: number) => {
      frame = 0;
      if (lost || !inView || document.hidden) return;
      if (!first && state.current.motion && timestamp - last < 1000 / 36) { frame = requestAnimationFrame(draw); return; }
      const dt = Math.min((timestamp - last) / 1000 || 0.016, 0.05); last = timestamp;
      const s = state.current, mobile = width < 700;
      if (s.motion) time += dt;
      smoothed += (s.progress - smoothed) * (s.motion ? 1 - Math.exp(-dt * 8) : 1);
      const p = smoothed;
      if (s.pulse !== previousPulse) { previousPulse = s.pulse; pulse = 1; }
      pulse *= Math.exp(-dt * 2.8);
      const px = s.motion ? s.pointerX : 0, py = s.motion ? s.pointerY : 0;
      const godWindow = smooth((p - 1.75) * 4) * (1 - smooth((p - 6.82) * 5));
      const pantheon = smooth((p - 0.8) * 3) * (1 - smooth((p - 1.8) * 5));
      const fall = smooth((p - 6.85) * 2.5) * (1 - smooth((p - 8.4) * 2));
      const gift = smooth((p - 7.9) * 2) * (1 - smooth((p - 9.2) * 2));
      const makers = smooth((p - 8.8) * 2);
      const growth = smooth((p - 8.6) * 1.4) * (1 - smooth((p - 9.65) * 2));
      const targetX = mobile ? 0 : 1.65 * (1 - pantheon) * (1 - makers);
      const targetY = mobile ? (p < 1 ? 0.25 : godWindow ? 0.65 : 0) : 0;
      relic.position.set(targetX + px * 0.16, targetY - py * 0.12, 0);
      const relicScale = (mobile ? 0.95 : 1.23) * (1 - pantheon * 0.77) * (1 - godWindow * 0.99) * (1 - fall * 0.85) * (1 + growth * 0.75) + pulse * 0.08;
      relic.scale.setScalar(Math.max(0.01, relicScale));
      relic.visible = godWindow < 0.97;
      relic.rotation.set(0.16 + Math.sin(time * 0.16) * 0.17 + py * 0.13, -0.5 + time * 0.075 + p * 0.35 + px * 0.2, -0.28 + Math.sin(time * 0.1) * 0.12);
      ring.rotation.z = Math.sin(time * 0.1) * 0.035;
      ridge.rotation.z = -time * 0.03;
      gods.forEach((god, i) => {
        const focus = Math.max(0, 1 - Math.abs(p - (i + 2.45)) / 0.75) * godWindow;
        const focusEase = smooth(clamp(focus * 2));
        const orbitAngle = i / 5 * Math.PI * 2 + time * 0.06 - Math.PI / 2;
        const orbitX = Math.cos(orbitAngle) * (mobile ? 1.48 : 3.2), orbitY = Math.sin(orbitAngle) * (mobile ? 1.8 : 1.9);
        const orbitScale = pantheon * (mobile ? 0.38 : 0.5);
        const actualFocus = smooth((p - (i + 1.85)) * 5) * (1 - smooth((p - (i + 2.85)) * 5));
        god.position.set(THREE.MathUtils.lerp(orbitX, mobile ? 0 : 1.85, actualFocus), THREE.MathUtils.lerp(orbitY, mobile ? 1.35 : 0, actualFocus), -0.6 + actualFocus * 0.6);
        const scale = orbitScale + actualFocus * (mobile ? (height < 740 ? 0.85 : 1.03) : 1.67) + focusEase * 0.005;
        god.scale.setScalar(Math.max(0.001, scale)); god.visible = scale > 0.015;
        god.rotation.set(Math.sin(time * 0.14 + i) * 0.22 + py * 0.12, (i === 2 ? 0.2 + Math.sin(time * 0.14) * 0.4 : time * (i === 4 ? 0.14 : 0.09) + i * 0.2) + px * 0.2, Math.sin(time * 0.1 + i) * 0.18);
        if (i === 1) god.children.forEach((child, j) => { child.rotation.x = Math.sin(time * 0.75 - j * 0.3) * 0.28; child.scale.setScalar(1 + Math.sin(time * 1.8 - j * 0.45) * 0.04); });
        if (i === 4) god.children.forEach((child, j) => { child.position.x = Math.sin(time * 0.55 + j * 0.6) * 0.16; });
      });
      shards.visible = fall > 0.01 || gift > 0.01;
      if (shards.visible) {
        const spread = 1 + fall * 4.8 - gift * 2;
        shardSeeds.forEach((seed, i) => {
          dummy.position.set(Math.cos(seed.a + time * 0.1) * seed.r * spread, Math.sin(seed.a + time * 0.1) * seed.r * spread, seed.z * spread + Math.sin(time * 0.1 + i) * fall * 4);
          dummy.rotation.set(time * 0.3 + i, time * 0.16 + i, i);
          dummy.scale.setScalar(seed.size * (fall + gift * 0.5)); dummy.updateMatrix(); shards.setMatrixAt(i, dummy.matrix);
        }); shards.instanceMatrix.needsUpdate = true;
      }
      halo.visible = gift > 0.01;
      halo.scale.setScalar(0.5 + gift * 3 + pulse);
      heart.intensity = gift * 38;
      const behind = makers ? 1 : 0;
      camera.position.x = px * 0.23 + Math.sin(growth * Math.PI) * 0.28;
      camera.position.y = -py * 0.15;
      camera.position.z = (mobile ? 9.8 : 8.5) - gift * 0.55 - growth * 5.3 + behind * 0.3;
      camera.lookAt(0, 0, 0);
      camera.rotation.z = -fall * 0.045;
      dust.rotation.y = time * 0.01 + p * 0.05;
      dust.position.z = (p * 1.8) % 6;
      dustMaterial.opacity = 0.38 + fall * 0.42;
      key.intensity = 2.6 - fall * 2 + gift * 1.5;
      fill.intensity = 12 - fall * 10;
      bloom.enabled = gift > 0.02;
      bloom.strength = 0.12 + gift * 0.4;
      composer.render();
      if (first) { first = false; ready.current(); }
      // Reduced-motion draws only when the scene or pointer-independent state changes.
      if (s.motion || Math.abs(s.progress - smoothed) > 0.001) frame = requestAnimationFrame(draw);
    };
    const wake = () => { if (!frame && inView && !document.hidden && !lost) frame = requestAnimationFrame(draw); };
    const resize = new ResizeObserver(() => { size(); wake(); }); resize.observe(element);
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; if (inView) wake(); else { cancelAnimationFrame(frame); frame = 0; } }); observer.observe(element);
    const visibility = () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else wake(); };
    const contextLost = (event: Event) => { event.preventDefault(); lost = true; cancelAnimationFrame(frame); setFailed(true); };
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('scroll', wake, { passive: true });
    window.addEventListener('film-state-change', wake);
    size(); wake();
    return () => {
      cancelAnimationFrame(frame); resize.disconnect(); observer.disconnect();
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('scroll', wake); window.removeEventListener('film-state-change', wake);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      scene.traverse(object => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) { object.geometry.dispose(); const materials = Array.isArray(object.material) ? object.material : [object.material]; materials.forEach(material => material.dispose()); }
      });
      moteTexture.dispose(); env.dispose(); pmrem.dispose(); bloom.dispose(); outputPass.dispose(); composer.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, [state]);
  return <div className={`world${failed ? ' world-fallback' : ''}`} ref={host} aria-label="An evolving world of silver sculptures, orbiting forms and scattered starlight">{failed && <img src="/art/becoming.webp" alt="A sculptural silver form emerging from the dark" />}</div>;
}
