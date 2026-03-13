const ADMIN_SESSION_KEY = "praavi_admin_session";

// Replace these with your own credentials.
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";

export const loginAdmin = (username: string, password: string) => {
  const isValid = username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
  if (isValid) {
    localStorage.setItem(ADMIN_SESSION_KEY, "true");
  }
  return isValid;
};

export const logoutAdmin = () => {
  localStorage.removeItem(ADMIN_SESSION_KEY);
};

export const isAdminAuthenticated = () =>
  typeof window !== "undefined" && localStorage.getItem(ADMIN_SESSION_KEY) === "true";
