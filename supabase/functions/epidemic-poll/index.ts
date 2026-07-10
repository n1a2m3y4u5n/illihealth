// 감염병 경보 Edge Function
// WHO/CDC API 또는 자체 DB에서 경보 조회
// 현재는 Mock 데이터 반환 — 실제 데이터 소스로 교체 필요

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface EpidemicAlert {
  id: string;
  disease: string;
  level: 1 | 2 | 3 | 4;
  region: string;
  issued_at: string;
  description: string;
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // TODO: 실제 감염병 경보 API 연결
    // 현재는 빈 배열 반환 (경보 없음)
    const alerts: EpidemicAlert[] = [];

    return new Response(JSON.stringify(alerts), {
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
