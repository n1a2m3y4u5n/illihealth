// 약물 상호작용 확인 — Supabase Edge Function 호출
// lib/supabase.ts의 클라이언트로 functions.invoke 사용

import { supabase } from './supabase';

export interface InteractionResult {
  hasDanger: boolean;
  warnings: InteractionWarning[];
}

export interface InteractionWarning {
  medicationA: string;
  medicationB: string;
  severity: 'low' | 'moderate' | 'high';
  description: string;
}

// 복용 중인 약 ID 목록을 Edge Function에 전송해 상호작용 확인
export async function checkInteractions(
  medicationIds: string[]
): Promise<InteractionResult> {
  if (medicationIds.length < 2) {
    return { hasDanger: false, warnings: [] };
  }

  try {
    const { data, error } = await supabase.functions.invoke('interaction-check', {
      body: { medication_ids: medicationIds },
    });

    if (error || !data) {
      return { hasDanger: false, warnings: [] };
    }

    return data as InteractionResult;
  } catch {
    return { hasDanger: false, warnings: [] };
  }
}
