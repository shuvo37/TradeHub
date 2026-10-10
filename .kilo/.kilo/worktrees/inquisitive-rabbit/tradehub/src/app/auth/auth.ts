export interface LoginFormData {
  uniqueName: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  password: string;
  confirmPassword: string;
  avatar: string;
  location: string;
  paymentNumber: string;
  email: string;
  phone: string;
  necessaryInfo: string;
}


export interface AuthResponse {
  id: string;
  name: string;
  uniqueName: string;
  avatar?: string | null;
  location?: string | null;
  paymentNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  necessaryInfo?: string | null;
  accessToken: string;
}
