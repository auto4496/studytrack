import { useEffect, useRef, useState, type FormEvent } from "react";
import { api, type Template } from "../../api";
import { useVerifiedMutation } from "../../components/useVerifiedMutation";

export function TemplateLifecycle({
  template,
  onChanged,
}: {
  template: Template;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false),
    [confirm, setConfirm] = useState(false);
  const [title, setTitle] = useState(template.title),
    [description, setDescription] = useState(template.description);
  const mutation = useVerifiedMutation(
    async () =>
      (await api<{ data: Template }>(`/templates/${template.id}`)).data,
    onChanged,
  );
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [mutation.fields]);
  const disabled = mutation.busy || mutation.uncertain;
  async function save(event: FormEvent) {
    event.preventDefault();
    await mutation.run(
      async () =>
        (
          await api<{ data: Template }>(`/templates/${template.id}`, {
            method: "PATCH",
            body: JSON.stringify({ title, description }),
          })
        ).data,
      "แก้ไขข้อมูลกิจกรรมแล้ว",
    );
  }
  return (
    <div className="template-lifecycle">
      {!editing ? (
        <button
          type="button"
          className="button secondary"
          disabled={disabled}
          onClick={() => setEditing(true)}
        >
          แก้ไขข้อมูลกิจกรรม
        </button>
      ) : (
        <form ref={form} onSubmit={save}>
          <label htmlFor={`title-${template.id}`}>ชื่อกิจกรรมใหม่</label>
          <input
            id={`title-${template.id}`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={disabled}
            aria-invalid={!!mutation.fields.title}
            aria-describedby={`title-error-${template.id}`}
          />
          <small className="field-error" id={`title-error-${template.id}`}>
            {mutation.fields.title}
          </small>
          <label htmlFor={`description-${template.id}`}>คำอธิบายใหม่</label>
          <textarea
            id={`description-${template.id}`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={disabled}
            aria-invalid={!!mutation.fields.description}
            aria-describedby={`description-error-${template.id}`}
          />
          <small
            className="field-error"
            id={`description-error-${template.id}`}
          >
            {mutation.fields.description}
          </small>
          <button className="button primary" disabled={disabled}>
            บันทึกข้อมูลกิจกรรม
          </button>
          <button
            className="button secondary"
            type="button"
            disabled={disabled}
            onClick={() => setEditing(false)}
          >
            ยกเลิกการแก้ไข
          </button>
        </form>
      )}
      {template.isActive &&
        (!confirm ? (
          <button
            className="button secondary"
            disabled={disabled}
            onClick={() => setConfirm(true)}
          >
            ปิดใช้กิจกรรม
          </button>
        ) : (
          <div role="group" aria-label="ยืนยันการปิดใช้กิจกรรม">
            <p>จะไม่รับเป้าหมายใหม่ เป้าหมายเดิมยังบันทึกได้ตามปกติ</p>
            <button
              className="button secondary"
              autoFocus
              disabled={disabled}
              onClick={() =>
                mutation.run(
                  async () =>
                    (
                      await api<{ data: Template }>(
                        `/templates/${template.id}/deactivate`,
                        { method: "POST", body: "{}" },
                      )
                    ).data,
                  "ปิดใช้กิจกรรมแล้ว",
                )
              }
            >
              ยืนยันปิดใช้กิจกรรม
            </button>
            <button
              className="button secondary"
              disabled={disabled}
              onClick={() => setConfirm(false)}
            >
              ยกเลิกการปิดใช้
            </button>
          </div>
        ))}
      {mutation.error && <p role="alert">{mutation.error}</p>}
      {mutation.uncertain && (
        <button
          className="button secondary"
          disabled={mutation.busy}
          onClick={mutation.retryRead}
        >
          ตรวจสอบสถานะล่าสุด
        </button>
      )}
    </div>
  );
}
