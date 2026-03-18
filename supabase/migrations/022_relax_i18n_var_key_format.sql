-- 022_relax_i18n_var_key_format.sql
-- Allow camelCase/PascalCase segments in i18n variable keys.
-- Current catalog contains keys like admin.createAdmin.namePlaceholder,
-- which do not satisfy the old lowercase-only constraint.

begin;

alter table public.i18n_variables
  drop constraint if exists i18n_variables_key_format;

alter table public.i18n_variables
  add constraint i18n_variables_key_format
  check (var_key ~ '^[A-Za-z0-9_]+(\.[A-Za-z0-9_]+)+$');

commit;
