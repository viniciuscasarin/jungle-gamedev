export const RESOURCE_TIMEOUT_MS = 30_000;

/** The work may be non-cancellable; callers still own its eventual result. */
export function withDeadline<T>(work: Promise<T>, timeoutMs = RESOURCE_TIMEOUT_MS, abort?: () => void): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => { abort?.(); reject(new Error('Resource preparation timed out.')); }, timeoutMs);
    work.then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
  });
}
