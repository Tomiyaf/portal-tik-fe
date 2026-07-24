import { useEffect, useState } from 'react';
import { Check, Link, X } from 'lucide-react';
import { Modal } from '../users/Modal';
import { CCTV_TYPES, formatCctvType, normalizeCctvType } from '../../utils/cctv';

const emptyForm = {
  camera_name: '',
  path: '',
  stream_url: '',
  type: 'monitor',
};

export function CameraModal({ dark, open, camera, onClose, onSave }) {
  const isEdit = Boolean(camera);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      setForm({
        camera_name: camera?.camera_name || '',
        path: camera?.path || '',
        stream_url: camera?.stream_url || '',
        type: normalizeCctvType(camera?.type),
      });
      setError('');
    }, 0);

    return () => clearTimeout(timer);
  }, [camera, open]);

  if (!open) return null;

  const getPathError = (val) => {
    if (!val) return '';
    const hasSpace = /\s/.test(val);
    const hasOtherSymbol = /[^a-zA-Z0-9_\s]/.test(val);
    if (hasSpace && hasOtherSymbol) {
      return 'Tidak boleh ada spasi atau simbol selain _';
    }
    if (hasSpace) {
      return 'Tidak boleh ada spasi';
    }
    if (hasOtherSymbol) {
      return 'Tidak boleh ada simbol selain _';
    }
    return '';
  };

  const pathError = getPathError(form.path);
  const isFormInvalid = Boolean(pathError);

  const getInputClass = (hasError) =>
    `w-full rounded-xl border px-3 py-2 text-sm outline-none transition ${
      hasError
        ? dark
          ? 'border-red-500/70 bg-red-500/10 text-white placeholder:text-red-300/50'
          : 'border-red-500/70 bg-red-50/50 text-slate-900 placeholder:text-red-300'
        : dark
          ? 'border-white/10 bg-white/5 text-white placeholder:text-white/30'
          : 'border-slate-200 bg-white/90 text-slate-900 placeholder:text-slate-400'
    }`;

  const submit = async (event) => {
    event.preventDefault();
    if (isFormInvalid) return;
    setError('');
    setSubmitting(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err?.message || 'Gagal menyimpan kamera.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className={glass(dark, 'w-full max-w-md p-6')}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="tracking-tight">{isEdit ? 'Ubah Kamera' : 'Tambah Kamera'}</h2>
            <p className="text-sm opacity-60">
              {isEdit ? `${camera.camera_name}` : 'Tambah kamera baru ke sistem'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`grid h-8 w-8 place-items-center rounded-lg border ${
              dark ? 'border-white/10 bg-white/5' : 'border-slate-200/80 bg-white/85'
            }`}
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}

        <form onSubmit={submit} className="mt-5 space-y-4">
          <Field label="Camera Name">
            <input
              value={form.camera_name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, camera_name: event.target.value }))
              }
              placeholder="e.g. Main Gate Camera"
              className={getInputClass(false)}
              required
            />
          </Field>

          <Field label="Path" error={pathError}>
            <div className="relative">
              <input
                value={form.path}
                onChange={(event) => setForm((prev) => ({ ...prev, path: event.target.value }))}
                placeholder="e.g. gate1"
                className={getInputClass(Boolean(pathError))}
              />
            </div>
          </Field>

          <Field label="Stream URL">
            <div className="relative">
              <Link className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-40" />
              <input
                value={form.stream_url}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    stream_url: event.target.value.replace(/\s+/g, ''),
                  }))
                }
                placeholder="rtsp://user:password@ip_address:port/Streaming/Channels/102"
                className={`${getInputClass(false)} pl-8`}
                required
              />
            </div>
          </Field>

          <Field label="Tipe">
            <div className="grid grid-cols-2 gap-2">
              {CCTV_TYPES.map((type) => {
                const checked = form.type === type;

                return (
                  <label
                    key={type}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                      checked
                        ? dark
                          ? 'border-blue-400/60 bg-blue-500/15 text-blue-100'
                          : 'border-blue-500/60 bg-blue-50 text-blue-700'
                        : dark
                          ? 'border-white/10 bg-white/5 text-white/70 hover:bg-white/8'
                          : 'border-slate-200 bg-white/80 text-slate-700 hover:bg-blue-50/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={type}
                      checked={checked}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, type: event.target.value }))
                      }
                      className="h-4 w-4 accent-blue-600"
                    />
                    <span>{formatCctvType(type)}</span>
                  </label>
                );
              })}
            </div>
          </Field>

          <button
            type="submit"
            disabled={submitting || !form.camera_name.trim() || !form.stream_url.trim() || isFormInvalid}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm text-white shadow-lg shadow-blue-500/30 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Check className="h-4 w-4" />
            {submitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Kamera'}
          </button>
        </form>
      </div>
    </Modal>
  );
}

function Field({ label, children, error }) {
  return (
    <div className="flex flex-col gap-1 space-y-1 text-sm">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs uppercase tracking-widest opacity-60">{label}</span>
        {error ? (
          <span className="text-[11px] font-medium text-red-500 dark:text-red-400">{error}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function glass(dark, extra = '') {
  return `rounded-2xl border  ${
    dark
      ? 'border-white/10 bg-[#071230]/60 backdrop-blur-sm shadow-[0_18px_45px_-18px_rgba(15,23,42,0.35)]'
      : 'border-white/75 bg-white/50 backdrop-blur-sm shadow-[0_18px_45px_-18px_rgba(15,23,42,0.35)]'
  } ${extra}`;
}
