import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import { Layout } from './components/Layout';
import { ErrorNotice, Loading } from './components/States';
import { Login } from './features/auth/Login';
import { GoalList } from './features/goals/GoalList';
import { GoalForm } from './features/goals/GoalForm';
import { GoalDetail } from './features/goals/GoalDetail';
import { TemplateCatalog } from './features/templates/TemplateCatalog';
import type { Role } from './api';

function Protected({ role }: { role?: Role }) {
  const auth = useAuth();
  if (auth.loading) return <Loading>กำลังตรวจสอบบัญชี…</Loading>;
  if (auth.error) return <div className="standalone-state"><ErrorNotice message={auth.error} retry={() => void auth.refresh()} /></div>;
  if (!auth.user) return <Navigate to="/login" replace />;
  if (role && auth.user.role !== role) return <div className="standalone-state"><ErrorNotice message="บัญชีนี้ไม่มีสิทธิ์เปิดหน้านี้" /><a href="/">กลับหน้าหลัก</a></div>;
  return <Outlet />;
}
function Home() { const { user } = useAuth(); return <Navigate to={user?.role === 'PROGRAM_MANAGER' ? '/manager/templates' : '/goals'} replace />; }

function AppRoutes() {
  const auth = useAuth();
  return <Routes><Route path="/login" element={auth.loading ? <Loading /> : <Login />} /><Route element={<Protected />}><Route element={<Layout />}><Route index element={<Home />} />
    <Route element={<Protected role="PARTICIPANT" />}><Route path="goals" element={<GoalList />} /><Route path="goals/new" element={<GoalForm />} /><Route path="goals/:goalId" element={<GoalDetail />} /><Route path="templates" element={<TemplateCatalog />} /></Route>
    <Route element={<Protected role="PROGRAM_MANAGER" />}><Route path="manager/templates" element={<TemplateCatalog />} /></Route>
    <Route path="*" element={<div className="standalone-state"><h1>ไม่พบหน้าที่ต้องการ</h1><a href="/">กลับหน้าหลัก</a></div>} />
  </Route></Route></Routes>;
}
export function App() { return <BrowserRouter><AuthProvider><AppRoutes /></AuthProvider></BrowserRouter>; }
