import { LayoutGrid, LayoutList, Search, X } from 'lucide-react';
import { glass } from '../../utils/glass';

const tabs = [
  { value: 'monitor', label: 'Monitor', icon: LayoutGrid },
  { value: 'manage', label: 'Kelola', icon: LayoutList },
];

export function CCTVToolbar({
  dark,
  tab,
  onTabChange,
  query,
  onQueryChange,
  layout,
  onLayoutChange,
  canManage = true,
}) {
  return (
    <div className={glass(dark, 'flex flex-wrap items-center gap-3 p-3')}>
      <div className={`flex rounded-xl p-0.5 ${dark ? 'bg-white/5' : 'bg-blue-100/60'}`}>
        {tabs.filter((item) => canManage || item.value === 'monitor').map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onTabChange(item.value)}
              className={`flex items-center gap-1.5 rounded-[10px] px-3.5 py-1.5 text-xs transition ${
                tab === item.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : dark
                    ? 'text-slate-300 hover:bg-white/5'
                    : 'text-blue-900/60 hover:bg-blue-100/50'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      <div
        className={`flex min-w-44 flex-1 items-center gap-2 rounded-xl border px-3 py-2 transition-all ${
          dark
            ? 'border-white/10 bg-white/5 focus-within:border-blue-400'
            : 'border-blue-200 bg-white/50 focus-within:border-blue-400 focus-within:bg-white'
        }`}
      >
        <Search className="h-3.5 w-3.5 shrink-0 opacity-40" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Cari nama, path, atau URL..."
          className={`w-full bg-transparent text-sm outline-none ${
            dark ? 'placeholder:text-white/30' : 'text-slate-800 placeholder:text-blue-900/40'
          }`}
        />
        {query ? (
          <button
            type="button"
            onClick={() => onQueryChange('')}
            className="opacity-40 transition hover:opacity-70"
            aria-label="Bersihkan pencarian"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {tab === 'monitor' ? (
        <div className="ml-auto flex items-center gap-1">
          {[2, 3, 4].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onLayoutChange(item)}
              className={`grid h-7 w-7 place-items-center rounded-lg text-xs transition ${
                layout === item
                  ? 'bg-blue-600 text-white'
                  : dark
                    ? 'bg-white/5 opacity-60 hover:bg-white/10'
                    : 'bg-blue-100/50 opacity-60 hover:bg-blue-100'
              }`}
              title={`${item} kolom`}
            >
              {item}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
