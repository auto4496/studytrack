import { useEffect, useRef, useState, type FormEvent } from "react";
import { api, displayDate, errorMessage, HttpError } from "../../api";
import { ErrorNotice, Loading } from "../../components/States";
import type { GoalActivityProps } from "../goals/GoalDetail";

interface HistoryEntry {
  id: string;
  goalId: string;
  entryDate: string;
  minutes: number;
  targetMinutes: number;
  progressPercent: number;
  achieved: boolean;
  createdAt: string;
  updatedAt: string;
}
interface History {
  goalId: string;
  evaluatedAt: string;
  today: string;
  eligibleRange: { from: string; to: string | null };
  filter: { from: string | null; to: string | null };
  entries: HistoryEntry[];
  pagination: { page: number; pageSize: number; total: number };
  streak: {
    current: number;
    best: number;
    currentStartDate: string | null;
    currentEndDate: string | null;
    bestStartDate: string | null;
    bestEndDate: string | null;
  };
}
const runDates = (start: string | null, end: string | null) =>
  start && end
    ? `${displayDate(start)} – ${displayDate(end)}`
    : "ยังไม่มีวันที่อ่านครบเป้าหมาย";

export function ReadingHistory({
  goal,
  entriesRevision = 0,
  onEntriesChanged,
  onSessionExpired,
}: GoalActivityProps) {
  const [history, setHistory] = useState<History | null>(null);
  const [range, setRange] = useState({ from: "", to: "" });
  const [query, setQuery] = useState({ from: "", to: "", page: 1 });
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [writeError, setWriteError] = useState("");
  const [notice, setNotice] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [editor, setEditor] = useState<{
    entry: HistoryEntry;
    minutes: string;
  } | null>(null);
  const [pending, setPending] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const generation = useRef(0);
  const alive = useRef(true);
  const editorForm = useRef<HTMLFormElement>(null);
  const rangeForm = useRef<HTMLFormElement>(null);
  const busy = pending || uncertain;
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      generation.current++;
    };
  }, []);
  useEffect(() => {
    if (busy) return;
    const current = ++generation.current;
    const abort = new AbortController();
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      page: String(query.page),
      pageSize: "20",
    });
    if (query.from || query.to) {
      params.set("from", query.from);
      params.set("to", query.to);
    }
    api<{ data: History }>(`/goals/${goal.id}/history?${params}`, {
      signal: abort.signal,
    })
      .then((r) => {
        if (generation.current === current) setHistory(r.data);
      })
      .catch((e) => {
        if (generation.current !== current) return;
        setError(errorMessage(e));
        if (e instanceof HttpError) setFields(e.fields);
      })
      .finally(() => {
        if (generation.current === current) setLoading(false);
      });
    return () => {
      generation.current++;
      abort.abort();
    };
  }, [goal.id, query, refresh, entriesRevision, busy]);
  useEffect(() => {
    const focus = () => setRefresh((v) => v + 1);
    window.addEventListener("focus", focus);
    return () => window.removeEventListener("focus", focus);
  }, []);
  useEffect(() => {
    const form = fields.minutes ? editorForm.current : rangeForm.current;
    form?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [fields]);
  async function reconcile() {
    if (!editor) return;
    setPending(true);
    setWriteError("");
    try {
      const params = new URLSearchParams({
        from: editor.entry.entryDate,
        to: editor.entry.entryDate,
        page: "1",
      });
      const r = await api<{ data: History }>(
        `/goals/${goal.id}/history?${params}`,
      );
      if (!alive.current) return;
      const entry = r.data.entries.find((e) => e.id === editor.entry.id);
      setUncertain(false);
      setEditor(null);
      setFields({});
      setNotice(
        entry
          ? `ตรวจข้อมูลล่าสุดแล้ว: ${entry.minutes} นาที หากต้องการแก้อีกให้เปิดรายการใหม่ ผลนี้ไม่ยืนยันว่าเกิดจากคำขอใด`
          : "ไม่พบรายการเดิมในช่วงที่แก้ได้ กรุณาตรวจเป้าหมายอีกครั้ง",
      );
      onEntriesChanged?.();
      setRefresh((v) => v + 1);
    } catch (e) {
      if (!alive.current) return;
      if (e instanceof HttpError && e.status === 401) onSessionExpired?.();
      setUncertain(true);
      setWriteError(`ยังตรวจสอบผลไม่ได้ ${errorMessage(e)}`);
    } finally {
      if (alive.current) setPending(false);
    }
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!editor || busy || loading) return;
    const minutes = Number(editor.minutes);
    if (
      !editor.minutes.trim() ||
      !Number.isInteger(minutes) ||
      minutes < goal.minMinutes ||
      minutes > goal.maxMinutes
    ) {
      setFields({
        minutes: `ระบุจำนวนเต็ม ${goal.minMinutes}–${goal.maxMinutes} นาที`,
      });
      return;
    }
    setPending(true);
    setFields({});
    setWriteError("");
    setNotice("");
    try {
      await api<{ data: HistoryEntry }>(
        `/goals/${goal.id}/entries/${editor.entry.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ minutes }),
        },
      );
      if (!alive.current) return;
      setEditor(null);
      setNotice("แก้ไขเวลาอ่านเรียบร้อยแล้ว");
      onEntriesChanged?.();
      setRefresh((v) => v + 1);
    } catch (e) {
      if (!alive.current) return;
      if (e instanceof HttpError && e.status === 401) onSessionExpired?.();
      if (!(e instanceof HttpError) || e.status >= 500) {
        setUncertain(true);
        setNotice("ยังไม่ทราบผลการแก้ไข กำลังตรวจข้อมูลเดิมก่อนส่งใหม่");
        await reconcile();
      } else {
        setWriteError(errorMessage(e));
        if (e instanceof HttpError) setFields(e.fields);
      }
    } finally {
      if (alive.current) setPending(false);
    }
  }
  function apply(event: FormEvent) {
    event.preventDefault();
    if (busy || editor) return;
    const invalid: Record<string, string> = {};
    if (!range.from !== !range.to) {
      invalid.from = "ระบุวันเริ่มและวันสิ้นสุดให้ครบ";
      invalid.to = invalid.from;
    } else if (range.from && range.to && range.from > range.to) {
      invalid.from = "วันเริ่มต้องไม่อยู่หลังวันสิ้นสุด";
    }
    setFields(invalid);
    if (Object.keys(invalid).length) return;
    setQuery({ ...range, page: 1 });
  }
  return (
    <section className="panel history-panel" aria-labelledby="history-heading">
      <div className="activity-header">
        <div>
          <p className="eyebrow">YOUR READING JOURNEY</p>
          <h2 id="history-heading">ประวัติการอ่าน</h2>
          <p className="muted">
            เลือกเป้าหมายอื่นได้จากหน้าเป้าหมายของฉัน รวมเป้าหมายที่สิ้นสุดแล้ว
          </p>
        </div>
        <button
          className="button secondary"
          disabled={busy || loading}
          onClick={() => setRefresh((v) => v + 1)}
        >
          รีเฟรชประวัติ
        </button>
      </div>
      {history && (
        <p className="muted">
          ข้อมูล ณ {displayDate(history.today)} (เวลาไทย) ·
          สถิติวันต่อเนื่องครอบคลุมทั้งเป้าหมาย ไม่เปลี่ยนตามช่วงที่กรอง
        </p>
      )}
      {goal.status === "ARCHIVED" && (
        <p className="notice">
          แก้ไขเวลาของวันเดิมได้ถึงวันสิ้นสุด
          วันต่อเนื่องปัจจุบันอ้างอิงวันนี้หรือเมื่อวาน
          หากสิ้นสุดก่อนเมื่อวานจะแสดง 0 โดยสถิติดีที่สุดยังอยู่
        </p>
      )}
      <form
        ref={rangeForm}
        className="history-filter"
        onSubmit={apply}
        noValidate
      >
        {(["from", "to"] as const).map((key) => (
          <div className="field" key={key}>
            <label htmlFor={`history-${key}`}>
              {key === "from" ? "ประวัติตั้งแต่วันที่" : "ประวัติถึงวันที่"}
            </label>
            <input
              id={`history-${key}`}
              type="date"
              value={range[key]}
              min={history?.eligibleRange.from}
              max={history?.eligibleRange.to ?? undefined}
              disabled={busy || !!editor}
              aria-invalid={!!fields[key]}
              aria-describedby={`history-${key}-error`}
              onChange={(e) =>
                setRange((v) => ({ ...v, [key]: e.target.value }))
              }
            />
            <small id={`history-${key}-error`} className="field-error">
              {fields[key]}
            </small>
          </div>
        ))}
        <button className="button secondary" disabled={busy || !!editor}>
          ใช้ช่วงวันที่
        </button>
        <button
          type="button"
          className="text-button"
          disabled={busy || !!editor}
          onClick={() => {
            setRange({ from: "", to: "" });
            setFields({});
            setQuery({ from: "", to: "", page: 1 });
          }}
        >
          ดูทุกวัน
        </button>
      </form>
      {(error || writeError) && (
        <ErrorNotice
          message={error || writeError}
          retry={!busy ? () => setRefresh((v) => v + 1) : undefined}
        />
      )}
      {notice && (
        <div className="notice" role="status">
          {notice}
        </div>
      )}
      {uncertain && (
        <button
          className="button secondary"
          disabled={pending}
          onClick={() => void reconcile()}
        >
          ตรวจผลการแก้ไขอีกครั้ง
        </button>
      )}
      {editor && (
        <form
          ref={editorForm}
          className="history-editor"
          onSubmit={save}
          noValidate
        >
          <h3>แก้ไขเวลา {displayDate(editor.entry.entryDate)}</h3>
          <div className="field">
            <label htmlFor="history-minutes">เวลาอ่านที่แก้ไข (นาที)</label>
            <input
              id="history-minutes"
              type="number"
              inputMode="numeric"
              min={goal.minMinutes}
              max={goal.maxMinutes}
              step="1"
              value={editor.minutes}
              autoFocus
              disabled={busy}
              aria-invalid={!!fields.minutes}
              aria-describedby="history-minutes-error history-minutes-help"
              onChange={(e) =>
                setEditor((v) => v && { ...v, minutes: e.target.value })
              }
            />
            <small id="history-minutes-error" className="field-error">
              {fields.minutes}
            </small>
            <small id="history-minutes-help">
              แก้เฉพาะเวลา {goal.minMinutes}–{goal.maxMinutes} นาที
              วันที่และรายการเดิมคงอยู่
            </small>
          </div>
          <button className="button primary" disabled={busy || loading}>
            {pending ? "กำลังแก้ไข…" : "บันทึกการแก้ไข"}
          </button>
          <button
            type="button"
            className="text-button"
            disabled={busy}
            onClick={() => {
              setEditor(null);
              setFields({});
              setWriteError("");
            }}
          >
            ยกเลิกการแก้ไข
          </button>
        </form>
      )}
      {loading || busy ? (
        <Loading>กำลังตรวจประวัติและสถิติ…</Loading>
      ) : (
        !error &&
        history && (
          <>
            <div className="streak-grid" data-testid="history-streak">
              <div>
                <h3>วันต่อเนื่องปัจจุบัน</h3>
                <strong data-testid="streak-current">
                  {history.streak.current} วัน
                </strong>
                <p>
                  {runDates(
                    history.streak.currentStartDate,
                    history.streak.currentEndDate,
                  )}
                </p>
              </div>
              <div>
                <h3>วันต่อเนื่องดีที่สุด</h3>
                <strong data-testid="streak-best">
                  {history.streak.best} วัน
                </strong>
                <p>
                  {runDates(
                    history.streak.bestStartDate,
                    history.streak.bestEndDate,
                  )}
                </p>
              </div>
            </div>
            <p className="muted">
              อ่านครบเป้าหมายของวันนั้นจึงนับต่อเนื่อง
              วันที่ขาดหรือยังอ่านไม่ครบจะตัดช่วง
            </p>
            <p role="status">
              พบ {history.pagination.total} รายการ · หน้า{" "}
              {history.pagination.page}
            </p>
            {!history.entries.length ? (
              <p>
                {history.eligibleRange.to === null
                  ? "เป้าหมายยังไม่เริ่ม จึงยังไม่มีประวัติการอ่าน"
                  : "ไม่มีบันทึกในช่วงหรือหน้านี้"}
              </p>
            ) : (
              <ul className="history-rows">
                {history.entries.map((entry) => (
                  <li
                    key={entry.id}
                    data-testid={`history-row-${entry.entryDate}`}
                  >
                    <div>
                      <h3>{displayDate(entry.entryDate)}</h3>
                      <p>
                        {entry.minutes} / {entry.targetMinutes} นาที ·{" "}
                        {entry.progressPercent}%
                      </p>
                      <span className="pill">
                        {entry.achieved
                          ? "อ่านครบเป้าหมายแล้ว"
                          : "ยังไม่ครบเป้าหมาย"}
                      </span>
                    </div>
                    <button
                      className="button secondary"
                      disabled={!!editor}
                      aria-label={`แก้ไขเวลา ${entry.entryDate}`}
                      onClick={() => {
                        setEditor({ entry, minutes: String(entry.minutes) });
                        setFields({});
                        setNotice("");
                        setWriteError("");
                      }}
                    >
                      แก้ไขเวลา
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="history-pagination">
              <button
                className="button secondary"
                disabled={!!editor || query.page <= 1}
                onClick={() => setQuery((v) => ({ ...v, page: v.page - 1 }))}
              >
                ประวัติหน้าก่อน
              </button>
              <button
                className="button secondary"
                disabled={
                  !!editor || query.page * 20 >= history.pagination.total
                }
                onClick={() => setQuery((v) => ({ ...v, page: v.page + 1 }))}
              >
                ประวัติหน้าถัดไป
              </button>
            </div>
          </>
        )
      )}
    </section>
  );
}
