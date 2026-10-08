export interface AdminLoginCredentials {
  email: string;
  password: string;
}

/** Raw response returned by the existing same-origin Next.js auth routes. */
export interface AdminAuthResponse {
  success: boolean;
  message: string;
}

export interface AdminAuthResult extends AdminAuthResponse {
  httpStatus?: number;
}
