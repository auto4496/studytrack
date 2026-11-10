import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  api,
  displayDate,
  errorMessage,
  type Collection,
  type Goal,
} from "../../api";
import { useAuth } from "../../auth/AuthProvider";
import { Empty, ErrorNotice, Loading } from "../../components/States";

export function GoalList() {
  const { user } = useAuth();
  const [result, setResult] = useState<Collection<Goal> | null>(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setError("");
    setResult(null);
    api<Collection<Goal>>(
      `/goals?page=${page}&pageSize=12${status ? `&status=${status}` : ""}`,
    )
      .then((data) => {
        if (active) setResult(data);
      })
      .catch((e) => {
        if (active) setError(errorMessage(e));
      });
    return () => {
      active = false;
    };
  }, [page, retry, status]);
  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">YOUR READING SPACE</p>
          <h1>เป้าหมายการอ่าน</h1>
          <p className="muted">
            สวัสดี {user?.displayName} วันนี้อยากอ่านเรื่องอะไร?
          </p>
        </div>
        <Link className="button primary" to="/goals/new">
          ＋ ตั้งเป้าหมายใหม่
        </Link>
      </section>
      <section className="welcome-card">
        <div>
          <span className="pill">ทีละนิด ทุกวัน</span>
          <h2>ให้เวลาสิ่งที่คุณอยากเรียนรู้</h2>
          <p>
            เลือกกิจกรรม กำหนดเวลาที่เหมาะกับคุณ
            <br />
            แล้วเริ่มต้นจากเป้าหมายเล็ก ๆ
          </p>
        </div>
        <div className="card-art" aria-hidden="true">
          ▥
          <span>
            KEEP
            <br />
            GROWING.
          </span>
        </div>
      </section>
      <div className="section-title">
        <h2>เป้าหมายของฉัน</h2>
        {result && <span>{result.meta.total} เป้าหมาย</span>}
      </div>
      <label className="catalog-filter">
        สถานะเป้าหมาย{" "}
        <select
          aria-label="สถานะเป้าหมาย"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">ทั้งหมด</option>
          <option value="ACTIVE">กำลังทำ</option>
          <option value="ARCHIVED">สิ้นสุดแล้ว</option>
        </select>
      </label>
      {error ? (
        <ErrorNotice message={error} retry={() => setRetry((n) => n + 1)} />
      ) : !result ? (
        <Loading />
      ) : result.data.length === 0 ? (
        <Empty title="เป้าหมายแรกเริ่มต้นได้วันนี้">
          <p>เลือกกิจกรรมที่สนใจ แล้วตั้งเวลาอ่านในแบบของคุณ</p>
          <Link className="button primary" to="/goals/new">
            ตั้งเป้าหมายแรก
          </Link>
        </Empty>
      ) : (
        <div className="goal-grid">
          {result.data.map((goal) => (
            <Link className="goal-card" to={`/goals/${goal.id}`} key={goal.id}>
              <div className="goal-card-top">
                <span className="goal-icon" aria-hidden="true">
                  ▤
                </span>
                <span
                  className={`status ${goal.status === "ARCHIVED" ? "muted" : ""}`}
                >
                  {goal.status === "ACTIVE" ? "กำลังทำ" : "สิ้นสุดแล้ว"}
                </span>
              </div>
              <h3>{goal.templateTitle}</h3>
              {goal.pendingTarget && (
                <p>
                  ตั้งแต่ {displayDate(goal.pendingTarget.effectiveFrom)}:{" "}
                  {goal.pendingTarget.targetMinutes} นาที
                </p>
              )}
              <div className="goal-number">
                {goal.targetMinutes}
                <span>นาที / วัน</span>
              </div>
              <footer>
                <span>เริ่ม {displayDate(goal.startDate)}</span>
                <span aria-hidden="true">↗</span>
              </footer>
            </Link>
          ))}
        </div>
      )}
      {result && result.meta.total > 12 && (
        <nav className="pagination" aria-label="หน้ารายการ">
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
