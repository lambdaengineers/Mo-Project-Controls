"use client";

import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { supabase } from "../lib/supabase";

type CalcType = "percent" | "multiply" | "fixed";

type ManualInvoiceItem = {
  description: string;
  total: string;
  value: string;
  calcType: CalcType;
  valueLabel: string;
};

type ProgressItem = {
  description: string;
  unit: string;
  total: string;
  previousPercent: string;
  currentPercent: string;
};

type SavedInvoice = {
  id: string;
  created_at: string;
  project_name: string | null;
  client_name: string | null;
  client_address: string | null;
  client_number: string | null;
  project_number: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  hst_rate: number | null;
  company_name: string | null;
  company_address: string | null;
  company_phone: string | null;
  third_column_header: string | null;
  root_invoice_number: string | null;
  revision_number: number | null;
  parent_invoice_id: string | null;
  line_items: any;
  subtotal: number | null;
  hst_amount: number | null;
  total_with_tax: number | null;
};

type InvoiceDisplayItem = {
  source: "progress" | "manual";
  description: string;
  totalNumber: number;
  thirdColumnDisplay: string;
  amountNumber: number;
};

const EMPTY_MANUAL_ITEM: ManualInvoiceItem = {
  description: "",
  total: "",
  value: "",
  calcType: "percent",
  valueLabel: "% of total",
};

const EMPTY_PROGRESS_ITEM: ProgressItem = {
  description: "",
  unit: "LS",
  total: "",
  previousPercent: "0",
  currentPercent: "0",
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<"invoice" | "progress">("invoice");

  const [projectName, setProjectName] = useState("Riverbend Estates subdivision");
  const [clientName, setClientName] = useState("ZHR Inc.");
  const [clientAddress, setClientAddress] = useState(
    "Engineering | Construction | Project Management\n79 Eleanor Circle, Richmond Hill, Ontario\nCanada L4C 6K6"
  );
  const [clientNumber, setClientNumber] = useState("301");
  const [projectNumber, setProjectNumber] = useState("0301");
  const [invoiceNumber, setInvoiceNumber] = useState("0301-001");
  const [invoiceDate, setInvoiceDate] = useState("3-25-2026");
  const [hstRate, setHstRate] = useState("13");

  const [companyName, setCompanyName] = useState("LAMBDA ENGINEERING INC.");
  const [companyAddress, setCompanyAddress] = useState(
    "31580 Lakeridge Rd,\nPefferlaw, Ontario,\nL0E 1E0"
  );
  const [companyPhone, setCompanyPhone] = useState("6474684321");

  const [thirdColumnHeader, setThirdColumnHeader] = useState("% of total");

  const [manualInvoiceItems, setManualInvoiceItems] = useState<ManualInvoiceItem[]>([
    {
      description: "General engineering coordination",
      total: "120",
      value: "8",
      calcType: "multiply",
      valueLabel: "Hours",
    },
  ]);

  const [progressItems, setProgressItems] = useState<ProgressItem[]>([
    {
      description: "Storm management",
      unit: "LS",
      total: "28000",
      previousPercent: "0",
      currentPercent: "25",
    },
    {
      description: "Road Design",
      unit: "LS",
      total: "18000",
      previousPercent: "0",
      currentPercent: "0",
    },
    {
      description: "Site Grading",
      unit: "LS",
      total: "12000",
      previousPercent: "0",
      currentPercent: "0",
    },
    {
      description: "Traffic Impact assessment",
      unit: "LS",
      total: "4500",
      previousPercent: "0",
      currentPercent: "0",
    },
    {
      description: "Site Servicing",
      unit: "LS",
      total: "0",
      previousPercent: "0",
      currentPercent: "0",
    },
  ]);

  const [saveMessage, setSaveMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [savedInvoices, setSavedInvoices] = useState<SavedInvoice[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [loadMessage, setLoadMessage] = useState("");

  const [loadedInvoiceId, setLoadedInvoiceId] = useState<string | null>(null);
  const [loadedRootInvoiceNumber, setLoadedRootInvoiceNumber] = useState<string | null>(null);
  const [loadedRevisionNumber, setLoadedRevisionNumber] = useState<number>(0);

  const money = (value: number) =>
    value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const percent = (value: number) =>
    value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const parseNumber = (value: string) => {
    const cleaned = String(value ?? "").replace(/,/g, "").trim();
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : 0;
  };

  const handleManualItemChange = (
    index: number,
    field: keyof ManualInvoiceItem,
    value: string
  ) => {
    const updated = [...manualInvoiceItems];
    updated[index][field] = value as never;
    setManualInvoiceItems(updated);
  };

  const addManualInvoiceItem = () => {
    setManualInvoiceItems((prev) => [...prev, { ...EMPTY_MANUAL_ITEM }]);
  };

  const deleteManualInvoiceItem = (index: number) => {
    const updated = manualInvoiceItems.filter((_, i) => i !== index);
    setManualInvoiceItems(updated.length ? updated : [{ ...EMPTY_MANUAL_ITEM }]);
  };

  const handleProgressItemChange = (
    index: number,
    field: keyof ProgressItem,
    value: string
  ) => {
    const updated = [...progressItems];
    updated[index][field] = value as never;
    setProgressItems(updated);
  };

  const addProgressItem = () => {
    setProgressItems((prev) => [...prev, { ...EMPTY_PROGRESS_ITEM }]);
  };

  const deleteProgressItem = (index: number) => {
    const updated = progressItems.filter((_, i) => i !== index);
    setProgressItems(updated.length ? updated : [{ ...EMPTY_PROGRESS_ITEM }]);
  };

  const calculatedManualItems = useMemo(() => {
    return manualInvoiceItems.map((item) => {
      const totalNumber = parseNumber(item.total);
      const valueNumber = parseNumber(item.value);

      let amountNumber = 0;
      let thirdColumnDisplay = "";

      if (item.calcType === "percent") {
        amountNumber = totalNumber * (valueNumber / 100);
        thirdColumnDisplay = `${percent(valueNumber)}%`;
      } else if (item.calcType === "multiply") {
        amountNumber = totalNumber * valueNumber;
        thirdColumnDisplay = `${valueNumber} ${item.valueLabel || ""}`.trim();
      } else {
        amountNumber = valueNumber;
        thirdColumnDisplay = item.valueLabel || "Fixed";
      }

      return {
        ...item,
        totalNumber,
        valueNumber,
        amountNumber,
        thirdColumnDisplay,
      };
    });
  }, [manualInvoiceItems]);

  const calculatedProgressItems = useMemo(() => {
    return progressItems.map((item) => {
      const totalNumber = parseNumber(item.total);
      const previousPercentNumber = Math.max(
        0,
        Math.min(100, parseNumber(item.previousPercent))
      );
      const currentPercentNumber = Math.max(
        0,
        Math.min(100, parseNumber(item.currentPercent))
      );

      const previousAmount = totalNumber * (previousPercentNumber / 100);
      const currentAmount = totalNumber * (currentPercentNumber / 100);
      const billedToDate = previousAmount + currentAmount;
      const percentRemaining = Math.max(
        0,
        100 - previousPercentNumber - currentPercentNumber
      );
      const balanceToFinish = Math.max(0, totalNumber - billedToDate);

      return {
        ...item,
        totalNumber,
        previousPercentNumber,
        currentPercentNumber,
        previousAmount,
        currentAmount,
        billedToDate,
        percentRemaining,
        balanceToFinish,
      };
    });
  }, [progressItems]);

  const importedProgressInvoiceItems = useMemo<InvoiceDisplayItem[]>(() => {
    return calculatedProgressItems
      .filter((item) => item.currentAmount > 0)
      .map((item) => ({
        source: "progress",
        description: item.description,
        totalNumber: item.totalNumber,
        thirdColumnDisplay: `${percent(item.currentPercentNumber)}%`,
        amountNumber: item.currentAmount,
      }));
  }, [calculatedProgressItems]);

  const filteredManualInvoiceItems = useMemo<InvoiceDisplayItem[]>(() => {
    return calculatedManualItems
      .filter((item) => item.amountNumber > 0)
      .map((item) => ({
        source: "manual",
        description: item.description,
        totalNumber: item.totalNumber,
        thirdColumnDisplay:
          item.calcType === "percent"
            ? `${percent(item.valueNumber)}%`
            : item.calcType === "multiply"
            ? `${item.valueNumber} ${item.valueLabel || ""}`.trim()
            : item.valueLabel || "Fixed",
        amountNumber: item.amountNumber,
      }));
  }, [calculatedManualItems]);

  const invoiceDisplayItems = useMemo<InvoiceDisplayItem[]>(() => {
    return [...importedProgressInvoiceItems, ...filteredManualInvoiceItems];
  }, [importedProgressInvoiceItems, filteredManualInvoiceItems]);

  const subtotal = useMemo(() => {
    return invoiceDisplayItems.reduce((sum, item) => sum + item.amountNumber, 0);
  }, [invoiceDisplayItems]);

  const hstAmount = useMemo(() => {
    return subtotal * (parseNumber(hstRate) / 100);
  }, [subtotal, hstRate]);

  const totalWithTax = useMemo(() => {
    return subtotal + hstAmount;
  }, [subtotal, hstAmount]);

  const progressTotalContract = useMemo(() => {
    return calculatedProgressItems.reduce((sum, item) => sum + item.totalNumber, 0);
  }, [calculatedProgressItems]);

  const progressTotalPrevious = useMemo(() => {
    return calculatedProgressItems.reduce((sum, item) => sum + item.previousAmount, 0);
  }, [calculatedProgressItems]);

  const progressTotalCurrent = useMemo(() => {
    return calculatedProgressItems.reduce((sum, item) => sum + item.currentAmount, 0);
  }, [calculatedProgressItems]);

  const progressTotalBilledToDate = useMemo(() => {
    return calculatedProgressItems.reduce((sum, item) => sum + item.billedToDate, 0);
  }, [calculatedProgressItems]);

  const progressTotalBalance = useMemo(() => {
    return calculatedProgressItems.reduce((sum, item) => sum + item.balanceToFinish, 0);
  }, [calculatedProgressItems]);

  const clearLoadedInvoiceContext = () => {
    setLoadedInvoiceId(null);
    setLoadedRootInvoiceNumber(null);
    setLoadedRevisionNumber(0);
  };

  const loadSavedInvoices = async () => {
    try {
      setIsLoadingInvoices(true);
      setLoadMessage("");

      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Load invoices failed:", error);
        setLoadMessage("Failed to load saved invoices.");
        return;
      }

      setSavedInvoices(data || []);
    } catch (error) {
      console.error("Unexpected load error:", error);
      setLoadMessage("Unexpected error while loading invoices.");
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  useEffect(() => {
    loadSavedInvoices();
  }, []);

  const loadInvoiceIntoForm = (invoice: SavedInvoice) => {
    setProjectName(invoice.project_name || "");
    setClientName(invoice.client_name || "");
    setClientAddress(invoice.client_address || "");
    setClientNumber(invoice.client_number || "");
    setProjectNumber(invoice.project_number || "");
    setInvoiceNumber(invoice.root_invoice_number || invoice.invoice_number || "");
    setInvoiceDate(invoice.invoice_date || "");
    setHstRate(String(invoice.hst_rate ?? 13));
    setCompanyName(invoice.company_name || "");
    setCompanyAddress(invoice.company_address || "");
    setCompanyPhone(invoice.company_phone || "");
    setThirdColumnHeader(invoice.third_column_header || "% of total");

    setLoadedInvoiceId(invoice.id || null);
    setLoadedRootInvoiceNumber(invoice.root_invoice_number || invoice.invoice_number || null);
    setLoadedRevisionNumber(invoice.revision_number || 0);

    const raw = invoice.line_items;

    if (raw && !Array.isArray(raw) && typeof raw === "object" && raw.version === 2) {
      const loadedManual =
        Array.isArray(raw.manualInvoiceItems) && raw.manualInvoiceItems.length
          ? raw.manualInvoiceItems.map((item: any) => ({
              description: item.description || "",
              total: String(item.total ?? ""),
              value: String(item.value ?? ""),
              calcType:
                item.calcType === "multiply"
                  ? "multiply"
                  : item.calcType === "fixed"
                  ? "fixed"
                  : "percent",
              valueLabel:
                item.valueLabel ||
                (item.calcType === "multiply"
                  ? "Hours"
                  : item.calcType === "fixed"
                  ? "Amount"
                  : invoice.third_column_header || "% of total"),
            }))
          : [{ ...EMPTY_MANUAL_ITEM }];

      const loadedProgress =
        Array.isArray(raw.progressItems) && raw.progressItems.length
          ? raw.progressItems.map((item: any) => ({
              description: item.description || "",
              unit: item.unit || "LS",
              total: String(item.total ?? ""),
              previousPercent: String(item.previousPercent ?? "0"),
              currentPercent: String(item.currentPercent ?? "0"),
            }))
          : [{ ...EMPTY_PROGRESS_ITEM }];

      setManualInvoiceItems(loadedManual);
      setProgressItems(loadedProgress);
      setLoadMessage(`Loaded invoice ${invoice.invoice_number || ""}.`);
      return;
    }

    if (Array.isArray(raw)) {
      const oldManual = raw.length
        ? raw.map((item: any) => ({
            description: item.description || "",
            total: String(item.total ?? ""),
            value: String(item.value ?? item.percent ?? ""),
            calcType:
              item.calcType === "multiply"
                ? "multiply"
                : item.calcType === "fixed"
                ? "fixed"
                : "percent",
            valueLabel:
              item.valueLabel ||
              item.label ||
              invoice.third_column_header ||
              "% of total",
          }))
        : [{ ...EMPTY_MANUAL_ITEM }];

      setManualInvoiceItems(oldManual);
      setProgressItems([{ ...EMPTY_PROGRESS_ITEM }]);
      setLoadMessage(`Loaded old-format invoice ${invoice.invoice_number || ""}.`);
      return;
    }

    setManualInvoiceItems([{ ...EMPTY_MANUAL_ITEM }]);
    setProgressItems([{ ...EMPTY_PROGRESS_ITEM }]);
    setLoadMessage(`Loaded invoice ${invoice.invoice_number || ""}.`);
  };

  const saveInvoice = async (mode: "new" | "revision") => {
    try {
      setIsSaving(true);
      setSaveMessage("");

      let rootInvoiceNumber = invoiceNumber;
      let revisionNumber = 0;
      let parentInvoiceId: string | null = null;
      let finalInvoiceNumber = invoiceNumber;

      if (mode === "revision" && loadedInvoiceId) {
        rootInvoiceNumber = loadedRootInvoiceNumber || invoiceNumber;
        revisionNumber = (loadedRevisionNumber || 0) + 1;
        parentInvoiceId = loadedInvoiceId;
        finalInvoiceNumber = `${rootInvoiceNumber} Rev ${revisionNumber}`;
      }

      if (mode === "new") {
        rootInvoiceNumber = invoiceNumber;
        revisionNumber = 0;
        parentInvoiceId = null;
        finalInvoiceNumber = invoiceNumber;
      }

      const payload = {
        project_name: projectName,
        client_name: clientName,
        client_address: clientAddress,
        client_number: clientNumber,
        project_number: projectNumber,
        invoice_number: finalInvoiceNumber,
        invoice_date: invoiceDate,
        hst_rate: parseNumber(hstRate),
        company_name: companyName,
        company_address: companyAddress,
        company_phone: companyPhone,
        third_column_header: thirdColumnHeader,
        root_invoice_number: rootInvoiceNumber,
        revision_number: revisionNumber,
        parent_invoice_id: parentInvoiceId,
        line_items: {
          version: 2,
          manualInvoiceItems: calculatedManualItems.map((item) => ({
            description: item.description,
            total: item.totalNumber,
            value: item.valueNumber,
            calcType: item.calcType,
            valueLabel: item.valueLabel,
            amount: item.amountNumber,
          })),
          progressItems: calculatedProgressItems.map((item) => ({
            description: item.description,
            unit: item.unit,
            total: item.totalNumber,
            previousPercent: item.previousPercentNumber,
            previousAmount: item.previousAmount,
            currentPercent: item.currentPercentNumber,
            currentAmount: item.currentAmount,
            billedToDate: item.billedToDate,
            percentRemaining: item.percentRemaining,
            balanceToFinish: item.balanceToFinish,
          })),
        },
        subtotal,
        hst_amount: hstAmount,
        total_with_tax: totalWithTax,
      };

      const { error } = await supabase.from("invoices").insert([payload]);

      if (error) {
        console.error("Save failed:", error);
        setSaveMessage("Save failed.");
        return;
      }

      setSaveMessage(
        mode === "revision"
          ? "Revision saved successfully."
          : "Invoice saved successfully."
      );

      if (mode === "new") {
        clearLoadedInvoiceContext();
      } else {
        setLoadedRevisionNumber(revisionNumber);
        setLoadedRootInvoiceNumber(rootInvoiceNumber);
      }

      await loadSavedInvoices();
    } catch (error) {
      console.error("Unexpected save error:", error);
      setSaveMessage("Unexpected error while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const addSectionToPdf = async (
    pdf: jsPDF,
    elementId: string,
    startOnNewPage = true
  ) => {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element not found: ${elementId}`);
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      scrollY: -window.scrollY,
    });

    const imgData = canvas.toDataURL("image/png");
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 8;
    const usableWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * usableWidth) / canvas.width;

    if (startOnNewPage) {
      pdf.addPage();
    }

    if (imgHeight <= pageHeight - margin * 2) {
      pdf.addImage(imgData, "PNG", margin, margin, usableWidth, imgHeight);
      return;
    }

    let heightLeft = imgHeight;
    let position = margin;

    pdf.addImage(imgData, "PNG", margin, position, usableWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2;

    while (heightLeft > 0) {
      pdf.addPage();
      position = margin - (imgHeight - heightLeft);
      pdf.addImage(imgData, "PNG", margin, position, usableWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;
    }
  };

  const downloadInvoicePDF = async () => {
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      await addSectionToPdf(pdf, "invoiceDocument", false);
      pdf.save(`Invoice-${invoiceNumber}.pdf`);
    } catch (error) {
      console.error("Invoice PDF generation failed:", error);
      alert("Invoice PDF generation failed.");
    }
  };

  const downloadProgressPDF = async () => {
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      await addSectionToPdf(pdf, "progressDocument", false);
      pdf.save(`Progress-Billing-${invoiceNumber}.pdf`);
    } catch (error) {
      console.error("Progress billing PDF generation failed:", error);
      alert("Progress billing PDF generation failed.");
    }
  };

  const downloadCombinedPDF = async () => {
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      await addSectionToPdf(pdf, "invoiceDocument", false);
      await addSectionToPdf(pdf, "progressDocument", true);
      pdf.save(`Invoice-and-Progress-Billing-${invoiceNumber}.pdf`);
    } catch (error) {
      console.error("Combined PDF generation failed:", error);
      alert("Combined PDF generation failed.");
    }
  };

  const currentDisplayInvoiceNumber =
    loadedInvoiceId && loadedRevisionNumber > 0
      ? `${invoiceNumber} Rev ${loadedRevisionNumber}`
      : invoiceNumber;

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto grid max-w-[2200px] gap-6 lg:grid-cols-[320px_460px_1fr]">
        <section className="rounded-2xl border border-gray-300 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Saved Invoices</h2>
              <p className="text-sm text-gray-600">Load previous invoices</p>
            </div>
            <button
              onClick={loadSavedInvoices}
              className="rounded bg-gray-800 px-3 py-2 text-sm font-semibold text-white"
            >
              Refresh
            </button>
          </div>

          {isLoadingInvoices && (
            <p className="mb-3 text-sm text-gray-600">Loading invoices...</p>
          )}

          {loadMessage && (
            <p className="mb-3 text-sm font-medium text-gray-700">{loadMessage}</p>
          )}

          <div className="max-h-[780px] space-y-3 overflow-y-auto pr-1">
            {savedInvoices.length === 0 ? (
              <div className="rounded border border-dashed border-gray-300 p-4 text-sm text-gray-500">
                No saved invoices yet.
              </div>
            ) : (
              savedInvoices.map((invoice) => (
                <div key={invoice.id} className="rounded-lg border border-gray-300 p-3">
                  <div className="font-semibold">
                    {invoice.invoice_number || "No invoice #"}
                  </div>
                  <div className="text-sm text-gray-700">
                    {invoice.client_name || "No client"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {invoice.invoice_date || ""}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Root: {invoice.root_invoice_number || invoice.invoice_number || "-"}
                  </div>
                  <div className="text-xs text-gray-500">
                    Revision: {invoice.revision_number ?? 0}
                  </div>
                  <button
                    onClick={() => loadInvoiceIntoForm(invoice)}
                    className="mt-3 rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
                  >
                    Load
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-300 bg-white p-5 shadow-sm">
          <h1 className="mb-2 text-2xl font-bold">Mo Project Controls</h1>
          <p className="mb-5 text-sm text-gray-600">
            Flexible Invoice + Monthly Progress Billing
          </p>

          <div className="grid gap-3">
            <input
              className="rounded border border-gray-400 p-3"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Project Name"
            />

            <input
              className="rounded border border-gray-400 p-3"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Client Name"
            />

            <textarea
              className="min-h-[110px] rounded border border-gray-400 p-3"
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
              placeholder="Client address/details"
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                className="rounded border border-gray-400 p-3"
                value={clientNumber}
                onChange={(e) => setClientNumber(e.target.value)}
                placeholder="Client #"
              />
              <input
                className="rounded border border-gray-400 p-3"
                value={projectNumber}
                onChange={(e) => setProjectNumber(e.target.value)}
                placeholder="Project #"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                className="rounded border border-gray-400 p-3"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Invoice #"
              />
              <input
                className="rounded border border-gray-400 p-3"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                placeholder="Invoice Date"
              />
            </div>

            <input
              className="rounded border border-gray-400 p-3"
              value={hstRate}
              onChange={(e) => setHstRate(e.target.value)}
              placeholder="HST %"
            />

            <input
              className="rounded border border-gray-400 p-3"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Company Name"
            />

            <textarea
              className="min-h-[90px] rounded border border-gray-400 p-3"
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              placeholder="Company Address"
            />

            <input
              className="rounded border border-gray-400 p-3"
              value={companyPhone}
              onChange={(e) => setCompanyPhone(e.target.value)}
              placeholder="Company Phone"
            />

            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("invoice")}
                className={`rounded px-4 py-2 text-sm font-semibold ${
                  activeTab === "invoice"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                Invoice Tab
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("progress")}
                className={`rounded px-4 py-2 text-sm font-semibold ${
                  activeTab === "progress"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                Progress Billing Tab
              </button>
            </div>

            {activeTab === "invoice" && (
              <>
                <input
                  className="rounded border border-gray-400 p-3"
                  value={thirdColumnHeader}
                  onChange={(e) => setThirdColumnHeader(e.target.value)}
                  placeholder="Third column header (e.g. % of total, Hours)"
                />

                <div className="rounded border border-green-300 bg-green-50 p-3 text-sm">
                  <div className="font-semibold text-green-800">
                    Imported from Progress Billing this month
                  </div>
                  <div className="mt-1 text-green-700">
                    Only progress items with amount this billing period will appear on the
                    invoice.
                  </div>
                  <div className="mt-2 space-y-1">
                    {importedProgressInvoiceItems.length === 0 ? (
                      <div className="text-gray-600">No progress items billed this month.</div>
                    ) : (
                      importedProgressInvoiceItems.map((item, index) => (
                        <div
                          key={`imported-${index}`}
                          className="flex items-center justify-between rounded border border-green-200 bg-white px-3 py-2"
                        >
                          <span>{item.description}</span>
                          <span className="font-semibold">${money(item.amountNumber)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <h2 className="mt-3 text-lg font-semibold">Manual Invoice Items</h2>

                {manualInvoiceItems.map((item, index) => (
                  <div key={index} className="rounded border border-gray-400 p-3">
                    <div className="mb-2 flex gap-2">
                      <input
                        className="w-full rounded border border-gray-400 p-2"
                        value={item.description}
                        onChange={(e) =>
                          handleManualItemChange(index, "description", e.target.value)
                        }
                        placeholder="Service description"
                      />
                      <button
                        type="button"
                        onClick={() => deleteManualInvoiceItem(index)}
                        className="rounded bg-red-600 px-3 py-2 text-sm font-semibold text-white"
                      >
                        Delete
                      </button>
                    </div>

                    <div className="mb-2 grid grid-cols-2 gap-2">
                      <input
                        className="rounded border border-gray-400 p-2"
                        value={item.total}
                        onChange={(e) =>
                          handleManualItemChange(index, "total", e.target.value)
                        }
                        placeholder="Total / rate / reference value"
                      />
                      <input
                        className="rounded border border-gray-400 p-2"
                        value={item.value}
                        onChange={(e) =>
                          handleManualItemChange(index, "value", e.target.value)
                        }
                        placeholder="Percent, hours, qty, or amount"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <select
                        className="rounded border border-gray-400 p-2"
                        value={item.calcType}
                        onChange={(e) =>
                          handleManualItemChange(
                            index,
                            "calcType",
                            e.target.value as CalcType
                          )
                        }
                      >
                        <option value="percent">Percent</option>
                        <option value="multiply">Multiply</option>
                        <option value="fixed">Fixed Amount</option>
                      </select>

                      <input
                        className="rounded border border-gray-400 p-2"
                        value={item.valueLabel}
                        onChange={(e) =>
                          handleManualItemChange(index, "valueLabel", e.target.value)
                        }
                        placeholder="Label e.g. % of total, Hours, Lump Sum"
                      />
                    </div>
                  </div>
                ))}

                <button
                  onClick={addManualInvoiceItem}
                  className="rounded bg-black px-4 py-3 font-semibold text-white"
                >
                  Add Manual Invoice Item
                </button>
              </>
            )}

            {activeTab === "progress" && (
              <>
                <h2 className="mt-3 text-lg font-semibold">Monthly Progress Billing Items</h2>

                {progressItems.map((item, index) => (
                  <div key={index} className="rounded border border-gray-400 p-3">
                    <div className="mb-2 flex gap-2">
                      <input
                        className="w-full rounded border border-gray-400 p-2"
                        value={item.description}
                        onChange={(e) =>
                          handleProgressItemChange(index, "description", e.target.value)
                        }
                        placeholder="Description of work"
                      />
                      <button
                        type="button"
                        onClick={() => deleteProgressItem(index)}
                        className="rounded bg-red-600 px-3 py-2 text-sm font-semibold text-white"
                      >
                        Delete
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                      <input
                        className="rounded border border-gray-400 p-2"
                        value={item.unit}
                        onChange={(e) =>
                          handleProgressItemChange(index, "unit", e.target.value)
                        }
                        placeholder="Unit"
                      />
                      <input
                        className="rounded border border-gray-400 p-2"
                        value={item.total}
                        onChange={(e) =>
                          handleProgressItemChange(index, "total", e.target.value)
                        }
                        placeholder="Total contract amount"
                      />
                      <input
                        className="rounded border border-gray-400 p-2"
                        value={item.previousPercent}
                        onChange={(e) =>
                          handleProgressItemChange(
                            index,
                            "previousPercent",
                            e.target.value
                          )
                        }
                        placeholder="Prev %"
                      />
                      <input
                        className="rounded border border-gray-400 p-2"
                        value={item.currentPercent}
                        onChange={(e) =>
                          handleProgressItemChange(index, "currentPercent", e.target.value)
                        }
                        placeholder="This invoice %"
                      />
                    </div>
                  </div>
                ))}

                <button
                  onClick={addProgressItem}
                  className="rounded bg-black px-4 py-3 font-semibold text-white"
                >
                  Add Progress Item
                </button>
              </>
            )}
          </div>
        </section>

        <div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <button
              onClick={() => saveInvoice("new")}
              disabled={isSaving}
              className="rounded bg-blue-600 px-4 py-3 font-semibold text-white disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save as New"}
            </button>

            <button
              onClick={() => saveInvoice("revision")}
              disabled={isSaving || !loadedInvoiceId}
              className="rounded bg-amber-600 px-4 py-3 font-semibold text-white disabled:opacity-60"
            >
              Save Revision
            </button>

            <button
              onClick={downloadInvoicePDF}
              className="rounded bg-green-600 px-4 py-3 font-semibold text-white"
            >
              Download Invoice
            </button>

            <button
              onClick={downloadProgressPDF}
              className="rounded bg-purple-600 px-4 py-3 font-semibold text-white"
            >
              Download Progress Billing
            </button>

            <button
              onClick={downloadCombinedPDF}
              className="rounded bg-gray-900 px-4 py-3 font-semibold text-white"
            >
              Download Both Together
            </button>

            {saveMessage && (
              <span className="text-sm font-medium text-gray-700">{saveMessage}</span>
            )}
          </div>

          <div className="space-y-8">
            <section
              id="invoiceDocument"
              className="bg-white shadow-sm"
              style={{
                width: "100%",
                maxWidth: "1050px",
                margin: "0 auto",
                border: "2px solid #000",
                padding: "12px",
                background: "#fff",
                fontFamily: "Arial, sans-serif",
                color: "#111",
              }}
            >
              <div
                style={{
                  border: "1px solid rgb(116, 204, 0)",
                  minHeight: "100%",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1.15fr",
                    borderBottom: "1px solid #999",
                    minHeight: "210px",
                  }}
                >
                  <div style={{ padding: "18px", borderRight: "1px solid #999" }}>
                    <img
                      src="/lambda-logo.png"
                      alt="Lambda logo"
                      crossOrigin="anonymous"
                      style={{
                        height: "80px",
                        objectFit: "contain",
                        marginBottom: "24px",
                      }}
                    />

                    <div style={{ fontSize: "13px", lineHeight: "1.45" }}>
                      <div style={{ fontWeight: 600, marginBottom: "6px" }}>
                        {clientName}
                      </div>
                      <div style={{ whiteSpace: "pre-line" }}>{clientAddress}</div>
                    </div>
                  </div>

                  <div style={{ padding: "18px", textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: "24px",
                        fontWeight: 700,
                        color: "#2f6f1f",
                        lineHeight: "1.2",
                        textTransform: "uppercase",
                      }}
                    >
                      {companyName}
                    </div>

                    <div
                      style={{
                        marginTop: "8px",
                        fontSize: "13px",
                        lineHeight: "1.5",
                        color: "#2f6f1f",
                        whiteSpace: "pre-line",
                      }}
                    >
                      {companyAddress}
                    </div>

                    <div
                      style={{
                        marginTop: "2px",
                        fontSize: "13px",
                        color: "#2f6f1f",
                      }}
                    >
                      Phone: {companyPhone}
                    </div>

                    <div
                      style={{
                        marginTop: "46px",
                        fontSize: "26px",
                        fontWeight: 700,
                        color: "#2f6f1f",
                        textTransform: "uppercase",
                      }}
                    >
                      Invoice
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.8fr 0.7fr 0.7fr 0.7fr",
                    borderBottom: "1px solid #999",
                    fontSize: "13px",
                  }}
                >
                  <div
                    style={{
                      padding: "10px 12px",
                      borderRight: "1px solid #999",
                      fontWeight: 700,
                    }}
                  >
                    ZHR#&nbsp; {projectNumber} &nbsp;&nbsp;&nbsp; {projectName}
                  </div>
                  <div
                    style={{ padding: "10px 12px", borderRight: "1px solid #999" }}
                  >
                    <div style={{ fontWeight: 700 }}>Client #</div>
                    <div style={{ marginTop: "6px" }}>{clientNumber}</div>
                  </div>
                  <div
                    style={{ padding: "10px 12px", borderRight: "1px solid #999" }}
                  >
                    <div style={{ fontWeight: 700 }}>Date</div>
                    <div style={{ marginTop: "6px" }}>{invoiceDate}</div>
                  </div>
                  <div style={{ padding: "10px 12px" }}>
                    <div style={{ fontWeight: 700 }}>Invoice #</div>
                    <div style={{ marginTop: "6px" }}>{currentDisplayInvoiceNumber}</div>
                  </div>
                </div>

                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "13px",
                  }}
                >
                  <thead>
                    <tr style={{ background: "#f3f3f3" }}>
                      <th
                        style={{
                          borderBottom: "1px solid #999",
                          borderRight: "1px solid #999",
                          padding: "8px",
                          textAlign: "left",
                          fontStyle: "italic",
                          width: "52%",
                        }}
                      >
                        SERVICES RENDERED
                      </th>
                      <th
                        style={{
                          borderBottom: "1px solid #999",
                          borderRight: "1px solid #999",
                          padding: "8px",
                          textAlign: "center",
                          width: "16%",
                        }}
                      >
                        TOTAL / RATE
                      </th>
                      <th
                        style={{
                          borderBottom: "1px solid #999",
                          borderRight: "1px solid #999",
                          padding: "8px",
                          textAlign: "center",
                          width: "14%",
                        }}
                      >
                        {thirdColumnHeader}
                      </th>
                      <th
                        style={{
                          borderBottom: "1px solid #999",
                          padding: "8px",
                          textAlign: "center",
                          width: "18%",
                        }}
                      >
                        AMOUNT
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {invoiceDisplayItems.map((item, index) => (
                      <tr key={index}>
                        <td
                          style={{
                            borderBottom: "1px solid #ccc",
                            borderRight: "1px solid #999",
                            padding: "7px 8px",
                            verticalAlign: "top",
                          }}
                        >
                          {item.description}
                          {item.source === "progress" && (
                            <div style={{ fontSize: "11px", color: "#666", marginTop: "3px" }}>
                              Imported from monthly progress billing
                            </div>
                          )}
                        </td>
                        <td
                          style={{
                            borderBottom: "1px solid #ccc",
                            borderRight: "1px solid #999",
                            padding: "7px 8px",
                            textAlign: "right",
                            verticalAlign: "top",
                          }}
                        >
                          ${money(item.totalNumber)}
                        </td>
                        <td
                          style={{
                            borderBottom: "1px solid #ccc",
                            borderRight: "1px solid #999",
                            padding: "7px 8px",
                            textAlign: "right",
                            verticalAlign: "top",
                          }}
                        >
                          {item.thirdColumnDisplay}
                        </td>
                        <td
                          style={{
                            borderBottom: "1px solid #ccc",
                            padding: "7px 8px",
                            textAlign: "right",
                            verticalAlign: "top",
                          }}
                        >
                          ${money(item.amountNumber)}
                        </td>
                      </tr>
                    ))}

                    {invoiceDisplayItems.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          style={{
                            borderBottom: "1px solid #ccc",
                            padding: "16px",
                            textAlign: "center",
                            color: "#666",
                          }}
                        >
                          No items billed for this invoice yet.
                        </td>
                      </tr>
                    )}

                    {Array.from({
                      length: Math.max(0, 8 - invoiceDisplayItems.length),
                    }).map((_, idx) => (
                      <tr key={`blank-${idx}`}>
                        <td
                          style={{
                            borderBottom: "1px solid #eee",
                            borderRight: "1px solid #999",
                            height: "28px",
                          }}
                        />
                        <td
                          style={{
                            borderBottom: "1px solid #eee",
                            borderRight: "1px solid #999",
                          }}
                        />
                        <td
                          style={{
                            borderBottom: "1px solid #eee",
                            borderRight: "1px solid #999",
                          }}
                        />
                        <td style={{ borderBottom: "1px solid #eee" }} />
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 340px",
                    minHeight: "180px",
                  }}
                >
                  <div style={{ borderRight: "1px solid #999" }} />

                  <div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        fontSize: "15px",
                      }}
                    >
                      <div
                        style={{
                          padding: "10px 14px",
                          borderBottom: "1px solid #ddd",
                        }}
                      >
                        Subtotal
                      </div>
                      <div
                        style={{
                          padding: "10px 14px",
                          borderBottom: "1px solid #ddd",
                          textAlign: "right",
                        }}
                      >
                        ${money(subtotal)}
                      </div>

                      <div
                        style={{
                          padding: "10px 14px",
                          borderBottom: "1px solid #ddd",
                        }}
                      >
                        HST ({hstRate}%)
                      </div>
                      <div
                        style={{
                          padding: "10px 14px",
                          borderBottom: "1px solid #ddd",
                          textAlign: "right",
                        }}
                      >
                        ${money(hstAmount)}
                      </div>

                      <div
                        style={{
                          padding: "12px 14px",
                          fontSize: "19px",
                          fontWeight: 700,
                        }}
                      >
                        TOTAL
                      </div>
                      <div
                        style={{
                          padding: "12px 14px",
                          fontSize: "19px",
                          fontWeight: 700,
                          textAlign: "right",
                        }}
                      >
                        ${money(totalWithTax)}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    borderTop: "1px solid #999",
                    padding: "18px 22px",
                    fontSize: "14px",
                    lineHeight: "1.55",
                    minHeight: "180px",
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: "8px" }}>
                    Payment Instructions:
                  </div>

                  <div style={{ marginBottom: "8px" }}>
                    <strong>Preferred Method: Direct Deposit (EFT)</strong>
                    <br />
                    Banking details will be provided separately for privacy.
                  </div>

                  <div style={{ marginBottom: "8px" }}>
                    <strong>Alternative Method:</strong>
                    <br />
                    E-transfer to: info@lambdaengineers.ca
                    <br />
                    Auto-deposit enabled
                  </div>

                  <div>
                    <strong>Payment Terms:</strong> Net 15 days
                  </div>
                </div>
              </div>
            </section>

            <section
              id="progressDocument"
              className="bg-white shadow-sm"
              style={{
                width: "100%",
                maxWidth: "1320px",
                margin: "0 auto",
                border: "2px solid #000",
                background: "#fff",
                fontFamily: "Arial, sans-serif",
                color: "#111",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.15fr 1fr",
                  minHeight: "220px",
                  borderBottom: "2px solid #000",
                }}
              >
                <div
                  style={{
                    padding: "28px 20px",
                    borderRight: "1px solid #bbb",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <img
                    src="/lambda-logo.png"
                    alt="Lambda logo"
                    crossOrigin="anonymous"
                    style={{
                      height: "140px",
                      objectFit: "contain",
                    }}
                  />
                </div>

                <div style={{ padding: "24px 26px" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "16px",
                    }}
                  >
                    <tbody>
                      <tr>
                        <td style={{ padding: "8px 10px", textAlign: "right" }}>
                          Client Name
                        </td>
                        <td
                          style={{
                            padding: "8px 10px",
                            border: "1px solid #999",
                            textAlign: "center",
                            fontWeight: 600,
                          }}
                        >
                          {clientName}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "8px 10px", textAlign: "right" }}>
                          Client #.
                        </td>
                        <td
                          style={{
                            padding: "8px 10px",
                            border: "1px solid #999",
                            textAlign: "center",
                            fontWeight: 600,
                          }}
                        >
                          {clientNumber}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "8px 10px", textAlign: "right" }}>
                          Invoice #.
                        </td>
                        <td
                          style={{
                            padding: "8px 10px",
                            border: "1px solid #999",
                            textAlign: "center",
                            fontWeight: 600,
                          }}
                        >
                          {currentDisplayInvoiceNumber}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "26px 10px 8px", textAlign: "right" }}>
                          Invoice Date
                        </td>
                        <td
                          style={{
                            padding: "8px 10px",
                            border: "1px solid #999",
                            textAlign: "center",
                            fontWeight: 600,
                          }}
                        >
                          {invoiceDate}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "12px",
                }}
              >
                <thead>
                  <tr>
                    <th style={{ ...headerCell, width: "6%" }}>Item No.</th>
                    <th style={{ ...headerCell, width: "19%" }}>Description of Work</th>
                    <th style={{ ...headerCell, width: "7%" }}>Measure of Unit</th>
                    <th style={{ ...headerCell, width: "10%" }}>Total Amount</th>
                    <th style={{ ...headerCell, width: "10%" }}>
                      Percentage from Previous Invoice (%)
                    </th>
                    <th style={{ ...headerCell, width: "10%" }}>
                      Amount charged in previous invoice
                    </th>
                    <th style={{ ...headerCell, width: "10%" }}>
                      Percentage from this invoice (%)
                    </th>
                    <th style={{ ...headerCell, width: "10%" }}>
                      Total Amount this Invoice
                    </th>
                    <th style={{ ...headerCell, width: "10%" }}>
                      Total Amount Billed to this Invoice
                    </th>
                    <th style={{ ...headerCell, width: "8%" }}>Percent % Remaining</th>
                    <th style={{ ...headerCell, width: "10%" }}>Balance to Finish</th>
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <td
                      colSpan={11}
                      style={{
                        border: "1px solid #000",
                        background: "#dff3df",
                        fontWeight: 700,
                        padding: "6px 8px",
                      }}
                    >
                      Main Scope Pay Items
                    </td>
                  </tr>

                  {calculatedProgressItems.map((item, index) => (
                    <tr key={index}>
                      <td style={cellCenter}>{index + 1}</td>
                      <td style={cellLeft}>{item.description}</td>
                      <td style={cellCenter}>{item.unit}</td>
                      <td style={cellRight}>${money(item.totalNumber)}</td>
                      <td style={cellRight}>{percent(item.previousPercentNumber)}%</td>
                      <td style={cellRight}>${money(item.previousAmount)}</td>
                      <td style={cellRight}>{percent(item.currentPercentNumber)}%</td>
                      <td style={cellRight}>${money(item.currentAmount)}</td>
                      <td style={cellRight}>${money(item.billedToDate)}</td>
                      <td style={cellRight}>{percent(item.percentRemaining)}%</td>
                      <td style={cellRight}>${money(item.balanceToFinish)}</td>
                    </tr>
                  ))}

                  {Array.from({
                    length: Math.max(0, 10 - calculatedProgressItems.length),
                  }).map((_, idx) => (
                    <tr key={`blank-progress-${idx}`}>
                      <td style={blankCell}>&nbsp;</td>
                      <td style={blankCell}>&nbsp;</td>
                      <td style={blankCell}>&nbsp;</td>
                      <td style={blankCell}>&nbsp;</td>
                      <td style={blankCell}>&nbsp;</td>
                      <td style={blankCell}>&nbsp;</td>
                      <td style={blankCell}>&nbsp;</td>
                      <td style={blankCell}>&nbsp;</td>
                      <td style={blankCell}>&nbsp;</td>
                      <td style={blankCell}>&nbsp;</td>
                      <td style={blankCell}>&nbsp;</td>
                    </tr>
                  ))}

                  <tr style={{ background: "#dff3df", fontWeight: 700 }}>
                    <td style={totalCellCenter}></td>
                    <td style={totalCellRight}>TOTAL</td>
                    <td style={totalCellCenter}></td>
                    <td style={totalCellRight}>${money(progressTotalContract)}</td>
                    <td style={totalCellRight}></td>
                    <td style={totalCellRight}>${money(progressTotalPrevious)}</td>
                    <td style={totalCellRight}></td>
                    <td style={totalCellRight}>${money(progressTotalCurrent)}</td>
                    <td style={totalCellRight}>${money(progressTotalBilledToDate)}</td>
                    <td style={totalCellRight}></td>
                    <td style={totalCellRight}>${money(progressTotalBalance)}</td>
                  </tr>
                </tbody>
              </table>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

const headerCell: React.CSSProperties = {
  border: "1px solid #000",
  padding: "8px 6px",
  verticalAlign: "bottom",
};

const cellBase: React.CSSProperties = {
  border: "1px solid #000",
  padding: "6px 6px",
  height: "28px",
};

const cellLeft: React.CSSProperties = {
  ...cellBase,
  textAlign: "left",
};

const cellCenter: React.CSSProperties = {
  ...cellBase,
  textAlign: "center",
};

const cellRight: React.CSSProperties = {
  ...cellBase,
  textAlign: "right",
};

const blankCell: React.CSSProperties = {
  ...cellBase,
  color: "transparent",
};

const totalCellRight: React.CSSProperties = {
  ...cellBase,
  textAlign: "right",
  fontWeight: 700,
};

const totalCellCenter: React.CSSProperties = {
  ...cellBase,
  textAlign: "center",
  fontWeight: 700,
};