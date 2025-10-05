-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.item_waste_global (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL,
  material_id uuid NOT NULL,
  waste_per_unit numeric NOT NULL DEFAULT 0 CHECK (waste_per_unit >= 0::numeric),
  CONSTRAINT item_waste_global_pkey PRIMARY KEY (id),
  CONSTRAINT item_waste_global_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items_global(id),
  CONSTRAINT item_waste_global_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials_global(id)
);
CREATE TABLE public.items_global (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  units_label text NOT NULL DEFAULT 'unit'::text,
  mass_per_unit numeric DEFAULT 1.0,
  lifetime_weeks integer DEFAULT 1 CHECK (lifetime_weeks > 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT items_global_pkey PRIMARY KEY (id)
);
CREATE TABLE public.job_deadlines (
  job_id uuid NOT NULL,
  item_id uuid NOT NULL,
  week integer NOT NULL CHECK (week >= 1),
  amount numeric NOT NULL CHECK (amount >= 0::numeric),
  CONSTRAINT job_deadlines_pkey PRIMARY KEY (item_id, week, job_id),
  CONSTRAINT job_deadlines_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT job_deadlines_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items_global(id)
);
CREATE TABLE public.job_enabled_items (
  job_id uuid NOT NULL,
  item_id uuid NOT NULL,
  CONSTRAINT job_enabled_items_pkey PRIMARY KEY (item_id, job_id),
  CONSTRAINT job_enabled_items_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT job_enabled_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items_global(id)
);
CREATE TABLE public.job_enabled_materials (
  job_id uuid NOT NULL,
  material_id uuid NOT NULL,
  CONSTRAINT job_enabled_materials_pkey PRIMARY KEY (material_id, job_id),
  CONSTRAINT job_enabled_materials_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT job_enabled_materials_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials_global(id)
);
CREATE TABLE public.job_enabled_methods (
  job_id uuid NOT NULL,
  method_id uuid NOT NULL,
  CONSTRAINT job_enabled_methods_pkey PRIMARY KEY (method_id, job_id),
  CONSTRAINT job_enabled_methods_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT job_enabled_methods_method_id_fkey FOREIGN KEY (method_id) REFERENCES public.methods_global(id)
);
CREATE TABLE public.job_enabled_outputs (
  job_id uuid NOT NULL,
  output_id uuid NOT NULL,
  CONSTRAINT job_enabled_outputs_pkey PRIMARY KEY (output_id, job_id),
  CONSTRAINT job_enabled_outputs_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT job_enabled_outputs_output_id_fkey FOREIGN KEY (output_id) REFERENCES public.outputs_global(id)
);
CREATE TABLE public.job_enabled_substitutes (
  job_id uuid NOT NULL,
  substitute_id uuid NOT NULL,
  CONSTRAINT job_enabled_substitutes_pkey PRIMARY KEY (job_id, substitute_id),
  CONSTRAINT job_enabled_substitutes_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT job_enabled_substitutes_substitute_id_fkey FOREIGN KEY (substitute_id) REFERENCES public.substitutes_global(id)
);
CREATE TABLE public.job_item_demands (
  job_id uuid NOT NULL,
  item_id uuid NOT NULL,
  week integer NOT NULL CHECK (week >= 1),
  amount numeric NOT NULL CHECK (amount >= 0::numeric),
  CONSTRAINT job_item_demands_pkey PRIMARY KEY (item_id, week, job_id),
  CONSTRAINT job_item_demands_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT job_item_demands_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items_global(id)
);
CREATE TABLE public.job_item_inventory (
  job_id uuid NOT NULL,
  item_id uuid NOT NULL,
  qty_units numeric NOT NULL DEFAULT 0 CHECK (qty_units >= 0::numeric),
  CONSTRAINT job_item_inventory_pkey PRIMARY KEY (item_id, job_id),
  CONSTRAINT job_item_inventory_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT job_item_inventory_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items_global(id)
);
CREATE TABLE public.job_material_inventory (
  job_id uuid NOT NULL,
  material_id uuid NOT NULL,
  qty_kg numeric NOT NULL DEFAULT 0 CHECK (qty_kg >= 0::numeric),
  CONSTRAINT job_material_inventory_pkey PRIMARY KEY (job_id, material_id),
  CONSTRAINT job_material_inventory_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT job_material_inventory_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials_global(id)
);
CREATE TABLE public.job_method_capacity (
  job_id uuid NOT NULL,
  method_id uuid NOT NULL,
  week integer NOT NULL CHECK (week >= 1),
  max_capacity_kg numeric NOT NULL DEFAULT 0 CHECK (max_capacity_kg >= 0::numeric),
  available boolean NOT NULL DEFAULT true,
  CONSTRAINT job_method_capacity_pkey PRIMARY KEY (method_id, week, job_id),
  CONSTRAINT job_method_capacity_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT job_method_capacity_method_id_fkey FOREIGN KEY (method_id) REFERENCES public.methods_global(id)
);
CREATE TABLE public.job_output_inventory (
  job_id uuid NOT NULL,
  output_id uuid NOT NULL,
  qty_kg numeric NOT NULL DEFAULT 0 CHECK (qty_kg >= 0::numeric),
  CONSTRAINT job_output_inventory_pkey PRIMARY KEY (output_id, job_id),
  CONSTRAINT job_output_inventory_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT job_output_inventory_output_id_fkey FOREIGN KEY (output_id) REFERENCES public.outputs_global(id)
);
CREATE TABLE public.job_result_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  item_id uuid NOT NULL,
  week integer NOT NULL CHECK (week >= 1),
  used_total numeric NOT NULL DEFAULT 0,
  used_carried numeric NOT NULL DEFAULT 0,
  shortage numeric NOT NULL DEFAULT 0,
  CONSTRAINT job_result_items_pkey PRIMARY KEY (id),
  CONSTRAINT job_result_items_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT job_result_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items_global(id)
);
CREATE TABLE public.job_result_outputs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  output_id uuid NOT NULL,
  week integer NOT NULL CHECK (week >= 1),
  produced_kg numeric NOT NULL DEFAULT 0,
  inventory_kg numeric NOT NULL DEFAULT 0,
  CONSTRAINT job_result_outputs_pkey PRIMARY KEY (id),
  CONSTRAINT job_result_outputs_output_id_fkey FOREIGN KEY (output_id) REFERENCES public.outputs_global(id),
  CONSTRAINT job_result_outputs_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id)
);
CREATE TABLE public.job_result_schedule (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  week integer NOT NULL CHECK (week >= 1),
  recipe_id uuid NOT NULL,
  processed_kg numeric NOT NULL DEFAULT 0,
  is_running boolean NOT NULL DEFAULT false,
  materials_processed jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT job_result_schedule_pkey PRIMARY KEY (id),
  CONSTRAINT job_result_schedule_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT job_result_schedule_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipes_global(id)
);
CREATE TABLE public.job_result_substitute_breakdown (
  job_id uuid NOT NULL,
  substitute_id uuid NOT NULL,
  total_made numeric NOT NULL DEFAULT 0,
  CONSTRAINT job_result_substitute_breakdown_pkey PRIMARY KEY (substitute_id, job_id),
  CONSTRAINT job_result_substitute_breakdown_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT job_result_substitute_breakdown_substitute_id_fkey FOREIGN KEY (substitute_id) REFERENCES public.substitutes_global(id)
);
CREATE TABLE public.job_result_substitutes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  substitute_id uuid NOT NULL,
  week integer NOT NULL CHECK (week >= 1),
  made numeric NOT NULL DEFAULT 0,
  inventory numeric NOT NULL DEFAULT 0,
  used_for_items jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT job_result_substitutes_pkey PRIMARY KEY (id),
  CONSTRAINT job_result_substitutes_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT job_result_substitutes_substitute_id_fkey FOREIGN KEY (substitute_id) REFERENCES public.substitutes_global(id)
);
CREATE TABLE public.job_result_summary (
  job_id uuid NOT NULL,
  objective_value numeric NOT NULL,
  total_processed_kg numeric NOT NULL DEFAULT 0,
  total_output_produced_kg numeric NOT NULL DEFAULT 0,
  total_substitutes_made numeric NOT NULL DEFAULT 0,
  total_initial_carriage_weight numeric NOT NULL DEFAULT 0,
  total_final_carriage_weight numeric NOT NULL DEFAULT 0,
  total_carried_weight_loss numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT job_result_summary_pkey PRIMARY KEY (job_id),
  CONSTRAINT job_result_summary_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id)
);
CREATE TABLE public.job_result_weight_loss (
  job_id uuid NOT NULL,
  item_id uuid NOT NULL,
  initial_units numeric NOT NULL DEFAULT 0,
  units_used numeric NOT NULL DEFAULT 0,
  final_units numeric NOT NULL DEFAULT 0,
  mass_per_unit numeric NOT NULL DEFAULT 0,
  initial_weight numeric NOT NULL DEFAULT 0,
  final_weight numeric NOT NULL DEFAULT 0,
  total_weight_loss numeric NOT NULL DEFAULT 0,
  CONSTRAINT job_result_weight_loss_pkey PRIMARY KEY (item_id, job_id),
  CONSTRAINT job_result_weight_loss_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT job_result_weight_loss_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items_global(id)
);
CREATE TABLE public.job_substitute_inventory (
  job_id uuid NOT NULL,
  substitute_id uuid NOT NULL,
  qty_units numeric NOT NULL DEFAULT 0 CHECK (qty_units >= 0::numeric),
  CONSTRAINT job_substitute_inventory_pkey PRIMARY KEY (substitute_id, job_id),
  CONSTRAINT job_substitute_inventory_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT job_substitute_inventory_substitute_id_fkey FOREIGN KEY (substitute_id) REFERENCES public.substitutes_global(id)
);
CREATE TABLE public.job_week_resources (
  job_id uuid NOT NULL,
  week integer NOT NULL CHECK (week >= 1),
  crew_available numeric NOT NULL DEFAULT 0 CHECK (crew_available >= 0::numeric),
  energy_available numeric NOT NULL DEFAULT 0 CHECK (energy_available >= 0::numeric),
  CONSTRAINT job_week_resources_pkey PRIMARY KEY (week, job_id),
  CONSTRAINT job_week_resources_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id)
);
CREATE TABLE public.jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL,
  created_by uuid,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'running'::text, 'completed'::text, 'failed'::text, 'cancelled'::text])),
  total_weeks integer NOT NULL CHECK (total_weeks >= 1),
  w_mass numeric NOT NULL DEFAULT 1.0,
  w_value numeric NOT NULL DEFAULT 1.0,
  w_crew numeric NOT NULL DEFAULT 0.5,
  w_energy numeric NOT NULL DEFAULT 0.2,
  w_risk numeric NOT NULL DEFAULT 0.3,
  w_make numeric NOT NULL DEFAULT 0.0,
  w_carry numeric NOT NULL DEFAULT 0.0,
  w_shortage numeric NOT NULL DEFAULT 10000.0,
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  result_summary jsonb,
  result_bundle jsonb,
  solver_status jsonb,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT jobs_pkey PRIMARY KEY (id),
  CONSTRAINT jobs_mission_id_fkey FOREIGN KEY (mission_id) REFERENCES public.missions(id),
  CONSTRAINT jobs_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.materials_global (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'other'::text,
  default_mass_per_unit numeric DEFAULT 1.0,
  max_input_capacity_kg numeric CHECK (max_input_capacity_kg >= 0::numeric),
  tags ARRAY NOT NULL DEFAULT '{}'::text[],
  safety_flags jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT materials_global_pkey PRIMARY KEY (id),
  CONSTRAINT materials_global_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.methods_global (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  min_lot_size numeric NOT NULL DEFAULT 1.0 CHECK (min_lot_size > 0::numeric),
  tools_required ARRAY NOT NULL DEFAULT '{}'::text[],
  availability_default boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT methods_global_pkey PRIMARY KEY (id)
);
CREATE TABLE public.missions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid,
  name text NOT NULL,
  description text,
  mission_start_date date,
  duration_weeks integer NOT NULL CHECK (duration_weeks > 0),
  transit_weeks integer NOT NULL DEFAULT 0,
  surface_weeks integer NOT NULL DEFAULT 0,
  return_weeks integer NOT NULL DEFAULT 0,
  crew_count integer NOT NULL DEFAULT 0 CHECK (crew_count >= 0),
  crew_hours_per_week numeric NOT NULL DEFAULT 0 CHECK (crew_hours_per_week >= 0::numeric),
  printer_capacity_kg_per_week numeric NOT NULL DEFAULT 0 CHECK (printer_capacity_kg_per_week >= 0::numeric),
  tools_available ARRAY NOT NULL DEFAULT '{}'::text[],
  status USER-DEFINED NOT NULL DEFAULT 'Planned'::mission_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT missions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.outputs_global (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  units_label text NOT NULL DEFAULT 'kg'::text,
  value_per_kg numeric NOT NULL DEFAULT 0 CHECK (value_per_kg >= 0::numeric),
  max_output_capacity_kg numeric CHECK (max_output_capacity_kg >= 0::numeric),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT outputs_global_pkey PRIMARY KEY (id)
);
CREATE TABLE public.recipe_outputs_global (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL,
  output_id uuid NOT NULL,
  yield_ratio numeric NOT NULL CHECK (yield_ratio >= 0::numeric AND yield_ratio <= 1::numeric),
  CONSTRAINT recipe_outputs_global_pkey PRIMARY KEY (id),
  CONSTRAINT recipe_outputs_global_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipes_global(id),
  CONSTRAINT recipe_outputs_global_output_id_fkey FOREIGN KEY (output_id) REFERENCES public.outputs_global(id)
);
CREATE TABLE public.recipes_global (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL,
  method_id uuid NOT NULL,
  crew_cost_per_kg numeric NOT NULL DEFAULT 0 CHECK (crew_cost_per_kg >= 0::numeric),
  energy_cost_kwh_per_kg numeric NOT NULL DEFAULT 0 CHECK (energy_cost_kwh_per_kg >= 0::numeric),
  risk_cost numeric NOT NULL DEFAULT 0 CHECK (risk_cost >= 0::numeric),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT recipes_global_pkey PRIMARY KEY (id),
  CONSTRAINT recipes_global_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials_global(id),
  CONSTRAINT recipes_global_method_id_fkey FOREIGN KEY (method_id) REFERENCES public.methods_global(id)
);
CREATE TABLE public.substitute_recipes_global (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  substitute_id uuid NOT NULL,
  output_id uuid NOT NULL,
  ratio_output_per_substitute numeric NOT NULL DEFAULT 1.0 CHECK (ratio_output_per_substitute > 0::numeric),
  CONSTRAINT substitute_recipes_global_pkey PRIMARY KEY (id),
  CONSTRAINT substitute_recipes_global_substitute_id_fkey FOREIGN KEY (substitute_id) REFERENCES public.substitutes_global(id),
  CONSTRAINT substitute_recipes_global_output_id_fkey FOREIGN KEY (output_id) REFERENCES public.outputs_global(id)
);
CREATE TABLE public.substitute_waste_global (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  substitute_id uuid NOT NULL,
  material_id uuid NOT NULL,
  waste_per_unit numeric NOT NULL DEFAULT 0 CHECK (waste_per_unit >= 0::numeric),
  CONSTRAINT substitute_waste_global_pkey PRIMARY KEY (id),
  CONSTRAINT substitute_waste_global_substitute_id_fkey FOREIGN KEY (substitute_id) REFERENCES public.substitutes_global(id),
  CONSTRAINT substitute_waste_global_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials_global(id)
);
CREATE TABLE public.substitutes_can_replace_global (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL,
  substitute_id uuid NOT NULL,
  CONSTRAINT substitutes_can_replace_global_pkey PRIMARY KEY (id),
  CONSTRAINT substitutes_can_replace_global_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items_global(id),
  CONSTRAINT substitutes_can_replace_global_substitute_id_fkey FOREIGN KEY (substitute_id) REFERENCES public.substitutes_global(id)
);
CREATE TABLE public.substitutes_global (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  value_per_unit numeric DEFAULT 0 CHECK (value_per_unit >= 0::numeric),
  lifetime_weeks integer DEFAULT 2 CHECK (lifetime_weeks > 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT substitutes_global_pkey PRIMARY KEY (id)
);