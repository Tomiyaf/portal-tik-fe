import { Camera, Maximize2, Settings, Trash2, WifiOff } from 'lucide-react';
import { motion } from 'motion/react';
import { glass } from '../../utils/glass';
import { buildCctvFeedUrl } from '../../utils/cctv';
import { CCTVFeedFrame } from './CCTVFeedFrame';

export function CameraFeedCard({ camera, dark, onEdit, onDelete, onFullscreen, canManage = true }) {
  const feedUrl = buildCctvFeedUrl(camera);
  const canPreview = Boolean(feedUrl);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.22 }}
      className={glass(dark, 'group overflow-hidden')}
    >
      <div
        className="relative aspect-video w-full cursor-pointer overflow-hidden"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${camera._gradient[0]}, ${camera._gradient[1]})`,
        }}
        onClick={() => canPreview && onFullscreen(camera)}
      >
        {canPreview ? (
          <CCTVFeedFrame
            title={`CCTV ${camera.camera_name}`}
            src={feedUrl}
            className="pointer-events-none"
            interactive={false}
          />
        ) : null}

        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 4px)',
          }}
        />

        {!canPreview ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/15">
            <WifiOff className="h-8 w-8 text-white/35" />
            <span className="text-xs uppercase tracking-widest text-white/40">
              Feed Belum Diatur
            </span>
          </div>
        ) : null}

        <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          {canPreview ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onFullscreen(camera);
              }}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/30"
              title="Fullscreen"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          ) : null}
          {canManage ? (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit(camera);
                }}
                className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/30"
                title="Ubah"
              >
                <Settings className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(camera);
                }}
                className="grid h-9 w-9 place-items-center rounded-full bg-red-500/30 text-red-200 backdrop-blur transition hover:bg-red-500/50"
                title="Hapus"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div
        className={`flex items-center justify-between px-4 py-2.5 ${
          dark ? 'border-t border-white/5' : 'border-t border-blue-100/60'
        }`}
      >
        <div className="flex min-w-0 items-center gap-2">
          <Camera className="h-3.5 w-3.5 shrink-0 text-blue-400" />
          <div className="min-w-0">
            <p className="truncate text-xs font-medium leading-tight">{camera.camera_name}</p>
            <p
              className={`mt-0.5 truncate text-[10px] ${dark ? 'text-white/35' : 'text-slate-400'}`}
            >
              {camera.path ? `${camera.path}` : '-'}
            </p>
          </div>
        </div>
        {/* <span
          className={`ml-3 flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${
            camera.type === 'intercom'
              ? 'bg-amber-500/20 text-amber-400'
              : 'bg-blue-500/20 text-blue-400'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              camera.type === 'intercom' ? 'bg-amber-400' : 'bg-blue-400'
            }`}
          />
          {formatCctvType(camera.type)}
        </span> */}
      </div>
    </motion.div>
  );
}
