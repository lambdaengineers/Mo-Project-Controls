"use client";

import { useMemo, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
    "31580 Lakeridge Rd,\nPefferlaw, Ontario,\nL0E 1E0"
  );
  const [companyPhone, setCompanyPhone] = useState("6474684321");

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "Project initiation", total: "", percent: "" },
    {
      description: "Stormwater Management Report",
      total: "28000",
      percent: "25",
    },
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

  const deleteLineItem = (index: number) => {
    const updated = lineItems.filter((_, i) => i !== index);
    setLineItems(updated.length ? updated : [{ description: "", total: "", percent: "" }]);
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
      <div className="mx-auto max-w-[1600px] grid gap-6 lg:grid-cols-[430px_1fr]">
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

                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="rounded border border-gray-400 p-2"
                    value={item.total}
                    onChange={(e) =>
                      handleLineItemChange(index, "total", e.target.value)
                    }
                    placeholder="Total"
                  />
                  <input
                    className="rounded border border-gray-400 p-2"
                    value={item.percent}
                    onChange={(e) =>
                      handleLineItemChange(index, "percent", e.target.value)
                    }
                    placeholder="% of total"
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
          <div className="mb-4">
            <button
              onClick={downloadPDF}
              className="rounded bg-green-600 px-4 py-3 font-semibold text-white"
            >
              Download PDF
            </button>
          </div>

          <section
            id="invoice"
            className="bg-white p-8 shadow-sm"
            style={{
              width: "100%",
              maxWidth: "1050px",
              margin: "0 auto",
              border: "1px solid #999",
              fontFamily: "Arial, sans-serif",
              color: "#111",
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
                    height: "110px",
                    objectFit: "contain",
                    marginBottom: "14px",
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
              <div style={{ padding: "10px 12px", borderRight: "1px solid #999" }}>
                <div style={{ fontWeight: 700 }}>Client #</div>
                <div style={{ marginTop: "6px" }}>{clientNumber}</div>
              </div>
              <div style={{ padding: "10px 12px", borderRight: "1px solid #999" }}>
                <div style={{ fontWeight: 700 }}>Date</div>
                <div style={{ marginTop: "6px" }}>{invoiceDate}</div>
              </div>
              <div style={{ padding: "10px 12px" }}>
                <div style={{ fontWeight: 700 }}>Invoice #</div>
                <div style={{ marginTop: "6px" }}>{invoiceNumber}</div>
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
                    % of total
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
                      {item.percentNumber > 0 ? `${item.percentNumber}%` : ""}
                    </td>
                    <td
                      style={{
                        borderBottom: "1px solid #ccc",
                        padding: "7px 8px",
                        textAlign: "right",
                        verticalAlign: "top",
                      }}
                    >
                      {item.amountNumber > 0 ? `$${money(item.amountNumber)}` : ""}
                    </td>
                  </tr>
                ))}

                {Array.from({ length: Math.max(0, 8 - calculatedItems.length) }).map(
                  (_, idx) => (
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
                  )
                )}
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
          </section>
        </div>
      </div>
    </main>
  );
}