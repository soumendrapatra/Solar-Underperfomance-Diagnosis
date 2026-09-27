import { TelemetryPoint, SystemSpecs, calculateExpectedPower } from "./solarEngine";

export interface DiagnosticEvent {
  timestamp: string;
  poaIrradiance?: number;
  yieldGapPercent: number;
  expectedPower: number;
  actualPower: number;
  rootCause: string;
  prescriptiveAction: string;
  financialLossUSD: number;
}

export function runDiagnostics(
  telemetry: TelemetryPoint[],
  specs: SystemSpecs,
  ppaTariff: number
): DiagnosticEvent[] {
  return telemetry.map((point) => {
    const expectedPower = calculateExpectedPower(point, specs);
    const actualPower = point.acPower;
    const yieldGap = Math.max(0, expectedPower - actualPower);
    const yieldGapPercent = expectedPower > 0 ? (yieldGap / expectedPower) * 100 : 0;
    const financialLossUSD = Number(((yieldGap / 1000) * (5 / 60) * ppaTariff).toFixed(4));

    let rootCause = "Nominal Operation";
    let prescriptiveAction = "System operating within expected parameters.";

    if (point.poaIrradiance > 50 && expectedPower > 0) {
      if (point.gridLimit < specs.capacityKW * 0.95 && actualPower <= point.gridLimit + 1 && expectedPower > point.gridLimit + 5) {
        rootCause = "Grid Curtailment";
        prescriptiveAction = "Review grid operator dispatch signals. No hardware fault.";
      } else if (point.moduleTemp >= 65 && yieldGapPercent > 5) {
        rootCause = "Inverter Thermal Derating";
        prescriptiveAction = "Verify inverter cooling fans and ventilation.";
      } else if (yieldGapPercent > 30) {
        rootCause = "Partial Shading / String Fault";
        prescriptiveAction = "Inspect array for obstructions. Check bypass diodes.";
      } else if (yieldGapPercent > 10 && yieldGapPercent <= 25) {
        rootCause = "Uniform Soiling";
        prescriptiveAction = "Schedule module cleaning. PR degraded.";
      }
    }

    return {
      timestamp: point.timestamp,
      poaIrradiance: point.poaIrradiance,
      yieldGapPercent: Number(yieldGapPercent.toFixed(2)),
      expectedPower,
      actualPower,
      rootCause,
      prescriptiveAction,
      financialLossUSD: rootCause === "Nominal Operation" ? 0 : financialLossUSD,
    };
  });
}
