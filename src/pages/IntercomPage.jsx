import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  DoorOpen,
  Lock,
  Maximize2,
  Minimize2,
  Mic,
  MicOff,
  Video,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { useAccessLogs } from '../hooks/useAccessLogs';
import { useCCTV } from '../hooks/useCCTV';
import { useGateControl } from '../hooks/useGateControl';
import { useIotDevice } from '../hooks/useIotDevice';
import { useTheme } from '../hooks/useTheme';
import { CCTVFeedFrame } from '../components/cctv/CCTVFeedFrame';
import { normalizePath } from '../utils/cctv';
import { glass } from '../utils/glass';

const INTERCOM_PATH = 'intercom';
const INTERCOM_GRADIENT = ['#1a1040', '#2d1b69'];

export default function IntercomPage() {
  const { dark } = useTheme();
  const { user } = useAuth();
  const { cameras } = useCCTV();
  const { lastOpened, fetchLogs } = useAccessLogs({ perPage: 5, sortOrder: 'desc' });
  const {
    loading: loadingGate,
    error: gateError,
    openGate: sendOpenGate,
    closeGate: sendCloseGate,
  } = useGateControl();
  const { iotDevice } = useIotDevice();

  const [muted, setMuted] = useState(true);
  const [localSpeaking, setLocalSpeaking] = useState(false);
  const [micActivityError, setMicActivityError] = useState('');
  const [gate, setGate] = useState('closed');
  const [cooldown, setCooldown] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const cooldownRef = useRef(null);
  const gateResetRef = useRef(null);

  const intercomCamera = useMemo(() => {
    const registeredCamera =
      cameras.find((camera) => camera.path === INTERCOM_PATH) ??
      cameras.find((camera) => camera.type === 'intercom');

    return {
      id: registeredCamera?.id ?? INTERCOM_PATH,
      camera_name: registeredCamera?.camera_name || 'Intercom Camera',
      path: INTERCOM_PATH,
      stream_url: registeredCamera?.stream_url || '',
      type: 'intercom',
      _gradient: registeredCamera?._gradient ?? INTERCOM_GRADIENT,
    };
  }, [cameras]);

  const micEnabled = !muted;
  const viewerFrameUrl = buildIntercomFrameUrl(intercomCamera.path, 'video+audio');
  const micSenderFrameUrl = buildIntercomFrameUrl(intercomCamera.path, 'microphone');
  const canPreviewIntercom = Boolean(viewerFrameUrl);
  const intercomStatusLabel = micEnabled ? 'Mic On' : 'Mic Off';
  const iotDeviceStatus = iotDevice?.status || '-';
  const deviceOnline = iotDeviceStatus === 'online';
  const latestOperator = lastOpened?.user?.full_name || user?.full_name || user?.name || '-';
  const lastOpenedDate = lastOpened?.created_at ? new Date(lastOpened.created_at) : null;
  const lastOpenedText =
    lastOpenedDate && !Number.isNaN(lastOpenedDate.getTime())
      ? `Terakhir diakses ${formatDistanceToNow(lastOpenedDate, {
          addSuffix: true,
          locale: id,
        })}`
      : 'Terakhir diakses -';

  const startCooldown = () => {
    setCooldown(true);
    if (cooldownRef.current) {
      clearTimeout(cooldownRef.current);
    }
    cooldownRef.current = setTimeout(() => setCooldown(false), 3000);
  };

  useEffect(() => {
    return () => {
      if (cooldownRef.current) {
        clearTimeout(cooldownRef.current);
      }
      if (gateResetRef.current) {
        clearTimeout(gateResetRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (fullscreen) {
      const htmlOriginal = document.documentElement.style.overflow;
      const bodyOriginal = document.body.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      return () => {
        document.documentElement.style.overflow = htmlOriginal;
        document.body.style.overflow = bodyOriginal;
      };
    }
  }, [fullscreen]);

  useEffect(() => {
    if (!micEnabled) {
      return undefined;
    }

    let disposed = false;
    let stream = null;
    let audioContext = null;
    let source = null;
    let analyser = null;
    let animationFrame = 0;
    let speaking = false;
    let quietFrames = 0;

    const setSpeaking = (value) => {
      if (speaking === value || disposed) return;
      speaking = value;
      setLocalSpeaking(value);
    };

    const startMicActivity = async () => {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;

      if (!navigator.mediaDevices?.getUserMedia || !AudioContextCtor) {
        setMicActivityError('Browser tidak mendukung deteksi mikrofon.');
        setSpeaking(false);
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (disposed) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        setMicActivityError('');
        audioContext = new AudioContextCtor();
        source = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.72;
        source.connect(analyser);

        const samples = new Uint8Array(analyser.fftSize);

        const measure = () => {
          if (disposed || !analyser) return;

          analyser.getByteTimeDomainData(samples);

          let sumSquares = 0;
          for (let index = 0; index < samples.length; index += 1) {
            const sample = (samples[index] - 128) / 128;
            sumSquares += sample * sample;
          }

          const rms = Math.sqrt(sumSquares / samples.length);
          if (rms >= 0.035) {
            quietFrames = 0;
            setSpeaking(true);
          } else {
            quietFrames += 1;
            if (quietFrames >= 8) {
              setSpeaking(false);
            }
          }

          animationFrame = window.requestAnimationFrame(measure);
        };

        measure();
      } catch (err) {
        if (disposed) return;
        setSpeaking(false);
        setMicActivityError(getMicActivityErrorMessage(err));
      }
    };

    startMicActivity();

    return () => {
      disposed = true;
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
      source?.disconnect();
      analyser?.disconnect();
      if (audioContext?.state !== 'closed') {
        audioContext?.close().catch(() => {});
      }
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [micEnabled]);

  const openGate = async () => {
    if (loadingGate || cooldown) return;

    setGate('opening');
    try {
      await sendOpenGate({
        gate_id: 1,
        access_method: 'web',
        notes: 'Permintaan buka gerbang dari intercom',
      });
      await fetchLogs();
      setGate('open');

      if (gateResetRef.current) {
        clearTimeout(gateResetRef.current);
      }
      gateResetRef.current = setTimeout(() => setGate('closed'), 4000);
      startCooldown();
    } catch {
      setGate('closed');
    }
  };

  const closeGate = async () => {
    if (loadingGate || cooldown) return;

    try {
      await sendCloseGate({
        gate_id: 1,
        access_method: 'web',
        notes: 'Permintaan tutup gerbang dari intercom',
      });
      await fetchLogs();
      if (gateResetRef.current) {
        clearTimeout(gateResetRef.current);
      }
      setGate('closed');
      startCooldown();
    } catch {
      setGate('closed');
    }
  };

  const toggleMute = () => {
    if (!muted) {
      setLocalSpeaking(false);
      setMicActivityError('');
    }
    setMuted((value) => !value);
  };

  const feedContent = (
    <>
      <div
        className="relative aspect-video w-full overflow-hidden bg-[radial-gradient(circle_at_30%_30%,#1a1040,#2d1b69)]"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${intercomCamera._gradient[0]}, ${intercomCamera._gradient[1]})`,
        }}
      >
        {canPreviewIntercom ? (
          <CCTVFeedFrame
            key={viewerFrameUrl}
            title={`Intercom ${intercomCamera.camera_name}`}
            src={viewerFrameUrl}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm uppercase tracking-widest text-white/40">
            Feed Intercom Belum Diatur
          </div>
        )}

        <div className="pointer-events-none absolute bottom-4 left-4 z-10">
          <div
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] uppercase tracking-wider text-white ${
              micEnabled ? 'bg-emerald-600/85' : 'bg-red-500/80'
            }`}
          >
            <motion.span
              className="h-1.5 w-1.5 rounded-full bg-white"
              animate={{ opacity: [1, 0.25, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            {intercomStatusLabel}
          </div>
        </div>

        <IntercomIconButton
          dark={dark}
          title={fullscreen ? 'Keluar fullscreen' : 'Fullscreen'}
          onClick={() => setFullscreen((value) => !value)}
          className="absolute right-4 top-4 z-10"
        >
          {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </IntercomIconButton>
      </div>

      <div
        className={`flex flex-1 items-center justify-between gap-2 p-3 sm:gap-3 sm:p-5 ${
          dark ? 'border-t border-white/5' : 'border-t border-blue-100/60'
        }`}
      >
        <div className="flex min-w-0 items-center gap-2">
          <Video
            className={`h-3.5 w-3.5 shrink-0 ${
              canPreviewIntercom ? 'text-violet-400' : 'opacity-30'
            }`}
          />
          <div className="min-w-0">
            <p className="truncate text-xs font-medium leading-tight">
              {intercomCamera.camera_name}
            </p>
            <p
              className={`mt-0.5 truncate text-[10px] ${dark ? 'text-white/35' : 'text-slate-400'}`}
            >
              /{intercomCamera.path}
            </p>
          </div>
        </div>

        <MicToggleSwitch muted={muted} onToggle={toggleMute} />
      </div>

      {micActivityError && micEnabled ? (
        <div
          className={`border-t px-4 py-3 text-xs sm:px-5 ${
            dark
              ? 'border-red-500/20 bg-red-500/10 text-red-200'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          Mikrofon diblokir. Aktifkan permission microphone di browser untuk berbicara lewat
          intercom.
        </div>
      ) : null}
    </>
  );

  return (
    <>
      <div className="space-y-4 lg:space-y-6">
        {/* <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl tracking-tight">Visitor Intercom</h2>
            <p className="text-sm opacity-60">Real-time visitor communication</p>
          </div>
          <span
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs ${
              micEnabled
                ? dark
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : 'bg-emerald-50 text-emerald-700'
                : dark
                  ? 'bg-red-500/15 text-red-300'
                  : 'bg-red-50 text-red-600'
            }`}
          >
            <PhoneCall className="h-3.5 w-3.5" />
            {intercomStatusLabel}
          </span>
        </div> */}

        <div className="grid gap-4 lg:grid-cols-4">
          {!fullscreen ? (
            <div className={glass(dark, 'flex flex-col overflow-hidden lg:col-span-3')}>
              {feedContent}
            </div>
          ) : null}

          <div className="flex h-full flex-col gap-3 sm:gap-4">
            {/* <VoiceActivityCard
              dark={dark}
              title="Visitor / Interkom"
              active={canPreviewIntercom}
              label={canPreviewIntercom ? 'aktif' : 'offline'}
              color="bg-blue-500"
              caption="Audio masuk dari luar gate"
            /> */}

            <VoiceActivityCard
              dark={dark}
              title="Mikrofon Anda"
              active={localSpeaking}
              label={
                muted ? 'muted' : micActivityError ? 'izin mic' : localSpeaking ? 'bicara' : 'diam'
              }
              color="bg-emerald-500"
              caption={
                muted ? 'Mikrofon dimatikan' : micActivityError || 'Deteksi suara mikrofon lokal'
              }
              danger={muted || Boolean(micActivityError)}
            />

            <div className={glass(dark, 'flex flex-col p-4 sm:p-5 flex-1 justify-between')}>
              <div className="">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-widest opacity-60">Kontrol Gate</p>
                    {/* <h3 className="mt-1 tracking-tight">Main Gate</h3> */}
                  </div>
                  <div
                    className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] ${
                      gate === 'open'
                        ? dark
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : 'bg-emerald-50 text-emerald-700'
                        : dark
                          ? 'bg-amber-500/15 text-amber-300'
                          : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    <motion.span
                      className={`h-3 w-3 rounded-full ${
                        gate === 'open' ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                    />
                    {/* {gateLabel} */}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs opacity-70">
                  {deviceOnline ? (
                    <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <WifiOff className="h-3.5 w-3.5 text-red-500" />
                  )}{' '}
                  {deviceOnline ? 'Online' : 'Offline'}
                  <span></span> {lastOpenedText}
                </div>

                <p className="mt-0.5 text-xs opacity-50">Operator: {latestOperator}</p>
              </div>
              <div className="">
                <div className="mt-4 flex flex-col gap-4 h-25">
                  <button
                    type="button"
                    onClick={openGate}
                    disabled={loadingGate || cooldown}
                    className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 text-sm text-white shadow-lg shadow-blue-500/30 transition hover:shadow-blue-500/50 disabled:cursor-not-allowed disabled:opacity-70 sm:h-11 sm:w-auto sm:flex-1 sm:gap-2"
                  >
                    <DoorOpen className="h-4 w-4" />
                    Buka
                  </button>

                  <button
                    type="button"
                    onClick={closeGate}
                    disabled={loadingGate || cooldown}
                    className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-red-500/90 text-sm text-white shadow-lg shadow-red-500/30 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-70 sm:h-11 sm:w-auto sm:flex-1 sm:gap-2"
                  >
                    <Lock className="h-4 w-4" />
                    Tutup
                  </button>
                </div>
              </div>

              {gateError ? <p className="mt-3 text-xs text-red-500">{gateError}</p> : null}
            </div>
          </div>
        </div>
      </div>

      {fullscreen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm sm:p-6"
          onClick={() => setFullscreen(false)}
          role="dialog"
        >
          <div
            className={glass(dark, 'flex w-full max-w-5xl flex-col overflow-hidden')}
            onClick={(event) => event.stopPropagation()}
          >
            {feedContent}
          </div>
        </div>
      ) : null}

      {micEnabled && micSenderFrameUrl ? (
        <iframe
          key={micSenderFrameUrl}
          title="Intercom microphone sender"
          src={micSenderFrameUrl}
          className="fixed -left-[9999px] top-0 h-px w-px border-0 opacity-0"
          style={{ pointerEvents: 'none' }}
          scrolling="no"
          allow="camera *; microphone *; autoplay *; fullscreen *; speaker-selection *"
          referrerPolicy="no-referrer"
          tabIndex={-1}
        />
      ) : null}
    </>
  );
}

function buildIntercomFrameUrl(path, media) {
  const rawBase = import.meta.env.VITE_GO2RTC_URL || '';
  const cleanBase = rawBase.replace(/\/+$/, '');
  const cleanPath = normalizePath(path);

  if (!cleanBase || !cleanPath) return '';

  return `${cleanBase}/webrtc.html?src=${encodeURIComponent(cleanPath)}&media=${media}`;
}

function getMicActivityErrorMessage(err) {
  if (err?.name === 'NotAllowedError') {
    return 'Izinkan mikrofon untuk menampilkan aktivitas suara.';
  }

  if (err?.name === 'NotFoundError') {
    return 'Mikrofon tidak ditemukan.';
  }

  return 'Gagal membaca aktivitas mikrofon.';
}

function VoiceActivityCard({ dark, title, active, label, color, caption, danger = false }) {
  const offline = label === 'offline';
  const labelClass = danger
    ? dark
      ? 'bg-red-500/15 text-red-400'
      : 'bg-red-50 text-red-500'
    : offline
      ? dark
        ? 'bg-white/10 text-white/45'
        : 'bg-slate-100 text-slate-500'
      : dark
        ? 'bg-emerald-500/15 text-emerald-400'
        : 'bg-emerald-50 text-emerald-600';
  const dotClass = danger ? 'bg-red-400' : offline ? 'bg-slate-400' : 'bg-emerald-400';

  return (
    <div className={glass(dark, 'flex min-h-32 flex-1 flex-col p-4 sm:min-h-40 sm:p-5')}>
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-[11px] uppercase tracking-widest opacity-60">{title}</p>
        <span
          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${labelClass}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
          {label}
        </span>
      </div>
      <div className="mt-4 flex h-20 flex-1 items-center justify-center gap-px overflow-hidden sm:gap-1">
        {Array.from({ length: 30 }).map((_, index) => (
          <WaveBar key={index} index={index} active={active} color={color} />
        ))}
      </div>
      <p className="mt-3 text-center text-[11px] opacity-40">{caption}</p>
    </div>
  );
}

function WaveBar({ index, active, color }) {
  if (!active) {
    return (
      <span className={`block w-1 rounded-full ${color} opacity-20`} style={{ height: '15%' }} />
    );
  }

  return (
    <motion.span
      className={`w-1 rounded-full ${color}`}
      animate={{ height: ['15%', '75%', '25%', '65%', '15%'] }}
      transition={{
        duration: 1.1 + (index % 5) * 0.12,
        repeat: Infinity,
        delay: index * 0.045,
      }}
      style={{ display: 'block' }}
    />
  );
}

function MicToggleSwitch({ muted, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}
      className="group relative flex h-10 w-[88px] shrink-0 items-center rounded-full p-1 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        background: muted
          ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
          : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        boxShadow: muted
          ? '0 0 18px rgba(239,68,68,0.35), inset 0 1px 2px rgba(0,0,0,0.2)'
          : '0 0 18px rgba(16,185,129,0.35), inset 0 1px 2px rgba(0,0,0,0.2)',
      }}
    >
      {/* Track labels */}
      <span
        className="pointer-events-none absolute left-0 right-0 flex items-center justify-between px-2.5 text-[9px] font-bold uppercase tracking-widest text-white/70 transition-opacity duration-300"
        aria-hidden="true"
      >
        <span className={muted ? 'opacity-100' : 'opacity-0'}>Off</span>
        <span className={muted ? 'opacity-0' : 'opacity-100'}>On</span>
      </span>

      {/* Sliding knob */}
      <motion.span
        className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg"
        animate={{ x: muted ? 0 : 48 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          boxShadow: '0 2px 8px rgba(0,0,0,0.25), 0 1px 2px rgba(0,0,0,0.15)',
        }}
      >
        {muted ? (
          <MicOff className="h-4 w-4 text-red-500" />
        ) : (
          <Mic className="h-4 w-4 text-emerald-500" />
        )}
      </motion.span>
    </button>
  );
}

function IntercomIconButton({ children, dark, title, onClick, disabled = false, className = '' }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`grid h-8 w-8 place-items-center rounded-full transition ${
        dark
          ? 'bg-black/45 text-white hover:bg-white/20'
          : 'bg-white/80 text-blue-900/80 hover:bg-white'
      } ${disabled ? 'cursor-not-allowed opacity-35' : ''} ${className}`}
    >
      {children}
    </button>
  );
}
