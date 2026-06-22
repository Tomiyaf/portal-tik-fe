import { Eye, Trash2, UserCheck, UserPen } from 'lucide-react';
import { formatDate } from '../../utils/formatDate';
import { LoadingIndicator } from '../LoadingIndicator';

const statusLabels = {
  active: 'Aktif',
  pending: 'Menunggu',
  suspended: 'Ditangguhkan',
};

export function UsersTable({
  dark,
  users,
  loading,
  error,
  verifyingId,
  onDetail,
  onEdit,
  onVerify,
  onDelete,
  footer,
}) {
  return (
    <div className={glass(dark, 'overflow-hidden')}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className={dark ? 'bg-white/3 text-slate-400' : 'bg-blue-50/50 text-blue-900/60'}>
            <tr className="text-[11px] uppercase tracking-wider">
              <th className="px-5 py-3 font-normal">Nama</th>
              <th className="px-5 py-3 font-normal">Role</th>
              <th className="px-5 py-3 font-normal">Email</th>
              <th className="px-5 py-3 font-normal">NPM/NIP</th>
              <th className="px-5 py-3 font-normal">Status</th>
              <th className="px-5 py-3 font-normal">Terdaftar</th>
              <th className="px-5 py-3 text-right font-normal">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-current/10">
            {loading ? (
              <tr>
                <td className="px-5 py-6 text-center opacity-60" colSpan={7}>
                  <LoadingIndicator label="Memuat pengguna..." className="justify-center" />
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td className="px-5 py-6 text-center text-red-500/90" colSpan={7}>
                  {error}
                </td>
              </tr>
            ) : users.length ? (
              users.map((userItem) => (
                <tr key={userItem.id} className="hover:bg-current/3">
                  <td className="px-5 py-3">{userItem.full_name}</td>
                  <td className="px-5 py-3 capitalize opacity-70">{userItem.role}</td>
                  <td className="px-5 py-3 opacity-70">{userItem.email}</td>
                  <td className="px-5 py-3 opacity-70">{userItem.npm_nip}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        userItem.status === 'active'
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : userItem.status === 'pending'
                            ? 'bg-amber-500/15 text-amber-500'
                            : 'bg-red-500/15 text-red-500'
                      }`}
                    >
                      {statusLabels[userItem.status] ?? userItem.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 tabular-nums opacity-70">
                    {userItem.created_at ? formatDate(userItem.created_at) : '-'}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <IconBtn dark={dark} title="Detail" onClick={() => onDetail(userItem)}>
                        <Eye className="h-4 w-4 text-blue-500" />
                      </IconBtn>
                      <IconBtn
                        dark={dark}
                        title="Verifikasi"
                        onClick={() => onVerify?.(userItem)}
                        disabled={
                          userItem.role !== 'mahasiswa' ||
                          userItem.status === 'active' ||
                          verifyingId === userItem.id
                        }
                      >
                        <UserCheck className="h-4 w-4 text-emerald-500" />
                      </IconBtn>
                      <IconBtn dark={dark} title="Ubah" onClick={() => onEdit?.(userItem)}>
                        <UserPen className="h-4 w-4 text-amber-500" />
                      </IconBtn>
                      <IconBtn dark={dark} title="Hapus" onClick={() => onDelete(userItem)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </IconBtn>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-5 py-6 text-center opacity-60" colSpan={7}>
                  Pengguna tidak ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  );
}

function IconBtn({ children, title, dark, onClick, disabled = false }) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg p-1.5 transition ${
        dark ? 'hover:bg-white/10' : 'hover:bg-blue-100'
      } ${disabled ? 'cursor-not-allowed opacity-45 hover:bg-transparent' : ''}`}
    >
      {children}
    </button>
  );
}

function glass(dark, extra = '') {
  return `rounded-2xl border backdrop-blur-xl shadow-[0_8px_32px_-12px_rgba(2,8,40,0.25)] ${
    dark ? 'border-white/10 bg-white/4' : 'border-blue-200/50 bg-white/50 shadow-blue-500/5'
  } ${extra}`;
}
