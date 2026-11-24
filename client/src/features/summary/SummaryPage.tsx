import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  api,
  displayDate,
  errorMessage,
  HttpError,
  type Collection,
  type Goal,
} from "../../api";
import { ErrorNotice, Loading } from "../../components/States";
import "./summary.css";

type Period = "current" | "previous" | "last7" | "custom";
type GoalContext = Pick<Goal, "id" | "status" | "startDate" | "endDate"> & {
  title: string;
};
type Totals = {
  eligibleGoalCount: number;
  eligibleGoalDays: number;
  eligibleDates: number;
  entryCount: number;
  achievedGoalDays: number;
  achievedDates: number;
  totalMinutes: number;
  targetMinutes: number;
  progressPercent: number | null;
};
type Summary = {
  evaluation: { today: string };
  range: { from: string; to: string; calendarDays: number };
  filter: { goal: GoalContext | null };
  totals: Totals;
  days: {
    date: string;
    totalMinutes: number;
    targetMinutes: number;
    progressPercent: number | null;
    achievedGoalCount: number;
  }[];
  goals: {
    goal: GoalContext;
    eligibleRange: { from: string; to: string };
    metrics: {
      eligibleDays: number;
      totalMinutes: number;
      targetMinutes: number;
      achievedDays: number;
      progressPercent: number | null;
    };
  }[];
  pagination: { page: number; pageSize: number; total: number };
};
type Query = { from?: string; to?: string; goalId: string; page: number };
type RequestResult =
  { key: string; data: Summary } | { key: string; error: unknown };
const defaultQuery: Query = { goalId: "", page: 1 };
const percent = (value: number | null) =>
  value === null ? "–" : `${value.toLocaleString("th-TH")}%`;

function shiftDate(date: string, amount: number) {
  const value = new Date(date);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

async function readGoalChoices(signal: AbortSignal) {
  const goals = new Map<string, Goal>();
  const pageSize = 100;
  for (let page = 1; ; page++) {
    const { data, meta } = await api<Collection<Goal>>(
      `/goals?page=${page}&pageSize=${pageSize}`,
      { signal },
    );
    for (const goal of data) goals.set(goal.id, goal);
    if (page * pageSize >= meta.total) return [...goals.values()];
  }
}

export function SummaryPage() {
  const [period, setPeriod] = useState<Period>("current");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [goalId, setGoalId] = useState("");
  const [applied, setApplied] = useState<Query>(defaultQuery);
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState<RequestResult | null>(null);
  const [today, setToday] = useState("");
  const [goalChoices, setGoalChoices] = useState<Goal[]>([]);
  const [goalError, setGoalError] = useState("");
  const form = useRef<HTMLFormElement>(null);

  const params = new URLSearchParams({ page: String(applied.page) });
  if (applied.goalId) params.set("goalId", applied.goalId);
  if (applied.from !== undefined) params.set("from", applied.from);
  if (applied.to !== undefined) params.set("to", applied.to);
  const query = params.toString();
  const requestKey = `${refresh}:${query}`;
  const current = result?.key === requestKey ? result : null;
  const summary = current && "data" in current ? current.data : null;
  const failure = current && "error" in current ? current.error : null;
  const fields = failure instanceof HttpError ? failure.fields : undefined;

  useEffect(() => {
    const controller = new AbortController();
    api<{ data: Summary }>(`/summary?${query}`, { signal: controller.signal })
      .then(({ data }) => {
        if (controller.signal.aborted) return;
        setToday(data.evaluation.today);
        setResult({ key: requestKey, data });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setResult({ key: requestKey, error });
      });
    return () => controller.abort();
  }, [query, requestKey]);

  useEffect(() => {
    const controller = new AbortController();
    setGoalError("");
    readGoalChoices(controller.signal)
      .then((goals) => {
        if (!controller.signal.aborted) setGoalChoices(goals);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setGoalError(errorMessage(error));
      });
    return () => controller.abort();
  }, [refresh]);

  useEffect(() => {
    const refreshOnFocus = () => setRefresh((value) => value + 1);
    window.addEventListener("focus", refreshOnFocus);
    return () => window.removeEventListener("focus", refreshOnFocus);
  }, []);

  useEffect(() => {
    if (fields)
      form.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus();
  }, [fields]);

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Query = { goalId, page: 1 };
    if (period === "custom") {
      next.from = from;
      next.to = to;
    } else if (period === "previous" || period === "last7") {
      if (!today) return;
      const daysSinceMonday = (new Date(today).getUTCDay() + 6) % 7;
      next.to =
        period === "last7" ? today : shiftDate(today, -daysSinceMonday - 1);
      next.from = shiftDate(next.to, -6);
    }
    setApplied(next);
    setRefresh((value) => value + 1);
  }

  function reset() {
    setPeriod("current");
    setGoalId("");
    setFrom("");
    setTo("");
    setApplied(defaultQuery);
    setRefresh((value) => value + 1);
  }

  return (
    <section className="summary-page">
      <header className="page-heading">
        <div>
          <h1>สรุปการอ่าน</h1>
          {today && (
            <p className="muted">วันที่ระบบ {displayDate(today)} · เวลาไทย</p>
          )}
        </div>
        <button
          className="button secondary"
          type="button"
          onClick={() => setRefresh((value) => value + 1)}
        >
          รีเฟรชผลสรุป
        </button>
      </header>
      <form ref={form} className="summary-filters" onSubmit={apply} noValidate>
        <label>
          ช่วงเวลา
          <select
            value={period}
            onChange={(event) => {
              const selected = event.target.value as Period;
              setPeriod(selected);
              if (selected === "custom") {
                setFrom((value) => value || summary?.range.from || today);
                setTo((value) => value || summary?.range.to || today);
              }
            }}
          >
            <option value="current">สัปดาห์นี้ถึงวันนี้</option>
            <option value="previous" disabled={!today}>
              สัปดาห์ที่แล้ว
            </option>
            <option value="last7" disabled={!today}>
              7 วันล่าสุด
            </option>
            <option value="custom">กำหนดช่วงเอง</option>
          </select>
        </label>
        {period === "custom" && (
          <>
            <label>
              วันเริ่ม
              <input
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                aria-invalid={Boolean(fields?.from)}
                aria-label="วันเริ่ม"
                aria-describedby="summary-from-error"
              />
              <small className="field-error" id="summary-from-error">
                {fields?.from}
              </small>
            </label>
            <label>
              วันสิ้นสุด
              <input
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                aria-invalid={Boolean(fields?.to)}
                aria-label="วันสิ้นสุด"
                aria-describedby="summary-to-error"
              />
              <small className="field-error" id="summary-to-error">
                {fields?.to}
              </small>
            </label>
          </>
        )}
        <label>
          เป้าหมาย
          <select
            value={goalId}
            onChange={(event) => setGoalId(event.target.value)}
          >
            <option value="">ทุกเป้าหมายของฉัน</option>
            {goalChoices.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.templateTitle} ·{" "}
                {goal.status === "ARCHIVED"
                  ? "ยุติแล้ว"
                  : goal.startDate > today
                    ? "ยังไม่เริ่ม"
                    : "กำลังอ่าน"}{" "}
                · {displayDate(goal.startDate)}
              </option>
            ))}
          </select>
        </label>
        <div className="summary-actions">
          <button className="button primary" type="submit">
            แสดงสรุป
          </button>
          <button className="button secondary" type="button" onClick={reset}>
            กลับไปสัปดาห์นี้
          </button>
        </div>
      </form>
      {goalError && (
        <ErrorNotice
          message={goalError}
          retry={() => setRefresh((value) => value + 1)}
        />
      )}
      {!current && <Loading>กำลังโหลดผลสรุป…</Loading>}
      {failure !== null && (
        <ErrorNotice
          message={errorMessage(failure)}
          retry={() => setRefresh((value) => value + 1)}
        />
      )}
      {summary && (
        <SummaryResults
          data={summary}
          onPage={(page) => setApplied({ ...applied, page })}
        />
      )}
    </section>
  );
}

function SummaryResults({
  data,
  onPage,
}: {
  data: Summary;
  onPage: (page: number) => void;
}) {
  const { range, totals, days, goals, pagination, filter } = data;
  return (
    <>
      <section className="summary-card" aria-label="ผลรวมตามช่วง">
        <h2>{filter.goal?.title ?? "ทุกเป้าหมายของฉัน"}</h2>
        <p className="muted">
          {displayDate(range.from)} – {displayDate(range.to)}
        </p>
        {filter.goal?.status === "ARCHIVED" && <p>เป้าหมายที่ยุติแล้ว</p>}
        {totals.eligibleGoalDays === 0 && (
          <p>
            ไม่มีวันอยู่ในช่วงของเป้าหมายที่เลือก จึงยังคำนวณเปอร์เซ็นต์ไม่ได้
          </p>
        )}
        <dl className="summary-metrics">
          <div>
            <dt>เวลาที่อ่าน / เป้าหมายรวม</dt>
            <dd>
              {totals.totalMinutes} / {totals.targetMinutes} นาที
            </dd>
          </div>
          <div>
            <dt>ความคืบหน้าตามเวลารวม</dt>
            <dd>{percent(totals.progressPercent)}</dd>
          </div>
          <div>
            <dt>จำนวนวันตามปฏิทินที่มีเป้าหมาย</dt>
            <dd>{totals.eligibleDates}</dd>
          </div>
          <div>
            <dt>วันที่มีอย่างน้อยหนึ่งเป้าหมายสำเร็จ</dt>
            <dd>{totals.achievedDates}</dd>
          </div>
          <div>
            <dt>วันรวมของทุกเป้าหมาย</dt>
            <dd>{totals.eligibleGoalDays}</dd>
          </div>
          <div>
            <dt>วันรวมที่ทำได้ตามเป้าหมาย</dt>
            <dd>{totals.achievedGoalDays}</dd>
          </div>
        </dl>
      </section>
      <section className="summary-card">
        <h2>รายวัน</h2>
        <table className="summary-days" aria-label="สรุปการอ่านรายวัน">
          <thead>
            <tr>
              <th scope="col">วันที่</th>
              <th scope="col">อ่าน / เป้าหมาย (นาที)</th>
              <th scope="col">ความคืบหน้า</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day.date}>
                <th scope="row">{displayDate(day.date)}</th>
                <td>
                  {day.totalMinutes} / {day.targetMinutes}
                </td>
                <td>{percent(day.progressPercent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="summary-card">
        <h2>รายเป้าหมาย</h2>
        {goals.length ? (
          <ul className="summary-goals">
            {goals.map(({ goal, metrics, eligibleRange }) => (
              <li key={goal.id}>
                <Link to={`/goals/${goal.id}`}>{goal.title}</Link>
                {goal.status === "ARCHIVED" && <small> · ยุติแล้ว</small>}
                <p className="muted">
                  {displayDate(eligibleRange.from)} –{" "}
                  {displayDate(eligibleRange.to)}
                </p>
                <p>
                  {metrics.totalMinutes} / {metrics.targetMinutes} นาที ·{" "}
                  {percent(metrics.progressPercent)}
                </p>
                <p>
                  ทำได้ตามเป้าหมาย {metrics.achievedDays} /{" "}
                  {metrics.eligibleDays} วัน
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p>ไม่มีเป้าหมายในหน้านี้</p>
        )}
        {pagination.total > pagination.pageSize && (
          <nav className="pagination" aria-label="หน้าสรุปรายเป้าหมาย">
            <button
              disabled={pagination.page === 1}
              onClick={() => onPage(pagination.page - 1)}
            >
              ก่อนหน้า
            </button>
            <span>หน้า {pagination.page}</span>
            <button
              disabled={
                pagination.page * pagination.pageSize >= pagination.total
              }
              onClick={() => onPage(pagination.page + 1)}
            >
              ถัดไป
            </button>
          </nav>
        )}
      </section>
    </>
  );
}
