"use client";

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
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="mb-2 text-3xl font-bold">Mo Project Controls</h1>
          <p className="mb-6 text-gray-600">
            Invoice generator for Lambda Engineering
          </p>

          <div className="grid gap-4">
            <input
              className="border p-3 rounded"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Project Name"
            />

            <input
              className="border p-3 rounded"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Client Name"
            />

            <textarea
              className="border p-3 rounded min-h-[100px]"
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
              placeholder="Client address/details"
            />

            <div className="grid grid-cols-2 gap-4">
              <input
                className="border p-3 rounded"
                value={clientNumber}
                onChange={(e) => setClientNumber(e.target.value)}
                placeholder="Client #"
              />
              <input
                className="border p-3 rounded"
                value={projectNumber}
                onChange={(e) => setProjectNumber(e.target.value)}
                placeholder="Project #"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input
                className="border p-3 rounded"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Invoice #"
              />
              <input
                className="border p-3 rounded"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                placeholder="Date"
              />
            </div>

            <input
              className="border p-3 rounded"
              value={hstRate}
              onChange={(e) => setHstRate(e.target.value)}
              placeholder="HST %"
            />

            <input
              className="border p-3 rounded"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Your company name"
            />

            <textarea
              className="border p-3 rounded min-h-[90px]"
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              placeholder="Your company address"
            />

            <input
              className="border p-3 rounded"
              value={companyPhone}
              onChange={(e) => setCompanyPhone(e.target.value)}
              placeholder="Company phone"
            />

            <h2 className="font-semibold mt-4">Line Items</h2>

            {lineItems.map((item, index) => (
              <div key={index} className="border p-3 rounded grid gap-2">
                <input
                  className="border p-2 rounded"
                  value={item.description}
                  onChange={(e) =>
                    handleLineItemChange(index, "description", e.target.value)
                  }
                  placeholder="Description"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="border p-2 rounded"
                    value={item.total}
                    onChange={(e) =>
                      handleLineItemChange(index, "total", e.target.value)
                    }
                    placeholder="Total"
                  />
                  <input
                    className="border p-2 rounded"
                    value={item.percent}
                    onChange={(e) =>
                      handleLineItemChange(index, "percent", e.target.value)
                    }
                    placeholder="%"
                  />
                </div>
              </div>
            ))}

            <button
              onClick={addLineItem}
              className="bg-black text-white p-3 rounded"
            >
              Add Line Item
            </button>
          </div>
        </section>

        <section className="bg-white p-8 border shadow-sm">
          <div className="border border-gray-400">
            <div className="grid grid-cols-2 border-b border-gray-400">
              <div className="p-4 border-r min-h-[165px]">
                <img
                  src="/lambda-logo.png"
                  alt="Lambda logo"
                  className="h-20 mb-3 object-contain"
                />

                <p className="font-medium text-sm mb-1">{clientName}</p>
                <div className="text-sm whitespace-pre-line leading-6">
                  {clientAddress}
                </div>
              </div>

              <div className="p-4 text-right min-h-[165px]">
                <h2 className="text-2xl font-bold text-green-700">
                  {companyName}
                </h2>

                <div className="text-sm text-green-700 whitespace-pre-line leading-6 mt-2">
                  {companyAddress}
                </div>

                <p className="text-sm text-green-700 mt-1">
                  Phone: {companyPhone}
                </p>

                <h1 className="text-3xl font-bold mt-6 text-green-700">
                  INVOICE
                </h1>
              </div>
            </div>

            <div className="border-b p-3">
              <strong>ZHR# {projectNumber}</strong> &nbsp;&nbsp; {projectName}
            </div>

            <div className="grid grid-cols-3 border-b text-sm">
              <div className="p-3 border-r">
                <strong>Client #</strong>
                <br />
                {clientNumber}
              </div>
              <div className="p-3 border-r">
                <strong>Date</strong>
                <br />
                {invoiceDate}
              </div>
              <div className="p-3">
                <strong>Invoice #</strong>
                <br />
                {invoiceNumber}
              </div>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">SERVICES</th>
                  <th className="border p-2">TOTAL</th>
                  <th className="border p-2">%</th>
                  <th className="border p-2">AMOUNT</th>
                </tr>
              </thead>

              <tbody>
                {calculatedItems.map((item, index) => (
                  <tr key={index}>
                    <td className="border p-2">{item.description}</td>
                    <td className="border p-2 text-right">
                      ${money(item.totalNumber)}
                    </td>
                    <td className="border p-2 text-right">
                      {item.percentNumber}%
                    </td>
                    <td className="border p-2 text-right">
                      ${money(item.amountNumber)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="p-4 text-right">
              <p>Subtotal: ${money(subtotal)}</p>
              <p>
                HST ({hstRate}%): ${money(hstAmount)}
              </p>
              <p className="font-bold text-lg">TOTAL: ${money(totalWithTax)}</p>
            </div>

            <div className="border-t p-4 text-sm">
              <strong>Payment Instructions:</strong>

              <p className="mt-2">
                <strong>Preferred Method: Direct Deposit (EFT)</strong>
                <br />
                Banking details will be provided separately for privacy.
              </p>

              <p className="mt-2">
                <strong>Alternative Method:</strong>
                <br />
                E-transfer to: info@lambdaengineers.ca
                <br />
                Auto-deposit enabled
              </p>

              <p className="mt-2">
                <strong>Payment Terms:</strong> Net 15 days
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}