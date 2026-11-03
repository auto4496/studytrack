import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, errorMessage, HttpError, setCsrf, type User } from "../api";

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string;
  refresh(): Promise<void>;
  login(email: string, password: string): Promise<User>;
  logout(): Promise<void>;
}
const Context = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await api<{ data: { user: User } }>("/auth/me");
      setUser(result.data.user);
    } catch (e) {
      setUser(null);
      if (!(e instanceof HttpError && e.status === 401))
        setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void refresh();
    const clear = () => setUser(null);
    window.addEventListener("studytrack:unauthenticated", clear);
    return () =>
      window.removeEventListener("studytrack:unauthenticated", clear);
  }, []);
  const login = async (email: string, password: string) => {
    const result = await api<{ data: { user: User; csrfToken: string } }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
    );
    setCsrf(result.data.csrfToken);
    setUser(result.data.user);
    return result.data.user;
  };
  const logout = async () => {
    await api("/auth/logout", { method: "POST" });
    setCsrf(null);
    setUser(null);
  };
  return (
    <Context.Provider value={{ user, loading, error, refresh, login, logout }}>
      {children}
    </Context.Provider>
  );
}

export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error("AuthProvider required");
  return value;
}
