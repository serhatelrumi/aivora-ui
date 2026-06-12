import { get, post } from './client';

export const getVardiyaDurum      = ()     => get('/vardiya/durum');
export const createVardiyaKapanis = (dept) => post('/vardiya/kapanis', { department: dept });
export const listVardiyaKapanis   = ()     => get('/vardiya/kapanis');
export const listKapanisByDept    = (dept) => get(`/vardiya/kapanis/${dept}`);
