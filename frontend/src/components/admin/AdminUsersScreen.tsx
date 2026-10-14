'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/ui/Icon';
import ConfirmModal from './ConfirmModal';
import { getAdminUsers, updateAdminUserStatus } from '@/services/adminOperationsService';
import type { AdminUserView, AdminUsersPageView } from '@/types/adminOperationsApi';

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('vi-VN').format(date);
}

function roleLabel(role: AdminUserView['role']): string {
  return role === 'admin' ? 'Quản trị viên' : role === 'staff' ? 'Nhân viên' : 'Du khách';
}

function statusLabel(status: AdminUserView['status']): string {
  return status === 'active' ? 'Hoạt động' : status === 'suspended' ? 'Tạm khóa' : 'Vô hiệu hóa';
}

export default function AdminUsersScreen() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [snapshot, setSnapshot] = useState<{ key: string; page: AdminUsersPageView | null; error: string | null } | null>(null);
  const [reload, setReload] = useState(0);
  const [selectedUser, setSelectedUser] = useState<AdminUserView | null>(null);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [sort, setSort] = useState<{ field: 'full_name' | 'created_at'; direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setCurrentPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const requestKey = [currentPage, pageSize, debouncedSearch, reload].join(':');

  useEffect(() => {
    const controller = new AbortController();
    getAdminUsers({ page: currentPage, pageSize, q: debouncedSearch }, controller.signal).then(result => {
      if (!controller.signal.aborted) setSnapshot({ key: requestKey, page: result.data, error: null });
    }).catch((cause: unknown) => {
      if (!controller.signal.aborted) setSnapshot({ key: requestKey, page: null, error: cause instanceof Error ? cause.message : 'Không thể tải danh sách người dùng.' });
    });
    return () => controller.abort();
  }, [currentPage, pageSize, debouncedSearch, reload, requestKey]);

  const current = snapshot?.key === requestKey && search.trim() === debouncedSearch ? snapshot : null;
  const page = current?.page ?? null;
  const loading = current === null;
  const loadError = current?.error ?? null;
  const totalPages = Math.max(1, Math.ceil((page?.total ?? 0) / pageSize));
  const displayedCount = page?.items.length ?? 0;
  const totalLabel = loading ? '…' : page ? page.total.toLocaleString('vi-VN') : '—';
  const sortedUsers = !page?.items || !sort ? page?.items ?? [] : [...page.items].sort((left, right) => {
      const comparison = sort.field === 'full_name'
        ? left.full_name.localeCompare(right.full_name, 'vi')
        : left.created_at.localeCompare(right.created_at);
      return sort.direction === 'asc' ? comparison : -comparison;
    });

  const cycleSort = (field: 'full_name' | 'created_at') => {
    setSort(current => current?.field !== field
      ? { field, direction: 'asc' }
      : current.direction === 'asc'
        ? { field, direction: 'desc' }
        : null);
  };

  const confirmStatusChange = async () => {
    if (!selectedUser || pendingUserId) return;
    const user = selectedUser;
    const status: AdminUserView['status'] = user.status === 'active' ? 'suspended' : 'active';
    setPendingUserId(user.id);
    setMutationError(null);
    try {
      await updateAdminUserStatus(user.id, status);
      setSelectedUser(null);
      setReload(value => value + 1);
    } catch (cause: unknown) {
      setMutationError(cause instanceof Error ? cause.message : 'Không thể cập nhật trạng thái tài khoản.');
    } finally {
      setPendingUserId(null);
    }
  };

  return (
    <div className="max-w-[1720px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-8 space-y-8">
      <header className="bg-warm-surface rounded-3xl p-6 sm:p-8 border border-[#0E1D4F]/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-2xl sm:text-3xl text-[#0E1D4F] font-bold">Quản lý Người dùng &amp; Phân quyền</h1>
          <p className="text-sm text-[#4B5875] mt-1">Danh sách tài khoản do máy chủ trả về, sắp xếp theo ngày tạo mới nhất.</p>
        </div>
        <button type="button" disabled={loading} onClick={() => setReload(value => value + 1)} className="min-h-11 rounded-xl border border-[#0E1D4F]/15 px-4 py-2.5 text-sm text-[#205BD6] font-semibold disabled:opacity-50">
          Tải lại
        </button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <div className="xl:col-span-1 bg-warm-surface rounded-2xl p-5 border border-[#0E1D4F]/10 shadow-xs">
          <span className="text-xs text-[#4B5875] font-semibold">Kết quả phù hợp</span>
          <p className="text-2xl font-bold text-[#0E1D4F] mt-1">{totalLabel}</p>
          <span className="text-[10px] text-[#4B5875]">{debouncedSearch ? 'Theo tên hoặc email' : 'Tổng tài khoản'}</span>
        </div>
      </div>

      <section className="bg-warm-surface rounded-3xl p-6 sm:p-8 border border-[#0E1D4F]/10 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative min-w-[240px] flex-1 sm:flex-initial">
            <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#4B5875]" />
            <input
              type="search"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Tìm tên hoặc email..."
              aria-label="Tìm người dùng theo tên hoặc email"
              className="min-h-11 w-full pl-9 pr-3 py-2 text-sm bg-warm-paper rounded-xl border border-[#0E1D4F]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#205BD6]"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-[#4B5875]">
            <label htmlFor="admin-user-page-size">Hiển thị mỗi trang:</label>
            <select
              id="admin-user-page-size"
              value={pageSize}
              onChange={event => { setPageSize(Number(event.target.value)); setCurrentPage(1); }}
              className="min-h-11 text-sm px-3 py-2 bg-warm-paper rounded-xl border border-[#0E1D4F]/10 text-[#0E1D4F] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#205BD6]"
            >
              {[5, 10, 20, 50].map(size => <option key={size} value={size}>{size}</option>)}
            </select>
          </div>
        </div>

        <p className="text-xs text-[#4B5875]">Sắp xếp chỉ áp dụng cho trang dữ liệu đang tải; mặc định theo thứ tự máy chủ.</p>

        {mutationError && <p role="alert" className="text-sm text-rose-700">{mutationError}</p>}
        {loadError && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-rose-50 p-4 text-sm text-rose-800"><span>{loadError}</span><button type="button" onClick={() => setReload(value => value + 1)} className="font-semibold underline">Thử lại</button></div>}

        <div className="xl:hidden space-y-3">
          <div className="flex flex-wrap gap-2" aria-label="Sắp xếp tài khoản trong trang hiện tại">
            <button type="button" onClick={() => cycleSort('full_name')} aria-pressed={sort?.field === 'full_name'} aria-label={'Sắp xếp theo họ và tên ' + (sort?.field === 'full_name' ? sort.direction === 'asc' ? 'tăng dần' : 'giảm dần' : 'mặc định')} className="min-h-11 rounded-xl border border-[#0E1D4F]/15 bg-warm-surface px-3 text-sm font-semibold text-[#0E1D4F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#205BD6]">
              Họ &amp; tên <span aria-hidden="true">{sort?.field === 'full_name' ? sort.direction === 'asc' ? '↑' : '↓' : '↕'}</span>
            </button>
            <button type="button" onClick={() => cycleSort('created_at')} aria-pressed={sort?.field === 'created_at'} aria-label={'Sắp xếp theo ngày tham gia ' + (sort?.field === 'created_at' ? sort.direction === 'asc' ? 'tăng dần' : 'giảm dần' : 'mặc định')} className="min-h-11 rounded-xl border border-[#0E1D4F]/15 bg-warm-surface px-3 text-sm font-semibold text-[#0E1D4F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#205BD6]">
              Ngày tham gia <span aria-hidden="true">{sort?.field === 'created_at' ? sort.direction === 'asc' ? '↑' : '↓' : '↕'}</span>
            </button>
          </div>
          {loading ? (
            <p role="status" className="rounded-2xl border border-[#0E1D4F]/10 bg-warm-paper p-6 text-center text-sm text-[#4B5875]">Đang tải danh sách người dùng…</p>
          ) : loadError ? (
            <p className="rounded-2xl border border-[#0E1D4F]/10 bg-warm-paper p-6 text-center text-sm text-[#4B5875]">Không thể hiển thị dữ liệu.</p>
          ) : !page?.items.length ? (
            <div className="rounded-2xl border border-dashed border-[#0E1D4F]/15 bg-warm-paper p-8 text-center">
              <Icon name="person_off" className="mx-auto size-8 text-[#4B5875]" />
              <p className="mt-2 text-sm font-semibold text-[#0E1D4F]">{debouncedSearch ? 'Không tìm thấy tài khoản phù hợp' : 'Chưa có tài khoản người dùng'}</p>
            </div>
          ) : sortedUsers.map(user => (
            <article key={user.id} className="rounded-2xl border border-[#0E1D4F]/10 bg-warm-surface p-4 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="break-words font-bold text-[#0E1D4F]">{user.full_name}</h3>
                  <p className="mt-1 break-all text-sm text-[#4B5875]">{user.email}</p>
                  <p className="mt-2 break-all font-mono text-[11px] text-[#4B5875]">{user.id}</p>
                </div>
                <span className={'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ' + (user.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800')}>{statusLabel(user.status)}</span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-[#0E1D4F]/10 pt-3 text-sm">
                <div><dt className="text-xs text-[#4B5875]">Vai trò</dt><dd className="mt-1 font-semibold text-[#0E1D4F]">{roleLabel(user.role)}</dd></div>
                <div><dt className="text-xs text-[#4B5875]">Ngày tham gia</dt><dd className="mt-1 font-semibold text-[#0E1D4F]">{formatDate(user.created_at)}</dd></div>
              </dl>
              <button type="button" disabled={pendingUserId === user.id} onClick={() => { setMutationError(null); setSelectedUser(user); }} className="mt-4 min-h-11 w-full rounded-xl border border-[#0E1D4F]/15 px-3 py-2 text-sm font-semibold text-[#205BD6] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#205BD6]">
                {user.status === 'active' ? 'Tạm khóa' : 'Kích hoạt'}
              </button>
            </article>
          ))}
        </div>

        <div className="hidden overflow-x-auto rounded-2xl border border-[#0E1D4F]/10 xl:block">
          <table className="w-full min-w-[900px] text-xs text-left text-[#4B5875]">
            <thead className="bg-warm-paper text-[#0E1D4F] font-bold uppercase tracking-wider text-[11px] border-b border-[#0E1D4F]/10">
              <tr>
                <th scope="col" className="p-3.5">Mã ID</th>
                <th scope="col" aria-sort={sort?.field === 'full_name' ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'} className="p-3.5">
                  <button type="button" onClick={() => cycleSort('full_name')} className="inline-flex min-h-11 items-center gap-1.5 font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#205BD6]">
                    Họ &amp; Tên <Icon name="swap_vert" className="size-3.5 text-[#205BD6]" />
                  </button>
                </th>
                <th scope="col" className="p-3.5">Email</th>
                <th scope="col" className="p-3.5">Vai trò</th>
                <th scope="col" className="p-3.5">Trạng thái</th>
                <th scope="col" aria-sort={sort?.field === 'created_at' ? (sort.direction === 'asc' ? 'ascending' : 'descending') : sort === null ? 'descending' : 'none'} className="p-3.5">
                  <button type="button" onClick={() => cycleSort('created_at')} className="inline-flex min-h-11 items-center gap-1.5 font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#205BD6]">
                    Ngày tham gia <Icon name="swap_vert" className="size-3.5 text-[#205BD6]" />
                  </button>
                </th>
                <th scope="col" className="p-3.5">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0E1D4F]/5">
              {loading ? (
                <tr><td colSpan={7} className="p-12 text-center text-[#4B5875]">Đang tải danh sách người dùng…</td></tr>
              ) : loadError ? (
                <tr><td colSpan={7} className="p-12 text-center text-[#4B5875]">Không thể hiển thị dữ liệu.</td></tr>
              ) : !page?.items.length ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-[#4B5875]">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Icon name="person_off" className="size-8 text-[#4B5875]" />
                      <p className="text-sm font-semibold text-[#0E1D4F]">{debouncedSearch ? 'Không tìm thấy tài khoản phù hợp' : 'Chưa có tài khoản người dùng'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedUsers.map(user => (
                  <tr key={user.id} className="hover:bg-warm-paper transition-colors">
                    <td className="p-3.5 font-mono text-[10px] text-[#4B5875]">{user.id}</td>
                    <td className="p-3.5 font-bold text-[#0E1D4F]">{user.full_name}</td>
                    <td className="p-3.5 text-[#4B5875]">{user.email}</td>
                    <td className="p-3.5"><span className={'inline-block px-2 py-0.5 rounded-md font-semibold text-[10px] ' + (user.role === 'admin' ? 'bg-purple-100 text-purple-800' : user.role === 'staff' ? 'bg-blue-100 text-blue-800' : 'bg-warm-paper text-[#0E1D4F]')}>{roleLabel(user.role)}</span></td>
                    <td className="p-3.5"><span className={'inline-block px-2 py-0.5 rounded-md font-medium text-[10px] ' + (user.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800')}>{statusLabel(user.status)}</span></td>
                    <td className="p-3.5">{formatDate(user.created_at)}</td>
                    <td className="p-3.5">
                      <button type="button" disabled={pendingUserId === user.id} onClick={() => { setMutationError(null); setSelectedUser(user); }} className="min-h-11 rounded-lg border border-[#0E1D4F]/15 px-3 py-2 font-semibold text-[#205BD6] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#205BD6]">
                        {user.status === 'active' ? 'Tạm khóa' : 'Kích hoạt'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <span className="text-xs text-[#4B5875]">
            Đang hiển thị <strong>{displayedCount}</strong> / {page?.total ?? '—'} người dùng (Trang {page?.page ?? currentPage}/{totalPages})
          </span>
          <div className="flex items-center gap-2">
            <button type="button" disabled={loading || currentPage <= 1} onClick={() => setCurrentPage(value => Math.max(1, value - 1))} className="min-h-11 rounded-xl border border-[#0E1D4F]/15 bg-warm-surface px-3 text-sm font-semibold text-[#0E1D4F] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-warm-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#205BD6]">Trước</button>
            <span className="text-xs font-semibold px-2">{page?.page ?? currentPage} / {totalPages}</span>
            <button type="button" disabled={loading || currentPage >= totalPages} onClick={() => setCurrentPage(value => Math.min(totalPages, value + 1))} className="min-h-11 rounded-xl border border-[#0E1D4F]/15 bg-warm-surface px-3 text-sm font-semibold text-[#0E1D4F] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-warm-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#205BD6]">Tiếp</button>
          </div>
        </div>
      </section>

      <ConfirmModal
        isOpen={Boolean(selectedUser)}
        title={selectedUser?.status === 'active' ? 'Tạm khóa tài khoản?' : 'Kích hoạt tài khoản?'}
        message={selectedUser?.status === 'active' ? 'Tài khoản sẽ không thể đăng nhập cho đến khi được kích hoạt lại.' : 'Tài khoản sẽ được phép đăng nhập trở lại.'}
        targetName={selectedUser?.full_name}
        confirmText={selectedUser?.status === 'active' ? 'Tạm khóa' : 'Kích hoạt'}
        confirmVariant={selectedUser?.status === 'active' ? 'danger' : 'primary'}
        onConfirm={() => { void confirmStatusChange(); }}
        onCancel={() => { if (!pendingUserId) setSelectedUser(null); }}
      />
    </div>
  );
}
