#!/usr/bin/env python3
"""
Sample Job Creation Script

This script creates a complete job configuration by making all the necessary API calls
in the correct sequence. It demonstrates the full job creation workflow.
"""

import requests
import json
import time
from typing import Dict, Any, Optional


class JobCreator:
    """Creates jobs using the API"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.mission_id = None
        self.job_id = None
    
    def _post(self, endpoint: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Make POST request"""
        url = f"{self.base_url}{endpoint}"
        response = self.session.post(url, json=data)
        response.raise_for_status()
        return response.json()
    
    def _get(self, endpoint: str) -> Dict[str, Any]:
        """Make GET request"""
        url = f"{self.base_url}{endpoint}"
        response = self.session.get(url)
        response.raise_for_status()
        return response.json()
    
    def create_global_entities(self):
        """Create all global entities (one-time setup)"""
        print("🔄 Creating global entities...")
        
        # Materials - using exact API format
        materials = [
            {
                "key": "plastic",
                "name": "Plastic Material",
                "category": "polymer",
                "default_mass_per_unit": 1.0,
                "max_input_capacity_kg": 50.0,
                "tags": ["recyclable", "lightweight"],
                "safety_flags": {"flammable": False, "toxic": False}
            },
            {
                "key": "textile",
                "name": "Textile Material",
                "category": "fabric", 
                "default_mass_per_unit": 0.8,
                "max_input_capacity_kg": 30.0,
                "tags": ["flexible", "insulating"],
                "safety_flags": {"flammable": True, "toxic": False}
            }
        ]
        
        for material in materials:
            try:
                self._post("/global/materials", material)
                print(f"  ✅ Created material: {material['key']}")
            except requests.exceptions.HTTPError as e:
                if e.response.status_code == 409:  # Already exists
                    print(f"  ⚠️  Material already exists: {material['key']}")
                else:
                    raise
        
        # Methods
        methods = [
            {
                "key": "extrude",
                "name": "Extrusion Process",
                "description": "High-temperature extrusion process",
                "min_lot_size": 1.0,
                "tools_required": ["extruder", "heater"],
                "availability_default": True
            },
            {
                "key": "compress", 
                "name": "Compression Process",
                "description": "High-pressure compression process",
                "min_lot_size": 1.0,
                "tools_required": ["compressor", "mold"],
                "availability_default": True
            }
        ]
        
        for method in methods:
            try:
                self._post("/global/methods", method)
                print(f"  ✅ Created method: {method['key']}")
            except requests.exceptions.HTTPError as e:
                if e.response.status_code == 409:
                    print(f"  ⚠️  Method already exists: {method['key']}")
                else:
                    raise
        
        # Outputs
        outputs = [
            {
                "key": "filament",
                "name": "Plastic Filament",
                "units_label": "kg",
                "value_per_kg": 2.0,
                "max_output_capacity_kg": 20.0
            },
            {
                "key": "insulation",
                "name": "Insulation Material",
                "units_label": "kg",
                "value_per_kg": 1.5,
                "max_output_capacity_kg": 20.0
            }
        ]
        
        for output in outputs:
            try:
                self._post("/global/outputs", output)
                print(f"  ✅ Created output: {output['key']}")
            except requests.exceptions.HTTPError as e:
                if e.response.status_code == 409:
                    print(f"  ⚠️  Output already exists: {output['key']}")
                else:
                    raise
        
        # Items
        items = [
            {
                "key": "spare_part",
                "name": "Spare Part",
                "units_label": "unit",
                "mass_per_unit": 1.0,
                "lifetime_weeks": 1
            },
            {
                "key": "insulation_patch",
                "name": "Insulation Patch", 
                "units_label": "unit",
                "mass_per_unit": 1.0,
                "lifetime_weeks": 1
            }
        ]
        
        for item in items:
            try:
                self._post("/global/items", item)
                print(f"  ✅ Created item: {item['key']}")
            except requests.exceptions.HTTPError as e:
                if e.response.status_code == 409:
                    print(f"  ⚠️  Item already exists: {item['key']}")
                else:
                    raise
        
        # Substitutes
        substitutes = [
            {
                "key": "printed_part",
                "name": "3D Printed Part",
                "value_per_unit": 3.0,
                "lifetime_weeks": 2
            },
            {
                "key": "insulation_pad",
                "name": "Insulation Pad",
                "value_per_unit": 2.5,
                "lifetime_weeks": 2
            }
        ]
        
        for substitute in substitutes:
            try:
                self._post("/global/substitutes", substitute)
                print(f"  ✅ Created substitute: {substitute['key']}")
            except requests.exceptions.HTTPError as e:
                if e.response.status_code == 409:
                    print(f"  ⚠️  Substitute already exists: {substitute['key']}")
                else:
                    raise
        
        print("✅ Global entities created successfully")
    
    def create_mission(self) -> str:
        """Create a sample mission"""
        print("🔄 Creating mission...")
        
        mission_data = {
            "name": "Mars Sample Mission",
            "description": "Sample mission for testing optimization system",
            "mission_start_date": "2024-06-01",
            "duration_weeks": 8,
            "transit_weeks": 2,
            "surface_weeks": 4,
            "return_weeks": 2,
            "crew_count": 4,
            "crew_hours_per_week": 40.0,
            "printer_capacity_kg_per_week": 10.0,
            "tools_available": ["extruder", "compressor", "heater", "mold"],
            "status": "Planned"
        }
        
        response = self._post("/missions", mission_data)
        self.mission_id = response["id"]
        print(f"✅ Created mission: {self.mission_id}")
        return self.mission_id
    
    def create_job(self) -> str:
        """Create a job"""
        print("🔄 Creating job...")
        
        job_data = {
            "mission_id": self.mission_id,
            "total_weeks": 8,
            "w_mass": 1.0,
            "w_value": 1.0,
            "w_crew": 0.5,
            "w_energy": 0.2,
            "w_risk": 0.3,
            "w_make": 5.0,
            "w_carry": -2.0,
            "w_shortage": 10000.0,
            "params": {}
        }
        
        response = self._post("/jobs", job_data)
        self.job_id = response["id"]
        print(f"✅ Created job: {self.job_id}")
        return self.job_id
    
    def configure_job_entities(self):
        """Configure job entities"""
        print("🔄 Configuring job entities...")
        
        # Enable entities
        entities = {
            "materials": ["plastic", "textile"],
            "methods": ["extrude", "compress"],
            "outputs": ["filament", "insulation"],
            "items": ["spare_part", "insulation_patch"],
            "substitutes": ["printed_part", "insulation_pad"]
        }
        
        for entity_type, keys in entities.items():
            for key in keys:
                self._post(f"/jobs/{self.job_id}/enabled-{entity_type}", {f"{entity_type[:-1]}_key": key})
                print(f"  ✅ Enabled {entity_type[:-1]}: {key}")
    
    def set_inventories(self):
        """Set initial inventories"""
        print("🔄 Setting initial inventories...")
        
        # Material inventory
        material_inventory = [
            {"material_key": "plastic", "qty_kg": 10.0},
            {"material_key": "textile", "qty_kg": 8.0}
        ]
        
        for inv in material_inventory:
            self._post(f"/jobs/{self.job_id}/material-inventory", inv)
            print(f"  ✅ Set material inventory: {inv['material_key']} = {inv['qty_kg']} kg")
        
        # Output inventory
        output_inventory = [
            {"output_key": "filament", "qty_kg": 5.0},
            {"output_key": "insulation", "qty_kg": 4.0}
        ]
        
        for inv in output_inventory:
            self._post(f"/jobs/{self.job_id}/output-inventory", inv)
            print(f"  ✅ Set output inventory: {inv['output_key']} = {inv['qty_kg']} kg")
        
        # Item inventory
        item_inventory = [
            {"item_key": "spare_part", "qty_units": 25.0},
            {"item_key": "insulation_patch", "qty_units": 20.0}
        ]
        
        for inv in item_inventory:
            self._post(f"/jobs/{self.job_id}/item-inventory", inv)
            print(f"  ✅ Set item inventory: {inv['item_key']} = {inv['qty_units']} units")
        
        # Substitute inventory
        substitute_inventory = [
            {"substitute_key": "printed_part", "qty_units": 0.0},
            {"substitute_key": "insulation_pad", "qty_units": 0.0}
        ]
        
        for inv in substitute_inventory:
            self._post(f"/jobs/{self.job_id}/substitute-inventory", inv)
            print(f"  ✅ Set substitute inventory: {inv['substitute_key']} = {inv['qty_units']} units")
    
    def set_demands_and_deadlines(self):
        """Set item demands and deadlines"""
        print("🔄 Setting demands and deadlines...")
        
        # Item demands
        demands = [
            {"item_key": "spare_part", "week": 2, "amount": 5.0},
            {"item_key": "spare_part", "week": 4, "amount": 4.0},
            {"item_key": "spare_part", "week": 6, "amount": 6.0},
            {"item_key": "insulation_patch", "week": 3, "amount": 4.0},
            {"item_key": "insulation_patch", "week": 5, "amount": 5.0},
            {"item_key": "insulation_patch", "week": 7, "amount": 7.0}
        ]
        
        for demand in demands:
            self._post(f"/jobs/{self.job_id}/item-demands", demand)
            print(f"  ✅ Set demand: {demand['item_key']} week {demand['week']} = {demand['amount']}")
        
        # Deadlines
        deadlines = [
            {"item_key": "spare_part", "week": 4, "amount": 9.0},
            {"item_key": "spare_part", "week": 6, "amount": 15.0},
            {"item_key": "insulation_patch", "week": 5, "amount": 9.0},
            {"item_key": "insulation_patch", "week": 8, "amount": 20.0}
        ]
        
        for deadline in deadlines:
            self._post(f"/jobs/{self.job_id}/deadlines", deadline)
            print(f"  ✅ Set deadline: {deadline['item_key']} week {deadline['week']} = {deadline['amount']}")
    
    def set_resources_and_capacity(self):
        """Set weekly resources and method capacity"""
        print("🔄 Setting resources and capacity...")
        
        # Weekly resources
        weekly_resources = [
            {"week": 1, "crew_available": 12.0, "energy_available": 35.0},
            {"week": 2, "crew_available": 15.0, "energy_available": 45.0},
            {"week": 3, "crew_available": 10.0, "energy_available": 30.0},
            {"week": 4, "crew_available": 18.0, "energy_available": 55.0},
            {"week": 5, "crew_available": 14.0, "energy_available": 40.0},
            {"week": 6, "crew_available": 12.0, "energy_available": 35.0},
            {"week": 7, "crew_available": 16.0, "energy_available": 50.0},
            {"week": 8, "crew_available": 15.0, "energy_available": 45.0}
        ]
        
        for resource in weekly_resources:
            self._post(f"/jobs/{self.job_id}/week-resources", resource)
            print(f"  ✅ Set week {resource['week']} resources: crew={resource['crew_available']}, energy={resource['energy_available']}")
        
        # Method capacity
        methods = ["extrude", "compress"]
        availability_pattern = {
            "extrude": [1, 1, 0, 1, 1, 1, 0, 1],  # Not available weeks 3, 7
            "compress": [1, 0, 1, 0, 1, 1, 1, 1]   # Not available weeks 2, 4
        }
        
        for method in methods:
            for week in range(1, 9):
                capacity_data = {
                    "method_key": method,
                    "week": week,
                    "max_capacity_kg": 8.0,
                    "available": bool(availability_pattern[method][week-1])
                }
                self._post(f"/jobs/{self.job_id}/method-capacity", capacity_data)
                status = "available" if capacity_data["available"] else "unavailable"
                print(f"  ✅ Set {method} week {week}: {capacity_data['max_capacity_kg']} kg ({status})")
    
    def run_job(self):
        """Run the optimization job"""
        print("🔄 Starting optimization...")
        
        response = self._post(f"/jobs/{self.job_id}/run", {})
        print(f"✅ Job started: {response}")
        return response
    
    def monitor_job(self, timeout: int = 300):
        """Monitor job progress"""
        print("🔄 Monitoring job progress...")
        
        start_time = time.time()
        while time.time() - start_time < timeout:
            job_status = self._get(f"/jobs/{self.job_id}")
            status = job_status["status"]
            
            print(f"  📊 Job status: {status}")
            
            if status == "completed":
                print("✅ Job completed successfully!")
                return True
            elif status == "failed":
                error = job_status.get("error_message", "Unknown error")
                print(f"❌ Job failed: {error}")
                return False
            
            time.sleep(5)  # Check every 5 seconds
        
        print("⏰ Timeout waiting for job completion")
        return False
    
    def get_results(self):
        """Get job results"""
        print("🔄 Fetching results...")
        
        try:
            results = self._get(f"/jobs/{self.job_id}/results/full")
            print("✅ Results fetched successfully")
            
            # Print summary
            if "summary" in results:
                summary = results["summary"]
                print(f"  📊 Objective Value: {summary.get('objective_value', 'N/A')}")
                print(f"  📊 Total Processed: {summary.get('total_processed_kg', 'N/A')} kg")
                print(f"  📊 Total Output: {summary.get('total_output_produced_kg', 'N/A')} kg")
                print(f"  📊 Total Substitutes: {summary.get('total_substitutes_made', 'N/A')}")
            
            return results
        except Exception as e:
            print(f"❌ Error fetching results: {e}")
            return None
    
    def create_complete_job(self):
        """Create a complete job from start to finish"""
        print("🚀 Starting complete job creation process")
        print("=" * 60)
        
        try:
            # Step 1: Create global entities (if needed)
            self.create_global_entities()
            
            # Step 2: Create mission
            self.create_mission()
            
            # Step 3: Create job
            self.create_job()
            
            # Step 4: Configure job
            self.configure_job_entities()
            self.set_inventories()
            self.set_demands_and_deadlines()
            self.set_resources_and_capacity()
            
            print("=" * 60)
            print("✅ Job configuration completed successfully!")
            print(f"📋 Mission ID: {self.mission_id}")
            print(f"📋 Job ID: {self.job_id}")
            
            # Ask user if they want to run the job
            run_now = input("\n🤔 Do you want to run the optimization now? (y/n): ").strip().lower()
            
            if run_now == 'y':
                # Step 5: Run job
                self.run_job()
                
                # Step 6: Monitor progress
                if self.monitor_job():
                    # Step 7: Get results
                    self.get_results()
            
            print("\n🎉 Process completed!")
            
        except Exception as e:
            print(f"❌ Error in job creation process: {e}")
            raise


def main():
    """Main function"""
    print("Sample Job Creation Script")
    print("=" * 60)
    
    # Check if backend is running
    try:
        response = requests.get("http://localhost:8000/health")
        response.raise_for_status()
        print("✅ Backend is running")
    except Exception as e:
        print("❌ Backend is not running. Please start it first:")
        print("   cd /Users/vihangamunasinghe/WebProjects/ares/backend")
        print("   uvicorn app.main:app --reload")
        return
    
    # Create job
    creator = JobCreator()
    creator.create_complete_job()


if __name__ == "__main__":
    main()
