import { get, put } from './client';

export const getAllDeptSettings = ()           => get('/department-settings/');
export const getDeptSetting     = (dept)       => get('/department-settings/' + dept);
export const updateDeptSetting  = (dept, tol)  =>
  put('/department-settings/' + dept, { tolerance_grams: tol });
