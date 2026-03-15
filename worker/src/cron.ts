/**
 * Cron-invoked handler: deletes sessions (and associated data via cascade)
 * that have passed their expiry date.
 */
export async function cleanupExpiredSessions (db: D1Database): Promise<void> {
  const result = await db
    .prepare("DELETE FROM sessions WHERE expires_at < datetime('now')")
    .run()

  console.log(`[cron] Cleaned up ${result.meta.changes} expired sessions`)
}
