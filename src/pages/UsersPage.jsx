import { useEffect, useMemo, useState } from 'react';
import { UserPlus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useUsers } from '../hooks/useUsers';
import { UsersFilters } from '../components/users/UsersFilters';
import { UsersTable } from '../components/users/UsersTable';
import { UserCreateModal } from '../components/users/UserCreateModal';
import { UserDetailModal } from '../components/users/UserDetailModal';
import { UserEditModal } from '../components/users/UserEditModal';
import { ConfirmDeleteModal } from '../components/users/ConfirmDeleteModal';

export default function UsersPage() {
  const { dark } = useTheme();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const {
    users,
    loading,
    error,
    pagination,
    setError,
    createUser,
    updateUser: saveUser,
    deleteUser,
    verifyUser: activateUser,
    fetchUserKtm,
  } = useUsers({
    page,
    role: role === 'all' ? undefined : role,
    status: status === 'all' ? undefined : status,
    search: debouncedQuery || undefined,
    perPage,
    sortOrder: 'desc',
  });

  const [showCreate, setShowCreate] = useState(false);
  const [detailUser, setDetailUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [verifyingId, setVerifyingId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError('');
    setDeleteLoading(true);
    try {
      await deleteUser(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err?.message || 'Gagal menghapus user.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const verifyUser = async (userItem) => {
    if (!userItem || userItem.role !== 'mahasiswa' || userItem.status === 'active') return;
    setError('');
    setVerifyingId(userItem.id);
    try {
      await activateUser(userItem.id);
    } catch (err) {
      setError(err?.message || 'Gagal verifikasi user.');
    } finally {
      setVerifyingId(null);
    }
  };

  const updateSelectedUser = async (userId, payload) => {
    await saveUser(userId, payload);
  };

  const perPageValue = pagination?.per_page ?? perPage;
  const totalCount = pagination?.total ?? users.length;
  const totalPages = Math.max(1, pagination?.last_page ?? Math.ceil(totalCount / perPageValue));
  const currentPage = pagination?.current_page ?? page;

  const pageNumbers = useMemo(() => {
    const windowSize = 5;
    const half = Math.floor(windowSize / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + windowSize - 1);
    if (end - start < windowSize - 1) {
      start = Math.max(1, end - windowSize + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm opacity-60">{totalCount} pengguna terdaftar</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm text-white shadow-lg shadow-blue-500/30"
        >
          <UserPlus className="h-4 w-4" /> Pengguna Baru
        </button>
      </div>

      <UsersFilters
        dark={dark}
        query={query}
        onQueryChange={(value) => {
          setQuery(value);
          setPage(1);
        }}
        role={role}
        onRoleChange={(value) => {
          setRole(value);
          setPage(1);
        }}
        status={status}
        onStatusChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
      />

      <UsersTable
        dark={dark}
        users={users}
        loading={loading}
        error={error}
        verifyingId={verifyingId}
        onDetail={(userItem) => setDetailUser(userItem)}
        onEdit={(userItem) => setEditUser(userItem)}
        onVerify={verifyUser}
        onDelete={(userItem) => setDeleteTarget(userItem)}
        footer={
          <div className="flex flex-col gap-3 border-t border-current/10 px-3 py-4 text-xs sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-5">
            <span className="opacity-60">
              Halaman {currentPage} dari {totalPages} · {totalCount} pengguna
            </span>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
              <label className="flex items-center gap-2 opacity-70">
                Per Halaman
                <select
                  value={String(perPage)}
                  onChange={(event) => {
                    setPerPage(Number(event.target.value));
                    setPage(1);
                  }}
                  className={`rounded-lg border px-2 py-1 outline-none ${
                    dark
                      ? 'border-white/10 bg-slate-900/70 text-slate-100'
                      : 'border-blue-200 bg-white/80 text-blue-900'
                  }`}
                >
                  <option value="10">10</option>
                  <option value="15">15</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </label>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <button
                  onClick={() => setPage(1)}
                  disabled={currentPage === 1}
                  className={paginationButton(dark)}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={paginationButton(dark)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {pageNumbers.map((num) => (
                  <button
                    key={num}
                    onClick={() => setPage(num)}
                    className={`rounded-lg px-2.5 py-1 ${
                      currentPage === num
                        ? 'bg-blue-600 text-white'
                        : dark
                          ? 'border border-white/10 text-white/70 hover:bg-white/5'
                          : 'border border-blue-200 text-blue-800 hover:bg-blue-50/50'
                    }`}
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={paginationButton(dark)}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className={paginationButton(dark)}
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        }
      />

      <UserCreateModal
        dark={dark}
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={async (payload) => {
          await createUser(payload);
        }}
      />

      <UserDetailModal
        dark={dark}
        open={Boolean(detailUser)}
        onClose={() => setDetailUser(null)}
        user={detailUser}
        fetchUserKtm={fetchUserKtm}
      />

      <UserEditModal
        dark={dark}
        open={Boolean(editUser)}
        onClose={() => setEditUser(null)}
        user={editUser}
        onUpdate={updateSelectedUser}
      />

      <ConfirmDeleteModal
        dark={dark}
        open={Boolean(deleteTarget)}
        user={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        error={deleteError}
      />
    </div>
  );
}

function paginationButton(dark) {
  return `rounded-lg border px-2.5 py-1 ${
    dark
      ? 'border-white/10 text-white/70 hover:bg-white/5'
      : 'border-blue-200 text-blue-800 hover:bg-blue-50/50'
  } disabled:cursor-not-allowed disabled:opacity-50`;
}
