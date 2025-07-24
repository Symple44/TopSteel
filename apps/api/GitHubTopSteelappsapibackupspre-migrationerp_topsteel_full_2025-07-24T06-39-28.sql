--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13
-- Dumped by pg_dump version 15.13

-- Started on 2025-07-24 08:39:30

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

ALTER TABLE ONLY public.ui_preferences_reorderable_list DROP CONSTRAINT fk_reorderable_preferences_user;
ALTER TABLE ONLY public.datatable_hierarchy_order DROP CONSTRAINT fk_hierarchy_order_user;
ALTER TABLE ONLY public.datatable_hierarchy_order DROP CONSTRAINT fk_hierarchy_order_preferences;
ALTER TABLE ONLY public.datatable_hierarchical_preferences DROP CONSTRAINT fk_hierarchical_preferences_user;
ALTER TABLE ONLY public.user_settings DROP CONSTRAINT "FK_user_settings_user";
ALTER TABLE ONLY public.user_sessions DROP CONSTRAINT "FK_user_sessions_userId";
ALTER TABLE ONLY public.user_sessions DROP CONSTRAINT "FK_user_sessions_forcedLogoutBy";
ALTER TABLE ONLY public.user_roles DROP CONSTRAINT "FK_user_roles_userId";
ALTER TABLE ONLY public.user_roles DROP CONSTRAINT "FK_user_roles_roleId";
ALTER TABLE ONLY public.user_mfa DROP CONSTRAINT "FK_user_mfa_userId";
ALTER TABLE ONLY public.user_menu_preferences DROP CONSTRAINT "FK_user_menu_preferences_user";
ALTER TABLE ONLY public.user_menu_preferences_old DROP CONSTRAINT "FK_user_menu_preferences_old_user";
ALTER TABLE ONLY public.user_menu_item_preferences DROP CONSTRAINT "FK_user_menu_item_preferences_user";
ALTER TABLE ONLY public.user_groups DROP CONSTRAINT "FK_user_groups_user";
ALTER TABLE ONLY public.user_groups DROP CONSTRAINT "FK_user_groups_group";
ALTER TABLE ONLY public.stocks DROP CONSTRAINT "FK_stocks_produit";
ALTER TABLE ONLY public.role_permissions DROP CONSTRAINT "FK_role_permissions_roleId";
ALTER TABLE ONLY public.role_permissions DROP CONSTRAINT "FK_role_permissions_permissionId";
ALTER TABLE ONLY public.qualite DROP CONSTRAINT "FK_qualite_production";
ALTER TABLE ONLY public.qualite DROP CONSTRAINT "FK_qualite_controleur";
ALTER TABLE ONLY public.projets DROP CONSTRAINT "FK_projets_client";
ALTER TABLE ONLY public.produits DROP CONSTRAINT "FK_produits_materiau";
ALTER TABLE ONLY public.production DROP CONSTRAINT "FK_production_ordre_fabrication";
ALTER TABLE ONLY public.production DROP CONSTRAINT "FK_production_operation";
ALTER TABLE ONLY public.production DROP CONSTRAINT "FK_production_operateur";
ALTER TABLE ONLY public.production DROP CONSTRAINT "FK_production_machine";
ALTER TABLE ONLY public.planning DROP CONSTRAINT "FK_planning_production";
ALTER TABLE ONLY public.planning DROP CONSTRAINT "FK_planning_machine";
ALTER TABLE ONLY public.planning DROP CONSTRAINT "FK_planning_assignee";
ALTER TABLE ONLY public.permissions DROP CONSTRAINT "FK_permissions_moduleId";
ALTER TABLE ONLY public.ordre_fabrication DROP CONSTRAINT "FK_ordre_fabrication_produit";
ALTER TABLE ONLY public.ordre_fabrication DROP CONSTRAINT "FK_ordre_fabrication_commande";
ALTER TABLE ONLY public.operations DROP CONSTRAINT "FK_operations_machine";
ALTER TABLE ONLY public.notifications DROP CONSTRAINT "FK_notifications_sender";
ALTER TABLE ONLY public.notification_settings DROP CONSTRAINT "FK_notification_settings_user";
ALTER TABLE ONLY public.notification_rules DROP CONSTRAINT "FK_notification_rules_template";
ALTER TABLE ONLY public.notification_rule_executions DROP CONSTRAINT "FK_notification_rule_executions_rule";
ALTER TABLE ONLY public.notification_rule_executions DROP CONSTRAINT "FK_notification_rule_executions_event";
ALTER TABLE ONLY public.notification_reads DROP CONSTRAINT "FK_notification_reads_user";
ALTER TABLE ONLY public.notification_reads DROP CONSTRAINT "FK_notification_reads_notification";
ALTER TABLE ONLY public.modules DROP CONSTRAINT "FK_modules_parentModuleId";
ALTER TABLE ONLY public.mfa_session DROP CONSTRAINT "FK_mfa_session_userId";
ALTER TABLE ONLY public.menu_items DROP CONSTRAINT "FK_menu_items_parentId";
ALTER TABLE ONLY public.menu_items DROP CONSTRAINT "FK_menu_items_configId";
ALTER TABLE ONLY public.menu_item_roles DROP CONSTRAINT "FK_menu_item_roles_roleId";
ALTER TABLE ONLY public.menu_item_roles DROP CONSTRAINT "FK_menu_item_roles_menuItemId";
ALTER TABLE ONLY public.menu_item_permissions DROP CONSTRAINT "FK_menu_item_permissions_permissionId";
ALTER TABLE ONLY public.menu_item_permissions DROP CONSTRAINT "FK_menu_item_permissions_menuItemId";
ALTER TABLE ONLY public.materiaux DROP CONSTRAINT "FK_materiaux_fournisseur";
ALTER TABLE ONLY public.maintenance DROP CONSTRAINT "FK_maintenance_technicien";
ALTER TABLE ONLY public.maintenance DROP CONSTRAINT "FK_maintenance_machine";
ALTER TABLE ONLY public.ligne_devis DROP CONSTRAINT "FK_ligne_devis_produit";
ALTER TABLE ONLY public.ligne_devis DROP CONSTRAINT "FK_ligne_devis_devis";
ALTER TABLE ONLY public.facturation DROP CONSTRAINT "FK_facturation_commande";
ALTER TABLE ONLY public.facturation DROP CONSTRAINT "FK_facturation_client";
ALTER TABLE ONLY public.devis DROP CONSTRAINT "FK_devis_projet";
ALTER TABLE ONLY public.devis DROP CONSTRAINT "FK_devis_client";
ALTER TABLE ONLY public.commandes DROP CONSTRAINT "FK_commandes_devis";
ALTER TABLE ONLY public.commandes DROP CONSTRAINT "FK_commandes_client";
ALTER TABLE ONLY public.chutes DROP CONSTRAINT "FK_chutes_materiau";
DROP TRIGGER update_ui_preferences_reorderable_list_updated_at ON public.ui_preferences_reorderable_list;
DROP TRIGGER update_datatable_hierarchy_order_updated_at ON public.datatable_hierarchy_order;
DROP TRIGGER update_datatable_hierarchical_preferences_updated_at ON public.datatable_hierarchical_preferences;
DROP INDEX public."user_menu_preferences_admin_userId_unique";
DROP INDEX public.idx_reorderable_preferences_user_id;
DROP INDEX public.idx_reorderable_preferences_updated_at;
DROP INDEX public.idx_reorderable_preferences_component_id;
DROP INDEX public.idx_discovered_pages_page_id;
DROP INDEX public.idx_discovered_pages_is_enabled;
DROP INDEX public.idx_discovered_pages_category;
DROP INDEX public.idx_datatable_hierarchy_user_table;
DROP INDEX public.idx_datatable_hierarchy_updated_at;
DROP INDEX public.idx_datatable_hierarchy_path;
DROP INDEX public.idx_datatable_hierarchy_parent_id;
DROP INDEX public.idx_datatable_hierarchy_level;
DROP INDEX public.idx_datatable_hierarchy_display_order;
DROP INDEX public.idx_datatable_hierarchical_user_id;
DROP INDEX public.idx_datatable_hierarchical_updated_at;
DROP INDEX public.idx_datatable_hierarchical_table_id;
DROP INDEX public."IDX_user_settings_userId";
DROP INDEX public."IDX_user_sessions_userId";
DROP INDEX public."IDX_user_sessions_status";
DROP INDEX public."IDX_user_sessions_sessionId";
DROP INDEX public."IDX_user_sessions_loginTime";
DROP INDEX public."IDX_user_sessions_lastActivity";
DROP INDEX public."IDX_user_sessions_isActive";
DROP INDEX public."IDX_user_menu_preferences_old_user_id";
DROP INDEX public."IDX_user_menu_preferences_old_menu_id";
DROP INDEX public."IDX_roles_name";
DROP INDEX public."IDX_roles_isSystemRole";
DROP INDEX public."IDX_roles_isActive";
DROP INDEX public."IDX_role_permissions_role_permission";
DROP INDEX public."IDX_role_permissions_roleId";
DROP INDEX public."IDX_role_permissions_permissionId";
DROP INDEX public."IDX_permissions_module_action";
DROP INDEX public."IDX_permissions_moduleId";
DROP INDEX public."IDX_modules_name";
DROP INDEX public."IDX_modules_isActive";
DROP INDEX public."IDX_modules_category";
DROP INDEX public."IDX_menu_items_parentId";
DROP INDEX public."IDX_menu_items_orderIndex";
DROP INDEX public."IDX_menu_items_configId";
DROP INDEX public."IDX_menu_configurations_name";
DROP INDEX public."IDX_menu_configurations_isSystem";
DROP INDEX public."IDX_menu_configurations_isActive";
ALTER TABLE ONLY public.user_sessions DROP CONSTRAINT "user_sessions_sessionId_key";
ALTER TABLE ONLY public.user_sessions DROP CONSTRAINT user_sessions_pkey;
ALTER TABLE ONLY public.user_roles DROP CONSTRAINT user_roles_pkey;
ALTER TABLE ONLY public.datatable_hierarchy_order DROP CONSTRAINT unique_user_table_item;
ALTER TABLE ONLY public.datatable_hierarchical_preferences DROP CONSTRAINT unique_user_table;
ALTER TABLE ONLY public.ui_preferences_reorderable_list DROP CONSTRAINT unique_user_component;
ALTER TABLE ONLY public.ui_preferences_reorderable_list DROP CONSTRAINT ui_preferences_reorderable_list_pkey;
ALTER TABLE ONLY public.seeds_status DROP CONSTRAINT seeds_status_pkey;
ALTER TABLE ONLY public.seeds_status DROP CONSTRAINT seeds_status_name_key;
ALTER TABLE ONLY public.roles DROP CONSTRAINT roles_pkey;
ALTER TABLE ONLY public.roles DROP CONSTRAINT roles_name_key;
ALTER TABLE ONLY public.role_permissions DROP CONSTRAINT role_permissions_pkey;
ALTER TABLE ONLY public.permissions DROP CONSTRAINT permissions_pkey;
ALTER TABLE ONLY public.modules DROP CONSTRAINT modules_pkey;
ALTER TABLE ONLY public.modules DROP CONSTRAINT modules_name_key;
ALTER TABLE ONLY public.menu_items DROP CONSTRAINT menu_items_pkey;
ALTER TABLE ONLY public.menu_item_roles DROP CONSTRAINT menu_item_roles_pkey;
ALTER TABLE ONLY public.menu_item_permissions DROP CONSTRAINT menu_item_permissions_pkey;
ALTER TABLE ONLY public.menu_configurations DROP CONSTRAINT menu_configurations_pkey;
ALTER TABLE ONLY public.menu_configurations DROP CONSTRAINT menu_configurations_name_key;
ALTER TABLE ONLY public.discovered_pages DROP CONSTRAINT discovered_pages_pkey;
ALTER TABLE ONLY public.discovered_pages DROP CONSTRAINT discovered_pages_page_id_key;
ALTER TABLE ONLY public.datatable_hierarchy_order DROP CONSTRAINT datatable_hierarchy_order_pkey;
ALTER TABLE ONLY public.datatable_hierarchical_preferences DROP CONSTRAINT datatable_hierarchical_preferences_pkey;
ALTER TABLE ONLY public.users DROP CONSTRAINT "UQ_users_email";
ALTER TABLE ONLY public.users DROP CONSTRAINT "UQ_users_acronyme";
ALTER TABLE ONLY public.user_settings DROP CONSTRAINT "UQ_user_settings_userId";
ALTER TABLE ONLY public.user_roles DROP CONSTRAINT "UQ_user_role";
ALTER TABLE ONLY public.user_menu_preferences_admin DROP CONSTRAINT "UQ_user_menu_preferences_admin_userId";
ALTER TABLE ONLY public.user_menu_preferences DROP CONSTRAINT "UQ_user_menu_preferences";
ALTER TABLE ONLY public.user_menu_item_preferences DROP CONSTRAINT "UQ_user_menu_item_preferences";
ALTER TABLE ONLY public.user_groups DROP CONSTRAINT "UQ_user_groups";
ALTER TABLE ONLY public.test_products DROP CONSTRAINT "UQ_test_products_sku";
ALTER TABLE ONLY public.test_orders DROP CONSTRAINT "UQ_test_orders_orderNumber";
ALTER TABLE ONLY public.system_settings DROP CONSTRAINT "UQ_system_settings_key";
ALTER TABLE ONLY public.system_parameters DROP CONSTRAINT "UQ_system_parameters_key";
ALTER TABLE ONLY public.role_permissions DROP CONSTRAINT "UQ_role_permission";
ALTER TABLE ONLY public.produits DROP CONSTRAINT "UQ_produits_code";
ALTER TABLE ONLY public.permissions DROP CONSTRAINT "UQ_permission_module_action";
ALTER TABLE ONLY public.ordre_fabrication DROP CONSTRAINT "UQ_ordre_fabrication_numero";
ALTER TABLE ONLY public.operations DROP CONSTRAINT "UQ_operations_code";
ALTER TABLE ONLY public.notification_templates DROP CONSTRAINT "UQ_notification_templates_code";
ALTER TABLE ONLY public.notification_settings DROP CONSTRAINT "UQ_notification_settings";
ALTER TABLE ONLY public.notification_reads DROP CONSTRAINT "UQ_notification_reads";
ALTER TABLE ONLY public.mfa_session DROP CONSTRAINT "UQ_mfa_session_sessionToken";
ALTER TABLE ONLY public.menu_item_roles DROP CONSTRAINT "UQ_menu_item_role";
ALTER TABLE ONLY public.menu_item_permissions DROP CONSTRAINT "UQ_menu_item_permission";
ALTER TABLE ONLY public.materiaux DROP CONSTRAINT "UQ_materiaux_code";
ALTER TABLE ONLY public.machines DROP CONSTRAINT "UQ_machines_code";
ALTER TABLE ONLY public.groups DROP CONSTRAINT "UQ_groups_code";
ALTER TABLE ONLY public.fournisseurs DROP CONSTRAINT "UQ_fournisseurs_code";
ALTER TABLE ONLY public.facturation DROP CONSTRAINT "UQ_facturation_numero";
ALTER TABLE ONLY public.devis DROP CONSTRAINT "UQ_devis_numero";
ALTER TABLE ONLY public.commandes DROP CONSTRAINT "UQ_commandes_numero";
ALTER TABLE ONLY public.clients DROP CONSTRAINT "UQ_clients_numero_client";
ALTER TABLE ONLY public.clients DROP CONSTRAINT "UQ_clients_email";
ALTER TABLE ONLY public.users DROP CONSTRAINT "PK_users";
ALTER TABLE ONLY public.user_settings DROP CONSTRAINT "PK_user_settings";
ALTER TABLE ONLY public.user_mfa DROP CONSTRAINT "PK_user_mfa";
ALTER TABLE ONLY public.user_menu_preferences_old DROP CONSTRAINT "PK_user_menu_preferences_old";
ALTER TABLE ONLY public.user_menu_preferences_admin DROP CONSTRAINT "PK_user_menu_preferences_admin";
ALTER TABLE ONLY public.user_menu_preferences DROP CONSTRAINT "PK_user_menu_preferences";
ALTER TABLE ONLY public.user_menu_item_preferences DROP CONSTRAINT "PK_user_menu_item_preferences";
ALTER TABLE ONLY public.user_groups DROP CONSTRAINT "PK_user_groups";
ALTER TABLE ONLY public.tracabilite DROP CONSTRAINT "PK_tracabilite";
ALTER TABLE ONLY public.test_products DROP CONSTRAINT "PK_test_products";
ALTER TABLE ONLY public.test_orders DROP CONSTRAINT "PK_test_orders";
ALTER TABLE ONLY public.test_order_items DROP CONSTRAINT "PK_test_order_items";
ALTER TABLE ONLY public.test_categories DROP CONSTRAINT "PK_test_categories";
ALTER TABLE ONLY public.system_settings DROP CONSTRAINT "PK_system_settings";
ALTER TABLE ONLY public.system_parameters DROP CONSTRAINT "PK_system_parameters";
ALTER TABLE ONLY public.stocks DROP CONSTRAINT "PK_stocks";
ALTER TABLE ONLY public.query_builders DROP CONSTRAINT "PK_query_builders";
ALTER TABLE ONLY public.query_builder_permissions DROP CONSTRAINT "PK_query_builder_permissions";
ALTER TABLE ONLY public.query_builder_joins DROP CONSTRAINT "PK_query_builder_joins";
ALTER TABLE ONLY public.query_builder_columns DROP CONSTRAINT "PK_query_builder_columns";
ALTER TABLE ONLY public.query_builder_calculated_fields DROP CONSTRAINT "PK_query_builder_calculated_fields";
ALTER TABLE ONLY public.qualite DROP CONSTRAINT "PK_qualite";
ALTER TABLE ONLY public.projets DROP CONSTRAINT "PK_projets";
ALTER TABLE ONLY public.produits DROP CONSTRAINT "PK_produits";
ALTER TABLE ONLY public.production DROP CONSTRAINT "PK_production";
ALTER TABLE ONLY public.planning DROP CONSTRAINT "PK_planning";
ALTER TABLE ONLY public.ordre_fabrication DROP CONSTRAINT "PK_ordre_fabrication";
ALTER TABLE ONLY public.operations DROP CONSTRAINT "PK_operations";
ALTER TABLE ONLY public.notifications DROP CONSTRAINT "PK_notifications";
ALTER TABLE ONLY public.notification_templates DROP CONSTRAINT "PK_notification_templates";
ALTER TABLE ONLY public.notification_settings DROP CONSTRAINT "PK_notification_settings";
ALTER TABLE ONLY public.notification_rules DROP CONSTRAINT "PK_notification_rules";
ALTER TABLE ONLY public.notification_rule_executions DROP CONSTRAINT "PK_notification_rule_executions";
ALTER TABLE ONLY public.notification_reads DROP CONSTRAINT "PK_notification_reads";
ALTER TABLE ONLY public.notification_events DROP CONSTRAINT "PK_notification_events";
ALTER TABLE ONLY public.mfa_session DROP CONSTRAINT "PK_mfa_session";
ALTER TABLE ONLY public.materiaux DROP CONSTRAINT "PK_materiaux";
ALTER TABLE ONLY public.maintenance DROP CONSTRAINT "PK_maintenance";
ALTER TABLE ONLY public.machines DROP CONSTRAINT "PK_machines";
ALTER TABLE ONLY public.ligne_devis DROP CONSTRAINT "PK_ligne_devis";
ALTER TABLE ONLY public.groups DROP CONSTRAINT "PK_groups";
ALTER TABLE ONLY public.fournisseurs DROP CONSTRAINT "PK_fournisseurs";
ALTER TABLE ONLY public.facturation DROP CONSTRAINT "PK_facturation";
ALTER TABLE ONLY public.documents DROP CONSTRAINT "PK_documents";
ALTER TABLE ONLY public.devis DROP CONSTRAINT "PK_devis";
ALTER TABLE ONLY public.commandes DROP CONSTRAINT "PK_commandes";
ALTER TABLE ONLY public.clients DROP CONSTRAINT "PK_clients";
ALTER TABLE ONLY public.chutes DROP CONSTRAINT "PK_chutes";
ALTER TABLE ONLY public.migrations DROP CONSTRAINT "PK_8c82d7f526340ab734260ea46be";
ALTER TABLE public.seeds_status ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.migrations ALTER COLUMN id DROP DEFAULT;
DROP TABLE public.users;
DROP TABLE public.user_settings_backup;
DROP TABLE public.user_settings;
DROP TABLE public.user_sessions;
DROP TABLE public.user_roles;
DROP TABLE public.user_mfa;
DROP TABLE public.user_menu_preferences_old;
DROP TABLE public.user_menu_preferences_admin;
DROP TABLE public.user_menu_preferences;
DROP TABLE public.user_menu_item_preferences;
DROP TABLE public.user_groups;
DROP TABLE public.ui_preferences_reorderable_list;
DROP TABLE public.typeorm_metadata;
DROP TABLE public.tracabilite;
DROP TABLE public.test_products;
DROP TABLE public.test_orders;
DROP TABLE public.test_order_items;
DROP TABLE public.test_categories;
DROP TABLE public.system_settings;
DROP TABLE public.system_parameters;
DROP TABLE public.stocks;
DROP SEQUENCE public.seeds_status_id_seq;
DROP TABLE public.seeds_status;
DROP TABLE public.roles;
DROP TABLE public.role_permissions;
DROP TABLE public.query_builders;
DROP TABLE public.query_builder_permissions;
DROP TABLE public.query_builder_joins;
DROP TABLE public.query_builder_columns;
DROP TABLE public.query_builder_calculated_fields;
DROP TABLE public.qualite;
DROP TABLE public.projets;
DROP TABLE public.produits;
DROP TABLE public.production;
DROP TABLE public.planning;
DROP TABLE public.permissions;
DROP TABLE public.ordre_fabrication;
DROP TABLE public.operations;
DROP TABLE public.notifications;
DROP TABLE public.notification_templates;
DROP TABLE public.notification_settings;
DROP TABLE public.notification_rules;
DROP TABLE public.notification_rule_executions;
DROP TABLE public.notification_reads;
DROP TABLE public.notification_events;
DROP TABLE public.modules;
DROP SEQUENCE public.migrations_id_seq;
DROP TABLE public.migrations;
DROP TABLE public.mfa_session;
DROP TABLE public.menu_items;
DROP TABLE public.menu_item_roles;
DROP TABLE public.menu_item_permissions;
DROP TABLE public.menu_configurations;
DROP TABLE public.materiaux;
DROP TABLE public.maintenance;
DROP TABLE public.machines;
DROP TABLE public.ligne_devis;
DROP TABLE public.groups;
DROP TABLE public.fournisseurs;
DROP TABLE public.facturation;
DROP TABLE public.documents;
DROP TABLE public.discovered_pages;
DROP TABLE public.devis;
DROP TABLE public.datatable_hierarchy_order;
DROP TABLE public.datatable_hierarchical_preferences;
DROP TABLE public.commandes;
DROP TABLE public.clients;
DROP TABLE public.chutes;
DROP FUNCTION public.update_updated_at_column();
DROP TYPE public.session_status;
DROP TYPE public.module_category;
DROP TYPE public.access_level;
DROP EXTENSION "uuid-ossp";
--
-- TOC entry 2 (class 3079 OID 95563)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 4344 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 1066 (class 1247 OID 98440)
-- Name: access_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.access_level AS ENUM (
    'BLOCKED',
    'read',
    'WRITE',
    'DELETE',
    'ADMIN'
);


--
-- TOC entry 1063 (class 1247 OID 98430)
-- Name: module_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.module_category AS ENUM (
    'CORE',
    'BUSINESS',
    'ADMIN',
    'REPORTS'
);


--
-- TOC entry 1042 (class 1247 OID 98084)
-- Name: session_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.session_status AS ENUM (
    'active',
    'ended',
    'forced_logout',
    'expired'
);


--
-- TOC entry 293 (class 1255 OID 106401)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 229 (class 1259 OID 95832)
-- Name: chutes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chutes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    materiau_id uuid NOT NULL,
    longueur numeric(10,2),
    largeur numeric(10,2),
    epaisseur numeric(10,2),
    poids numeric(10,4),
    origine character varying(255),
    utilisable boolean DEFAULT true NOT NULL,
    emplacement character varying(255),
    notes text,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


--
-- TOC entry 220 (class 1259 OID 95630)
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom character varying(255) NOT NULL,
    prenom character varying(255),
    email character varying(255),
    telephone character varying(20),
    adresse text,
    ville character varying(100),
    code_postal character varying(10),
    pays character varying(100) DEFAULT 'France'::character varying,
    entreprise character varying(255),
    siret character varying(14),
    numero_client character varying(50),
    actif boolean DEFAULT true NOT NULL,
    notes text,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


--
-- TOC entry 234 (class 1259 OID 95906)
-- Name: commandes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.commandes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    numero character varying(100) NOT NULL,
    devis_id uuid,
    client_id uuid NOT NULL,
    date_commande timestamp without time zone DEFAULT now() NOT NULL,
    date_livraison_prevue timestamp without time zone,
    date_livraison_reelle timestamp without time zone,
    statut character varying(50) DEFAULT 'nouvelle'::character varying NOT NULL,
    priorite character varying(50) DEFAULT 'normale'::character varying,
    montant_ht numeric(10,2) DEFAULT 0 NOT NULL,
    montant_tva numeric(10,2) DEFAULT 0 NOT NULL,
    montant_ttc numeric(10,2) DEFAULT 0 NOT NULL,
    notes text,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


--
-- TOC entry 280 (class 1259 OID 106308)
-- Name: datatable_hierarchical_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.datatable_hierarchical_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    table_id character varying(100) NOT NULL,
    hierarchy_config jsonb DEFAULT '{"maxDepth": 10, "levelField": "level", "orderField": "display_order", "parentField": "parent_id", "allowNesting": true, "childrenField": "children", "expandedNodes": [], "defaultExpanded": true}'::jsonb NOT NULL,
    reorder_config jsonb DEFAULT '{"autoExpand": true, "enableDragDrop": true, "allowLevelChange": true, "dragHandleVisible": true, "preserveHierarchy": true, "dropIndicatorStyle": "line"}'::jsonb NOT NULL,
    display_config jsonb DEFAULT '{"indentSize": 24, "compactMode": false, "levelColors": [], "collapsibleGroups": true, "showConnectionLines": true, "showLevelIndicators": true}'::jsonb NOT NULL,
    hierarchy_filters jsonb DEFAULT '{"showOnlyLevels": [], "hideEmptyParents": false, "searchInChildren": true, "filterPreservesHierarchy": true}'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_indent_size CHECK (((((display_config ->> 'indentSize'::text))::integer >= 8) AND (((display_config ->> 'indentSize'::text))::integer <= 64))),
    CONSTRAINT check_max_depth CHECK (((((hierarchy_config ->> 'maxDepth'::text))::integer >= 1) AND (((hierarchy_config ->> 'maxDepth'::text))::integer <= 20))),
    CONSTRAINT check_table_id_format CHECK ((((table_id)::text ~ '^[a-zA-Z0-9_-]+$'::text) AND (length((table_id)::text) >= 3)))
);


--
-- TOC entry 281 (class 1259 OID 106335)
-- Name: datatable_hierarchy_order; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.datatable_hierarchy_order (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    table_id character varying(100) NOT NULL,
    item_id character varying(100) NOT NULL,
    parent_id character varying(100) DEFAULT NULL::character varying,
    display_order integer DEFAULT 0 NOT NULL,
    level integer DEFAULT 0 NOT NULL,
    path character varying(1000) DEFAULT NULL::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_display_order_positive CHECK ((display_order >= 0)),
    CONSTRAINT check_item_id_format CHECK ((((item_id)::text ~ '^[a-zA-Z0-9_-]+$'::text) AND (length((item_id)::text) >= 1))),
    CONSTRAINT check_level_range CHECK (((level >= 0) AND (level <= 19))),
    CONSTRAINT check_parent_id_format CHECK (((parent_id IS NULL) OR (((parent_id)::text ~ '^[a-zA-Z0-9_-]+$'::text) AND (length((parent_id)::text) >= 1)))),
    CONSTRAINT check_parent_not_self CHECK (((parent_id IS NULL) OR ((parent_id)::text <> (item_id)::text))),
    CONSTRAINT check_path_format CHECK (((path IS NULL) OR (length((path)::text) <= 1000)))
);


--
-- TOC entry 232 (class 1259 OID 95874)
-- Name: devis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.devis (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    numero character varying(100) NOT NULL,
    client_id uuid NOT NULL,
    projet_id uuid,
    date_devis timestamp without time zone DEFAULT now() NOT NULL,
    date_validite timestamp without time zone,
    statut character varying(50) DEFAULT 'brouillon'::character varying NOT NULL,
    montant_ht numeric(10,2) DEFAULT 0 NOT NULL,
    montant_tva numeric(10,2) DEFAULT 0 NOT NULL,
    montant_ttc numeric(10,2) DEFAULT 0 NOT NULL,
    taux_tva numeric(5,2) DEFAULT 20 NOT NULL,
    notes text,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


--
-- TOC entry 256 (class 1259 OID 96583)
-- Name: discovered_pages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.discovered_pages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    page_id character varying NOT NULL,
    title character varying NOT NULL,
    href character varying NOT NULL,
    description text,
    icon character varying,
    category character varying NOT NULL,
    subcategory character varying,
    required_permissions text,
    required_roles text,
    module_id character varying,
    is_enabled boolean DEFAULT true,
    is_visible boolean DEFAULT true,
    default_access_level character varying DEFAULT 'ADMIN'::character varying,
    default_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 241 (class 1259 OID 96010)
-- Name: documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documents (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom character varying(255) NOT NULL,
    type character varying(100),
    taille integer,
    mime_type character varying(255),
    chemin text NOT NULL,
    url text,
    description text,
    entity_type character varying(100),
    entity_id uuid,
    uploaded_by uuid,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


--
-- TOC entry 240 (class 1259 OID 95992)
-- Name: facturation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.facturation (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    numero character varying(100) NOT NULL,
    commande_id uuid,
    client_id uuid NOT NULL,
    date_facture timestamp without time zone DEFAULT now() NOT NULL,
    date_echeance timestamp without time zone,
    date_paiement timestamp without time zone,
    montant_ht numeric(10,2) DEFAULT 0 NOT NULL,
    montant_tva numeric(10,2) DEFAULT 0 NOT NULL,
    montant_ttc numeric(10,2) DEFAULT 0 NOT NULL,
    statut character varying(50) DEFAULT 'emise'::character varying NOT NULL,
    mode_paiement character varying(100),
    notes text,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


--
-- TOC entry 225 (class 1259 OID 95774)
-- Name: fournisseurs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fournisseurs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom character varying(255) NOT NULL,
    code character varying(100),
    email character varying(255),
    telephone character varying(20),
    adresse text,
    ville character varying(100),
    code_postal character varying(10),
    pays character varying(100) DEFAULT 'France'::character varying,
    siret character varying(14),
    tva character varying(20),
    notes text,
    actif boolean DEFAULT true NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


--
-- TOC entry 223 (class 1259 OID 95725)
-- Name: groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.groups (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(100) NOT NULL,
    description text,
    active boolean DEFAULT true NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


--
-- TOC entry 233 (class 1259 OID 95893)
-- Name: ligne_devis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ligne_devis (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    devis_id uuid NOT NULL,
    produit_id uuid,
    description text NOT NULL,
    quantite integer DEFAULT 1 NOT NULL,
    prix_unitaire numeric(10,2) NOT NULL,
    prix_total numeric(10,2) NOT NULL,
    ordre integer DEFAULT 0 NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


--
-- TOC entry 230 (class 1259 OID 95844)
-- Name: machines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.machines (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom character varying(255) NOT NULL,
    code character varying(100),
    type character varying(100),
    marque character varying(255),
    modele character varying(255),
    numero_serie character varying(255),
    date_achat timestamp without time zone,
    date_mise_service timestamp without time zone,
    statut character varying(50) DEFAULT 'operationnelle'::character varying,
    notes text,
    actif boolean DEFAULT true NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


--
-- TOC entry 239 (class 1259 OID 95980)
-- Name: maintenance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.maintenance (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    machine_id uuid NOT NULL,
    type character varying(100) NOT NULL,
    description text,
    date_prevue timestamp without time zone,
    date_realisee timestamp without time zone,
    duree integer,
    cout numeric(10,2),
    technicien_id uuid,
    statut character varying(50) DEFAULT 'planifie'::character varying NOT NULL,
    notes text,
    pieces_changees text,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


--
-- TOC entry 226 (class 1259 OID 95789)
-- Name: materiaux; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.materiaux (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom character varying(255) NOT NULL,
    code character varying(100),
    type character varying(100),
    description text,
    densite numeric(10,4),
    prix_unitaire numeric(10,2),
    unite character varying(50) DEFAULT 'kg'::character varying,
    fournisseur_id uuid,
    actif boolean DEFAULT true NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


--
-- TOC entry 260 (class 1259 OID 98192)
-- Name: menu_configurations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.menu_configurations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    "isActive" boolean DEFAULT false NOT NULL,
    "isSystem" boolean DEFAULT false NOT NULL,
    metadata json,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "updatedBy" uuid
);


--
-- TOC entry 267 (class 1259 OID 98509)
-- Name: menu_item_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.menu_item_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "menuItemId" uuid NOT NULL,
    "permissionId" uuid NOT NULL,
    "isRequired" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 264 (class 1259 OID 98382)
-- Name: menu_item_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.menu_item_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "menuItemId" uuid NOT NULL,
    "roleId" uuid NOT NULL,
    "isRequired" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 261 (class 1259 OID 98206)
-- Name: menu_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.menu_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "configId" uuid NOT NULL,
    "parentId" uuid,
    title character varying(255) NOT NULL,
    "titleKey" character varying(255),
    href character varying(500),
    icon character varying(50),
    gradient character varying(100),
    badge character varying(50),
    "orderIndex" integer DEFAULT 0 NOT NULL,
    "isVisible" boolean DEFAULT true NOT NULL,
    "moduleId" character varying(255),
    target character varying(50),
    metadata json,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 258 (class 1259 OID 98032)
-- Name: mfa_session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mfa_session (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid NOT NULL,
    "sessionToken" character varying NOT NULL,
    "mfaType" character varying NOT NULL,
    "isVerified" boolean DEFAULT false NOT NULL,
    "isExpired" boolean DEFAULT false NOT NULL,
    challenge text,
    "challengeId" character varying,
    "challengeOptions" jsonb,
    attempts integer DEFAULT 0 NOT NULL,
    "maxAttempts" integer DEFAULT 5 NOT NULL,
    "ipAddress" character varying,
    "userAgent" text,
    "expiresAt" timestamp without time zone DEFAULT (now() + '00:10:00'::interval) NOT NULL,
    "verifiedAt" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 216 (class 1259 OID 95575)
-- Name: migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


--
-- TOC entry 215 (class 1259 OID 95574)
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4345 (class 0 OID 0)
-- Dependencies: 215
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- TOC entry 265 (class 1259 OID 98451)
-- Name: modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.modules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text NOT NULL,
    category public.module_category DEFAULT 'BUSINESS'::public.module_category NOT NULL,
    icon character varying(50),
    "parentModuleId" uuid,
    "isActive" boolean DEFAULT true NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    metadata json,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 245 (class 1259 OID 96059)
-- Name: notification_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_events (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    type character varying(100) NOT NULL,
    entity_type character varying(100),
    entity_id uuid,
    data text,
    processed boolean DEFAULT false NOT NULL,
    processed_at timestamp without time zone,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


--
-- TOC entry 249 (class 1259 OID 96109)
-- Name: notification_reads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_reads (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    notification_id uuid NOT NULL,
    user_id uuid NOT NULL,
    read_at timestamp without time zone DEFAULT now() NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


--
-- TOC entry 246 (class 1259 OID 96071)
-- Name: notification_rule_executions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_rule_executions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    rule_id uuid NOT NULL,
    event_id uuid NOT NULL,
    success boolean DEFAULT true NOT NULL,
    error_message text,
    sent_at timestamp without time zone,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


--
-- TOC entry 244 (class 1259 OID 96047)
-- Name: notification_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_rules (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    event_type character varying(100) NOT NULL,
    conditions text,
    template_id uuid,
    recipients text,
    active boolean DEFAULT true NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


--
-- TOC entry 247 (class 1259 OID 96083)
-- Name: notification_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_settings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    type character varying(100) NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    channel character varying(100) DEFAULT 'email'::character varying NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


--
-- TOC entry 243 (class 1259 OID 96033)
-- Name: notification_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_templates (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(100) NOT NULL,
    type character varying(100) NOT NULL,
    subject character varying(255),
    body text,
    variables text,
    active boolean DEFAULT true NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


--
-- TOC entry 248 (class 1259 OID 96096)
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    type character varying(100) NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    data text,
    entity_type character varying(100),
    entity_id uuid,
    sender_id uuid,
    read boolean DEFAULT false NOT NULL,
    sent_at timestamp without time zone DEFAULT now() NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


--
-- TOC entry 231 (class 1259 OID 95859)
-- Name: operations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.operations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom character varying(255) NOT NULL,
    code character varying(100),
    description text,
    type character varying(100),
    machine_id uuid,
    duree_estimee integer,
    cout_horaire numeric(10,2),
    complexite character varying(50) DEFAULT 'moyenne'::character varying,
    actif boolean DEFAULT true NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


--
-- TOC entry 235 (class 1259 OID 95925)
-- Name: ordre_fabrication; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ordre_fabrication (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    numero character varying(100) NOT NULL,
    commande_id uuid,
    produit_id uuid NOT NULL,
    quantite_demandee integer NOT NULL,
    quantite_produite integer DEFAULT 0 NOT NULL,
    date_debut_prevue timestamp without time zone,
    date_fin_prevue timestamp without time zone,
    date_debut_reelle timestamp without time zone,
    date_fin_reelle timestamp without time zone,
    statut character varying(50) DEFAULT 'planifie'::character varying NOT NULL,
    priorite character varying(50) DEFAULT 'normale'::character varying,
    notes text,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


--
-- TOC entry 266 (class 1259 OID 98471)
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "moduleId" uuid NOT NULL,
    action character varying(100) NOT NULL,
    name character varying(200) NOT NULL,
    description text NOT NULL,
    level public.access_level DEFAULT 'read'::public.access_level NOT NULL,
    "isRequired" boolean DEFAULT false NOT NULL,
    conditions json,
    metadata json,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 237 (class 1259 OID 95955)
-- Name: planning; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planning (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    titre character varying(255) NOT NULL,
    description text,
    type character varying(100),
    date_debut timestamp without time zone NOT NULL,
    date_fin timestamp without time zone NOT NULL,
    statut character varying(50) DEFAULT 'planifie'::character varying NOT NULL,
    priorite character varying(50) DEFAULT 'normale'::character varying,
    assignee_id uuid,
    machine_id uuid,
    production_id uuid,
    notes text,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


--
-- TOC entry 236 (class 1259 OID 95941)
-- Name: production; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.production (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    ordre_fabrication_id uuid NOT NULL,
    operation_id uuid NOT NULL,
    machine_id uuid,
    operateur_id uuid,
    date_debut timestamp without time zone,
    date_fin timestamp without time zone,
    quantite_produite integer DEFAULT 0 NOT NULL,
    quantite_defectueuse integer DEFAULT 0 NOT NULL,
    temps_preparation integer,
    temps_production integer,
    statut character varying(50) DEFAULT 'planifie'::character varying NOT NULL,
    notes text,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


--
-- TOC entry 227 (class 1259 OID 95804)
-- Name: produits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.produits (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom character varying(255) NOT NULL,
    code character varying(100),
    description text,
    type character varying(100),
    materiau_id uuid,
    dimensions text,
    poids numeric(10,4),
    prix_unitaire numeric(10,2),
    stock_min integer DEFAULT 0,
    stock_max integer DEFAULT 0,
    actif boolean DEFAULT true NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


--
-- TOC entry 221 (class 1259 OID 95647)
-- Name: projets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom character varying(255) NOT NULL,
    description text,
    client_id uuid NOT NULL,
    statut character varying(50) DEFAULT 'nouveau'::character varying NOT NULL,
    date_debut timestamp without time zone,
    date_fin_prevue timestamp without time zone,
    date_fin_reelle timestamp without time zone,
    budget_estime numeric(10,2),
    budget_reel numeric(10,2),
    priorite character varying(20) DEFAULT 'moyenne'::character varying,
    notes text,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


--
-- TOC entry 238 (class 1259 OID 95968)
-- Name: qualite; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qualite (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    production_id uuid NOT NULL,
    controleur_id uuid NOT NULL,
    date_controle timestamp without time zone DEFAULT now() NOT NULL,
    type_controle character varying(100),
    resultat character varying(50) NOT NULL,
    notes text,
    mesures text,
    non_conformites text,
    actions_correctives text,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


--
-- TOC entry 274 (class 1259 OID 98799)
-- Name: query_builder_calculated_fields; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.query_builder_calculated_fields (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "queryBuilderId" uuid NOT NULL,
    name character varying NOT NULL,
    label character varying NOT NULL,
    description character varying,
    expression text NOT NULL,
    "dataType" character varying NOT NULL,
    "isVisible" boolean DEFAULT true NOT NULL,
    "displayOrder" integer NOT NULL,
    format jsonb,
    dependencies jsonb
);


--
-- TOC entry 272 (class 1259 OID 98777)
-- Name: query_builder_columns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.query_builder_columns (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "queryBuilderId" uuid NOT NULL,
    "tableName" character varying NOT NULL,
    "columnName" character varying NOT NULL,
    alias character varying NOT NULL,
    label character varying NOT NULL,
    description character varying,
    "dataType" character varying NOT NULL,
    "isPrimaryKey" boolean DEFAULT false NOT NULL,
    "isForeignKey" boolean DEFAULT false NOT NULL,
    "isVisible" boolean DEFAULT true NOT NULL,
    "isFilterable" boolean DEFAULT true NOT NULL,
    "isSortable" boolean DEFAULT true NOT NULL,
    "isGroupable" boolean DEFAULT false NOT NULL,
    "displayOrder" integer NOT NULL,
    width integer,
    format jsonb,
    aggregation jsonb
);


--
-- TOC entry 273 (class 1259 OID 98791)
-- Name: query_builder_joins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.query_builder_joins (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "queryBuilderId" uuid NOT NULL,
    "fromTable" character varying NOT NULL,
    "fromColumn" character varying NOT NULL,
    "toTable" character varying NOT NULL,
    "toColumn" character varying NOT NULL,
    "joinType" character varying NOT NULL,
    alias character varying NOT NULL,
    "order" integer NOT NULL
);


--
-- TOC entry 275 (class 1259 OID 98808)
-- Name: query_builder_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.query_builder_permissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "queryBuilderId" uuid NOT NULL,
    "permissionType" character varying NOT NULL,
    "userId" uuid,
    "roleId" uuid,
    "isAllowed" boolean DEFAULT true NOT NULL
);


--
-- TOC entry 271 (class 1259 OID 98766)
-- Name: query_builders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.query_builders (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    description character varying,
    database character varying NOT NULL,
    "mainTable" character varying NOT NULL,
    "isPublic" boolean DEFAULT false NOT NULL,
    "maxRows" integer,
    settings jsonb,
    layout jsonb,
    "createdById" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 268 (class 1259 OID 98534)
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "roleId" uuid NOT NULL,
    "permissionId" uuid NOT NULL,
    "accessLevel" public.access_level DEFAULT 'read'::public.access_level NOT NULL,
    "isGranted" boolean DEFAULT true NOT NULL,
    conditions json,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    metadata json,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" uuid
);


--
-- TOC entry 262 (class 1259 OID 98335)
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text NOT NULL,
    "isSystemRole" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    metadata json,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "updatedBy" uuid
);


--
-- TOC entry 253 (class 1259 OID 96462)
-- Name: seeds_status; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seeds_status (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 252 (class 1259 OID 96461)
-- Name: seeds_status_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.seeds_status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4346 (class 0 OID 0)
-- Dependencies: 252
-- Name: seeds_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.seeds_status_id_seq OWNED BY public.seeds_status.id;


--
-- TOC entry 228 (class 1259 OID 95820)
-- Name: stocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stocks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    produit_id uuid NOT NULL,
    quantite integer DEFAULT 0 NOT NULL,
    quantite_reservee integer DEFAULT 0 NOT NULL,
    quantite_disponible integer DEFAULT 0 NOT NULL,
    cout_unitaire numeric(10,2),
    emplacement character varying(255),
    lot character varying(100),
    date_entree timestamp without time zone,
    date_peremption timestamp without time zone,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


--
-- TOC entry 218 (class 1259 OID 95600)
-- Name: system_parameters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_parameters (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    key character varying(255) NOT NULL,
    value text NOT NULL,
    description text,
    type character varying(50) DEFAULT 'string'::character varying NOT NULL,
    category character varying(100) DEFAULT 'general'::character varying NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


--
-- TOC entry 219 (class 1259 OID 95615)
-- Name: system_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_settings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    key character varying(255) NOT NULL,
    value text NOT NULL,
    description text,
    type character varying(50) DEFAULT 'string'::character varying NOT NULL,
    category character varying(100) DEFAULT 'general'::character varying NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


--
-- TOC entry 276 (class 1259 OID 98817)
-- Name: test_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_categories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 279 (class 1259 OID 98853)
-- Name: test_order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_order_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "orderId" uuid NOT NULL,
    "productId" uuid NOT NULL,
    quantity integer NOT NULL,
    "unitPrice" numeric(10,2) NOT NULL,
    discount numeric(10,2) DEFAULT 0 NOT NULL,
    "totalPrice" numeric(10,2) NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 278 (class 1259 OID 98841)
-- Name: test_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_orders (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "orderNumber" character varying NOT NULL,
    "customerId" uuid NOT NULL,
    "orderDate" timestamp without time zone DEFAULT now() NOT NULL,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    "totalAmount" numeric(10,2) NOT NULL,
    "shippingAddress" text,
    notes text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 277 (class 1259 OID 98828)
-- Name: test_products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_products (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    sku character varying NOT NULL,
    name character varying NOT NULL,
    description text,
    "categoryId" uuid NOT NULL,
    price numeric(10,2) NOT NULL,
    cost numeric(10,2) NOT NULL,
    "stockQuantity" integer DEFAULT 0 NOT NULL,
    "minimumStock" integer DEFAULT 10 NOT NULL,
    weight numeric(10,3),
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 242 (class 1259 OID 96021)
-- Name: tracabilite; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tracabilite (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    entity_type character varying(100) NOT NULL,
    entity_id uuid NOT NULL,
    action character varying(100) NOT NULL,
    utilisateur_id uuid,
    date_action timestamp without time zone DEFAULT now() NOT NULL,
    donnees_avant text,
    donnees_apres text,
    ip_address character varying(45),
    user_agent text,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


--
-- TOC entry 255 (class 1259 OID 96571)
-- Name: typeorm_metadata; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.typeorm_metadata (
    type character varying NOT NULL,
    database character varying,
    schema character varying,
    "table" character varying,
    name character varying,
    value text
);


--
-- TOC entry 282 (class 1259 OID 106373)
-- Name: ui_preferences_reorderable_list; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ui_preferences_reorderable_list (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    component_id character varying(100) NOT NULL,
    theme character varying(50) DEFAULT 'default'::character varying NOT NULL,
    preferences jsonb DEFAULT '{"compactMode": false, "customColors": {}, "defaultExpanded": true, "enableAnimations": true, "showConnectionLines": true, "showLevelIndicators": true}'::jsonb NOT NULL,
    layout jsonb DEFAULT '{"maxDepth": 10, "allowNesting": true, "dragHandlePosition": "left", "expandButtonPosition": "left"}'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_component_id_format CHECK ((((component_id)::text ~ '^[a-zA-Z0-9_-]+$'::text) AND (length((component_id)::text) >= 3))),
    CONSTRAINT check_drag_handle_position CHECK (((layout ->> 'dragHandlePosition'::text) = ANY (ARRAY['left'::text, 'right'::text]))),
    CONSTRAINT check_expand_button_position CHECK (((layout ->> 'expandButtonPosition'::text) = ANY (ARRAY['left'::text, 'right'::text]))),
    CONSTRAINT check_max_depth_layout CHECK (((((layout ->> 'maxDepth'::text))::integer >= 1) AND (((layout ->> 'maxDepth'::text))::integer <= 20))),
    CONSTRAINT check_theme_values CHECK (((theme)::text = ANY ((ARRAY['default'::character varying, 'compact'::character varying, 'modern'::character varying, 'minimal'::character varying, 'colorful'::character varying])::text[])))
);


--
-- TOC entry 224 (class 1259 OID 95763)
-- Name: user_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_groups (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    group_id uuid NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


--
-- TOC entry 250 (class 1259 OID 96168)
-- Name: user_menu_item_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_menu_item_preferences (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    menu_item_id uuid NOT NULL,
    visible boolean DEFAULT true NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


--
-- TOC entry 251 (class 1259 OID 96181)
-- Name: user_menu_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_menu_preferences (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    menu_id character varying(255) NOT NULL,
    is_visible boolean DEFAULT true NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    custom_label character varying(255),
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


--
-- TOC entry 222 (class 1259 OID 95665)
-- Name: user_menu_preferences_admin; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_menu_preferences_admin (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid NOT NULL,
    "menuId" character varying(255) NOT NULL,
    "isVisible" boolean DEFAULT true NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "customLabel" character varying(255),
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


--
-- TOC entry 254 (class 1259 OID 96557)
-- Name: user_menu_preferences_old; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_menu_preferences_old (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    menu_id character varying(255) NOT NULL,
    is_visible boolean DEFAULT true NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    custom_label character varying(255),
    backup_date timestamp without time zone DEFAULT now() NOT NULL,
    reason character varying(255),
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


--
-- TOC entry 257 (class 1259 OID 98019)
-- Name: user_mfa; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_mfa (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid NOT NULL,
    type character varying DEFAULT 'totp'::character varying NOT NULL,
    "isEnabled" boolean DEFAULT false NOT NULL,
    "isVerified" boolean DEFAULT false NOT NULL,
    secret character varying(255),
    "backupCodes" character varying(255),
    "phoneNumber" character varying(255),
    email character varying(255),
    "webauthnCredentials" jsonb,
    metadata jsonb,
    "lastUsedAt" timestamp without time zone,
    "verifiedAt" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 263 (class 1259 OID 98349)
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "userId" uuid NOT NULL,
    "roleId" uuid NOT NULL,
    "assignedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "assignedBy" uuid
);


--
-- TOC entry 259 (class 1259 OID 98093)
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "userId" uuid NOT NULL,
    "sessionId" text NOT NULL,
    "accessToken" text NOT NULL,
    "refreshToken" text,
    "loginTime" timestamp without time zone NOT NULL,
    "logoutTime" timestamp without time zone,
    "lastActivity" timestamp without time zone NOT NULL,
    "ipAddress" inet,
    "userAgent" text,
    "deviceInfo" jsonb,
    location jsonb,
    "isActive" boolean DEFAULT true NOT NULL,
    "isIdle" boolean DEFAULT false NOT NULL,
    status public.session_status DEFAULT 'active'::public.session_status NOT NULL,
    "warningCount" integer DEFAULT 0 NOT NULL,
    "forcedLogoutBy" uuid,
    "forcedLogoutReason" text,
    metadata jsonb,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 270 (class 1259 OID 98578)
-- Name: user_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_settings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid NOT NULL,
    profile jsonb,
    company jsonb,
    preferences jsonb DEFAULT '{"theme": "vibrant", "language": "fr", "timezone": "Europe/Paris", "appearance": {"theme": "vibrant", "density": "comfortable", "fontSize": "medium", "language": "fr", "accentColor": "blue", "sidebarWidth": "normal"}, "notifications": {"sms": false, "push": true, "email": true, "pushTypes": {"quiet": true, "sound": true, "normal": false, "urgent": true, "enabled": true}, "emailTypes": {"newMessages": true, "systemAlerts": true, "taskReminders": false, "weeklyReports": true, "securityAlerts": true, "maintenanceNotice": false}, "quietHours": {"end": "07:00", "start": "22:00", "enabled": true}}}'::jsonb NOT NULL,
    metadata jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 269 (class 1259 OID 98573)
-- Name: user_settings_backup; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_settings_backup (
    id uuid,
    user_id uuid,
    key character varying(255),
    value text,
    type character varying(50),
    category character varying(100),
    version integer,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    deleted_at timestamp without time zone
);


--
-- TOC entry 217 (class 1259 OID 95583)
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom character varying(255) NOT NULL,
    prenom character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(50) DEFAULT 'OPERATEUR'::character varying NOT NULL,
    actif boolean DEFAULT true NOT NULL,
    acronyme character varying(10),
    dernier_login timestamp without time zone,
    version integer DEFAULT 1 NOT NULL,
    "refreshToken" character varying(500),
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


--
-- TOC entry 3455 (class 2604 OID 95578)
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- TOC entry 3667 (class 2604 OID 96465)
-- Name: seeds_status id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seeds_status ALTER COLUMN id SET DEFAULT nextval('public.seeds_status_id_seq'::regclass);


--
-- TOC entry 4285 (class 0 OID 95832)
-- Dependencies: 229
-- Data for Name: chutes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chutes (id, materiau_id, longueur, largeur, epaisseur, poids, origine, utilisable, emplacement, notes, version, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 4276 (class 0 OID 95630)
-- Dependencies: 220
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clients (id, nom, prenom, email, telephone, adresse, ville, code_postal, pays, entreprise, siret, numero_client, actif, notes, version, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 4290 (class 0 OID 95906)
-- Dependencies: 234
-- Data for Name: commandes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.commandes (id, numero, devis_id, client_id, date_commande, date_livraison_prevue, date_livraison_reelle, statut, priorite, montant_ht, montant_tva, montant_ttc, notes, version, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 4336 (class 0 OID 106308)
-- Dependencies: 280
-- Data for Name: datatable_hierarchical_preferences; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.datatable_hierarchical_preferences (id, user_id, table_id, hierarchy_config, reorder_config, display_config, hierarchy_filters, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4337 (class 0 OID 106335)
-- Dependencies: 281
-- Data for Name: datatable_hierarchy_order; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.datatable_hierarchy_order (id, user_id, table_id, item_id, parent_id, display_order, level, path, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4288 (class 0 OID 95874)
-- Dependencies: 232
-- Data for Name: devis; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.devis (id, numero, client_id, projet_id, date_devis, date_validite, statut, montant_ht, montant_tva, montant_ttc, taux_tva, notes, version, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 4312 (class 0 OID 96583)
-- Dependencies: 256
-- Data for Name: discovered_pages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.discovered_pages (id, page_id, title, href, description, icon, category, subcategory, required_permissions, required_roles, module_id, is_enabled, is_visible, default_access_level, default_order, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4297 (class 0 OID 96010)
-- Dependencies: 241
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.documents (id, nom, type, taille, mime_type, chemin, url, description, entity_type, entity_id, uploaded_by, version, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 4296 (class 0 OID 95992)
-- Dependencies: 240
-- Data for Name: facturation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.facturation (id, numero, commande_id, client_id, date_facture, date_echeance, date_paiement, montant_ht, montant_tva, montant_ttc, statut, mode_paiement, notes, version, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 4281 (class 0 OID 95774)
-- Dependencies: 225
-- Data for Name: fournisseurs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fournisseurs (id, nom, code, email, telephone, adresse, ville, code_postal, pays, siret, tva, notes, actif, version, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 4279 (class 0 OID 95725)
-- Dependencies: 223
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.groups (id, name, code, description, active, version, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 4289 (class 0 OID 95893)
-- Dependencies: 233
-- Data for Name: ligne_devis; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ligne_devis (id, devis_id, produit_id, description, quantite, prix_unitaire, prix_total, ordre, version, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 4286 (class 0 OID 95844)
-- Dependencies: 230
-- Data for Name: machines; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.machines (id, nom, code, type, marque, modele, numero_serie, date_achat, date_mise_service, statut, notes, actif, version, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 4295 (class 0 OID 95980)
-- Dependencies: 239
-- Data for Name: maintenance; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.maintenance (id, machine_id, type, description, date_prevue, date_realisee, duree, cout, technicien_id, statut, notes, pieces_changees, version, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 4282 (class 0 OID 95789)
-- Dependencies: 226
-- Data for Name: materiaux; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.materiaux (id, nom, code, type, description, densite, prix_unitaire, unite, fournisseur_id, actif, version, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 4316 (class 0 OID 98192)
-- Dependencies: 260
-- Data for Name: menu_configurations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.menu_configurations (id, name, description, "isActive", "isSystem", metadata, "createdAt", "updatedAt", "createdBy", "updatedBy") FROM stdin;
7911e51a-a952-402f-ab9c-31d0e0af72ce	default	Configuration de menu par défaut	t	t	\N	2025-07-21 08:42:03.323051+02	2025-07-21 08:42:03.323051+02	\N	\N
\.


--
-- TOC entry 4323 (class 0 OID 98509)
-- Dependencies: 267
-- Data for Name: menu_item_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.menu_item_permissions (id, "menuItemId", "permissionId", "isRequired", "createdAt") FROM stdin;
\.


--
-- TOC entry 4320 (class 0 OID 98382)
-- Dependencies: 264
-- Data for Name: menu_item_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.menu_item_roles (id, "menuItemId", "roleId", "isRequired", "createdAt") FROM stdin;
\.


--
-- TOC entry 4317 (class 0 OID 98206)
-- Dependencies: 261
-- Data for Name: menu_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.menu_items (id, "configId", "parentId", title, "titleKey", href, icon, gradient, badge, "orderIndex", "isVisible", "moduleId", target, metadata, "createdAt") FROM stdin;
\.


--
-- TOC entry 4314 (class 0 OID 98032)
-- Dependencies: 258
-- Data for Name: mfa_session; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.mfa_session (id, "userId", "sessionToken", "mfaType", "isVerified", "isExpired", challenge, "challengeId", "challengeOptions", attempts, "maxAttempts", "ipAddress", "userAgent", "expiresAt", "verifiedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 4272 (class 0 OID 95575)
-- Dependencies: 216
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.migrations (id, "timestamp", name) FROM stdin;
1	1737178800000	CreateInitialTables1737178800000
2	1737179000000	CreateAllTables1737179000000
4	1737182000000	UpdateUserSettingsTable1737182000000
5	1737502000000	CreateDataTableUIPreferencesTables1737502000000
\.


--
-- TOC entry 4321 (class 0 OID 98451)
-- Dependencies: 265
-- Data for Name: modules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.modules (id, name, description, category, icon, "parentModuleId", "isActive", "sortOrder", metadata, "createdAt", "updatedAt") FROM stdin;
840f6001-9c72-4d43-8e29-371e640d4a79	admin	Module d'administration système	ADMIN	settings	\N	t	0	\N	2025-07-21 09:02:56.812555+02	2025-07-21 09:02:56.812555+02
\.


--
-- TOC entry 4301 (class 0 OID 96059)
-- Dependencies: 245
-- Data for Name: notification_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_events (id, type, entity_type, entity_id, data, processed, processed_at, version, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 4305 (class 0 OID 96109)
-- Dependencies: 249
-- Data for Name: notification_reads; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_reads (id, notification_id, user_id, read_at, version, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 4302 (class 0 OID 96071)
-- Dependencies: 246
-- Data for Name: notification_rule_executions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_rule_executions (id, rule_id, event_id, success, error_message, sent_at, version, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 4300 (class 0 OID 96047)
-- Dependencies: 244
-- Data for Name: notification_rules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_rules (id, name, event_type, conditions, template_id, recipients, active, version, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 4303 (class 0 OID 96083)
-- Dependencies: 247
-- Data for Name: notification_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_settings (id, user_id, type, enabled, channel, version, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 4299 (class 0 OID 96033)
-- Dependencies: 243
-- Data for Name: notification_templates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_templates (id, name, code, type, subject, body, variables, active, version, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 4304 (class 0 OID 96096)
-- Dependencies: 248
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, type, title, message, data, entity_type, entity_id, sender_id, read, sent_at, version, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 4287 (class 0 OID 95859)
-- Dependencies: 231
-- Data for Name: operations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.operations (id, nom, code, description, type, machine_id, duree_estimee, cout_horaire, complexite, actif, version, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 4291 (class 0 OID 95925)
-- Dependencies: 235
-- Data for Name: ordre_fabrication; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ordre_fabrication (id, numero, commande_id, produit_id, quantite_demandee, quantite_produite, date_debut_prevue, date_fin_prevue, date_debut_reelle, date_fin_reelle, statut, priorite, notes, version, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 4322 (class 0 OID 98471)
-- Dependencies: 266
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permissions (id, "moduleId", action, name, description, level, "isRequired", conditions, metadata, "createdAt", "updatedAt") FROM stdin;
98578d5a-3008-4abb-befe-f711243d8335	840f6001-9c72-4d43-8e29-371e640d4a79	read	Lecture Administration	Accès en lecture au module d'administration	read	f	\N	\N	2025-07-21 09:02:56.812555+02	2025-07-21 09:02:56.812555+02
100e7596-6ac3-424f-8ce0-f2198a1f7cd5	840f6001-9c72-4d43-8e29-371e640d4a79	write	Écriture Administration	Accès en écriture au module d'administration	WRITE	f	\N	\N	2025-07-21 09:02:56.812555+02	2025-07-21 09:02:56.812555+02
873f07fd-2df4-43e8-97e3-3dfd1106c200	840f6001-9c72-4d43-8e29-371e640d4a79	delete	Suppression Administration	Droit de suppression dans le module d'administration	DELETE	f	\N	\N	2025-07-21 09:02:56.812555+02	2025-07-21 09:02:56.812555+02
\.


--
-- TOC entry 4293 (class 0 OID 95955)
-- Dependencies: 237
-- Data for Name: planning; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.planning (id, titre, description, type, date_debut, date_fin, statut, priorite, assignee_id, machine_id, production_id, notes, version, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 4292 (class 0 OID 95941)
-- Dependencies: 236
-- Data for Name: production; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.production (id, ordre_fabrication_id, operation_id, machine_id, operateur_id, date_debut, date_fin, quantite_produite, quantite_defectueuse, temps_preparation, temps_production, statut, notes, version, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 4283 (class 0 OID 95804)
-- Dependencies: 227
-- Data for Name: produits; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.produits (id, nom, code, description, type, materiau_id, dimensions, poids, prix_unitaire, stock_min, stock_max, actif, version, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 4277 (class 0 OID 95647)
-- Dependencies: 221
-- Data for Name: projets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.projets (id, nom, description, client_id, statut, date_debut, date_fin_prevue, date_fin_reelle, budget_estime, budget_reel, priorite, notes, version, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 4294 (class 0 OID 95968)
-- Dependencies: 238
-- Data for Name: qualite; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.qualite (id, production_id, controleur_id, date_controle, type_controle, resultat, notes, mesures, non_conformites, actions_correctives, version, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 4330 (class 0 OID 98799)
-- Dependencies: 274
-- Data for Name: query_builder_calculated_fields; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.query_builder_calculated_fields (id, "queryBuilderId", name, label, description, expression, "dataType", "isVisible", "displayOrder", format, dependencies) FROM stdin;
\.


--
-- TOC entry 4328 (class 0 OID 98777)
-- Dependencies: 272
-- Data for Name: query_builder_columns; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.query_builder_columns (id, "queryBuilderId", "tableName", "columnName", alias, label, description, "dataType", "isPrimaryKey", "isForeignKey", "isVisible", "isFilterable", "isSortable", "isGroupable", "displayOrder", width, format, aggregation) FROM stdin;
a03185a5-0484-4669-ae06-05eb9047febe	93a6d599-d44d-4c3d-bbe6-2d321d7f91a9	users	id	users.id	ID	\N	uuid	t	f	f	f	f	f	1	\N	\N	\N
50f8bb27-1c87-42a5-8af9-bc74dac43f2d	93a6d599-d44d-4c3d-bbe6-2d321d7f91a9	users	email	users.email	Email	\N	varchar	f	f	t	t	t	f	2	\N	\N	\N
82b6a85a-4227-4bce-90c3-1c5531456bfe	93a6d599-d44d-4c3d-bbe6-2d321d7f91a9	users	prenom	users.prenom	Prénom	\N	varchar	f	f	t	t	t	f	3	\N	\N	\N
88feeb58-f3a5-49dd-afdd-500b6a598f80	93a6d599-d44d-4c3d-bbe6-2d321d7f91a9	users	nom	users.nom	Nom	\N	varchar	f	f	t	t	t	f	4	\N	\N	\N
6b185f27-93f2-47b2-9a82-ab4c54b5f491	93a6d599-d44d-4c3d-bbe6-2d321d7f91a9	users	role	users.role	Rôle	\N	enum	f	f	t	t	t	f	5	\N	\N	\N
f1d39b99-0f9b-4b72-a594-f5c8878fb38a	93a6d599-d44d-4c3d-bbe6-2d321d7f91a9	users	actif	users.actif	Actif	\N	boolean	f	f	t	t	t	f	6	\N	\N	\N
f0adb15f-ffb2-4a4a-9f89-c0d4da3af663	93a6d599-d44d-4c3d-bbe6-2d321d7f91a9	users	dernier_login	users.dernier_login	Dernière Connexion	\N	timestamp	f	f	t	t	t	f	7	\N	\N	\N
c7cf2465-0b8f-4c82-92da-c53ab7b7bc20	93a6d599-d44d-4c3d-bbe6-2d321d7f91a9	users	createdAt	users.createdAt	Date de Création	\N	timestamp	f	f	t	t	t	f	8	\N	\N	\N
\.


--
-- TOC entry 4329 (class 0 OID 98791)
-- Dependencies: 273
-- Data for Name: query_builder_joins; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.query_builder_joins (id, "queryBuilderId", "fromTable", "fromColumn", "toTable", "toColumn", "joinType", alias, "order") FROM stdin;
\.


--
-- TOC entry 4331 (class 0 OID 98808)
-- Dependencies: 275
-- Data for Name: query_builder_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.query_builder_permissions (id, "queryBuilderId", "permissionType", "userId", "roleId", "isAllowed") FROM stdin;
27b49a6d-4cd5-46b1-990f-9a211ab667a6	b96c6ae3-2958-4f65-b746-e6de9c6de8f1	edit	0d2f2574-0ddf-4e50-ac45-58f7391367c8	\N	t
dce0b3f2-e748-4d82-bfd9-732f954d8a6d	93a6d599-d44d-4c3d-bbe6-2d321d7f91a9	edit	0d2f2574-0ddf-4e50-ac45-58f7391367c8	\N	t
\.


--
-- TOC entry 4327 (class 0 OID 98766)
-- Dependencies: 271
-- Data for Name: query_builders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.query_builders (id, name, description, database, "mainTable", "isPublic", "maxRows", settings, layout, "createdById", "createdAt", "updatedAt") FROM stdin;
b96c6ae3-2958-4f65-b746-e6de9c6de8f1	New Query Builder		default	chutes	f	\N	{"pageSize": 50, "enableExport": true, "enableSorting": true, "exportFormats": ["csv", "excel", "json"], "enableFiltering": true, "enablePagination": true}	{}	0d2f2574-0ddf-4e50-ac45-58f7391367c8	2025-07-23 04:29:35.999879	2025-07-23 04:29:35.999879
93a6d599-d44d-4c3d-bbe6-2d321d7f91a9	Utilisateurs Actifs	Query builder pour récupérer tous les utilisateurs actifs avec leurs informations principales	default	users	t	100	{"pageSize": 20, "enableExport": true, "enableSorting": true, "exportFormats": ["csv", "excel", "json"], "enableFiltering": true, "enablePagination": true}	{}	0d2f2574-0ddf-4e50-ac45-58f7391367c8	2025-07-23 07:58:21.15688	2025-07-23 07:58:21.15688
\.


--
-- TOC entry 4324 (class 0 OID 98534)
-- Dependencies: 268
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_permissions (id, "roleId", "permissionId", "accessLevel", "isGranted", conditions, "createdAt", metadata, "updatedAt", "grantedBy") FROM stdin;
a4add2cc-72e5-4e3c-8779-d7c47b16cb55	bfb6ffd6-3f8f-42f7-a199-bcfa5b966445	873f07fd-2df4-43e8-97e3-3dfd1106c200	ADMIN	t	\N	2025-07-21 09:06:34.548+02	\N	2025-07-21 09:08:30.157437+02	\N
9487757f-1d22-4942-93fd-3e9e639f8723	bfb6ffd6-3f8f-42f7-a199-bcfa5b966445	98578d5a-3008-4abb-befe-f711243d8335	ADMIN	t	\N	2025-07-21 09:06:34.548+02	\N	2025-07-21 09:08:30.157437+02	\N
08dcbfe4-06f3-4b3c-9f12-870c0206e5bc	bfb6ffd6-3f8f-42f7-a199-bcfa5b966445	100e7596-6ac3-424f-8ce0-f2198a1f7cd5	ADMIN	t	\N	2025-07-21 09:06:34.548+02	\N	2025-07-21 09:08:30.157437+02	\N
\.


--
-- TOC entry 4318 (class 0 OID 98335)
-- Dependencies: 262
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, name, description, "isSystemRole", "isActive", metadata, "createdAt", "updatedAt", "createdBy", "updatedBy") FROM stdin;
bfb6ffd6-3f8f-42f7-a199-bcfa5b966445	ADMIN	Administrateur système avec tous les droits	t	t	\N	2025-07-21 08:49:52.851862+02	2025-07-21 08:49:52.851862+02	\N	\N
\.


--
-- TOC entry 4309 (class 0 OID 96462)
-- Dependencies: 253
-- Data for Name: seeds_status; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.seeds_status (id, name, executed_at) FROM stdin;
2	initial_seed	2025-07-21 01:37:40.449876
\.


--
-- TOC entry 4284 (class 0 OID 95820)
-- Dependencies: 228
-- Data for Name: stocks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stocks (id, produit_id, quantite, quantite_reservee, quantite_disponible, cout_unitaire, emplacement, lot, date_entree, date_peremption, version, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 4274 (class 0 OID 95600)
-- Dependencies: 218
-- Data for Name: system_parameters; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_parameters (id, key, value, description, type, category, version, created_at, updated_at, deleted_at) FROM stdin;
b9c2384e-61ee-44ff-9924-7ce77993a90d	app_name	TopSteel ERP	Nom de l'application	string	general	1	2025-07-18 11:06:45.794294	2025-07-18 11:06:45.794294	\N
c0ce70b3-47ee-4d64-944a-d8ef07b3f7dd	app_version	1.0.0	Version de l'application	string	general	1	2025-07-18 11:06:45.794294	2025-07-18 11:06:45.794294	\N
84695e04-f8cb-4408-9cc5-1ae1d9910d4c	maintenance_mode	false	Mode maintenance	boolean	system	1	2025-07-18 11:06:45.794294	2025-07-18 11:06:45.794294	\N
4daacfce-dbc1-4bce-96b3-47d034a82ef9	max_file_size	10485760	Taille max des fichiers (bytes)	number	files	1	2025-07-18 11:06:45.794294	2025-07-18 11:06:45.794294	\N
\.


--
-- TOC entry 4275 (class 0 OID 95615)
-- Dependencies: 219
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_settings (id, key, value, description, type, category, version, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 4332 (class 0 OID 98817)
-- Dependencies: 276
-- Data for Name: test_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.test_categories (id, name, description, "isActive", "createdAt", "updatedAt") FROM stdin;
07cd31ef-6741-445a-a344-53418f67189e	Électronique	Produits électroniques et accessoires	t	2025-07-22 16:10:36.233383	2025-07-22 16:10:36.233383
c5a32a6d-cfa5-4b41-95b8-eb5d07bef833	Vêtements	Vêtements pour hommes et femmes	t	2025-07-22 16:10:36.233383	2025-07-22 16:10:36.233383
ef1c33d9-83b1-439a-bf19-bacf66210ad2	Alimentation	Produits alimentaires et boissons	t	2025-07-22 16:10:36.233383	2025-07-22 16:10:36.233383
302d6f57-fd02-402f-99c2-e17caa2d2127	Maison	Articles pour la maison et décoration	t	2025-07-22 16:10:36.233383	2025-07-22 16:10:36.233383
98c5b827-c0a3-41bb-bf1f-0abbef0ca863	Sport	Équipements sportifs et fitness	t	2025-07-22 16:10:36.233383	2025-07-22 16:10:36.233383
\.


--
-- TOC entry 4335 (class 0 OID 98853)
-- Dependencies: 279
-- Data for Name: test_order_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.test_order_items (id, "orderId", "productId", quantity, "unitPrice", discount, "totalPrice", "createdAt") FROM stdin;
\.


--
-- TOC entry 4334 (class 0 OID 98841)
-- Dependencies: 278
-- Data for Name: test_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.test_orders (id, "orderNumber", "customerId", "orderDate", status, "totalAmount", "shippingAddress", notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 4333 (class 0 OID 98828)
-- Dependencies: 277
-- Data for Name: test_products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.test_products (id, sku, name, description, "categoryId", price, cost, "stockQuantity", "minimumStock", weight, "isActive", "createdAt", "updatedAt") FROM stdin;
ff1f35b9-e0ea-477c-9a26-22080fa92ecf	ELEC-0001	Smartphone XYZ	Smartphone dernière génération	07cd31ef-6741-445a-a344-53418f67189e	599.99	299.99	50	10	0.200	t	2025-07-22 16:10:36.233383	2025-07-22 16:10:36.233383
808f5259-3e15-4dfc-b591-0702f16b0223	ELEC-0002	Laptop ABC	Ordinateur portable professionnel	07cd31ef-6741-445a-a344-53418f67189e	1299.99	699.99	25	5	2.100	t	2025-07-22 16:10:36.233383	2025-07-22 16:10:36.233383
d256b140-785f-4f34-b082-8bb6c5e2b859	ELEC-0003	Écouteurs Wireless	Écouteurs sans fil haute qualité	07cd31ef-6741-445a-a344-53418f67189e	149.99	75.99	100	20	0.050	t	2025-07-22 16:10:36.233383	2025-07-22 16:10:36.233383
66bb1acd-61b7-4487-8502-a5d9055790d1	VET-0001	T-shirt Coton	T-shirt 100% coton bio	c5a32a6d-cfa5-4b41-95b8-eb5d07bef833	29.99	12.99	200	50	0.150	t	2025-07-22 16:10:36.233383	2025-07-22 16:10:36.233383
8a9b6b76-6a94-4c3d-a836-c5662d3b6f7a	VET-0002	Jean Slim	Jean coupe slim moderne	c5a32a6d-cfa5-4b41-95b8-eb5d07bef833	89.99	39.99	80	15	0.600	t	2025-07-22 16:10:36.233383	2025-07-22 16:10:36.233383
\.


--
-- TOC entry 4298 (class 0 OID 96021)
-- Dependencies: 242
-- Data for Name: tracabilite; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tracabilite (id, entity_type, entity_id, action, utilisateur_id, date_action, donnees_avant, donnees_apres, ip_address, user_agent, version, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 4311 (class 0 OID 96571)
-- Dependencies: 255
-- Data for Name: typeorm_metadata; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.typeorm_metadata (type, database, schema, "table", name, value) FROM stdin;
\.


--
-- TOC entry 4338 (class 0 OID 106373)
-- Dependencies: 282
-- Data for Name: ui_preferences_reorderable_list; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ui_preferences_reorderable_list (id, user_id, component_id, theme, preferences, layout, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4280 (class 0 OID 95763)
-- Dependencies: 224
-- Data for Name: user_groups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_groups (id, user_id, group_id, version, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 4306 (class 0 OID 96168)
-- Dependencies: 250
-- Data for Name: user_menu_item_preferences; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_menu_item_preferences (id, user_id, menu_item_id, visible, "order", version, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 4307 (class 0 OID 96181)
-- Dependencies: 251
-- Data for Name: user_menu_preferences; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_menu_preferences (id, user_id, menu_id, is_visible, "order", custom_label, version, created_at, updated_at, deleted_at) FROM stdin;
c04c7daa-f3b0-48f1-be41-a812aafb9ad0	0d2f2574-0ddf-4e50-ac45-58f7391367c8	query-builder-test	t	27	\N	1	2025-07-23 17:46:53.384097	2025-07-23 17:46:53.384097	\N
c7cdd6cc-01c3-4d51-bbe2-d823368d185a	0d2f2574-0ddf-4e50-ac45-58f7391367c8	settings-appearance	t	28	\N	1	2025-07-23 17:46:53.388394	2025-07-23 17:46:53.388394	\N
00c5ac56-979b-4b1b-aa14-c45845d71d39	0d2f2574-0ddf-4e50-ac45-58f7391367c8	settings-notifications	t	29	\N	1	2025-07-23 17:46:53.394281	2025-07-23 17:46:53.394281	\N
29c88aae-1ebe-4eb8-af43-31b468d19fa4	0d2f2574-0ddf-4e50-ac45-58f7391367c8	admin-admin	t	23	\N	1	2025-07-23 17:46:53.356921	2025-07-23 18:57:17.748164	\N
c22946cc-bdca-42a2-896c-e3acef1dd056	0d2f2574-0ddf-4e50-ac45-58f7391367c8	main-dashboard	f	1	Dashboard	1	2025-07-21 10:21:57.648974	2025-07-21 10:29:59.531598	\N
965c5f68-a8a3-4a4e-83c8-925aeca522f9	0d2f2574-0ddf-4e50-ac45-58f7391367c8	notifications	f	5	Notifications	1	2025-07-21 10:21:57.703515	2025-07-21 10:29:59.536705	\N
cdfd64c7-9c9d-4cb7-9464-45770b17e937	0d2f2574-0ddf-4e50-ac45-58f7391367c8	roles	f	3	Rôles	1	2025-07-21 10:21:57.698712	2025-07-21 10:29:59.541412	\N
35f18154-bd42-4fe9-957b-adcd2a6a0f2c	0d2f2574-0ddf-4e50-ac45-58f7391367c8	system-settings	f	4	Configuration	1	2025-07-21 10:21:57.699396	2025-07-21 10:29:59.54579	\N
0cfef2b2-9940-4410-9143-5dc9bcd4b431	0d2f2574-0ddf-4e50-ac45-58f7391367c8	users	f	2	Utilisateurs	1	2025-07-21 10:21:57.691759	2025-07-21 10:29:59.549713	\N
1e95b579-9e9b-4d91-8e1d-9f1c8b8160a0	0d2f2574-0ddf-4e50-ac45-58f7391367c8	settings-menu	t	12	\N	1	2025-07-21 10:30:41.227295	2025-07-21 11:23:59.197953	\N
7de01c1a-b6e1-46b5-9d13-8a7199947a72	0d2f2574-0ddf-4e50-ac45-58f7391367c8	dashboard	t	18	\N	1	2025-07-21 10:58:36.295378	2025-07-21 11:53:22.182252	\N
9cd884d0-fa34-452b-87dd-69e76203a0c7	0d2f2574-0ddf-4e50-ac45-58f7391367c8	home	t	19	\N	1	2025-07-21 11:53:37.919182	2025-07-21 12:07:28.934392	\N
02e41c7b-c40b-4f0e-a688-47d6c0eee648	0d2f2574-0ddf-4e50-ac45-58f7391367c8	admin-company	t	13	\N	1	2025-07-21 10:31:19.394843	2025-07-21 12:19:04.94091	\N
54304dcc-f6b2-486a-b41d-95d03797a0f4	0d2f2574-0ddf-4e50-ac45-58f7391367c8	admin	t	6	\N	1	2025-07-21 10:23:59.225731	2025-07-21 12:19:15.159181	\N
44148425-0360-451d-968c-56a1c63bf4f2	0d2f2574-0ddf-4e50-ac45-58f7391367c8	settings	t	16	\N	1	2025-07-21 10:47:26.024758	2025-07-21 12:19:28.629294	\N
94feb4f5-9a76-4154-a8d2-580cf27a019b	0d2f2574-0ddf-4e50-ac45-58f7391367c8	settings-security	t	17	\N	1	2025-07-21 10:47:28.674657	2025-07-21 12:19:39.548225	\N
3e2b4d72-6f24-4cf0-9920-b5d316234333	0d2f2574-0ddf-4e50-ac45-58f7391367c8	profile	t	15	\N	1	2025-07-21 10:38:41.927956	2025-07-21 12:19:57.568117	\N
1c33e87f-c061-4ab7-a7bf-d7affe80ce64	0d2f2574-0ddf-4e50-ac45-58f7391367c8	admin-translations	t	9	\N	1	2025-07-21 10:25:21.238743	2025-07-21 12:19:59.275076	\N
3f956077-1930-41fe-93c0-65f546e1c2fa	0d2f2574-0ddf-4e50-ac45-58f7391367c8	admin-sessions	t	10	\N	1	2025-07-21 10:25:21.795164	2025-07-21 12:19:59.282436	\N
b2c40a2e-8672-40f9-8b65-3e55f0e99a8d	0d2f2574-0ddf-4e50-ac45-58f7391367c8	admin-users	t	8	\N	1	2025-07-21 10:25:20.763491	2025-07-21 12:19:59.28593	\N
810bab9b-a22b-48fd-88b8-0ecea367584e	0d2f2574-0ddf-4e50-ac45-58f7391367c8	admin-notifications-rules	t	14	\N	1	2025-07-21 10:31:31.236119	2025-07-21 12:19:59.289229	\N
3df2b3c2-6eff-4ffc-8c4e-19af595ec445	0d2f2574-0ddf-4e50-ac45-58f7391367c8	admin-menu-config	t	11	\N	1	2025-07-21 10:30:38.092373	2025-07-21 12:19:59.29283	\N
e3e83a3d-8f40-45e3-a2df-fdd912693a5f	0d2f2574-0ddf-4e50-ac45-58f7391367c8	admin-roles	t	20	\N	1	2025-07-21 12:19:59.296226	2025-07-21 12:19:59.296226	\N
e107b742-a553-49d9-af6a-8c7be07880c0	0d2f2574-0ddf-4e50-ac45-58f7391367c8	planning-test	t	21	\N	1	2025-07-21 12:19:59.306974	2025-07-21 12:19:59.306974	\N
1f52ff3d-4536-436b-8690-8fde3f8f156a	0d2f2574-0ddf-4e50-ac45-58f7391367c8	admin-datatable-test	t	22	\N	1	2025-07-21 18:30:33.74648	2025-07-21 18:31:07.601335	\N
de7e5564-da04-47f1-bdb5-810595ce4fa1	0d2f2574-0ddf-4e50-ac45-58f7391367c8	admin-database	t	7	\N	1	2025-07-21 10:24:11.170293	2025-07-23 17:46:53.347938	\N
e3cf0ca5-ff81-4123-a93b-df052cd498c2	0d2f2574-0ddf-4e50-ac45-58f7391367c8	query-builder-[id]	t	24	\N	1	2025-07-23 17:46:53.369109	2025-07-23 17:46:53.369109	\N
ff90379a-2c5c-4176-898b-b36f36807e14	0d2f2574-0ddf-4e50-ac45-58f7391367c8	query-builder-docs	t	25	\N	1	2025-07-23 17:46:53.374361	2025-07-23 17:46:53.374361	\N
73659d91-4c3b-40f6-b6fd-7d3506733eee	0d2f2574-0ddf-4e50-ac45-58f7391367c8	query-builder	t	26	\N	1	2025-07-23 17:46:53.379461	2025-07-23 17:46:53.379461	\N
\.


--
-- TOC entry 4278 (class 0 OID 95665)
-- Dependencies: 222
-- Data for Name: user_menu_preferences_admin; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_menu_preferences_admin (id, "userId", "menuId", "isVisible", "order", "customLabel", version, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 4310 (class 0 OID 96557)
-- Dependencies: 254
-- Data for Name: user_menu_preferences_old; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_menu_preferences_old (id, user_id, menu_id, is_visible, "order", custom_label, backup_date, reason, version, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 4313 (class 0 OID 98019)
-- Dependencies: 257
-- Data for Name: user_mfa; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_mfa (id, "userId", type, "isEnabled", "isVerified", secret, "backupCodes", "phoneNumber", email, "webauthnCredentials", metadata, "lastUsedAt", "verifiedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 4319 (class 0 OID 98349)
-- Dependencies: 263
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_roles (id, "userId", "roleId", "assignedAt", "assignedBy") FROM stdin;
18670072-a805-4e18-a80b-f3786431eb89	0d2f2574-0ddf-4e50-ac45-58f7391367c8	bfb6ffd6-3f8f-42f7-a199-bcfa5b966445	2025-07-21 08:49:52.851862+02	\N
\.


--
-- TOC entry 4315 (class 0 OID 98093)
-- Dependencies: 259
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_sessions (id, "userId", "sessionId", "accessToken", "refreshToken", "loginTime", "logoutTime", "lastActivity", "ipAddress", "userAgent", "deviceInfo", location, "isActive", "isIdle", status, "warningCount", "forcedLogoutBy", "forcedLogoutReason", metadata, "createdAt", "updatedAt") FROM stdin;
1679f393-42c5-4446-bbac-2d350b2110df	0d2f2574-0ddf-4e50-ac45-58f7391367c8	f9c86b2f-f82a-4913-aa1e-2f537f9e723e	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwZDJmMjU3NC0wZGRmLTRlNTAtYWM0NS01OGY3MzkxMzY3YzgiLCJlbWFpbCI6ImFkbWluQHRvcHN0ZWVsLnRlY2giLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiJmOWM4NmIyZi1mODJhLTQ5MTMtYWExZS0yZjUzN2Y5ZTcyM2UiLCJpYXQiOjE3NTMwNzkwNzEsImV4cCI6MTc1MzE2NTQ3MX0.PSoddZIVQAq4KEjd7b6fZdaW4xNDY8nlZT5dIAlWSaM	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwZDJmMjU3NC0wZGRmLTRlNTAtYWM0NS01OGY3MzkxMzY3YzgiLCJlbWFpbCI6ImFkbWluQHRvcHN0ZWVsLnRlY2giLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiJmOWM4NmIyZi1mODJhLTQ5MTMtYWExZS0yZjUzN2Y5ZTcyM2UiLCJpYXQiOjE3NTMwNzkwNzEsImV4cCI6MTc1MzY4Mzg3MX0.S-8qezJTQRB-FgirI8sWNLh2NLbl5rZQ8-kL0VF5ZlM	2025-07-21 08:24:31.897	\N	2025-07-21 08:24:31.897	0.0.0.0	Unknown	\N	\N	t	f	active	0	\N	\N	\N	2025-07-21 08:24:31.898592+02	2025-07-21 08:24:31.898592+02
8ab025d3-3554-4c17-9d7f-3fd0db8005fa	0d2f2574-0ddf-4e50-ac45-58f7391367c8	bb54fb25-f189-46d1-b88d-3a2217196229	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwZDJmMjU3NC0wZGRmLTRlNTAtYWM0NS01OGY3MzkxMzY3YzgiLCJlbWFpbCI6ImFkbWluQHRvcHN0ZWVsLnRlY2giLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiJiYjU0ZmIyNS1mMTg5LTQ2ZDEtYjg4ZC0zYTIyMTcxOTYyMjkiLCJpYXQiOjE3NTMwNzkyNjcsImV4cCI6MTc1MzE2NTY2N30.Uxcqi-3TLquG0IjFrGrw4vKYn3Kxql_s-B88MK7b7U8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwZDJmMjU3NC0wZGRmLTRlNTAtYWM0NS01OGY3MzkxMzY3YzgiLCJlbWFpbCI6ImFkbWluQHRvcHN0ZWVsLnRlY2giLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiJiYjU0ZmIyNS1mMTg5LTQ2ZDEtYjg4ZC0zYTIyMTcxOTYyMjkiLCJpYXQiOjE3NTMwNzkyNjcsImV4cCI6MTc1MzY4NDA2N30.ReSBNfZF1i2h8_ASDko6TPtcPbaHXwY05FUAVRI4plA	2025-07-21 08:27:47.355	\N	2025-07-21 08:27:47.355	0.0.0.0	Unknown	\N	\N	t	f	active	0	\N	\N	\N	2025-07-21 08:27:47.359423+02	2025-07-21 08:27:47.359423+02
e39d7d61-de50-48c8-9fa0-0478d25e57c4	0d2f2574-0ddf-4e50-ac45-58f7391367c8	fbf89cde-ec46-4849-8087-cc43628b6fd5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwZDJmMjU3NC0wZGRmLTRlNTAtYWM0NS01OGY3MzkxMzY3YzgiLCJlbWFpbCI6ImFkbWluQHRvcHN0ZWVsLnRlY2giLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiJmYmY4OWNkZS1lYzQ2LTQ4NDktODA4Ny1jYzQzNjI4YjZmZDUiLCJpYXQiOjE3NTMwNzk0NzAsImV4cCI6MTc1MzE2NTg3MH0.XsGNHkbHVFkHeQ8lgCZ0k9S2Hurcjb20moX7MIG-PF0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwZDJmMjU3NC0wZGRmLTRlNTAtYWM0NS01OGY3MzkxMzY3YzgiLCJlbWFpbCI6ImFkbWluQHRvcHN0ZWVsLnRlY2giLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiJmYmY4OWNkZS1lYzQ2LTQ4NDktODA4Ny1jYzQzNjI4YjZmZDUiLCJpYXQiOjE3NTMwNzk0NzAsImV4cCI6MTc1MzY4NDI3MH0.6tlkHNpLNcLEVtHzqbwJS04Bz2CYd7qWHmy2m7hSz_Y	2025-07-21 08:31:10.735	\N	2025-07-21 08:31:10.735	0.0.0.0	Unknown	\N	\N	t	f	active	0	\N	\N	\N	2025-07-21 08:31:10.738347+02	2025-07-21 08:31:10.738347+02
dc3fa512-3d95-4ede-9aff-c7d460899982	0d2f2574-0ddf-4e50-ac45-58f7391367c8	f4426e4f-a317-4462-bbb6-fadd79f919a8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwZDJmMjU3NC0wZGRmLTRlNTAtYWM0NS01OGY3MzkxMzY3YzgiLCJlbWFpbCI6ImFkbWluQHRvcHN0ZWVsLnRlY2giLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiJmNDQyNmU0Zi1hMzE3LTQ0NjItYmJiNi1mYWRkNzlmOTE5YTgiLCJpYXQiOjE3NTMwNzk4OTUsImV4cCI6MTc1MzE2NjI5NX0.y5b9ss-eCZo4ZcLhx7rqV3y-VUHV_lAuiofTY3vVdb4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwZDJmMjU3NC0wZGRmLTRlNTAtYWM0NS01OGY3MzkxMzY3YzgiLCJlbWFpbCI6ImFkbWluQHRvcHN0ZWVsLnRlY2giLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiJmNDQyNmU0Zi1hMzE3LTQ0NjItYmJiNi1mYWRkNzlmOTE5YTgiLCJpYXQiOjE3NTMwNzk4OTUsImV4cCI6MTc1MzY4NDY5NX0.Lt6XbNQSXjYHbB6yivWIhjz7nHIgzhef1UJLrmCuYvE	2025-07-21 08:38:15.461	\N	2025-07-21 08:38:15.461	0.0.0.0	Unknown	\N	\N	t	f	active	0	\N	\N	\N	2025-07-21 08:38:15.464294+02	2025-07-21 08:38:15.464294+02
1c3f4c61-2044-452b-a411-6056face3d49	0d2f2574-0ddf-4e50-ac45-58f7391367c8	0e229f02-b7a9-410e-8720-8c941c4e6821	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwZDJmMjU3NC0wZGRmLTRlNTAtYWM0NS01OGY3MzkxMzY3YzgiLCJlbWFpbCI6ImFkbWluQHRvcHN0ZWVsLnRlY2giLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiIwZTIyOWYwMi1iN2E5LTQxMGUtODcyMC04Yzk0MWM0ZTY4MjEiLCJpYXQiOjE3NTMxNjY0MDIsImV4cCI6MTc1MzI1MjgwMn0.0Dkb93I5v1A3zRGycHBo1hPNfgraoW_vuYMeJ427leA	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwZDJmMjU3NC0wZGRmLTRlNTAtYWM0NS01OGY3MzkxMzY3YzgiLCJlbWFpbCI6ImFkbWluQHRvcHN0ZWVsLnRlY2giLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiIwZTIyOWYwMi1iN2E5LTQxMGUtODcyMC04Yzk0MWM0ZTY4MjEiLCJpYXQiOjE3NTMxNjY0MDIsImV4cCI6MTc1Mzc3MTIwMn0.JQ-doUXfC4-thlqISNfTRIV44zYN7DmoVNaX2hc8x0g	2025-07-22 08:40:02.346	\N	2025-07-22 08:40:02.346	0.0.0.0	Unknown	\N	\N	t	f	active	0	\N	\N	\N	2025-07-22 08:40:02.347867+02	2025-07-22 08:40:02.347867+02
5e5b8049-e0d6-4992-adeb-9be2e10b87dd	0d2f2574-0ddf-4e50-ac45-58f7391367c8	5b1ef852-c628-4250-8032-54aa965a1a37	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwZDJmMjU3NC0wZGRmLTRlNTAtYWM0NS01OGY3MzkxMzY3YzgiLCJlbWFpbCI6ImFkbWluQHRvcHN0ZWVsLnRlY2giLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiI1YjFlZjg1Mi1jNjI4LTQyNTAtODAzMi01NGFhOTY1YTFhMzciLCJpYXQiOjE3NTMxOTcxNDEsImV4cCI6MTc1MzI4MzU0MX0.YSqdfBZEhGRWHz6Bqg1MjGWmkc48zzFnZC94jEWrAII	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwZDJmMjU3NC0wZGRmLTRlNTAtYWM0NS01OGY3MzkxMzY3YzgiLCJlbWFpbCI6ImFkbWluQHRvcHN0ZWVsLnRlY2giLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiI1YjFlZjg1Mi1jNjI4LTQyNTAtODAzMi01NGFhOTY1YTFhMzciLCJpYXQiOjE3NTMxOTcxNDEsImV4cCI6MTc1MzgwMTk0MX0.uehTDu6p6winDPZFUepQOUfp9clW77SlV_cEGVsSgGM	2025-07-22 17:12:21.613	\N	2025-07-22 17:12:21.613	0.0.0.0	Unknown	\N	\N	t	f	active	0	\N	\N	\N	2025-07-22 17:12:21.615372+02	2025-07-22 17:12:21.615372+02
b9b219f3-fb6b-4681-9046-60e44569577a	0d2f2574-0ddf-4e50-ac45-58f7391367c8	77f34da2-c8f0-4c3a-a8a2-9a93a9cc73de	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwZDJmMjU3NC0wZGRmLTRlNTAtYWM0NS01OGY3MzkxMzY3YzgiLCJlbWFpbCI6ImFkbWluQHRvcHN0ZWVsLnRlY2giLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiI3N2YzNGRhMi1jOGYwLTRjM2EtYThhMi05YTkzYTljYzczZGUiLCJpYXQiOjE3NTMxOTcxNTgsImV4cCI6MTc1MzI4MzU1OH0.gNvknOqU3yTUTvWdtHRPSUiIhS0yPlWJvz-KDCfOoZU	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwZDJmMjU3NC0wZGRmLTRlNTAtYWM0NS01OGY3MzkxMzY3YzgiLCJlbWFpbCI6ImFkbWluQHRvcHN0ZWVsLnRlY2giLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiI3N2YzNGRhMi1jOGYwLTRjM2EtYThhMi05YTkzYTljYzczZGUiLCJpYXQiOjE3NTMxOTcxNTgsImV4cCI6MTc1MzgwMTk1OH0.NLaz_0xWwHL-l_C4wLiveF-JgNtzkgBzI-zwqirFBUw	2025-07-22 17:12:38.969	\N	2025-07-22 17:12:38.969	0.0.0.0	Unknown	\N	\N	t	f	active	0	\N	\N	\N	2025-07-22 17:12:38.970723+02	2025-07-22 17:12:38.970723+02
02cf5a4f-cf72-4cae-9321-828d8d27964c	0d2f2574-0ddf-4e50-ac45-58f7391367c8	7cd3f7a6-886f-407b-9cb4-f64c755ae567	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwZDJmMjU3NC0wZGRmLTRlNTAtYWM0NS01OGY3MzkxMzY3YzgiLCJlbWFpbCI6ImFkbWluQHRvcHN0ZWVsLnRlY2giLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiI3Y2QzZjdhNi04ODZmLTQwN2ItOWNiNC1mNjRjNzU1YWU1NjciLCJpYXQiOjE3NTMyMTgwOTgsImV4cCI6MTc1MzMwNDQ5OH0.zExh2b-JEV0xrCStlwHg4mUDSezkt-dEeMvOj1Nl1tI	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwZDJmMjU3NC0wZGRmLTRlNTAtYWM0NS01OGY3MzkxMzY3YzgiLCJlbWFpbCI6ImFkbWluQHRvcHN0ZWVsLnRlY2giLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiI3Y2QzZjdhNi04ODZmLTQwN2ItOWNiNC1mNjRjNzU1YWU1NjciLCJpYXQiOjE3NTMyMTgwOTgsImV4cCI6MTc1MzgyMjg5OH0.7tk7hPrgfAGrirovnBKdnhWl3s2kENT1W4sd12unrBU	2025-07-22 23:01:38.495	\N	2025-07-22 23:01:38.495	0.0.0.0	Unknown	\N	\N	t	f	active	0	\N	\N	\N	2025-07-22 23:01:38.498988+02	2025-07-22 23:01:38.498988+02
fa78905c-c051-4a9d-a7a8-bcdbd312aa11	0d2f2574-0ddf-4e50-ac45-58f7391367c8	64b85a6c-5adf-4602-ae95-7cbd2d386d31	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwZDJmMjU3NC0wZGRmLTRlNTAtYWM0NS01OGY3MzkxMzY3YzgiLCJlbWFpbCI6ImFkbWluQHRvcHN0ZWVsLnRlY2giLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiI2NGI4NWE2Yy01YWRmLTQ2MDItYWU5NS03Y2JkMmQzODZkMzEiLCJpYXQiOjE3NTMyNTU1NjYsImV4cCI6MTc1MzM0MTk2Nn0.VW4I6qtEcLfGjwHhdFDSEV9jZ66FWNku1FFiFoTQvb4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwZDJmMjU3NC0wZGRmLTRlNTAtYWM0NS01OGY3MzkxMzY3YzgiLCJlbWFpbCI6ImFkbWluQHRvcHN0ZWVsLnRlY2giLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiI2NGI4NWE2Yy01YWRmLTQ2MDItYWU5NS03Y2JkMmQzODZkMzEiLCJpYXQiOjE3NTMyNTU1NjYsImV4cCI6MTc1Mzg2MDM2Nn0.CaiDUi1SFZPPPjm4O3SG01Wn78itcUoqJiJiwn_8Nxo	2025-07-23 09:26:06.675	\N	2025-07-23 09:26:06.675	0.0.0.0	Unknown	\N	\N	t	f	active	0	\N	\N	\N	2025-07-23 09:26:06.677827+02	2025-07-23 09:26:06.677827+02
45136924-63fa-4a06-affe-c6ec01ddb129	0d2f2574-0ddf-4e50-ac45-58f7391367c8	712ed1ff-dc85-475b-8ca2-b8fb6c1eb922	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwZDJmMjU3NC0wZGRmLTRlNTAtYWM0NS01OGY3MzkxMzY3YzgiLCJlbWFpbCI6ImFkbWluQHRvcHN0ZWVsLnRlY2giLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiI3MTJlZDFmZi1kYzg1LTQ3NWItOGNhMi1iOGZiNmMxZWI5MjIiLCJpYXQiOjE3NTMyODE5MDMsImV4cCI6MTc1MzM2ODMwM30.5xMdixO3VUY28Yo1wwBP5Z4H6TtpzuUFW4fwBEL2abI	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwZDJmMjU3NC0wZGRmLTRlNTAtYWM0NS01OGY3MzkxMzY3YzgiLCJlbWFpbCI6ImFkbWluQHRvcHN0ZWVsLnRlY2giLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiI3MTJlZDFmZi1kYzg1LTQ3NWItOGNhMi1iOGZiNmMxZWI5MjIiLCJpYXQiOjE3NTMyODE5MDMsImV4cCI6MTc1Mzg4NjcwM30.mNhS8gXW2wTGdlvwMfG4QSH1PGQm40snI94TecqPGp8	2025-07-23 16:45:03.774	\N	2025-07-23 16:45:03.774	0.0.0.0	Unknown	\N	\N	t	f	active	0	\N	\N	\N	2025-07-23 16:45:03.778027+02	2025-07-23 16:45:03.778027+02
36c4117a-f111-4f3f-8645-c7fe73ae43b6	0d2f2574-0ddf-4e50-ac45-58f7391367c8	113a7cfe-0923-4676-bfac-a1ec5f3d6c33	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwZDJmMjU3NC0wZGRmLTRlNTAtYWM0NS01OGY3MzkxMzY3YzgiLCJlbWFpbCI6ImFkbWluQHRvcHN0ZWVsLnRlY2giLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiIxMTNhN2NmZS0wOTIzLTQ2NzYtYmZhYy1hMWVjNWYzZDZjMzMiLCJpYXQiOjE3NTMzMDQxMDgsImV4cCI6MTc1MzM5MDUwOH0.sexVUo6zDjAZpB0RmX_EGn_-ruyQ8wTPvfkIRtKz4iU	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwZDJmMjU3NC0wZGRmLTRlNTAtYWM0NS01OGY3MzkxMzY3YzgiLCJlbWFpbCI6ImFkbWluQHRvcHN0ZWVsLnRlY2giLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiIxMTNhN2NmZS0wOTIzLTQ2NzYtYmZhYy1hMWVjNWYzZDZjMzMiLCJpYXQiOjE3NTMzMDQxMDgsImV4cCI6MTc1MzkwODkwOH0.iT1JLkjwQZxS489jWPga9xwRPCvV08AIqT5vst5JhiY	2025-07-23 22:55:08.744	\N	2025-07-23 22:55:08.744	0.0.0.0	Unknown	\N	\N	t	f	active	0	\N	\N	\N	2025-07-23 22:55:08.747629+02	2025-07-23 22:55:08.747629+02
\.


--
-- TOC entry 4326 (class 0 OID 98578)
-- Dependencies: 270
-- Data for Name: user_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_settings (id, "userId", profile, company, preferences, metadata, "createdAt", "updatedAt") FROM stdin;
9199f13c-fbbd-4b8b-8724-306f403065b0	0d2f2574-0ddf-4e50-ac45-58f7391367c8	{"email": "admin@topsteel.tech", "lastName": "Admin", "firstName": "System"}	{"city": "Lyon", "name": "TopSteel Métallerie", "address": "123 Rue de l'Industrie", "country": "France", "postalCode": "69001"}	{"theme": "vibrant", "language": "fr", "timezone": "Europe/Paris", "appearance": {"theme": "vibrant", "density": "compact", "fontSize": "large", "language": "fr", "accentColor": "red", "contentWidth": "full", "sidebarWidth": "normal"}, "notifications": {"sms": false, "push": true, "email": true, "pushTypes": {"quiet": true, "sound": true, "normal": false, "urgent": true, "enabled": true}, "emailTypes": {"newMessages": true, "systemAlerts": true, "taskReminders": false, "weeklyReports": true, "securityAlerts": true, "maintenanceNotice": false}, "quietHours": {"end": "07:00", "start": "22:00", "enabled": true}}}	\N	2025-07-22 17:12:41.135786	2025-07-24 00:06:43.611195
\.


--
-- TOC entry 4325 (class 0 OID 98573)
-- Dependencies: 269
-- Data for Name: user_settings_backup; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_settings_backup (id, user_id, key, value, type, category, version, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 4273 (class 0 OID 95583)
-- Dependencies: 217
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, nom, prenom, email, password, role, actif, acronyme, dernier_login, version, "refreshToken", metadata, created_at, updated_at, deleted_at) FROM stdin;
0d2f2574-0ddf-4e50-ac45-58f7391367c8	Admin	System	admin@topsteel.tech	$2b$10$zj38zRRqut0nsl9mXKYTXeAveM./mEDKI9XkWPlyIhksf/53np96q	ADMIN	t	TOP	2025-07-23 22:55:08.742	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwZDJmMjU3NC0wZGRmLTRlNTAtYWM0NS01OGY3MzkxMzY3YzgiLCJlbWFpbCI6ImFkbWluQHRvcHN0ZWVsLnRlY2giLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiIxMTNhN2NmZS0wOTIzLTQ2NzYtYmZhYy1hMWVjNWYzZDZjMzMiLCJpYXQiOjE3NTMzMDQxMDgsImV4cCI6MTc1MzkwODkwOH0.iT1JLkjwQZxS489jWPga9xwRPCvV08AIqT5vst5JhiY	\N	2025-07-18 11:06:45.794294	2025-07-23 22:55:08.743376	\N
\.


--
-- TOC entry 4347 (class 0 OID 0)
-- Dependencies: 215
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.migrations_id_seq', 5, true);


--
-- TOC entry 4348 (class 0 OID 0)
-- Dependencies: 252
-- Name: seeds_status_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.seeds_status_id_seq', 2, true);


--
-- TOC entry 3815 (class 2606 OID 95582)
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


--
-- TOC entry 3866 (class 2606 OID 95843)
-- Name: chutes PK_chutes; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chutes
    ADD CONSTRAINT "PK_chutes" PRIMARY KEY (id);


--
-- TOC entry 3831 (class 2606 OID 95642)
-- Name: clients PK_clients; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT "PK_clients" PRIMARY KEY (id);


--
-- TOC entry 3882 (class 2606 OID 95922)
-- Name: commandes PK_commandes; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commandes
    ADD CONSTRAINT "PK_commandes" PRIMARY KEY (id);


--
-- TOC entry 3876 (class 2606 OID 95890)
-- Name: devis PK_devis; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.devis
    ADD CONSTRAINT "PK_devis" PRIMARY KEY (id);


--
-- TOC entry 3902 (class 2606 OID 96020)
-- Name: documents PK_documents; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "PK_documents" PRIMARY KEY (id);


--
-- TOC entry 3898 (class 2606 OID 96007)
-- Name: facturation PK_facturation; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturation
    ADD CONSTRAINT "PK_facturation" PRIMARY KEY (id);


--
-- TOC entry 3852 (class 2606 OID 95786)
-- Name: fournisseurs PK_fournisseurs; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fournisseurs
    ADD CONSTRAINT "PK_fournisseurs" PRIMARY KEY (id);


--
-- TOC entry 3844 (class 2606 OID 95736)
-- Name: groups PK_groups; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT "PK_groups" PRIMARY KEY (id);


--
-- TOC entry 3880 (class 2606 OID 95905)
-- Name: ligne_devis PK_ligne_devis; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ligne_devis
    ADD CONSTRAINT "PK_ligne_devis" PRIMARY KEY (id);


--
-- TOC entry 3868 (class 2606 OID 95856)
-- Name: machines PK_machines; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.machines
    ADD CONSTRAINT "PK_machines" PRIMARY KEY (id);


--
-- TOC entry 3896 (class 2606 OID 95991)
-- Name: maintenance PK_maintenance; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance
    ADD CONSTRAINT "PK_maintenance" PRIMARY KEY (id);


--
-- TOC entry 3856 (class 2606 OID 95801)
-- Name: materiaux PK_materiaux; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materiaux
    ADD CONSTRAINT "PK_materiaux" PRIMARY KEY (id);


--
-- TOC entry 3951 (class 2606 OID 98046)
-- Name: mfa_session PK_mfa_session; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mfa_session
    ADD CONSTRAINT "PK_mfa_session" PRIMARY KEY (id);


--
-- TOC entry 3912 (class 2606 OID 96070)
-- Name: notification_events PK_notification_events; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_events
    ADD CONSTRAINT "PK_notification_events" PRIMARY KEY (id);


--
-- TOC entry 3922 (class 2606 OID 96118)
-- Name: notification_reads PK_notification_reads; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_reads
    ADD CONSTRAINT "PK_notification_reads" PRIMARY KEY (id);


--
-- TOC entry 3914 (class 2606 OID 96082)
-- Name: notification_rule_executions PK_notification_rule_executions; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_rule_executions
    ADD CONSTRAINT "PK_notification_rule_executions" PRIMARY KEY (id);


--
-- TOC entry 3910 (class 2606 OID 96058)
-- Name: notification_rules PK_notification_rules; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_rules
    ADD CONSTRAINT "PK_notification_rules" PRIMARY KEY (id);


--
-- TOC entry 3916 (class 2606 OID 96093)
-- Name: notification_settings PK_notification_settings; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_settings
    ADD CONSTRAINT "PK_notification_settings" PRIMARY KEY (id);


--
-- TOC entry 3906 (class 2606 OID 96044)
-- Name: notification_templates PK_notification_templates; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_templates
    ADD CONSTRAINT "PK_notification_templates" PRIMARY KEY (id);


--
-- TOC entry 3920 (class 2606 OID 96108)
-- Name: notifications PK_notifications; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "PK_notifications" PRIMARY KEY (id);


--
-- TOC entry 3872 (class 2606 OID 95871)
-- Name: operations PK_operations; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operations
    ADD CONSTRAINT "PK_operations" PRIMARY KEY (id);


--
-- TOC entry 3886 (class 2606 OID 95938)
-- Name: ordre_fabrication PK_ordre_fabrication; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordre_fabrication
    ADD CONSTRAINT "PK_ordre_fabrication" PRIMARY KEY (id);


--
-- TOC entry 3892 (class 2606 OID 95967)
-- Name: planning PK_planning; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planning
    ADD CONSTRAINT "PK_planning" PRIMARY KEY (id);


--
-- TOC entry 3890 (class 2606 OID 95954)
-- Name: production PK_production; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.production
    ADD CONSTRAINT "PK_production" PRIMARY KEY (id);


--
-- TOC entry 3860 (class 2606 OID 95817)
-- Name: produits PK_produits; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produits
    ADD CONSTRAINT "PK_produits" PRIMARY KEY (id);


--
-- TOC entry 3837 (class 2606 OID 95659)
-- Name: projets PK_projets; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projets
    ADD CONSTRAINT "PK_projets" PRIMARY KEY (id);


--
-- TOC entry 3894 (class 2606 OID 95979)
-- Name: qualite PK_qualite; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qualite
    ADD CONSTRAINT "PK_qualite" PRIMARY KEY (id);


--
-- TOC entry 4027 (class 2606 OID 98807)
-- Name: query_builder_calculated_fields PK_query_builder_calculated_fields; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.query_builder_calculated_fields
    ADD CONSTRAINT "PK_query_builder_calculated_fields" PRIMARY KEY (id);


--
-- TOC entry 4023 (class 2606 OID 98790)
-- Name: query_builder_columns PK_query_builder_columns; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.query_builder_columns
    ADD CONSTRAINT "PK_query_builder_columns" PRIMARY KEY (id);


--
-- TOC entry 4025 (class 2606 OID 98798)
-- Name: query_builder_joins PK_query_builder_joins; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.query_builder_joins
    ADD CONSTRAINT "PK_query_builder_joins" PRIMARY KEY (id);


--
-- TOC entry 4029 (class 2606 OID 98816)
-- Name: query_builder_permissions PK_query_builder_permissions; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.query_builder_permissions
    ADD CONSTRAINT "PK_query_builder_permissions" PRIMARY KEY (id);


--
-- TOC entry 4021 (class 2606 OID 98776)
-- Name: query_builders PK_query_builders; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.query_builders
    ADD CONSTRAINT "PK_query_builders" PRIMARY KEY (id);


--
-- TOC entry 3864 (class 2606 OID 95831)
-- Name: stocks PK_stocks; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stocks
    ADD CONSTRAINT "PK_stocks" PRIMARY KEY (id);


--
-- TOC entry 3823 (class 2606 OID 95612)
-- Name: system_parameters PK_system_parameters; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_parameters
    ADD CONSTRAINT "PK_system_parameters" PRIMARY KEY (id);


--
-- TOC entry 3827 (class 2606 OID 95627)
-- Name: system_settings PK_system_settings; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT "PK_system_settings" PRIMARY KEY (id);


--
-- TOC entry 4031 (class 2606 OID 98827)
-- Name: test_categories PK_test_categories; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_categories
    ADD CONSTRAINT "PK_test_categories" PRIMARY KEY (id);


--
-- TOC entry 4041 (class 2606 OID 98860)
-- Name: test_order_items PK_test_order_items; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_order_items
    ADD CONSTRAINT "PK_test_order_items" PRIMARY KEY (id);


--
-- TOC entry 4037 (class 2606 OID 98852)
-- Name: test_orders PK_test_orders; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_orders
    ADD CONSTRAINT "PK_test_orders" PRIMARY KEY (id);


--
-- TOC entry 4033 (class 2606 OID 98840)
-- Name: test_products PK_test_products; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_products
    ADD CONSTRAINT "PK_test_products" PRIMARY KEY (id);


--
-- TOC entry 3904 (class 2606 OID 96032)
-- Name: tracabilite PK_tracabilite; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tracabilite
    ADD CONSTRAINT "PK_tracabilite" PRIMARY KEY (id);


--
-- TOC entry 3848 (class 2606 OID 95771)
-- Name: user_groups PK_user_groups; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_groups
    ADD CONSTRAINT "PK_user_groups" PRIMARY KEY (id);


--
-- TOC entry 3926 (class 2606 OID 96178)
-- Name: user_menu_item_preferences PK_user_menu_item_preferences; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_menu_item_preferences
    ADD CONSTRAINT "PK_user_menu_item_preferences" PRIMARY KEY (id);


--
-- TOC entry 3930 (class 2606 OID 96193)
-- Name: user_menu_preferences PK_user_menu_preferences; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_menu_preferences
    ADD CONSTRAINT "PK_user_menu_preferences" PRIMARY KEY (id);


--
-- TOC entry 3839 (class 2606 OID 95677)
-- Name: user_menu_preferences_admin PK_user_menu_preferences_admin; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_menu_preferences_admin
    ADD CONSTRAINT "PK_user_menu_preferences_admin" PRIMARY KEY (id);


--
-- TOC entry 3940 (class 2606 OID 96570)
-- Name: user_menu_preferences_old PK_user_menu_preferences_old; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_menu_preferences_old
    ADD CONSTRAINT "PK_user_menu_preferences_old" PRIMARY KEY (id);


--
-- TOC entry 3949 (class 2606 OID 98031)
-- Name: user_mfa PK_user_mfa; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_mfa
    ADD CONSTRAINT "PK_user_mfa" PRIMARY KEY (id);


--
-- TOC entry 4017 (class 2606 OID 98588)
-- Name: user_settings PK_user_settings; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT "PK_user_settings" PRIMARY KEY (id);


--
-- TOC entry 3817 (class 2606 OID 95595)
-- Name: users PK_users; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_users" PRIMARY KEY (id);


--
-- TOC entry 3833 (class 2606 OID 95644)
-- Name: clients UQ_clients_email; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT "UQ_clients_email" UNIQUE (email);


--
-- TOC entry 3835 (class 2606 OID 95646)
-- Name: clients UQ_clients_numero_client; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT "UQ_clients_numero_client" UNIQUE (numero_client);


--
-- TOC entry 3884 (class 2606 OID 95924)
-- Name: commandes UQ_commandes_numero; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commandes
    ADD CONSTRAINT "UQ_commandes_numero" UNIQUE (numero);


--
-- TOC entry 3878 (class 2606 OID 95892)
-- Name: devis UQ_devis_numero; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.devis
    ADD CONSTRAINT "UQ_devis_numero" UNIQUE (numero);


--
-- TOC entry 3900 (class 2606 OID 96009)
-- Name: facturation UQ_facturation_numero; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturation
    ADD CONSTRAINT "UQ_facturation_numero" UNIQUE (numero);


--
-- TOC entry 3854 (class 2606 OID 95788)
-- Name: fournisseurs UQ_fournisseurs_code; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fournisseurs
    ADD CONSTRAINT "UQ_fournisseurs_code" UNIQUE (code);


--
-- TOC entry 3846 (class 2606 OID 95738)
-- Name: groups UQ_groups_code; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT "UQ_groups_code" UNIQUE (code);


--
-- TOC entry 3870 (class 2606 OID 95858)
-- Name: machines UQ_machines_code; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.machines
    ADD CONSTRAINT "UQ_machines_code" UNIQUE (code);


--
-- TOC entry 3858 (class 2606 OID 95803)
-- Name: materiaux UQ_materiaux_code; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materiaux
    ADD CONSTRAINT "UQ_materiaux_code" UNIQUE (code);


--
-- TOC entry 4005 (class 2606 OID 98518)
-- Name: menu_item_permissions UQ_menu_item_permission; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_item_permissions
    ADD CONSTRAINT "UQ_menu_item_permission" UNIQUE ("menuItemId", "permissionId");


--
-- TOC entry 3988 (class 2606 OID 98391)
-- Name: menu_item_roles UQ_menu_item_role; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_item_roles
    ADD CONSTRAINT "UQ_menu_item_role" UNIQUE ("menuItemId", "roleId");


--
-- TOC entry 3953 (class 2606 OID 98048)
-- Name: mfa_session UQ_mfa_session_sessionToken; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mfa_session
    ADD CONSTRAINT "UQ_mfa_session_sessionToken" UNIQUE ("sessionToken");


--
-- TOC entry 3924 (class 2606 OID 96120)
-- Name: notification_reads UQ_notification_reads; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_reads
    ADD CONSTRAINT "UQ_notification_reads" UNIQUE (notification_id, user_id);


--
-- TOC entry 3918 (class 2606 OID 96095)
-- Name: notification_settings UQ_notification_settings; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_settings
    ADD CONSTRAINT "UQ_notification_settings" UNIQUE (user_id, type, channel);


--
-- TOC entry 3908 (class 2606 OID 96046)
-- Name: notification_templates UQ_notification_templates_code; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_templates
    ADD CONSTRAINT "UQ_notification_templates_code" UNIQUE (code);


--
-- TOC entry 3874 (class 2606 OID 95873)
-- Name: operations UQ_operations_code; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operations
    ADD CONSTRAINT "UQ_operations_code" UNIQUE (code);


--
-- TOC entry 3888 (class 2606 OID 95940)
-- Name: ordre_fabrication UQ_ordre_fabrication_numero; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordre_fabrication
    ADD CONSTRAINT "UQ_ordre_fabrication_numero" UNIQUE (numero);


--
-- TOC entry 4001 (class 2606 OID 98484)
-- Name: permissions UQ_permission_module_action; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT "UQ_permission_module_action" UNIQUE ("moduleId", action);


--
-- TOC entry 3862 (class 2606 OID 95819)
-- Name: produits UQ_produits_code; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produits
    ADD CONSTRAINT "UQ_produits_code" UNIQUE (code);


--
-- TOC entry 4012 (class 2606 OID 98546)
-- Name: role_permissions UQ_role_permission; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT "UQ_role_permission" UNIQUE ("roleId", "permissionId");


--
-- TOC entry 3825 (class 2606 OID 95614)
-- Name: system_parameters UQ_system_parameters_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_parameters
    ADD CONSTRAINT "UQ_system_parameters_key" UNIQUE (key);


--
-- TOC entry 3829 (class 2606 OID 95629)
-- Name: system_settings UQ_system_settings_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT "UQ_system_settings_key" UNIQUE (key);


--
-- TOC entry 4039 (class 2606 OID 98864)
-- Name: test_orders UQ_test_orders_orderNumber; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_orders
    ADD CONSTRAINT "UQ_test_orders_orderNumber" UNIQUE ("orderNumber");


--
-- TOC entry 4035 (class 2606 OID 98862)
-- Name: test_products UQ_test_products_sku; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_products
    ADD CONSTRAINT "UQ_test_products_sku" UNIQUE (sku);


--
-- TOC entry 3850 (class 2606 OID 95773)
-- Name: user_groups UQ_user_groups; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_groups
    ADD CONSTRAINT "UQ_user_groups" UNIQUE (user_id, group_id);


--
-- TOC entry 3928 (class 2606 OID 96180)
-- Name: user_menu_item_preferences UQ_user_menu_item_preferences; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_menu_item_preferences
    ADD CONSTRAINT "UQ_user_menu_item_preferences" UNIQUE (user_id, menu_item_id);


--
-- TOC entry 3932 (class 2606 OID 96195)
-- Name: user_menu_preferences UQ_user_menu_preferences; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_menu_preferences
    ADD CONSTRAINT "UQ_user_menu_preferences" UNIQUE (user_id, menu_id);


--
-- TOC entry 3841 (class 2606 OID 95679)
-- Name: user_menu_preferences_admin UQ_user_menu_preferences_admin_userId; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_menu_preferences_admin
    ADD CONSTRAINT "UQ_user_menu_preferences_admin_userId" UNIQUE ("userId");


--
-- TOC entry 3984 (class 2606 OID 98357)
-- Name: user_roles UQ_user_role; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT "UQ_user_role" UNIQUE ("userId", "roleId");


--
-- TOC entry 4019 (class 2606 OID 98590)
-- Name: user_settings UQ_user_settings_userId; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT "UQ_user_settings_userId" UNIQUE ("userId");


--
-- TOC entry 3819 (class 2606 OID 95599)
-- Name: users UQ_users_acronyme; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_users_acronyme" UNIQUE (acronyme);


--
-- TOC entry 3821 (class 2606 OID 95597)
-- Name: users UQ_users_email; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_users_email" UNIQUE (email);


--
-- TOC entry 4043 (class 2606 OID 106324)
-- Name: datatable_hierarchical_preferences datatable_hierarchical_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.datatable_hierarchical_preferences
    ADD CONSTRAINT datatable_hierarchical_preferences_pkey PRIMARY KEY (id);


--
-- TOC entry 4050 (class 2606 OID 106354)
-- Name: datatable_hierarchy_order datatable_hierarchy_order_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.datatable_hierarchy_order
    ADD CONSTRAINT datatable_hierarchy_order_pkey PRIMARY KEY (id);


--
-- TOC entry 3942 (class 2606 OID 96598)
-- Name: discovered_pages discovered_pages_page_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discovered_pages
    ADD CONSTRAINT discovered_pages_page_id_key UNIQUE (page_id);


--
-- TOC entry 3944 (class 2606 OID 96596)
-- Name: discovered_pages discovered_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discovered_pages
    ADD CONSTRAINT discovered_pages_pkey PRIMARY KEY (id);


--
-- TOC entry 3968 (class 2606 OID 98205)
-- Name: menu_configurations menu_configurations_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_configurations
    ADD CONSTRAINT menu_configurations_name_key UNIQUE (name);


--
-- TOC entry 3970 (class 2606 OID 98203)
-- Name: menu_configurations menu_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_configurations
    ADD CONSTRAINT menu_configurations_pkey PRIMARY KEY (id);


--
-- TOC entry 4007 (class 2606 OID 98516)
-- Name: menu_item_permissions menu_item_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_item_permissions
    ADD CONSTRAINT menu_item_permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 3990 (class 2606 OID 98389)
-- Name: menu_item_roles menu_item_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_item_roles
    ADD CONSTRAINT menu_item_roles_pkey PRIMARY KEY (id);


--
-- TOC entry 3975 (class 2606 OID 98216)
-- Name: menu_items menu_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3995 (class 2606 OID 98465)
-- Name: modules modules_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_name_key UNIQUE (name);


--
-- TOC entry 3997 (class 2606 OID 98463)
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);


--
-- TOC entry 4003 (class 2606 OID 98482)
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 4014 (class 2606 OID 98544)
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 3980 (class 2606 OID 98348)
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- TOC entry 3982 (class 2606 OID 98346)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 3934 (class 2606 OID 96470)
-- Name: seeds_status seeds_status_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seeds_status
    ADD CONSTRAINT seeds_status_name_key UNIQUE (name);


--
-- TOC entry 3936 (class 2606 OID 96468)
-- Name: seeds_status seeds_status_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seeds_status
    ADD CONSTRAINT seeds_status_pkey PRIMARY KEY (id);


--
-- TOC entry 4063 (class 2606 OID 106390)
-- Name: ui_preferences_reorderable_list ui_preferences_reorderable_list_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ui_preferences_reorderable_list
    ADD CONSTRAINT ui_preferences_reorderable_list_pkey PRIMARY KEY (id);


--
-- TOC entry 4065 (class 2606 OID 106392)
-- Name: ui_preferences_reorderable_list unique_user_component; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ui_preferences_reorderable_list
    ADD CONSTRAINT unique_user_component UNIQUE (user_id, component_id);


--
-- TOC entry 4048 (class 2606 OID 106326)
-- Name: datatable_hierarchical_preferences unique_user_table; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.datatable_hierarchical_preferences
    ADD CONSTRAINT unique_user_table UNIQUE (user_id, table_id);


--
-- TOC entry 4058 (class 2606 OID 106356)
-- Name: datatable_hierarchy_order unique_user_table_item; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.datatable_hierarchy_order
    ADD CONSTRAINT unique_user_table_item UNIQUE (user_id, table_id, item_id);


--
-- TOC entry 3986 (class 2606 OID 98355)
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- TOC entry 3961 (class 2606 OID 98106)
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 3963 (class 2606 OID 98126)
-- Name: user_sessions user_sessions_sessionId_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT "user_sessions_sessionId_key" UNIQUE ("sessionId");


--
-- TOC entry 3964 (class 1259 OID 98258)
-- Name: IDX_menu_configurations_isActive; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_menu_configurations_isActive" ON public.menu_configurations USING btree ("isActive");


--
-- TOC entry 3965 (class 1259 OID 98259)
-- Name: IDX_menu_configurations_isSystem; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_menu_configurations_isSystem" ON public.menu_configurations USING btree ("isSystem");


--
-- TOC entry 3966 (class 1259 OID 98257)
-- Name: IDX_menu_configurations_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_menu_configurations_name" ON public.menu_configurations USING btree (name);


--
-- TOC entry 3971 (class 1259 OID 98260)
-- Name: IDX_menu_items_configId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_menu_items_configId" ON public.menu_items USING btree ("configId");


--
-- TOC entry 3972 (class 1259 OID 98262)
-- Name: IDX_menu_items_orderIndex; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_menu_items_orderIndex" ON public.menu_items USING btree ("orderIndex");


--
-- TOC entry 3973 (class 1259 OID 98261)
-- Name: IDX_menu_items_parentId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_menu_items_parentId" ON public.menu_items USING btree ("parentId");


--
-- TOC entry 3991 (class 1259 OID 98530)
-- Name: IDX_modules_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_modules_category" ON public.modules USING btree (category);


--
-- TOC entry 3992 (class 1259 OID 98531)
-- Name: IDX_modules_isActive; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_modules_isActive" ON public.modules USING btree ("isActive");


--
-- TOC entry 3993 (class 1259 OID 98529)
-- Name: IDX_modules_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_modules_name" ON public.modules USING btree (name);


--
-- TOC entry 3998 (class 1259 OID 98532)
-- Name: IDX_permissions_moduleId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_permissions_moduleId" ON public.permissions USING btree ("moduleId");


--
-- TOC entry 3999 (class 1259 OID 98533)
-- Name: IDX_permissions_module_action; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_permissions_module_action" ON public.permissions USING btree ("moduleId", action);


--
-- TOC entry 4008 (class 1259 OID 98558)
-- Name: IDX_role_permissions_permissionId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_role_permissions_permissionId" ON public.role_permissions USING btree ("permissionId");


--
-- TOC entry 4009 (class 1259 OID 98557)
-- Name: IDX_role_permissions_roleId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_role_permissions_roleId" ON public.role_permissions USING btree ("roleId");


--
-- TOC entry 4010 (class 1259 OID 98559)
-- Name: IDX_role_permissions_role_permission; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_role_permissions_role_permission" ON public.role_permissions USING btree ("roleId", "permissionId");


--
-- TOC entry 3976 (class 1259 OID 98404)
-- Name: IDX_roles_isActive; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_roles_isActive" ON public.roles USING btree ("isActive");


--
-- TOC entry 3977 (class 1259 OID 98403)
-- Name: IDX_roles_isSystemRole; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_roles_isSystemRole" ON public.roles USING btree ("isSystemRole");


--
-- TOC entry 3978 (class 1259 OID 98402)
-- Name: IDX_roles_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_roles_name" ON public.roles USING btree (name);


--
-- TOC entry 3937 (class 1259 OID 96577)
-- Name: IDX_user_menu_preferences_old_menu_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_user_menu_preferences_old_menu_id" ON public.user_menu_preferences_old USING btree (menu_id);


--
-- TOC entry 3938 (class 1259 OID 96576)
-- Name: IDX_user_menu_preferences_old_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_user_menu_preferences_old_user_id" ON public.user_menu_preferences_old USING btree (user_id);


--
-- TOC entry 3954 (class 1259 OID 98123)
-- Name: IDX_user_sessions_isActive; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_user_sessions_isActive" ON public.user_sessions USING btree ("isActive");


--
-- TOC entry 3955 (class 1259 OID 98122)
-- Name: IDX_user_sessions_lastActivity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_user_sessions_lastActivity" ON public.user_sessions USING btree ("lastActivity");


--
-- TOC entry 3956 (class 1259 OID 98121)
-- Name: IDX_user_sessions_loginTime; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_user_sessions_loginTime" ON public.user_sessions USING btree ("loginTime");


--
-- TOC entry 3957 (class 1259 OID 98127)
-- Name: IDX_user_sessions_sessionId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_user_sessions_sessionId" ON public.user_sessions USING btree ("sessionId");


--
-- TOC entry 3958 (class 1259 OID 98124)
-- Name: IDX_user_sessions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_user_sessions_status" ON public.user_sessions USING btree (status);


--
-- TOC entry 3959 (class 1259 OID 98119)
-- Name: IDX_user_sessions_userId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_user_sessions_userId" ON public.user_sessions USING btree ("userId");


--
-- TOC entry 4015 (class 1259 OID 98596)
-- Name: IDX_user_settings_userId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_user_settings_userId" ON public.user_settings USING btree ("userId");


--
-- TOC entry 4044 (class 1259 OID 106333)
-- Name: idx_datatable_hierarchical_table_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_datatable_hierarchical_table_id ON public.datatable_hierarchical_preferences USING btree (table_id);


--
-- TOC entry 4045 (class 1259 OID 106334)
-- Name: idx_datatable_hierarchical_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_datatable_hierarchical_updated_at ON public.datatable_hierarchical_preferences USING btree (updated_at);


--
-- TOC entry 4046 (class 1259 OID 106332)
-- Name: idx_datatable_hierarchical_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_datatable_hierarchical_user_id ON public.datatable_hierarchical_preferences USING btree (user_id);


--
-- TOC entry 4051 (class 1259 OID 106369)
-- Name: idx_datatable_hierarchy_display_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_datatable_hierarchy_display_order ON public.datatable_hierarchy_order USING btree (display_order);


--
-- TOC entry 4052 (class 1259 OID 106370)
-- Name: idx_datatable_hierarchy_level; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_datatable_hierarchy_level ON public.datatable_hierarchy_order USING btree (level);


--
-- TOC entry 4053 (class 1259 OID 106368)
-- Name: idx_datatable_hierarchy_parent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_datatable_hierarchy_parent_id ON public.datatable_hierarchy_order USING btree (parent_id);


--
-- TOC entry 4054 (class 1259 OID 106371)
-- Name: idx_datatable_hierarchy_path; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_datatable_hierarchy_path ON public.datatable_hierarchy_order USING btree (path);


--
-- TOC entry 4055 (class 1259 OID 106372)
-- Name: idx_datatable_hierarchy_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_datatable_hierarchy_updated_at ON public.datatable_hierarchy_order USING btree (updated_at);


--
-- TOC entry 4056 (class 1259 OID 106367)
-- Name: idx_datatable_hierarchy_user_table; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_datatable_hierarchy_user_table ON public.datatable_hierarchy_order USING btree (user_id, table_id);


--
-- TOC entry 3945 (class 1259 OID 96600)
-- Name: idx_discovered_pages_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_discovered_pages_category ON public.discovered_pages USING btree (category);


--
-- TOC entry 3946 (class 1259 OID 96601)
-- Name: idx_discovered_pages_is_enabled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_discovered_pages_is_enabled ON public.discovered_pages USING btree (is_enabled);


--
-- TOC entry 3947 (class 1259 OID 96599)
-- Name: idx_discovered_pages_page_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_discovered_pages_page_id ON public.discovered_pages USING btree (page_id);


--
-- TOC entry 4059 (class 1259 OID 106399)
-- Name: idx_reorderable_preferences_component_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reorderable_preferences_component_id ON public.ui_preferences_reorderable_list USING btree (component_id);


--
-- TOC entry 4060 (class 1259 OID 106400)
-- Name: idx_reorderable_preferences_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reorderable_preferences_updated_at ON public.ui_preferences_reorderable_list USING btree (updated_at);


--
-- TOC entry 4061 (class 1259 OID 106398)
-- Name: idx_reorderable_preferences_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reorderable_preferences_user_id ON public.ui_preferences_reorderable_list USING btree (user_id);


--
-- TOC entry 3842 (class 1259 OID 95680)
-- Name: user_menu_preferences_admin_userId_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "user_menu_preferences_admin_userId_unique" ON public.user_menu_preferences_admin USING btree ("userId");


--
-- TOC entry 4126 (class 2620 OID 106402)
-- Name: datatable_hierarchical_preferences update_datatable_hierarchical_preferences_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_datatable_hierarchical_preferences_updated_at BEFORE UPDATE ON public.datatable_hierarchical_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4127 (class 2620 OID 106403)
-- Name: datatable_hierarchy_order update_datatable_hierarchy_order_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_datatable_hierarchy_order_updated_at BEFORE UPDATE ON public.datatable_hierarchy_order FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4128 (class 2620 OID 106404)
-- Name: ui_preferences_reorderable_list update_ui_preferences_reorderable_list_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ui_preferences_reorderable_list_updated_at BEFORE UPDATE ON public.ui_preferences_reorderable_list FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4072 (class 2606 OID 96261)
-- Name: chutes FK_chutes_materiau; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chutes
    ADD CONSTRAINT "FK_chutes_materiau" FOREIGN KEY (materiau_id) REFERENCES public.materiaux(id) ON DELETE CASCADE;


--
-- TOC entry 4078 (class 2606 OID 96296)
-- Name: commandes FK_commandes_client; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commandes
    ADD CONSTRAINT "FK_commandes_client" FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- TOC entry 4079 (class 2606 OID 96291)
-- Name: commandes FK_commandes_devis; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commandes
    ADD CONSTRAINT "FK_commandes_devis" FOREIGN KEY (devis_id) REFERENCES public.devis(id) ON DELETE SET NULL;


--
-- TOC entry 4074 (class 2606 OID 96271)
-- Name: devis FK_devis_client; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.devis
    ADD CONSTRAINT "FK_devis_client" FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- TOC entry 4075 (class 2606 OID 96276)
-- Name: devis FK_devis_projet; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.devis
    ADD CONSTRAINT "FK_devis_projet" FOREIGN KEY (projet_id) REFERENCES public.projets(id) ON DELETE SET NULL;


--
-- TOC entry 4093 (class 2606 OID 96371)
-- Name: facturation FK_facturation_client; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturation
    ADD CONSTRAINT "FK_facturation_client" FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- TOC entry 4094 (class 2606 OID 96366)
-- Name: facturation FK_facturation_commande; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturation
    ADD CONSTRAINT "FK_facturation_commande" FOREIGN KEY (commande_id) REFERENCES public.commandes(id) ON DELETE SET NULL;


--
-- TOC entry 4076 (class 2606 OID 96281)
-- Name: ligne_devis FK_ligne_devis_devis; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ligne_devis
    ADD CONSTRAINT "FK_ligne_devis_devis" FOREIGN KEY (devis_id) REFERENCES public.devis(id) ON DELETE CASCADE;


--
-- TOC entry 4077 (class 2606 OID 96286)
-- Name: ligne_devis FK_ligne_devis_produit; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ligne_devis
    ADD CONSTRAINT "FK_ligne_devis_produit" FOREIGN KEY (produit_id) REFERENCES public.produits(id) ON DELETE SET NULL;


--
-- TOC entry 4091 (class 2606 OID 96356)
-- Name: maintenance FK_maintenance_machine; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance
    ADD CONSTRAINT "FK_maintenance_machine" FOREIGN KEY (machine_id) REFERENCES public.machines(id) ON DELETE CASCADE;


--
-- TOC entry 4092 (class 2606 OID 96361)
-- Name: maintenance FK_maintenance_technicien; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance
    ADD CONSTRAINT "FK_maintenance_technicien" FOREIGN KEY (technicien_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 4069 (class 2606 OID 96246)
-- Name: materiaux FK_materiaux_fournisseur; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materiaux
    ADD CONSTRAINT "FK_materiaux_fournisseur" FOREIGN KEY (fournisseur_id) REFERENCES public.fournisseurs(id) ON DELETE SET NULL;


--
-- TOC entry 4117 (class 2606 OID 98519)
-- Name: menu_item_permissions FK_menu_item_permissions_menuItemId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_item_permissions
    ADD CONSTRAINT "FK_menu_item_permissions_menuItemId" FOREIGN KEY ("menuItemId") REFERENCES public.menu_items(id) ON DELETE CASCADE;


--
-- TOC entry 4118 (class 2606 OID 98524)
-- Name: menu_item_permissions FK_menu_item_permissions_permissionId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_item_permissions
    ADD CONSTRAINT "FK_menu_item_permissions_permissionId" FOREIGN KEY ("permissionId") REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- TOC entry 4113 (class 2606 OID 98392)
-- Name: menu_item_roles FK_menu_item_roles_menuItemId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_item_roles
    ADD CONSTRAINT "FK_menu_item_roles_menuItemId" FOREIGN KEY ("menuItemId") REFERENCES public.menu_items(id) ON DELETE CASCADE;


--
-- TOC entry 4114 (class 2606 OID 98397)
-- Name: menu_item_roles FK_menu_item_roles_roleId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_item_roles
    ADD CONSTRAINT "FK_menu_item_roles_roleId" FOREIGN KEY ("roleId") REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- TOC entry 4109 (class 2606 OID 98217)
-- Name: menu_items FK_menu_items_configId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT "FK_menu_items_configId" FOREIGN KEY ("configId") REFERENCES public.menu_configurations(id) ON DELETE CASCADE;


--
-- TOC entry 4110 (class 2606 OID 98222)
-- Name: menu_items FK_menu_items_parentId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT "FK_menu_items_parentId" FOREIGN KEY ("parentId") REFERENCES public.menu_items(id) ON DELETE CASCADE;


--
-- TOC entry 4106 (class 2606 OID 98054)
-- Name: mfa_session FK_mfa_session_userId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mfa_session
    ADD CONSTRAINT "FK_mfa_session_userId" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4115 (class 2606 OID 98466)
-- Name: modules FK_modules_parentModuleId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT "FK_modules_parentModuleId" FOREIGN KEY ("parentModuleId") REFERENCES public.modules(id) ON DELETE SET NULL;


--
-- TOC entry 4100 (class 2606 OID 96401)
-- Name: notification_reads FK_notification_reads_notification; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_reads
    ADD CONSTRAINT "FK_notification_reads_notification" FOREIGN KEY (notification_id) REFERENCES public.notifications(id) ON DELETE CASCADE;


--
-- TOC entry 4101 (class 2606 OID 96406)
-- Name: notification_reads FK_notification_reads_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_reads
    ADD CONSTRAINT "FK_notification_reads_user" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4096 (class 2606 OID 96391)
-- Name: notification_rule_executions FK_notification_rule_executions_event; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_rule_executions
    ADD CONSTRAINT "FK_notification_rule_executions_event" FOREIGN KEY (event_id) REFERENCES public.notification_events(id) ON DELETE CASCADE;


--
-- TOC entry 4097 (class 2606 OID 96386)
-- Name: notification_rule_executions FK_notification_rule_executions_rule; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_rule_executions
    ADD CONSTRAINT "FK_notification_rule_executions_rule" FOREIGN KEY (rule_id) REFERENCES public.notification_rules(id) ON DELETE CASCADE;


--
-- TOC entry 4095 (class 2606 OID 96381)
-- Name: notification_rules FK_notification_rules_template; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_rules
    ADD CONSTRAINT "FK_notification_rules_template" FOREIGN KEY (template_id) REFERENCES public.notification_templates(id) ON DELETE SET NULL;


--
-- TOC entry 4098 (class 2606 OID 96396)
-- Name: notification_settings FK_notification_settings_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_settings
    ADD CONSTRAINT "FK_notification_settings_user" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4099 (class 2606 OID 96376)
-- Name: notifications FK_notifications_sender; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "FK_notifications_sender" FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 4073 (class 2606 OID 96266)
-- Name: operations FK_operations_machine; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operations
    ADD CONSTRAINT "FK_operations_machine" FOREIGN KEY (machine_id) REFERENCES public.machines(id) ON DELETE SET NULL;


--
-- TOC entry 4080 (class 2606 OID 96301)
-- Name: ordre_fabrication FK_ordre_fabrication_commande; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordre_fabrication
    ADD CONSTRAINT "FK_ordre_fabrication_commande" FOREIGN KEY (commande_id) REFERENCES public.commandes(id) ON DELETE SET NULL;


--
-- TOC entry 4081 (class 2606 OID 96306)
-- Name: ordre_fabrication FK_ordre_fabrication_produit; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordre_fabrication
    ADD CONSTRAINT "FK_ordre_fabrication_produit" FOREIGN KEY (produit_id) REFERENCES public.produits(id) ON DELETE CASCADE;


--
-- TOC entry 4116 (class 2606 OID 98485)
-- Name: permissions FK_permissions_moduleId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT "FK_permissions_moduleId" FOREIGN KEY ("moduleId") REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- TOC entry 4086 (class 2606 OID 96331)
-- Name: planning FK_planning_assignee; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planning
    ADD CONSTRAINT "FK_planning_assignee" FOREIGN KEY (assignee_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 4087 (class 2606 OID 96336)
-- Name: planning FK_planning_machine; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planning
    ADD CONSTRAINT "FK_planning_machine" FOREIGN KEY (machine_id) REFERENCES public.machines(id) ON DELETE SET NULL;


--
-- TOC entry 4088 (class 2606 OID 96341)
-- Name: planning FK_planning_production; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planning
    ADD CONSTRAINT "FK_planning_production" FOREIGN KEY (production_id) REFERENCES public.production(id) ON DELETE CASCADE;


--
-- TOC entry 4082 (class 2606 OID 96321)
-- Name: production FK_production_machine; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.production
    ADD CONSTRAINT "FK_production_machine" FOREIGN KEY (machine_id) REFERENCES public.machines(id) ON DELETE SET NULL;


--
-- TOC entry 4083 (class 2606 OID 96326)
-- Name: production FK_production_operateur; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.production
    ADD CONSTRAINT "FK_production_operateur" FOREIGN KEY (operateur_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 4084 (class 2606 OID 96316)
-- Name: production FK_production_operation; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.production
    ADD CONSTRAINT "FK_production_operation" FOREIGN KEY (operation_id) REFERENCES public.operations(id) ON DELETE CASCADE;


--
-- TOC entry 4085 (class 2606 OID 96311)
-- Name: production FK_production_ordre_fabrication; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.production
    ADD CONSTRAINT "FK_production_ordre_fabrication" FOREIGN KEY (ordre_fabrication_id) REFERENCES public.ordre_fabrication(id) ON DELETE CASCADE;


--
-- TOC entry 4070 (class 2606 OID 96251)
-- Name: produits FK_produits_materiau; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produits
    ADD CONSTRAINT "FK_produits_materiau" FOREIGN KEY (materiau_id) REFERENCES public.materiaux(id) ON DELETE SET NULL;


--
-- TOC entry 4066 (class 2606 OID 95660)
-- Name: projets FK_projets_client; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projets
    ADD CONSTRAINT "FK_projets_client" FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- TOC entry 4089 (class 2606 OID 96351)
-- Name: qualite FK_qualite_controleur; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qualite
    ADD CONSTRAINT "FK_qualite_controleur" FOREIGN KEY (controleur_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4090 (class 2606 OID 96346)
-- Name: qualite FK_qualite_production; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qualite
    ADD CONSTRAINT "FK_qualite_production" FOREIGN KEY (production_id) REFERENCES public.production(id) ON DELETE CASCADE;


--
-- TOC entry 4119 (class 2606 OID 98552)
-- Name: role_permissions FK_role_permissions_permissionId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT "FK_role_permissions_permissionId" FOREIGN KEY ("permissionId") REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- TOC entry 4120 (class 2606 OID 98547)
-- Name: role_permissions FK_role_permissions_roleId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT "FK_role_permissions_roleId" FOREIGN KEY ("roleId") REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- TOC entry 4071 (class 2606 OID 96256)
-- Name: stocks FK_stocks_produit; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stocks
    ADD CONSTRAINT "FK_stocks_produit" FOREIGN KEY (produit_id) REFERENCES public.produits(id) ON DELETE CASCADE;


--
-- TOC entry 4067 (class 2606 OID 96241)
-- Name: user_groups FK_user_groups_group; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_groups
    ADD CONSTRAINT "FK_user_groups_group" FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- TOC entry 4068 (class 2606 OID 96236)
-- Name: user_groups FK_user_groups_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_groups
    ADD CONSTRAINT "FK_user_groups_user" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4102 (class 2606 OID 96441)
-- Name: user_menu_item_preferences FK_user_menu_item_preferences_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_menu_item_preferences
    ADD CONSTRAINT "FK_user_menu_item_preferences_user" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4104 (class 2606 OID 96578)
-- Name: user_menu_preferences_old FK_user_menu_preferences_old_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_menu_preferences_old
    ADD CONSTRAINT "FK_user_menu_preferences_old_user" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4103 (class 2606 OID 96451)
-- Name: user_menu_preferences FK_user_menu_preferences_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_menu_preferences
    ADD CONSTRAINT "FK_user_menu_preferences_user" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4105 (class 2606 OID 98049)
-- Name: user_mfa FK_user_mfa_userId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_mfa
    ADD CONSTRAINT "FK_user_mfa_userId" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4111 (class 2606 OID 98363)
-- Name: user_roles FK_user_roles_roleId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT "FK_user_roles_roleId" FOREIGN KEY ("roleId") REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- TOC entry 4112 (class 2606 OID 98358)
-- Name: user_roles FK_user_roles_userId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT "FK_user_roles_userId" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4107 (class 2606 OID 98114)
-- Name: user_sessions FK_user_sessions_forcedLogoutBy; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT "FK_user_sessions_forcedLogoutBy" FOREIGN KEY ("forcedLogoutBy") REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 4108 (class 2606 OID 98109)
-- Name: user_sessions FK_user_sessions_userId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT "FK_user_sessions_userId" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4121 (class 2606 OID 98591)
-- Name: user_settings FK_user_settings_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT "FK_user_settings_user" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4122 (class 2606 OID 106327)
-- Name: datatable_hierarchical_preferences fk_hierarchical_preferences_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.datatable_hierarchical_preferences
    ADD CONSTRAINT fk_hierarchical_preferences_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4123 (class 2606 OID 106362)
-- Name: datatable_hierarchy_order fk_hierarchy_order_preferences; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.datatable_hierarchy_order
    ADD CONSTRAINT fk_hierarchy_order_preferences FOREIGN KEY (user_id, table_id) REFERENCES public.datatable_hierarchical_preferences(user_id, table_id) ON DELETE CASCADE;


--
-- TOC entry 4124 (class 2606 OID 106357)
-- Name: datatable_hierarchy_order fk_hierarchy_order_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.datatable_hierarchy_order
    ADD CONSTRAINT fk_hierarchy_order_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4125 (class 2606 OID 106393)
-- Name: ui_preferences_reorderable_list fk_reorderable_preferences_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ui_preferences_reorderable_list
    ADD CONSTRAINT fk_reorderable_preferences_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- Completed on 2025-07-24 08:39:30

--
-- PostgreSQL database dump complete
--

