import type { Outcome } from "./contracts.js";

const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

export function validateOutcome(value: unknown): asserts value is Outcome {
  if (!object(value)) throw new Error("outcome must be an object");
  const allowed = ["version", "runId", "status", "recordedAt", "summary"];
  const extra = Object.keys(value).find((key) => !allowed.includes(key));
  if (extra) throw new Error(`outcome has unknown property: ${extra}`);
  if (value.version !== 1) throw new Error("invalid outcome version");
  if (
    typeof value.runId !== "string" ||
    !/^run_[a-f0-9]{16}$/.test(value.runId)
  )
    throw new Error("invalid outcome runId");
  if (
    !["worth-follow-up", "not-relevant", "no-action"].includes(
      value.status as string,
    )
  )
    throw new Error("invalid outcome status");
  for (const key of ["recordedAt", "summary"])
    if (
      typeof value[key] !== "string" ||
      !(value[key] as string).trim() ||
      (value[key] as string).length > 2000
    )
      throw new Error(`invalid outcome ${key}`);
  if (Number.isNaN(Date.parse(value.recordedAt as string)))
    throw new Error("invalid outcome recordedAt");
}
