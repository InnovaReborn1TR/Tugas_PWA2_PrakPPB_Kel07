-- Required by src/services/reviewService.js.
-- Run this script in the Supabase SQL Editor for the project used by the app.

create table if not exists public.review_reactions (
  review_id bigint not null references public.reviews(id) on delete cascade,
  user_id text not null,
  reaction text not null check (reaction in ('like', 'dislike')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (review_id, user_id)
);

create index if not exists review_reactions_review_id_idx
  on public.review_reactions (review_id);

alter table public.review_reactions enable row level security;

drop policy if exists "Public can read review reactions" on public.review_reactions;
create policy "Public can read review reactions"
  on public.review_reactions for select
  to anon, authenticated
  using (true);

drop policy if exists "Public can add review reactions" on public.review_reactions;
create policy "Public can add review reactions"
  on public.review_reactions for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Public can change review reactions" on public.review_reactions;
create policy "Public can change review reactions"
  on public.review_reactions for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "Public can remove review reactions" on public.review_reactions;
create policy "Public can remove review reactions"
  on public.review_reactions for delete
  to anon, authenticated
  using (true);
