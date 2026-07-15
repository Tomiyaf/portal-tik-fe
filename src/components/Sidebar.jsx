import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  LayoutDashboard,
  Video,
  Car,
  Users,
  User,
  ScrollText,
  PhoneCall,
  LogOut,
  X,
  Download,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { canAccessLogs, canAccessParking, canAccessProfile, canAccessUsers, canAccessIntercom } from '../lib/rbac';

function getNavItems(user) {
  return [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { path: '/cctv', label: 'Monitoring CCTV', icon: <Video className="h-4 w-4" /> },
    canAccessParking(user)
      ? { path: '/parking', label: 'Manajemen Parkir', icon: <Car className="h-4 w-4" /> }
      : null,
    canAccessUsers(user)
      ? { path: '/users', label: 'Manajemen Pengguna', icon: <Users className="h-4 w-4" /> }
      : null,
    canAccessLogs(user)
      ? { path: '/logs', label: 'Log Akses', icon: <ScrollText className="h-4 w-4" /> }
      : null,
    canAccessIntercom(user)
      ? { path: '/intercom', label: 'Intercom', icon: <PhoneCall className="h-4 w-4" /> }
      : null,
    canAccessProfile(user)
      ? { path: '/profile', label: 'Profil', icon: <User className="h-4 w-4" /> }
      : null,
  ].filter(Boolean);
}

function SidebarContent({ dark, user, onLogout, onClose, showHeader = true }) {
  const displayName = user?.full_name || user?.name || 'User';
  const email = user?.email || 'user@example.com';
  const initial = displayName.charAt(0) || 'U';
  const navigate = useNavigate();
  const navItems = getNavItems(user);

  return (
    <div className="flex min-h-0 flex-1 flex-col h-full">
      {showHeader ? (
        <div className="mb-7 flex items-center gap-2.5">
          <div className="grid h-9 w-9 p-1 place-items-center rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30">
            <img src="/gate-tik-icon.svg" alt="Logo" />
          </div>
          <div>
            <p className="tracking-tight">{import.meta.env.VITE_APP_NAME}</p>
            <p className="text-[10px] uppercase tracking-widest opacity-50">Access Control</p>
          </div>
        </div>
      ) : null}

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink key={item.path} to={item.path} className="block" onClick={onClose}>
            {({ isActive }) => (
              <div
                className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  isActive
                    ? dark
                      ? 'bg-linear-to-r from-blue-600/30 to-indigo-600/20 text-white'
                      : 'bg-linear-to-r from-blue-500/20 to-blue-600/10 text-blue-800 shadow-[inset_0_1px_4px_rgba(255,255,255,0.6)]'
                    : dark
                      ? 'text-slate-400 hover:bg-white/5 hover:text-white'
                      : 'text-blue-900/60 hover:bg-blue-500/10 hover:text-blue-900'
                }`}
              >
                {isActive ? (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-blue-500"
                  />
                ) : null}
                {item.icon}
                {item.label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-4 md:hidden">
        <button
          onClick={() => {
            navigate('/download');
            if (onClose) onClose();
          }}
          className={`flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
            dark
              ? 'border-white/10 bg-white/5 hover:bg-white/10 text-white'
              : 'border-blue-200/60 bg-white/60 text-blue-800 hover:bg-white hover:shadow-md'
          }`}
        >
          <Download className="h-4 w-4" />
          <span className="whitespace-nowrap">Download App</span>
        </button>
      </div>

      <div
        className={`mt-4 flex items-center gap-3 rounded-2xl border p-3 ${
          dark
            ? 'border-white/10 bg-white/5'
            : 'border-blue-200/50 bg-white/60 shadow-sm shadow-blue-500/5'
        }`}
      >
        <button
          type="button"
          onClick={() => {
            navigate('/profile');
          }}
          className="cursor-pointer"
        >
          <div className="grid h-9 w-9 place-items-center rounded-full bg-linear-to-br from-blue-500 to-indigo-600 text-sm text-white">
            {initial}
          </div>
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm">{displayName}</p>
          <p className="truncate text-[11px] opacity-60">{email}</p>
        </div>
        <button
          onClick={onLogout}
          className="rounded-lg p-1.5 opacity-60 hover:bg-red-500/10 hover:text-red-500 hover:opacity-100"
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function Sidebar({ dark, user, onLogout, isOpen, onClose }) {
  useEffect(() => {
    if (isOpen) {
      const htmlOriginal = document.documentElement.style.overflow;
      const bodyOriginal = document.body.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      return () => {
        document.documentElement.style.overflow = htmlOriginal;
        document.body.style.overflow = bodyOriginal;
      };
    }
  }, [isOpen]);

  return (
    <>
      <aside
        className={`sticky top-0 hidden h-screen w-64 flex-col border-r p-4 md:flex ${
          dark
            ? 'border-white/10 bg-white/3 backdrop-blur-xl'
            : 'border-blue-200/40 bg-white/50 backdrop-blur-xl shadow-[4px_0_24px_-12px_rgba(37,99,235,0.15)]'
        }`}
      >
        <SidebarContent dark={dark} user={user} onLogout={onLogout} />
      </aside>

      <AnimatePresence>
        {isOpen ? (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.aside
              className={`fixed left-0 top-0 z-50 flex h-dvh w-72 flex-col border-r p-4 md:hidden ${
                dark
                  ? 'border-white/10 bg-[#040816]/90 backdrop-blur-xl'
                  : 'border-blue-200/40 bg-white/90 backdrop-blur-xl'
              }`}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            >
              <div className="mb-6 flex shrink-0 items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1 grid h-9 w-9 place-items-center rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30">
                    <img src="/gate-tik-icon.svg" alt="Logo" />
                  </div>
                  <div>
                    <p className="tracking-tight">{import.meta.env.VITE_APP_NAME}</p>
                    <p className="text-[10px] uppercase tracking-widest opacity-50">
                      Access Control
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className={`grid h-8 w-8 place-items-center rounded-lg border ${
                    dark ? 'border-white/10 bg-white/5' : 'border-blue-200/60 bg-white/70'
                  }`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="min-h-0 flex-1">
                <SidebarContent
                  dark={dark}
                  user={user}
                  onLogout={onLogout}
                  onClose={onClose}
                  showHeader={false}
                />
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
