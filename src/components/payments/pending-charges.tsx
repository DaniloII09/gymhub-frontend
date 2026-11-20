"use client";

import { useEffect, useState } from "react";
import { AccessDenied } from "@/src/components/access-denied";
import { fetchAllPendingCharges } from "@/src/services/payments/pending-charges-service";
import type { PendingChargesPage } from "@/src/types/payments";
import { totalPages } from "./my-payments-logic";
import {
  changePendingChargesFilter,
  changePendingChargesPage,
  INITIAL_PENDING_CHARGES_QUERY,
  type PendingChargeFilterState,
} from "./pending-charges-logic";
import { PendingChargesView } from "./pending-charges-view";

/** Tabla de pagos pendientes para el Administrador (H17 · FE-17.1). */
export function PendingCharges() {
  const [query, setQuery] = useState(INITIAL_PENDING_CHARGES_QUERY);
  const [result, setResult] = useState<PendingChargesPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchAllPendingCharges(query.page, query.type || undefined).then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (res.ok) {
        setResult(res.data);
        setError(null);
      } else if (res.status === 403) {
        setDenied(true);
      } else {
        setError(res.error);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [query.page, query.type, reloadKey]);

  function handleTypeChange(nextType: PendingChargeFilterState) {
    if (nextType === query.type && query.page === 1) return;
    setLoading(true);
    setError(null);
    setQuery((prev) => changePendingChargesFilter(prev, nextType));
  }

  function handlePageChange(nextPage: number) {
    const pages = result ? totalPages(result) : 1;
    const target = changePendingChargesPage(query, nextPage, pages);
    if (target.page === query.page) return;
    setLoading(true);
    setError(null);
    setQuery(target);
  }

  function handleRetry() {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  }

  if (denied) return <AccessDenied />;

  return (
    <PendingChargesView
      typeFilter={query.type}
      loading={loading}
      error={error}
      result={result}
      onTypeChange={handleTypeChange}
      onPageChange={handlePageChange}
      onRetry={handleRetry}
    />
  );
}
