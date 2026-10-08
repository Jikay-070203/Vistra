'use client';

import React, { useState, useMemo } from 'react';
import Icon from '@/components/ui/Icon';
import MockBadge from './demo/MockBadge';
import { ADMIN_MOCK_USERS } from './demo/adminDemoData';

export default function AdminUsersScreen() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'traveler' | 'staff' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [sortField, setSortField] = useState<'fullName' | 'tripsCount' | 'joinedAt'>('joinedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pageSize, setPageSize] = useState<number>(5);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const filteredUsers = useMemo(() => {
    return ADMIN_MOCK_USERS.filter((user) => {
      const matchSearch =
        user.fullName.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === 'all' || user.role === roleFilter;
      const matchStatus = statusFilter === 'all' || user.status === statusFilter;
      return matchSearch && matchRole && matchStatus;
    }).sort((a, b) => {
      let comp = 0;
      if (sortField === 'fullName') comp = a.fullName.localeCompare(b.fullName, 'vi');
      else if (sortField === 'tripsCount') comp = a.tripsCount - b.tripsCount;
      else if (sortField === 'joinedAt') comp = a.joinedAt.localeCompare(b.joinedAt);
      return sortOrder === 'asc' ? comp : -comp;
    });
  }, [search, roleFilter, statusFilter, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const roleCounts = useMemo(() => {
    const total = ADMIN_MOCK_USERS.length;
    const travelers = ADMIN_MOCK_USERS.filter((u) => u.role === 'traveler').length;
    const staff = ADMIN_MOCK_USERS.filter((u) => u.role === 'staff').length;
    const admin = ADMIN_MOCK_USERS.filter((u) => u.role === 'admin').length;
    return { total, travelers, staff, admin };
  }, []);

  return (
    <div className="max-w-[1720px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-8 space-y-8">
      {/* Header */}
      <header className="bg-white rounded-3xl p-6 sm:p-8 border border-[#0E1D4F]/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-2xl sm:text-3xl text-[#0E1D4F] font-bold">
            Quản lý Người dùng &amp; Phân quyền
          </h1>
          <p className="text-sm text-[#4B5875] mt-1">
            Danh sách tài khoản thành viên, nhân viên điều phối và quản trị viên hệ thống VISTRA.
          </p>
        </div>
        <MockBadge />
      </header>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-[#0E1D4F]/10 shadow-xs">
          <span className="text-xs text-[#4B5875] font-semibold">Tổng tài khoản</span>
          <p className="text-2xl font-bold text-[#0E1D4F] mt-1">{roleCounts.total}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-[#0E1D4F]/10 shadow-xs">
          <span className="text-xs text-[#4B5875] font-semibold">Du khách (Travelers)</span>
          <p className="text-2xl font-bold text-[#205BD6] mt-1">{roleCounts.travelers}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-[#0E1D4F]/10 shadow-xs">
          <span className="text-xs text-[#4B5875] font-semibold">Nhân viên điều phối</span>
          <p className="text-2xl font-bold text-[#08B3C6] mt-1">{roleCounts.staff}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-[#0E1D4F]/10 shadow-xs">
          <span className="text-xs text-[#4B5875] font-semibold">Quản trị viên</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{roleCounts.admin}</p>
        </div>
      </div>

      {/* Main Table Section */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#0E1D4F]/10 shadow-sm space-y-6">
        {/* Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative min-w-[240px] flex-1 sm:flex-initial">
              <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#4B5875]" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Tìm tên hoặc email..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#EBF1F0] rounded-xl border border-[#0E1D4F]/10 focus:outline-none focus:border-[#205BD6]"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as typeof roleFilter);
                setCurrentPage(1);
              }}
              className="text-xs px-3 py-2 bg-[#EBF1F0] rounded-xl border border-[#0E1D4F]/10 text-[#0E1D4F] cursor-pointer"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="traveler">Du khách (Traveler)</option>
              <option value="staff">Nhân viên (Staff)</option>
              <option value="admin">Quản trị viên (Admin)</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as typeof statusFilter);
                setCurrentPage(1);
              }}
              className="text-xs px-3 py-2 bg-[#EBF1F0] rounded-xl border border-[#0E1D4F]/10 text-[#0E1D4F] cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="suspended">Tạm khóa</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#4B5875]">
            <span>Hiển thị mỗi trang:</span>
            {[5, 10, 20].map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => {
                  setPageSize(sz);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg border font-semibold cursor-pointer ${
                  pageSize === sz
                    ? 'bg-[#205BD6] text-white border-[#205BD6]'
                    : 'bg-white text-[#4B5875] border-[#0E1D4F]/10 hover:bg-[#EBF1F0]'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto rounded-2xl border border-[#0E1D4F]/10">
          <table className="w-full text-xs text-left text-[#4B5875]">
            <thead className="bg-[#EBF1F0]/70 text-[#0E1D4F] font-bold uppercase tracking-wider text-[11px] border-b border-[#0E1D4F]/10">
              <tr>
                <th className="p-3.5">Mã ID</th>
                <th className="p-3.5 cursor-pointer select-none" onClick={() => toggleSort('fullName')}>
                  <div className="flex items-center gap-1.5">
                    <span>Họ &amp; Tên</span>
                    <Icon name="swap_vert" className="size-3.5 text-[#205BD6]" />
                  </div>
                </th>
                <th className="p-3.5">Email</th>
                <th className="p-3.5">Vai trò</th>
                <th className="p-3.5">Trạng thái</th>
                <th className="p-3.5 text-center cursor-pointer select-none" onClick={() => toggleSort('tripsCount')}>
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Số chuyến</span>
                    <Icon name="swap_vert" className="size-3.5 text-[#205BD6]" />
                  </div>
                </th>
                <th className="p-3.5 cursor-pointer select-none" onClick={() => toggleSort('joinedAt')}>
                  <div className="flex items-center gap-1.5">
                    <span>Ngày tham gia</span>
                    <Icon name="swap_vert" className="size-3.5 text-[#205BD6]" />
                  </div>
                </th>
                <th className="p-3.5">Hoạt động gần nhất</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0E1D4F]/5">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#4B5875]">
                    Không tìm thấy người dùng phù hợp với bộ lọc tìm kiếm.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[#EBF1F0]/40 transition-colors">
                    <td className="p-3.5 font-mono text-[10px] text-[#4B5875]">{u.id}</td>
                    <td className="p-3.5 font-bold text-[#0E1D4F]">{u.fullName}</td>
                    <td className="p-3.5 text-[#4B5875]">{u.email}</td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'staff'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {u.role === 'admin' ? 'Quản trị viên' : u.role === 'staff' ? 'Nhân viên' : 'Du khách'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md font-medium text-[10px] ${
                          u.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {u.status === 'active' ? 'Hoạt động' : 'Tạm khóa'}
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-bold text-[#0E1D4F]">{u.tripsCount}</td>
                    <td className="p-3.5">{u.joinedAt}</td>
                    <td className="p-3.5">{u.lastActive}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <span className="text-xs text-[#4B5875]">
            Đang hiển thị <strong>{paginatedUsers.length}</strong> / {filteredUsers.length} người dùng (Trang{' '}
            {currentPage}/{totalPages})
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-xl border border-[#0E1D4F]/15 bg-white text-xs font-semibold text-[#0E1D4F] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EBF1F0] cursor-pointer"
            >
              Trước
            </button>
            <span className="text-xs font-semibold px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-xl border border-[#0E1D4F]/15 bg-white text-xs font-semibold text-[#0E1D4F] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EBF1F0] cursor-pointer"
            >
              Tiếp
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
