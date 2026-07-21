import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  DoorOpen,
  DoorClosed,
  Car,
  Cpu,
  PhoneCall,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Wifi,
  WifiOff,
  Maximize2,
  Video,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../contexts/useAuth';
import { isAdmin } from '../lib/rbac';
import { useAccessLogs } from '../hooks/useAccessLogs';
import { useGateControl } from '../hooks/useGateControl';
import { useIotDevice } from '../hooks/useIotDevice';
import { useParkingQuota } from '../hooks/useParkingQuota';
import { useCCTV } from '../hooks/useCCTV';
import { useUsers } from '../hooks/useUsers';
import { formatDate } from '../utils/formatDate';
import { buildCctvFeedUrl } from '../utils/cctv';
import { glass } from '../utils/glass';
import { CCTVFeedFrame } from '../components/cctv/CCTVFeedFrame';
import { FullscreenCCTVModal } from '../components/cctv/FullscreenCCTVModal';
import { LoadingIndicator } from '../components/LoadingIndicator';

const initialChartData = Array.from({ length: 24 }).map((_, i) => ({
  id: `hour-${i}`,
  hour: `${i.toString().padStart(2, '0')}:00`,
  access: 0,
}));

export default function DashboardPage() {
  const { dark } = useTheme();
  const { user } = useAuth();
  const canViewUserStats = isAdmin(user);
  const navigate = useNavigate();

  const [gate, setGate] = useState('closed');
  const [cooldown, setCooldown] = useState(false);
  const cooldownRef = useRef(null);
  const [chartLogs, setChartLogs] = useState([]);
  const [loadingChart, setLoadingChart] = useState(true);
  const [chartError, setChartError] = useState('');
  const [activeCctvId, setActiveCctvId] = useState(null);
  const [fullscreenCctvId, setFullscreenCctvId] = useState(null);
  const {
    logs,
    lastOpened,
    pagination: accessPagination,
    loading: loadingLogs,
    error: logError,
    fetchLogs,
    fetchAllLogs,
  } = useAccessLogs({ perPage: 10, sortOrder: 'desc' });
  const {
    loading: loadingGate,
    openGate: sendOpenGate,
    closeGate: sendCloseGate,
  } = useGateControl();
  const { parkingQuota, error: parkingError } = useParkingQuota();
  const { iotDevice } = useIotDevice();
  const { cameras: cctvCameras, loading: loadingCctv, error: cctvError } = useCCTV();
  const { pagination: userPagination } = useUsers({ status: 'active', perPage: 1 });
  const { pagination: allUserPagination } = useUsers({ perPage: 1 });
  const parkingUsed = parkingQuota?.used_slots ?? 0;
  const parkingTotal = parkingQuota?.total_slots ?? 0;
  const parkingLabel = `${parkingUsed}/${parkingTotal}`;
  const iotDeviceStatus = iotDevice?.status || '-';
  const iotDeviceLabel =
    iotDeviceStatus === '-'
      ? '-'
      : iotDeviceStatus.charAt(0).toUpperCase() + iotDeviceStatus.slice(1);
  const iotDeviceDelta = iotDevice?.device_name || 'Gate Ctrl';
  const isUnavailable = parkingTotal === 0;
  const pct = parkingTotal ? Math.round((parkingUsed / parkingTotal) * 100) : 0;
  const activeUsersTotal = userPagination?.total ?? 0;
  const allUsersTotal = allUserPagination?.total ?? 0;
  const gateTriggersTotal = accessPagination?.total ?? logs.length;
  const successLogsCount = logs.filter((entry) => entry?.access_status === 'success').length;
  const gateTriggerSuccessRate = logs.length
    ? Math.round((successLogsCount / logs.length) * 100)
    : 0;

  const stats = [
    canViewUserStats
      ? {
          label: 'Pengguna Aktif',
          value: activeUsersTotal,
          delta: `Total ${allUsersTotal}`,
          icon: <Users className="h-5 w-5" />,
          tone: 'blue',
        }
      : null,
    {
      label: 'Akses Gate',
      value: gateTriggersTotal,
      delta: `${gateTriggerSuccessRate}% berhasil`,
      icon: <DoorOpen className="h-5 w-5" />,
      tone: 'emerald',
    },
    {
      label: 'Parkir (Mahasiswa)',
      value: parkingLabel,
      delta: `${pct}%`,
      icon: <Car className="h-5 w-5" />,
      tone: 'amber',
    },
    {
      label: 'Perangkat IoT',
      value: iotDeviceLabel,
      delta: iotDeviceDelta,
      icon: <Cpu className="h-5 w-5" />,
      tone: 'indigo',
    },
    {
      label: 'Panggilan Tamu',
      value: 'Aktif',
      delta: 'Sedang berlangsung',
      icon: <PhoneCall className="h-5 w-5" />,
      tone: 'rose',
    },
  ].filter(Boolean);

  const chartData = useMemo(() => {
    if (!chartLogs.length) return initialChartData;
    const now = new Date();
    const buckets = Array.from({ length: 24 }).map((_, index) => {
      const bucketDate = new Date(now);
      bucketDate.setMinutes(0, 0, 0);
      bucketDate.setHours(bucketDate.getHours() - (23 - index));
      return {
        id: `hour-${index}`,
        ts: bucketDate.getTime(),
        hour: `${bucketDate.getHours().toString().padStart(2, '0')}:00`,
        access: 0,
      };
    });

    const startTs = buckets[0].ts;
    const endTs = buckets[buckets.length - 1].ts + 60 * 60 * 1000;

    chartLogs.forEach((entry) => {
      if (!entry?.created_at) return;
      const ts = new Date(entry.created_at).getTime();
      if (Number.isNaN(ts) || ts < startTs || ts >= endTs) return;
      const bucketIndex = Math.floor((ts - startTs) / (60 * 60 * 1000));
      if (bucketIndex >= 0 && bucketIndex < buckets.length) {
        buckets[bucketIndex].access += 1;
      }
    });

    return buckets.map((bucket) => ({
      id: bucket.id,
      hour: bucket.hour,
      access: bucket.access,
    }));
  }, [chartLogs]);

  const sortedCctvs = useMemo(() => {
    return [...cctvCameras].sort((left, right) => (left.id ?? 0) - (right.id ?? 0));
  }, [cctvCameras]);

  const activeCctvIndex = sortedCctvs.findIndex((camera) => camera.id === activeCctvId);
  const activeCctv = activeCctvIndex >= 0 ? sortedCctvs[activeCctvIndex] : (sortedCctvs[0] ?? null);
  const fullscreenCctv =
    fullscreenCctvId !== null
      ? (sortedCctvs.find((camera) => camera.id === fullscreenCctvId) ?? null)
      : null;
  const activeCctvFeedUrl = activeCctv ? buildCctvFeedUrl(activeCctv) : '';
  const canPreviewActiveCctv = Boolean(activeCctvFeedUrl);
  const canGoPreviousCctv = activeCctvIndex > 0;
  const canGoNextCctv = activeCctvIndex >= 0 && activeCctvIndex < sortedCctvs.length - 1;

  const lastOpenedText = lastOpened?.created_at
    ? `Terakhir diakses ${formatDistanceToNow(new Date(lastOpened.created_at), {
        addSuffix: true,
        locale: id,
      })}`
    : 'Terakhir diakses —';

  const latestOperator = lastOpened?.user?.full_name || user?.full_name || user?.name;
  const recentLogs = logs.slice(0, 10);

  const fetchChartLogs24h = useCallback(async () => {
    setLoadingChart(true);
    setChartError('');
    try {
      const allLogs = await fetchAllLogs({ period: '24h' });
      setChartLogs(allLogs);
    } catch (err) {
      setChartError(err?.message || 'Gagal memuat chart logs 24 jam terakhir.');
      setChartLogs([]);
    } finally {
      setLoadingChart(false);
    }
  }, [fetchAllLogs]);

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
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchChartLogs24h();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchChartLogs24h]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!sortedCctvs.length) {
        setActiveCctvId(null);
        setFullscreenCctvId(null);
        return;
      }

      setActiveCctvId((current) =>
        sortedCctvs.some((camera) => camera.id === current) ? current : sortedCctvs[0].id,
      );

      setFullscreenCctvId((current) =>
        current !== null && sortedCctvs.some((camera) => camera.id === current) ? current : null,
      );
    }, 0);

    return () => clearTimeout(timer);
  }, [sortedCctvs]);

  const openGate = async () => {
    if (loadingGate || cooldown) return;
    setGate('opening');
    try {
      await sendOpenGate({
        gate_id: 1,
        access_method: 'web',
        notes: 'Permintaan buka gerbang dari dashboard',
      });
      await fetchLogs();
      setGate('open');
      setTimeout(() => setGate('closed'), 4000);
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
        notes: 'Permintaan tutup gerbang dari dashboard',
      });
      await fetchLogs();
      setGate('closed');
      startCooldown();
    } catch {
      setGate('closed');
    }
  };

  const showPreviousCctv = () => {
    if (!canGoPreviousCctv) return;
    setActiveCctvId(sortedCctvs[activeCctvIndex - 1].id);
  };

  const showNextCctv = () => {
    if (!canGoNextCctv) return;
    setActiveCctvId(sortedCctvs[activeCctvIndex + 1].id);
  };

  return (
    <>
      <div className="space-y-6">
        {/* <div>
          <h1 className="text-2xl tracking-tight">Welcome back, {displayName}</h1>
          <p className="text-sm opacity-60">Real-time overview of campus access & monitoring</p>
        </div> */}

        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
          {stats.map((item) => (
            <motion.div
              key={item.label}
              whileHover={{ y: -3 }}
              className={glass(dark, 'p-3 sm:p-4 md:p-5')}
            >
              <div className="flex min-w-0 items-start justify-between gap-2">
                <div
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg sm:h-9 sm:w-9 md:h-10 md:w-10 md:rounded-xl [&>svg]:h-4 [&>svg]:w-4 sm:[&>svg]:h-5 sm:[&>svg]:w-5 ${toneBg(
                    item.tone,
                    dark,
                  )}`}
                >
                  {item.icon}
                </div>
                <span className="min-w-0 truncate text-[10px] opacity-60 sm:text-[11px]">
                  {item.delta}
                </span>
              </div>
              <p className="mt-2 truncate text-lg tracking-tight sm:mt-3 sm:text-xl md:text-2xl">
                {item.value}
              </p>
              <p className="truncate text-[11px] opacity-60 sm:text-xs">{item.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className={glass(dark, 'overflow-hidden lg:col-span-2')}>
            <div
              className="relative aspect-video w-full overflow-hidden bg-[radial-gradient(circle_at_30%_30%,#1f2937,#000)]"
              style={
                activeCctv
                  ? {
                      background: `radial-gradient(circle at 30% 30%, ${activeCctv._gradient[0]}, ${activeCctv._gradient[1]})`,
                    }
                  : undefined
              }
            >
              {loadingCctv ? (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-white/60">
                  <LoadingIndicator label="Memuat kamera..." />
                </div>
              ) : cctvError ? (
                <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-red-300">
                  {cctvError}
                </div>
              ) : canPreviewActiveCctv ? (
                <CCTVFeedFrame title={`CCTV ${activeCctv.camera_name}`} src={activeCctvFeedUrl} />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm uppercase tracking-widest text-white/40">
                  {activeCctv ? 'Feed Belum Diatur' : 'Belum Ada Kamera'}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-5">
              <div className="flex min-w-0 items-center gap-2">
                <Video
                  className={`h-3.5 w-3.5 shrink-0 ${
                    canPreviewActiveCctv ? 'text-blue-400' : 'opacity-30'
                  }`}
                />
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium leading-tight">
                    {activeCctv?.camera_name || 'Kamera belum tersedia'}
                  </p>
                  <p
                    className={`mt-0.5 truncate text-[10px] ${
                      dark ? 'text-white/35' : 'text-slate-400'
                    }`}
                  >
                    {activeCctv?.path ? `/${activeCctv.path}` : '-'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <DashboardIconButton
                  dark={dark}
                  title="Kamera sebelumnya"
                  onClick={showPreviousCctv}
                  disabled={!canGoPreviousCctv}
                >
                  <ChevronLeft className="h-4 w-4" />
                </DashboardIconButton>
                <DashboardIconButton
                  dark={dark}
                  title="Kamera berikutnya"
                  onClick={showNextCctv}
                  disabled={!canGoNextCctv}
                >
                  <ChevronRight className="h-4 w-4" />
                </DashboardIconButton>
                <DashboardIconButton
                  dark={dark}
                  title="Fullscreen"
                  onClick={() => activeCctv && setFullscreenCctvId(activeCctv.id)}
                  disabled={!activeCctv}
                >
                  <Maximize2 className="h-4 w-4" />
                </DashboardIconButton>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:col-span-1 lg:grid-cols-1">
            <div className={glass(dark, 'flex flex-col p-4 sm:p-6')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-widest opacity-60">Kontrol Gate</p>
                </div>

                <motion.span
                  className={`h-3 w-3 rounded-full ${
                    gate === 'open' ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs opacity-70">
                {iotDeviceStatus === 'online' ? (
                  <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <WifiOff className="h-3.5 w-3.5 text-red-500" />
                )}
                {iotDeviceStatus === 'online' ? 'Online' : 'Offline'} · {lastOpenedText}
              </div>

              <p className="mt-0.5 text-xs opacity-50">Operator: {latestOperator || '-'}</p>

              <div className="mt-auto grid grid-cols-2 gap-2 pt-4 sm:pt-5">
                <button
                  onClick={openGate}
                  disabled={loadingGate || cooldown}
                  className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 text-sm text-white shadow-lg shadow-blue-500/30 transition hover:shadow-blue-500/50 disabled:cursor-not-allowed disabled:opacity-70 sm:h-11 sm:gap-2"
                >
                  <DoorOpen className="h-4 w-4" /> Buka
                </button>

                <button
                  onClick={closeGate}
                  disabled={loadingGate || cooldown}
                  className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-red-500/90 text-sm text-white shadow-lg shadow-red-500/30 hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-70 sm:h-11 sm:gap-2"
                >
                  <DoorClosed className="h-4 w-4" /> Tutup
                </button>
              </div>
            </div>

            <div className={glass(dark, 'p-4 text-left flex flex-col justify-between sm:p-6')}>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-widest opacity-60">
                    Ketersediaan Parkir
                  </p>
                  <h3 className="text-lg tracking-tight sm:text-xl">
                    {parkingUsed} <span className="opacity-50">/ {parkingTotal} slot</span>
                  </h3>
                </div>

                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] sm:px-3 sm:text-xs ${
                    isUnavailable || pct >= 90
                      ? 'bg-red-500/15 text-red-500'
                      : pct >= 70
                        ? 'bg-amber-500/15 text-amber-500'
                        : 'bg-emerald-500/15 text-emerald-500'
                  }`}
                >
                  {isUnavailable ? 'Tidak Tersedia' : pct >= 80 ? 'Hampir Penuh' : 'Tersedia'}
                </span>
              </div>

              <div
                className={`h-4 w-full overflow-hidden rounded-full ${
                  dark ? 'bg-white/5' : 'bg-blue-100/50 shadow-inner'
                }`}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1 }}
                  className={`h-full rounded-full ${
                    isUnavailable || pct >= 90
                      ? 'bg-linear-to-r from-red-500 to-rose-500'
                      : pct >= 70
                        ? 'bg-linear-to-r from-amber-400 to-orange-500'
                        : 'bg-linear-to-r from-emerald-400 to-blue-500'
                  }`}
                />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center sm:gap-3">
                <div>
                  <p className="text-[11px] opacity-60 sm:text-xs">Total</p>
                  <p className="text-sm sm:text-base">{parkingTotal}</p>
                </div>

                <div>
                  <p className="text-[11px] opacity-60 sm:text-xs">Terpakai</p>
                  <p className="text-sm sm:text-base">{parkingUsed}</p>
                </div>

                <div>
                  <p className="text-[11px] opacity-60 sm:text-xs">Sisa</p>
                  <p className="text-sm sm:text-base">{parkingTotal - parkingUsed}</p>
                </div>
              </div>

              {parkingError ? <p className="mt-3 text-xs text-red-500">{parkingError}</p> : null}

              <div className="mt-3 flex w-full justify-end">
                <button
                  className="flex items-center gap-1 text-xs text-blue-500 hover:underline"
                  onClick={() => navigate('/parking')}
                >
                  <span>Lihat Detail</span> <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className={glass(dark, 'flex flex-col overflow-hidden p-4 sm:p-6 lg:col-span-3')}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-widest opacity-60">Tren Akses</p>
                <h3 className="tracking-tight">24 Jam Terakhir</h3>
              </div>
            </div>
            <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
              <div className="h-56 min-h-56 min-w-[480px] sm:min-w-[640px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <AreaChart data={chartData} margin={{ top: 0, right: 12, left: -12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dashboardAccessGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={dark ? '#1f2937' : '#e5e7eb'}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="hour"
                      stroke={dark ? '#64748b' : '#94a3b8'}
                      fontSize={9}
                      tickLine={false}
                      axisLine={false}
                      interval={3}
                    />
                    <YAxis
                      stroke={dark ? '#64748b' : '#94a3b8'}
                      fontSize={9}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: dark ? '#0b1226' : '#fff',
                        border: '1px solid rgba(59,130,246,0.3)',
                        borderRadius: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="access"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#dashboardAccessGradient)"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            {loadingChart ? (
              <p className="mt-3 text-xs opacity-60">
                <LoadingIndicator label="Memuat tren 24 jam..." />
              </p>
            ) : null}
            {chartError ? <p className="mt-3 text-xs text-red-500">{chartError}</p> : null}
          </div>
        </div>

        <div className={glass(dark, 'overflow-hidden p-4 sm:p-6')}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="tracking-tight">Aktivitas Akses Terbaru</h3>
            <button
              type="button"
              onClick={() => navigate('/logs')}
              className="flex items-center gap-1 text-xs text-blue-500 hover:underline"
            >
              Lihat semua <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            <div className="min-w-[920px] overflow-hidden rounded-xl">
              <table className="w-full table-fixed text-left text-sm">
                <thead className={dark ? 'text-slate-400' : 'text-slate-500'}>
                  <tr className="text-[11px] uppercase tracking-wider">
                    <th className="w-[18%] px-3 py-2 font-normal">Pengguna</th>
                    <th className="w-[10%] px-3 py-2 font-normal">Role</th>
                    <th className="w-[8%] px-3 py-2 font-normal">Aksi</th>
                    <th className="w-[8%] px-3 py-2 font-normal">Metode</th>
                    <th className="w-[10%] px-3 py-2 font-normal">Status</th>
                    <th className="w-[26%] px-3 py-2 font-normal">Catatan</th>
                    <th className="w-[20%] px-3 py-2 text-center font-normal">Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-current/10">
                  {loadingLogs ? (
                    <tr>
                      <td className="px-3 py-4 text-center opacity-70" colSpan={7}>
                        <LoadingIndicator label="Memuat log akses..." className="justify-center" />
                      </td>
                    </tr>
                  ) : logError ? (
                    <tr>
                      <td className="px-3 py-4 text-center text-red-500/90" colSpan={7}>
                        {logError}
                      </td>
                    </tr>
                  ) : !recentLogs.length ? (
                    <tr>
                      <td className="px-3 py-4 text-center opacity-70" colSpan={7}>
                        Belum ada data access log.
                      </td>
                    </tr>
                  ) : (
                    recentLogs.map((entry) => {
                      const timestamp = entry?.created_at ? formatDate(entry.created_at) : '-';
                      const statusClass = {
                        success: 'bg-emerald-500/15 text-emerald-500',
                        pending: 'bg-amber-500/15 text-amber-500',
                        failed: 'bg-red-500/15 text-red-500',
                      };

                      return (
                        <tr key={entry.id} className="hover:bg-current/3">
                          <td className="px-3 py-3 break-words">{entry?.user?.full_name || '-'}</td>
                          <td className="px-3 py-3 capitalize opacity-70">
                            {entry?.user?.role || '-'}
                          </td>
                          <td className="px-3 py-3 capitalize opacity-70">
                            {entry?.action || '-'}
                          </td>
                          <td className="px-3 py-3 capitalize opacity-70">
                            {entry?.access_method || '-'}
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-xs capitalize ${
                                statusClass[entry?.access_status]
                              }`}
                            >
                              {entry?.access_status || '-'}
                            </span>
                          </td>
                          <td className="px-3 py-3 opacity-70 break-words">{entry?.notes || '-'}</td>
                          <td className="px-3 py-3 text-center tabular-nums opacity-70 whitespace-nowrap">
                            {timestamp}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {fullscreenCctv ? (
          <FullscreenCCTVModal
            dark={dark}
            camera={fullscreenCctv}
            onClose={() => setFullscreenCctvId(null)}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}

function DashboardIconButton({ children, dark, title, onClick, disabled = false }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`grid h-8 w-8 place-items-center rounded-full transition ${
        dark
          ? 'bg-white/6 text-white/75 hover:bg-white/10'
          : 'bg-blue-100/70 text-blue-900/75 hover:bg-blue-100'
      } ${disabled ? 'cursor-not-allowed opacity-35' : ''}`}
    >
      {children}
    </button>
  );
}

function toneBg(tone, dark) {
  const map = {
    blue: dark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-500/15 text-blue-600',
    emerald: dark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-500/15 text-emerald-600',
    amber: dark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-500/15 text-amber-600',
    indigo: dark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-500/15 text-indigo-600',
    rose: dark ? 'bg-rose-500/20 text-rose-300' : 'bg-rose-500/15 text-rose-600',
  };
  return map[tone];
}
