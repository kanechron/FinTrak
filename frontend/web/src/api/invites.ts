import { api } from './client';

export function createInvite(): Promise<string> {
    return api.post<{ link: string }>('/invites/create').then(r => r.link);
}