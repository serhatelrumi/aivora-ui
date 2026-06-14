import { get, put } from './client';

export const getPermissions  = ()       => get('/permissions/');
export const savePermissions = (matrix) => put('/permissions/', { matrix });
