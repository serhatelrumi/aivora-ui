import { get, post, patch, del } from './client';

export const getReceteler   = ()           => get('/receteler/');
export const createRecete   = (data)       => post('/receteler/', data);
export const updateRecete   = (id, data)   => patch(`/receteler/${id}`, data);
export const deleteRecete   = (id)         => del(`/receteler/${id}`);
export const sendMadenAyarlama = (data)    => post('/receteler/maden-ayarlama/send', data);
