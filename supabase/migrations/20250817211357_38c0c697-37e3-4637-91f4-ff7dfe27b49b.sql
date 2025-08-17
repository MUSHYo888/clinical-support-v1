-- Fix Function Search Path security issue by updating the function to be more secure
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- Set more secure Auth OTP expiry (24 hours instead of default 7 days)
-- Note: This would typically be done through Supabase dashboard Auth settings
-- Adding a comment here as reminder to update in dashboard