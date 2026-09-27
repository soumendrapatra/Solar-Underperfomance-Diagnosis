"use client";

import React, { useMemo, useState } from "react";
import { DiagnosticEvent } from "../lib/diagnosticEngine";

interface DiagnosticFeedProps {
  events: DiagnosticEvent[];
}

export default function DiagnosticFeed({ events }: DiagnosticFeedProps) {
  const [filter, setFilter] = useState<"ALL" | "FAULTS_ONLY">("ALL");

  // Calculate summary metrics
  const summary = useMemo(() => {
    let totalEnergyLostKWh = 0;
    let totalRevenueImpactUSD = 0;
    let faultCount = 0;

    events.forEach((evt) => {
      const gapKW = Math.max(0, evt.expectedPower - evt.actualPower);
      const energyLostPointKWh = gapKW * (5 / 60); // 5-minute interval in hours
      totalEnergyLostKWh += energyLostPointKWh;
      totalRevenueImpactUSD += evt.financialLossUSD;

      if (evt.yieldGapPercent >= 5 && evt.rootCause !== "Nominal Operation") {
        faultCount++;
      }
    });

    return {
      totalEnergyLostKWh: totalEnergyLostKWh.toFixed(2),
      totalRevenueImpactUSD: totalRevenueImpactUSD.toFixed(2),
      faultCount,
    };
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (filter === "FAULTS_ONLY") {
      return events.filter(
        (e) => e.yieldGapPercent >= 5 && e.rootCause !== "Nominal Operation"
      );
    }
    return events;
  }, [events, filter]);

  return (
    <div className="w-full flex flex-col border border-border bg-surface font-mono text-xs">
      {/* SUMMARY HEADER STRIP */}
      <div className="p-3 bg-surface border-b border-border grid grid-cols-12 gap-3 items-center">
        <div className="col-span-12 md:col-span-8 flex items-center space-x-6">
          <div className="flex flex-col">
            <span className="text-[10px] text-text-secondary uppercase tracking-wider font-sans">
              TOTAL ENERGY LOST (kWh)
            </span>
            <span className="text-base font-bold text-fault-red">
              {summary.totalEnergyLostKWh}{" "}
              <span className="text-xs text-text-secondary font-normal">kWh</span>
            </span>
          </div>

          <div className="h-7 w-[1px] bg-border" />

          <div className="flex flex-col">
            <span className="text-[10px] text-text-secondary uppercase tracking-wider font-sans">
              TOTAL REVENUE IMPACT (USD)
            </span>
            <span className="text-base font-bold text-warning-amber">
              ${summary.totalRevenueImpactUSD}{" "}
              <span className="text-xs text-text-secondary font-normal">USD</span>
            </span>
          </div>

          <div className="h-7 w-[1px] bg-border" />

          <div className="flex flex-col">
            <span className="text-[10px] text-text-secondary uppercase tracking-wider font-sans">
              ACTIVE FAULT INTERVALS
            </span>
            <span className="text-base font-bold text-text-primary">
              {summary.faultCount}{" "}
              <span className="text-xs text-text-secondary font-normal">/ {events.length}</span>
            </span>
          </div>
        </div>

        {/* FEED CONTROLS */}
        <div className="col-span-12 md:col-span-4 flex justify-end items-center space-x-2">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-2 py-1 text-[11px] border ${
              filter === "ALL"
                ? "bg-surface-highlight border-border-light text-text-primary font-bold"
                : "border-border text-text-secondary hover:text-text-primary"
            }`}
          >
            SHOW ALL ({events.length})
          </button>
          <button
            onClick={() => setFilter("FAULTS_ONLY")}
            className={`px-2 py-1 text-[11px] border ${
              filter === "FAULTS_ONLY"
                ? "bg-surface-highlight border-warning-amber text-warning-amber font-bold"
                : "border-border text-text-secondary hover:text-warning-amber"
            }`}
          >
            FAULTS ONLY ({summary.faultCount})
          </button>
        </div>
      </div>

      {/* DENSE TABULAR DIAGNOSTIC FEED */}
      <div className="overflow-x-auto overflow-y-auto max-h-[420px] relative">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-surface border-b border-border text-[11px] text-text-secondary uppercase tracking-wider">
            <tr>
              <th className="py-1.5 px-2.5 border-r border-border w-24">TIME</th>
              <th className="py-1.5 px-2.5 border-r border-border w-20 text-right">GAP %</th>
              <th className="py-1.5 px-2.5 border-r border-border w-52">ROOT CAUSE</th>
              <th className="py-1.5 px-2.5 border-r border-border">PRESCRIPTIVE ACTION</th>
              <th className="py-1.5 px-2.5 w-28 text-right">LOSS (USD)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredEvents.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-6 text-center text-text-secondary text-xs"
                >
                  NO DIAGNOSTIC ANOMALIES RECORDED
                </td>
              </tr>
            ) : (
              filteredEvents.map((evt, idx) => {
                const formattedTime = evt.timestamp.includes("T")
                  ? evt.timestamp.split("T")[1].slice(0, 5)
                  : evt.timestamp;

                // Highlighting rules based on yieldGapPercent
                let rowBgStyle: React.CSSProperties = {};
                let borderLeftClass = "border-l-2 border-l-transparent";
                let gapColorClass = "text-text-secondary";

                if (evt.yieldGapPercent > 15 && evt.rootCause !== "Nominal Operation") {
                  rowBgStyle = { backgroundColor: "rgba(255, 51, 51, 0.1)" };
                  borderLeftClass = "border-l-2 border-l-[#ff3333]";
                  gapColorClass = "text-fault-red font-bold";
                } else if (
                  evt.yieldGapPercent >= 5 &&
                  evt.yieldGapPercent <= 15 &&
                  evt.rootCause !== "Nominal Operation"
                ) {
                  rowBgStyle = { backgroundColor: "rgba(255, 176, 0, 0.1)" };
                  borderLeftClass = "border-l-2 border-l-[#ffb000]";
                  gapColorClass = "text-warning-amber font-bold";
                } else if (evt.rootCause === "Nominal Operation") {
                  gapColorClass = "text-active-green";
                }

                return (
                  <tr
                    key={`${evt.timestamp}-${idx}`}
                    style={rowBgStyle}
                    className={`h-[32px] text-[11px] ${borderLeftClass} hover:opacity-90 transition-none`}
                  >
                    {/* TIME */}
                    <td className="py-1 px-2.5 border-r border-border text-text-primary whitespace-nowrap">
                      {formattedTime} <span className="text-[9px] text-text-secondary">UTC</span>
                    </td>

                    {/* GAP % */}
                    <td className={`py-1 px-2.5 border-r border-border text-right whitespace-nowrap ${gapColorClass}`}>
                      {evt.yieldGapPercent > 0 ? `-${evt.yieldGapPercent.toFixed(1)}%` : "0.0%"}
                    </td>

                    {/* ROOT CAUSE */}
                    <td className="py-1 px-2.5 border-r border-border font-bold whitespace-nowrap">
                      {evt.rootCause === "Nominal Operation" ? (
                        <span className="text-text-secondary font-normal">
                          {evt.rootCause}
                        </span>
                      ) : evt.rootCause === "Grid Curtailment" ? (
                        <span className="text-text-primary">
                          {evt.rootCause}
                        </span>
                      ) : evt.rootCause === "Inverter Thermal Derating" ? (
                        <span className="text-fault-red">
                          {evt.rootCause}
                        </span>
                      ) : (
                        <span className="text-warning-amber">
                          {evt.rootCause}
                        </span>
                      )}
                    </td>

                    {/* PRESCRIPTIVE ACTION */}
                    <td className="py-1 px-2.5 border-r border-border text-text-primary truncate max-w-xs">
                      {evt.prescriptiveAction}
                    </td>

                    {/* FINANCIAL LOSS (USD) */}
                    <td className="py-1 px-2.5 text-right whitespace-nowrap">
                      {evt.financialLossUSD > 0 ? (
                        <span className="font-bold text-fault-red">
                          ${evt.financialLossUSD.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-text-secondary">$0.00</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
