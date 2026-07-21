import { api } from './client'

export function logout(): Promise<void> {
  return api.post('/auth/logout', {})
}
