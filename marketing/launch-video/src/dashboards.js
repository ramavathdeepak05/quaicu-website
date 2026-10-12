// Example dashboards for the kind of businesses QUAICU builds for. All
// names, numbers and customers are illustrative.

const WEEKS = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10", "W11", "W12"];

export const DASHBOARDS = [
  {
    key: "sales",
    tag: "Sales",
    app: "Sales Hub",
    crumb: "Salesforce + SAP",
    color: "#008746",
    kpis: [
      { label: "Revenue · month", value: 1.84, fmt: "cr", delta: "+12.4%", tick: 0.01 },
      { label: "Pipeline", value: 6.2, fmt: "cr", delta: "+8.1%" },
      { label: "Win rate", value: 32.6, fmt: "pct", delta: "+3.2 pts" },
      { label: "Deals closed", value: 148, delta: "+21", tick: 1 },
    ],
    main: {
      type: "line",
      title: "Revenue by week",
      labels: WEEKS,
      series: [
        { name: "This year", data: [22, 26, 24, 31, 35, 33, 41, 44, 48, 46, 55, 61] },
        { name: "Last year", data: [18, 20, 21, 22, 25, 24, 27, 29, 30, 31, 33, 36] },
      ],
    },
    side: { type: "donut", title: "Deals by stage", center: ["412", "open deals"], items: [["Prospect", 38], ["Proposal", 27], ["Negotiation", 21], ["Won", 14]] },
    foot: { type: "bars", title: "Revenue by region", items: [["North", 42], ["South", 58], ["East", 31], ["West", 49], ["Online", 37]], hi: 1 },
  },
  {
    key: "ops",
    tag: "Operations",
    app: "Ops Console",
    crumb: "Tally + WhatsApp",
    color: "#1c1c1c",
    kpis: [
      { label: "Orders today", value: 1284, delta: "+9.6%", tick: 3 },
      { label: "On-time dispatch", value: 96.4, fmt: "pct", delta: "+1.8 pts" },
      { label: "Stock alerts", value: 7, delta: "-4", bad: false },
      { label: "Updates sent", value: 3920, delta: "WhatsApp", tick: 7 },
    ],
    main: {
      type: "line",
      title: "Orders per hour",
      labels: ["8am", "10am", "12pm", "2pm", "4pm", "6pm", "8pm"],
      series: [{ name: "Today", data: [40, 88, 132, 120, 158, 171, 96] }],
    },
    side: { type: "bars", title: "Stock by warehouse", items: [["HYD", 82], ["PUN", 64], ["CHE", 47], ["DEL", 71]], hi: 0 },
    foot: {
      type: "table",
      title: "Latest orders",
      cols: ["Order", "Customer", "Amount", "Status"],
      rows: [
        ["#4821", "Mehta Retail", "₹4,82,000", "Approved"],
        ["#4822", "Blue Lotus Foods", "₹2,08,900", "Shipped"],
      ],
    },
  },
  {
    key: "finance",
    tag: "Finance",
    app: "Finance Desk",
    crumb: "AI invoices + SAP",
    color: "#2bb673",
    kpis: [
      { label: "Invoices by AI", value: 3410, delta: "+18%", tick: 2 },
      { label: "Awaiting approval", value: 12, delta: "Finance lead" },
      { label: "Avg approval time", value: 2.4, fmt: "h", delta: "-1.1h" },
      { label: "Posted to SAP", value: 4.7, fmt: "cr", delta: "+6.3%" },
    ],
    main: {
      type: "line",
      title: "Cash in vs cash out",
      labels: WEEKS,
      series: [
        { name: "In", data: [30, 34, 33, 38, 42, 40, 47, 49, 52, 55, 58, 63] },
        { name: "Out", data: [24, 27, 29, 28, 31, 33, 32, 35, 36, 35, 38, 40] },
      ],
    },
    side: { type: "donut", title: "Invoice status", center: ["3,410", "this month"], items: [["Posted", 71], ["Approved", 18], ["Awaiting", 7], ["Flagged", 4]] },
    foot: {
      type: "table",
      title: "Approvals",
      cols: ["Invoice", "Vendor", "Amount", "Status"],
      rows: [
        ["INV-2207", "Apex Supplies", "₹4,82,000", "Approved"],
        ["INV-2208", "Sharma Logistics", "₹2,64,500", "Awaiting"],
      ],
    },
  },
  {
    key: "realestate",
    tag: "Real estate",
    app: "Skyline Homes",
    crumb: "HubSpot + WhatsApp",
    color: "#c43a1a",
    kpis: [
      { label: "Enquiries", value: 842, delta: "+24%", tick: 2 },
      { label: "Site visits booked", value: 126, delta: "+31", tick: 1 },
      { label: "Bookings", value: 31, delta: "+9" },
      { label: "AI follow-ups", value: 2140, delta: "Approved", tick: 5 },
    ],
    main: { type: "funnel", title: "Enquiry to booking", items: [["Enquiries", 842], ["Qualified", 418], ["Site visits", 126], ["Bookings", 31]] },
    side: { type: "bars", title: "Enquiries by source", items: [["Web", 64], ["Portals", 88], ["Walk-in", 26], ["Referral", 41]], hi: 1 },
    foot: { type: "bars", title: "Bookings by project", items: [["Tower A", 12], ["Tower B", 9], ["Villas", 6], ["Plots", 4]], hi: 0 },
  },
  {
    key: "clinic",
    tag: "Clinics",
    app: "Northwind Clinics",
    crumb: "Zoho + WhatsApp",
    color: "#3a6fb0",
    kpis: [
      { label: "Appointments today", value: 214, delta: "+12", tick: 1 },
      { label: "Intake summaries", value: 198, delta: "Reviewed" },
      { label: "No-show rate", value: 4.1, fmt: "pct", delta: "-2.3 pts" },
      { label: "Reminders sent", value: 640, delta: "WhatsApp", tick: 3 },
    ],
    main: { type: "bars", title: "Appointments by hour", items: [["9", 18], ["10", 31], ["11", 36], ["12", 24], ["1", 15], ["2", 27], ["3", 33], ["4", 30]], hi: 2 },
    side: { type: "donut", title: "Visit type", center: ["214", "today"], items: [["Consult", 46], ["Follow-up", 31], ["Lab", 15], ["Tele", 8]] },
    foot: null,
  },
  {
    key: "inventory",
    tag: "Inventory",
    app: "Stock Room",
    crumb: "Tally + SAP",
    color: "#6b4fbb",
    kpis: [
      { label: "SKUs tracked", value: 4812, delta: "+140" },
      { label: "Reorders by AI", value: 63, delta: "Approved", tick: 1 },
      { label: "Stock value", value: 2.9, fmt: "cr", delta: "-3.4%" },
      { label: "Fill rate", value: 98.2, fmt: "pct", delta: "+0.9 pts" },
    ],
    main: { type: "line", title: "Stock level, top 20 SKUs", labels: WEEKS, series: [{ name: "Units", data: [61, 58, 64, 60, 57, 63, 66, 62, 59, 65, 68, 64] }] },
    side: { type: "bars", title: "Reorders by week", items: [["W9", 12], ["W10", 18], ["W11", 15], ["W12", 21]], hi: 3 },
    foot: null,
  },
];
