/**
 * Admin Authentication Service
 *
 * Provides a clean interface for Admin login and logout.
 * Currently dispatches requests to the internal Next.js server route handlers.
 * Can be seamlessly swapped to a real Backend login API in the future without changing UI components.
 */

export interface AdminLoginCredentials {
  email: string;
  password: string;
}

export interface AdminAuthResult {
  success: boolean;
  message?: string;
}

export async function loginAdmin(
  credentials: AdminLoginCredentials
): Promise<AdminAuthResult> {
  try {
    const response = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Đăng nhập không thành công.',
      };
    }

    return {
      success: true,
      message: data.message || 'Đăng nhập thành công.',
    };
  } catch {
    return {
      success: false,
      message: 'Không thể kết nối với dịch vụ xác thực máy chủ. Vui lòng thử lại sau.',
    };
  }
}

export async function logoutAdmin(): Promise<AdminAuthResult> {
  try {
    const response = await fetch('/api/admin/auth/logout', {
      method: 'POST',
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Đăng xuất không thành công.',
      };
    }

    return {
      success: true,
      message: data.message || 'Đã đăng xuất.',
    };
  } catch {
    return {
      success: false,
      message: 'Lỗi kết nối khi đăng xuất.',
    };
  }
}
