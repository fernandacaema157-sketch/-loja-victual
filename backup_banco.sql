--
-- PostgreSQL database dump
--

\restrict EkJEU2p0awn69vjsf17EJg0Zc0zMstoqqrwGsIokxGL6ocv9C7feuB5BzqtLcwe

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cart_items (
    id integer NOT NULL,
    user_id text NOT NULL,
    product_id integer NOT NULL,
    size text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    price numeric(10,2) NOT NULL,
    custom_name text,
    custom_number text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.cart_items OWNER TO postgres;

--
-- Name: cart_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cart_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cart_items_id_seq OWNER TO postgres;

--
-- Name: cart_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cart_items_id_seq OWNED BY public.cart_items.id;


--
-- Name: guest_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.guest_orders (
    id integer NOT NULL,
    order_number text NOT NULL,
    guest_name text NOT NULL,
    whatsapp text NOT NULL,
    items jsonb NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    total numeric(10,2) NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.guest_orders OWNER TO postgres;

--
-- Name: guest_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.guest_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.guest_orders_id_seq OWNER TO postgres;

--
-- Name: guest_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.guest_orders_id_seq OWNED BY public.guest_orders.id;


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id integer NOT NULL,
    order_id integer NOT NULL,
    product_id integer NOT NULL,
    product_name text NOT NULL,
    team text NOT NULL,
    size text NOT NULL,
    quantity integer NOT NULL,
    price numeric(10,2) NOT NULL,
    custom_name text,
    custom_number text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_items_id_seq OWNER TO postgres;

--
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    user_id text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    shipping_cost numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    total numeric(10,2) NOT NULL,
    shipping_method text DEFAULT 'standard'::text NOT NULL,
    address_line1 text NOT NULL,
    address_line2 text,
    city text NOT NULL,
    state text NOT NULL,
    zip_code text NOT NULL,
    country text DEFAULT 'BR'::text NOT NULL,
    payment_method text,
    payment_status text DEFAULT 'pending'::text NOT NULL,
    transaction_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name text NOT NULL,
    team text NOT NULL,
    description text NOT NULL,
    price numeric(10,2) NOT NULL,
    image_url text,
    sizes text[] DEFAULT '{}'::text[] NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    allow_customization boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: cart_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items ALTER COLUMN id SET DEFAULT nextval('public.cart_items_id_seq'::regclass);


--
-- Name: guest_orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guest_orders ALTER COLUMN id SET DEFAULT nextval('public.guest_orders_id_seq'::regclass);


--
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cart_items (id, user_id, product_id, size, quantity, price, custom_name, custom_number, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: guest_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.guest_orders (id, order_number, guest_name, whatsapp, items, subtotal, total, status, notes, created_at, updated_at) FROM stdin;
1	G07976031	tfghgfhf	98985161840	[{"size": "G", "team": "PSG", "price": 259.9, "quantity": 2, "productId": 3, "productName": "PSG Third Jersey 2024"}]	519.80	519.80	pending	gfhfgh	2026-05-08 15:44:39.771324+00	2026-05-08 15:44:39.771324+00
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (id, order_id, product_id, product_name, team, size, quantity, price, custom_name, custom_number, created_at) FROM stdin;
1	1	1	Real Madrid Home Jersey 2024	Real Madrid	GG	1	249.90	\N	\N	2026-05-05 17:28:20.967302+00
2	2	6	Argentina World Cup Jersey	Argentina	M	3	289.90	\N	\N	2026-05-08 15:53:54.312248+00
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, user_id, status, subtotal, shipping_cost, total, shipping_method, address_line1, address_line2, city, state, zip_code, country, payment_method, payment_status, transaction_id, created_at, updated_at) FROM stdin;
1	user_3DJYzKIxfc52deKWpi9o9sImeWv	processing	249.90	19.90	269.80	standard	rua 10	rosa de saron	São Luís	ma	65058-456	BR	credit_card	paid	TXN-1778002149998-V1234F	2026-05-05 17:28:20.933196+00	2026-05-05 17:29:09.998+00
2	user_3DRrAahsziGjXtypeMuvQlqGFQL	processing	869.70	39.90	909.60	express	ggfhgfh	fghgfh	fghfgh	fghfgh	65061000	BR	credit_card	paid	TXN-1778255651175-NNG69G	2026-05-08 15:53:54.306571+00	2026-05-08 15:54:11.176+00
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, name, team, description, price, image_url, sizes, stock, is_featured, allow_customization, created_at, updated_at) FROM stdin;
1	Real Madrid Home Jersey 2024	Real Madrid	Camiseta oficial do Real Madrid para a temporada 2024. Design clássico branco com detalhes dourados.	249.90	/images/real-madrid.png	{P,M,G,GG}	50	t	t	2026-05-04 20:08:04.630351+00	2026-05-04 20:08:04.630351+00
2	Barcelona Away Jersey 2024	Barcelona	Camiseta alternativa do Barcelona com design moderno em amarelo e azul.	239.90	/images/barcelona.png	{P,M,G,GG}	35	t	t	2026-05-04 20:08:07.340792+00	2026-05-04 20:08:07.340792+00
3	PSG Third Jersey 2024	PSG	Camiseta third do Paris Saint-Germain com estilo urbano e detalhes neon.	259.90	/images/psg.png	{P,M,G,GG}	28	t	t	2026-05-04 20:08:08.872317+00	2026-05-04 20:08:08.872317+00
4	Manchester United Home Jersey	Manchester United	Camiseta titular do Manchester United em vermelho clássico com listras pretas.	229.90	/images/man-united.png	{P,M,G,GG}	42	f	t	2026-05-04 20:08:10.250925+00	2026-05-04 20:08:10.250925+00
5	Seleção Brasil Home Jersey	Brasil	Camiseta oficial da Seleção Brasileira. Orgulhe-se das cores verde e amarelo.	299.90	/images/brasil.png	{P,M,G,GG}	60	t	t	2026-05-04 20:08:11.820541+00	2026-05-04 20:08:11.820541+00
6	Argentina World Cup Jersey	Argentina	Camiseta comemorativa da Argentina campeã do mundo. Azul e branco eternos.	289.90	/images/argentina.png	{P,M,G,GG}	45	t	t	2026-05-04 20:08:13.18567+00	2026-05-04 20:08:13.18567+00
7	Bayern Munich Home Jersey	Bayern Munich	Camiseta titular do Bayern de Munique. Vermelho e branco com elegância alemã.	219.90	/images/bayern.png	{P,M,G,GG}	30	f	t	2026-05-04 20:08:17.642674+00	2026-05-04 20:08:17.642674+00
8	Liverpool Home Jersey 2024	Liverpool	Camiseta oficial do Liverpool FC. Vermelho vibrante com detalhes dourados.	234.90	/images/liverpool.png	{P,M,G,GG}	38	f	t	2026-05-04 20:08:19.066083+00	2026-05-04 20:08:19.066083+00
9	Manchester City Away Jersey	Manchester City	Camiseta alternativa do Manchester City em azul celeste com design moderno.	244.90	/images/man-united.png	{P,M,G,GG}	22	f	t	2026-05-04 20:08:22.542898+00	2026-05-04 20:08:22.542898+00
10	Atlético Madrid Third Jersey	Atlético Madrid	Camiseta third do Atlético de Madrid com listras verticais vermelho e branco.	214.90	/images/real-madrid.png	{P,M,G,GG}	18	f	t	2026-05-04 20:08:23.7864+00	2026-05-04 20:08:23.7864+00
\.


--
-- Name: cart_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cart_items_id_seq', 2, true);


--
-- Name: guest_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.guest_orders_id_seq', 1, true);


--
-- Name: order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_items_id_seq', 2, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_id_seq', 2, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 10, true);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: guest_orders guest_orders_order_number_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guest_orders
    ADD CONSTRAINT guest_orders_order_number_unique UNIQUE (order_number);


--
-- Name: guest_orders guest_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guest_orders
    ADD CONSTRAINT guest_orders_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict EkJEU2p0awn69vjsf17EJg0Zc0zMstoqqrwGsIokxGL6ocv9C7feuB5BzqtLcwe

