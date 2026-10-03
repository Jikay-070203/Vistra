'use client';

import React, { useState, useMemo } from 'react';
import Icon from '@/components/ui/Icon';

interface MockUser {
  id: string;
  fullName: string;
  email: string;
  avatarInitials: string;
  packageType: 'Free Explorer' | 'Pro Explorer' | 'Enterprise Agency';
  tripsCount: number;
  feedbackCount: number;
  joinDate: string;
  status: 'active' | 'suspended';
  lastActive: string;
}

const INITIAL_USERS: MockUser[] = [
  {
    id: 'USR-101',
    fullName: 'Vũ Song Toàn',
    email: 'toan.vu@vistra-travel.vn',
    avatarInitials: 'VT',
    packageType: 'Pro Explorer',
    tripsCount: 14,
    feedbackCount: 3,
    joinDate: '12/08/2026',
    status: 'active',
    lastActive: '10 phút trước',
  },
  {
    id: 'USR-102',
    fullName: 'Nguyễn Thị Minh An',
    email: 'minhan.nguyen@gmail.com',
    avatarInitials: 'MA',
    packageType: 'Free Explorer',
    tripsCount: 3,
    feedbackCount: 1,
    joinDate: '18/08/2026',
    status: 'active',
    lastActive: '2 giờ trước',
  },
  {
    id: 'USR-103',
    fullName: 'Lê Hoàng Nam',
    email: 'nam.le@saigon-escapes.com',
    avatarInitials: 'HN',
    packageType: 'Enterprise Agency',
    tripsCount: 42,
    feedbackCount: 5,
    joinDate: '01/09/2026',
    status: 'active',
    lastActive: 'Hôm qua',
  },
  {
    id: 'USR-104',
    fullName: 'Phạm Thu Trang',
    email: 'thutrang.dalat@gmail.com',
    avatarInitials: 'TT',
    packageType: 'Pro Explorer',
    tripsCount: 9,
    feedbackCount: 2,
    joinDate: '05/09/2026',
    status: 'active',
    lastActive: '15 phút trước',
  },
  {
    id: 'USR-105',
    fullName: 'Trần Quốc Bảo',
    email: 'bao.tran@hanoitourist.vn',
    avatarInitials: 'QB',
    packageType: 'Enterprise Agency',
    tripsCount: 28,
    feedbackCount: 4,
    joinDate: '11/09/2026',
    status: 'active',
    lastActive: '3 ngày trước',
  },
  {
    id: 'USR-106',
    fullName: 'Đặng Mai Phương',
    email: 'phuong.dang@outlook.com',
    avatarInitials: 'MP',
    packageType: 'Free Explorer',
    tripsCount: 2,
    feedbackCount: 0,
    joinDate: '15/09/2026',
    status: 'active',
    lastActive: '5 ngày trước',
  },
  {
    id: 'USR-107',
    fullName: 'Bùi Đức Trọng',
    email: 'trong.bui@viettraveler.vn',
    avatarInitials: 'DT',
    packageType: 'Pro Explorer',
    tripsCount: 11,
    feedbackCount: 1,
    joinDate: '20/09/2026',
    status: 'active',
    lastActive: '4 giờ trước',
  },
  {
    id: 'USR-108',
    fullName: 'Hoàng Yến Linh',
    email: 'yenlinh.hoang@gmail.com',
    avatarInitials: 'YL',
    packageType: 'Free Explorer',
    tripsCount: 1,
    feedbackCount: 1,
    joinDate: '22/09/2026',
    status: 'suspended',
    lastActive: '12 ngày trước',
  },
  {
    id: 'USR-109',
    fullName: 'Ngô Thanh Tùng',
    email: 'tung.ngo@techtrek.io',
    avatarInitials: 'TT',
    packageType: 'Pro Explorer',
    tripsCount: 7,
    feedbackCount: 0,
    joinDate: '25/09/2026',
    status: 'active',
    lastActive: '1 giờ trước',
  },
  {
    id: 'USR-110',
    fullName: 'Đỗ Hà My',
    email: 'hamy.do@travelblogger.me',
    avatarInitials: 'HM',
    packageType: 'Pro Explorer',
    tripsCount: 19,
    feedbackCount: 3,
    joinDate: '28/09/2026',
    status: 'active',
    lastActive: '30 phút trước',
  },
];

// Monthly user growth data
const GROWTH_DATA = [
  { month: 'T1', count: 120 },
  { month: 'T2', count: 180 },
  { month: 'T3', count: 240 },
  { month: 'T4', count: 310 },
  { month: 'T5', count: 420 },
  { month: 'T6', count: 680 },
  { month: 'T7', count: 950 },
  { month: 'T8', count: 1420 },
  { month: 'T9', count: 2150 },
  { month: 'T10', count: 2840 },
];

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<MockUser[]>(INITIAL_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [packageFilter, setPackageFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<MockUser | null>(null);

  const PAGE_SIZE = 6;

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchQuery =
        u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchPackage =
        packageFilter === 'all' || u.packageType === packageFilter;

      const matchStatus =
        statusFilter === 'all' || u.status === statusFilter;

      return matchQuery && matchPackage && matchStatus;
    });
  }, [users, searchQuery, packageFilter, statusFilter]);

  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE) || 1;
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleToggleStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextStatus = u.status === 'active' ? 'suspended' : 'active';
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  return (
    <div className="max-w-[1720px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#0E1D4F]/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-label-caps text-xs text-[#205BD6] uppercase font-bold tracking-wider">
              QUẢN TRỊ THÀNH VIÊN VÀ DU KHÁCH
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#08B3C6]"></span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#0E1D4F]/10 text-[#0E1D4F] font-semibold">
              SANDBOX DIRECTORY
            </span>
          </div>
          <h2 className="font-headline-lg text-2xl sm:text-3xl text-[#0E1D4F] font-bold">
            Danh sách Người dùng &amp; Hồ sơ Cá nhân hóa
          </h2>
          <p className="text-xs sm:text-sm text-[#4B5875] mt-1 max-w-2xl leading-relaxed">
            Tra cứu, phân loại tài khoản theo gói dịch vụ, giám sát số chuyến đi đã tạo và điều chỉnh quyền truy cập trong môi trường demo.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-[#EBF1F0]/50 p-4 rounded-2xl border border-[#0E1D4F]/5">
          <div className="text-center px-2">
            <div className="text-2xl font-bold text-[#0E1D4F]">2,840</div>
            <div className="text-[11px] text-[#4B5875]">Tổng tài khoản</div>
          </div>
          <div className="w-px h-8 bg-[#0E1D4F]/10"></div>
          <div className="text-center px-2">
            <div className="text-2xl font-bold text-emerald-600">2,385</div>
            <div className="text-[11px] text-[#4B5875]">Hoạt động 30 ngày</div>
          </div>
          <div className="w-px h-8 bg-[#0E1D4F]/10"></div>
          <div className="text-center px-2">
            <div className="text-2xl font-bold text-[#205BD6]">412</div>
            <div className="text-[11px] text-[#4B5875]">Gói Pro Explorer</div>
          </div>
        </div>
      </div>

      {/* User Growth Chart & Quick Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-7 border border-[#0E1D4F]/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#0E1D4F]/10 pb-4">
            <div>
              <h3 className="font-headline-sm text-base text-[#0E1D4F] font-bold">
                Tốc độ Tăng trưởng Người dùng Lũy kế (Năm 2026)
              </h3>
              <p className="text-xs text-[#4B5875] mt-0.5">
                Quy mô người dùng tăng mạnh từ tháng 8 khi kích hoạt tính năng Vi khí hậu &amp; Travel DNA.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
              +18.4% Tháng 10
            </span>
          </div>

          <div className="pt-2">
            <div className="h-32 flex items-end justify-between gap-2 px-1">
              {GROWTH_DATA.map((item, idx) => {
                const heightPercent = Math.max(12, Math.round((item.count / 2840) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 px-2 py-0.5 rounded bg-[#0E1D4F] text-white text-[10px] whitespace-nowrap pointer-events-none z-10">
                      {item.count} người
                    </div>
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-[#205BD6] to-[#08B3C6] opacity-80 group-hover:opacity-100 transition-all duration-300"
                      style={{ height: `${heightPercent}%` }}
                    ></div>
                    <span className="text-[10px] text-[#4B5875] font-mono">{item.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-7 border border-[#0E1D4F]/10 shadow-sm space-y-4">
          <h3 className="font-headline-sm text-base text-[#0E1D4F] font-bold">
            Cơ cấu Hạng Thành viên
          </h3>
          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-[#0E1D4F]">Free Explorer</span>
                <span className="font-bold text-[#4B5875]">2,342 (82.5%)</span>
              </div>
              <div className="w-full bg-[#0E1D4F]/10 h-2 rounded-full overflow-hidden">
                <div className="bg-[#4B5875] h-full rounded-full" style={{ width: '82.5%' }}></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-[#205BD6]">Pro Explorer</span>
                <span className="font-bold text-[#205BD6]">412 (14.5%)</span>
              </div>
              <div className="w-full bg-[#0E1D4F]/10 h-2 rounded-full overflow-hidden">
                <div className="bg-[#205BD6] h-full rounded-full" style={{ width: '14.5%' }}></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-[#08B3C6]">Enterprise Agency</span>
                <span className="font-bold text-[#08B3C6]">86 (3.0%)</span>
              </div>
              <div className="w-full bg-[#0E1D4F]/10 h-2 rounded-full overflow-hidden">
                <div className="bg-[#08B3C6] h-full rounded-full" style={{ width: '3%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#0E1D4F]/10 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-96 relative">
          <Icon name="search" className="size-4 text-[#4B5875] absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm theo tên, email hoặc mã USR..."
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-[#0E1D4F]/15 focus:outline-none focus:border-[#205BD6] text-[#0E1D4F]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          {/* Package Filter */}
          <div className="flex items-center gap-1.5 text-xs text-[#4B5875]">
            <span>Gói:</span>
            <select
              value={packageFilter}
              onChange={(e) => {
                setPackageFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs px-3 py-2 rounded-xl bg-[#EBF1F0] border border-[#0E1D4F]/10 text-[#0E1D4F]"
            >
              <option value="all">Tất cả gói</option>
              <option value="Free Explorer">Free Explorer</option>
              <option value="Pro Explorer">Pro Explorer</option>
              <option value="Enterprise Agency">Enterprise Agency</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-[#4B5875]">
            <span>Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs px-3 py-2 rounded-xl bg-[#EBF1F0] border border-[#0E1D4F]/10 text-[#0E1D4F]"
            >
              <option value="all">Tất cả</option>
              <option value="active">Hoạt động</option>
              <option value="suspended">Tạm khóa</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-[#0E1D4F]/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#EBF1F0] text-[#0E1D4F] border-b border-[#0E1D4F]/10 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Du khách / Thành viên</th>
                <th className="py-3.5 px-4">Gói dịch vụ</th>
                <th className="py-3.5 px-4 text-center">Hành trình</th>
                <th className="py-3.5 px-4 text-center">Phản hồi</th>
                <th className="py-3.5 px-4">Ngày tham gia</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0E1D4F]/5">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#4B5875]">
                    Không tìm thấy người dùng phù hợp với tiêu chí lọc.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[#EBF1F0]/40 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#205BD6] to-[#08B3C6] text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {user.avatarInitials}
                        </div>
                        <div>
                          <div className="font-bold text-[#0E1D4F]">{user.fullName}</div>
                          <div className="text-[11px] text-[#4B5875] flex items-center gap-1.5">
                            <span>{user.email}</span>
                            <span>•</span>
                            <span className="font-mono">{user.id}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          user.packageType === 'Enterprise Agency'
                            ? 'bg-[#08B3C6]/15 text-[#08B3C6] border border-[#08B3C6]/30'
                            : user.packageType === 'Pro Explorer'
                            ? 'bg-[#205BD6]/15 text-[#205BD6] border border-[#205BD6]/30'
                            : 'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}
                      >
                        {user.packageType}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-[#0E1D4F]">
                      {user.tripsCount}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-md bg-[#EBF1F0] font-semibold text-[#0E1D4F]">
                        {user.feedbackCount}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-[#4B5875]">
                      <div>{user.joinDate}</div>
                      <div className="text-[10px] text-[#4B5875]/70">{user.lastActive}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          user.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'
                          }`}
                        ></span>
                        <span>{user.status === 'active' ? 'Hoạt động' : 'Tạm khóa'}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedUser(user)}
                          className="px-2.5 py-1 rounded-lg bg-[#EBF1F0] hover:bg-white text-[#0E1D4F] border border-[#0E1D4F]/10 font-semibold text-[11px] transition-colors cursor-pointer"
                        >
                          Chi tiết
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user.id)}
                          className={`px-2.5 py-1 rounded-lg border font-semibold text-[11px] transition-colors cursor-pointer ${
                            user.status === 'active'
                              ? 'bg-white hover:bg-red-50 text-red-600 border-red-200'
                              : 'bg-white hover:bg-emerald-50 text-emerald-600 border-emerald-200'
                          }`}
                        >
                          {user.status === 'active' ? 'Khóa' : 'Mở'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-[#EBF1F0]/50 border-t border-[#0E1D4F]/10 flex items-center justify-between text-xs text-[#4B5875]">
          <div>
            Hiển thị {paginatedUsers.length} / {filteredUsers.length} người dùng (Tổng số: {users.length})
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg bg-white border border-[#0E1D4F]/10 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EBF1F0] font-semibold text-[#0E1D4F] cursor-pointer"
            >
              Trước
            </button>
            <span className="font-semibold text-[#0E1D4F]">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg bg-white border border-[#0E1D4F]/10 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EBF1F0] font-semibold text-[#0E1D4F] cursor-pointer"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {/* User Detail Dialog Modal */}
      {selectedUser && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedUser(null);
          }}
        >
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl border border-[#0E1D4F]/10 overflow-hidden flex flex-col">
            <div className="p-5 bg-[#EBF1F0] border-b border-[#0E1D4F]/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#205BD6] to-[#08B3C6] text-white flex items-center justify-center font-bold text-sm">
                  {selectedUser.avatarInitials}
                </div>
                <div>
                  <h3 className="font-headline-sm text-base text-[#0E1D4F] font-bold">
                    {selectedUser.fullName}
                  </h3>
                  <span className="font-mono text-xs text-[#4B5875]">{selectedUser.id}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-[#0E1D4F] border border-[#0E1D4F]/10 cursor-pointer"
              >
                <Icon name="close" className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-4 bg-[#EBF1F0]/40 rounded-xl border border-[#0E1D4F]/5">
                <div>
                  <span className="text-[#4B5875] block">Email:</span>
                  <strong className="text-[#0E1D4F] break-all">{selectedUser.email}</strong>
                </div>
                <div>
                  <span className="text-[#4B5875] block">Gói dịch vụ:</span>
                  <strong className="text-[#205BD6]">{selectedUser.packageType}</strong>
                </div>
                <div>
                  <span className="text-[#4B5875] block">Kế hoạch đã tạo:</span>
                  <strong className="text-[#0E1D4F]">{selectedUser.tripsCount} chuyến đi</strong>
                </div>
                <div>
                  <span className="text-[#4B5875] block">Ý kiến đóng góp:</span>
                  <strong className="text-[#0E1D4F]">{selectedUser.feedbackCount} phản hồi</strong>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-[#0E1D4F] block">Ghi chú vận hành:</span>
                <p className="text-[#4B5875] leading-relaxed bg-[#EBF1F0]/20 p-3 rounded-xl border border-[#0E1D4F]/10">
                  Người dùng có chỉ số tương tác Travel DNA cao, thường xuyên sử dụng tính năng Vi khí hậu và săn mây buổi sáng. Tài khoản hợp lệ không có dấu hiệu spam.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 rounded-xl bg-[#205BD6] text-white font-semibold cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
