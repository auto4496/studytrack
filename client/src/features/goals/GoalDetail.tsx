import { useEffect, useState, type ComponentType } from "react";
import { Link, useParams } from "react-router-dom";
import {
  api,
  displayDate,
  errorMessage,
  localToday,
  type Goal,
} from "../../api";
import { ErrorNotice, Loading } from "../../components/States";

// Member B can supply its real F-04 component without replacing the goal route.
export interface GoalActivityProps {
  goal: Goal;
  onSessionExpired?: () => void;
}
export function GoalDetail({
  ActivityComponent,
}: {
  ActivityComponent?: ComponentType<GoalActivityProps>;
}) {
  const { goalId } = useParams();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setGoal(null);
    setError("");
    api<{ data: Goal }>(`/goals/${goalId}`)
      .then((r) => {
        if (active) setGoal(r.data);
      })
      .catch((e) => {
        if (active) setError(errorMessage(e));
      });
    return () => {
      active = false;
    };
  }, [goalId, retry]);
  return (
    <>
      <Link className="back-link" to="/goals">
        ← เป้าหมายของฉัน
      </Link>
      {error ? (
        <ErrorNotice message={error} retry={() => setRetry((n) => n + 1)} />
      ) : !goal ? (
        <Loading />
      ) : (
        <>
          <section className="page-heading">
            <div>
              <p className="eyebrow">ONE DAY AT A TIME</p>
              <h1>{goal.templateTitle}</h1>
              <p className="muted">เป้าหมายส่วนตัวของคุณ</p>
            </div>
            <span className="pill">
              {goal.status === "ACTIVE" ? "กำลังทำ" : "สิ้นสุดแล้ว"}
            </span>
          </section>
          <section className="panel goal-detail">
            <div>
              <p className="muted">เป้าหมายรายวัน</p>
              <div className="detail-number">
                {goal.targetMinutes}
                <span>นาที</span>
              </div>
            </div>
            <dl>
              <div>
                <dt>เริ่มต้น</dt>
                <dd>{displayDate(goal.startDate)}</dd>
              </div>
              <div>
                <dt>ช่วงเวลาที่บันทึกได้</dt>
                <dd>
                  {goal.minMinutes}–{goal.maxMinutes} นาที
                </dd>
              </div>
              <div>
                <dt>หน่วยกิจกรรม</dt>
                <dd>นาที</dd>
              </div>
            </dl>
          </section>
          {goal.startDate > localToday() && (
            <div className="notice">
              เป้าหมายนี้เริ่ม {displayDate(goal.startDate)}{" "}
              คุณจะเริ่มบันทึกกิจกรรมได้ในวันนั้น
            </div>
          )}
          {ActivityComponent && <ActivityComponent goal={goal} />}
        </>
      )}
    </>
  );
}
