-- IlliHealth 데이터베이스 스키마
-- Supabase PostgreSQL용. supabase/migrations/0001_initial.sql 로 복사하여 사용.

-- ============================================================
-- 1. 사용자 프로필 (Supabase auth.users 확장)
-- ============================================================
create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  picto_pin_hash text not null,
  language text not null default 'ko',
  phone text unique not null,
  birth_year smallint,
  emergency_summary jsonb,  -- 응급 시 표시할 요약 (알레르기·만성질환 픽토그램)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 2. 진단서
-- ============================================================
create table public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  image_url text not null,
  ocr_text text,
  ocr_confidence numeric,
  pictogram_sequence jsonb,  -- 팀원 모듈 출력 그대로 저장
  doctor_name text,
  hospital text,
  issued_date date,
  note_voice_url text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 3. 약 정보 (진단서에서 추출된 개별 약)
-- ============================================================
create table public.medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prescription_id uuid references public.prescriptions(id) on delete set null,
  name text not null,
  pictogram_morpheme_id text,  -- 예: pill.round.red
  dosage_per_time integer not null,
  duration_days integer,
  remaining_count integer,
  started_at date,
  ended_at date,
  active boolean not null default true,
  rxnorm_code text,  -- 상호작용 검사용
  created_at timestamptz not null default now()
);

-- ============================================================
-- 4. 복약 스케줄 (하루 중 시각)
-- ============================================================
create table public.medication_schedules (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid not null references public.medications(id) on delete cascade,
  time_of_day time not null,
  with_meal text,  -- 'before' | 'after' | 'with' | null
  active boolean not null default true
);

-- ============================================================
-- 5. 복약 기록
-- ============================================================
create table public.medication_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  medication_id uuid not null references public.medications(id) on delete cascade,
  schedule_id uuid references public.medication_schedules(id) on delete set null,
  taken_at timestamptz not null default now(),
  skipped boolean not null default false,
  late_minutes integer,
  via text  -- 'tap' | 'voice'
);

-- ============================================================
-- 6. 건강 일지
-- ============================================================
create table public.health_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recorded_at timestamptz not null default now(),
  mood_level smallint check (mood_level between 1 and 5),
  pain_locations jsonb,  -- [{body_part: 'head', intensity: 3}, ...]
  symptoms jsonb,        -- [{morpheme_id: 'symptom.dizzy'}, ...]
  note_voice_url text,
  related_medication_log_id uuid references public.medication_logs(id) on delete set null
);

-- ============================================================
-- 7. 사진 경과 기록
-- ============================================================
create table public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  photo_url text not null,
  body_part text,
  taken_at timestamptz not null default now(),
  note_voice_url text
);

-- ============================================================
-- 8. 백신 접종
-- ============================================================
create table public.vaccinations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vaccine_code text not null,
  vaccine_name text,
  administered_at timestamptz,
  scheduled_at timestamptz,
  dose_number integer default 1,
  completed boolean not null default false
);

-- ============================================================
-- 9. 만성질환
-- ============================================================
create table public.chronic_conditions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  condition_code text not null,
  display_name text,
  diagnosed_at date,
  note_voice_url text
);

-- ============================================================
-- 10. 의료기기 설명서
-- ============================================================
create table public.device_manuals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  image_url text not null,
  device_name text,
  ocr_text text,
  pictogram_sequence jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 11. QR 공유 토큰 (일회용)
-- ============================================================
create table public.share_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  scope jsonb not null,  -- {type: 'all'|'recent'|'specific_meds', filter: {...}}
  expires_at timestamptz not null,
  consumed_at timestamptz,
  consumed_by_ip inet,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 12. 응급 연락처
-- ============================================================
create table public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text not null,
  relation text,
  priority integer default 1
);

-- ============================================================
-- 13. 약물 상호작용 경고 캐시
-- ============================================================
create table public.interaction_warnings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  med_a_id uuid not null references public.medications(id) on delete cascade,
  med_b_id uuid not null references public.medications(id) on delete cascade,
  severity text not null check (severity in ('mild', 'moderate', 'severe')),
  rxnorm_data jsonb,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 14. 알람 스케줄
-- ============================================================
create table public.alarm_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  alarm_type text not null check (alarm_type in ('medication', 'vaccine', 'low_supply', 'epidemic', 'chronic_check')),
  ref_id uuid,
  trigger_at timestamptz not null,
  payload jsonb,
  sent_at timestamptz,
  dismissed_at timestamptz
);

-- ============================================================
-- 인덱스
-- ============================================================
create index idx_prescriptions_user_id on public.prescriptions(user_id);
create index idx_medications_user_active on public.medications(user_id, active);
create index idx_medication_logs_user_taken on public.medication_logs(user_id, taken_at desc);
create index idx_health_logs_user_recorded on public.health_logs(user_id, recorded_at desc);
create index idx_share_tokens_token on public.share_tokens(token);
create index idx_share_tokens_unconsumed on public.share_tokens(expires_at) where consumed_at is null;
create index idx_alarm_schedules_pending on public.alarm_schedules(trigger_at) where sent_at is null;
create index idx_interaction_warnings_user on public.interaction_warnings(user_id, severity);

-- ============================================================
-- Row Level Security 활성화
-- ============================================================
alter table public.user_profiles enable row level security;
alter table public.prescriptions enable row level security;
alter table public.medications enable row level security;
alter table public.medication_schedules enable row level security;
alter table public.medication_logs enable row level security;
alter table public.health_logs enable row level security;
alter table public.progress_photos enable row level security;
alter table public.vaccinations enable row level security;
alter table public.chronic_conditions enable row level security;
alter table public.device_manuals enable row level security;
alter table public.share_tokens enable row level security;
alter table public.emergency_contacts enable row level security;
alter table public.interaction_warnings enable row level security;
alter table public.alarm_schedules enable row level security;

-- ============================================================
-- 기본 RLS 정책 (사용자는 본인 데이터만)
-- ============================================================
-- user_profiles
create policy "profile_own_select" on public.user_profiles for select using (auth.uid() = id);
create policy "profile_own_update" on public.user_profiles for update using (auth.uid() = id);
create policy "profile_own_insert" on public.user_profiles for insert with check (auth.uid() = id);

-- 나머지 테이블 공통 패턴: user_id = auth.uid()
do $$
declare
  tbl text;
  user_tables text[] := array[
    'prescriptions', 'medications', 'medication_logs',
    'health_logs', 'progress_photos', 'vaccinations',
    'chronic_conditions', 'device_manuals', 'share_tokens',
    'emergency_contacts', 'interaction_warnings', 'alarm_schedules'
  ];
begin
  foreach tbl in array user_tables loop
    execute format('create policy "%s_own_select" on public.%I for select using (auth.uid() = user_id);', tbl, tbl);
    execute format('create policy "%s_own_insert" on public.%I for insert with check (auth.uid() = user_id);', tbl, tbl);
    execute format('create policy "%s_own_update" on public.%I for update using (auth.uid() = user_id);', tbl, tbl);
    execute format('create policy "%s_own_delete" on public.%I for delete using (auth.uid() = user_id);', tbl, tbl);
  end loop;
end $$;

-- medication_schedules는 medications를 통해 user 확인
create policy "schedules_own_all" on public.medication_schedules
  for all using (
    exists (
      select 1 from public.medications m
      where m.id = medication_schedules.medication_id
        and m.user_id = auth.uid()
    )
  );

-- ============================================================
-- QR 공유 토큰 검증 함수 (의료진 웹에서 호출)
-- ============================================================
create or replace function public.consume_share_token(p_token text, p_ip inet)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_token record;
begin
  select * into v_token
  from public.share_tokens
  where token = p_token
    and consumed_at is null
    and expires_at > now();

  if not found then
    return jsonb_build_object('error', 'invalid_or_expired');
  end if;

  update public.share_tokens
  set consumed_at = now(), consumed_by_ip = p_ip
  where id = v_token.id;

  return jsonb_build_object(
    'user_id', v_token.user_id,
    'scope', v_token.scope,
    'consumed_at', now()
  );
end;
$$;

-- ============================================================
-- 잔여량 자동 감소 트리거
-- ============================================================
create or replace function public.decrement_medication_remaining()
returns trigger
language plpgsql
as $$
begin
  if new.skipped = false then
    update public.medications
    set remaining_count = greatest(0, remaining_count - (
      select dosage_per_time from public.medications where id = new.medication_id
    ))
    where id = new.medication_id;
  end if;
  return new;
end;
$$;

create trigger trg_decrement_remaining
  after insert on public.medication_logs
  for each row execute function public.decrement_medication_remaining();
