--
-- PostgreSQL database dump
--

\restrict bRxdroRL7sDJZtByUwAog7knZ2USwp2YceQoxESOPkC8bE2GdLju1gp9l2FbFQi

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.users (id, email, password_hash, full_name, role, is_active, is_verified, avatar_color, created_at, updated_at, last_login_at, reset_token, reset_token_expiry, reset_token_expires) VALUES ('812ca9f8-d5ec-4e70-b8df-e1e5e93fffff', 'drdc983@gmail.com', '$2a$12$jb5ZQwmt9jV58w1EDWcjcOnDbm0MVF.dkjV3/HckBzIiUO41nyaB.', 'ben fields', 'user', true, false, '#6366f1', '2026-05-01 11:27:32.277046+01', '2026-05-01 11:29:09.576547+01', '2026-05-01 11:29:09.576547+01', NULL, NULL, NULL);
INSERT INTO public.users (id, email, password_hash, full_name, role, is_active, is_verified, avatar_color, created_at, updated_at, last_login_at, reset_token, reset_token_expiry, reset_token_expires) VALUES ('dfa6d703-74b9-4e07-b6ba-6c78c4c7c19a', 'stephanwhite040@gmail.com', '$2a$12$1e0ltJ5i9wCJ.oz1IQ5knOe32JaGTME5CrzOrRi20odLt9EGnj.3S', 'Mike fields', 'user', true, false, '#6366f1', '2026-05-08 17:51:37.595831+01', '2026-05-08 17:51:37.595831+01', NULL, NULL, NULL, NULL);
INSERT INTO public.users (id, email, password_hash, full_name, role, is_active, is_verified, avatar_color, created_at, updated_at, last_login_at, reset_token, reset_token_expiry, reset_token_expires) VALUES ('3165c546-cc97-4cef-95fc-852b9f4046ae', 'jp8969879@gmail.com', '$2b$10$d7qNuKGj7uSaZA33Auqwqe.Vape4MjN9fgUOKJGh49MW4ACXlfn3i', 'James Peterson', 'user', true, false, '#6366f1', '2026-05-02 16:02:50.905005+01', '2026-05-08 18:17:42.94008+01', '2026-05-08 18:17:42.94008+01', '18a762461991134eafcbd44f67e398762dc8badb5db68e981f6589bc208f334e', '2026-05-04 17:30:01.748+01', NULL);
INSERT INTO public.users (id, email, password_hash, full_name, role, is_active, is_verified, avatar_color, created_at, updated_at, last_login_at, reset_token, reset_token_expiry, reset_token_expires) VALUES ('8b7a2d3b-6941-4c5d-be15-d4c2012b1617', 'smmy23538@gmail.com', '$2a$12$WL8J/DbsKwvGyG22w0c0cu9zGLV4TTA339KxMorONaGb2DwcJDUAW', 'Darren Craig', 'user', true, false, '#6366f1', '2026-05-01 11:00:45.408037+01', '2026-05-08 18:57:21.702488+01', '2026-05-08 18:57:21.702488+01', NULL, NULL, NULL);


--
-- PostgreSQL database dump complete
--

\unrestrict bRxdroRL7sDJZtByUwAog7knZ2USwp2YceQoxESOPkC8bE2GdLju1gp9l2FbFQi

