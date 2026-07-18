/**
 * Account feature public API.
 * Callers: app composition, other features (ensureAuthenticated only).
 */

export { AccountRoutes } from './routes'
export { createEnsureAuthenticated } from './application/ensure-authenticated'
export { createLogin, createLogout } from './application/login'
export {
  createLoadProfile,
  createUpdateProfile,
  isValidPhone,
} from './application/update-profile'
export { createAuthRepository } from './infrastructure/auth-repository'
export { createProfileRepository } from './infrastructure/profile-repository'
export type {
  AuthRepository,
  ProfileRepository,
  ProfileUpdateInput,
} from './domain/ports'
