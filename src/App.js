/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Navbar from './Navbar';
import SettingsModal from './SettingsModal';
import './App.css';

const DEFAULT_BLOB_COLOR = '#00b4ff';
const HEX6_COLOR_REGEX = /^#[0-9a-f]{6}$/i;

function normalizeHexColor(value) {
  if (!value || typeof value !== 'string') return DEFAULT_BLOB_COLOR;
  const trimmed = value.trim();
  return HEX6_COLOR_REGEX.test(trimmed) ? trimmed.toLowerCase() : DEFAULT_BLOB_COLOR;
}

function App() {
  const threeCanvasRef = useRef(null);
  const gridCanvasRef = useRef(null);
  const cameraRef = useRef(null);
  const dragStateRef = useRef({ isPointerDown: false });
  const [bootText, setBootText] = useState('INITIALIZING SYSTEM...');

  const [blobColor, setBlobColor] = useState(() => normalizeHexColor(localStorage.getItem('blobColor') || DEFAULT_BLOB_COLOR));
  const [blobSize, setBlobSize] = useState(() => parseFloat(localStorage.getItem('blobSize')) || 1.0);
  const [blobPosition, setBlobPosition] = useState(() => {
    const saved = localStorage.getItem('blobPosition');
    return saved ? JSON.parse(saved) : { x: 0, y: 0 };
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const mainGroupRef = useRef(null);
  const uniformsRef = useRef(null);

  // Sync state to 3D refs and LocalStorage
  useEffect(() => {
    localStorage.setItem('blobColor', blobColor);
    localStorage.setItem('blobSize', blobSize.toString());
    localStorage.setItem('blobPosition', JSON.stringify(blobPosition));

    if (mainGroupRef.current) {
      mainGroupRef.current.scale.set(blobSize, blobSize, blobSize);
      // We flip Y because DOM runs top-down, but ThreeJS runs bottom-up
      mainGroupRef.current.position.set(blobPosition.x, blobPosition.y, 0);
    }
    
    if (uniformsRef.current) {
      const baseColor = new THREE.Color(blobColor);
      const hsl = {};
      baseColor.getHSL(hsl);
      const bright = baseColor.clone();
      const mid = new THREE.Color().setHSL(hsl.h, hsl.s, Math.max(0, hsl.l - 0.2));
      const deep = new THREE.Color().setHSL(hsl.h, hsl.s, Math.max(0, hsl.l - 0.4));
      
      uniformsRef.current.uColorBright.value = bright;
      uniformsRef.current.uColorMid.value = mid;
      uniformsRef.current.uColorDeep.value = deep;
    }
  }, [blobColor, blobSize, blobPosition]);

  // Handle dragging using pointer coordinates mapped to world space (z = 0 plane).
  const updateBlobPositionFromPointer = (clientX, clientY) => {
    const camera = cameraRef.current;
    if (!camera) return;

    const ndc = new THREE.Vector3(
      (clientX / window.innerWidth) * 2 - 1,
      -(clientY / window.innerHeight) * 2 + 1,
      0.5
    );

    ndc.unproject(camera);
    const direction = ndc.sub(camera.position).normalize();
    if (Math.abs(direction.z) < 1e-6) return;

    const distance = -camera.position.z / direction.z;
    const worldPoint = camera.position.clone().add(direction.multiplyScalar(distance));
    setBlobPosition({ x: worldPoint.x, y: worldPoint.y });
  };

  const handleDragPointerDown = (e) => {
    if (!isDragging) return;
    dragStateRef.current.isPointerDown = true;
    if (e.currentTarget.setPointerCapture) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    updateBlobPositionFromPointer(e.clientX, e.clientY);
  };

  const handleDragPointerMove = (e) => {
    if (!isDragging || !dragStateRef.current.isPointerDown) return;
    updateBlobPositionFromPointer(e.clientX, e.clientY);
  };

  const handleDragPointerUp = (e) => {
    dragStateRef.current.isPointerDown = false;
    if (e.currentTarget.hasPointerCapture && e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  useEffect(() => {
    // ─── CONFIG ───────────────────────────────────────────────────────
    const params = {
      timeScale: 0.78,
      rotationSpeedX: 0.0012,
      rotationSpeedY: 0.004,
      plasmaScale: 0.1404,
      plasmaBrightness: 1.31,
      voidThreshold: 0.072,
      colorDeep: 0x001433,
      colorMid: 0x0084ff,
      colorBright: 0x00ffe1,
      shellColor: 0x0066ff,
      shellOpacity: 0.41
    };

    // ─── NOISE GLSL ───────────────────────────────────────────────────
    const noiseFunctions = `
      vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
      vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
      vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
      vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
      float snoise(vec3 v){
        const vec2 C=vec2(1./6.,1./3.);
        const vec4 D=vec4(0.,.5,1.,2.);
        vec3 i=floor(v+dot(v,C.yyy));
        vec3 x0=v-i+dot(i,C.xxx);
        vec3 g=step(x0.yzx,x0.xyz);
        vec3 l=1.-g;
        vec3 i1=min(g.xyz,l.zxy);
        vec3 i2=max(g.xyz,l.zxy);
        vec3 x1=x0-i1+C.xxx;
        vec3 x2=x0-i2+C.yyy;
        vec3 x3=x0-D.yyy;
        i=mod289(i);
        vec4 p=permute(permute(permute(
          i.z+vec4(0.,i1.z,i2.z,1.))
          +i.y+vec4(0.,i1.y,i2.y,1.))
          +i.x+vec4(0.,i1.x,i2.x,1.));
        float n_=0.142857142857;
        vec3 ns=n_*D.wyz-D.xzx;
        vec4 j=p-49.*floor(p*ns.z*ns.z);
        vec4 x_=floor(j*ns.z);
        vec4 y_=floor(j-7.*x_);
        vec4 x=x_*ns.x+ns.yyyy;
        vec4 y=y_*ns.x+ns.yyyy;
        vec4 h=1.-abs(x)-abs(y);
        vec4 b0=vec4(x.xy,y.xy);
        vec4 b1=vec4(x.zw,y.zw);
        vec4 s0=floor(b0)*2.+1.;
        vec4 s1=floor(b1)*2.+1.;
        vec4 sh=-step(h,vec4(0.));
        vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
        vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
        vec3 p0=vec3(a0.xy,h.x);
        vec3 p1=vec3(a0.zw,h.y);
        vec3 p2=vec3(a1.xy,h.z);
        vec3 p3=vec3(a1.zw,h.w);
        vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
        p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
        vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
        m=m*m;
        return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
      }
      float fbm(vec3 p){
        float total=0.;float amplitude=.5;float frequency=1.;
        for(int i=0;i<3;i++){total+=snoise(p*frequency)*amplitude;amplitude*=.5;frequency*=2.;}
        return total;
      }
    `;

    // ─── SCENE ────────────────────────────────────────────────────────
    const canvas = threeCanvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 4.2;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    renderer.setClearColor(0x000000, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 1.5;
    controls.maxDistance = 6;

    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // ─── LIGHT ────────────────────────────────────────────────────────
    const pointLight = new THREE.PointLight(0x0088ff, 2.0, 10);
    mainGroup.add(pointLight);

    // ─── OUTER SHELL ─────────────────────────────────────────────────
    const shellGeo = new THREE.SphereGeometry(1.0, 64, 64);
    const shellVert = `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main(){
        vNormal=normalize(normalMatrix*normal);
        vec4 mvPosition=modelViewMatrix*vec4(position,1.);
        vViewPosition=-mvPosition.xyz;
        gl_Position=projectionMatrix*mvPosition;
      }`;
    const shellFrag = `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      uniform vec3 uColor;
      uniform float uOpacity;
      void main(){
        float fresnel=pow(1.-dot(normalize(vNormal),normalize(vViewPosition)),2.5);
        gl_FragColor=vec4(uColor,fresnel*uOpacity);
      }`;

    const shellBackMat = new THREE.ShaderMaterial({
      vertexShader: shellVert, fragmentShader: shellFrag,
      uniforms: { uColor: { value: new THREE.Color(0x000055) }, uOpacity: { value: 0.3 } },
      transparent: true, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false
    });
    const shellFrontMat = new THREE.ShaderMaterial({
      vertexShader: shellVert, fragmentShader: shellFrag,
      uniforms: { uColor: { value: new THREE.Color(params.shellColor) }, uOpacity: { value: params.shellOpacity } },
      transparent: true, blending: THREE.AdditiveBlending, side: THREE.FrontSide, depthWrite: false
    });
    mainGroup.add(new THREE.Mesh(shellGeo, shellBackMat));
    mainGroup.add(new THREE.Mesh(shellGeo, shellFrontMat));

    // ─── PLASMA ───────────────────────────────────────────────────────
    const plasmaGeo = new THREE.SphereGeometry(0.998, 128, 128);
    const plasmaMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uScale: { value: params.plasmaScale },
        uBrightness: { value: params.plasmaBrightness },
        uThreshold: { value: params.voidThreshold },
        uColorDeep: { value: new THREE.Color(params.colorDeep) },
        uColorMid: { value: new THREE.Color(params.colorMid) },
        uColorBright: { value: new THREE.Color(params.colorBright) }
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main(){
          vPosition=position;
          vNormal=normalize(normalMatrix*normal);
          vec4 mvPosition=modelViewMatrix*vec4(position,1.);
          vViewPosition=-mvPosition.xyz;
          gl_Position=projectionMatrix*mvPosition;
        }`,
      fragmentShader: `
        uniform float uTime;
        uniform float uScale;
        uniform float uBrightness;
        uniform float uThreshold;
        uniform vec3 uColorDeep;
        uniform vec3 uColorMid;
        uniform vec3 uColorBright;
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        ${noiseFunctions}
        void main(){
          vec3 p=vPosition*uScale;
          vec3 q=vec3(
            fbm(p+vec3(0.,uTime*.05,0.)),
            fbm(p+vec3(5.2,1.3,2.8)+uTime*.05),
            fbm(p+vec3(2.2,8.4,.5)-uTime*.02)
          );
          float density=fbm(p+2.*q);
          float t=(density+.4)*.8;
          float alpha=smoothstep(uThreshold,.7,t);
          vec3 cWhite=vec3(1.);
          vec3 color=mix(uColorDeep,uColorMid,smoothstep(uThreshold,.5,t));
          color=mix(color,uColorBright,smoothstep(.5,.8,t));
          color=mix(color,cWhite,smoothstep(.8,1.,t));
          float facing=dot(normalize(vNormal),normalize(vViewPosition));
          float depthFactor=(facing+1.)*.5;
          float finalAlpha=alpha*(.02+.98*depthFactor);
          gl_FragColor=vec4(color*uBrightness,finalAlpha);
        }`,
      transparent: true, blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide, depthWrite: false
    });
    const plasmaMesh = new THREE.Mesh(plasmaGeo, plasmaMat);
    mainGroup.add(plasmaMesh);
    
    // Save refs for dynamic updating
    mainGroupRef.current = mainGroup;
    uniformsRef.current = plasmaMat.uniforms;
    
    // Initial sync
    mainGroup.scale.set(blobSize, blobSize, blobSize);
    mainGroup.position.set(blobPosition.x, blobPosition.y, 0);
    const initialBase = new THREE.Color(blobColor);
    const idxHsl = {};
    initialBase.getHSL(idxHsl);
    plasmaMat.uniforms.uColorBright.value = initialBase.clone();
    plasmaMat.uniforms.uColorMid.value = new THREE.Color().setHSL(idxHsl.h, idxHsl.s, Math.max(0, idxHsl.l - 0.2));
    plasmaMat.uniforms.uColorDeep.value = new THREE.Color().setHSL(idxHsl.h, idxHsl.s, Math.max(0, idxHsl.l - 0.4));

    // ─── PARTICLES ────────────────────────────────────────────────────
    const pCount = 600;
    const pPos = new Float32Array(pCount * 3);
    const pSizes = new Float32Array(pCount);
    const sR = 0.95;
    for (let i = 0; i < pCount; i++) {
      const r = sR * Math.cbrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pPos[i * 3 + 2] = r * Math.cos(phi);
      pSizes[i] = Math.random();
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('aSize', new THREE.BufferAttribute(pSizes, 1));
    const pMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(0xffffff) } },
      vertexShader: `
        uniform float uTime;
        attribute float aSize;
        varying float vAlpha;
        void main(){
          vec3 pos=position;
          pos.y+=sin(uTime*.2+pos.x)*.02;
          pos.x+=cos(uTime*.15+pos.z)*.02;
          vec4 mvPosition=modelViewMatrix*vec4(pos,1.);
          gl_Position=projectionMatrix*mvPosition;
          float baseSize=8.*aSize+4.;
          gl_PointSize=baseSize*(1./-mvPosition.z);
          vAlpha=.8+.2*sin(uTime+aSize*10.);
        }`,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;
        void main(){
          vec2 uv=gl_PointCoord-vec2(.5);
          if(length(uv)>.5)discard;
          float glow=pow(1.-length(uv)*2.,1.8);
          gl_FragColor=vec4(uColor,glow*vAlpha);
        }`,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
    });
    mainGroup.add(new THREE.Points(pGeo, pMat));

    // ─── PERSPECTIVE GRID (2D canvas) ────────────────────────────────
    const gridCanvas = gridCanvasRef.current;
    if (!gridCanvas) return;
    const gCtx = gridCanvas.getContext('2d');

    const initGrid = () => {
      gridCanvas.width = window.innerWidth;
      gridCanvas.height = window.innerHeight;
    };

    const drawGrid = (t) => {
      const W = gridCanvas.width, H = gridCanvas.height;
      gCtx.clearRect(0, 0, W, H);
      const vx = W / 2, vy = H * 0.72, horizonY = H * 0.42;

      const lCount = 24;
      for (let i = 0; i <= lCount; i++) {
        const frac = i / lCount;
        const x = -W * 0.35 + frac * W * 1.7;
        const op = 0.025 + Math.pow(frac > 0.5 ? 1 - frac : frac, 1.5) * 0.055;
        gCtx.strokeStyle = `rgba(0,180,255,${op})`;
        gCtx.lineWidth = 0.5;
        gCtx.beginPath();
        gCtx.moveTo(x, H);
        gCtx.lineTo(vx + (x - vx) * 0.015, horizonY);
        gCtx.stroke();
      }

      const hCount = 16;
      for (let i = 0; i <= hCount; i++) {
        const frac = i / hCount;
        const scrollFrac = (frac + t * 0.04) % 1;
        const y = horizonY + Math.pow(scrollFrac, 2.0) * (H - horizonY);
        const xSpread = ((y - horizonY) / (H - horizonY)) * W * 0.68;
        const op = Math.pow(scrollFrac, 0.9) * 0.07;
        gCtx.strokeStyle = `rgba(0,180,255,${op})`;
        gCtx.lineWidth = 0.5;
        gCtx.beginPath();
        gCtx.moveTo(vx - xSpread, y);
        gCtx.lineTo(vx + xSpread, y);
        gCtx.stroke();
      }
    };

    // ─── RESIZE ───────────────────────────────────────────────────────
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      initGrid();
    };
    window.addEventListener('resize', handleResize);

    // ─── ANIMATE ──────────────────────────────────────────────────────
    initGrid();
    const clock = new THREE.Clock();
    let animationId;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      plasmaMat.uniforms.uTime.value = t * params.timeScale;
      pMat.uniforms.uTime.value = t;

      plasmaMesh.rotation.y = t * 0.08;
      mainGroup.rotation.x += params.rotationSpeedX;
      mainGroup.rotation.y += params.rotationSpeedY;

      drawGrid(t);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      renderer.dispose();
      cameraRef.current = null;
    };
  }, []);

  // ─── BOOT SEQUENCE TEXT ──────────────────────────────────────────
  useEffect(() => {
    const bootLabels = [
      'INITIALIZING SYSTEM...',
      'LOADING NEURAL CORE...',
      'MOUNTING FILE SYSTEM...',
      'ACTIVATING VISION ENGINE...',
      'VOICE SYNTHESIS ONLINE...',
      'ALL SYSTEMS GO'
    ];
    let lblIdx = 0;
    const bootInterval = setInterval(() => {
      lblIdx = Math.min(lblIdx + 1, bootLabels.length - 1);
      setBootText(bootLabels[lblIdx]);
      if (lblIdx === bootLabels.length - 1) {
        clearInterval(bootInterval);
        const lbl = document.getElementById('bootLbl');
        if (lbl) lbl.style.color = 'rgba(0,255,136,0.5)';
      }
    }, 500);

    return () => clearInterval(bootInterval);
  }, []);

  return (
    <div id="app-container">
      <canvas id="three-canvas" ref={threeCanvasRef}></canvas>
      <div id="hud">
        <Navbar />
        <canvas id="grid-canvas" ref={gridCanvasRef}></canvas>
        <div className="hex-overlay"></div>
        <div className="vignette"></div>
        <div className="scan-line"></div>
        <div className="horizon"></div>

        <div className="corner corner-tl"></div>
        <div className="corner corner-tr"></div>
        <div className="corner corner-bl"></div>
        <div className="corner corner-br"></div>

        <div className="top-hud">
          <div className="top-line-l"></div>
          <span className="top-label"><span className="status-dot"></span>SYSTEM ONLINE</span>
          <div className="top-line-r"></div>
        </div>

        <div className="side-panel left-panel">
          <div className="panel-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="8" r="4"/>
              <path d="M6 20v-2a6 6 0 0112 0v2"/>
            </svg>
            PROFILE
          </div>
          <div className="panel-content">
            <div className="panel-row mode-select">
              <div className="p-mode active">VOICE <span className="p-dot"></span></div>
              <div className="p-mode">AGENT <span className="p-dot"></span></div>
              <div className="p-mode">FOCUS <span className="p-dot"></span></div>
            </div>
            <div className="radar-box">
              <div className="radar-sweep"></div>
              <div className="radar-ring r1"></div>
              <div className="radar-ring r2"></div>
              <div className="radar-crosshair"></div>
            </div>
          </div>
        </div>

        <div className="side-panel right-panel">
          <div className="panel-header right-align">
            SYSTEM METRICS
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
              <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
            </svg>
          </div>
          <div className="panel-content right-align-content">
             <div className="panel-row icon-row">
                <div className="icon-btn-large" title="Network">
                  <div className="signal-bars-lg">
                    <div className="sig-bar"></div><div className="sig-bar"></div><div className="sig-bar"></div><div className="sig-bar"></div>
                  </div>
                  <span>NET</span>
                </div>
                <div className="icon-btn-large" title="Settings" onClick={() => setIsSettingsOpen(true)}>
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
                  </svg>
                  <span>CFG</span>
                </div>
                <div className="icon-btn-large power-btn" title="Power">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" stroke="currentColor">
                    <path d="M18.36 6.64A9 9 0 0112 3a9 9 0 00-6.36 15.36"/>
                    <line x1="12" y1="3" x2="12" y2="12"/>
                  </svg>
                  <span>PWR</span>
                </div>
             </div>
             <div className="chart-box">
                <div className="c-bar b1"></div>
                <div className="c-bar b2"></div>
                <div className="c-bar b3"></div>
                <div className="c-bar b4"></div>
                <div className="c-bar b5"></div>
             </div>
          </div>
        </div>

        <div className="reticle" style={{ top: '38%', left: '22%', animationDelay: '2s' }}>
          <div className="reticle-ring"></div>
        </div>
        <div className="reticle" style={{ top: '38%', right: '22%', animationDelay: '2.2s' }}>
          <div className="reticle-ring"></div>
        </div>
        <div className="reticle" style={{ bottom: '34%', left: '50%', transform: 'translateX(-50%)', animationDelay: '2.4s' }}>
          <div className="reticle-ring"></div>
        </div>

        <div className="text-placeholder">
          <p>— JARVIS START PROTOCOL —</p>
        </div>

        <div className="bottom-hud">
          <div className="boot-track">
            <div className="boot-fill"></div>
            <div className="boot-head"></div>
          </div>
          <div className="boot-label" id="bootLbl">{bootText}</div>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        color={blobColor} 
        setColor={setBlobColor} 
        size={blobSize} 
        setSize={setBlobSize} 
        onEnterDragMode={() => {
          setIsSettingsOpen(false);
          setIsDragging(true);
          dragStateRef.current.isPointerDown = false;
        }}
      />

      {/* Drag Overlay */}
      {isDragging && (
        <div 
          className="drag-overlay" 
          onPointerDown={handleDragPointerDown}
          onPointerMove={handleDragPointerMove}
          onPointerUp={handleDragPointerUp}
          onPointerCancel={handleDragPointerUp}
          onPointerLeave={handleDragPointerUp}
        >
          <div className="drag-helper-text">
            <span>DRAG ANYWHERE TO REPOSITION</span>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                dragStateRef.current.isPointerDown = false;
                setIsDragging(false);
              }}
            >
              SAVE POSITION
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
