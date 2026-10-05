-- Optional phone number on contact form messages.
alter table public.contact_messages add column if not exists phone text;
