// 약물 상호작용 확인 Edge Function
// medications 테이블에서 약품 정보 조회 후 상호작용 판단

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface InteractionWarning {
  medicationA: string;
  medicationB: string;
  severity: 'low' | 'moderate' | 'high';
  description: string;
}

interface InteractionResult {
  hasDanger: boolean;
  warnings: InteractionWarning[];
}

// 알려진 상호작용 규칙 (morpheme_id 기반 — 확장 가능)
const KNOWN_INTERACTIONS: {
  a: string; b: string;
  severity: InteractionWarning['severity'];
  description: string;
}[] = [
  {
    a: 'condition.hypertension', b: 'condition.diabetes',
    severity: 'low',
    description: '혈압약과 당뇨약 동시 복용 시 저혈압 주의',
  },
];

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { medication_ids } = await req.json() as { medication_ids: string[] };

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: meds } = await supabase
      .from('medications')
      .select('id, pictogram_morpheme_id')
      .in('id', medication_ids);

    const morphemeIds = (meds ?? []).map((m: { pictogram_morpheme_id: string | null }) => m.pictogram_morpheme_id ?? '');
    const warnings: InteractionWarning[] = [];

    for (const rule of KNOWN_INTERACTIONS) {
      if (morphemeIds.includes(rule.a) && morphemeIds.includes(rule.b)) {
        warnings.push({
          medicationA: rule.a,
          medicationB: rule.b,
          severity: rule.severity,
          description: rule.description,
        });
      }
    }

    const result: InteractionResult = {
      hasDanger: warnings.some((w) => w.severity === 'high'),
      warnings,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
