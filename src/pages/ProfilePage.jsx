import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Eye, EyeOff, IdCard, Lock, Mail, Phone, Save, Shield, User } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { useTheme } from '../hooks/useTheme';
import { formatDate } from '../utils/formatDate';
import { glass } from '../utils/glass';
import { LoadingIndicator } from '../components/LoadingIndicator';

const emptyPassword = {
  current_password: '',
  new_password: '',
  new_password_confirmation: '',
};

export default function ProfilePage() {
  const { dark } = useTheme();
  const {
    profile,
    loading,
    error: profileLoadError,
    updateProfile,
    updatePassword: changePassword,
  } = useProfile();
  const [form, setForm] = useState({
    full_name: profile.full_name || '',
    email: profile.email || '',
    npm_nip: profile.npm_nip || '',
    phone_number: profile.phone_number || '',
  });
  const [passwordData, setPasswordData] = useState(emptyPassword);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    next: false,
    confirmation: false,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);
  const [passwordMessage, setPasswordMessage] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setForm({
        full_name: profile.full_name || '',
        email: profile.email || '',
        npm_nip: profile.npm_nip || '',
        phone_number: profile.phone_number || '',
      });
    }, 0);

    return () => clearTimeout(timer);
  }, [profile]);

  const handleProfileChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handlePasswordChange = (field) => (event) => {
    setPasswordData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const togglePassword = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const saveProfile = async () => {
    setProfileMessage(null);
    if (!form.full_name.trim() || !form.email.trim() || !form.npm_nip.trim()) {
      setProfileMessage({ type: 'error', text: 'Nama, email, dan NPM/NIP wajib diisi.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setProfileMessage({ type: 'error', text: 'Format email tidak valid.' });
      return;
    }

    setSavingProfile(true);
    try {
      await updateProfile({
        full_name: form.full_name,
        email: form.email,
        npm_nip: form.npm_nip,
        phone_number: form.phone_number || null,
      });
      setIsEditing(false);
      setProfileMessage({ type: 'success', text: 'Profil berhasil diperbarui.' });
    } catch (err) {
      setProfileMessage({
        type: 'error',
        text: err?.message || 'Gagal memperbarui profil.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const updatePassword = async () => {
    setPasswordMessage(null);
    if (
      !passwordData.current_password ||
      !passwordData.new_password ||
      !passwordData.new_password_confirmation
    ) {
      setPasswordMessage({ type: 'error', text: 'Semua kolom kata sandi wajib diisi.' });
      return;
    }

    if (passwordData.new_password.length < 8) {
      setPasswordMessage({
        type: 'error',
        text: 'Kata sandi baru minimal 8 karakter.',
      });
      return;
    }

    if (passwordData.new_password !== passwordData.new_password_confirmation) {
      setPasswordMessage({ type: 'error', text: 'Konfirmasi kata sandi tidak sama.' });
      return;
    }

    setSavingPassword(true);
    try {
      await changePassword(passwordData);
      setPasswordData(emptyPassword);
      setPasswordMessage({ type: 'success', text: 'Kata sandi berhasil diperbarui.' });
    } catch (err) {
      setPasswordMessage({
        type: 'error',
        text: err?.message || 'Gagal memperbarui kata sandi.',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const cancelEdit = () => {
    setForm({
      full_name: profile.full_name || '',
      email: profile.email || '',
      npm_nip: profile.npm_nip || '',
      phone_number: profile.phone_number || '',
    });
    setProfileMessage(null);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={glass(dark, 'p-6')}
          >
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <SectionTitle
                dark={dark}
                icon={<User className={`h-5 w-5 ${dark ? 'text-blue-400' : 'text-blue-600'}`} />}
                tone="blue"
                title="Informasi Dasar"
                subtitle="Detail data pribadi"
              />
              <button
                onClick={() => (isEditing ? cancelEdit() : setIsEditing(true))}
                disabled={loading || savingProfile}
                className={`rounded-lg px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60 ${
                  isEditing
                    ? dark
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      : 'bg-red-500/10 text-red-600 hover:bg-red-500/20'
                    : dark
                      ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                      : 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20'
                }`}
              >
                {isEditing ? 'Batal' : 'Ubah Profil'}
              </button>
            </div>

            {loading ? (
              <p className="text-sm opacity-60">
                <LoadingIndicator label="Memuat profil..." />
              </p>
            ) : null}
            <Message
              message={
                profileMessage ||
                (profileLoadError ? { type: 'error', text: profileLoadError } : null)
              }
            />

            <div className="space-y-4">
              <ProfileInput
                dark={dark}
                label="Nama Lengkap"
                required
                icon={User}
                value={form.full_name}
                onChange={handleProfileChange('full_name')}
                disabled={!isEditing}
                placeholder="Masukkan nama lengkap"
              />
              <ProfileInput
                dark={dark}
                label="Alamat Email"
                required
                icon={Mail}
                type="email"
                value={form.email}
                onChange={handleProfileChange('email')}
                disabled={!isEditing}
                placeholder="Masukkan email"
              />
              <ProfileInput
                dark={dark}
                label="NPM/NIP"
                required
                icon={IdCard}
                value={form.npm_nip}
                onChange={handleProfileChange('npm_nip')}
                disabled={!isEditing}
                placeholder="Masukkan NPM/NIP"
              />
              <ProfileInput
                dark={dark}
                label="Nomor Telepon"
                icon={Phone}
                type="tel"
                value={form.phone_number}
                onChange={handleProfileChange('phone_number')}
                disabled={!isEditing}
                placeholder="Masukkan nomor telepon"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <ReadonlyInfo
                  dark={dark}
                  label="Peran"
                  value={profile.role || '-'}
                  icon={Shield}
                  badge="Hanya baca"
                />
                <ReadonlyInfo
                  dark={dark}
                  label="Status"
                  value={profile.status || '-'}
                  badge={profile.status || '-'}
                  status={profile.status}
                />
              </div>

              {isEditing ? (
                <motion.button
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={saveProfile}
                  disabled={savingProfile}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-6 py-3 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Save className="h-4 w-4" />
                  {savingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
                </motion.button>
              ) : null}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className={glass(dark, 'p-6')}
          >
            <div className="mb-6">
              <SectionTitle
                dark={dark}
                icon={
                  <Lock className={`h-5 w-5 ${dark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                }
                tone="indigo"
                title="Ubah Kata Sandi"
                subtitle="Perbarui kata sandi untuk menjaga keamanan akun"
              />
            </div>

            <Message message={passwordMessage} />

            <div className="space-y-4">
              <PasswordInput
                dark={dark}
                label="Kata Sandi Saat Ini"
                value={passwordData.current_password}
                onChange={handlePasswordChange('current_password')}
                visible={showPasswords.current}
                onToggle={() => togglePassword('current')}
                placeholder="Masukkan kata sandi saat ini"
              />
              <PasswordInput
                dark={dark}
                label="Kata Sandi Baru"
                value={passwordData.new_password}
                onChange={handlePasswordChange('new_password')}
                visible={showPasswords.next}
                onToggle={() => togglePassword('next')}
                placeholder="Masukkan kata sandi baru (min. 8 karakter)"
              />
              <PasswordInput
                dark={dark}
                label="Konfirmasi Kata Sandi Baru"
                value={passwordData.new_password_confirmation}
                onChange={handlePasswordChange('new_password_confirmation')}
                visible={showPasswords.confirmation}
                onToggle={() => togglePassword('confirmation')}
                placeholder="Masukkan ulang kata sandi baru"
              />
              <button
                onClick={updatePassword}
                disabled={savingPassword}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-600 to-blue-600 px-6 py-3 text-white shadow-lg shadow-indigo-500/2 hover:shadow-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Lock className="h-4 w-4" />
                {savingPassword ? 'Memperbarui...' : 'Perbarui Kata Sandi'}
              </button>
            </div>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className={glass(dark, 'p-6')}
          >
            <div className="mb-4">
              <SectionTitle
                dark={dark}
                icon={
                  <Calendar
                    className={`h-5 w-5 ${dark ? 'text-emerald-400' : 'text-emerald-600'}`}
                  />
                }
                tone="emerald"
                title="Info Akun"
              />
            </div>

            <div className="space-y-4">
              <InfoRow dark={dark} label="Login Terakhir" value={formatDate(profile.last_login_at)} />
              <Divider dark={dark} />
              <InfoRow dark={dark} label="Akun Dibuat" value={formatDate(profile.created_at)} />
              <Divider dark={dark} />
              <InfoRow dark={dark} label="Terakhir Diperbarui" value={formatDate(profile.updated_at)} />
              <Divider dark={dark} />
              <InfoRow
                dark={dark}
                label="ID Pengguna"
                value={profile.id ? `#${String(profile.id).padStart(6, '0')}` : '-'}
                mono
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function ProfileInput({
  dark,
  label,
  icon: Icon,
  value,
  onChange,
  disabled,
  placeholder,
  type = 'text',
  required = false,
}) {
  return (
    <div>
      <label className={`mb-2 block text-sm ${dark ? 'text-slate-300' : 'text-blue-900/80'}`}>
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      <div className="relative">
        <Icon
          className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
            dark ? 'text-slate-500' : 'text-blue-900/40'
          }`}
        />
        <input
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`${inputClass(dark, disabled)} pl-10`}
        />
      </div>
    </div>
  );
}

function PasswordInput({ dark, label, value, onChange, visible, onToggle, placeholder }) {
  return (
    <div>
      <label className={`mb-2 block text-sm ${dark ? 'text-slate-300' : 'text-blue-900/80'}`}>
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <Lock
          className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
            dark ? 'text-slate-500' : 'text-blue-900/40'
          }`}
        />
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          className={`${inputClass(dark)} pl-10 pr-10`}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={onToggle}
          className={`absolute right-3 top-1/2 -translate-y-1/2 ${
            dark ? 'text-slate-500 hover:text-slate-300' : 'text-blue-900/40 hover:text-blue-900/70'
          }`}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function SectionTitle({ dark, icon, tone, title, subtitle }) {
  const toneClass = {
    blue: dark ? 'bg-blue-500/20' : 'bg-blue-500/10',
    indigo: dark ? 'bg-indigo-500/20' : 'bg-indigo-500/10',
    emerald: dark ? 'bg-emerald-500/20' : 'bg-emerald-500/10',
  }[tone];

  return (
    <div className="flex items-center gap-3">
      <div className={`rounded-xl p-2.5 ${toneClass}`}>{icon}</div>
      <div>
        <h2 className={`text-lg ${dark ? 'text-white' : 'text-blue-900'}`}>{title}</h2>
        {subtitle ? (
          <p className={`text-xs ${dark ? 'text-slate-400' : 'text-blue-900/60'}`}>{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

function ReadonlyInfo({ dark, label, value, icon: Icon }) {
  return (
    <div>
      <label className={`mb-2 block text-sm ${dark ? 'text-slate-300' : 'text-blue-900/80'}`}>
        {label}
      </label>
      <div
        className={`${inputClass(dark, true)} relative flex items-center justify-between gap-2 ${
          Icon ? 'pl-10' : ''
        }`}
      >
        {Icon ? (
          <Icon
            className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
              dark ? 'text-slate-500' : 'text-blue-900/40'
            }`}
          />
        ) : null}
        <span className="capitalize">{value}</span>
      </div>
    </div>
  );
}

function InfoRow({ dark, label, value, mono = false }) {
  return (
    <div>
      <p className={`mb-1 text-xs ${dark ? 'text-slate-500' : 'text-blue-900/50'}`}>{label}</p>
      <p
        className={`text-sm ${mono ? 'font-mono' : ''} ${dark ? 'text-slate-300' : 'text-blue-900/80'}`}
      >
        {value}
      </p>
    </div>
  );
}

function Message({ message }) {
  if (!message) return null;
  return (
    <p
      className={`mb-4 text-sm ${message.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`}
    >
      {message.text}
    </p>
  );
}

function Divider({ dark }) {
  return <div className={`border-t ${dark ? 'border-white/10' : 'border-blue-200/40'}`} />;
}

function inputClass(dark, readonly = false) {
  if (readonly) {
    return `w-full rounded-xl border px-4 py-2.5 text-sm outline-none ${
      dark
        ? 'border-white/5 bg-white/5 text-slate-400 cursor-not-allowed'
        : 'border-blue-200/30 bg-blue-50/50 text-blue-900/50 cursor-not-allowed'
    }`;
  }

  return `w-full rounded-xl border px-4 py-2.5 text-sm outline-none ${
    dark
      ? 'border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:bg-white/10'
      : 'border-blue-200/60 bg-white/60 text-blue-900 placeholder:text-blue-900/40 focus:border-blue-400/70 focus:bg-white shadow-inner'
  }`;
}
