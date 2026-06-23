import { useState } from 'react';
import { motion } from 'motion/react';
import { Menu, Moon, Sun, Download } from 'lucide-react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/useAuth';
import { useTheme } from '../hooks/useTheme';

export default function Layout() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const pageTitleMap = {
    '/dashboard': 'Dashboard',
    '/gate-control': 'Kontrol Gate',
    '/cctv': 'Monitoring CCTV',
    '/parking': 'Manajemen Parkir',
    '/users': 'Manajemen Pengguna',
    '/logs': 'Log Akses',
    '/intercom': 'Intercom',
    '/settings': 'Pengaturan',
    '/profile': 'Profil',
  };

  const currentTitle = pageTitleMap[location.pathname] || 'Dashboard';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div
      className={`relative min-h-dvh w-full ${
        dark
          ? 'bg-linear-to-br from-[#040816] via-[#071230] to-[#040816] text-slate-100'
          : 'bg-linear-to-br from-[#e6f0ff] via-[#f0f5ff] to-[#e0edff] text-slate-900'
      }`}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={`absolute -top-40 -left-40 h-xl w-xl rounded-full blur-3xl ${
            dark ? 'bg-blue-600/20' : 'bg-blue-400/40'
          }`}
        />
        <div
          className={`absolute -bottom-40 -right-40 h-xl w-xl rounded-full blur-3xl ${
            dark ? 'bg-indigo-600/20' : 'bg-blue-500/30'
          }`}
        />
      </div>

      <div className="relative z-10 flex min-h-dvh">
        <Sidebar
          dark={dark}
          user={user}
          onLogout={handleLogout}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <header
            className={`sticky top-0 z-20 flex items-center gap-3 border-b px-4 py-3 backdrop-blur-xl md:px-8 md:py-3.5 ${
              dark
                ? 'border-white/10 bg-[#040816]/60'
                : 'border-blue-200/40 bg-white/40 shadow-[0_4px_24px_-12px_rgba(37,99,235,0.1)]'
            }`}
          >
            <button
              onClick={() => setSidebarOpen(true)}
              className={`grid h-9 w-9 place-items-center rounded-xl border md:hidden ${
                dark
                  ? 'border-white/10 bg-white/5 hover:bg-white/10'
                  : 'border-blue-200/60 bg-white/60 text-blue-800 hover:bg-white'
              }`}
            >
              <Menu className="h-4 w-4" />
            </button>

            <h1 className="text-2xl tracking-tight w-full">{currentTitle}</h1>

            {/* <div
              className={`hidden flex-1 items-center gap-2 rounded-xl border px-3.5 py-2 text-sm transition-all md:flex ${
                dark
                  ? 'border-white/10 bg-white/5 text-slate-400 focus-within:border-white/20 focus-within:bg-white/10 focus-within:text-white'
                  : 'border-blue-200/60 bg-white/60 text-blue-900/60 focus-within:border-blue-400/50 focus-within:bg-white focus-within:text-blue-900 shadow-inner'
              }`}
            >
              <Search className="h-4 w-4 opacity-60" />
              <input
                className="w-full bg-transparent outline-none placeholder:text-current"
                placeholder="Search users, devices, logs…"
              />
              <kbd
                className={`hidden rounded border px-1.5 text-[10px] opacity-60 lg:inline ${
                  dark ? 'border-white/20' : 'border-blue-300/50'
                }`}
              >
                ⌘K
              </kbd>
            </div> */}

            <button
              onClick={() => navigate('/download')}
              className={`hidden sm:flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-sm font-medium transition ${
                dark
                  ? 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
                  : 'border-blue-200/60 bg-white/60 text-blue-800 hover:bg-white hover:shadow-md hover:shadow-blue-500/10'
              }`}
            >
              <Download className="h-4 w-4" />
              <span className="whitespace-nowrap">Download App</span>
            </button>
            <button
              onClick={toggle}
              className={`grid h-9 w-9 place-items-center rounded-xl border ${
                dark
                  ? 'border-white/10 bg-white/5 hover:bg-white/10'
                  : 'border-blue-200/60 bg-white/60 text-blue-800 hover:bg-white hover:shadow-md hover:shadow-blue-500/10'
              }`}
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {/* <button
              className={`relative grid h-9 w-9 place-items-center rounded-xl border ${
                dark
                  ? 'border-white/10 bg-white/5 hover:bg-white/10'
                  : 'border-blue-200/60 bg-white/60 text-blue-800 hover:bg-white hover:shadow-md hover:shadow-blue-500/10'
              }`}
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
            </button> */}
            {/* <span
              className={`hidden rounded-full px-3 py-1 text-[11px] uppercase tracking-wider sm:inline ${
                dark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-500/10 text-blue-700'
              }`}
            >
              {user?.role || 'user'}
            </span> */}
          </header>

          <main className="flex-1 px-4 py-6 md:px-8">
            {/* <AnimatePresence mode="wait"> */}
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
            >
              <Outlet />
            </motion.div>
            {/* </AnimatePresence> */}
          </main>
        </div>
      </div>
    </div>
  );
}
