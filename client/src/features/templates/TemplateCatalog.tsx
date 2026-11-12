import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, errorMessage, type Collection, type Template } from "../../api";
import { useAuth } from "../../auth/AuthProvider";
import { Empty, ErrorNotice, Loading } from "../../components/States";
import { TemplateLifecycle } from "./TemplateLifecycle";

export function TemplateCatalog() {
  const { user } = useAuth();
  const [result, setResult] = useState<Collection<Template> | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [includeInactive, setIncludeInactive] = useState(false);
  useEffect(() => {
    let active = true;
    setResult(null);
    setError("");
    api<Collection<Template>>(
      `/templates?page=${page}&pageSize=12${includeInactive && user?.role === "PROGRAM_MANAGER" ? "&includeInactive=true" : ""}`,
    )
      .then((r) => {
        if (active) setResult(r);
      })
      .catch((e) => {
        if (active) setError(errorMessage(e));
      });
    return () => {
      active = false;
    };
  }, [page, retry, includeInactive, user?.role]);
  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">FIND YOUR NEXT CHAPTER</p>
          <h1>
            {user?.role === "PROGRAM_MANAGER"
              ? "Activity Templates"
              : "กิจกรรมการอ่าน"}
          </h1>
          <p className="muted">
            {user?.role === "PROGRAM_MANAGER"
              ? "กิจกรรมที่เตรียมไว้สำหรับการตั้งเป้าหมาย"
              : "เลือกเรื่องที่สนใจ แล้วกำหนดเป้าหมายของคุณ"}
          </p>
        </div>
        {user?.role === "PROGRAM_MANAGER" && (
          <Link className="button primary" to="/manager/templates/new">
            ＋ สร้าง Template
          </Link>
        )}
      </section>
      {user?.role === "PROGRAM_MANAGER" && (
        <label className="catalog-filter">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => {
              setIncludeInactive(e.target.checked);
              setPage(1);
            }}
          />
          แสดงรายการที่ปิดใช้ด้วย
        </label>
      )}
      {error ? (
        <ErrorNotice message={error} retry={() => setRetry((n) => n + 1)} />
      ) : !result ? (
        <Loading />
      ) : !result.data.length ? (
        <Empty title="ยังไม่มี Template">
          <p>กิจกรรมที่พร้อมใช้จะแสดงที่นี่</p>
        </Empty>
      ) : (
        <div className="goal-grid">
          {result.data.map((t) => (
            <article className="goal-card" key={t.id}>
              <span className="goal-icon" aria-hidden="true">
                ▤
              </span>
              <h2>{t.title}</h2>
              {!t.isActive && <span className="pill">Inactive</span>}
              <p className="muted">{t.description}</p>
              <p>
                {t.minMinutes}–{t.maxMinutes} นาทีต่อวัน
              </p>
              {user?.role === "PARTICIPANT" && (
                <Link
                  className="button secondary"
                  to={`/goals/new?template=${t.id}`}
                >
                  ตั้งเป้าหมาย →
                </Link>
              )}
              {user?.role === "PROGRAM_MANAGER" && (
                <TemplateLifecycle
                  template={t}
                  onChanged={() => setRetry((v) => v + 1)}
                />
              )}
            </article>
          ))}
        </div>
      )}
      {result && result.meta.total > 12 && (
        <nav className="pagination" aria-label="หน้ากิจกรรม">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            ก่อนหน้า
          </button>
          <span>หน้า {page}</span>
          <button
            disabled={page * 12 >= result.meta.total}
            onClick={() => setPage(page + 1)}
          >
            ถัดไป
          </button>
        </nav>
      )}
    </>
  );
}
