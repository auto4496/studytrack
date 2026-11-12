import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { errorMessage } from "../api";
import { ErrorNotice } from "./States";

export function Layout() {
  const { user, logout } = useAuth();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const onLogout = async () => {
    setPending(true);
    setError("");
    try {
      await logout();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  };
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" to="/">
          <span className="brand-mark" aria-hidden="true">
            S
          </span>
          <span>
            StudyTrack<span className="brand-note">A LITTLE, EVERY DAY</span>
          </span>
        </Link>
        <p className="nav-label">พื้นที่ของคุณ</p>
        <nav aria-label="เมนูหลัก">
          {user?.role === "PARTICIPANT" ? (
            <>
              <NavLink to="/goals">
                ◫ <span>เป้าหมายการอ่าน</span>
              </NavLink>
              <NavLink to="/templates">
                ▤ <span>กิจกรรมการอ่าน</span>
              </NavLink>
            </>
          ) : (
            <NavLink to="/manager/templates">
              ▤ <span>Activity Templates</span>
            </NavLink>
          )}
        </nav>
        <div className="sidebar-bottom">
          <span className="avatar">{user?.displayName.slice(0, 1)}</span>
          <div>
            <strong>{user?.displayName}</strong>
            <small>
              {user?.role === "PARTICIPANT" ? "นักศึกษา" : "Program Manager"}
            </small>
          </div>
          <button
            className="logout"
            onClick={onLogout}
            disabled={pending}
            aria-label="ออกจากระบบ"
          >
            {pending ? "…" : "↗"}
          </button>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <span>ติดตามการอ่านในแต่ละวัน</span>
          <span className="timezone">เวลาไทย · GMT+7</span>
        </header>
        {error && <ErrorNotice message={error} />}
        <Outlet />
      </main>
    </div>
  );
}
