import { api } from './client'

export function logout(): Promise<void> {
  return api.post('/auth/logout', {})
}

export function deactivateAccount(): Promise<void> {
  return api.delete('/user/deactivate-account')
}

export function deleteAccount(): Promise<void> {
  return api.delete('/user/delete-account')
}

export function reactivateAccount(): Promise<void> {
  return api.patch('/user/reactivate-account')
}
