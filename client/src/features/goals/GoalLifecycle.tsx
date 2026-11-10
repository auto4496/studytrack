import { useRef, useState, type FormEvent } from "react";
import { api, displayDate, localToday, nextDate, type Goal } from "../../api";
import { useVerifiedMutation } from "../../components/useVerifiedMutation";

export function GoalLifecycle({
  goal,
  onUpdated,
}: {
  goal: Goal;
  onUpdated: (value: Goal) => void;
}) {
  const [target, setTarget] = useState(""),
    [confirm, setConfirm] = useState(false);
  const [field, setField] = useState("");
  const targetInput = useRef<HTMLInputElement>(null);
  const mutation = useVerifiedMutation(
    async () => (await api<{ data: Goal }>(`/goals/${goal.id}`)).data,
    onUpdated,
  );
  const disabled = mutation.busy || mutation.uncertain;
  async function change(event: FormEvent) {
    event.preventDefault();
    const value = Number(target);
    if (
      !target.trim() ||
      !Number.isInteger(value) ||
      value < goal.minMinutes ||
      value > goal.maxMinutes
    ) {
      setField(`ระบุจำนวนเต็ม ${goal.minMinutes}–${goal.maxMinutes} นาที`);
      targetInput.current?.focus();
      return;
    }
    setField("");
    await mutation.run(
      async () =>
        (
          await api<{ data: Goal }>(`/goals/${goal.id}/target`, {
            method: "PATCH",
            body: JSON.stringify({ dailyTargetMinutes: value }),
          })
        ).data,
      "บันทึกเป้าหมายสำหรับวันถัดไปแล้ว",
    );
  }
  return (
    <section className="panel lifecycle-panel" aria-label="จัดการเป้าหมาย">
      <h2>จัดการเป้าหมาย</h2>
      {goal.pendingTarget && (
        <p className="notice" role="status">
          ตั้งแต่ {displayDate(goal.pendingTarget.effectiveFrom)} เป้าหมายใหม่{" "}
          {goal.pendingTarget.targetMinutes} นาทีต่อวัน
        </p>
      )}
      {goal.status === "ARCHIVED" ? (
        <p>
          เป้าหมายสิ้นสุด {goal.endDate && displayDate(goal.endDate)}{" "}
          ประวัติเดิมยังอยู่ และบันทึกย้อนหลังได้ภายในช่วงเป้าหมาย
        </p>
      ) : goal.startDate > localToday() ? (
        <p>เปลี่ยนหรือหยุดเป้าหมายได้ตั้งแต่ {displayDate(goal.startDate)}</p>
      ) : (
        <>
          <form onSubmit={change} noValidate>
            <label htmlFor="new-target">เป้าหมายรายวันใหม่ (นาที)</label>
            <input
              ref={targetInput}
              id="new-target"
              type="number"
              inputMode="numeric"
              min={goal.minMinutes}
              max={goal.maxMinutes}
              step="1"
              value={target}
              disabled={disabled}
              onChange={(e) => {
                setTarget(e.target.value);
                setField("");
              }}
              aria-invalid={!!field}
              aria-describedby="new-target-help new-target-error"
            />
            <p id="new-target-help">
              มีผลวันถัดไป ({displayDate(nextDate(localToday()))})
              ผลย้อนหลังคงเดิม การแก้ซ้ำจะแทนค่าที่รออยู่
            </p>
            <p
              id="new-target-error"
              className="field-error"
              role={field ? "alert" : undefined}
            >
              {field}
            </p>
            <button
              className="button primary"
              disabled={disabled}
              type="submit"
            >
              {mutation.busy ? "กำลังบันทึก…" : "บันทึกเป้าหมายใหม่"}
            </button>
          </form>
          {!confirm ? (
            <button
              className="button secondary"
              type="button"
              disabled={disabled}
              onClick={() => setConfirm(true)}
            >
              หยุดเป้าหมาย
            </button>
          ) : (
            <div
              className="notice"
              role="group"
              aria-label="ยืนยันการหยุดเป้าหมาย"
            >
              <p>
                หยุดตั้งแต่วันนี้ โดยวันนี้ยังนับเป็นวันสุดท้าย
                ประวัติเดิมยังอยู่ และไม่เปิดเป้าหมายนี้ใหม่
              </p>
              <button
                className="button secondary"
                autoFocus
                disabled={disabled}
                onClick={() =>
                  mutation.run(
                    async () =>
                      (
                        await api<{ data: Goal }>(`/goals/${goal.id}/stop`, {
                          method: "POST",
                          body: "{}",
                        })
                      ).data,
                    "หยุดเป้าหมายแล้ว ประวัติเดิมยังอยู่",
                  )
                }
              >
                ยืนยันหยุดเป้าหมาย
              </button>
              <button
                className="button secondary"
                disabled={disabled}
                onClick={() => setConfirm(false)}
              >
                ยกเลิก
              </button>
            </div>
          )}
        </>
      )}
      {mutation.error && <p role="alert">{mutation.error}</p>}
      {mutation.notice && <p role="status">{mutation.notice}</p>}
      {mutation.uncertain && (
        <button
          className="button secondary"
          disabled={mutation.busy}
          onClick={mutation.retryRead}
        >
          ตรวจสอบสถานะล่าสุด
        </button>
      )}
    </section>
  );
}
