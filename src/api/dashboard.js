import { get } from './client';

export const getAllBalances      = ()     => get('/balances/');
export const getDeptBalance      = (dept) => get(`/balances/${dept}`);
export const getKasaBalance      = ()     => get('/balances/kasa');
export const getHasSummary       = ()     => get('/balances/has-summary');
export const getPendingReport    = ()     => get('/reports/pending');
export const getActiveAlarms     = ()     => get('/alarms/?resolved=false');
export const getTodayReport      = () => {
  const today = new Date().toISOString().split('T')[0];
  return get(`/reports/end-of-day?report_date=${today}`);
};
