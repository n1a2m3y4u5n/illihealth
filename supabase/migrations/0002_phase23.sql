-- Phase 2-3 추가 테이블
-- 만성질환, 백신, 사진경과, 감염병 경보

-- ============================================================
-- 사용자 만성질환 목록
-- ============================================================
create table if not exists public.user_chronic_conditions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  condition_id  text not null,  -- 'hypertension', 'diabetes' 등
  diagnosed_at  date,
  created_at    timestamptz default now()
);

alter table public.user_chronic_conditions enable row level security;

create policy "own chronic" on public.user_chronic_conditions
  for all using (auth.uid() = user_id);

-- ============================================================
-- 백신 접종 기록
-- ============================================================
create table if not exists public.vaccine_records (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete cascade not null,
  vaccine_id     text not null,  -- 'flu', 'covid' 등
  vaccinated_at  timestamptz not null default now(),
  next_due_at    timestamptz,
  created_at     timestamptz default now()
);

alter table public.vaccine_records enable row level security;

create policy "own vaccines" on public.vaccine_records
  for all using (auth.uid() = user_id);

-- ============================================================
-- 사진 경과 기록
-- ============================================================
create table if not exists public.photo_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  photo_url   text not null,
  note        text,
  taken_at    timestamptz default now()
);

alter table public.photo_logs enable row level security;

create policy "own photo logs" on public.photo_logs
  for all using (auth.uid() = user_id);

-- ============================================================
-- Storage 버킷 — 사진 경과용
-- ============================================================
insert into storage.buckets (id, name, public)
values ('photo-logs', 'photo-logs', true)
on conflict (id) do nothing;

create policy "users can upload photo logs"
  on storage.objects for insert
  with check (bucket_id = 'photo-logs' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "public read photo logs"
  on storage.objects for select
  using (bucket_id = 'photo-logs');

-- ============================================================
-- health_logs 테이블에 related_medication_log_id 컬럼 추가
-- (0001에 없을 경우)
-- ============================================================
alter table public.health_logs
  add column if not exists related_medication_log_id uuid references public.medication_logs(id) on delete set null,
  add column if not exists mood_score smallint check (mood_score between 1 and 5),
  add column if not exists pain_areas text[] default '{}';
