-- Створити тестового адміна через Supabase Auth Dashboard (email: test-admin@setlistsong.test)
-- Потім виконати цей SQL для підвищення ролі

UPDATE public.profiles
SET platform_role = 'admin', is_root_admin = false
WHERE id = '<user-id>';