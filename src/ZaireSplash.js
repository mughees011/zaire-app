import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './ZaireSplash.css';

/* ── Exact same params as App.js main orb ── */
const PARAMS = {
  timeScale:       0.78,
  rotationSpeedX:  0.0012,
  rotationSpeedY:  0.004,
  plasmaScale:     0.1504,
  plasmaBrightness: 1.5,
  voidThreshold:   0.05,
  colorDeep:   0x000833,
  colorMid:    0x0044ff,
  colorBright: 0x00ccff,
  shellColor:  0x0088ff,
  shellOpacity: 0.35,
};

const NOISE_GLSL = `
  vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  float snoise(vec3 v){
    vec2 C=vec2(1.0/6.0,1.0/3.0);
    vec4 D=vec4(0.0,0.5,1.0,2.0);
    vec3 i=mod289(floor(v+dot(v,C.yyy)));
    vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz);
    vec3 l=1.0-g;
    vec3 i1=min(g.xyz,l.zxy);
    vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx;
    vec3 x2=x0-i2+C.yyy;
    vec3 x3=x0-D.yyy;
    vec4 p=permute(permute(permute(
      i.z+vec4(0.0,i1.z,i2.z,1.0)
      +i.y+vec4(0.0,i1.y,i2.y,1.0)
      +i.x+vec4(0.0,i1.x,i2.x,1.0))
    ));
    float n_=0.142857142857;
    vec4 ns=vec4(n_*D.w,n_*D.y,n_*D.z,n_*D.x)-vec4(0.0,0.0,D.x,D.x);
    vec4 j=p-ns.z*ns.z*floor(p*ns.z*ns.z);
    vec4 x_=floor(j*ns.z);
    vec4 y_=floor(j-ns.w*7.0*x_);
    vec4 x=x_+0.5*floor(y_*ns.x+vec4(0.0,ns.x,0.0,0.0));
    vec4 y=y_+0.5*floor(x_*ns.x+vec4(0.0,ns.x,0.0,0.0));
    vec4 h=1.0-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy);
    vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.0+1.0;
    vec4 s1=floor(b1)*2.0+1.0;
    vec4 sh=-step(h,vec4(0.0));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
    vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x);
    vec3 p1=vec3(a0.zw,h.y);
    vec3 p2=vec3(a1.xy,h.z);
    vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
    vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
    m=m*m;
    return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }
  float fbm(vec3 p){
    float total=0.0;float amplitude=0.5;float frequency=1.0;
    for(int i=0;i<3;i++){total+=snoise(p*frequency)*amplitude;amplitude*=0.5;frequency*=2.0;}
    return total;
  }
`;

/* ── Timing constants (seconds) ── */
const T_ORB_RISE_END   = 0.5;   // frame 15
const T_HEX_FADE_END   = 1.5;   // frame 45
const T_TEXT_APPEAR    = 1.5;   // frame 45
const T_SCAN_END       = 2.2;   // frame 65
const T_FLASH_START    = 2.2;   // frame 65
const T_TOTAL          = 2.5;   // frame 75 — cut
const T_EXIT_BUFFER    = 0.3;   // CSS exit animation

export default function ZaireSplash({ onComplete, isReady = true }) {
  const onCompleteRef  = useRef(onComplete);
  const isReadyRef     = useRef(isReady);
  const threeCanvasRef = useRef(null);
  const rootRef        = useRef(null);
  const rafRef         = useRef(null);
  const exitTimerRef   = useRef(null);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    isReadyRef.current = isReady;
  }, [isReady]);

  const triggerExit = useCallback(() => {
    const root = rootRef.current;
    if (!root) { onCompleteRef.current && onCompleteRef.current(); return; }
    root.classList.add('zsplash-exit');
    exitTimerRef.current = setTimeout(() => { onCompleteRef.current && onCompleteRef.current(); }, T_EXIT_BUFFER * 1000);
  }, []);

  useEffect(() => {
    const canvas = threeCanvasRef.current;
    if (!canvas) return;

    /* ─────────────────── THREE.JS SCENE ─────────────────── */
    const scene    = new THREE.Scene();
    scene.background = null;

    const camera   = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 4;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping        = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    renderer.setClearColor(0x000000, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan     = false;
    controls.enableZoom    = false;
    controls.enableRotate  = false;

    /* ── Group ── */
    const mainGroup = new THREE.Group();
    mainGroup.position.y = -2;
    scene.add(mainGroup);

    /* ── Point light ── */
    const pointLight = new THREE.PointLight(0x0088ff, 2.0, 10);
    mainGroup.add(pointLight);

    /* ── Shell shaders ── */
    const shellVert = `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main(){
        vNormal=normalize(normalMatrix*normal);
        vec4 mvPosition=modelViewMatrix*vec4(position,1.0);
        vViewPosition=-mvPosition.xyz;
        gl_Position=projectionMatrix*mvPosition;
      }`;
    const shellFrag = `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uSweepProgress;
      void main(){
        float fresnel=pow(1.0-dot(normalize(vNormal),normalize(vViewPosition)),2.5);
        vec3 finalColor = uColor;
        float finalOpacity = fresnel * uOpacity;

        // 3D Rim Light Sweep
        if (uSweepProgress > 0.0 && uSweepProgress < 1.0) {
          float angle = atan(vNormal.y, vNormal.x);
          float targetAngle = mix(3.14159, 0.0, uSweepProgress);
          float diff = angle - targetAngle;
          float sweepMask = 0.0;
          if (diff > 0.0 && diff < 1.0) {
            sweepMask = 1.0 - diff; // fading tail
          } else if (diff <= 0.0 && diff > -0.1) {
            sweepMask = 1.0 + diff * 10.0; // sharp head
          }
          sweepMask *= step(0.0, vNormal.y); // top half only
          sweepMask *= smoothstep(0.4, 0.8, fresnel); // constrain to edge
          
          finalColor += vec3(0.0, 1.0, 1.0) * sweepMask * 2.0;
          finalOpacity = max(finalOpacity, sweepMask);
        }

        gl_FragColor=vec4(finalColor, finalOpacity);
      }`;

    const shellGeo = new THREE.SphereGeometry(1.0, 64, 64);
    const shellBackMat = new THREE.ShaderMaterial({
      vertexShader: shellVert, fragmentShader: shellFrag,
      uniforms: { uColor: { value: new THREE.Color(0x000055) }, uOpacity: { value: 0.3 }, uSweepProgress: { value: 0 } },
      transparent: true, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false,
    });
    const shellFrontMat = new THREE.ShaderMaterial({
      vertexShader: shellVert, fragmentShader: shellFrag,
      uniforms: {
        uColor:   { value: new THREE.Color(PARAMS.shellColor) },
        uOpacity: { value: PARAMS.shellOpacity },
        uSweepProgress: { value: 0 },
      },
      transparent: true, blending: THREE.AdditiveBlending, side: THREE.FrontSide, depthWrite: false,
    });
    mainGroup.add(new THREE.Mesh(shellGeo, shellBackMat));
    mainGroup.add(new THREE.Mesh(shellGeo, shellFrontMat));

    /* ── Plasma sphere ── */
    const plasmaGeo = new THREE.SphereGeometry(0.998, 128, 128);
    const plasmaMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime:        { value: 0 },
        uTransition:  { value: 1.0 },
        uScale:       { value: PARAMS.plasmaScale },
        uBrightness:  { value: PARAMS.plasmaBrightness },
        uThreshold:   { value: PARAMS.voidThreshold },
        uColorDeep:   { value: new THREE.Color(PARAMS.colorDeep) },
        uColorMid:    { value: new THREE.Color(PARAMS.colorMid) },
        uColorBright: { value: new THREE.Color(0x00b4ff) },
        uAudioBass:      { value: 0 },
        uAudioMid:       { value: 0 },
        uAudioTreble:    { value: 0 },
        uAudioIntensity: { value: 0 },
      },
      vertexShader: `
        uniform float uAudioBass;
        uniform float uAudioMid;
        uniform float uAudioTreble;
        uniform float uAudioIntensity;
        uniform float uTime;
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main(){
          vec3 pos=position;
          float angle=atan(pos.y,pos.x);
          float audioInfluence=sin(angle*8.0+uTime)*uAudioBass*0.15+sin(angle*12.0+uTime*0.5)*uAudioMid*0.12+sin(angle*16.0)*uAudioTreble*0.1;
          pos=normalize(pos)*(1.0+audioInfluence*uAudioIntensity);
          vPosition=pos;
          vNormal=normalize(normalMatrix*pos);
          vec4 mvPosition=modelViewMatrix*vec4(pos,1.0);
          vViewPosition=-mvPosition.xyz;
          gl_Position=projectionMatrix*mvPosition;
        }`,
      fragmentShader: `
        uniform float uTime;
        uniform float uTransition;
        uniform float uScale;
        uniform float uBrightness;
        uniform float uThreshold;
        uniform vec3 uColorDeep;
        uniform vec3 uColorMid;
        uniform vec3 uColorBright;
        uniform float uAudioBass;
        uniform float uAudioMid;
        uniform float uAudioTreble;
        uniform float uAudioIntensity;
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        ${NOISE_GLSL}
        void main(){
          float g=fract(sin(dot(vPosition.xy,vec2(12.9898,78.233)))*43758.5453);
          if(g>uTransition)discard;
          vec3 p=vPosition*uScale;
          vec3 q=vec3(
            fbm(p+vec3(0.0,uTime*0.05,0.0)),
            fbm(p+vec3(5.2,1.3,2.8)+uTime*0.05),
            fbm(p+vec3(2.2,8.4,0.5)-uTime*0.02)
          );
          float density=fbm(p+2.0*q);
          float audioWave=sin(atan(vPosition.y,vPosition.x)*8.0)*uAudioBass+sin(atan(vPosition.y,vPosition.x)*12.0)*uAudioMid;
          float t=(density+0.4+audioWave*0.3)*0.8;
          float alpha=smoothstep(uThreshold,0.7,t);
          float audioBoost=uAudioBass*0.4+uAudioMid*0.3+uAudioTreble*0.2;
          vec3 cWhite=vec3(1.0,1.0,1.0);
          vec3 color=mix(uColorDeep,uColorMid,smoothstep(uThreshold,0.5,t));
          color=mix(color,uColorBright,smoothstep(0.5,0.8,t));
          color=mix(color,cWhite,smoothstep(0.8,1.0,t)*audioBoost);
          float facing=dot(normalize(vNormal),normalize(vViewPosition));
          vec2 hexCoord=vPosition.xy*8.0;
          vec2 hexPos=abs(mod(hexCoord,1.0)-0.5);
          float hexGrid=1.0-smoothstep(0.02,0.05,max(hexPos.x,hexPos.y));
          color=mix(color,uColorBright*1.5,hexGrid*0.1);
          float depthFactor=(facing+1.0)*0.5;
          float finalAlpha=alpha*(0.02+0.98*depthFactor)*(1.0+audioBoost*0.5);
          float voiceRipple=sin(vPosition.y*45.0+uTime*12.0)*uAudioIntensity*0.25;
          color+=uColorBright*voiceRipple;
          gl_FragColor=vec4(color*uBrightness*(1.0+audioBoost*0.3),finalAlpha*uTransition);
        }`,
      transparent: true, blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide, depthWrite: false,
    });

    plasmaMat.uniforms.uColorBright.value = new THREE.Color(0x00b4ff);
    plasmaMat.uniforms.uColorMid.value    = new THREE.Color(0x0044ff);
    plasmaMat.uniforms.uColorDeep.value   = new THREE.Color(0x000833);

    const plasmaMesh = new THREE.Mesh(plasmaGeo, plasmaMat);
    mainGroup.add(plasmaMesh);

    /* ── Particles ── */
    const pCount = 600;
    const pPos   = new Float32Array(pCount * 3);
    const pSizes = new Float32Array(pCount);
    const sR = 0.95;
    for (let i = 0; i < pCount; i++) {
      const r     = sR * Math.cbrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      pPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pPos[i * 3 + 2] = r * Math.cos(phi);
      pSizes[i] = Math.random();
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('aSize',    new THREE.BufferAttribute(pSizes, 1));
    const pMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(0xffffff) } },
      vertexShader: `
        uniform float uTime;
        attribute float aSize;
        varying float vAlpha;
        void main(){
          vec3 pos=position;
          pos.y+=sin(uTime*0.2+pos.x)*0.02;
          pos.x+=cos(uTime*0.15+pos.z)*0.02;
          vec4 mvPosition=modelViewMatrix*vec4(pos,1.0);
          gl_Position=projectionMatrix*mvPosition;
          
          float isSpecial = step(0.98, aSize);
          float flash = pow(sin(uTime * 8.0 + aSize * 100.0), 2.0);
          
          float baseSize = 8.0 * aSize + 4.0;
          baseSize += isSpecial * flash * 15.0; // special ones pulse bigger
          
          gl_PointSize=baseSize*(1.0/-mvPosition.z);
          vAlpha = mix(0.8+0.2*sin(uTime+aSize*10.0), flash * 2.0 + 0.5, isSpecial);
        }`,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;
        void main(){
          vec2 uv=gl_PointCoord-vec2(0.5);
          if(length(uv)>0.5)discard;
          float glow=pow(1.0-length(uv)*2.0,1.8);
          gl_FragColor=vec4(uColor,glow*vAlpha);
        }`,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    mainGroup.add(new THREE.Points(pGeo, pMat));

    mainGroup.scale.set(2.5, 2.5, 2.5);

    /* ── Resize ── */
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    /* ─────────────────── SEQUENCED RENDER LOOP ─────────────────── */
    const startTime = performance.now();
    let exitFired = false;

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      if (document.hidden) return;
      const elapsed = (performance.now() - startTime) * 0.001; // seconds

      /* ── Phase 0-0.5s: fade in ── */
      mainGroup.position.y = -2;
      mainGroup.scale.set(2.5, 2.5, 2.5);

      /* ── Camera Drift (parallax depth) ── */
      camera.position.x = elapsed * 0.04;
      camera.position.y = elapsed * 0.03;

      /* ── Orb opacity and Rim Light Sweep driven via material ── */
      const orbOpacity = Math.min(elapsed / T_ORB_RISE_END, 1);
      plasmaMat.uniforms.uTransition.value = orbOpacity;
      shellFrontMat.uniforms.uOpacity.value = PARAMS.shellOpacity * orbOpacity;
      
      let sweep = 0;
      if (elapsed > 0.5) {
        // If we've reached the end of the first sweep but are still waiting for readiness, loop the sweep continuously
        if (elapsed > 2.0 && !isReadyRef.current) {
          sweep = ((elapsed - 0.5) % 1.5) / 1.5;
        } else {
          sweep = Math.min((elapsed - 0.5) / 1.5, 1.0);
        }
      }
      shellFrontMat.uniforms.uSweepProgress.value = sweep;

      /* ── Plasma / particle time ── */
      plasmaMat.uniforms.uTime.value = elapsed * PARAMS.timeScale;
      pMat.uniforms.uTime.value      = elapsed;
      plasmaMesh.rotation.y          = elapsed * 0.08;
      mainGroup.rotation.x          += PARAMS.rotationSpeedX;
      mainGroup.rotation.y          += PARAMS.rotationSpeedY;

      controls.update();
      renderer.render(scene, camera);

      /* ── Hex grid HUD opacity and drift ── */
      const hexGrid = document.getElementById('zs-hex-grid');
      if (hexGrid) {
        const hexAlpha = Math.max(0, Math.min((elapsed - T_ORB_RISE_END) / (T_HEX_FADE_END - T_ORB_RISE_END), 1));
        hexGrid.style.opacity = hexAlpha;
        hexGrid.style.transform = `translate(${elapsed * 6}px, ${elapsed * 4}px)`;
      }

      /* ── Star particles: twinkle after 0.5s ── */
      const stars = document.getElementById('zs-stars');
      if (stars && elapsed > T_ORB_RISE_END) {
        stars.style.opacity = Math.min((elapsed - T_ORB_RISE_END) / 0.5, 1);
      }

      /* ── Exit sequence at 2.2s (or later if not ready) ── */
      if (elapsed >= T_FLASH_START && !exitFired && isReadyRef.current) {
        exitFired = true;
        triggerExit();
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(exitTimerRef.current);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={rootRef} className="zsplash-root">
      {/* Three.js canvas */}
      <canvas ref={threeCanvasRef} id="zs-three-canvas" />

      {/* Hexagonal grid overlay */}
      <svg id="zs-hex-grid" aria-hidden="true">
        <defs>
          <pattern id="hex-pat" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
            <polygon
              points="30,2 58,17 58,46 30,60 2,46 2,17"
              fill="none"
              stroke="rgba(0,212,255,0.12)"
              strokeWidth="0.8"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex-pat)" />
      </svg>

      {/* Star field */}
      <div id="zs-stars" aria-hidden="true">
        {Array.from({ length: 80 }).map((_, i) => (
          <span
            key={i}
            className="zs-star"
            style={{
              left:              `${Math.random() * 100}%`,
              top:               `${Math.random() * 100}%`,
              animationDelay:    `${(Math.random() * 2).toFixed(2)}s`,
              animationDuration: `${(1.2 + Math.random() * 1.8).toFixed(2)}s`,
              width:             `${(1 + Math.random() * 2).toFixed(1)}px`,
              height:            `${(1 + Math.random() * 2).toFixed(1)}px`,
            }}
          />
        ))}
      </div>

      {/* HUD overlay */}
      <div id="hud">
        <div className="zs-vignette" />

        {/* Z·A·I·R·E title — appears at 1.5s */}
        <div className="zs-title-block">
          <div className="zs-title" id="zs-title">Z·A·I·R·E</div>
          <div className="zs-subtitle" id="zs-subtitle">ENGINEER MODE FIRST · AI OPERATING SYSTEM FOR BUILDING</div>
        </div>

        {/* Bottom boot bar */}
        <div className="zs-bottom-hud">
          <div className="zs-boot-track">
            <div className="zs-boot-fill" />
            <div className="zs-boot-head" />
          </div>
          <div className="zs-boot-label" id="zs-boot-lbl">CALIBRATING ENGINEER CORE...</div>
        </div>
      </div>

    </div>
  );
}
