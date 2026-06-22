import { X } from 'lucide-react';
import { motion } from 'motion/react';
import { glass } from '../../utils/glass';
import { buildCctvFeedUrl, truncateText } from '../../utils/cctv';
import { CCTVFeedFrame } from './CCTVFeedFrame';

export function FullscreenCCTVModal({ dark, camera, onClose }) {
  if (!camera) return null;

  const feedUrl = buildCctvFeedUrl(camera);
  const canPreview = Boolean(feedUrl);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden p-4 sm:p-6"
      style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.85)' }}
      onClick={onClose}
      role="dialog"
    >
      <motion.div
        initial={{ scale: 0.92 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className={glass(dark, 'w-full max-w-5xl overflow-hidden')}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="relative aspect-video w-full overflow-hidden"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${camera._gradient[0]}, ${camera._gradient[1]})`,
          }}
        >
          {canPreview ? (
            <CCTVFeedFrame title={`CCTV ${camera.camera_name}`} src={feedUrl} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-sm uppercase tracking-widest text-white/40">
              {feedUrl ? 'Feed Tidak Dapat Ditampilkan' : 'Feed Belum Diatur'}
            </div>
          )}

          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 4px)',
            }}
          />
          {canPreview ? (
            <motion.div
              className="absolute left-0 right-0 h-px bg-blue-400/30"
              animate={{ top: ['0%', '100%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />
          ) : null}

          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-white/20"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="absolute bottom-4 left-4 rounded-full bg-black/50 px-3 py-1.5 text-sm text-white/80 backdrop-blur">
            {truncateText(camera.camera_name, 72)}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
