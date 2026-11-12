import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, errorMessage, HttpError, type Template } from "../../api";
import { ErrorNotice } from "../../components/States";

export function TemplateForm() {
  const navigate = useNavigate();
  const form = useRef<HTMLFormElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [min, setMin] = useState("1");
  const [max, setMax] = useState("1440");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  useEffect(() => {
    form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [fields]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending || uncertain) return;
    const invalid: Record<string, string> = {};
    if (![...title.trim()].length || [...title.trim()].length > 100)
      invalid.title = "ระบุชื่อกิจกรรม 1–100 ตัวอักษร";
    if ([...description.trim()].length > 500)
      invalid.description = "คำอธิบายยาวได้ไม่เกิน 500 ตัวอักษร";
    if (!Number.isInteger(Number(min)) || Number(min) < 1 || Number(min) > 1440)
      invalid.minMinutes = "ระบุจำนวนเต็ม 1–1440 นาที";
    if (
      !Number.isInteger(Number(max)) ||
      Number(max) < Number(min) ||
      Number(max) > 1440
    )
      invalid.maxMinutes = "ค่าสูงสุดต้องไม่น้อยกว่าค่าต่ำสุดและไม่เกิน 1440";
    setFields(invalid);
    setError("");
    if (Object.keys(invalid).length) return;
    setPending(true);
    try {
      await api<{ data: Template }>("/templates", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          minMinutes: Number(min),
          maxMinutes: Number(max),
        }),
      });
      navigate("/manager/templates");
    } catch (e) {
      setError(errorMessage(e));
      if (e instanceof HttpError) setFields(e.fields);
      if (!(e instanceof HttpError) || e.status >= 500) setUncertain(true);
    } finally {
      setPending(false);
    }
  }
  const fieldError = (key: string) =>
    fields[key] ? (
      <small id={`${key}-error`} className="field-error">
        {fields[key]}
      </small>
    ) : null;
  return (
    <>
      <Link className="back-link" to="/manager/templates">
        ← Activity Templates
      </Link>
      <section className="page-heading">
        <div>
          <p className="eyebrow">MAKE ROOM FOR READING</p>
          <h1>สร้าง Template</h1>
          <p className="muted">
            กำหนดกิจกรรมและช่วงนาทีที่เหมาะสมสำหรับการตั้งเป้าหมาย
          </p>
        </div>
      </section>
      <div className="form-layout">
        <form ref={form} className="panel" onSubmit={submit} noValidate>
          {error && <ErrorNotice message={error} />}
          {uncertain && (
            <div className="notice" role="status">
              <div>
                ยังไม่ทราบผลการบันทึก กรุณาตรวจรายการก่อนส่งใหม่
                เพราะชื่อกิจกรรมซ้ำกันได้{" "}
                <Link
                  className="text-button"
                  to="/manager/templates"
                  target="_blank"
                  rel="noopener"
                >
                  เปิดรายการ Template
                </Link>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setUncertain(false)}
                >
                  ฉันตรวจรายการแล้ว
                </button>
              </div>
            </div>
          )}
          <div className="field">
            <label htmlFor="title">ชื่อกิจกรรม</label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={pending}
              required
              aria-invalid={!!fields.title}
              aria-describedby="title-error title-help"
            />
            {fieldError("title")}
            <small id="title-help">
              {[...title.trim()].length}/100 ตัวอักษร
            </small>
          </div>
          <div className="field">
            <label htmlFor="description">คำอธิบาย (ไม่บังคับ)</label>
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={pending}
              aria-invalid={!!fields.description}
              aria-describedby="description-error description-help"
            />
            {fieldError("description")}
            <small id="description-help">ไม่เกิน 500 ตัวอักษร</small>
          </div>
          <div className="field">
            <label htmlFor="minMinutes">เวลาอ่านขั้นต่ำ (นาที)</label>
            <input
              id="minMinutes"
              type="number"
              min="1"
              max="1440"
              step="1"
              required
              value={min}
              disabled={pending}
              onChange={(e) => setMin(e.target.value)}
              aria-invalid={!!fields.minMinutes}
              aria-describedby="minMinutes-error"
            />
            {fieldError("minMinutes")}
          </div>
          <div className="field">
            <label htmlFor="maxMinutes">เวลาอ่านสูงสุด (นาที)</label>
            <input
              id="maxMinutes"
              type="number"
              min="1"
              max="1440"
              step="1"
              required
              value={max}
              disabled={pending}
              onChange={(e) => setMax(e.target.value)}
              aria-invalid={!!fields.maxMinutes}
              aria-describedby="maxMinutes-error"
            />
            {fieldError("maxMinutes")}
          </div>
          <div className="form-actions">
            <Link className="button secondary" to="/manager/templates">
              ยกเลิก
            </Link>
            <button className="button primary" disabled={pending || uncertain}>
              {pending ? "กำลังบันทึก…" : "สร้าง Template →"}
            </button>
          </div>
        </form>
        <aside className="tip-card">
          <span aria-hidden="true">▤</span>
          <h2>กิจกรรมที่เริ่มได้ทุกวัน</h2>
          <p>
            ระบบใช้หน่วยนาที ช่วงที่กำหนดจะใช้ตรวจทั้งเป้าหมายและเวลาที่บันทึก
            ตั้งค่าระหว่าง 1–1440 นาที
          </p>
          <small>
            ข้อมูลเป้าหมายและประวัติส่วนตัวของนักศึกษาแยกจากการจัดการ Template
          </small>
        </aside>
      </div>
    </>
  );
}
