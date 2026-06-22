import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTheme } from '../hooks/useTheme';
import { useAccessLogs } from '../hooks/useAccessLogs';
import { formatDate } from '../utils/formatDate';
import { glass } from '../utils/glass';
import { LoadingIndicator } from '../components/LoadingIndicator';

const initialChartData = Array.from({ length: 24 }).map((_, i) => ({
  id: `hour-${i}`,
  hour: `${i.toString().padStart(2, '0')}:00`,
  access: 0,
}));

export default function LogsPage() {
  const { dark } = useTheme();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [method, setMethod] = useState('all');
  const [action, setAction] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const [chartStatus, setChartStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [exporting, setExporting] = useState(false);
  const [chartLogs, setChartLogs] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState('');

  const { logs, loading, error, pagination, fetchAllLogs } = useAccessLogs({
    page,
    perPage,
    sortOrder,
    accessStatus: status === 'all' ? undefined : status,
    accessMethod: method === 'all' ? undefined : method,
    action: action === 'all' ? undefined : action,
    search: debouncedSearch,
    includeLastOpened: false,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  const loadChartLogs = useCallback(async () => {
    setChartLoading(true);
    setChartError('');
    try {
      const allChartLogs = await fetchAllLogs({
        period: '24h',
        accessStatus: chartStatus === 'all' ? undefined : chartStatus,
      });
      setChartLogs(allChartLogs);
    } catch (err) {
      setChartError(err?.message || 'Gagal memuat chart logs.');
      setChartLogs([]);
    } finally {
      setChartLoading(false);
    }
  }, [chartStatus, fetchAllLogs]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadChartLogs();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadChartLogs]);

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

  const perPageValue = pagination?.per_page ?? perPage;
  const total = pagination?.total ?? logs.length;
  const totalPages = Math.max(1, Math.ceil(total / perPageValue));

  const pageNumbers = useMemo(() => {
    const windowSize = 5;
    const half = Math.floor(windowSize / 2);
    let start = Math.max(1, page - half);
    let end = Math.min(totalPages, start + windowSize - 1);
    if (end - start < windowSize - 1) {
      start = Math.max(1, end - windowSize + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [page, totalPages]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const allLogs = await fetchAllLogs({
        perPage: 100,
        sortOrder,
        accessStatus: status === 'all' ? undefined : status,
        accessMethod: method === 'all' ? undefined : method,
        action: action === 'all' ? undefined : action,
        search: search || undefined,
      });

      const headers = ['Pengguna', 'Peran', 'Aksi', 'Metode', 'Status', 'Catatan', 'Waktu'];
      const rows = allLogs.map((entry) => [
        entry?.user?.full_name || '-',
        entry?.user?.role || '-',
        entry?.action || '-',
        entry?.access_method || '-',
        entry?.access_status || '-',
        entry?.notes || '-',
        entry?.created_at
          ? new Date(entry.created_at).toLocaleString('en-GB', { hour12: false })
          : '-',
      ]);

      const csv = [headers, ...rows]
        .map((row) =>
          row.map((cell) => `"${String(cell ?? '')}`.replace(/"/g, '""') + '"').join(','),
        )
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `access-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-end gap-4">
        {/* <div>
          <h1 className="tracking-tight">Access Logs</h1>
          <p className="text-sm opacity-60">Enterprise audit trail</p>
        </div> */}
        <button
          onClick={exportCsv}
          disabled={exporting}
          className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm ${
            dark
              ? 'border-white/10 hover:bg-white/5'
              : 'border-blue-200 text-blue-800 hover:bg-blue-50/50 bg-white/50'
          }`}
        >
          <Download className="h-4 w-4" /> {exporting ? 'Mengekspor...' : 'Ekspor CSV'}
        </button>
      </div>

      <div className={glass(dark, 'flex flex-col overflow-hidden p-4 sm:p-6')}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-widest opacity-60">Tren Akses</p>
            <h3 className="tracking-tight">24 Jam Terakhir</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs opacity-60">Status:</span>
            <SelectField label="" value={chartStatus} onChange={setChartStatus} dark={dark} compact>
              <option value="all">Semua</option>
              <option value="success">Berhasil</option>
              <option value="failed">Gagal</option>
              <option value="pending">Menunggu</option>
            </SelectField>
            {/* <span className="text-xs opacity-60">Period:</span>
            <SelectField label="" value={chartPeriod} onChange={setChartPeriod} dark={dark} compact>
              <option value="24h">24h</option>
              <option value="7d">7d</option>
              <option value="30d">30d</option>
            </SelectField> */}
          </div>
        </div>
        <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          <div className="h-56 min-h-56 min-w-[480px] sm:min-w-[640px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={chartData} margin={{ top: 0, right: 12, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="logsAccessGradient" x1="0" y1="0" x2="0" y2="1">
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
                  fill="url(#logsAccessGradient)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        {chartLoading ? (
          <p className="mt-3 text-xs opacity-60">
            <LoadingIndicator label="Memuat grafik log..." />
          </p>
        ) : null}
        {chartError ? <p className="mt-3 text-xs text-red-500">{chartError}</p> : null}
      </div>

      <div className={glass(dark, 'p-4')}>
        <div className="flex flex-col gap-3">
          <div
            className={`flex min-w-55 flex-1 items-center gap-2 rounded-xl border px-3 py-2 ${
              dark
                ? 'border-white/10 bg-white/5 focus-within:border-blue-400'
                : 'border-blue-200 bg-white/50 focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-inner text-blue-900'
            }`}
          >
            <Search className={dark ? 'h-4 w-4 opacity-60' : 'h-4 w-4 text-blue-900/40'} />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Cari log…"
              className={`w-full bg-transparent text-sm outline-none ${
                dark ? '' : 'placeholder:text-blue-900/40'
              }`}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
            <SelectField
              label="Status"
              value={status}
              onChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
              dark={dark}
            >
              <option value="all">Semua</option>
              <option value="success">Berhasil</option>
              <option value="failed">Gagal</option>
              <option value="pending">Menunggu</option>
            </SelectField>
            <SelectField
              label="Method"
              value={method}
              onChange={(value) => {
                setMethod(value);
                setPage(1);
              }}
              dark={dark}
            >
              <option value="all">Semua</option>
              <option value="web">Web</option>
              <option value="mobile">Mobile</option>
            </SelectField>
            <SelectField
              label="Action"
              value={action}
              onChange={(value) => {
                setAction(value);
                setPage(1);
              }}
              dark={dark}
            >
              <option value="all">Semua</option>
              <option value="open">Buka</option>
              <option value="close">Tutup</option>
              <option value="entry">Masuk</option>
              <option value="exit">Keluar</option>
            </SelectField>
            <SelectField
              label="Urutkan"
              value={sortOrder}
              onChange={(value) => {
                setSortOrder(value);
                setPage(1);
              }}
              dark={dark}
            >
              <option value="desc">Terbaru</option>
              <option value="asc">Terlama</option>
            </SelectField>
          </div>
        </div>
      </div>

      <div className={glass(dark, 'overflow-hidden')}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-200 text-left text-sm">
            <thead
              className={dark ? 'bg-white/3 text-slate-400' : 'bg-blue-50/50 text-blue-900/60'}
            >
              <tr className="text-[11px] uppercase tracking-wider">
                <th className="px-5 py-3 font-normal">Pengguna</th>
                <th className="px-5 py-3 font-normal">Peran</th>
                <th className="px-5 py-3 font-normal">Aksi</th>
                <th className="px-5 py-3 font-normal">Metode</th>
                <th className="px-5 py-3 font-normal">Status</th>
                <th className="px-5 py-3 font-normal">Catatan</th>
                <th className="px-5 py-3 font-normal">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-current/10">
              {loading ? (
                <tr>
                  <td className="px-5 py-4 text-center opacity-70" colSpan={7}>
                    <LoadingIndicator label="Memuat log..." className="justify-center" />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td className="px-5 py-4 text-center text-red-500/90" colSpan={7}>
                    {error}
                  </td>
                </tr>
              ) : !logs.length ? (
                <tr>
                  <td className="px-5 py-4 text-center opacity-70" colSpan={7}>
                    Belum ada data log akses.
                  </td>
                </tr>
              ) : (
                logs.map((entry) => {
                  const timestamp = entry?.created_at ? formatDate(entry.created_at) : '-';
                  const statusClass = {
                    success: 'bg-emerald-500/15 text-emerald-500',
                    pending: 'bg-amber-500/15 text-amber-500',
                    failed: 'bg-red-500/15 text-red-500',
                  };
                  return (
                    <tr key={entry.id} className="hover:bg-current/3">
                      <td className="px-5 py-3">{entry?.user?.full_name || '-'}</td>
                      <td className="px-5 py-3 capitalize opacity-70">
                        {entry?.user?.role || '-'}
                      </td>
                      <td className="px-5 py-3 capitalize">{entry?.action || '-'}</td>
                      <td className="px-5 py-3 capitalize opacity-70">
                        {entry?.access_method || '-'}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs capitalize ${statusClass[entry?.access_status]}`}
                        >
                          {entry?.access_status || '-'}
                        </span>
                      </td>
                      <td className="px-5 py-3 opacity-70">{entry?.notes || '-'}</td>
                      <td className="px-5 py-3 tabular-nums opacity-70">{timestamp}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-current/10 px-3 py-4 text-xs sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-5">
          <span className="opacity-60">
            Halaman {page} dari {totalPages} · {total} data
          </span>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
            <label className="flex items-center gap-2 opacity-70">
              Per Halaman
              <select
                value={String(perPage)}
                onChange={(event) => {
                  setPerPage(Number(event.target.value));
                  setPage(1);
                }}
                className={`rounded-lg border px-2 py-1 outline-none ${
                  dark
                    ? 'border-white/10 bg-slate-900/70 text-slate-100'
                    : 'border-blue-200 bg-white/80 text-blue-900'
                }`}
              >
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </label>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className={`rounded-lg border px-2.5 py-1 ${
                  dark
                    ? 'border-white/10 text-white/70 hover:bg-white/5'
                    : 'border-blue-200 text-blue-800 hover:bg-blue-50/50'
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
                className={`rounded-lg border px-2.5 py-1 ${
                  dark
                    ? 'border-white/10 text-white/70 hover:bg-white/5'
                    : 'border-blue-200 text-blue-800 hover:bg-blue-50/50'
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {pageNumbers.map((num) => (
                <button
                  key={num}
                  onClick={() => setPage(num)}
                  className={`rounded-lg px-2.5 py-1 ${
                    page === num
                      ? 'bg-blue-600 text-white'
                      : dark
                        ? 'border border-white/10 text-white/70 hover:bg-white/5'
                        : 'border border-blue-200 text-blue-800 hover:bg-blue-50/50'
                  }`}
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className={`rounded-lg border px-2.5 py-1 ${
                  dark
                    ? 'border-white/10 text-white/70 hover:bg-white/5'
                    : 'border-blue-200 text-blue-800 hover:bg-blue-50/50'
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className={`rounded-lg border px-2.5 py-1 ${
                  dark
                    ? 'border-white/10 text-white/70 hover:bg-white/5'
                    : 'border-blue-200 text-blue-800 hover:bg-blue-50/50'
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, dark, children, compact = false }) {
  return (
    <label className={compact ? 'text-xs' : 'text-[11px] uppercase tracking-widest opacity-60'}>
      {label ? <span className="block mb-1">{label}</span> : null}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${compact ? '' : 'w-full sm:w-auto'} rounded-xl border px-3 py-2 text-sm outline-none ${
          dark
            ? 'border-white/10 bg-slate-900/70 text-slate-100'
            : 'border-blue-200 bg-white/80 text-blue-900'
        } ${compact ? 'py-1 text-xs' : ''}`}
      >
        {children}
      </select>
    </label>
  );
}
