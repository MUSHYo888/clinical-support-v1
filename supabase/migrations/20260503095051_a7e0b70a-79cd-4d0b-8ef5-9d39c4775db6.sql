-- Lock down SECURITY DEFINER helpers: only authenticated may execute
REVOKE EXECUTE ON FUNCTION public.user_can_access_assessment(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_can_access_assessment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Realtime channel authorization: scope subscriptions to provider's own data
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers subscribe to own patient channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Topic format: 'patients:<provider_uuid>' or 'assessments:<provider_uuid>'
  -- Or postgres_changes topics scoped via filter; restrict to topics containing the user's uid
  (realtime.topic() LIKE '%' || auth.uid()::text || '%')
  OR
  -- Allow postgres_changes broadcasts only when the row belongs to the user.
  -- Realtime evaluates RLS on the source table for postgres_changes; this policy
  -- restricts the messages table itself for broadcast/presence channels.
  (realtime.topic() = '')
);

CREATE POLICY "Providers publish only to own channels"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() LIKE '%' || auth.uid()::text || '%'
);