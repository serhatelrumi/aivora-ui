import { get, post, patch } from './client';

export const listUsers      = ()            => get('/users/');
export const createUser     = (body)        => post('/users/', body);
export const deactivateUser = (userId)      => patch(`/users/${userId}/deactivate`);
