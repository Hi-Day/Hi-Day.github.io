-- HomeQuest initial schema
-- Apply only after the Supabase project status is ACTIVE_HEALTHY.
-- All point/currency changes are written by SECURITY DEFINER RPCs, never by clients.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_homequest on auth.users;
create trigger on_auth_user_created_homequest
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('parent', 'child')),
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table if not exists public.quests (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null,
  category text not null check (category in ('home','math','reading','quran','english','other')),
  icon text not null default '⭐',
  description text not null default '',
  xp integer not null default 10 check (xp between 0 and 1000),
  coins integer not null default 1 check (coins between 0 and 1000),
  is_active boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quest_submissions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  quest_id uuid not null references public.quests(id) on delete restrict,
  child_user_id uuid not null references auth.users(id) on delete restrict,
  quest_snapshot jsonb not null,
  status text not null default 'pending' check (status in ('pending','approved','needs_retry')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  review_note text
);

create index if not exists quest_submissions_household_status_idx
  on public.quest_submissions (household_id, status, submitted_at desc);
create index if not exists quests_household_active_idx
  on public.quests (household_id, is_active);

create table if not exists public.xp_ledger (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_user_id uuid not null references auth.users(id) on delete restrict,
  delta integer not null check (delta > 0),
  source_type text not null,
  source_id uuid not null,
  created_at timestamptz not null default now(),
  unique (source_type, source_id)
);

create table if not exists public.coin_ledger (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_user_id uuid not null references auth.users(id) on delete restrict,
  delta integer not null check (delta <> 0),
  source_type text not null,
  source_id uuid not null,
  created_at timestamptz not null default now(),
  unique (source_type, source_id)
);

create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  description text not null default '',
  kind text not null check (kind in ('activity','privilege','item')),
  cost integer not null check (cost > 0),
  is_active boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  reward_id uuid not null references public.rewards(id) on delete restrict,
  child_user_id uuid not null references auth.users(id) on delete restrict,
  reward_snapshot jsonb not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id)
);

create table if not exists public.achievement_catalog (
  code text primary key,
  name text not null,
  description text not null default '',
  icon text not null default '🏅'
);

create table if not exists public.child_achievements (
  household_id uuid not null references public.households(id) on delete cascade,
  child_user_id uuid not null references auth.users(id) on delete cascade,
  achievement_code text not null references public.achievement_catalog(code),
  earned_at timestamptz not null default now(),
  primary key (household_id, child_user_id, achievement_code)
);

insert into public.achievement_catalog (code, name, description, icon) values
  ('first_quest','First Quest','Menyelesaikan misi pertama','🌟'),
  ('little_helper','Little Helper','Membantu pekerjaan rumah','🧹'),
  ('book_explorer','Book Explorer','Rajin membaca','📚'),
  ('number_star','Number Star','Berlatih matematika','🧠'),
  ('faith_journey','Faith Journey','Menjaga murajaah','🌙')
on conflict (code) do nothing;

create or replace function public.is_household_member(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.household_members hm
    where hm.household_id = p_household_id and hm.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_household_parent(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.household_members hm
    where hm.household_id = p_household_id
      and hm.user_id = (select auth.uid())
      and hm.role = 'parent'
  );
$$;

create or replace function public.create_household(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if length(trim(coalesce(p_name,''))) = 0 then raise exception 'Household name is required'; end if;
  insert into public.households (name, owner_user_id)
  values (trim(p_name), auth.uid()) returning id into v_household_id;
  insert into public.household_members (household_id, user_id, role)
  values (v_household_id, auth.uid(), 'parent');
  return v_household_id;
end;
$$;

create or replace function public.add_household_child(p_household_id uuid, p_child_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_household_parent(p_household_id) then raise exception 'Parent access required'; end if;
  insert into public.household_members (household_id, user_id, role)
  values (p_household_id, p_child_user_id, 'child');
end;
$$;

create or replace function public.submit_quest(p_quest_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
  v_role text;
  v_submission_id uuid;
  v_quest jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select q.household_id, to_jsonb(q) into v_household_id, v_quest
  from public.quests q where q.id = p_quest_id and q.is_active = true;
  if v_household_id is null then raise exception 'Quest not found or inactive'; end if;
  select hm.role into v_role from public.household_members hm
  where hm.household_id = v_household_id and hm.user_id = auth.uid();
  if v_role is distinct from 'child' then raise exception 'Child membership required'; end if;
  if exists (select 1 from public.quest_submissions s where s.quest_id = p_quest_id
             and s.child_user_id = auth.uid() and s.status = 'pending') then
    raise exception 'A submission is already pending for this quest';
  end if;
  insert into public.quest_submissions (household_id, quest_id, child_user_id, quest_snapshot)
  values (v_household_id, p_quest_id, auth.uid(), v_quest)
  returning id into v_submission_id;
  return v_submission_id;
end;
$$;

create or replace function public.approve_quest_submission(p_submission_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_submission public.quest_submissions%rowtype;
  v_xp integer;
  v_coins integer;
begin
  select * into v_submission from public.quest_submissions
  where id = p_submission_id for update;
  if not found then raise exception 'Submission not found'; end if;
  if not public.is_household_parent(v_submission.household_id) then raise exception 'Parent access required'; end if;
  if v_submission.status <> 'pending' then raise exception 'Submission is not pending'; end if;
  v_xp := greatest(0, coalesce((v_submission.quest_snapshot->>'xp')::integer, 0));
  v_coins := greatest(0, coalesce((v_submission.quest_snapshot->>'coins')::integer, 0));
  update public.quest_submissions set status = 'approved', reviewed_at = now(), reviewed_by = auth.uid()
  where id = p_submission_id;
  if v_xp > 0 then
    insert into public.xp_ledger (household_id, child_user_id, delta, source_type, source_id)
    values (v_submission.household_id, v_submission.child_user_id, v_xp, 'quest_submission', p_submission_id)
    on conflict (source_type, source_id) do nothing;
  end if;
  if v_coins > 0 then
    insert into public.coin_ledger (household_id, child_user_id, delta, source_type, source_id)
    values (v_submission.household_id, v_submission.child_user_id, v_coins, 'quest_submission', p_submission_id)
    on conflict (source_type, source_id) do nothing;
  end if;
end;
$$;

create or replace function public.request_reward(p_reward_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
  v_cost integer;
  v_balance integer;
  v_redemption_id uuid;
  v_reward jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select r.household_id, r.cost, to_jsonb(r) into v_household_id, v_cost, v_reward
  from public.rewards r where r.id = p_reward_id and r.is_active = true;
  if v_household_id is null then raise exception 'Reward not found or inactive'; end if;
  if not exists (select 1 from public.household_members hm where hm.household_id = v_household_id
                 and hm.user_id = auth.uid() and hm.role = 'child') then
    raise exception 'Child membership required';
  end if;
  select coalesce(sum(delta),0) into v_balance from public.coin_ledger
  where household_id = v_household_id and child_user_id = auth.uid();
  if v_balance < v_cost then raise exception 'Insufficient coins'; end if;
  insert into public.reward_redemptions (household_id, reward_id, child_user_id, reward_snapshot)
  values (v_household_id, p_reward_id, auth.uid(), v_reward)
  returning id into v_redemption_id;
  return v_redemption_id;
end;
$$;

create or replace function public.approve_reward_redemption(p_redemption_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_redemption public.reward_redemptions%rowtype;
  v_cost integer;
  v_balance integer;
begin
  select * into v_redemption from public.reward_redemptions
  where id = p_redemption_id for update;
  if not found then raise exception 'Redemption not found'; end if;
  if not public.is_household_parent(v_redemption.household_id) then raise exception 'Parent access required'; end if;
  if v_redemption.status <> 'pending' then raise exception 'Redemption is not pending'; end if;
  v_cost := (v_redemption.reward_snapshot->>'cost')::integer;
  select coalesce(sum(delta),0) into v_balance from public.coin_ledger
  where household_id = v_redemption.household_id and child_user_id = v_redemption.child_user_id;
  if v_balance < v_cost then raise exception 'Insufficient coins at approval time'; end if;
  update public.reward_redemptions set status = 'approved', reviewed_at = now(), reviewed_by = auth.uid()
  where id = p_redemption_id;
  insert into public.coin_ledger (household_id, child_user_id, delta, source_type, source_id)
  values (v_redemption.household_id, v_redemption.child_user_id, -v_cost, 'reward_redemption', p_redemption_id);
end;
$$;

create or replace function public.reject_reward_redemption(p_redemption_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_household_id uuid;
begin
  select household_id into v_household_id from public.reward_redemptions
  where id = p_redemption_id and status = 'pending' for update;
  if v_household_id is null then raise exception 'Pending redemption not found'; end if;
  if not public.is_household_parent(v_household_id) then raise exception 'Parent access required'; end if;
  update public.reward_redemptions set status = 'rejected', reviewed_at = now(), reviewed_by = auth.uid()
  where id = p_redemption_id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.quests enable row level security;
alter table public.quest_submissions enable row level security;
alter table public.xp_ledger enable row level security;
alter table public.coin_ledger enable row level security;
alter table public.rewards enable row level security;
alter table public.reward_redemptions enable row level security;
alter table public.achievement_catalog enable row level security;
alter table public.child_achievements enable row level security;

drop policy if exists "profile read own" on public.profiles;
create policy "profile read own" on public.profiles for select to authenticated using (id = (select auth.uid()));
drop policy if exists "profile update own" on public.profiles;
create policy "profile update own" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "household members read household" on public.households;
create policy "household members read household" on public.households for select to authenticated using (public.is_household_member(id));
drop policy if exists "parents update household" on public.households;
create policy "parents update household" on public.households for update to authenticated using (public.is_household_parent(id)) with check (public.is_household_parent(id));

drop policy if exists "members read membership" on public.household_members;
create policy "members read membership" on public.household_members for select to authenticated using (public.is_household_member(household_id));

drop policy if exists "members read quests" on public.quests;
create policy "members read quests" on public.quests for select to authenticated using (public.is_household_member(household_id));
drop policy if exists "parents insert quests" on public.quests;
create policy "parents insert quests" on public.quests for insert to authenticated with check (public.is_household_parent(household_id) and created_by = (select auth.uid()));
drop policy if exists "parents update quests" on public.quests;
create policy "parents update quests" on public.quests for update to authenticated using (public.is_household_parent(household_id)) with check (public.is_household_parent(household_id));
drop policy if exists "parents delete quests" on public.quests;
create policy "parents delete quests" on public.quests for delete to authenticated using (public.is_household_parent(household_id));

drop policy if exists "members read submissions" on public.quest_submissions;
create policy "members read submissions" on public.quest_submissions for select to authenticated using (public.is_household_member(household_id));
drop policy if exists "members read xp ledger" on public.xp_ledger;
create policy "members read xp ledger" on public.xp_ledger for select to authenticated using (public.is_household_member(household_id));
drop policy if exists "members read coin ledger" on public.coin_ledger;
create policy "members read coin ledger" on public.coin_ledger for select to authenticated using (public.is_household_member(household_id));

drop policy if exists "members read rewards" on public.rewards;
create policy "members read rewards" on public.rewards for select to authenticated using (public.is_household_member(household_id));
drop policy if exists "parents insert rewards" on public.rewards;
create policy "parents insert rewards" on public.rewards for insert to authenticated with check (public.is_household_parent(household_id) and created_by = (select auth.uid()));
drop policy if exists "parents update rewards" on public.rewards;
create policy "parents update rewards" on public.rewards for update to authenticated using (public.is_household_parent(household_id)) with check (public.is_household_parent(household_id));
drop policy if exists "parents delete rewards" on public.rewards;
create policy "parents delete rewards" on public.rewards for delete to authenticated using (public.is_household_parent(household_id));

drop policy if exists "members read redemptions" on public.reward_redemptions;
create policy "members read redemptions" on public.reward_redemptions for select to authenticated using (public.is_household_member(household_id));
drop policy if exists "members read achievement catalog" on public.achievement_catalog;
create policy "members read achievement catalog" on public.achievement_catalog for select to authenticated using (true);
drop policy if exists "members read child achievements" on public.child_achievements;
create policy "members read child achievements" on public.child_achievements for select to authenticated using (public.is_household_member(household_id));

revoke all on function public.is_household_member(uuid) from public;
revoke all on function public.is_household_parent(uuid) from public;
revoke all on function public.create_household(text) from public;
revoke all on function public.add_household_child(uuid,uuid) from public;
revoke all on function public.submit_quest(uuid) from public;
revoke all on function public.approve_quest_submission(uuid) from public;
revoke all on function public.request_reward(uuid) from public;
revoke all on function public.approve_reward_redemption(uuid) from public;
revoke all on function public.reject_reward_redemption(uuid) from public;

grant execute on function public.is_household_member(uuid) to authenticated;
grant execute on function public.is_household_parent(uuid) to authenticated;
grant execute on function public.create_household(text) to authenticated;
grant execute on function public.add_household_child(uuid,uuid) to authenticated;
grant execute on function public.submit_quest(uuid) to authenticated;
grant execute on function public.approve_quest_submission(uuid) to authenticated;
grant execute on function public.request_reward(uuid) to authenticated;
grant execute on function public.approve_reward_redemption(uuid) to authenticated;
grant execute on function public.reject_reward_redemption(uuid) to authenticated;

grant select, update on public.profiles to authenticated;
grant select, update on public.households to authenticated;
grant select on public.household_members to authenticated;
grant select, insert, update, delete on public.quests to authenticated;
grant select on public.quest_submissions, public.xp_ledger, public.coin_ledger to authenticated;
grant select, insert, update, delete on public.rewards to authenticated;
grant select on public.reward_redemptions, public.achievement_catalog, public.child_achievements to authenticated;
