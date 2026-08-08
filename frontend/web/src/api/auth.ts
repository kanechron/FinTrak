import { api } from './client'

/**
 * Log out the current session
 * @remarks Revokes all of the user's refresh tokens (every device/session), not just this one
 * @throws {ApiError} if the request fails
 */
export function logout(): Promise<void> {
  return api.post('/auth/logout', {})
}

/**
 * Deactivate the current user's account
 * @remarks Soft and reversible via {@link reactivateAccount}. Revokes all linked Plaid
 * connections and signs the user out.
 * @throws {ApiError} if the request fails
 */
export function deactivateAccount(): Promise<void> {
  return api.delete('/user/deactivate-account')
}

/**
 * Permanently delete the current user's account
 * @remarks Unlike {@link deactivateAccount}, this is not reversible. Revokes all linked
 * Plaid connections and signs the user out.
 * @throws {ApiError} if the request fails
 */
export function deleteAccount(): Promise<void> {
  return api.delete('/user/delete-account')
}

/**
 * Reactivate a previously deactivated account
 * @remarks Takes no parameters — relies entirely on server-side session state set during
 * a prior deactivation flow, and works without an active auth cookie
 * @throws {ApiError} if the request fails
 */
export function reactivateAccount(): Promise<void> {
  return api.patch('/user/reactivate-account')
}
