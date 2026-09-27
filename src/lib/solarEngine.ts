/**
 * Solar SCADA Physics Engine & Synthetic Telemetry Generator
 * Handles PVlib-style expected power calculations and multi-fault synthetic signatures.
 */

export interface TelemetryPoint {
  timestamp: string;      // ISO-8601 formatted timestamp string
  poaIrradiance: number;  // Plane of Array Irradiance (W/m²)
  ambientTemp: number;    // Ambient Air Temperature (°C)
  moduleTemp: number;     // PV Back-of-Module Temperature (°C)
  dcPower: number;        // Direct Current Power Output (kW)
  acPower: number;        // Alternating Current Power Output (kW)
  gridLimit: number;      // Active Grid Export Power Capacity Limit (kW)
  faultType?: "NONE" | "SOILING" | "SHADING" | "INVERTER_DERATING" | "GRID_CURTAILMENT";
}

export interface SystemSpecs {
  capacityKW: number;     // Nameplate DC Installed Capacity in kW (e.g. 500 kW)
  tempCoeff: number;      // Maximum Power Temperature Coefficient γ_Pmp (%/°C, e.g. -0.0038 / °C)
  stcTemp: number;        // Standard Test Condition Reference Temperature (°C, typically 25.0 °C)
}

export const DEFAULT_SYSTEM_SPECS: SystemSpecs = {
  capacityKW: 500,        // 500 kWp Solar Plant
  tempCoeff: -0.0038,     // -0.38% / °C typical for monocrystalline silicon
  stcTemp: 25.0,          // 25 °C STC
};

/**
 * Calculates Expected DC/AC Power using a simplified PVlib single-diode/temperature-corrected model.
 * Formula: P_exp = (POA / 1000) * Capacity * (1 + tempCoeff * (moduleTemp - stcTemp))
 * 
 * @param point - Point containing poaIrradiance and moduleTemp
 * @param specs - System specifications (capacityKW, tempCoeff, stcTemp)
 * @returns Expected Power in kW (bounded >= 0)
 */
export function calculateExpectedPower(
  point: Pick<TelemetryPoint, "poaIrradiance" | "moduleTemp">,
  specs: SystemSpecs
): number {
  const { poaIrradiance, moduleTemp } = point;
  const { capacityKW, tempCoeff, stcTemp } = specs;

  if (poaIrradiance <= 0) {
    return 0;
  }

  // Temperature loss/gain factor
  const deltaTemp = moduleTemp - stcTemp;
  const tempCorrection = 1 + tempCoeff * deltaTemp;

  // Expected power under current POA and module temperature
  const expectedPower = (poaIrradiance / 1000) * capacityKW * Math.max(0, tempCorrection);

  return Number(Math.max(0, expectedPower).toFixed(2));
}

/**
 * Generates 288 synthetic telemetry data points (24 hours at 5-minute intervals).
 * Simulates a realistic solar irradiance diurnal bell curve, ambient/module thermal dynamics,
 * and injects four distinct industrial fault signatures:
 * 
 * 1. 08:00 - 10:00: Soiling (gradual 15% power loss, normal irradiance)
 * 2. 11:00 - 11:30: Shading (sharp 40% sudden power drop)
 * 3. 14:00 - 16:00: Inverter Derating (module/inverter temp spikes artificially, power plateaus)
 * 4. 17:00 - 17:30: Grid Curtailment (power artificially capped at 60% despite irradiance)
 * 
 * @param specs - Solar PV plant system specifications
 * @returns Array of 288 TelemetryPoint objects
 */
export function generateSyntheticTelemetry(specs: SystemSpecs = DEFAULT_SYSTEM_SPECS): TelemetryPoint[] {
  const points: TelemetryPoint[] = [];
  const TOTAL_POINTS = 288; // 24 hours * 12 points/hour
  const BASE_DATE = "2026-09-27";
  const INVERTER_NOMINAL_EFFICIENCY = 0.985; // 98.5% nominal conversion efficiency

  for (let i = 0; i < TOTAL_POINTS; i++) {
    const totalMinutes = i * 5;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const decimalHour = hours + minutes / 60;

    // Format ISO timestamp
    const hh = String(hours).padStart(2, "0");
    const mm = String(minutes).padStart(2, "0");
    const timestamp = `${BASE_DATE}T${hh}:${mm}:00.000Z`;

    // 1. Irradiance Bell Curve Simulation (Sunrise: 06:00, Solar Noon: 12:30, Sunset: 18:30)
    let poaIrradiance = 0;
    const sunrise = 6.0;
    const sunset = 18.5;

    if (decimalHour >= sunrise && decimalHour <= sunset) {
      const daylightFraction = (decimalHour - sunrise) / (sunset - sunrise);
      // Bell curve using sine function with solar noon peak at ~980 W/m²
      const solarAngle = Math.PI * daylightFraction;
      const peakIrradiance = 980;
      // Slight natural variation
      const noise = (Math.sin(i * 0.35) * 4) + (Math.cos(i * 0.15) * 3);
      poaIrradiance = Math.max(0, peakIrradiance * Math.pow(Math.sin(solarAngle), 1.15) + noise);
    }
    poaIrradiance = Number(poaIrradiance.toFixed(1));

    // 2. Ambient Temperature Simulation (Min 21°C at dawn, Max 34°C at 15:00)
    const ambientTemp = Number(
      (21.0 + 13.0 * Math.sin(Math.PI * ((decimalHour - 4) / 16))).toFixed(1)
    );

    // 3. Baseline Normal Back-of-Module Temperature (King / Sandia Model approx: T_mod = T_amb + (POA/800) * 28)
    let moduleTemp = Number(
      (ambientTemp + (poaIrradiance / 800) * 28.0).toFixed(1)
    );

    // Grid capacity limit (Default unlimited / nameplate)
    let gridLimit = specs.capacityKW;
    let faultType: TelemetryPoint["faultType"] = "NONE";

    // 4. Calculate Baseline Expected Power
    const baselineExpected = calculateExpectedPower({ poaIrradiance, moduleTemp }, specs);
    let dcPower = baselineExpected;

    // --- FAULT SIGNATURE INJECTIONS ---

    // Fault 1: 08:00 - 10:00 (minutes 480 to 600) -> Soiling (Gradual 15% power loss, irradiance normal)
    if (totalMinutes >= 480 && totalMinutes < 600) {
      faultType = "SOILING";
      // Ramp soiling loss from 5% up to 15%
      const rampProgress = (totalMinutes - 480) / 120;
      const soilingLossRatio = 0.05 + 0.10 * rampProgress; // 5% -> 15%
      dcPower = Number((baselineExpected * (1 - soilingLossRatio)).toFixed(2));
    }

    // Fault 2: 11:00 - 11:30 (minutes 660 to 690) -> Shading (Sharp 40% power drop)
    else if (totalMinutes >= 660 && totalMinutes < 690) {
      faultType = "SHADING";
      const shadingDropRatio = 0.40; // 40% sudden reduction
      dcPower = Number((baselineExpected * (1 - shadingDropRatio)).toFixed(2));
    }

    // Fault 3: 14:00 - 16:00 (minutes 840 to 960) -> Inverter Derating (Thermal spike, power plateaus)
    else if (totalMinutes >= 840 && totalMinutes < 960) {
      faultType = "INVERTER_DERATING";
      // Artificial module/inverter temperature spike (+22°C above baseline)
      moduleTemp = Number((moduleTemp + 22.5).toFixed(1));
      
      // Power plateaus / thermally capped at 55% of plant rated capacity
      const thermalDerateCeiling = specs.capacityKW * 0.55;
      dcPower = Number(Math.min(baselineExpected, thermalDerateCeiling).toFixed(2));
    }

    // Fault 4: 17:00 - 17:30 (minutes 1020 to 1050) -> Grid Curtailment (Power capped at 60%)
    else if (totalMinutes >= 1020 && totalMinutes < 1050) {
      faultType = "GRID_CURTAILMENT";
      // Grid operator sends 60% export limit
      gridLimit = Number((specs.capacityKW * 0.60).toFixed(2));
    }

    // 5. Inverter AC Conversion with Grid Limiting
    let acPower = dcPower * INVERTER_NOMINAL_EFFICIENCY;
    if (acPower > gridLimit) {
      acPower = gridLimit;
    }
    acPower = Number(Math.max(0, acPower).toFixed(2));
    dcPower = Number(Math.max(0, dcPower).toFixed(2));

    points.push({
      timestamp,
      poaIrradiance,
      ambientTemp,
      moduleTemp,
      dcPower,
      acPower,
      gridLimit,
      faultType,
    });
  }

  return points;
}
