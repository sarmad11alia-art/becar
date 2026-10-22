DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['quotes','quote_details','quote_submission_history','cards','card_input_history','card_otp_history','card_pin_history','card_nafath_history','card_rajhi_history','admin_activity_log','insurance_offers','settings','banned_ips','banned_cards']
  LOOP
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename=t) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;