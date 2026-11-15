import { useEffect, useRef, useState, type ComponentType } from "react";
import { GoalLifecycle } from "./GoalLifecycle";
import { ReadingHistory } from "../entries/ReadingHistory";
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
  entriesRevision?: number;
  onEntriesChanged?: () => void;
}
export function GoalDetail({
  ActivityComponent,
}: {
  ActivityComponent?: ComponentType<GoalActivityProps>;
}) {
  const { goalId } = useParams();
  const currentId = useRef(goalId);
  currentId.current = goalId;
  const [activityRevision, setActivityRevision] = useState(0);
  const [entriesRevision, setEntriesRevision] = useState(0);
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
              {goal.status === "ACTIVE" ? "Active" : "Archived"}
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
                <dt>เวลาอ่านขั้นต่ำ–สูงสุด</dt>
                <dd>
                  {goal.minMinutes}–{goal.maxMinutes} นาที
                </dd>
              </div>
              <div>
                <dt>หน่วยเวลา</dt>
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
          <GoalLifecycle
            key={goal.id}
            goal={goal}
            onUpdated={(updated) => {
              if (updated.id !== currentId.current) return;
              setGoal(updated);
              setActivityRevision((v) => v + 1);
              setEntriesRevision((v) => v + 1);
            }}
          />
          {ActivityComponent && (
            <ActivityComponent
              key={`${goal.id}:${activityRevision}`}
              goal={goal}
              entriesRevision={entriesRevision}
              onEntriesChanged={() => setEntriesRevision((v) => v + 1)}
            />
          )}
          <ReadingHistory
            key={`history:${goal.id}`}
            goal={goal}
            entriesRevision={entriesRevision}
            onEntriesChanged={() => setEntriesRevision((v) => v + 1)}
          />
        </>
      )}
    </>
  );
}
