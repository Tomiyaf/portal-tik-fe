import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Download,
  Monitor,
  Smartphone,
  Terminal,
  ExternalLink,
  Moon,
  Sun,
  ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';

export default function DownloadPage() {
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  // const isMobile = useMediaQuery('(max-width: 640px)');

  const [releaseInfo, setReleaseInfo] = useState(null);

  useEffect(() => {
    const fetchReleaseInfo = async () => {
      try {
        const response = await fetch(
          import.meta.env.VITE_APP_RELEASE_INFO ||
            'https://api.github.com/repos/kite1412/gatetik/releases/latest',
        );
        const data = await response.json();
        setReleaseInfo(data);
      } catch (error) {
        console.error('Failed to fetch release info:', error);
      }
    };
    fetchReleaseInfo();
  }, []);

  const onToggleDark = () => toggle();

  const fallbackUrl =
    import.meta.env.VITE_APP_RELEASE_PAGE || import.meta.env.APP_RELEASE_PAGE || '#';

  const getAssetUrl = (keyword) => {
    if (!releaseInfo) return fallbackUrl;
    const asset = releaseInfo.assets?.find((a) => a.name.includes(keyword));
    return asset ? asset.browser_download_url : fallbackUrl;
  };

  const platforms = [
    {
      name: 'Android',
      icon: <Smartphone className="h-6 w-6" />,
      desc: 'Untuk perangkat Android',
      url: getAssetUrl('.apk'),
    },
    {
      name: 'Windows (amd64)',
      icon: <Monitor className="h-6 w-6" />,
      desc: 'Untuk PC Windows 64-bit',
      url: getAssetUrl('.msi'),
    },
    {
      name: 'Linux (amd64)',
      icon: <Terminal className="h-6 w-6" />,
      desc: 'Untuk PC Linux 64-bit',
      url: getAssetUrl('linux_amd64.deb'),
    },
    {
      name: 'Linux (arm64)',
      icon: <Terminal className="h-6 w-6" />,
      desc: 'Untuk Linux ARM 64-bit',
      url: getAssetUrl('linux_arm64.deb'),
    },
  ];

  const latestVersion =
    releaseInfo?.tag_name ||
    import.meta.env.VITE_APP_LATEST_VERSION ||
    import.meta.env.APP_LATEST_VERSION;

  return (
    <div
      className={`relative min-h-screen w-full overflow-hidden ${
        dark
          ? 'bg-linear-to-br from-[#06122b] via-[#0a1f4d] to-[#020617] text-white'
          : 'bg-linear-to-br from-[#e0e7ff] via-[#eff6ff] to-[#dbeafe] text-slate-900'
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-0 ${dark ? 'opacity-30' : 'opacity-20'}`}
        style={{
          backgroundImage: dark
            ? 'linear-gradient(rgba(59,130,246,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.15) 1px, transparent 1px)'
            : 'linear-gradient(rgba(37,99,235,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.2) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }}
      />
      <motion.div
        className={`pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full blur-3xl ${
          dark ? 'bg-blue-500/30' : 'bg-blue-400/40'
        }`}
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 10, repeat: Infinity }}
      />
      <motion.div
        className={`pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full blur-3xl ${
          dark ? 'bg-indigo-500/30' : 'bg-blue-500/30'
        }`}
        animate={{ x: [0, -30, 0], y: [0, -40, 0] }}
        transition={{ duration: 12, repeat: Infinity }}
      />

      <div className="absolute left-5 top-5 z-50 flex gap-2">
        <button
          onClick={() => navigate(-1)}
          className={`rounded-full border p-2.5 backdrop-blur-md transition ${
            dark
              ? 'border-white/15 bg-white/5 hover:bg-white/10'
              : 'border-blue-200/50 bg-white/50 text-blue-800 hover:bg-white/80 shadow-sm'
          }`}
          aria-label="go back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      </div>

      <button
        onClick={onToggleDark}
        className={`absolute right-5 top-5 z-50 rounded-full border p-2.5 backdrop-blur-md transition ${
          dark
            ? 'border-white/15 bg-white/5 hover:bg-white/10'
            : 'border-blue-200/50 bg-white/50 text-blue-800 hover:bg-white/80 shadow-sm'
        }`}
        aria-label="toggle theme"
      >
        {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <div className="relative z-0 flex min-h-screen items-center justify-center px-5 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={`w-full max-w-2xl rounded-3xl border p-8 backdrop-blur-2xl ${
            dark
              ? 'border-white/15 bg-white/6 shadow-[0_20px_60px_-15px_rgba(2,8,40,0.7)]'
              : 'border-blue-200/60 bg-white/60 shadow-[0_20px_60px_-15px_rgba(37,99,235,0.15)]'
          }`}
        >
          <div className="mb-8 flex flex-col items-center text-center">
            <div
              className={`mb-4 grid h-14 w-14 p-2 place-items-center rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 shadow-lg ${
                dark ? 'shadow-blue-500/40' : 'shadow-blue-500/30 text-white'
              }`}
            >
              <Download className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Unduh Aplikasi Gate TIK</h1>
            {latestVersion && (
              <div
                className={`mt-2.5 inline-flex items-center rounded-full px-3 py-1 text-s font-medium tracking-wide ${dark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-500/10 text-blue-700'}`}
              >
                {latestVersion}
              </div>
            )}
            <p className={`mt-3 text-sm ${dark ? 'text-white/60' : 'text-blue-900/60'}`}>
              Pilih platform yang sesuai dengan perangkat Anda untuk mengunduh aplikasi.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {platforms.map((platform, idx) => (
              <a
                key={idx}
                href={platform.url}
                className={`group flex items-center gap-4 rounded-2xl border p-4 transition-all hover:scale-[1.02] ${
                  dark
                    ? 'border-white/10 bg-white/5 hover:border-blue-500/50 hover:bg-white/10'
                    : 'border-blue-200/60 bg-white/50 hover:border-blue-400 hover:bg-white hover:shadow-md'
                }`}
              >
                <div
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-linear-to-br from-blue-500/20 to-indigo-600/20 ${
                    dark ? 'text-blue-400' : 'text-blue-600'
                  }`}
                >
                  {platform.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{platform.name}</h3>
                  <p className={`text-xs ${dark ? 'text-white/50' : 'text-blue-900/50'}`}>
                    {platform.desc}
                  </p>
                </div>
                <Download
                  className={`h-5 w-5 opacity-0 transition-all group-hover:opacity-100 ${dark ? 'text-white' : 'text-blue-600'}`}
                />
              </a>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col items-center">
            <a
              href={
                import.meta.env.VITE_APP_RELEASE_PAGE || import.meta.env.APP_RELEASE_PAGE || '#'
              }
              className={`inline-flex items-center gap-2 text-sm font-medium transition-colors ${
                dark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
              }`}
            >
              <ExternalLink className="h-4 w-4" />
              Halaman Rilis
            </a>
            <p className={`mt-1 text-xs ${dark ? 'text-white/40' : 'text-blue-900/40'}`}>
              Lihat catatan rilis dan versi sebelumnya
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
