// 알람 스케줄 관리 — Expo Notifications 기반
// 복약 알람, 잔여량 경고, 재알림(스누즈) 등록/취소

import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';

// 알림 채널 초기화 (Android용)
export async function initNotifications(): Promise<void> {
  // 알림 핸들러 설정: 앱이 포그라운드 상태일 때도 알림 표시
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  // 알림 권한 요청
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    console.warn('[IlliHealth] 알림 권한이 없습니다');
  }
}

// 매일 반복되는 복약 알람 등록
// timeOfDay: "09:00" 형식
export async function scheduleMedicationAlarm(
  medicationId: string,
  scheduleId: string,
  timeOfDay: string,
  medicationName: string,
  count: number
): Promise<void> {
  const [hourStr, minuteStr] = timeOfDay.split(':');
  const hour = parseInt(hourStr ?? '9', 10);
  const minute = parseInt(minuteStr ?? '0', 10);

  // deep link: illihealth://alarm/{scheduleId}
  const deepLink = Linking.createURL(`alarm/${scheduleId}`);

  await Notifications.scheduleNotificationAsync({
    identifier: `med-${scheduleId}`,
    content: {
      title: '💊 약 먹을 시간이에요',
      body: `${medicationName} ${count}알`,
      sound: true,
      data: {
        type: 'medication',
        medicationId,
        scheduleId,
        deepLink,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      second: 0,
      repeats: true,
    },
  });
}

// 복약 알람 취소
export async function cancelMedicationAlarm(scheduleId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(`med-${scheduleId}`);
}

// 잔여량 부족 경고 알람 (remainingDays일 후 발송)
export async function scheduleLowSupplyAlarm(
  medicationId: string,
  remainingDays: number
): Promise<void> {
  const triggerDate = new Date();
  triggerDate.setDate(triggerDate.getDate() + remainingDays);
  triggerDate.setHours(9, 0, 0, 0);

  await Notifications.scheduleNotificationAsync({
    identifier: `low-supply-${medicationId}`,
    content: {
      title: '⚠️ 약이 곧 떨어져요',
      body: '약국에서 처방전을 받아오세요',
      sound: true,
      data: {
        type: 'low_supply',
        medicationId,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });
}

// 스누즈: n분 후 1회 알람
export async function scheduleSnoozeAlarm(
  scheduleId: string,
  medicationName: string,
  count: number,
  delayMinutes = 15
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: `snooze-${scheduleId}-${Date.now()}`,
    content: {
      title: '💊 약 먹을 시간이에요',
      body: `${medicationName} ${count}알`,
      sound: true,
      data: {
        type: 'snooze',
        scheduleId,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: delayMinutes * 60,
      repeats: false,
    },
  });
}
