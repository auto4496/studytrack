import { useEffect, useRef, useState } from "react";
import { errorMessage, HttpError } from "../api";

// A failed response can hide a committed mutation. Re-read before allowing a manual retry.
export function useVerifiedMutation<T>(
  read: () => Promise<T>,
  accept: (value: T) => void,
) {
  const mounted = useRef(false),
    locked = useRef(false);
  const [busy, setBusy] = useState(false),
    [uncertain, setUncertain] = useState(false);
  const [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  async function reconcile() {
    try {
      const current = await read();
      if (!mounted.current) return;
      setUncertain(false);
      setNotice("อ่านสถานะล่าสุดแล้ว กรุณาตรวจข้อมูลก่อนส่งใหม่");
      accept(current);
    } catch (e) {
      if (mounted.current) {
        setUncertain(true);
        setError(`ยังตรวจสอบสถานะไม่ได้ ${errorMessage(e)}`);
      }
    }
  }
  async function run(write: () => Promise<T>, message: string) {
    if (locked.current || uncertain) return;
    locked.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    setFields({});
    try {
      const current = await write();
      if (mounted.current) {
        setNotice(message);
        accept(current);
      }
    } catch (e) {
      if (!mounted.current) return;
      setError(errorMessage(e));
      if (e instanceof HttpError) setFields(e.fields);
      if (
        e instanceof TypeError ||
        (e instanceof HttpError && (e.status >= 500 || e.status === 409))
      ) {
        setUncertain(true);
        await reconcile();
      }
    } finally {
      locked.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  async function retryRead() {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    try {
      await reconcile();
    } finally {
      locked.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  return { busy, uncertain, error, fields, notice, run, retryRead };
}
