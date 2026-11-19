"use client";

import { useCallback, useState } from "react";
import { saveFile } from "@/src/lib/download-file";
import { downloadReceiptPdf } from "@/src/services/payments/payments-service";
import type { ReceiptView } from "@/src/types/payments";

/** Estado de "Descargar PDF" de un comprobante (FE-15.2, FE-16.2). */
export function useReceiptDownload() {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = useCallback(async (receipt: ReceiptView) => {
    setDownloading(true);
    setError(null);
    const result = await downloadReceiptPdf(receipt.receiptId, receipt.receiptNumber);
    setDownloading(false);
    if (result.ok) saveFile(result.data.blob, result.data.filename);
    else setError(result.error);
  }, []);

  const reset = useCallback(() => setError(null), []);

  return { downloading, error, download, reset };
}
