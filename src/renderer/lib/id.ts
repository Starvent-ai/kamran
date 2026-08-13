/**
 * Generates a unique-enough local ID: `${prefix}-${timestamp}-${random}`.
 *
 * Plain `Date.now()` alone collides whenever two records of the same kind
 * are created within the same millisecond — verified: two customers
 * created back-to-back in a fast test run got the identical id, which
 * then made a repair ticket's `customerId` resolve to the wrong customer
 * (the lookup found the first match, not the intended one). The same
 * collision is possible in real usage too — e.g. a fast bulk import, or a
 * user double-clicking submit. The short random suffix makes that
 * effectively impossible without adding a real dependency (uuid, nanoid),
 * which this project deliberately avoids for build-size/RAM reasons.
 */
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
