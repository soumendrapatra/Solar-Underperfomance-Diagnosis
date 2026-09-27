"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { DiagnosticEvent } from "../lib/diagnosticEngine";

interface TelemetryChartProps {
  data: DiagnosticEvent[];
}

interface CustomTooltipPayloadItem {
  value: number;
  name: string;
  color: string;
  dataKey: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: CustomTooltipPayloadItem[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const formattedTime = label
      ? label.includes("T")
        ? label.split("T")[1].slice(0, 5)
        : label
      : "";

    return (
      <div className="bg-[#111111] border border-[#222222] p-2 text-[11px] font-mono shadow-none rounded-none text-text-primary">
        <div className="text-text-secondary border-b border-[#222222] pb-1 mb-1 font-bold">
          TIME: {formattedTime} UTC
        </div>
        {payload.map((entry, index) => {
          let labelText = entry.name;
          let unit = "kW";

          if (entry.dataKey === "expectedPower") {
            labelText = "P_EXP";
            unit = "kW";
          } else if (entry.dataKey === "actualPower") {
            labelText = "P_ACT";
            unit = "kW";
          } else if (entry.dataKey === "poaIrradiance") {
            labelText = "POA";
            unit = "W/m²";
          }

          return (
            <div
              key={`tooltip-${index}`}
              className="flex items-center justify-between space-x-3 py-0.5"
            >
              <div className="flex items-center space-x-1.5">
                <span
                  className="inline-block w-1.5 h-1.5"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-text-secondary">{labelText}:</span>
              </div>
              <span className="font-bold text-text-primary" style={{ color: entry.color }}>
                {Number(entry.value).toFixed(1)} {unit}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

export default function TelemetryChart({ data }: TelemetryChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const chartData = useMemo(() => {
    return data.map((d) => ({
      timestamp: d.timestamp,
      timeFormatted: d.timestamp.includes("T")
        ? d.timestamp.split("T")[1].slice(0, 5)
        : d.timestamp,
      expectedPower: d.expectedPower,
      actualPower: d.actualPower,
      poaIrradiance: d.poaIrradiance ?? 0,
      rootCause: d.rootCause,
    }));
  }, [data]);

  if (!isMounted) {
    return (
      <div className="w-full h-full min-h-[300px] flex items-center justify-center text-text-secondary font-mono text-xs">
        INITIALIZING TELEMETRY STREAM...
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[300px] relative font-mono">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid
            stroke="#222222"
            strokeDasharray="2 2"
            vertical={true}
            horizontal={true}
          />

          {/* X Axis: Time in HH:mm */}
          <XAxis
            dataKey="timestamp"
            tickFormatter={(val: string) => {
              if (val.includes("T")) {
                return val.split("T")[1].slice(0, 5);
              }
              return val;
            }}
            stroke="#222222"
            tick={{
              fill: "#888888",
              fontSize: 10,
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
            }}
            tickLine={{ stroke: "#222222" }}
            minTickGap={25}
          />

          {/* Left Y Axis: Power (kW) */}
          <YAxis
            yAxisId="left"
            orientation="left"
            stroke="#222222"
            domain={[0, "auto"]}
            tick={{
              fill: "#888888",
              fontSize: 10,
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
            }}
            tickLine={{ stroke: "#222222" }}
            tickFormatter={(val: number) => `${Math.round(val)}kW`}
          />

          {/* Right Y Axis: Irradiance (W/m²) */}
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#222222"
            domain={[0, 1100]}
            tick={{
              fill: "#888888",
              fontSize: 10,
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
            }}
            tickLine={{ stroke: "#222222" }}
            tickFormatter={(val: number) => `${Math.round(val)}W`}
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: "#444444", strokeWidth: 1, strokeDasharray: "2 2" }}
          />

          {/* Expected Power: Dashed Gray Line */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="expectedPower"
            name="Expected Power"
            stroke="#555555"
            strokeWidth={1.5}
            strokeDasharray="3 3"
            dot={false}
            isAnimationActive={false}
          />

          {/* Actual Power: Solid Green Line */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="actualPower"
            name="Actual Power"
            stroke="#00ff41"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />

          {/* POA Irradiance: Solid Amber Line */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="poaIrradiance"
            name="POA Irradiance"
            stroke="#ffb000"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
