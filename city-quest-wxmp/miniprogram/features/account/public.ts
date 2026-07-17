/**
 * Account feature public API.
 * Callers: app composition, other features (ensureAuthenticated only).
 */

export { AccountRoutes } from './routes'
export { createEnsureAuthenticated } from './application/ensure-authenticated'
export { createLogin, createLogout } from './application/login'
export { createAuthRepository } from './infrastructure/auth-repository'
export type { AuthRepository } from './domain/ports'
