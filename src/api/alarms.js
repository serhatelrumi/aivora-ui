import { get, post, patch } from './client';

export const listAlarms          = (resolved = false) => get(`/alarms/?resolved=${resolved}`);
export const resolveAlarm        = (alarmId)           => patch(`/alarms/${alarmId}/resolve`);
export const checkPendingAlarms  = ()                  => post('/alarms/check-pending');
export const listAlarmSettings   = ()                  => get('/alarms/settings');
export const updateAlarmSetting  = (alarmType, body)   => patch(`/alarms/settings/${alarmType}`, body);
