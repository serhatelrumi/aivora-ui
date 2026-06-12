import { get, post } from './client';

export const createMizan  = (data) => post('/mizan/', data);
export const listMizan    = ()     => get('/mizan/');
export const getMizan     = (id)   => get(`/mizan/${id}`);
export const onaylaMizan  = (id)   => post(`/mizan/${id}/onayla`, {});
