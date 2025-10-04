# mars_recycling_optimizer.py
# Requires: pyomo + a solver (cbc/glpk/gurobi/cplex)
# Usage:
#   from mars_recycling_optimizer import MarsRecyclingOptimizer
#   opt = MarsRecyclingOptimizer(preferred_solvers=['cbc','glpk'])
#   opt.setup(data_dict)
#   opt.solve(tee=True)
#   results = opt.get_results()

from copy import deepcopy
from pyomo.environ import (
    ConcreteModel, Set, Var, NonNegativeReals, Binary, ConstraintList,
    Objective, SolverFactory, value, maximize
)


class MarsRecyclingOptimizer:
    """
    Pyomo MILP for Mars mission recycling + substitution:
      - Items (carried) and Substitutes (craftable)
      - Waste is GENERATED FROM item/substitute usage (after lifetime)
      - Recycling methods convert raw materials -> outputs
      - Outputs are consumed to build substitutes
      - Resources: crew, energy, method capacity, availability, inventory caps
    API:
      - setup(data: dict)    # builds model (normalizes input)
      - solve(tee=False)     # runs solver
      - get_results() -> dict
    """

    def __init__(self, preferred_solvers=None):
        self.solvers = preferred_solvers or ["cbc", "glpk", "cplex", "gurobi"]
        self.model = None
        self.solver = None
        self.solver_results = None
        self._data = None

    # --------------------------
    # Public API
    # --------------------------
    def setup(self, data: dict):
        """Normalize input, validate, choose solver, and build model."""
        normalized = self._normalize_input(data)
        if not self._validate_input(normalized):
            raise ValueError("Input validation failed (see printed errors).")
        self._data = normalized
        self.solver = self._select_solver()
        if self.solver is None:
            raise RuntimeError("No solver available. Install CBC/GLPK/CPLEX/Gurobi.")
        self.model = self._build_model(normalized)
        print("Model built successfully.")

    def solve(self, tee=False):
        if self.model is None or self.solver is None:
            raise RuntimeError("Call setup(data) before solve().")
        self.solver_results = self.solver.solve(self.model, tee=tee)
        print("Solve finished.")

    def get_results(self) -> dict:
        if self.model is None:
            raise RuntimeError("Model not built/solved.")
        return self._extract_results()

    # --------------------------
    # Input normalization
    # --------------------------
    def _normalize_input(self, data: dict) -> dict:
        """Normalize comma-string tuple keys into real tuples and fill defaults."""
        d = deepcopy(data)

        def parse_key_string(s):
            parts = [p.strip() for p in s.split(",")]
            parsed = []
            for p in parts:
                if p.isdigit():
                    parsed.append(int(p))
                else:
                    try:
                        pf = float(p)
                        parsed.append(pf)
                    except:
                        parsed.append(p)
            return tuple(parsed)

        # dictionaries that should have tuple keys (string keys like "plastic,1" allowed)
        tuple_maps = [
            ("item_demands", 2),
            ("yields", 3),
            ("max_capacity", 2),
            ("availability", 2),
            ("item_waste", 2),
            ("substitute_make_recipe", 2),
        ]
        for key, _len in tuple_maps:
            if key in d and isinstance(d[key], dict):
                normalized_dict = {}
                for k, v in d[key].items():
                    if isinstance(k, str):
                        tk = parse_key_string(k)
                    elif isinstance(k, (list, tuple)):
                        tk = tuple(int(x) if isinstance(x, str) and x.isdigit() else x for x in k)
                    else:
                        tk = (k,)
                    normalized_dict[tk] = v
                d[key] = normalized_dict

        # normalize time dictionaries keys (crew_available / energy_available) -> int weeks
        for tdict in ("crew_available", "energy_available"):
            if tdict in d and isinstance(d[tdict], dict):
                new = {}
                for wk, val in d[tdict].items():
                    wk_parsed = int(wk) if isinstance(wk, str) and wk.isdigit() else wk
                    new[wk_parsed] = val
                d[tdict] = new

        # ensure nested structures exist
        d.setdefault("item_demands", {})
        d.setdefault("item_waste", {})
        d.setdefault("substitute_make_recipe", {})
        d.setdefault("substitute_assembly_crew", {})
        d.setdefault("substitute_assembly_energy", {})
        d.setdefault("substitute_values", {})
        d.setdefault("substitute_mass", {})
        d.setdefault("weights", {})

        # ensure initial_inventory contains sub-keys
        d.setdefault("initial_inventory", {})
        d["initial_inventory"].setdefault("materials", {})
        d["initial_inventory"].setdefault("outputs", {})
        d["initial_inventory"].setdefault("items", {})
        d["initial_inventory"].setdefault("substitutes", {})

        # ensure substitutes_can_replace exists
        d.setdefault("substitutes_can_replace", {})

        return d

    # --------------------------
    # Input validation
    # --------------------------
    def _validate_input(self, d: dict) -> bool:
        errors = []
        # required lists
        for name in ("materials", "methods", "outputs", "items", "substitutes", "weeks"):
            if name not in d or not isinstance(d[name], list) or len(d[name]) == 0:
                errors.append(f"'{name}' must be a non-empty list")

        # weeks must be ints
        if "weeks" in d:
            for w in d["weeks"]:
                if not isinstance(w, int):
                    errors.append("All entries in 'weeks' must be integers")

        # check tuple dicts consistency: yields, max_capacity, availability
        for (mat, r, out), v in d.get("yields", {}).items():
            if mat not in d["materials"]:
                errors.append(f"yields: material '{mat}' not in materials")
            if r not in d["methods"]:
                errors.append(f"yields: method '{r}' not in methods")
            if out not in d["outputs"]:
                errors.append(f"yields: output '{out}' not in outputs")
            if not isinstance(v, (int, float)) or v < 0:
                errors.append(f"yields value for ({mat},{r},{out}) must be >= 0")

        for (r, wk), v in d.get("max_capacity", {}).items():
            if r not in d["methods"]:
                errors.append(f"max_capacity method '{r}' not in methods")
            if wk not in d["weeks"]:
                errors.append(f"max_capacity week '{wk}' not in weeks")

        for (r, wk), v in d.get("availability", {}).items():
            if r not in d["methods"]:
                errors.append(f"availability method '{r}' not in methods")
            if wk not in d["weeks"]:
                errors.append(f"availability week '{wk}' not in weeks")
            if v not in (0, 1):
                errors.append(f"availability value for ({r},{wk}) must be 0 or 1")

        # item_demands keys (item, week)
        for (item, wk), v in d.get("item_demands", {}).items():
            if item not in d["items"]:
                errors.append(f"item_demands: '{item}' not in items")
            if wk not in d["weeks"]:
                errors.append(f"item_demands: week '{wk}' not in weeks")
            if not isinstance(v, (int, float)) or v < 0:
                errors.append(f"item_demands value for ({item},{wk}) must be >= 0")

        # item_waste (item, material)
        for (item, mat), v in d.get("item_waste", {}).items():
            if item not in d["items"]:
                errors.append(f"item_waste: item '{item}' not found")
            if mat not in d["materials"]:
                errors.append(f"item_waste: material '{mat}' not found")
            if not isinstance(v, (int, float)) or v < 0:
                errors.append(f"item_waste value for ({item},{mat}) must be >= 0")

        # substitute_make_recipe (sub, output)
        for (sub, out), v in d.get("substitute_make_recipe", {}).items():
            if sub not in d["substitutes"]:
                errors.append(f"substitute_make_recipe: substitute '{sub}' not in substitutes")
            if out not in d["outputs"]:
                errors.append(f"substitute_make_recipe: output '{out}' not in outputs")
            if not isinstance(v, (int, float)) or v < 0:
                errors.append(f"substitute_make_recipe value for ({sub},{out}) must be >= 0")

        # substitutes_can_replace
        for item, subs in d.get("substitutes_can_replace", {}).items():
            if item not in d.get("items", []):
                errors.append(f"substitutes_can_replace: '{item}' not in items")
            for s in subs:
                if s not in d.get("substitutes", []):
                    errors.append(f"substitutes_can_replace: '{s}' not in substitutes")

        # basic numeric dictionaries existence & types are assumed — not all fields mandatory

        if errors:
            print("Input validation errors:")
            for e in errors:
                print("  -", e)
            return False

        print("Input validation passed.")
        return True

    # --------------------------
    # Solver selection
    # --------------------------
    def _select_solver(self):
        for name in self.solvers:
            try:
                solver = SolverFactory(name)
                if solver.available():
                    print(f"Selected solver: {name}")
                    return solver
            except Exception:
                continue
        return None

    # --------------------------
    # Model building
    # --------------------------
    def _build_model(self, d: dict):
        model = ConcreteModel()

        # simplify local references
        materials = d["materials"]
        methods = d["methods"]
        outputs = d["outputs"]
        items = d["items"]
        subs = d["substitutes"]
        weeks = sorted(d["weeks"])
        first_week = weeks[0]

        model.M = Set(initialize=materials)
        model.R = Set(initialize=methods)
        model.O = Set(initialize=outputs)
        model.K = Set(initialize=items)
        model.S = Set(initialize=subs)
        model.T = Set(initialize=weeks)

        # convenient dict accessors with defaults
        S_in0 = d.get("initial_inventory", {}).get("materials", {})
        S_out0 = d.get("initial_inventory", {}).get("outputs", {})
        S_items0 = d.get("initial_inventory", {}).get("items", {})
        S_subs0 = d.get("initial_inventory", {}).get("substitutes", {})

        item_mass = d.get("item_mass", {})
        sub_mass = d.get("substitute_mass", {})
        item_demands = d.get("item_demands", {})  # keys (item, week)
        item_lifetime = d.get("item_lifetime", {})  # item->int
        sub_lifetime = d.get("substitute_lifetime", {})  # sub->int
        item_waste = d.get("item_waste", {})
        sub_waste = d.get("substitute_waste", {})
        sub_recipe = d.get("substitute_make_recipe", {})

        yields = d.get("yields", {})
        R_max = d.get("max_capacity", {})
        M_min = d.get("min_lot_size", {})
        C_crew = d.get("crew_cost", {})
        C_energy = d.get("energy_cost", {})
        Crew = d.get("crew_available", {})
        Energy = d.get("energy_available", {})
        Cap_out = d.get("output_capacity", {})
        Cap_in = d.get("input_capacity", {})
        avail = d.get("availability", {})
        RiskCost = d.get("risk_cost", {})
        output_values = d.get("output_values", {})
        sub_values = d.get("substitute_values", {})
        substitutes_can_replace = d.get("substitutes_can_replace", {})

        weights = d.get("weights", {})
        w_mass = weights.get("mass", 0.0)
        w_value = weights.get("value", 0.0)
        w_crew = weights.get("crew", 0.0)
        w_energy = weights.get("energy", 0.0)
        w_risk = weights.get("risk", 0.0)
        w_make = weights.get("make", 0.0)
        w_carry = weights.get("carry", 0.0)  # typically negative to penalize using carried mass
        w_short = weights.get("shortage", 10000.0)

        # -------------------------
        # Decision variables
        # -------------------------
        model.P = Var(model.M, model.R, model.T, domain=NonNegativeReals)   # material processed by method (kg)
        model.Q = Var(model.R, model.T, domain=NonNegativeReals)            # total processed per method-week
        model.y = Var(model.R, model.T, domain=Binary)                      # method on/off

        model.Oprod = Var(model.O, model.T, domain=NonNegativeReals)        # outputs produced in week
        model.Oinv = Var(model.O, model.T, domain=NonNegativeReals)         # outputs inventory end-week

        model.Minv = Var(model.M, model.T, domain=NonNegativeReals)         # material inventory end-week

        model.make_sub = Var(model.S, model.T, domain=NonNegativeReals)    # units made of substitute s in week t
        model.sub_inv = Var(model.S, model.T, domain=NonNegativeReals)     # substitute inventory end-week

        model.sub_used_for = Var(model.S, model.K, model.T, domain=NonNegativeReals)  # units of sub s used for item k in week t

        model.carried_used = Var(model.K, model.T, domain=NonNegativeReals)  # carried units used
        model.carried_inv = Var(model.K, model.T, domain=NonNegativeReals)   # carried inventory end-week

        model.item_used = Var(model.K, model.T, domain=NonNegativeReals)    # total item usage (carried + substitutes)
        model.item_short = Var(model.K, model.T, domain=NonNegativeReals)   # shortages

        # -------------------------
        # Auxiliary: prev-week mapping (safe in case weeks are non-1-start)
        # -------------------------
        prev = {}
        for i in range(1, len(weeks)):
            prev[weeks[i]] = weeks[i-1]

        # -------------------------
        # Constraints
        # -------------------------
        model.con_link_Q = ConstraintList()
        for r in model.R:
            for t in model.T:
                model.con_link_Q.add(model.Q[r, t] == sum(model.P[m, r, t] for m in model.M))

        # outputs from processing (yields)
        model.con_output_prod = ConstraintList()
        for o in model.O:
            for t in model.T:
                model.con_output_prod.add(
                    model.Oprod[o, t] ==
                    sum(yields.get((m, r, o), 0.0) * model.P[m, r, t] for m in model.M for r in model.R)
                )

        # output inventory: prev + produced - consumed_by_substitute_making
        model.con_output_inv = ConstraintList()
        for o in model.O:
            for t in model.T:
                prev_inv = S_out0.get(o, 0.0) if t == first_week else model.Oinv[o, prev[t]]
                consumes = sum(sub_recipe.get((s, o), 0.0) * model.make_sub[s, t] for s in model.S)
                model.con_output_inv.add(model.Oinv[o, t] == prev_inv + model.Oprod[o, t] - consumes)
                # capacity if specified
                if o in Cap_out:
                    model.con_output_inv.add(model.Oinv[o, t] <= Cap_out[o])

        # material inventory: prev + base_waste + item/substitute-derived waste - processed
        model.con_material_inv = ConstraintList()
        for m in model.M:
            for t in model.T:
                prev_inv = S_in0.get(m, 0.0) if t == first_week else model.Minv[m, prev[t]]

                # contributions from used carried items whose lifetime ends now
                carried_waste = 0
                for k in model.K:
                    life_k = int(d.get("item_lifetime", {}).get(k, 0))
                    # if usage at tau generates waste at t: tau + life_k == t
                    for tau in model.T:
                        if tau + life_k == t:
                            carried_waste += item_waste.get((k, m), 0.0) * model.carried_used[k, tau]

                # contributions from substitutes used earlier whose lifetime expires now
                subs_waste = 0
                for s in model.S:
                    life_s = int(d.get("substitute_lifetime", {}).get(s, 0))
                    for tau in model.T:
                        if tau + life_s == t:
                            # sum over which item that substitute was used for
                            subs_waste += sum(sub_waste.get((s, m), 0.0) * model.sub_used_for[s, k, tau] for k in model.K)

                processed = sum(model.P[m, r, t] for r in model.R)
                model.con_material_inv.add(model.Minv[m, t] == prev_inv + carried_waste + subs_waste - processed)
                # capacity if specified
                if m in Cap_in:
                    model.con_material_inv.add(model.Minv[m, t] <= Cap_in[m])

        # substitute inventories
        model.con_sub_inv = ConstraintList()
        for s in model.S:
            for t in model.T:
                prev_s = S_subs0.get(s, 0.0) if t == first_week else model.sub_inv[s, prev[t]]
                used = sum(model.sub_used_for[s, k, t] for k in model.K)
                model.con_sub_inv.add(model.sub_inv[s, t] == prev_s + model.make_sub[s, t] - used)

        # carried item inventories (decrease when used)
        model.con_carried_inv = ConstraintList()
        for k in model.K:
            for t in model.T:
                if t == first_week:
                    init = float(S_items0.get(k, 0.0))
                    model.con_carried_inv.add(model.carried_inv[k, t] == init - model.carried_used[k, t])
                else:
                    model.con_carried_inv.add(model.carried_inv[k, t] == model.carried_inv[k, prev[t]] - model.carried_used[k, t])

        # usage composition and demand satisfaction
        model.con_usage_demand = ConstraintList()
        for k in model.K:
            for t in model.T:
                # item_used = carried_used + substitutes used for this item
                model.con_usage_demand.add(
                    model.item_used[k, t] == model.carried_used[k, t] + sum(model.sub_used_for[s, k, t] for s in model.S)
                )
                demand_val = float(item_demands.get((k, t), 0.0))
                model.con_usage_demand.add(model.item_used[k, t] + model.item_short[k, t] == demand_val)

        # disallow substitute usage if not allowed by mapping
        model.con_sub_allowed = ConstraintList()
        for s in model.S:
            for k in model.K:
                allowed = s in substitutes_can_replace.get(k, [])
                if not allowed:
                    for t in model.T:
                        model.con_sub_allowed.add(model.sub_used_for[s, k, t] == 0)

        # processing capacity, availability, min-lot
        model.con_proc_cap = ConstraintList()
        for r in model.R:
            for t in model.T:
                rmax = float(R_max.get((r, t), 0.0))
                model.con_proc_cap.add(model.Q[r, t] <= rmax * model.y[r, t])
                if avail.get((r, t), 1) == 0:
                    model.con_proc_cap.add(model.y[r, t] == 0)
                minlot = float(M_min.get(r, 0.0))
                if minlot > 0:
                    model.con_proc_cap.add(minlot * model.y[r, t] <= model.Q[r, t])

        # link Q and P already with con_link_Q

        # resource constraints (crew & energy) include substitute assembly labor
        model.con_resource = ConstraintList()
        for t in model.T:
            recycle_crew = sum(C_crew.get(r, 0.0) * model.Q[r, t] for r in model.R)
            recycle_energy = sum(C_energy.get(r, 0.0) * model.Q[r, t] for r in model.R)
            assembly_crew = sum(d.get("substitute_assembly_crew", {}).get(s, 0.0) * model.make_sub[s, t] for s in model.S)
            assembly_energy = sum(d.get("substitute_assembly_energy", {}).get(s, 0.0) * model.make_sub[s, t] for s in model.S)
            model.con_resource.add(recycle_crew + assembly_crew <= float(Crew.get(t, float("inf"))))
            model.con_resource.add(recycle_energy + assembly_energy <= float(Energy.get(t, float("inf"))))

        # deadlines: cumulative usage up to deadline >= required
        model.con_deadlines = ConstraintList()
        for dl in d.get("deadlines", []):
            if "item" in dl:
                item = dl["item"]
                wk = int(dl["week"])
                amt = float(dl["amount"])
                model.con_deadlines.add(sum(model.item_used[item, tau] for tau in model.T if tau <= wk) >= amt)

        # -------------------------
        # Objective
        # -------------------------
        total_output_value = sum(output_values.get(o, 0.0) * model.Oprod[o, t] for o in model.O for t in model.T)
        total_output_mass = sum(model.Oprod[o, t] for o in model.O for t in model.T)
        total_crew_cost = sum(C_crew.get(r, 0.0) * model.Q[r, t] for r in model.R for t in model.T)
        total_energy_cost = sum(C_energy.get(r, 0.0) * model.Q[r, t] for r in model.R for t in model.T)
        total_risk_cost = sum(RiskCost.get(r, 0.0) * model.Q[r, t] for r in model.R for t in model.T)
        substitutes_value = sum(sub_values.get(s, 0.0) * model.make_sub[s, t] for s in model.S for t in model.T)
        carried_mass_used = sum(item_mass.get(k, 0.0) * model.carried_used[k, t] for k in model.K for t in model.T)
        total_shortage = sum(model.item_short[k, t] for k in model.K for t in model.T)

        # Note: w_carry expected typically negative to **penalize** using carried items (i.e. prefer making substitutes).
        model.objective = Objective(
            expr=(
                w_mass * total_output_mass
                + w_value * total_output_value
                - w_crew * total_crew_cost
                - w_energy * total_energy_cost
                - w_risk * total_risk_cost
                + w_make * substitutes_value
                + w_carry * carried_mass_used
                - w_short * total_shortage
            ),
            sense=maximize
        )

        return model

    # --------------------------
    # Extract results
    # --------------------------
    def _extract_results(self) -> dict:
        m = self.model
        d = self._data
        weeks = sorted(d["weeks"])
        materials = d["materials"]
        methods = d["methods"]
        outputs = d["outputs"]
        items = d["items"]
        subs = d["substitutes"]

        def sv(x):
            # Prefer direct .value when available to avoid Pyomo error logs on uninitialized vars
            if hasattr(x, "value"):
                try:
                    v_attr = x.value
                    return float(v_attr) if v_attr is not None else 0.0
                except Exception:
                    return 0.0
            # Fallback for expressions/objectives/params without .value
            try:
                v = value(x)
                return float(v) if v is not None else 0.0
            except Exception:
                return 0.0

        schedule = []
        for t in weeks:
            t_entry = {"week": t, "methods": {}}
            for r in methods:
                t_entry["methods"][r] = {
                    "processed_kg": sv(m.Q[r, t]),
                    "is_running": int(round(sv(m.y[r, t]))),
                    "by_material": {mat: sv(m.P[mat, r, t]) for mat in materials}
                }
            schedule.append(t_entry)

        outputs_list = []
        for o in outputs:
            outputs_list.append({
                "output": o,
                "weeks": [{"week": t, "produced_kg": sv(m.Oprod[o, t]), "inventory_kg": sv(m.Oinv[o, t])} for t in weeks]
            })

        substitutes_table = []
        for s in subs:
            substitutes_table.append({
                "substitute": s,
                "weeks": [{"week": t, "made": sv(m.make_sub[s, t]), "inventory": sv(m.sub_inv[s, t]), "used_for": {k: sv(m.sub_used_for[s, k, t]) for k in items}} for t in weeks]
            })

        items_table = []
        for k in items:
            items_table.append({
                "item": k,
                "weeks": [{"week": t, "used_total": sv(m.item_used[k, t]), "used_carried": sv(m.carried_used[k, t]), "shortage": sv(m.item_short[k, t])} for t in weeks]
            })

        # Calculate substitute breakdown
        substitute_breakdown = {}
        for s in subs:
            total_made = sum(sv(m.make_sub[s, t]) for t in weeks)
            substitute_breakdown[s] = total_made

        # Calculate weight loss from carried items
        item_mass = d.get("item_mass", {})
        S_items0 = d.get("initial_inventory", {}).get("items", {})
        
        carried_weight_loss = {}
        total_weight_loss = 0.0
        total_initial_carriage_weight = 0.0
        total_final_carriage_weight = 0.0
        
        for k in items:
            mass_per_item = item_mass.get(k, 0.0)
            initial_units = S_items0.get(k, 0.0)
            total_used = sum(sv(m.carried_used[k, t]) for t in weeks)
            final_units = initial_units - total_used
            
            initial_weight = mass_per_item * initial_units
            final_weight = mass_per_item * final_units
            weight_loss = mass_per_item * total_used
            
            carried_weight_loss[k] = {
                "initial_units": initial_units,
                "units_used": total_used,
                "final_units": final_units,
                "mass_per_unit": mass_per_item,
                "initial_weight": initial_weight,
                "final_weight": final_weight,
                "total_weight_loss": weight_loss
            }
            
            total_initial_carriage_weight += initial_weight
            total_final_carriage_weight += final_weight
            total_weight_loss += weight_loss

        summary = {
            "objective_value": sv(m.objective),
            "total_processed_kg": sum(sv(m.Q[r, t]) for r in methods for t in weeks),
            "total_output_produced_kg": sum(sv(m.Oprod[o, t]) for o in outputs for t in weeks),
            "total_substitutes_made": sum(sv(m.make_sub[s, t]) for s in subs for t in weeks),
            "substitute_breakdown": substitute_breakdown,
            "total_initial_carriage_weight": total_initial_carriage_weight,
            "total_final_carriage_weight": total_final_carriage_weight,
            "total_carried_weight_loss": total_weight_loss,
            "carried_weight_loss_by_item": carried_weight_loss
        }

        return {
            "schedule": schedule,
            "outputs": outputs_list,
            "substitutes": substitutes_table,
            "items": items_table,
            "summary": summary,
            "solver_status": getattr(self.solver_results, "solver", None).__dict__ if self.solver_results else None
        }
