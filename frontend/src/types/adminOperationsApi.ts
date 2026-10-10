export interface AdminOverviewView {
  users: number;
  places: number;
  trips: number;
  feedback: number;
  updatedAt: string;
}

export interface AdminUserView {
  id: string;
  full_name: string;
  email: string;
  role: 'traveler' | 'staff' | 'admin';
  status: 'active' | 'suspended' | 'disabled';
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminUsersPageView {
  items: AdminUserView[];
  page: number;
  pageSize: number;
  total: number;
}

export interface AdminRevenueView {
  currency: string;
  total: number | null;
  mrr: number | null;
  items: [];
  available: boolean;
  message: string;
}
