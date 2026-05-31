-- =============================================================================
-- Migration 0008 : assembly_notification table
-- Tracks email notifications sent to assembly participants (open AG + forgot username)
-- =============================================================================

create table public.assembly_notification (
  id uuid primary key default gen_random_uuid(),
  assembly_id uuid not null references public.assembly(id) on delete cascade,
  profile_id uuid references public.profile(id) on delete set null,
  email text not null,
  full_name text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  error_msg text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.assembly_notification is
  'Tracks email notifications for assembly open and forgot-username flows';

comment on column public.assembly_notification.id is
  'Unique notification record ID';

comment on column public.assembly_notification.assembly_id is
  'Reference to the assembly, cascade on delete';

comment on column public.assembly_notification.profile_id is
  'Optional reference to profile if identified user, set null on delete';

comment on column public.assembly_notification.email is
  'Recipient email address';

comment on column public.assembly_notification.full_name is
  'Recipient full name at time of notification';

comment on column public.assembly_notification.status is
  'Status of notification: pending, sent, or failed';

comment on column public.assembly_notification.error_msg is
  'Error message if status is failed';

comment on column public.assembly_notification.sent_at is
  'Timestamp when notification was successfully sent';

comment on column public.assembly_notification.created_at is
  'Timestamp when notification record was created';

-- Indexes for common queries
create index idx_assembly_notification_assembly_id
  on public.assembly_notification(assembly_id);

create index idx_assembly_notification_assembly_id_status
  on public.assembly_notification(assembly_id, status);
