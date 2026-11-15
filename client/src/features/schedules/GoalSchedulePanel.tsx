import { useEffect, useRef, useState, type FormEvent } from "react";
import { api, displayDate, errorMessage, HttpError } from "../../api";
import { ErrorNotice, Loading } from "../../components/States";
import type { GoalActivityProps } from "../goals/GoalDetail";

interface Slot {
  weekday: number;
  readingTime: string;
  reminderTime: string | null;
}
interface Configuration {
  reminderEnabled: boolean;
  days: Slot[];
}
interface Schedule {
  goalId: string;
  timeZone: "Asia/Bangkok";
  config: (Configuration & { createdAt: string; updatedAt: string }) | null;
  evaluation: {
    evaluatedAt: string;
    date: string;
    weekday: number;
    status:
      | "NOT_CONFIGURED"
      | "GOAL_ARCHIVED"
      | "GOAL_NOT_STARTED"
      | "NOT_SCHEDULED"
      | "DISABLED"
      | "LOGGED"
      | "UPCOMING"
      | "DUE";
  };
}
const weekdays = [
  "จันทร์",
  "อังคาร",
  "พุธ",
  "พฤหัสบดี",
  "ศุกร์",
  "เสาร์",
  "อาทิตย์",
];
const messages: Record<Schedule["evaluation"]["status"], string> = {
  NOT_CONFIGURED: "ยังไม่ได้ตั้งตารางอ่าน",
  GOAL_ARCHIVED: "เป้าหมายสิ้นสุดแล้ว ตารางอ่านดูได้อย่างเดียว",
  GOAL_NOT_STARTED: "บันทึกตารางไว้ได้ การเตือนจะเริ่มเมื่อถึงวันเริ่มเป้าหมาย",
  NOT_SCHEDULED: "วันนี้ไม่มีตารางอ่าน",
  DISABLED: "ปิดการเตือนอยู่ ตารางอ่านยังบันทึกไว้",
  LOGGED: "วันนี้บันทึกการอ่านแล้ว ดูผลการอ่านได้ด้านล่าง",
  UPCOMING: "ยังไม่ถึงเวลาเตือนของวันนี้",
  DUE: "ถึงเวลาเตือนสำหรับการอ่านวันนี้แล้ว",
};
function formValue(value: Schedule): Configuration {
  return value.config
    ? {
        reminderEnabled: value.config.reminderEnabled,
        days: value.config.days.map((day) => ({ ...day })),
      }
    : {
        reminderEnabled: true,
        days: [
          {
            weekday: value.evaluation.weekday,
            readingTime: "20:00",
            reminderTime: "19:45",
          },
        ],
      };
}
const validTime = (time: string | null) =>
  typeof time === "string" && /^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/.test(time);

export function GoalSchedulePanel({
  goal,
  entriesRevision = 0,
}: GoalActivityProps) {
  const [saved, setSaved] = useState<Schedule | null>(null);
  const [draft, setDraft] = useState<Configuration>({
    reminderEnabled: true,
    days: [],
  });
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false),
    locked = useRef(false),
    alive = useRef(true),
    generation = useRef(0);
  const [refresh, setRefresh] = useState(0),
    [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false),
    [uncertain, setUncertain] = useState(false);
  const [readError, setReadError] = useState(""),
    [writeError, setWriteError] = useState(""),
    [notice, setNotice] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const form = useRef<HTMLFormElement>(null);
  const path = `/goals/${goal.id}/schedule`;
  const archived =
    goal.status === "ARCHIVED" || saved?.evaluation.status === "GOAL_ARCHIVED";
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
    const current = ++generation.current,
      abort = new AbortController();
    setLoading(true);
    setReadError("");
    api<{ data: Schedule }>(path, { signal: abort.signal })
      .then(({ data }) => {
        if (!alive.current || current !== generation.current) return;
        setSaved(data);
        if (!dirtyRef.current) setDraft(formValue(data));
      })
      .catch((error) => {
        if (alive.current && current === generation.current)
          setReadError(errorMessage(error));
      })
      .finally(() => {
        if (alive.current && current === generation.current) setLoading(false);
      });
    return () => {
      generation.current++;
      abort.abort();
    };
  }, [path, goal.status, entriesRevision, refresh, busy]);
  useEffect(() => {
    const update = () => {
      if (document.visibilityState === "visible" && !locked.current)
        setRefresh((v) => v + 1);
    };
    window.addEventListener("focus", update);
    const timer = window.setInterval(update, 60_000);
    return () => {
      window.removeEventListener("focus", update);
      window.clearInterval(timer);
    };
  }, []);
  useEffect(() => {
    form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [fields]);

  function edit(value: Configuration) {
    dirtyRef.current = true;
    setDirty(true);
    setDraft(value);
    setFields({});
    setWriteError("");
    setNotice("");
  }
  function accept(value: Schedule) {
    setSaved(value);
    setDraft(formValue(value));
    dirtyRef.current = false;
    setDirty(false);
    setFields({});
    setReadError("");
    setWriteError("");
    setUncertain(false);
  }
  async function reconcile() {
    try {
      const { data } = await api<{ data: Schedule }>(path);
      if (!alive.current) return;
      accept(data);
      setNotice(
        "โหลดตารางล่าสุดแล้ว กรุณาตรวจค่าอีกครั้งก่อนแก้ไข ผลนี้ไม่ยืนยันว่าเกิดจากคำขอใด",
      );
    } catch (error) {
      if (!alive.current) return;
      setUncertain(true);
      setWriteError(`ยังตรวจสอบผลไม่ได้ ${errorMessage(error)}`);
    }
  }
  async function retryRead() {
    if (locked.current) return;
    locked.current = true;
    generation.current++;
    setPending(true);
    try {
      await reconcile();
    } finally {
      locked.current = false;
      if (alive.current) setPending(false);
    }
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (locked.current || busy || archived || !saved || readError) return;
    const invalid: Record<string, string> = {};
    if (!draft.days.length) invalid.days = "เลือกวันอ่านอย่างน้อยหนึ่งวัน";
    draft.days.forEach((day, index) => {
      if (!validTime(day.readingTime))
        invalid[`days.${index}.readingTime`] = "ระบุเวลาอ่าน HH:mm";
      if (
        draft.reminderEnabled &&
        (!validTime(day.reminderTime) || day.reminderTime! > day.readingTime)
      )
        invalid[`days.${index}.reminderTime`] =
          "เวลาเตือนต้องไม่เกินเวลาอ่านของวันเดียวกัน";
    });
    setFields(invalid);
    setWriteError("");
    setNotice("");
    if (Object.keys(invalid).length) return;
    locked.current = true;
    generation.current++;
    setPending(true);
    try {
      const { data } = await api<{ data: Schedule }>(path, {
        method: "PUT",
        body: JSON.stringify(draft),
      });
      if (!alive.current) return;
      accept(data);
      setNotice("บันทึกตารางอ่านเรียบร้อยแล้ว");
    } catch (error) {
      if (!alive.current) return;
      if (!(error instanceof HttpError) || error.status >= 500) {
        setUncertain(true);
        await reconcile();
      } else {
        setWriteError(errorMessage(error));
        setFields(error.fields);
      }
    } finally {
      locked.current = false;
      if (alive.current) setPending(false);
    }
  }
  function changeTime(
    weekday: number,
    field: "readingTime" | "reminderTime",
    value: string,
  ) {
    edit({
      ...draft,
      days: draft.days.map((day) =>
        day.weekday === weekday ? { ...day, [field]: value } : day,
      ),
    });
  }
  return (
    <section
      className="panel schedule-panel"
      aria-labelledby="schedule-heading"
    >
      <div className="activity-header">
        <div>
          <p className="eyebrow">MAKE TIME TO READ</p>
          <h2 id="schedule-heading">ตารางอ่านของคุณ</h2>
          <p className="muted">ตั้งวันและเวลาอ่าน · เวลาไทย (Asia/Bangkok)</p>
        </div>
        <button
          className="button secondary"
          disabled={busy || loading}
          onClick={() => setRefresh((v) => v + 1)}
        >
          อัปเดตสถานะตาราง
        </button>
      </div>
      {saved && (
        <div className="schedule-status" aria-live="polite">
          <strong data-testid="schedule-status">
            {messages[saved.evaluation.status]}
          </strong>
          <p className="muted">
            สถานะจากตารางที่บันทึก ณ {displayDate(saved.evaluation.date)} ·{" "}
            {new Intl.DateTimeFormat("th-TH", {
              timeZone: "Asia/Bangkok",
              hour: "2-digit",
              minute: "2-digit",
              hourCycle: "h23",
            }).format(new Date(saved.evaluation.evaluatedAt))}{" "}
            น.
          </p>
        </div>
      )}
      <p className="muted">
        การเตือนแสดงในหน้านี้ระหว่างเปิดเว็บ
        บันทึกเวลาอ่านจริงแยกในส่วนบันทึกการอ่าน
      </p>
      {(readError || writeError) && (
        <ErrorNotice
          message={readError || writeError}
          retry={!busy ? () => setRefresh((v) => v + 1) : undefined}
        />
      )}
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      {uncertain && (
        <button
          className="button secondary"
          disabled={pending}
          onClick={() => void retryRead()}
        >
          ตรวจผลตารางก่อนส่งใหม่
        </button>
      )}
      {loading && <Loading>กำลังอัปเดตตารางอ่าน…</Loading>}
      {saved && (
        <form ref={form} onSubmit={save} noValidate>
          <fieldset className="schedule-days" disabled={busy || archived}>
            <legend>เลือกวันอ่าน</legend>
            {weekdays.map((day, i) => (
              <label className="schedule-day-choice" key={day}>
                <input
                  type="checkbox"
                  aria-label={`อ่านวัน${day}`}
                  checked={draft.days.some((slot) => slot.weekday === i + 1)}
                  aria-invalid={!!fields.days}
                  aria-describedby="schedule-days-error"
                  onChange={(event) =>
                    edit({
                      ...draft,
                      days: event.target.checked
                        ? [
                            ...draft.days,
                            {
                              weekday: i + 1,
                              readingTime: "20:00",
                              reminderTime: draft.reminderEnabled
                                ? "19:45"
                                : null,
                            },
                          ].sort((a, b) => a.weekday - b.weekday)
                        : draft.days.filter((slot) => slot.weekday !== i + 1),
                    })
                  }
                />
                {day}
              </label>
            ))}
          </fieldset>
          <p className="field-error" id="schedule-days-error">
            {fields.days}
          </p>
          <label className="schedule-toggle">
            <input
              type="checkbox"
              checked={draft.reminderEnabled}
              disabled={busy || archived}
              onChange={(event) =>
                edit({
                  reminderEnabled: event.target.checked,
                  days: draft.days.map((day) => ({
                    ...day,
                    reminderTime: event.target.checked ? day.readingTime : null,
                  })),
                })
              }
            />
            เปิดการเตือนในแอป
          </label>
          <div className="schedule-slots">
            {draft.days.map((day, index) => (
              <fieldset
                className="schedule-slot"
                key={day.weekday}
                disabled={busy || archived}
              >
                <legend>วัน{weekdays[day.weekday - 1]}</legend>
                <div className="field">
                  <label htmlFor={`schedule-reading-${day.weekday}`}>
                    เวลาอ่านวัน{weekdays[day.weekday - 1]}
                  </label>
                  <input
                    id={`schedule-reading-${day.weekday}`}
                    type="time"
                    step="60"
                    value={day.readingTime}
                    aria-invalid={!!fields[`days.${index}.readingTime`]}
                    aria-describedby={`schedule-reading-error-${day.weekday}`}
                    onChange={(e) =>
                      changeTime(day.weekday, "readingTime", e.target.value)
                    }
                  />
                  <small
                    className="field-error"
                    id={`schedule-reading-error-${day.weekday}`}
                  >
                    {fields[`days.${index}.readingTime`]}
                  </small>
                </div>
                {draft.reminderEnabled && (
                  <div className="field">
                    <label htmlFor={`schedule-reminder-${day.weekday}`}>
                      เวลาเตือนวัน{weekdays[day.weekday - 1]}
                    </label>
                    <input
                      id={`schedule-reminder-${day.weekday}`}
                      type="time"
                      step="60"
                      value={day.reminderTime ?? ""}
                      aria-invalid={!!fields[`days.${index}.reminderTime`]}
                      aria-describedby={`schedule-reminder-error-${day.weekday}`}
                      onChange={(e) =>
                        changeTime(day.weekday, "reminderTime", e.target.value)
                      }
                    />
                    <small
                      className="field-error"
                      id={`schedule-reminder-error-${day.weekday}`}
                    >
                      {fields[`days.${index}.reminderTime`]}
                    </small>
                  </div>
                )}
              </fieldset>
            ))}
          </div>
          {dirty && (
            <p className="muted" data-testid="schedule-unsaved">
              มีการแก้ไขที่ยังไม่บันทึก การอัปเดตสถานะจะรักษาค่าที่คุณกรอกไว้
            </p>
          )}
          {!archived && (
            <div className="schedule-actions">
              <button className="button primary" disabled={busy || !!readError}>
                {pending ? "กำลังบันทึก…" : "บันทึกตารางอ่าน"}
              </button>
              <button
                className="text-button"
                type="button"
                disabled={busy || !dirty}
                onClick={() => {
                  setDraft(formValue(saved));
                  dirtyRef.current = false;
                  setDirty(false);
                  setFields({});
                  setWriteError("");
                }}
              >
                ยกเลิกการแก้ตาราง
              </button>
            </div>
          )}
        </form>
      )}
    </section>
  );
}
