import API from "@/utils/api";

const AUTH_TOKEN_STORAGE_KEY = "synthovia-auth-token";
const AUTH_USER_STORAGE_KEY = "synthovia-auth-user";

export const getToken = () => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || "";
};

export const setToken = (token) => {
  if (typeof window === "undefined") return;
  if (!token) return;
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
};

export const clearToken = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
};

export const getUser = () => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setUser = (user) => {
  if (typeof window === "undefined") return;
  if (!user) return;
  localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
};

export const clearUser = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_USER_STORAGE_KEY);
};

export const isAuthenticated = () => !!getToken();

export const getAuthHeader = () => {
  const token = getToken();
  return token ? `Bearer ${token}` : "";
};

export const logout = () => {
  clearToken();
  clearUser();

  if (typeof window !== "undefined") {
    try {
      if (window.google?.accounts?.id?.disableAutoSelect) {
        window.google.accounts.id.disableAutoSelect();
      }
      if (window.google?.accounts?.id?.cancel) {
        window.google.accounts.id.cancel();
      }
    } catch {
      // ignore
    }
  }
};

export const login = async ({ email, password }) => {
  const response = await fetch(API.AUTH_LOGIN, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error((data && data.message) || "Login failed");
  }

  if (!data || data.status_code !== 1 || !data.token) {
    throw new Error((data && data.message) || "Login failed");
  }

  setToken(data.token);
  setUser(data.user);

  return data;
};

export const register = async ({
  first_name,
  last_name,
  email,
  password,
  password_confirmation,
}) => {
  const response = await fetch(API.AUTH_REGISTER, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      first_name,
      last_name,
      email,
      password,
      password_confirmation,
    }),
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error((data && data.message) || "Registration failed");
  }

  if (!data || data.status_code !== 1) {
    throw new Error((data && data.message) || "Registration failed");
  }

  if (!data.token) {
    throw new Error((data && data.message) || "Registration failed");
  }

  setToken(data.token);
  setUser(data.user);

  return data;
};

export const googleLogin = async ({ id_token }) => {
  const response = await fetch(API.AUTH_GOOGLE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ id_token }),
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error((data && data.message) || "Google login failed");
  }

  if (!data || data.status_code !== 1 || !data.token) {
    throw new Error((data && data.message) || "Google login failed");
  }

  setToken(data.token);
  setUser(data.user);

  return data;
};
