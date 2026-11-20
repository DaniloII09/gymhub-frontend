"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AccessDenied } from "@/src/components/access-denied";
import { fetchOccupancyReport } from "@/src/services/reports/reports-service";
import type { OccupancyReport as OccupancyReportData } from "@/src/types/reports";
import {
  defaultRange,
  presetRange,
  validateRange,
  type DateRange,
  type RangePreset,
} from "./income-report-logic";
import { OccupancyReportView } from "./occupancy-report-view";

/** Ocupación de las clases de un periodo para el Administrador (H28 · FE-28.1). */
export function OccupancyReport() {
  const [range, setRange] = useState<DateRange>(() => defaultRange());
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null);
  const [report, setReport] = useState<OccupancyReportData | null>(null);
  const [denied, setDenied] = useState(false);
  // Solo cuenta la respuesta de la última consulta: si el usuario cambia el
  // rango antes de que llegue la anterior, esa se descarta.
  const requestId = useRef(0);
  const lastQueried = useRef<DateRange>(range);

  const load = useCallback(async (next: DateRange) => {
    const id = ++requestId.current;
    lastQueried.current = next;
    setLoading(true);
    setLoadError(null);
    const result = await fetchOccupancyReport(next.from, next.to);
    if (id !== requestId.current) return;
    setLoading(false);
    if (result.ok) {
      setReport(result.data);
      setEmptyMessage(null);
      return;
    }
    if (result.status === 403) {
      setDenied(true);
      return;
    }
    // Rango sin clases: no se genera el reporte y se muestra el motivo.
    if (result.status === 404) {
      setReport(null);
      setEmptyMessage(result.error);
      return;
    }
    // Un 400 es un problema del rango: va bajo las fechas y se deja el reporte anterior.
    if (result.status === 400) setRangeError(result.error);
    else setLoadError(result.error);
  }, []);

  useEffect(() => {
    void load(lastQueried.current);
  }, [load]);

  function query(next: DateRange) {
    const error = validateRange(next);
    setRangeError(error);
    if (!error) void load(next);
  }

  function handleChangeRange(field: keyof DateRange, value: string) {
    setRange((prev) => ({ ...prev, [field]: value }));
    setRangeError(null);
  }

  function handlePreset(preset: RangePreset) {
    const next = presetRange(preset);
    setRange(next);
    query(next);
  }

  if (denied) return <AccessDenied />;

  return (
    <OccupancyReportView
      range={range}
      rangeError={rangeError}
      loading={loading}
      loadError={loadError}
      emptyMessage={emptyMessage}
      report={report}
      onChangeRange={handleChangeRange}
      onPreset={handlePreset}
      onSubmit={() => query(range)}
      onRetry={() => void load(lastQueried.current)}
    />
  );
}
