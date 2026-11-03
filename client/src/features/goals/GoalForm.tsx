import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  api,
  errorMessage,
  HttpError,
  localToday,
  nextDate,
  type Collection,
  type Template,
  type Goal,
} from "../../api";
import { Empty, ErrorNotice, Loading } from "../../components/States";

export function GoalForm() {
  const [query] = useSearchParams();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[] | null>(null);
  const [templateId, setTemplateId] = useState(query.get("template") ?? "");
  const [target, setTarget] = useState("60");
  const [startDate, setStartDate] = useState(localToday());
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [retry, setRetry] = useState(0);
  const today = localToday();
  useEffect(() => {
    let active = true;
    setLoadError("");
    async function load() {
      const all: Template[] = [];
      let page = 1;
      for (;;) {
        const result = await api<Collection<Template>>(
          `/templates?page=${page}&pageSize=100`,
        );
        all.push(...result.data);
        if (all.length >= result.meta.total || !result.data.length) break;
        page++;
      }
      if (active) setTemplates(all);
    }
    load().catch((e) => {
      if (active) setLoadError(errorMessage(e));
    });
    return () => {
      active = false;
    };
  }, [retry]);
  const selected = templates?.find((t) => t.id === templateId);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    setFields({});
    try {
      const result = await api<{ data: Goal }>("/goals", {
        method: "POST",
        body: JSON.stringify({
          templateId,
          dailyTargetMinutes: Number(target),
          startDate,
        }),
      });
      navigate(`/goals/${result.data.id}`);
    } catch (e) {
      setError(errorMessage(e));
      if (e instanceof HttpError) setFields(e.fields);
    } finally {
      setPending(false);
    }
  }
  const fieldError = (name: string) =>
    fields[name] ? (
      <small className="field-error" id={`${name}-error`}>
        {fields[name]}
      </small>
    ) : null;
  return (
    <>
      <Link className="back-link" to="/goals">
        ← เป้าหมายของฉัน
      </Link>
      <section className="page-heading">
        <div>
          <p className="eyebrow">START SOMETHING GOOD</p>
          <h1>ตั้งเป้าหมายใหม่</h1>
          <p className="muted">
            เริ่มจากเวลาที่ทำได้ แล้วค่อย ๆ สร้างความสม่ำเสมอ
          </p>
        </div>
      </section>
      {loadError ? (
        <ErrorNotice message={loadError} retry={() => setRetry((n) => n + 1)} />
      ) : !templates ? (
        <Loading />
      ) : templates.length === 0 ? (
        <Empty title="ยังไม่มีกิจกรรมให้เลือก">
          <p>เมื่อผู้ดูแลเพิ่มแม่แบบกิจกรรม คุณจะตั้งเป้าหมายได้ที่นี่</p>
          <Link className="button secondary" to="/goals">
            กลับไปยังเป้าหมาย
          </Link>
        </Empty>
      ) : (
        <div className="form-layout">
          <form className="panel goal-form" onSubmit={submit}>
            {error && (
              <>
                <ErrorNotice message={error} />
                {error && (
                  <Link className="text-button" to="/goals">
                    ดูเป้าหมายที่มีอยู่
                  </Link>
                )}
              </>
            )}
            <div className="field">
              <label htmlFor="templateId">กิจกรรมที่อยากทำ</label>
              <select
                id="templateId"
                value={templateId}
                required
                onChange={(e) => setTemplateId(e.target.value)}
                aria-invalid={!!fields.templateId}
                aria-describedby={
                  fields.templateId ? "templateId-error" : undefined
                }
              >
                <option value="">เลือกกิจกรรมการอ่าน</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
              {fieldError("templateId")}
              {selected?.description && (
                <small className="muted">{selected.description}</small>
              )}
            </div>
            <div className="field">
              <label htmlFor="dailyTargetMinutes">เป้าหมายต่อวัน (นาที)</label>
              <input
                id="dailyTargetMinutes"
                type="number"
                min={selected?.minMinutes ?? 1}
                max={selected?.maxMinutes ?? 1440}
                step="1"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                required
                aria-invalid={!!fields.dailyTargetMinutes}
                aria-describedby="dailyTargetMinutes-help dailyTargetMinutes-error"
              />
              <small id="dailyTargetMinutes-help" className="muted">
                {selected
                  ? `เลือกได้ ${selected.minMinutes}–${selected.maxMinutes} นาทีต่อวัน`
                  : "เลือกกิจกรรมเพื่อดูช่วงเวลาที่เหมาะสม"}
              </small>
              <span id="dailyTargetMinutes-error" className="field-error">
                {fields.dailyTargetMinutes}
              </span>
            </div>
            <div className="field">
              <label htmlFor="startDate">วันที่เริ่มต้น</label>
              <input
                id="startDate"
                type="date"
                min={today}
                max={nextDate(today)}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                aria-invalid={!!fields.startDate}
                aria-describedby="date-help startDate-error"
              />
              <small id="date-help" className="muted">
                เริ่มได้วันนี้หรือพรุ่งนี้ ตามเวลาไทย
              </small>
              <span id="startDate-error" className="field-error">
                {fields.startDate}
              </span>
            </div>
            <div className="form-actions">
              <Link className="button secondary" to="/goals">
                ยกเลิก
              </Link>
              <button className="button primary" disabled={pending}>
                {pending ? "กำลังบันทึก…" : "สร้างเป้าหมาย →"}
              </button>
            </div>
          </form>
          <aside className="tip-card">
            <span aria-hidden="true">✦</span>
            <h2>เริ่มเล็ก ๆ ก็มีความหมาย</h2>
            <p>
              เลือกเวลาที่เข้ากับชีวิตประจำวัน
              ความสม่ำเสมอสำคัญกว่าการเริ่มต้นด้วยเป้าหมายที่ใหญ่เกินไป
            </p>
            <small>หนึ่งกิจกรรมมีเป้าหมายที่กำลังทำได้หนึ่งรายการ</small>
          </aside>
        </div>
      )}
    </>
  );
}
