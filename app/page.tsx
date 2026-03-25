"use client";

import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { supabase } from "../lib/supabase";

type CalcType = "percent" | "multiply";

type LineItem = {
  description: string;
  total: string;
  value: string;
  calcType: CalcType;
  valueLabel: string;
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
  line_items: any[] | null;
  subtotal: number | null;
  hst_amount: number | null;
  total_with_tax: number | null;
};

export default function Home() {
  const [projectName, setProjectName] = useState("Riverbend Estates subdivision");
  const [clientName, setClientName] = useState("ZHR Inc.");
  const [clientAddress, setClientAddress] = useState(
    "Engineering | Construction | Project Management\n79 Eleanor Circle, Richmond Hill, Ontario\nCanada L4C 6K6"
  );
  const [clientNumber, setClientNumber] = useState("301");
  const [projectNumber, setProjectNumber] = useState("0301");
  const [invoiceNumber, setInvoiceNumber] = useState("0301-001");
  const [invoiceDate, setInvoiceDate] = useState("3-24-2026");
  const [hstRate, setHstRate] = useState("13");

  const [companyName, setCompanyName] = useState("LAMBDA ENGINEERING INC.");
  const [companyAddress, setCompanyAddress] = useState(
    "31580 Lakeridge Rd,\nPefferlaw, Ontario,\nL0E 1E0"
  );
  const [companyPhone, setCompanyPhone] = useState("6474684321");

  const [thirdColumnHeader, setThirdColumnHeader] = useState("% of total");

  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      description: "Stormwater Management Report",
      total: "28000",
      value: "25",
      calcType: "percent",
      valueLabel: "% of total",
    },
    {
      description: "Traffic Impact Assessment",
      total: "4500",
      value: "25",
      calcType: "percent",
      valueLabel: "% of total",
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

  const handleLineItemChange = (
    index: number,
    field: keyof LineItem,
    value: string
  ) => {
    const updated = [...lineItems];
    if (field === "calcType") {
      updated[index][field] = value as CalcType;
    } else {
      updated[index][field] = value as never;
    }
    setLineItems(updated);
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        description: "",
        total: "",
        value: "",
        calcType: "percent",
        valueLabel: thirdColumnHeader || "% of total",
      },
    ]);
  };

  const deleteLineItem = (index: number) => {
    const updated = lineItems.filter((_, i) => i !== index);
    setLineItems(
      updated.length
        ? updated
        : [
            {
              description: "",
              total: "",
              value: "",
              calcType: "percent",
              valueLabel: thirdColumnHeader || "% of total",
            },
          ]
    );
  };

  const calculatedItems = useMemo(() => {
    return lineItems.map((item) => {
      const total = Number(item.total) || 0;
      const value = Number(item.value) || 0;
      const amount =
        item.calcType === "percent" ? total * (value / 100) : total * value;

      return {
        ...item,
        totalNumber: total,
        valueNumber: value,
        amountNumber: amount,
      };
    });
  }, [lineItems]);

  const subtotal = useMemo(() => {
    return calculatedItems.reduce((sum, item) => sum + item.amountNumber, 0);
  }, [calculatedItems]);

  const hstAmount = useMemo(() => {
    return subtotal * ((Number(hstRate) || 0) / 100);
  }, [subtotal, hstRate]);

  const totalWithTax = useMemo(() => {
    return subtotal + hstAmount;
  }, [subtotal, hstAmount]);

  const money = (value: number) =>
    value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

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
    setLoadedRootInvoiceNumber(
      invoice.root_invoice_number || invoice.invoice_number || null
    );
    setLoadedRevisionNumber(invoice.revision_number || 0);

    const loadedItems =
      invoice.line_items && invoice.line_items.length
        ? invoice.line_items.map((item: any) => ({
            description: item.description || "",
            total: String(item.total ?? ""),
            value: String(item.value ?? item.percent ?? ""),
            calcType: (
              item.calcType === "multiply" ? "multiply" : "percent"
            ) as CalcType,
            valueLabel:
              item.valueLabel ||
              item.label ||
              invoice.third_column_header ||
              "% of total",
          }))
        : [
            {
              description: "",
              total: "",
              value: "",
              calcType: "percent" as CalcType,
              valueLabel: invoice.third_column_header || "% of total",
            },
          ];

    setLineItems(loadedItems);
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
        hst_rate: Number(hstRate) || 0,
        company_name: companyName,
        company_address: companyAddress,
        company_phone: companyPhone,
        third_column_header: thirdColumnHeader,
        root_invoice_number: rootInvoiceNumber,
        revision_number: revisionNumber,
        parent_invoice_id: parentInvoiceId,
        line_items: calculatedItems.map((item) => ({
          description: item.description,
          total: item.totalNumber,
          value: item.valueNumber,
          calcType: item.calcType,
          valueLabel: item.valueLabel,
          amount: item.amountNumber,
        })),
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

  const downloadPDF = async () => {
    try {
      const element = document.getElementById("invoice");
      if (!element) {
        alert("Invoice section not found.");
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = 210;
      const pageHeight = 297;
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Invoice-${invoiceNumber}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("PDF generation failed. Check browser console.");
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto grid max-w-[1850px] gap-6 lg:grid-cols-[320px_430px_1fr]">
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
                <div
                  key={invoice.id}
                  className="rounded-lg border border-gray-300 p-3"
                >
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
            Invoice generator for Lambda Engineering
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

            <input
              className="rounded border border-gray-400 p-3"
              value={thirdColumnHeader}
              onChange={(e) => setThirdColumnHeader(e.target.value)}
              placeholder="Third column header (e.g. % of total, Hours)"
            />

            <h2 className="mt-3 text-lg font-semibold">Line Items</h2>

            {lineItems.map((item, index) => (
              <div key={index} className="rounded border border-gray-400 p-3">
                <div className="mb-2 flex gap-2">
                  <input
                    className="w-full rounded border border-gray-400 p-2"
                    value={item.description}
                    onChange={(e) =>
                      handleLineItemChange(index, "description", e.target.value)
                    }
                    placeholder="Service description"
                  />
                  <button
                    type="button"
                    onClick={() => deleteLineItem(index)}
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
                      handleLineItemChange(index, "total", e.target.value)
                    }
                    placeholder="Total or hourly rate"
                  />
                  <input
                    className="rounded border border-gray-400 p-2"
                    value={item.value}
                    onChange={(e) =>
                      handleLineItemChange(index, "value", e.target.value)
                    }
                    placeholder="Percent, hours, qty"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <select
                    className="rounded border border-gray-400 p-2"
                    value={item.calcType}
                    onChange={(e) =>
                      handleLineItemChange(index, "calcType", e.target.value)
                    }
                  >
                    <option value="percent">Percent</option>
                    <option value="multiply">Multiply</option>
                  </select>

                  <input
                    className="rounded border border-gray-400 p-2"
                    value={item.valueLabel}
                    onChange={(e) =>
                      handleLineItemChange(index, "valueLabel", e.target.value)
                    }
                    placeholder="Label e.g. % of total, Hours"
                  />
                </div>
              </div>
            ))}

            <button
              onClick={addLineItem}
              className="rounded bg-black px-4 py-3 font-semibold text-white"
            >
              Add Line Item
            </button>
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
              onClick={downloadPDF}
              className="rounded bg-green-600 px-4 py-3 font-semibold text-white"
            >
              Download PDF
            </button>

            {saveMessage && (
              <span className="text-sm font-medium text-gray-700">
                {saveMessage}
              </span>
            )}
          </div>

          <section
            id="invoice"
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
                  <div style={{ marginTop: "6px" }}>
                    {loadedInvoiceId && loadedRevisionNumber > 0
                      ? `${invoiceNumber} Rev ${loadedRevisionNumber}`
                      : invoiceNumber}
                  </div>
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
                      Total
                    </th>
                    <th
                      style={{
                        borderBottom: "1px solid #999",
                        borderRight: "1px solid #999",
                        padding: "8px",
                        textAlign: "center",
                        width: "12%",
                      }}
                    >
                      {thirdColumnHeader}
                    </th>
                    <th
                      style={{
                        borderBottom: "1px solid #999",
                        padding: "8px",
                        textAlign: "center",
                        width: "20%",
                      }}
                    >
                      AMOUNT
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {calculatedItems.map((item, index) => (
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
                        {item.totalNumber > 0 ? `$${money(item.totalNumber)}` : ""}
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
                        {item.valueNumber > 0
                          ? item.calcType === "percent"
                            ? `${item.valueNumber}%`
                            : `${item.valueNumber}`
                          : ""}
                      </td>
                      <td
                        style={{
                          borderBottom: "1px solid #ccc",
                          padding: "7px 8px",
                          textAlign: "right",
                          verticalAlign: "top",
                        }}
                      >
                        {item.amountNumber > 0
                          ? `$${money(item.amountNumber)}`
                          : ""}
                      </td>
                    </tr>
                  ))}

                  {Array.from({
                    length: Math.max(0, 8 - calculatedItems.length),
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
        </div>
      </div>
    </main>
  );
}