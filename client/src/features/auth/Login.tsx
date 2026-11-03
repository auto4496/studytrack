import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { errorMessage, HttpError } from '../../api';
import { ErrorNotice } from '../../components/States';

export function Login() {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  if (auth.user) return <Navigate to={auth.user.role === 'PARTICIPANT' ? '/goals' : '/manager/templates'} replace />;
  async function submit(event: FormEvent) {
    event.preventDefault(); setPending(true); setError(''); setFields({});
    try { await auth.login(email, password); setPassword(''); }
    catch (e) { setError(errorMessage(e)); if (e instanceof HttpError) setFields(e.fields); }
    finally { setPending(false); }
  }
  return <main className="login-page"><section className="login-story"><a className="brand" href="/">StudyTrack<span className="brand-note">A LITTLE, EVERY DAY</span></a><div><p className="eyebrow">MAKE ROOM TO GROW</p><h1>ทุกหน้าที่อ่าน<br />พาคุณไปข้างหน้า</h1><p>ตั้งเป้าหมายเล็ก ๆ แล้วค่อย ๆ สร้าง<br />ความสม่ำเสมอในแบบของคุณ</p><div className="reading-art" aria-hidden="true"><span className="book book-one" /><span className="book book-two" /><span className="book book-three" /><span className="art-sun" /></div></div><small>YOUR PACE. YOUR PROGRESS.</small></section>
    <section className="login-form-panel"><div className="login-form-wrap"><p className="eyebrow">ยินดีต้อนรับกลับ</p><h2>เริ่มต้นเวลาอ่านของคุณ</h2><p className="muted">เข้าสู่ระบบเพื่อดูเป้าหมายและกิจกรรมส่วนตัว</p>{error && <ErrorNotice message={error} />}
      <form onSubmit={submit}><div className="field"><label htmlFor="email">อีเมล</label><input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={254} aria-invalid={!!fields.email} aria-describedby={fields.email ? 'email-error' : undefined} />{fields.email && <small id="email-error" className="field-error">{fields.email}</small>}</div>
      <div className="field"><label htmlFor="password">รหัสผ่าน</label><input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required maxLength={128} aria-invalid={!!fields.password} aria-describedby={fields.password ? 'password-error' : undefined} />{fields.password && <small id="password-error" className="field-error">{fields.password}</small>}</div>
      <button className="button primary full" disabled={pending}>{pending ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ →'}</button></form><p className="login-note">ใช้บัญชีที่ผู้ดูแลจัดเตรียมให้</p></div></section>
  </main>;
}
