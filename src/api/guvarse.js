import { get, post, patch } from './client';

export const createGuvarse    = (data) => post('/guvarse/', data);
export const listAllGuvarse   = ()     => get('/guvarse/');
export const listGuvarseDept  = (dept) => get('/guvarse/department/' + dept);
export const updateReelGuvarse = (id, data) => patch('/guvarse/' + id + '/reel', data);
