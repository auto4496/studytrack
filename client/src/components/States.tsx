import type { ReactNode } from 'react';

export function Loading({ children = 'กำลังโหลดข้อมูล…' }: { children?: ReactNode }) {
  return <div className="state" role="status"><span className="spinner" />{children}</div>;
}
export function ErrorNotice({ message, retry }: { message: string; retry?: () => void }) {
  return <div className="notice notice-error" role="alert"><span>{message}</span>{retry && <button className="text-button" onClick={retry}>ลองใหม่</button>}</div>;
}
export function Empty({ title, children }: { title: string; children: ReactNode }) {
  return <section className="empty"><div className="empty-icon" aria-hidden="true">▤</div><h2>{title}</h2><div>{children}</div></section>;
}
