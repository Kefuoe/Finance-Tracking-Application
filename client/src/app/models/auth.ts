export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  name: string;
  email: string;
}

// What we keep about the logged-in user on the client
export interface AuthUser {
  name: string;
  email: string;
}