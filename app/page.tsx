'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Volume2, VolumeX, Radio, ScanLine, AlertTriangle } from 'lucide-react';

const entities = [
  { img: '/entities/registered.png', name: 'THE REGISTERED', freq: 33.3, status: 'LOW COHERENCE' },
  { img: '/entities/contained.png', name: 'CONTAINED FREQUENCY', freq: 87.7, status: 'OBSERVING' },
  { img: '/entities/corrupted.png', name: 'CORRUPTED SIGNAL', freq: 142.9, status: 'UNSTABLE' },
  { img: '/entities/bloom.png', name: 'THE BLOOM', freq: 333.0, status: 'PARTIAL FORM' },
];

function useSignalAudio(enabled: boolean, frequency: number, corrupted: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<any>(null);

  useEffect(() => {
    if (!enabled) {
      if (nodesRef.current) {
        nodesRef.current.gain.gain.linearRampToValueAtTime(0, nodesRef.current.ctx.currentTime + 0.08);
      }
      return;
    }
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = ctxRef.current || new Ctx();
    ctxRef.current = ctx;

    if (!nodesRef.current) {
      const gain = ctx.createGain(); gain.gain.value = 0.02;
      const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = 80;
      const lfo = ctx.createOscillator(); lfo.type = 'sawtooth'; lfo.frequency.value = 6;
      const lfoGain = ctx.createGain(); lfoGain.gain.value = 38;
      const filter = ctx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 620; filter.Q.value = 4;
      const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource(); noise.buffer = noiseBuffer; noise.loop = true;
      const noiseGain = ctx.createGain(); noiseGain.gain.value = 0.012;
      lfo.connect(lfoGain); lfoGain.connect(osc.frequency); osc.connect(gain); noise.connect(filter); filter.connect(noiseGain); noiseGain.connect(gain); gain.connect(ctx.destination);
      osc.start(); lfo.start(); noise.start();
      nodesRef.current = { ctx, osc, lfo, lfoGain, gain, filter, noiseGain };
    }
    const n = nodesRef.current;
    const t = ctx.currentTime;
    n.gain.gain.linearRampToValueAtTime(corrupted ? 0.055 : 0.028, t + 0.12);
    n.osc.frequency.linearRampToValueAtTime(55 + frequency * 1.7, t + 0.15);
    n.lfo.frequency.linearRampToValueAtTime(corrupted ? 31 : 3 + (frequency % 18), t + 0.12);
    n.filter.frequency.linearRampToValueAtTime(300 + frequency * 5, t + 0.12);
    n.noiseGain.gain.linearRampToValueAtTime(corrupted ? 0.045 : 0.014, t + 0.12);
  }, [enabled, frequency, corrupted]);
}

function WaveCanvas({ frequency, locked, corrupted }: { frequency: number; locked: boolean; corrupted: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0; let tick = 0;
    const resize = () => { canvas.width = canvas.offsetWidth * devicePixelRatio; canvas.height = canvas.offsetHeight * devicePixelRatio; };
    resize(); window.addEventListener('resize', resize);
    const draw = () => {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0,0,w,h);
      ctx.globalCompositeOperation = 'lighter';
      const cy = h * 0.52;
      const amp = locked ? h * 0.08 : h * 0.015;
      const segments = 220;
      ctx.lineWidth = locked ? 3 * devicePixelRatio : 1.5 * devicePixelRatio;
      ctx.shadowBlur = locked ? 18 : 6;
      ctx.shadowColor = corrupted ? '#ff2d2d' : '#baffff';
      ctx.strokeStyle = corrupted ? 'rgba(255,40,40,.9)' : 'rgba(225,255,255,.95)';
      ctx.beginPath();
      for (let i=0;i<=segments;i++) {
        const x = (i/segments)*w;
        const noise = (Math.random()-.5) * (corrupted ? h*.16 : h*.018);
        const sq = Math.sign(Math.sin(i*.22 + tick*.05));
        const sine = Math.sin(i*.13 + tick*.05);
        const y = cy + (corrupted ? noise + sine*amp*.8 : locked ? sine*amp : sq*amp*.55);
        if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      for (let i=0;i<60;i++) {
        const x = Math.random()*w; const y = cy + (Math.random()-.5)*h*.45;
        const a = corrupted ? Math.random()*.75 : Math.random()*.25;
        ctx.fillStyle = corrupted ? `rgba(255,70,70,${a})` : `rgba(210,255,255,${a})`;
        ctx.fillRect(x,y,Math.random()*3+1,Math.random()*20+1);
      }
      tick++; raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [frequency, locked, corrupted]);
  return <canvas ref={ref} className="wave-canvas" />;
}

function TerminalLog({ locked, corrupted, submitted }: { locked: boolean; corrupted: boolean; submitted: boolean }) {
  const lines = submitted ? [
    'UPLINK RECEIVED', 'REPOST TRACE VERIFIED: PENDING HUMAN REVIEW', 'EVM ADDRESS STORED', 'SIGNAL INTEGRITY: 12%', 'ARCHIVE NODE: CORRUPTED', 'REGISTRATION ACCEPTED', 'AWAIT FURTHER TRANSMISSION'
  ] : locked ? [
    'COHERENCE DETECTED', 'UNKNOWN CONSCIOUSNESS FOUND', 'DO NOT ATTEMPT EXTRACTION', 'ARCHIVE PROTOCOLS UNLOCKED', 'REGISTER RECEIVING ADDRESS'
  ] : [
    'SCANNING EMPTY BANDS', 'ATMOSPHERIC NOISE: HIGH', 'NO STABLE ENTITY FORM', 'ADJUST FREQUENCY RANGE'
  ];
  return <div className="terminal">{lines.map((l,i)=><div key={i} style={{animationDelay:`${i*120}ms`}}><span>{String(i+1).padStart(2,'0')}</span> {l}</div>)}</div>;
}

export default function Home() {
  const [frequency, setFrequency] = useState(13.7);
  const [audio, setAudio] = useState(false);
  const [xLink, setXLink] = useState('');
  const [wallet, setWallet] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const nearest = useMemo(() => entities.reduce((a,b)=> Math.abs(b.freq-frequency)<Math.abs(a.freq-frequency)?b:a, entities[0]), [frequency]);
  const locked = Math.abs(nearest.freq - frequency) < 2.4 || submitted;
  const corrupted = submitted || (locked && nearest.name.includes('CORRUPTED'));
  useSignalAudio(audio, frequency, corrupted);

  return <main className={corrupted ? 'shell corrupted' : 'shell'}>
    <div className="noise" />
    <div className="scanlines" />
    <section className="stage">
      <div className="topbar">
        <div className="brand"><Radio size={18}/> SIGNAL ENTITIES <span>PRE-MINT ARCHIVE</span></div>
        <button className="audio" onClick={() => setAudio(!audio)}>{audio ? <Volume2 size={18}/> : <VolumeX size={18}/>} {audio ? 'AUDIO ON' : 'ENABLE AUDIO'}</button>
      </div>
      <div className="gridbox">
        <div className="left-panel">
          <div className="kicker"><ScanLine size={14}/> MANUAL FREQUENCY INTERFACE</div>
          <h1>{submitted ? 'SIGNAL CORRUPTED' : locked ? 'ENTITY PARTIALLY VISIBLE' : 'FIND THE UNKNOWN SIGNAL'}</h1>
          <p className="lead">They are not transmissions. They are the signal. Tune the band until something starts observing back.</p>
          <div className="frequency-readout">{frequency.toFixed(1)} <small>MHz</small></div>
          <input className="range" type="range" min="0" max="333" step=".1" value={frequency} onChange={e=>{setSubmitted(false); setFrequency(Number(e.target.value))}} />
          <div className="freq-marks"><span>0.003</span><span>87.7</span><span>142.9</span><span>333.0</span></div>
          <TerminalLog locked={locked} corrupted={corrupted} submitted={submitted}/>
        </div>

        <div className="entity-zone">
          <WaveCanvas frequency={frequency} locked={locked} corrupted={corrupted}/>
          <div className={locked ? 'entity revealed' : 'entity'}>
            <Image src={nearest.img} fill alt="Signal Entity preview" priority />
          </div>
          <div className="crosshair vertical"/><div className="crosshair horizontal"/>
          <div className="entity-label"><b>{locked ? nearest.name : 'UNKNOWN SIGNAL'}</b><span>{locked ? nearest.status : 'NO COHERENCE'}</span></div>
        </div>

        <div className="right-panel">
          <div className="warning"><AlertTriangle size={15}/> ARCHIVE PROTOCOLS</div>
          <div className={locked ? 'protocols open' : 'protocols'}>
            <label>01 / Follow transmission channel</label>
            <a href="https://x.com/signalentities" target="_blank">OPEN @signalentities</a>
            <label>02 / Paste rebroadcast link</label>
            <input placeholder="https://x.com/..." value={xLink} onChange={e=>setXLink(e.target.value)} />
            <label>03 / Register EVM receiver</label>
            <input placeholder="0x..." value={wallet} onChange={e=>setWallet(e.target.value)} />
            <button disabled={!locked || !xLink || !wallet} onClick={()=>setSubmitted(true)}>SUBMIT TO ARCHIVE</button>
          </div>
          <div className="microcopy">
            333 entities · ETH · approx $7 · max 1 per wallet · OpenSea mint
          </div>
        </div>
      </div>
    </section>
  </main>;
}
