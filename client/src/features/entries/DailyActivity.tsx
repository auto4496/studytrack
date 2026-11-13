import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  api,
  displayDate,
  errorMessage,
  HttpError,
  localToday,
} from "../../api";
import type { GoalActivityProps } from "../goals/GoalDetail";
import { ErrorNotice, Loading } from "../../components/States";

interface DailyProgress {
  goalId: string;
  date: string;
  actualMinutes: number;
  targetMinutes: number;
  progressPercent: number;
  achieved: boolean;
  entryId: string | null;
}
interface Entry {
  id: string;
  goalId: string;
  entryDate: string;
  minutes: number;
  targetMinutes: number;
  progressPercent: number;
  achieved: boolean;
}

export function DailyActivity({ goal, onSessionExpired }: GoalActivityProps) {
  const today = localToday();
  const maxDate = goal.endDate && goal.endDate < today ? goal.endDate : today;
  const future = goal.startDate > maxDate;
  const [date, setDate] = useState(maxDate);
  const [minutes, setMinutes] = useState("");
  const [progress, setProgress] = useState<DailyProgress | null>(null);
  const [loading, setLoading] = useState(!future);
  const [pending, setPending] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [retry, setRetry] = useState(0);
  const generation = useRef(0);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const current = ++generation.current;
    setProgress(null);
    setError("");
    setNotice("");
    setFields({});
    setMinutes("");
    setUncertain(false);
    if (future) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api<{ data: DailyProgress }>(`/goals/${goal.id}/progress?date=${date}`)
      .then((r) => {
        if (generation.current === current) setProgress(r.data);
      })
      .catch((e) => {
        if (generation.current === current) setError(errorMessage(e));
      })
      .finally(() => {
        if (generation.current === current) setLoading(false);
      });
    return () => {
      generation.current++;
    };
  }, [goal.id, date, retry, future]);
  useEffect(() => {
    form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [fields]);

  async function reconcile(selected: string, current: number) {
    setLoading(true);
    try {
      const result = await api<{ data: DailyProgress }>(
        `/goals/${goal.id}/progress?date=${selected}`,
      );
      if (generation.current !== current) return;
      setProgress(result.data);
      setUncertain(false);
      setError("");
      setNotice(
        result.data.entryId
          ? "พบรายการที่บันทึกแล้ว ข้อมูลเดิมยังอยู่ครบ"
          : "ตรวจแล้วว่ายังไม่มีรายการ คุณส่งบันทึกใหม่ได้",
      );
    } catch (e) {
      if (generation.current !== current) return;
      setUncertain(true);
      setError(`ยังตรวจสอบผลการบันทึกไม่ได้ ${errorMessage(e)}`);
    } finally {
      if (generation.current === current) setLoading(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending || uncertain || loading || !progress || progress.entryId)
      return;
    const invalid: Record<string, string> = {};
    if (!date || date < goal.startDate || date > maxDate)
      invalid.entryDate = "เลือกวันที่ในช่วงของเป้าหมาย ตามเวลาไทย";
    if (
      !minutes.trim() ||
      !Number.isInteger(Number(minutes)) ||
      Number(minutes) < goal.minMinutes ||
      Number(minutes) > goal.maxMinutes
    )
      invalid.minutes = `ระบุจำนวนเต็ม ${goal.minMinutes}–${goal.maxMinutes} นาที`;
    setFields(invalid);
    setError("");
    setNotice("");
    if (Object.keys(invalid).length) return;
    const selected = date,
      current = generation.current;
    setPending(true);
    try {
      const result = await api<{ data: Entry }>(`/goals/${goal.id}/entries`, {
        method: "POST",
        body: JSON.stringify({ entryDate: selected, minutes: Number(minutes) }),
      });
      if (generation.current !== current) return;
      const saved = result.data;
      setProgress({
        goalId: saved.goalId,
        date: saved.entryDate,
        actualMinutes: saved.minutes,
        targetMinutes: saved.targetMinutes,
        progressPercent: saved.progressPercent,
        achieved: saved.achieved,
        entryId: saved.id,
      });
      setNotice("บันทึกเวลาอ่านเรียบร้อยแล้ว");
    } catch (e) {
      if (generation.current !== current) return;
      if (e instanceof HttpError && e.status === 401) onSessionExpired?.();
      if (
        !(e instanceof HttpError) ||
        e.status >= 500 ||
        e.code === "ENTRY_ALREADY_EXISTS"
      ) {
        setUncertain(true);
        setNotice("กำลังตรวจรายการเดิมก่อนส่งซ้ำ");
        await reconcile(selected, current);
      } else {
        setError(errorMessage(e));
        if (e instanceof HttpError) setFields(e.fields);
      }
    } finally {
      if (generation.current === current) setPending(false);
    }
  }
  if (future) return null; // GoalDetail already shows the future-start notice.
  const saved = !!progress?.entryId;
  return (
    <section
      className="panel activity-panel"
      aria-labelledby="activity-heading"
    >
      <div className="activity-header">
        <div>
          <p className="eyebrow">EVERY MINUTE COUNTS</p>
          <h2 id="activity-heading">บันทึกการอ่าน</h2>
          <p className="muted">ติดตามเวลาที่ทำจริงในแต่ละวัน</p>
        </div>
        <div className="field">
          <label htmlFor="entry-date">วันที่บันทึก (เวลาไทย)</label>
          <input
            id="entry-date"
            type="date"
            min={goal.startDate}
            max={maxDate}
            value={date}
            onChange={(e) => {
              if (e.target.value) setDate(e.target.value);
            }}
            disabled={pending || uncertain}
            aria-invalid={!!(fields.entryDate || fields.date)}
            aria-describedby="entry-date-help entryDate-error"
          />
          <small id="entryDate-error" className="field-error">
            {fields.entryDate || fields.date}
          </small>
        </div>
      </div>
      <p id="entry-date-help" className="muted">
        ผลการอ่านแสดงตามวันที่เลือก หากต้องการดูบันทึกย้อนหลัง
        ให้เลือกวันที่ที่บันทึกไว้
      </p>
      {error && (
        <ErrorNotice
          message={error}
          retry={!uncertain ? () => setRetry((n) => n + 1) : undefined}
        />
      )}
      {notice && (
        <div className="notice" role="status">
          {notice}
        </div>
      )}
      {uncertain && (
        <div className="notice">
          <div>
            ยังไม่ทราบผลการส่ง กรุณาตรวจผลก่อนบันทึกซ้ำ{" "}
            <button
              type="button"
              className="text-button"
              disabled={pending || loading}
              onClick={() => void reconcile(date, generation.current)}
            >
              ตรวจสอบผลอีกครั้ง
            </button>
          </div>
        </div>
      )}
      {loading ? (
        <Loading>กำลังโหลดผลการอ่าน…</Loading>
      ) : (
        progress && (
          <>
            <div className="progress-summary">
              <div>
                <p className="muted">{displayDate(date)}</p>
                <p className="progress-amount" data-testid="progress-amount">
                  {progress.actualMinutes} / {progress.targetMinutes}{" "}
                  <span>นาที</span>
                </p>
              </div>
              <div className="progress-percent">
                <strong data-testid="progress-percent">
                  {progress.progressPercent}%
                </strong>
                <span className="pill">
                  {progress.achieved
                    ? "อ่านครบเป้าหมายแล้ว"
                    : saved
                      ? "ยังไม่ครบเป้าหมาย"
                      : "ยังไม่มีบันทึกสำหรับวันที่เลือก"}
                </span>
              </div>
            </div>
            <div
              className="progress-track"
              role="progressbar"
              aria-label="ความคืบหน้าการอ่าน"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.min(100, progress.progressPercent)}
              aria-valuetext={`${progress.progressPercent}%`}
            >
              <div
                style={{ width: `${Math.min(100, progress.progressPercent)}%` }}
              />
            </div>
            {saved ? (
              <p className="muted saved-reading">
                บันทึกแล้ว {progress.actualMinutes} นาทีสำหรับวันที่เลือก
              </p>
            ) : (
              <form
                ref={form}
                className="entry-form"
                onSubmit={submit}
                noValidate
              >
                <div className="field">
                  <label htmlFor="entry-minutes">เวลาที่อ่านจริง (นาที)</label>
                  <input
                    id="entry-minutes"
                    type="number"
                    inputMode="numeric"
                    min={goal.minMinutes}
                    max={goal.maxMinutes}
                    step="1"
                    required
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    disabled={pending}
                    aria-invalid={!!fields.minutes}
                    aria-describedby="minutes-error minutes-help"
                  />
                  <small id="minutes-error" className="field-error">
                    {fields.minutes}
                  </small>
                  <small id="minutes-help">
                    จำนวนเต็ม {goal.minMinutes}–{goal.maxMinutes} นาที
                    บันทึกได้วันละหนึ่งรายการต่อเป้าหมาย
                  </small>
                </div>
                <button
                  className="button primary"
                  disabled={pending || uncertain || loading}
                >
                  {pending ? "กำลังบันทึก…" : "บันทึกเวลา →"}
                </button>
              </form>
            )}
          </>
        )
      )}
    </section>
  );
}
