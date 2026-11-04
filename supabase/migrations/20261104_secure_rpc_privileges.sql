-- Tighten public EXECUTE privileges for pre-existing SECURITY DEFINER helpers.
-- Preserve authenticated RPCs needed by NANTI. Trigger function is not a user-facing RPC.
revoke execute on function public.create_pair() from public, anon;
revoke execute on function public.join_pair(text) from public, anon;
revoke execute on function public.current_pair_id() from public, anon;
revoke execute on function public.update_display_name(text) from public, anon;
revoke execute on function public.on_user_created() from public, anon, authenticated;
grant execute on function public.create_pair() to authenticated;
grant execute on function public.join_pair(text) to authenticated;
grant execute on function public.current_pair_id() to authenticated;
grant execute on function public.update_display_name(text) to authenticated;
