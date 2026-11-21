"use client";

import { useEffect, useRef, useState } from "react";
import { AccessDenied } from "@/src/components/access-denied";
import { fetchRatingsReport } from "@/src/services/reports/reports-service";
import type { RatingsReport as RatingsReportData } from "@/src/types/reports";
import {
  defaultRange,
  presetRange,
  validateRange,
  type DateRange,
  type RangePreset,
} from "./income-report-logic";
import type { RatingsTab } from "./ratings-report-logic";
import { RatingsReportView } from "./ratings-report-view";

/** Reporte de promedios de calificación para Administrador (H23 · FE-23.1). */
export function RatingsReport() {
  const [tab, setTab] = useState<RatingsTab>("trainer");
  const [range, setRange] = useState<DateRange>(() => defaultRange());
  const [queriedRange, setQueriedRange] = useState<DateRange>(() => range);
  const [reloadKey, setReloadKey] = useState(0);

  const [rangeError, setRangeError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [report, setReport] = useState<RatingsReportData | null>(null);
  const [denied, setDenied] = useState(false);

  const requestIdRef = useRef(0);

  useEffect(() => {
    const id = ++requestIdRef.current;
    let cancelled = false;
    fetchRatingsReport(queriedRange.from, queriedRange.to).then((result) => {
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
    <RatingsReportView
      tab={tab}
      range={range}
      rangeError={rangeError}
      loading={loading}
      loadError={loadError}
      report={report}
      onChangeTab={setTab}
      onChangeRange={handleChangeRange}
      onPreset={handlePreset}
      onSubmit={() => query(range)}
      onRetry={handleRetry}
    />
  );
}
