import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Camera, Plus } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useCCTV } from '../hooks/useCCTV';
import { useAuth } from '../contexts/useAuth';
import { canManageCctv } from '../lib/rbac';
import { CCTVToolbar } from '../components/cctv/CCTVToolbar';
import { CameraFeedCard } from '../components/cctv/CameraFeedCard';
import { CCTVTable } from '../components/cctv/CCTVTable';
import { CameraModal } from '../components/cctv/CameraModal';
import { DeleteCCTVModal } from '../components/cctv/DeleteCCTVModal';
import { FullscreenCCTVModal } from '../components/cctv/FullscreenCCTVModal';
import { glass } from '../utils/glass';

export default function CCTVPage() {
  const { dark } = useTheme();
  const { user } = useAuth();
  const { cameras, loading, error, createCamera, updateCamera, deleteCamera } = useCCTV();
  const canManage = canManageCctv(user);
  const [tab, setTab] = useState('monitor');
  const [layout, setLayout] = useState(3);
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(null);
  const [fullscreenCamera, setFullscreenCamera] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const filteredCameras = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return cameras;

    return cameras.filter((cameraItem) =>
      [cameraItem.camera_name, cameraItem.path, cameraItem.stream_url, cameraItem.type]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(needle)),
    );
  }, [cameras, query]);

  const gridCols =
    layout === 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : layout === 3
        ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
        : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4';

  const saveCamera = async (payload) => {
    if (modal?.type === 'edit') {
      return updateCamera(modal.camera.id, payload);
    }

    return createCamera(payload);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleteError('');
    setDeleteLoading(true);
    try {
      await deleteCamera(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err?.message || 'Gagal menghapus kamera.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm opacity-60">{cameras.length} kamera terdaftar</p>
          </div>
          {canManage ? (
            <button
              type="button"
              onClick={() => setModal({ type: 'add' })}
              className="flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm text-white shadow-lg shadow-blue-500/30 transition-shadow hover:shadow-blue-500/45"
            >
              <Plus className="h-4 w-4" />
              Tambah Kamera
            </button>
          ) : null}
        </div>

        <CCTVToolbar
          dark={dark}
          tab={canManage ? tab : 'monitor'}
          onTabChange={setTab}
          query={query}
          onQueryChange={setQuery}
          layout={layout}
          onLayoutChange={setLayout}
          canManage={canManage}
        />

        {tab === 'monitor' ? (
          <motion.div layout className={`grid gap-4 ${gridCols}`}>
            <AnimatePresence mode="popLayout">
              {!loading &&
                !error &&
                filteredCameras.map((cameraItem) => (
                    <CameraFeedCard
                      key={cameraItem.id}
                      camera={cameraItem}
                      dark={dark}
                      onEdit={(selected) => setModal({ type: 'edit', camera: selected })}
                      onDelete={setDeleteTarget}
                      onFullscreen={setFullscreenCamera}
                      canManage={canManage}
                    />

                ))}
            </AnimatePresence>

            {loading ? (
              <div className={glass(dark, 'col-span-full py-16 text-center text-sm opacity-60')}>
                Memuat kamera...
              </div>
            ) : null}

            {error ? (
              <div className={glass(dark, 'col-span-full py-16 text-center text-sm text-red-500')}>
                {error}
              </div>
            ) : null}

            {!loading && !error && filteredCameras.length === 0 ? (
              <div
                className={glass(
                  dark,
                  'col-span-full flex flex-col items-center gap-3 py-16 opacity-40',
                )}
              >
                <Camera className="h-10 w-10" />
                <p className="text-sm">Tidak ada kamera ditemukan.</p>
              </div>
            ) : null}
          </motion.div>
        ) : canManage ? (
          <CCTVTable
            dark={dark}
            cameras={filteredCameras}
            loading={loading}
            error={error}
            onEdit={(selected) => setModal({ type: 'edit', camera: selected })}
            onDelete={setDeleteTarget}
            canManage={canManage}
          />
        ) : (
          <motion.div layout className={`grid gap-4 ${gridCols}`}>
            <AnimatePresence mode="popLayout">
              {!loading &&
                !error &&
                filteredCameras.map((cameraItem) => (
                  <CameraFeedCard
                    key={cameraItem.id}
                    camera={cameraItem}
                    dark={dark}
                    onEdit={(selected) => setModal({ type: 'edit', camera: selected })}
                    onDelete={setDeleteTarget}
                    onFullscreen={setFullscreenCamera}
                    canManage={canManage}
                  />
                ))}
            </AnimatePresence>

            {loading ? (
              <div className={glass(dark, 'col-span-full py-16 text-center text-sm opacity-60')}>
                Memuat kamera...
              </div>
            ) : null}

            {error ? (
              <div className={glass(dark, 'col-span-full py-16 text-center text-sm text-red-500')}>
                {error}
              </div>
            ) : null}

            {!loading && !error && filteredCameras.length === 0 ? (
              <div
                className={glass(
                  dark,
                  'col-span-full flex flex-col items-center gap-3 py-16 opacity-40',
                )}
              >
                <Camera className="h-10 w-10" />
                <p className="text-sm">Tidak ada kamera ditemukan.</p>
              </div>
            ) : null}
          </motion.div>
        )}
      </div>

        <AnimatePresence>
          {canManage && modal ? (
            <CameraModal
              dark={dark}
              open={Boolean(modal)}
              camera={modal.type === 'edit' ? modal.camera : null}
              onClose={() => setModal(null)}
              onSave={saveCamera}
            />
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {canManage && deleteTarget ? (
            <DeleteCCTVModal
              dark={dark}
              open={Boolean(deleteTarget)}
              camera={deleteTarget}
              onClose={() => setDeleteTarget(null)}
              onConfirm={confirmDelete}
              loading={deleteLoading}
              error={deleteError}
            />
          ) : null}
        </AnimatePresence>


      <AnimatePresence>
        {fullscreenCamera ? (
          <FullscreenCCTVModal
            dark={dark}
            camera={fullscreenCamera}
            onClose={() => setFullscreenCamera(null)}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}
