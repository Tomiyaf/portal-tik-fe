import { Camera, Edit2, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { LoadingIndicator } from '../LoadingIndicator';
import { glass } from '../../utils/glass';
import { formatCctvType, truncateText } from '../../utils/cctv';
import { formatDate } from '../../utils/formatDate';

export function CCTVTable({ dark, cameras, loading, error, onEdit, onDelete }) {
  return (
    <div className={glass(dark, 'overflow-hidden')}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead
            className={dark ? 'bg-white/[0.03] text-slate-400' : 'bg-blue-50/60 text-blue-900/60'}
          >
            <tr className="text-[11px] uppercase tracking-wider">
              <th className="px-5 py-3 font-normal">Kamera</th>
              <th className="px-5 py-3 font-normal">Tipe</th>
              <th className="px-5 py-3 font-normal">Path</th>
              <th className="px-5 py-3 font-normal">Stream URL</th>
              <th className="px-5 py-3 font-normal">Dibuat</th>
              <th className="px-5 py-3 text-right font-normal">Aksi</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${dark ? 'divide-white/[0.04]' : 'divide-blue-100/60'}`}>
            {loading ? (
              <tr>
                <td className="px-5 py-6 text-center opacity-60" colSpan={6}>
                  <LoadingIndicator label="Memuat kamera..." className="justify-center" />
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td className="px-5 py-6 text-center text-red-500/90" colSpan={6}>
                  {error}
                </td>
              </tr>
            ) : cameras.length ? (
              <AnimatePresence initial={false}>
                {cameras.map((camera) => (
                  <motion.tr
                    key={camera.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`transition ${
                      dark ? 'hover:bg-white/[0.03]' : 'hover:bg-blue-50/40'
                    }`}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
                          style={{
                            background: `linear-gradient(135deg, ${camera._gradient[0]}, ${camera._gradient[1]})`,
                          }}
                        >
                          <Camera className="h-4 w-4 text-white/70" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{camera.camera_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${
                          camera.type === 'intercom'
                            ? 'bg-amber-500/20 text-amber-500'
                            : 'bg-blue-500/15 text-blue-500'
                        }`}
                      >
                        {/* <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          camera.type === 'intercom' ? 'bg-amber-400' : 'bg-blue-400'
                        }`}
                        /> */}
                        {formatCctvType(camera.type)}
                      </span>
                    </td>
                    <td className="px-5 py-3 opacity-70">
                      {/* <code
                        className={`rounded-md px-2 py-0.5 text-sm ${
                          dark ? 'bg-white/5 text-blue-300' : 'bg-blue-50 text-blue-700'
                        }`}
                      > */}
                      {camera.path || '-'}
                      {/* </code> */}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-mono text-sm opacity-60" title={camera.stream_url}>
                        {truncateText(camera.stream_url, 48)}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-sm tabular-nums opacity-50">
                      {formatDate(camera.created_at)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <IconButton dark={dark} title="Ubah" onClick={() => onEdit(camera)}>
                          <Edit2 className="h-4 w-4 text-blue-400" />
                        </IconButton>
                        <IconButton dark={dark} title="Hapus" onClick={() => onDelete(camera)}>
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </IconButton>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            ) : (
              <tr>
                <td className="px-5 py-12 text-center text-sm opacity-40" colSpan={6}>
                  Tidak ada kamera ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function IconButton({ children, dark, title, onClick }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded-lg p-1.5 transition ${dark ? 'hover:bg-white/10' : 'hover:bg-blue-100'}`}
    >
      {children}
    </button>
  );
}
