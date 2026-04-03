/**
 * @file lib/shipping.ts
 * @description Shipping fee system for Pando store
 *
 * Store origin: 86 E. Jacinto St., Marikina City, Metro Manila, Philippines 1800
 *
 * Shipping Rules:
 *  - Metro Manila  → ₱0   (FREE)
 *  - Luzon (ex-MM) → ₱200
 *  - Visayas       → ₱350
 *  - Mindanao      → ₱500
 *  - International → ₱500 (or manual, contact support)
 *  - Fallback      → ₱200 (unknown location)
 *
 * Free shipping (nationwide, excl. international): orders ≥ ₱1,500
 */

// ── TYPES ─────────────────────────────────────────────────────────────────────
export type ShippingRegion =
  | "metro_manila"
  | "luzon"
  | "visayas"
  | "mindanao"
  | "international";

export interface ShippingConfig {
  region: ShippingRegion;
  fee: number;
  estimatedDays: [number, number];
  label: string;
  description?: string;
}

export interface ShippingRegionInfo {
  region: ShippingRegion;
  label: string;
  cities: string[];
  provinces: string[];
  baseShippingFee: number;
  estimatedDays: [number, number];
}

// ── CONSTANTS ─────────────────────────────────────────────────────────────────

/** Free shipping threshold — applies to all PH regions (excl. international) */
export const FREE_SHIPPING_THRESHOLD = 10000;

/** Base shipping fees per region */
export const SHIPPING_FEES: Record<ShippingRegion, number> = {
  metro_manila: 0,
  luzon: 200,
  visayas: 350,
  mindanao: 500,
  international: 500,
};

// ── LOCATION DATA ─────────────────────────────────────────────────────────────

export const METRO_MANILA_CITIES = [
  "manila",
  "quezon city",
  "caloocan",
  "makati",
  "pasig",
  "marikina",
  "muntinlupa",
  "parañaque",
  "paranaque",
  "las piñas",
  "las pinas",
  "san juan",
  "mandaluyong",
  "malabon",
  "navotas",
  "taguig",
  "pateros",
  "valenzuela",
];

export const LUZON_PROVINCES = [
  // Region I
  "ilocos norte", "ilocos sur", "la union", "pangasinan",
  // Region II
  "batanes", "cagayan", "isabela", "nueva vizcaya", "quirino",
  // Region III
  "bataan", "bulacan", "nueva ecija", "pampanga", "tarlac", "zambales", "aurora",
  // Region IV-A (CALABARZON)
  "batangas", "cavite", "laguna", "quezon", "rizal",
  // Region IV-B (MIMAROPA)
  "marinduque", "occidental mindoro", "oriental mindoro", "palawan", "romblon",
  // Region V (Bicol)
  "albay", "camarines norte", "camarines sur", "catanduanes", "masbate", "sorsogon",
  // Cordillera
  "abra", "apayao", "benguet", "ifugao", "kalinga", "mountain province",
];

export const VISAYAS_PROVINCES = [
  // Region VI (Western Visayas)
  "aklan", "antique", "capiz", "guimaras", "iloilo", "negros occidental",
  // Region VII (Central Visayas)
  "bohol", "cebu", "negros oriental", "siquijor",
  // Region VIII (Eastern Visayas)
  "eastern samar", "leyte", "northern samar", "samar", "southern leyte", "biliran",
];

export const MINDANAO_PROVINCES = [
  // Region IX (Zamboanga Peninsula)
  "basilan", "zamboanga del norte", "zamboanga del sur", "zamboanga sibugay",
  // Region X (Northern Mindanao)
  "bukidnon", "camiguin", "lanao del norte", "misamis occidental", "misamis oriental",
  // Region XI (Davao)
  "davao del norte", "davao del sur", "davao occidental", "davao de oro", "davao oriental",
  // Region XII (SOCCSKSARGEN)
  "cotabato", "south cotabato", "sultan kudarat", "sarangani",
  // Region XIII (Caraga)
  "agusan del norte", "agusan del sur", "dinagat islands", "surigao del norte", "surigao del sur",
  // BARMM
  "lanao del sur", "maguindanao", "sulu", "tawi-tawi",
];

// ── CORE FUNCTIONS ────────────────────────────────────────────────────────────

/**
 * Detect shipping region from customer's city and province.
 *
 * @example
 * detectShippingRegion("Pasig", "Metro Manila")   // "metro_manila"
 * detectShippingRegion("Davao City", "Davao del Sur") // "mindanao"
 * detectShippingRegion("Iloilo City", "Iloilo")   // "visayas"
 * detectShippingRegion("New York", "NY")           // "international"
 */
export function detectShippingRegion(
  city: string,
  province: string,
): ShippingRegion {
  const c = city.toLowerCase().trim();
  const p = province.toLowerCase().trim();

  if (!c && !p) return "luzon"; // fallback

  if (METRO_MANILA_CITIES.includes(c) || METRO_MANILA_CITIES.includes(p))
    return "metro_manila";

  if (LUZON_PROVINCES.includes(p) || LUZON_PROVINCES.includes(c))
    return "luzon";

  if (VISAYAS_PROVINCES.includes(p) || VISAYAS_PROVINCES.includes(c))
    return "visayas";

  if (MINDANAO_PROVINCES.includes(p) || MINDANAO_PROVINCES.includes(c))
    return "mindanao";

  // If nothing matched, could be international or unknown PH area
  return "international";
}

/**
 * Get complete shipping configuration given a region and order subtotal.
 * Free shipping (₱1,500+) applies to all Philippine regions.
 *
 * @example
 * getShippingConfig("metro_manila", 500)
 * // { fee: 0, label: "FREE – Metro Manila", estimatedDays: [1, 2] }
 *
 * getShippingConfig("mindanao", 2000)
 * // { fee: 0, label: "FREE Shipping (order ≥ ₱1,500)", estimatedDays: [5, 7] }
 *
 * getShippingConfig("visayas", 800)
 * // { fee: 350, label: "Standard – Visayas", estimatedDays: [5, 7] }
 */
export function getShippingConfig(
  region: ShippingRegion,
  subtotal: number,
): ShippingConfig {
  // Free shipping threshold — nationwide, excluding international
  if (subtotal >= FREE_SHIPPING_THRESHOLD && region !== "international") {
    return {
      region,
      fee: 0,
      estimatedDays: region === "metro_manila" ? [1, 2] : region === "luzon" ? [2, 4] : [5, 7],
      label: "FREE Shipping (order ≥ ₱1,500)",
      description:
        "Your order qualifies for free nationwide shipping! Estimated delivery depends on your location.",
    };
  }

  switch (region) {
    case "metro_manila":
      return {
        region: "metro_manila",
        fee: 0,
        estimatedDays: [1, 2],
        label: "FREE – Metro Manila",
        description:
          "Pando delivers directly within Metro Manila. Fast, free, and reliable.",
      };

    case "luzon":
      return {
        region: "luzon",
        fee: 200,
        estimatedDays: [2, 4],
        label: "Standard – Luzon (outside MM)",
        description:
          "Delivered to Luzon provinces via trusted logistics partners.",
      };

    case "visayas":
      return {
        region: "visayas",
        fee: 350,
        estimatedDays: [5, 7],
        label: "Inter-island – Visayas",
        description:
          "Inter-island shipping to Visayas via sea and land routes.",
      };

    case "mindanao":
      return {
        region: "mindanao",
        fee: 500,
        estimatedDays: [5, 7],
        label: "Inter-island – Mindanao",
        description:
          "Long-distance delivery to Mindanao via our logistics network.",
      };

    case "international":
      return {
        region: "international",
        fee: 500,
        estimatedDays: [7, 14],
        label: "International – Contact Support",
        description:
          "International shipping available. A custom quote will be sent after order confirmation.",
      };

    default:
      // Fallback: treat as Luzon standard
      return {
        region: "luzon",
        fee: 200,
        estimatedDays: [2, 4],
        label: "Standard Shipping",
        description: "Standard shipping via logistics partners.",
      };
  }
}

// ── UTILITY FUNCTIONS ─────────────────────────────────────────────────────────

/** Amount remaining before free shipping kicks in (0 if already qualified). */
export function getAmountToFreeShipping(subtotal: number): number {
  return Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
}

/** True if order qualifies for free shipping. */
export function isFreeShipping(
  region: ShippingRegion,
  subtotal: number,
): boolean {
  if (region === "international") return false;
  if (region === "metro_manila") return true;
  return subtotal >= FREE_SHIPPING_THRESHOLD;
}

/** Format price in Philippine Peso. */
export function formatPhilippinePrice(price: number): string {
  return "₱" + new Intl.NumberFormat("en-PH").format(price);
}

/** Format delivery estimate as a readable string. */
export function formatDeliveryDays(days: [number, number]): string {
  return `${days[0]}–${days[1]} business day${days[1] !== 1 ? "s" : ""}`;
}

/** All available regions. */
export function getAllRegions(): ShippingRegion[] {
  return ["metro_manila", "luzon", "visayas", "mindanao", "international"];
}

/** Full region metadata (for admin dashboards). */
export function getRegionInfo(region: ShippingRegion): ShippingRegionInfo {
  const map: Record<ShippingRegion, ShippingRegionInfo> = {
    metro_manila: {
      region: "metro_manila",
      label: "Metro Manila",
      cities: METRO_MANILA_CITIES,
      provinces: ["Metro Manila", "NCR"],
      baseShippingFee: 0,
      estimatedDays: [1, 2],
    },
    luzon: {
      region: "luzon",
      label: "Luzon (Outside MM)",
      cities: [],
      provinces: LUZON_PROVINCES,
      baseShippingFee: 200,
      estimatedDays: [2, 4],
    },
    visayas: {
      region: "visayas",
      label: "Visayas",
      cities: [],
      provinces: VISAYAS_PROVINCES,
      baseShippingFee: 350,
      estimatedDays: [5, 7],
    },
    mindanao: {
      region: "mindanao",
      label: "Mindanao",
      cities: [],
      provinces: MINDANAO_PROVINCES,
      baseShippingFee: 500,
      estimatedDays: [5, 7],
    },
    international: {
      region: "international",
      label: "International",
      cities: [],
      provinces: [],
      baseShippingFee: 500,
      estimatedDays: [7, 14],
    },
  };
  return map[region];
}

/**
 * Resolve a region from Nominatim reverse-geocode response.
 * Use this on the client after calling the Nominatim API.
 *
 * @param nominatimAddress - The `address` object from Nominatim JSON response
 * @returns Detected ShippingRegion
 *
 * @example
 * const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
 * const json = await res.json();
 * const region = detectRegionFromNominatim(json.address);
 */
export function detectRegionFromNominatim(nominatimAddress: {
  country_code?: string;
  state?: string;
  city?: string;
  town?: string;
  municipality?: string;
  county?: string;
  suburb?: string;
  [key: string]: string | undefined;
}): {
  region: ShippingRegion;
  city: string;
  province: string;
} {
  const countryCode = (nominatimAddress.country_code ?? "").toLowerCase();

  // Not Philippines → international
  if (countryCode && countryCode !== "ph") {
    return {
      region: "international",
      city: nominatimAddress.city ?? nominatimAddress.town ?? "",
      province: nominatimAddress.state ?? "",
    };
  }

  const city =
    nominatimAddress.city ??
    nominatimAddress.town ??
    nominatimAddress.municipality ??
    nominatimAddress.suburb ??
    "";

  const province =
    nominatimAddress.county ??
    nominatimAddress.state ??
    "";

  const region = detectShippingRegion(city, province);

  return { region, city, province };
}