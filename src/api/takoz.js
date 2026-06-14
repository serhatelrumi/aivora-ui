import { get, post, patch, del } from './client';

export const createTakoz    = (data) => post('/takoz/', data);
export const listAllTakoz   = ()     => get('/takoz/');
export const listTakozDept  = (dept) => get(`/takoz/department/${dept}`);
export const updateReelTakoz = (id, data) => patch(`/takoz/${id}/reel`, data);
export const deleteTakoz    = (id)   => del(`/takoz/${id}`);
