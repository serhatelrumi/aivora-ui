import { get, post, patch, del } from './client';

export const createTransfer    = (data) => post('/transfers/', data);
export const listTransfers     = ()     => get('/transfers/');
export const listPending       = ()     => get('/transfers/pending');
export const confirmTransfer   = (id)   => post(`/transfers/${id}/confirm`, {});
export const rejectTransfer    = (id, reason) =>
  post(`/transfers/${id}/confirm`, { rejection_reason: reason });
export const createInitialStock = (data) => post('/transfers/initial-stock', data);
export const deleteTransfer    = (id)        => del(`/transfers/${id}`);
export const updateTransfer    = (id, data)  => patch(`/transfers/${id}`, data);
export const restoreTransfer   = (id)        => post(`/transfers/${id}/restore`, {});

export const listTransferHistory = (startDate, endDate) =>
  get(`/transfers/history?start_date=${startDate}&end_date=${endDate}`);
