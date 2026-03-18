export async function logServerError(context: string, payload: unknown) {
  // Always emit to stderr so dev console shows issues immediately.
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[logServerError] ${context}`, payload)
  }

  // Persistent file logging — only available in Node.js runtime, not Edge.
  if (typeof process === 'undefined' || typeof process.versions?.node === 'undefined') return

  try {
    const fs = await import('fs/promises')
    const path = await import('path')
    const logsDir = path.resolve(process.cwd(), 'logs')
    await fs.mkdir(logsDir, { recursive: true })
    const file = path.join(logsDir, 'server_errors.log')
    const entry = JSON.stringify({ time: new Date().toISOString(), context, payload }) + '\n'
    await fs.appendFile(file, entry)
  } catch {
    // Best-effort — never throw from the logger.
  }
}

