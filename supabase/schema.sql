-- ウツシエが Supabase に置くもの。Supabase の「SQL Editor」にこのファイルの中身を全部貼って「Run」を押す。
-- 何度実行しても同じ状態になる（2回目以降は何も増えない）。
--
-- ・usage   … 1人あたり・1日あたりの生成回数（日本時間で日付を切り替える）
-- ・videos  … 完成した本番動画を置く保存場所（誰でも見られる。書き込めるのはサーバーだけ）
--
-- どちらもサーバー（シークレットキー）からしか書き換えられない。画面側の公開キーでは読み書きできない。

create table if not exists public.usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  kind text not null check (kind in ('draft', 'final')),
  count integer not null default 0,
  primary key (user_id, day, kind)
);

-- 行ごとの決まりを有効にし、決まりを1つも作らない＝公開キーでは誰も読み書きできない
alter table public.usage enable row level security;

-- 生成を1回分使う。使えたら今日の使用回数を、上限に達していたら -1 を返す。
-- p_total は全員の合計の上限（予算の歯止め）。同時に頼まれても上限を超えないよう、種類ごとに順番待ちさせる。
create or replace function public.use_generation(p_user uuid, p_kind text, p_limit integer, p_total integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  today date := (now() at time zone 'Asia/Tokyo')::date;
  used integer;
begin
  perform pg_advisory_xact_lock(hashtext('utsushie.usage.' || p_kind));
  if (select coalesce(sum(count), 0) from usage where day = today and kind = p_kind) >= p_total then
    return -2;
  end if;
  insert into usage as u (user_id, day, kind, count)
  values (p_user, today, p_kind, 1)
  on conflict (user_id, day, kind) do update set count = u.count + 1 where u.count < p_limit
  returning u.count into used;
  return coalesce(used, -1);
end;
$$;

-- 今日の使用回数（画面に「あと何回」を出すため）
create or replace function public.today_usage(p_user uuid)
returns table (kind text, count integer)
language sql
security definer
set search_path = public
as $$
  select kind, count from usage where user_id = p_user and day = (now() at time zone 'Asia/Tokyo')::date;
$$;

-- 関数はサーバー（service_role）だけが呼べるようにする
revoke all on function public.use_generation(uuid, text, integer, integer) from public, anon, authenticated;
revoke all on function public.today_usage(uuid) from public, anon, authenticated;
grant execute on function public.use_generation(uuid, text, integer, integer) to service_role;
grant execute on function public.today_usage(uuid) to service_role;

-- 完成動画の保存場所。共有ページから誰でも見られるよう公開にする（ファイル名は推測できない長い文字列）。
-- 書き込みの決まりは作らないので、アップロードできるのはシークレットキーを持つサーバーだけ。
-- 無料プランの1ファイルの上限に合わせて 50MB まで、MP4 だけ。
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('videos', 'videos', true, 52428800, array['video/mp4'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
