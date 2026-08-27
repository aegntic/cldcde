create table if not exists entitlements (
  email text primary key,
  sku text not null,
  status text not null check (status in ('active', 'trialing', 'past_due', 'canceled', 'none')),
  stripe_customer_id text,
  stripe_subscription_id text,
  updated_at timestamptz not null default now()
);

create index if not exists entitlements_status_idx on entitlements (status);
