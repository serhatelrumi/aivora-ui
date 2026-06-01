import { get } from './client';

export const getDepartmentReport = (department, startDate, endDate) =>
  get(`/reports/department/${department}?start_date=${startDate}&end_date=${endDate}`);

export const getKasaDailyReport  = (reportDate) =>
  get(`/reports/kasa/daily?report_date=${reportDate}`);

export const getPendingReport    = ()             => get('/reports/pending');

export const getEndOfDayReport   = (reportDate)   =>
  get(`/reports/end-of-day?report_date=${reportDate}`);

export const getHasVardiyaReport = (reportDate)   =>
  get(`/reports/has-vardiya?report_date=${reportDate}`);
