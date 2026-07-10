// QR 공유 토큰 소비 Edge Function
// 의료진 포털에서 QR 스캔 시 호출 — 토큰 유효성 확인 후 사용자 데이터 반환

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { token } = await req.json() as { token: string };

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // consume_share_token DB 함수 호출
    const { data, error } = await supabase.rpc('consume_share_token', { p_token: token });

    if (error || !data) {
      return new Response(JSON.stringify({ error: '유효하지 않은 토큰' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 사용자 복약 기록 조회
    const userId = (data as { user_id: string }).user_id;

    const { data: medications } = await supabase
      .from('medications')
      .select('name, dosage_per_time, active, medication_schedules(time_of_day)')
      .eq('user_id', userId)
      .eq('active', true);

    return new Response(JSON.stringify({ medications: medications ?? [] }), {
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
