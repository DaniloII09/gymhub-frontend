"use client";

import { useEffect, useRef, useState } from "react";
import { AccessDenied } from "@/src/components/access-denied";
import { fetchRenewalRateReport } from "@/src/services/reports/reports-service";
import type { RenewalRateReport as RenewalRateReportData } from "@/src/types/reports";
import {
  defaultRange,
  presetRange,
  validateRange,
  type DateRange,
  type RangePreset,
} from "./income-report-logic";
import { RenewalRateReportView } from "./renewal-rate-report-view";

/** Reporte de tasa de renovación de membresías para Administrador (H30 · FE-30.1). */
export function RenewalRateReport() {
  const [range, setRange] = useState<DateRange>(() => defaultRange());
  const [queriedRange, setQueriedRange] = useState<DateRange>(() => range);
  const [reloadKey, setReloadKey] = useState(0);

  const [rangeError, setRangeError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [report, setReport] = useState<RenewalRateReportData | null>(null);
  const [denied, setDenied] = useState(false);

  const requestIdRef = useRef(0);

  useEffect(() => {
    const id = ++requestIdRef.current;
    let cancelled = false;
    fetchRenewalRateReport(queriedRange.from, queriedRange.to).then((result) => {
      if (cancelled || id !== requestIdRef.current) return;
      setLoading(false);
      if (result.ok) {
        setReport(result.data);
        setLoadError(null);
        return;
      }
      if (result.status === 403) {
        setDenied(true);
        return;
      }
      if (result.status === 400) {
        setRangeError(result.error);
      } else {
        setLoadError(result.error);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [queriedRange, reloadKey]);

  function query(next: DateRange) {
    const error = validateRange(next);
    setRangeError(error);
    if (!error) {
      setLoading(true);
      setLoadError(null);
      setQueriedRange(next);
      setReloadKey((k) => k + 1);
    }
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

  function handleRetry() {
    setLoading(true);
    setLoadError(null);
    setReloadKey((k) => k + 1);
  }

  if (denied) return <AccessDenied />;

  return (
    <RenewalRateReportView
      range={range}
      rangeError={rangeError}
      loading={loading}
      loadError={loadError}
      report={report}
      onChangeRange={handleChangeRange}
      onPreset={handlePreset}
      onSubmit={() => query(range)}
      onRetry={handleRetry}
    />
  );
}
