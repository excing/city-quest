/**
 * Account ports.
 * Callers: account application.
 */

import type { SessionUser } from '../../../core/session/types'

export interface AuthRepository {
  loginWithWechat(input: {
    code: string
  }): Promise<{ token: string; user: SessionUser }>
}
