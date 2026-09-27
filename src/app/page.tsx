"use client";

import React, { useMemo } from "react";
import { generateSyntheticTelemetry, SystemSpecs } from "../lib/solarEngine";
import { runDiagnostics } from "../lib/diagnosticEngine";
import TelemetryChart from "../components/TelemetryChart";
import DiagnosticFeed from "../components/DiagnosticFeed";

const SYSTEM_SPECS: SystemSpecs = {
  capacityKW: 500,
  tempCoeff: -0.004,
  stcTemp: 25.0,
};

const PPA_TARIFF = 0.08; // 0.08 USD per kWh

export default function ScadaDashboardPage() {
  // Generate synthetic telemetry and run physics diagnostics
  const { diagnosticData } = useMemo(() => {
    const telemetry = generateSyntheticTelemetry(SYSTEM_SPECS);
    const diagnosticData = runDiagnostics(telemetry, SYSTEM_SPECS, PPA_TARIFF);

    return {
      diagnosticData,
    };
  }, []);

  return (
    <main className="h-screen w-screen overflow-hidden bg-background text-text-primary flex flex-col font-mono text-xs select-none">
      {/* TOP HEADER */}
      <header className="h-8 border-b border-border bg-surface px-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3">
          <span className="font-mono text-xs tracking-widest text-text-primary uppercase font-bold">
            PV PLANT DIAGNOSTIC ENGINE // NODE 01
          </span>
          <span className="text-border">|</span>
          <span className="text-text-secondary text-[11px]">
            CAP: {SYSTEM_SPECS.capacityKW} kWp
          </span>
          <span className="text-border">|</span>
          <span className="text-text-secondary text-[11px]">
            γ: {(SYSTEM_SPECS.tempCoeff * 100).toFixed(2)}%/°C
          </span>
          <span className="text-border">|</span>
          <span className="text-text-secondary text-[11px]">
            TARIFF: ${PPA_TARIFF.toFixed(2)}/kWh
          </span>
        </div>

        <div className="flex items-center space-x-4 text-[11px]">
          <span className="text-text-secondary">SYSTEM:</span>
          <span className="text-active-green font-bold">ONLINE</span>
        </div>
      </header>

      {/* MAIN CONTENT WORKSPACE: SPLIT 65% / 35% */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT COLUMN: TELEMETRY CHART (65% WIDTH) */}
        <section className="w-full lg:w-[65%] h-full flex flex-col border-b lg:border-b-0 lg:border-r border-border bg-surface-muted p-2 overflow-hidden flex-shrink-0">
          <div className="flex items-center justify-between px-1 pb-1 border-b border-border text-[11px] text-text-secondary uppercase">
            <span>DIURNAL POWER & IRRADIANCE TELEMETRY</span>
            <div className="flex items-center space-x-3 text-[10px]">
              <span className="text-text-secondary">
                <span className="text-text-secondary">---</span> EXPECTED (kW)
              </span>
              <span className="text-active-green">
                <span>—</span> ACTUAL (kW)
              </span>
              <span className="text-warning-amber">
                <span>—</span> POA (W/m²)
              </span>
            </div>
          </div>
          <div className="flex-1 w-full h-full pt-2">
            <TelemetryChart data={diagnosticData} />
          </div>
        </section>

        {/* RIGHT COLUMN: DIAGNOSTIC FEED (35% WIDTH) */}
        <section className="w-full lg:w-[35%] h-full flex flex-col bg-surface overflow-hidden">
          <DiagnosticFeed events={diagnosticData} />
        </section>
      </div>
    </main>
  );
}
