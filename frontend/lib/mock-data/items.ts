import type { ItemTemplate } from "@/types/items"

export const mockItems: ItemTemplate[] = [
  {
    id: "item-001",
    name: "Food Packaging Pouch",
    category: "packaging",
    manufacturer: "SpaceFood Inc.",
    sku: "SFI-PKG-001",
    unit: "unit",
    mass_per_unit_kg: 0.025,
    volume_per_unit_l: 0.5,
    default_pack_quantity: 100,
    composition: [
      {
        material_id: "mat-plastic-01",
        material_name: "LDPE Plastic",
        percent_by_mass: 70,
        recoverable: true,
      },
      {
        material_id: "mat-aluminum-01",
        material_name: "Aluminum Foil",
        percent_by_mass: 30,
        recoverable: true,
      },
    ],
    waste_mappings: [
      {
        material_id: "mat-plastic-01",
        waste_id: "waste-plastic",
        waste_name: "Plastic Waste",
        recommended_methods: [
          {
            recipe_id: "rec-001",
            method_name: "Pyrolysis",
            expected_yield: 0.65,
            feasibility_override: 85,
          },
          {
            recipe_id: "rec-002",
            method_name: "Mechanical Recycling",
            expected_yield: 0.75,
            feasibility_override: 70,
          },
        ],
      },
      {
        material_id: "mat-aluminum-01",
        waste_id: "waste-metal",
        waste_name: "Metal Waste",
        recommended_methods: [
          {
            recipe_id: "rec-003",
            method_name: "Melting & Casting",
            expected_yield: 0.92,
            feasibility_override: 90,
          },
        ],
      },
    ],
    default_usage_hint: "Single-use food storage, 1 pouch per meal",
    safety_flags: {
      flammability: "low",
      toxicity: "none",
      bio: false,
      dust_hazard: false,
    },
    tags: ["food", "single-use", "recyclable"],
    deprecated: false,
    created_at: "2025-01-15T10:00:00Z",
    updated_at: "2025-01-15T10:00:00Z",
  },
  {
    id: "item-002",
    name: "Water Filter Cartridge",
    category: "equipment",
    manufacturer: "AquaMars Systems",
    sku: "AMS-FLT-205",
    unit: "unit",
    mass_per_unit_kg: 1.2,
    volume_per_unit_l: 2.5,
    composition: [
      {
        material_id: "mat-carbon-01",
        material_name: "Activated Carbon",
        percent_by_mass: 45,
        recoverable: false,
      },
      {
        material_id: "mat-plastic-02",
        material_name: "ABS Plastic",
        percent_by_mass: 40,
        recoverable: true,
      },
      {
        material_id: "mat-ceramic-01",
        material_name: "Ceramic Membrane",
        percent_by_mass: 15,
        recoverable: false,
      },
    ],
    waste_mappings: [
      {
        material_id: "mat-plastic-02",
        waste_id: "waste-plastic",
        waste_name: "Plastic Waste",
        recommended_methods: [
          {
            recipe_id: "rec-004",
            method_name: "Shredding & Extrusion",
            expected_yield: 0.68,
            feasibility_override: 75,
          },
        ],
      },
    ],
    default_usage_hint: "Replace every 90 days or 500L processed",
    safety_flags: {
      flammability: "low",
      toxicity: "low",
      bio: true,
      dust_hazard: true,
    },
    tags: ["water", "consumable", "life-support"],
    deprecated: false,
    created_at: "2025-01-10T14:30:00Z",
    updated_at: "2025-01-20T09:15:00Z",
  },
  {
    id: "item-003",
    name: "Medical Waste Bag",
    category: "medical",
    manufacturer: "MedSpace Solutions",
    sku: "MSS-BAG-BIO-50",
    unit: "unit",
    mass_per_unit_kg: 0.05,
    volume_per_unit_l: 5.0,
    composition: [
      {
        material_id: "mat-bioplastic-01",
        material_name: "PLA Bioplastic",
        percent_by_mass: 100,
        recoverable: true,
      },
    ],
    waste_mappings: [
      {
        material_id: "mat-bioplastic-01",
        waste_id: "waste-bioplastic",
        waste_name: "Bioplastic Waste",
        recommended_methods: [
          {
            recipe_id: "rec-005",
            method_name: "Composting",
            expected_yield: 0.85,
            feasibility_override: 60,
            notes: "Requires controlled temperature and humidity",
          },
          {
            recipe_id: "rec-006",
            method_name: "Chemical Depolymerization",
            expected_yield: 0.72,
            feasibility_override: 80,
          },
        ],
      },
    ],
    default_usage_hint: "Single-use biohazard containment",
    safety_flags: {
      flammability: "medium",
      toxicity: "high",
      bio: true,
      dust_hazard: false,
    },
    tags: ["medical", "biohazard", "single-use", "biodegradable"],
    deprecated: false,
    created_at: "2025-01-05T08:00:00Z",
    updated_at: "2025-01-05T08:00:00Z",
  },
]
