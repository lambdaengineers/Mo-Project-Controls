"use client";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useMemo, useState } from "react";

type LineItem = {
  description: string;
  total: string;
  percent: string;
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
  const [invoiceDate, setInvoiceDate] = useState("3-10-2026");
  const [hstRate, setHstRate] = useState("13");

  const [companyName, setCompanyName] = useState("LAMBDA ENGINEERING INC.");
  const [companyAddress, setCompanyAddress] = useState(
    "31580 Lakeridge Rd,\nPefferlaw, Ontario\nL0E 1E0"
  );
  const [companyPhone, setCompanyPhone] = useState("6474684321");

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "Project initiation", total: "", percent: "" },
    { description: "Stormwater Management Report", total: "28000", percent: "25" },
  ]);

  // ✅ FIXED PDF FUNCTION (WORKS ON VERCEL)
  const downloadPDF = async () => {
    if (typeof window === "undefined") return;

    const element = document.getElementById("invoice");
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

    pdf.save(`Invoice-${invoiceNumber}.pdf`);
  };

  const handleLineItemChange = (
    index: number,
    field: keyof LineItem,
    value: string
  ) => {
    const updated = [...lineItems];
    updated[index][field] = value;
    setLineItems(updated);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { description: "", total: "", percent: "" }]);
  };

  const calculatedItems = useMemo(() => {
    return lineItems.map((item) => {
      const total = Number(item.total) || 0;
      const percent = Number(item.percent) || 0;
      const amount = total * (percent / 100);

      return {
        ...item,
        totalNumber: total,
        percentNumber: percent,
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

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-7xl grid gap-8 lg:grid-cols-[420px_1fr]">

        {/* LEFT INPUT PANEL */}
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="mb-2 text-3xl font-bold">Mo Project Controls</h1>

          <div className="grid gap-4">
            <input className="border p-3 rounded" value={projectName} onChange={(e)=>setProjectName(e.target.value)} />
            <input className="border p-3 rounded" value={clientName} onChange={(e)=>setClientName(e.target.value)} />

            <textarea className="border p-3 rounded" value={clientAddress} onChange={(e)=>setClientAddress(e.target.value)} />

            <input className="border p-3 rounded" value={invoiceNumber} onChange={(e)=>setInvoiceNumber(e.target.value)} />
            <input className="border p-3 rounded" value={invoiceDate} onChange={(e)=>setInvoiceDate(e.target.value)} />

            <h2 className="font-semibold mt-4">Line Items</h2>

            {lineItems.map((item,index)=>(
              <div key={index} className="border p-3 rounded">
                <input className="border p-2 w-full mb-2" value={item.description} onChange={(e)=>handleLineItemChange(index,"description",e.target.value)} />
                <div className="grid grid-cols-2 gap-2">
                  <input className="border p-2" value={item.total} onChange={(e)=>handleLineItemChange(index,"total",e.target.value)} />
                  <input className="border p-2" value={item.percent} onChange={(e)=>handleLineItemChange(index,"percent",e.target.value)} />
                </div>
              </div>
            ))}

            <button onClick={addLineItem} className="bg-black text-white p-2">
              Add Line Item
            </button>
          </div>
        </section>

        {/* RIGHT SIDE */}
        <div>

          {/* DOWNLOAD BUTTON */}
          <div className="mb-4">
            <button
              onClick={downloadPDF}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Download PDF
            </button>
          </div>

          {/* INVOICE */}
          <section id="invoice" className="bg-white p-8 border shadow-sm">

            {/* HEADER */}
            <div className="flex justify-between mb-6">
              <div>
                <img
                  src="/lambda-logo.png"
                  alt="logo"
                  className="h-16"
                  crossOrigin="anonymous"
                />
                <p>{clientName}</p>
                <pre>{clientAddress}</pre>
              </div>

              <div className="text-right">
                <h2 className="font-bold text-green-700">{companyName}</h2>
                <pre>{companyAddress}</pre>
                <p>{companyPhone}</p>
                <h1 className="text-2xl font-bold text-green-700">INVOICE</h1>
              </div>
            </div>

            {/* TABLE */}
            <table className="w-full border text-sm">
              <thead>
                <tr>
                  <th className="border p-2">Service</th>
                  <th className="border p-2">Total</th>
                  <th className="border p-2">%</th>
                  <th className="border p-2">Amount</th>
                </tr>
              </thead>

              <tbody>
                {calculatedItems.map((item,index)=>(
                  <tr key={index}>
                    <td className="border p-2">{item.description}</td>
                    <td className="border p-2">${money(item.totalNumber)}</td>
                    <td className="border p-2">{item.percentNumber}%</td>
                    <td className="border p-2">${money(item.amountNumber)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* TOTAL */}
            <div className="mt-4 text-right">
              <p>Subtotal: ${money(subtotal)}</p>
              <p>HST: ${money(hstAmount)}</p>
              <p className="font-bold">Total: ${money(totalWithTax)}</p>
            </div>

            {/* PAYMENT */}
            <div className="mt-6 text-sm">
              <p><strong>Payment Instructions:</strong></p>
              <p>Direct Deposit (EFT)</p>
              <p>E-transfer: info@lambdaengineers.ca</p>
              <p>Net 15 days</p>
            </div>

          </section>
        </div>
      </div>
    </main>
  );
}