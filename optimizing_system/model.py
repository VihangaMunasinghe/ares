# mars_recycling_milp.py
# Requires: pyomo, (solver: CBC/gurobi/cplex). Example run:
#   python -m pip install pyomo
#   # install coin-or-cbc or use gurobi if available
#   python mars_recycling_milp.py

from pyomo.environ import *
from ortools.linear_solver import pywraplp

class OptimizationModel:
    def __init__(self):
        self.solvers = ['cbc', 'glpk', 'cplex', 'gurobi']
        self.model = None
        self.solver = None

    def setup(self, data: dict):
        if not self._validate_data(data):
            raise ValueError("Invalid data")

        # Initialize solver
        opt = None
        for solver_name in self.solvers:
            try:
                opt = SolverFactory(solver_name)
                if opt.available():
                    print(f"Using solver: {solver_name}")
                    self.solver = opt
                    break
            except:
                continue

        if opt is None or not opt.available():
            raise ValueError("No suitable solver found. Please install CBC, GLPK, CPLEX, or Gurobi")

        self.model = self._create_model(data)

    def _create_model(self, data: dict):

        model = ConcreteModel()
        # Index sets
        materials = data['materials']
        methods = data['methods']
        outputs = data['outputs']
        weeks = data['weeks']
        
        model.M = Set(initialize=materials)
        model.R = Set(initialize=methods)
        model.O = Set(initialize=outputs)
        model.T = Set(initialize=weeks)

        # Parameters from data
        W = data['waste_generated']  # {(material, week): kg_waste}
        S_in0 = data['initial_inventory']['materials']  # {material: kg}
        S_out0 = data['initial_inventory']['outputs']   # {output: kg}
        N = data['demands']  # {(output, week): kg}
        Y = data['yields']  # {(material, method, output): kg_output_per_kg_input}
        R_max = data['max_capacity']  # {(method, week): kg}
        M = data['min_lot_size']  # {method: kg}
        C_crew = data['crew_cost']  # {method: hours_per_kg}
        C_energy = data['energy_cost']  # {method: units_per_kg}
        Crew = data['crew_available']  # {week: hours}
        Energy = data['energy_available']  # {week: units}
        Cap_out = data['output_capacity']  # {output: kg}
        Cap_in = data['input_capacity']   # {material: kg}
        avail = data['availability']  # {(method, week): 0 or 1}
        RiskCost = data['risk_cost']  # {method: cost_per_kg}
        V = data['output_values']  # {output: value_per_kg}
        
        # Objective weights
        w_mass = data['weights']['mass']
        w_value = data['weights']['value']
        w_crew = data['weights']['crew']
        w_energy = data['weights']['energy']
        w_risk = data['weights']['risk']

        # Decision variables with clear names
        model.material_processed_by_method = Var(model.M, model.R, model.T, domain=NonNegativeReals)  # kg material processed by method in week
        model.total_processed_by_method = Var(model.R, model.T, domain=NonNegativeReals)  # kg total processed by method in week
        model.is_method_running = Var(model.R, model.T, domain=Binary)  # binary: is method running in week
        model.material_inventory = Var(model.M, model.T, domain=NonNegativeReals)  # raw waste inventory end-week
        model.output_inventory = Var(model.O, model.T, domain=NonNegativeReals)  # output inventory end-week
        model.output_produced = Var(model.O, model.T, domain=NonNegativeReals)  # output produced in week

        # Constraints
        # Link total processed to individual materials (total method capacity equals sum of materials)
        model.link_total_processed = ConstraintList()
        for r in methods:
            for t in weeks:
                model.link_total_processed.add(
                    model.total_processed_by_method[r,t] == sum(model.material_processed_by_method[m,r,t] for m in materials)
                )

        # Output from inputs (production yield constraints)
        model.output_production = ConstraintList()
        for o in outputs:
            for t in weeks:
                model.output_production.add(
                    model.output_produced[o,t] == sum(
                        Y.get((m,r,o), 0.0) * model.material_processed_by_method[m,r,t] 
                        for m in materials for r in methods
                    )
                )

        # Inventory dynamics - raw waste
        model.material_inventory_balance = ConstraintList()
        for m in materials:
            for t in weeks:
                if t == 1:
                    prev_inventory = S_in0.get(m, 0.0)
                else:
                    prev_inventory = model.material_inventory[m,t-1]
                
                model.material_inventory_balance.add(
                    model.material_inventory[m,t] == (
                        prev_inventory + W.get((m,t), 0.0) - 
                        sum(model.material_processed_by_method[m,r,t] for r in methods)
                    )
                )
                model.material_inventory_balance.add(model.material_inventory[m,t] <= Cap_in.get(m, float('inf')))

        # Output inventory dynamics
        model.output_inventory_balance = ConstraintList()
        for o in outputs:
            for t in weeks:
                if t == 1:
                    prev_inventory = S_out0.get(o, 0.0)
                else:
                    prev_inventory = model.output_inventory[o,t-1]
                
                model.output_inventory_balance.add(
                    model.output_inventory[o,t] == (
                        prev_inventory + model.output_produced[o,t] - N.get((o,t), 0.0)
                    )
                )
                model.output_inventory_balance.add(model.output_inventory[o,t] <= Cap_out.get(o, float('inf')))

        # Capacity & availability & minimum lot size constraints
        model.processing_capacity = ConstraintList()
        for r in methods:
            for t in weeks:
                model.processing_capacity.add(model.total_processed_by_method[r,t] <= R_max.get((r,t), 0.0) * model.is_method_running[r,t])
                
                if avail.get((r,t), 1) == 0:
                    model.processing_capacity.add(model.is_method_running[r,t] == 0)
                
                model.processing_capacity.add(M.get(r, 0.0) * model.is_method_running[r,t] <= model.total_processed_by_method[r,t])

        # Don't process more material than available at start of week
        model.material_availability = ConstraintList()
        for m in materials:
            for t in weeks:
                if t == 1:
                    available_material = S_in0.get(m, 0.0) + W.get((m,t), 0.0)
                else:
                    available_material = model.material_inventory[m,t-1] + W.get((m,t), 0.0)
                
                model.material_availability.add(
                    sum(model.material_processed_by_method[m,r,t] for r in methods) <= available_material
                )

        # Resource constraints per week (crew and energy limitations)
        model.resource_limits = ConstraintList()
        for t in weeks:
            model.resource_limits.add(
                sum(C_crew.get(r, 0.0) * model.total_processed_by_method[r,t] for r in methods) <= Crew.get(t, float('inf'))
            )
            model.resource_limits.add(
                sum(C_energy.get(r, 0.0) * model.total_processed_by_method[r,t] for r in methods) <= Energy.get(t, float('inf'))
            )

        # Deadlines (cumulative production requirements)
        model.mandatory_deadlines = ConstraintList()
        for deadline_info in data.get('deadlines', []):
            output = deadline_info['output']
            deadline_week = deadline_info['week']
            required_amount = deadline_info['amount']
            
            model.mandatory_deadlines.add(
                sum(
                    model.output_produced[output, tau] for tau in weeks 
                    if tau <= deadline_week
                ) >= required_amount - S_out0.get(output, 0.0)
            )

        # Objective function (maximize value and mass saved, minimize costs)
        total_value = sum(V.get(o, 0.0) * model.output_produced[o,t] for o in outputs for t in weeks)
        mass_saved = sum(model.output_produced[o,t] for o in outputs for t in weeks)
        total_crew_cost = sum(C_crew.get(r, 0.0) * model.total_processed_by_method[r,t] for r in methods for t in weeks)
        total_energy_cost = sum(C_energy.get(r, 0.0) * model.total_processed_by_method[r,t] for r in methods for t in weeks)
        total_risk_cost = sum(RiskCost.get(r, 0.0) * model.total_processed_by_method[r,t] for r in methods for t in weeks)

        model.objective_function = Objective(
            expr = (w_mass * mass_saved + w_value * total_value - 
                   w_crew * total_crew_cost - w_energy * total_energy_cost - w_risk * total_risk_cost),
            sense=maximize
        )

        return model

    def solve(self):
        if self.model is None or self.solver is None:
            raise ValueError("Model not properly initialized. Call setup() and create_model() first.")
        
        results = self.solver.solve(self.model, tee=True)
        return results

    def get_results(self):
        if self.model is None:
            raise ValueError("Model not solved yet.")
        return self.model

    def print_schedule(self, weeks):
        """Print the production schedule"""
        print("\nWeek | " + " | ".join([f"{method}_processed(kg)" for method in self.model.R.data()]) + 
              " | " + " | ".join([f"{method}_running" for method in self.model.R.data()]))
        
        for t in weeks:
            row = f"{t:4d}"
            for method in self.model.R.data():
                row += f":{value(self.model.total_processed_by_method[method,t]):12.2f}"
            for method in self.model.R.data():
                row += f":{int(value(self.model.is_method_running[method,t])):10d}"
            print(row)

        print("\nOutputs produced per week:")
        for o in self.model.O.data():
            print(f"  Output: {o}")
            for t in weeks:
                print(f"    week {t}: produced {value(self.model.output_produced[o,t]):6.2f} kg " +
                      f"inventory end {value(self.model.output_inventory[o,t]):6.2f} kg")

    def _validate_data(self, data: dict):
        """Validate the input data structure with comprehensive checks"""
        errors = []
        
        # 1. Check required keys exist
        required_keys = [
            'materials', 'methods', 'outputs', 'weeks',
            'waste_generated', 'initial_inventory', 'demands',
            'yields', 'max_capacity', 'min_lot_size',
            'crew_cost', 'energy_cost', 'crew_available', 'energy_available',
            'output_capacity', 'input_capacity', 'availability',
            'risk_cost', 'output_values', 'weights'
        ]
        
        missing_keys = [key for key in required_keys if key not in data]
        if missing_keys:
            errors.append(f"Missing required keys: {missing_keys}")
        
        # 2. Validate basic data types and structures
        try:
            # Check lists
            if not isinstance(data.get('materials'), list):
                errors.append("'materials' must be a list")
            if not isinstance(data.get('methods'), list):
                errors.append("'methods' must be a list")
            if not isinstance(data.get('outputs'), list):
                errors.append("'outputs' must be a list")
            if not isinstance(data.get('weeks'), list):
                errors.append("'weeks' must be a list")
            
            # Check dictionaries
            dict_keys = ['waste_generated', 'demands', 'yields', 'max_capacity', 
                        'min_lot_size', 'crew_cost', 'energy_cost', 'crew_available', 
                        'energy_available', 'output_capacity', 'input_capacity', 
                        'availability', 'risk_cost', 'output_values', 'weights', 'initial_inventory']
            
            for key in dict_keys:
                if key in data and not isinstance(data[key], dict):
                    errors.append(f"'{key}' must be a dictionary")
            
        except Exception as e:
            errors.append(f"Type validation error: {str(e)}")
        
        # 3. Validate data consistency and relationships
        if not errors:  # Only proceed if basic structure is valid
            try:
                materials = data['materials']
                methods = data['methods']
                outputs = data['outputs']
                weeks = data['weeks']
                
                # Check waste_generated structure
                waste_gen = data.get('waste_generated', {})
                for key, value in waste_gen.items():
                    if not isinstance(key, tuple) or len(key) != 2:
                        errors.append(f"waste_generated key '{key}' must be a tuple of (material, week)")
                    else:
                        material, week = key
                        if material not in materials:
                            errors.append(f"waste_generated material '{material}' not in materials list")
                        if week not in weeks:
                            errors.append(f"waste_generated week '{week}' not in weeks list")
                        if not isinstance(value, (int, float)) or value < 0:
                            errors.append(f"waste_generated value for '{key}' must be non-negative number")
                
                # Check demands structure
                demands = data.get('demands', {})
                for key, value in demands.items():
                    if not isinstance(key, tuple) or len(key) != 2:
                        errors.append(f"demands key '{key}' must be a tuple of (output, week)")
                    else:
                        output, week = key
                        if output not in outputs:
                            errors.append(f"demands output '{output}' not in outputs list")
                        if week not in weeks:
                            errors.append(f"demands week '{week}' not in weeks list")
                        if not isinstance(value, (int, float)) or value <= 0:
                            errors.append(f"demands value for '{key}' must be positive number")
                
                # Check yields structure
                yields = data.get('yields', {})
                for key, value in yields.items():
                    if not isinstance(key, tuple) or len(key) != 3:
                        errors.append(f"yields key '{key}' must be a tuple of (material, method, output)")
                    else:
                        material, method, output = key
                        if material not in materials:
                            errors.append(f"yields material '{material}' not in materials list")
                        if method not in methods:
                            errors.append(f"yields method '{method}' not in methods list")
                        if output not in outputs:
                            errors.append(f"yields output '{output}' not in outputs list")
                        if not isinstance(value, (int, float)) or value < 0:
                            errors.append(f"yields value for '{key}' must be non-negative number")
                
                # Check max_capacity structure
                max_cap = data.get('max_capacity', {})
                for key, value in max_cap.items():
                    if not isinstance(key, tuple) or len(key) != 2:
                        errors.append(f"max_capacity key '{key}' must be a tuple of (method, week)")
                    else:
                        method, week = key
                        if method not in methods:
                            errors.append(f"max_capacity method '{method}' not in methods list")
                        if week not in weeks:
                            errors.append(f"max_capacity week '{week}' not in weeks list")
                        if not isinstance(value, (int, float)) or value <= 0:
                            errors.append(f"max_capacity value for '{key}' must be positive number")
                
                # Check availability structure
                availability = data.get('availability', {})
                for key, value in availability.items():
                    if not isinstance(key, tuple) or len(key) != 2:
                        errors.append(f"availability key '{key}' must be a tuple of (method, week)")
                    else:
                        method, week = key
                        if method not in methods:
                            errors.append(f"availability method '{method}' not in methods list")
                        if week not in weeks:
                            errors.append(f"availability week '{week}' not in weeks list")
                        if not isinstance(value, (int, float)) or value not in [0, 1]:
                            errors.append(f"availability value for '{key}' must be 0 or 1")
                
                # Check initial_inventory structure
                init_inv = data.get('initial_inventory', {})
                if 'materials' in init_inv:
                    for material, value in init_inv['materials'].items():
                        if material not in materials:
                            errors.append(f"initial_inventory material '{material}' not in materials list")
                        if not isinstance(value, (int, float)) or value < 0:
                            errors.append(f"initial_inventory materials value for '{material}' must be non-negative number")
                
                if 'outputs' in init_inv:
                    for output, value in init_inv['outputs'].items():
                        if output not in outputs:
                            errors.append(f"initial_inventory output '{output}' not in outputs list")
                        if not isinstance(value, (int, float)) or value < 0:
                            errors.append(f"initial_inventory outputs value for '{output}' must be non-negative number")
                
                # Check single-key dictionaries
                single_dicts = {
                    'min_lot_size': methods,
                    'crew_cost': methods,
                    'energy_cost': methods,
                    'risk_cost': methods,
                    'output_capacity': outputs,
                    'input_capacity': materials,
                    'output_values': outputs
                }
                
                for dict_name, valid_keys in single_dicts.items():
                    dict_data = data.get(dict_name, {})
                    for key, value in dict_data.items():
                        if key not in valid_keys:
                            errors.append(f"{dict_name} key '{key}' not in valid keys {valid_keys}")
                        if not isinstance(value, (int, float)) or value < 0:
                            errors.append(f"{dict_name} value for '{key}' must be non-negative number")
                
                # Check time-based dictionaries
                time_dicts = ['crew_available', 'energy_available']
                for dict_name in time_dicts:
                    dict_data = data.get(dict_name, {})
                    for week, value in dict_data.items():
                        if week not in weeks:
                            errors.append(f"{dict_name} week '{week}' not in weeks list")
                        if not isinstance(value, (int, float)) or value < 0:
                            errors.append(f"{dict_name} value for week '{week}' must be non-negative number")
                
                # Check weights structure
                weights = data.get('weights', {})
                expected_weight_keys = ['mass', 'value', 'crew', 'energy', 'risk']
                for key in expected_weight_keys:
                    if key not in weights:
                        errors.append(f"weights missing key '{key}'")
                    elif not isinstance(weights[key], (int, float)) or weights[key] < 0:
                        errors.append(f"weights value for '{key}' must be non-negative number")
                
                # Check for completeness of data combinations
                # Ensure all material-week combinations exist in waste_generated
                for material in materials:
                    for week in weeks:
                        if (material, week) not in waste_gen:
                            errors.append(f"Missing waste_generated entry for ({material}, {week})")
                
                # Ensure all method-week combinations exist in max_capacity
                for method in methods:
                    for week in weeks:
                        if (method, week) not in max_cap:
                            errors.append(f"Missing max_capacity entry for ({method}, {week})")
                
                # Ensure all method-week combinations exist in availability
                for method in methods:
                    for week in weeks:
                        if (method, week) not in availability:
                            errors.append(f"Missing availability entry for ({method}, {week})")
                
                # Ensure all material-method-output combinations exist in yields
                for material in materials:
                    for method in methods:
                        for output in outputs:
                            if (material, method, output) not in yields:
                                errors.append(f"Missing yields entry for ({material}, {method}, {output})")
                
            except Exception as e:
                errors.append(f"Data consistency validation error: {str(e)}")
        
        # Return validation result
        if errors:
            print("Data validation failed with the following errors:")
            for error in errors:
                print(f"  - {error}")
            return False
        else:
            print("Data validation passed successfully!")
            return True


# Example usage and test
if __name__ == "__main__":
    # Sample data structure
    sample_data = {
        'materials': ["plastic", "textile"],
        'methods': ["extrude", "compress"],
        'outputs': ["filament", "insulation"],
        'weeks': list(range(1, 9)),  # weeks 1-8
        
        # Waste generated per week {(material, week): kg}
        'waste_generated': {
            ("plastic", 1): 5.0, ("plastic", 2): 5.0, ("plastic", 3): 5.0, ("plastic", 4): 5.0,
            ("textile", 1): 0.0, ("textile", 2): 3.0, ("textile", 3): 3.0, ("textile", 4): 3.0,
            ("plastic", 5): 5.0, ("plastic", 6): 5.0, ("plastic", 7): 5.0, ("plastic", 8): 5.0,
            ("textile", 5): 3.0, ("textile", 6): 3.0, ("textile", 7): 3.0, ("textile", 8): 3.0,
        },
        
        # Initial inventory
        'initial_inventory': {
            'materials': {"plastic": 0.0, "textile": 0.0},
            'outputs': {"filament": 0.0, "insulation": 0.0}
        },
        
        # Demands {(output, week): kg}
        'demands': {
            ("filament", 5): 4.0,
            ("insulation", 8): 6.0
        },
        
        # Production yields {(material, method, output): kg_output_per_kg_input}
        'yields': {
            ("plastic", "extrude", "filament"): 0.8,
            ("plastic", "compress", "filament"): 0.1,
            ("textile", "extrude", "filament"): 0.0,
            ("textile", "compress", "filament"): 0.0,
            ("plastic", "extrude", "insulation"): 0.0,
            ("plastic", "compress", "insulation"): 0.0,
            ("textile", "extrude", "insulation"): 0.0,
            ("textile", "compress", "insulation"): 0.6
        },
        
        # Capacity and constraints
        'max_capacity': {
            ("extrude", t): 8.0 for t in range(1, 9)
        },
        'min_lot_size': {"extrude": 1.0, "compress": 1.0},
        'crew_cost': {"extrude": 0.5, "compress": 0.8},
        'energy_cost': {"extrude": 2.0, "compress": 3.0},
        'crew_available': {t: 10.0 for t in range(1, 9)},
        'energy_available': {t: 40.0 for t in range(1, 9)},
        'output_capacity': {"filament": 20.0, "insulation": 20.0},
        'input_capacity': {"plastic": 50.0, "textile": 30.0},
        'availability': {
            (r, t): 1 if (r, t) != ("compress", 4) else 0 for r in ["extrude", "compress"] for t in range(1, 9)
        },
        # Set compress unavailable in week 4
        'risk_cost': {"extrude": 0.1, "compress": 0.2},
        'output_values': {"filament": 2.0, "insulation": 1.5},
        
        # Objective weights
        'weights': {
            'mass': 1.0, 'value': 1.0, 'crew': 0.5,
            'energy': 0.2, 'risk': 0.3
        },
        
        # Deadlines
        'deadlines': [
            {'output': 'filament', 'week': 5, 'amount': 4.0},
            {'output': 'insulation', 'week': 8, 'amount': 6.0}
        ]
    }
    
    model = OptimizationModel()
    
    
    model.setup(sample_data)
    results = model.solve()
            
    print("Solver status:", results.solver.status, results.solver.termination_condition)
    print("Objective value:", value(model.model.objective_function))
            
    model.print_schedule(sample_data['weeks'])
