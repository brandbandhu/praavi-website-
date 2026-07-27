(() => {
  const STORE_KEY = "praavi_invoice_records";
  const SETTINGS_KEY = "praavi_document_number_settings";
  const INVOICE_EDIT_PIN_KEY = "praavi_invoice_edit_pin";
  const DEFAULT_INVOICE_EDIT_PIN = "2026";
  const SUPPLIER_STATE = "Maharashtra";
  const supplierProfiles = {
    "Praavi Consultants": {
      name: "Praavi Consultants",
      prefix: "PRV",
      address: "Maharashtra, India",
      email: "praavi.consultants@gmail.com",
      website: "praaviconsultants.in",
      phone: "",
      gstin: "",
      pan: "",
      state: "Maharashtra",
      stateCode: "27",
      bankAccountName: "Praavi Consultants"
    },
    Webakoof: {
      name: "Webakoof",
      prefix: "WEB",
      address: "Maharashtra, India",
      email: "webakoofbypraavi@gmail.com",
      website: "webakoof.com",
      phone: "",
      gstin: "",
      pan: "",
      state: "Maharashtra",
      stateCode: "27",
      bankAccountName: "Webakoof"
    }
  };
  const rupee = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
  const inr = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const stateCodes = {
    "jammu and kashmir": "01", "himachal pradesh": "02", punjab: "03", chandigarh: "04", uttarakhand: "05",
    haryana: "06", delhi: "07", rajasthan: "08", "uttar pradesh": "09", bihar: "10", sikkim: "11",
    "arunachal pradesh": "12", nagaland: "13", manipur: "14", mizoram: "15", tripura: "16", meghalaya: "17",
    assam: "18", "west bengal": "19", jharkhand: "20", odisha: "21", chhattisgarh: "22", "madhya pradesh": "23",
    gujarat: "24", "dadra and nagar haveli and daman and diu": "26", maharashtra: "27", karnataka: "29", goa: "30",
    lakshadweep: "31", kerala: "32", "tamil nadu": "33", puducherry: "34", "andaman and nicobar islands": "35",
    telangana: "36", "andhra pradesh": "37", ladakh: "38"
  };

  const defaults = {
    quotationPrefix: "PRV",
    invoicePrefix: "PRV",
    scopePrefix: "PRV",
    separator: "/",
    sequenceDigits: 4,
    startingSequence: 1,
    financialYearFormat: "YYYY-YY"
  };

  const todayISO = () => new Date().toISOString().slice(0, 10);
  const asNumber = (value) => Math.max(0, Number(String(value ?? "").replace(/[^0-9.-]/g, "")) || 0);
  const money = (value) => Math.round((asNumber(value) + Number.EPSILON) * 100) / 100;
  const fmt = (value) => rupee.format(money(value));
  const pdfMoney = (value) => `INR ${inr.format(money(value))}`;
  const norm = (value) => String(value || "").trim().replace(/\s+/g, " ");

  function loadJSON(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || "") || fallback;
    } catch {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getFinancialYear(date = new Date()) {
    const year = date.getFullYear();
    const start = date.getMonth() >= 3 ? year : year - 1;
    return `${start}-${String(start + 1).slice(-2)}`;
  }

  function settings() {
    return { ...defaults, ...loadJSON(SETTINGS_KEY, {}) };
  }

  function nextSequence(type, fy) {
    const records = loadJSON(STORE_KEY, []);
    const max = records
      .filter((item) => item.documentType === type && item.financialYear === fy)
      .reduce((highest, item) => Math.max(highest, asNumber(item.sequenceNumber)), 0);
    return Math.max(max + 1, settings().startingSequence);
  }

  function buildNumber(parts) {
    const config = settings();
    const sequence = String(asNumber(parts.sequenceNumber)).padStart(config.sequenceDigits, "0");
    return [parts.prefix, parts.type, parts.financialYear, sequence].map(norm).filter(Boolean).join(config.separator);
  }

  function amountToIndianWords(amount) {
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const two = (n) => n < 20 ? ones[n] : `${tens[Math.floor(n / 10)]}${n % 10 ? " " + ones[n % 10] : ""}`;
    const three = (n) => `${n > 99 ? ones[Math.floor(n / 100)] + " Hundred " : ""}${two(n % 100)}`.trim();
    let n = Math.floor(money(amount));
    if (!n) return "Indian Rupees Zero Only";
    const parts = [];
    const crore = Math.floor(n / 10000000); n %= 10000000;
    const lakh = Math.floor(n / 100000); n %= 100000;
    const thousand = Math.floor(n / 1000); n %= 1000;
    if (crore) parts.push(`${three(crore)} Crore`);
    if (lakh) parts.push(`${three(lakh)} Lakh`);
    if (thousand) parts.push(`${three(thousand)} Thousand`);
    if (n) parts.push(three(n));
    return `Indian Rupees ${parts.join(" ")} Only`;
  }

  function calculateDueDate(invoiceDate, term) {
    const days = { "Due on Receipt": 0, "Advance Payment": 0, "7 Days": 7, "15 Days": 15, "30 Days": 30, "45 Days": 45, "60 Days": 60 }[term];
    if (days === undefined) return "";
    const [year, month, day] = (invoiceDate || todayISO()).split("-").map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + days);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function calculateTotals(invoice) {
    let subtotal = 0, itemDiscount = 0, taxableAmount = 0, cgst = 0, sgst = 0, igst = 0;
    const taxMode = invoice.gstBilling === "Without GST" ? "No GST" : (invoice.taxMode || "Intra-State");
    const items = invoice.items.map((item, index) => {
      const qty = Math.max(0, asNumber(item.quantity));
      const rate = asNumber(item.rate);
      const discount = asNumber(item.discount);
      const base = money(qty * rate);
      const taxable = money(Math.max(0, base - discount));
      const gstRate = asNumber(item.gstRate || 18);
      const lineCgst = taxMode === "Intra-State" ? money(taxable * (gstRate / 2) / 100) : 0;
      const lineSgst = taxMode === "Intra-State" ? money(taxable * (gstRate / 2) / 100) : 0;
      const lineIgst = taxMode === "Inter-State" ? money(taxable * gstRate / 100) : 0;
      const taxAmount = taxMode === "No GST" ? 0 : money(lineCgst + lineSgst + lineIgst);
      const lineTotal = money(taxable + taxAmount);
      subtotal += base; itemDiscount += discount; taxableAmount += taxable; cgst += lineCgst; sgst += lineSgst; igst += lineIgst;
      return { ...item, serialNumber: index + 1, quantity: qty, rate, discount, taxableAmount: taxable, cgst: lineCgst, sgst: lineSgst, igst: lineIgst, taxAmount, lineTotal };
    });
    const overallDiscount = asNumber(invoice.overallDiscount);
    const additionalCharges = asNumber(invoice.additionalCharges) + asNumber(invoice.travelCharges);
    const roundOff = Number(invoice.roundOff) || 0;
    const grandTotal = money(Math.max(0, taxableAmount + cgst + sgst + igst + additionalCharges - overallDiscount + roundOff));
    const amountPaid = invoice.status === "Paid" ? grandTotal : Math.min(asNumber(invoice.amountPaid), grandTotal);
    const balanceDue = money(Math.max(0, grandTotal - amountPaid));
    return { ...invoice, taxMode, items, subtotal: money(subtotal), itemDiscount: money(itemDiscount), taxableAmount: money(taxableAmount), cgst: money(cgst), sgst: money(sgst), igst: money(igst), additionalCharges: money(additionalCharges), overallDiscount: money(overallDiscount), grandTotal, amountPaid, balanceDue, amountInWords: amountToIndianWords(balanceDue || grandTotal) };
  }

  function readQuoteData() {
    const text = (document.body.innerText || "").replace(/\s+/g, " ");
    const fields = {};
    document.querySelectorAll("input, textarea, select").forEach((el) => {
      const idLabel = el.id ? document.querySelector(`label[for="${CSS.escape(el.id)}"]`) : null;
      const nearLabel = el.closest("label");
      const wrapperText = el.closest("div, label, td")?.innerText || "";
      const label = norm(idLabel?.textContent || nearLabel?.textContent || wrapperText).toLowerCase();
      const value = norm(el.value);
      if (!value) return;
      if (/client|customer|contact person/.test(label) && !fields.clientName) fields.clientName = value;
      if (/business|company|organization/.test(label) && !fields.companyName) fields.companyName = value;
      if (/email/.test(label) && !fields.email) fields.email = value;
      if (/mobile|phone|contact/.test(label) && !fields.phone) fields.phone = value;
      if (/address/.test(label) && !fields.billingAddress) fields.billingAddress = value;
      if (/gst/.test(label) && !fields.gstin) fields.gstin = value;
      if (/project/.test(label) && !fields.projectName) fields.projectName = value;
      if (/payment/.test(label) && !fields.paymentTerms) fields.paymentTerms = value;
      if (/quote|quotation/.test(label) && !fields.quotationNumber) fields.quotationNumber = value;
    });

    const totalMatch = text.match(/(?:grand total|total amount|total)\s*(?:rs\.?|inr|₹)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i);
    const projectMatch = text.match(/project(?:\s*name)?\s*[:\-]?\s*([A-Za-z0-9 &().,\-]{3,80})/i);
    const amount = totalMatch ? asNumber(totalMatch[1]) : 0;
    const item = {
      serviceName: fields.projectName || "Professional Services",
      description: fields.projectName || projectMatch?.[1] || "Services as per approved quotation",
      hsnSac: "9983",
      quantity: 1,
      unit: "Service",
      rate: amount || 0,
      discount: 0,
      gstRate: 18
    };
    return { ...fields, items: [item] };
  }

  function detectSupplierCompany() {
    const selected = [...document.querySelectorAll("select")].map((select) => select.options[select.selectedIndex]?.text || select.value).find((value) => /webakoof|praavi/i.test(value || ""));
    if (/webakoof/i.test(selected || "")) return "Webakoof";
    return "Praavi Consultants";
  }

  function getSupplier(name) {
    return supplierProfiles[name] || supplierProfiles["Praavi Consultants"];
  }

  function createDraft() {
    const fy = getFinancialYear();
    const sequenceNumber = nextSequence("INV", fy);
    const quote = readQuoteData();
    const supplierCompany = detectSupplierCompany();
    const supplier = getSupplier(supplierCompany);
    const clientState = quote.state || SUPPLIER_STATE;
    const taxMode = clientState.toLowerCase() === supplier.state.toLowerCase() ? "Intra-State" : "Inter-State";
    return calculateTotals({
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      documentType: "INV",
      supplierCompany,
      supplier,
      prefix: supplier.prefix || settings().invoicePrefix,
      invoiceType: "Tax Invoice",
      gstBilling: "With GST",
      financialYear: fy,
      sequenceNumber,
      invoiceNumber: buildNumber({ prefix: supplier.prefix || settings().invoicePrefix, type: "INV", financialYear: fy, sequenceNumber }),
      invoiceDate: todayISO(),
      dueDate: calculateDueDate(todayISO(), "15 Days"),
      quotationNumber: quote.quotationNumber || "",
      poNumber: "",
      poDate: "",
      projectName: quote.projectName || "",
      billingPeriod: "",
      placeOfSupply: clientState,
      reverseCharge: "No",
      status: "Draft",
      client: {
        name: quote.clientName || "",
        companyName: quote.companyName || "",
        billingAddress: quote.billingAddress || "",
        shippingAddress: quote.billingAddress || "",
        email: quote.email || "",
        phone: quote.phone || "",
        gstin: quote.gstin || "",
        pan: "",
        state: clientState,
        stateCode: stateCodes[clientState.toLowerCase()] || "27"
      },
      taxMode,
      items: quote.items,
      overallDiscount: 0,
      additionalCharges: 0,
      travelCharges: 0,
      roundOff: 0,
      amountPaid: 0,
      paymentTerms: quote.paymentTerms || "15 Days",
      paymentMethod: "Bank Transfer",
      bankDetails: {
        bankName: "",
        accountName: supplier.bankAccountName,
        accountNumber: "",
        ifsc: "",
        branch: "",
        upiId: "",
        upiQrCode: "",
        paymentLink: ""
      },
      notes: "Thank you for your business.",
      terms: "Payment to be made as per agreed terms. Taxes are calculated as applicable under GST.",
      paymentHistory: [],
      createdBy: "Praavi Admin",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  let invoice = createDraft();
  let zoom = 0.42;
  let modal;
  let paymentModal;
  let invoiceUnlocked = sessionStorage.getItem("praavi_invoice_edit_unlocked") === "true";

  function duplicateMessage(number) {
    return `Invoice number ${number} already exists. Please use a different number.`;
  }

  function validate(inv) {
    const errors = {};
    const records = loadJSON(STORE_KEY, []);
    const number = norm(inv.invoiceNumber);
    if (!number) errors.invoiceNumber = "Invoice number is required.";
    if (records.some((item) => item.id !== inv.id && norm(item.invoiceNumber).toLowerCase() === number.toLowerCase())) {
      errors.invoiceNumber = duplicateMessage(number);
    }
    if (!inv.invoiceDate) errors.invoiceDate = "Invoice date is required.";
    if (!inv.dueDate) errors.dueDate = "Due date is required.";
    if (inv.invoiceDate && inv.dueDate && inv.dueDate < inv.invoiceDate) errors.dueDate = "Due date cannot normally be earlier than invoice date.";
    if (!norm(inv.client.name || inv.client.companyName)) errors.clientName = "Client name or company name is required.";
    if (!norm(inv.client.billingAddress)) errors.billingAddress = "Billing address is required.";
    if (!inv.items.length) errors.items = "Add at least one invoice item.";
    inv.items.forEach((item, index) => {
      if (asNumber(item.quantity) <= 0) errors[`qty${index}`] = "Quantity must be greater than zero.";
      if (Number(item.rate) < 0) errors[`rate${index}`] = "Rate cannot be negative.";
    });
    if (!inv.paymentTerms) errors.paymentTerms = "Payment terms are required.";
    return errors;
  }

  let previewTimer;

  function refreshLivePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => {
      const preview = modal?.querySelector(".praavi-print-root");
      if (preview) {
        preview.style.width = `${Math.ceil(794 * zoom)}px`;
        preview.style.minHeight = `${Math.ceil(1123 * zoom)}px`;
        preview.innerHTML = `<div class="praavi-print-scale" style="transform:scale(${zoom})">${previewHTML()}</div>`;
      }
      const footerTotal = modal?.querySelector("[data-footer-total]");
      if (footerTotal) footerTotal.textContent = `Grand Total: ${fmt(invoice.grandTotal)} | Balance Due: ${fmt(invoice.balanceDue)}`;
      modal?.querySelectorAll("[data-live-money]").forEach((input) => {
        const key = input.dataset.liveMoney;
        input.value = fmt(invoice[key] || 0);
      });
    }, 120);
  }

  function set(path, value, shouldRender = true) {
    const clone = structuredClone(invoice);
    const parts = path.split(".");
    let ref = clone;
    while (parts.length > 1) ref = ref[parts.shift()];
    ref[parts[0]] = value;
    if (path === "paymentTerms") clone.dueDate = calculateDueDate(clone.invoiceDate, value) || clone.dueDate;
    if (path === "gstBilling" && value === "Without GST") clone.taxMode = "No GST";
    if (path === "gstBilling" && value === "With GST" && clone.taxMode === "No GST") {
      clone.taxMode = clone.client.state.toLowerCase() === getSupplier(clone.supplierCompany).state.toLowerCase() ? "Intra-State" : "Inter-State";
    }
    if (path === "supplierCompany") {
      const supplier = getSupplier(value);
      clone.supplier = supplier;
      clone.prefix = supplier.prefix;
      clone.bankDetails.accountName = supplier.bankAccountName;
      if (clone.gstBilling === "With GST") clone.taxMode = clone.client.state.toLowerCase() === supplier.state.toLowerCase() ? "Intra-State" : "Inter-State";
    }
    if (["prefix", "financialYear", "sequenceNumber"].includes(path)) {
      clone.invoiceNumber = buildNumber({ prefix: clone.prefix, type: "INV", financialYear: clone.financialYear, sequenceNumber: clone.sequenceNumber });
    }
    invoice = calculateTotals(clone);
    if (shouldRender) renderModal();
    else refreshLivePreview();
  }

  function saveInvoice(status) {
    const normalized = calculateTotals({ ...invoice, invoiceNumber: norm(invoice.invoiceNumber), status, updatedAt: new Date().toISOString() });
    const errors = validate(normalized);
    if (Object.keys(errors).length) {
      invoice = normalized;
      renderModal(errors);
      return false;
    }
    const records = loadJSON(STORE_KEY, []);
    const index = records.findIndex((item) => item.id === normalized.id);
    if (index >= 0) records[index] = normalized;
    else records.push(normalized);
    saveJSON(STORE_KEY, records);
    invoice = normalized;
    renderDashboard();
    renderHistory();
    renderModal();
    return true;
  }

  function paymentHistoryHTML(inv) {
    const payments = inv.paymentHistory || [];
    if (!payments.length) return `<p style="color:#667085;margin:8px 0 0">No payments recorded yet.</p>`;
    return `<div class="praavi-payment-history"><table><thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Reference</th><th>Notes</th></tr></thead><tbody>${payments.map((payment) => `<tr><td>${payment.date || "-"}</td><td>${fmt(payment.amount)}</td><td>${payment.method || "-"}</td><td>${payment.transactionReference || payment.bankReference || "-"}</td><td>${payment.notes || "-"}</td></tr>`).join("")}</tbody></table></div>`;
  }

  function openPaymentModal(inv) {
    if (!paymentModal) return;
    const fresh = loadJSON(STORE_KEY, []).find((item) => item.id === inv.id) || inv;
    const balance = money(fresh.balanceDue);
    paymentModal.classList.add("is-open");
    paymentModal.innerHTML = `
      <div class="praavi-payment-modal" role="dialog" aria-modal="true" aria-labelledby="praavi-payment-title">
        <div class="praavi-payment-head">
          <div>
            <h2 id="praavi-payment-title" style="margin:0">Record Payment</h2>
            <p style="margin:4px 0 0;color:#667085">${fresh.invoiceNumber} | Balance Due: ${fmt(balance)}</p>
          </div>
          <button type="button" class="praavi-doc-btn" data-payment-close>Close</button>
        </div>
        <form class="praavi-payment-body" data-payment-form>
          <div class="praavi-form-grid">
            <div class="praavi-field"><label>Invoice Number</label><input name="invoiceNumber" value="${fresh.invoiceNumber}" readonly></div>
            <div class="praavi-field"><label>Payment Date</label><input name="date" type="date" value="${todayISO()}" required></div>
            <div class="praavi-field"><label>Amount Received</label><input name="amount" type="number" min="0.01" step="0.01" max="${balance}" value="${balance || ""}" required></div>
            <div class="praavi-field"><label>Payment Method</label><select name="method"><option>Bank Transfer</option><option>UPI</option><option>Cash</option><option>Cheque</option><option>Card</option><option>Online Payment</option><option>Other</option></select></div>
            <div class="praavi-field"><label>Transaction Reference</label><input name="transactionReference" placeholder="UTR / UPI / cheque no."></div>
            <div class="praavi-field"><label>Bank Reference</label><input name="bankReference" placeholder="Bank reference"></div>
            <div class="praavi-field praavi-field-full"><label>Notes</label><textarea name="notes" placeholder="Payment note"></textarea></div>
            <label class="praavi-field praavi-field-full" style="display:flex;align-items:center;gap:8px;font-weight:800"><input name="allowOverpay" type="checkbox" style="width:auto"> Allow payment above current balance</label>
          </div>
          <div class="praavi-payment-note" data-payment-error style="display:none;margin-top:12px"></div>
          <section style="margin-top:14px"><h3 style="margin:0 0 8px">Payment History</h3>${paymentHistoryHTML(fresh)}</section>
        </form>
        <div class="praavi-payment-foot">
          <strong>New Balance: <span data-payment-balance>${fmt(balance)}</span></strong>
          <div><button type="button" class="praavi-doc-btn" data-payment-close>Cancel</button> <button type="submit" form="praavi-payment-submit-proxy" class="praavi-doc-btn praavi-invoice-btn" data-payment-save>Save Payment</button></div>
        </div>
      </div>`;

    const form = paymentModal.querySelector("[data-payment-form]");
    const amountInput = form.querySelector('[name="amount"]');
    const allowInput = form.querySelector('[name="allowOverpay"]');
    const balanceNode = paymentModal.querySelector("[data-payment-balance]");
    const errorNode = paymentModal.querySelector("[data-payment-error]");
    const close = () => paymentModal.classList.remove("is-open");
    paymentModal.querySelectorAll("[data-payment-close]").forEach((button) => button.addEventListener("click", close));

    const refreshBalance = () => {
      const amount = asNumber(amountInput.value);
      balanceNode.textContent = fmt(Math.max(0, balance - amount));
      if (amount > balance && !allowInput.checked) {
        errorNode.style.display = "block";
        errorNode.textContent = `Payment cannot exceed outstanding balance ${fmt(balance)} unless you allow over-payment.`;
      } else {
        errorNode.style.display = "none";
        errorNode.textContent = "";
      }
    };
    amountInput.addEventListener("input", refreshBalance);
    allowInput.addEventListener("change", refreshBalance);
    paymentModal.querySelector("[data-payment-save]").addEventListener("click", () => {
      const data = new FormData(form);
      const payment = {
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        date: String(data.get("date") || todayISO()),
        amount: money(asNumber(data.get("amount"))),
        method: String(data.get("method") || "Bank Transfer"),
        transactionReference: norm(data.get("transactionReference")),
        bankReference: norm(data.get("bankReference")),
        notes: norm(data.get("notes")),
        recordedAt: new Date().toISOString(),
      };
      const allowOverpay = data.get("allowOverpay") === "on";
      const message = validatePayment(fresh, payment, allowOverpay);
      if (message) {
        errorNode.style.display = "block";
        errorNode.textContent = message;
        return;
      }
      recordPayment(fresh, payment);
      close();
    });
  }

  function validatePayment(inv, payment, allowOverpay) {
    if (!payment.date) return "Payment date is required.";
    if (!payment.amount || payment.amount <= 0) return "Amount received must be greater than zero.";
    if (payment.amount > money(inv.balanceDue) && !allowOverpay) {
      return `Payment cannot exceed outstanding balance ${fmt(inv.balanceDue)} unless you allow over-payment.`;
    }
    return "";
  }

  function recordPayment(inv, payment) {
    const records = loadJSON(STORE_KEY, []);
    const index = records.findIndex((item) => item.id === inv.id);
    if (index < 0) return;
    const paid = money(asNumber(records[index].amountPaid) + asNumber(payment.amount));
    const updated = calculateTotals({
      ...records[index],
      amountPaid: paid,
      status: paid >= records[index].grandTotal ? "Paid" : "Partially Paid",
      paymentHistory: [...(records[index].paymentHistory || []), payment],
      updatedAt: new Date().toISOString()
    });
    records[index] = updated;
    saveJSON(STORE_KEY, records);
    if (invoice.id === updated.id) invoice = updated;
    renderDashboard();
    renderHistory();
    if (modal?.classList.contains("is-open") && invoice.id === updated.id) renderModal();
  }

  function field(label, path, type = "text", options) {
    const value = path.split(".").reduce((obj, part) => obj?.[part], invoice) ?? "";
    const disabled = invoiceUnlocked ? "" : "disabled";
    const input = options
      ? `<select data-path="${path}" ${disabled}>${options.map((opt) => `<option ${String(value) === opt ? "selected" : ""}>${opt}</option>`).join("")}</select>`
      : `<input data-path="${path}" type="${type}" value="${String(value).replace(/"/g, "&quot;")}" ${disabled}>`;
    return `<div class="praavi-field"><label>${label}</label>${input}<div class="praavi-error" data-error="${path}"></div></div>`;
  }

  function readonlyMoneyField(label, value, key) {
    return `<div class="praavi-field"><label>${label}</label><input data-live-money="${key}" value="${fmt(value)}" readonly></div>`;
  }

  function textField(label, path) {
    const value = path.split(".").reduce((obj, part) => obj?.[part], invoice) ?? "";
    return `<div class="praavi-field praavi-field-full"><label>${label}</label><textarea data-path="${path}" ${invoiceUnlocked ? "" : "disabled"}>${String(value)}</textarea></div>`;
  }

  function renderItems() {
    const disabled = invoiceUnlocked ? "" : "disabled";
    return invoice.items.map((item, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><input data-item="${i}" data-key="serviceName" value="${item.serviceName || ""}" ${disabled}></td>
        <td><input data-item="${i}" data-key="description" value="${item.description || ""}" ${disabled}></td>
        <td><input data-item="${i}" data-key="hsnSac" value="${item.hsnSac || ""}" ${disabled}></td>
        <td><input data-item="${i}" data-key="quantity" type="number" min="0" step="0.01" value="${item.quantity}" ${disabled}></td>
        <td><select data-item="${i}" data-key="unit" ${disabled}>${["Service", "Month", "Project", "Package", "Hour", "Day", "Quantity", "License"].map((unit) => `<option ${item.unit === unit ? "selected" : ""}>${unit}</option>`).join("")}</select></td>
        <td><input data-item="${i}" data-key="rate" type="number" min="0" step="0.01" value="${item.rate}" ${disabled}></td>
        <td><input data-item="${i}" data-key="discount" type="number" min="0" step="0.01" value="${item.discount}" ${disabled}></td>
        <td>${fmt(item.taxableAmount)}</td>
        <td><input data-item="${i}" data-key="gstRate" type="number" min="0" step="0.01" value="${item.gstRate || 18}" ${disabled}></td>
        <td>${fmt(item.lineTotal)}</td>
        <td>
          <button data-duplicate="${i}" class="praavi-table-action" type="button" ${disabled}>Duplicate</button>
          <button data-remove="${i}" class="praavi-table-action" type="button" ${disabled}>Remove</button>
          <button data-up="${i}" class="praavi-table-action" type="button" ${disabled}>Up</button>
          <button data-down="${i}" class="praavi-table-action" type="button" ${disabled}>Down</button>
        </td>
      </tr>
    `).join("");
  }

  function lockHTML(error = "") {
    if (invoiceUnlocked) {
      return `<div class="praavi-invoice-lock is-unlocked"><span class="praavi-lock-text">Invoice editing unlocked</span><button type="button" data-lock-invoice>Lock Invoice</button></div>`;
    }
    return `<div class="praavi-invoice-lock"><span class="praavi-lock-text">Invoice locked. Enter numeric password to edit invoice details.</span><div class="praavi-invoice-lock-form"><input data-invoice-pin type="password" inputmode="numeric" pattern="[0-9]*" placeholder="PIN"><button type="button" data-unlock-invoice>Unlock</button></div>${error ? `<div class="praavi-error">${error}</div>` : ""}</div>`;
  }

  function previewHTML(inv = invoice) {
    return `
      <article class="praavi-a4">
        <div class="praavi-pdf-head">
          <div>
            <strong style="font-size:20px;color:#143b73">${inv.supplier?.name || "Praavi Consultants"}</strong>
            <p>Digital marketing, website development and business consulting services.</p>
            <p>${inv.supplier?.address || "Maharashtra, India"}<br>Email: ${inv.supplier?.email || "info@praaviconsultants.in"}<br>Website: ${inv.supplier?.website || "www.praaviconsultants.in"}<br>GSTIN: ${inv.supplier?.gstin || ""}<br>PAN: ${inv.supplier?.pan || ""}</p>
          </div>
          <div>
            <h1>${inv.invoiceType === "Tax Invoice" ? "TAX INVOICE" : inv.invoiceType.toUpperCase()}</h1>
            <div class="praavi-pdf-meta">
              <p><strong>Invoice No:</strong> ${inv.invoiceNumber}</p>
              <p><strong>Invoice Date:</strong> ${inv.invoiceDate}</p>
              <p><strong>Due Date:</strong> ${inv.dueDate}</p>
              <p><strong>Quotation Ref:</strong> ${inv.quotationNumber || "-"}</p>
              <p><strong>PO Ref:</strong> ${inv.poNumber || "-"}</p>
              <p><strong>Status:</strong> ${inv.status}</p>
            </div>
          </div>
        </div>
        <div class="praavi-bill-grid" style="margin-top:18px">
          <div class="praavi-pdf-box"><strong>Bill From</strong><p>${inv.supplier?.name || "Praavi Consultants"}<br>${inv.supplier?.address || "Maharashtra, India"}<br>Email: ${inv.supplier?.email || "info@praaviconsultants.in"}</p></div>
          <div class="praavi-pdf-box"><strong>Bill To</strong><p>${inv.client.companyName || inv.client.name}<br>${inv.client.name}<br>${inv.client.billingAddress}<br>GSTIN: ${inv.client.gstin || "-"}<br>State: ${inv.client.state || "-"} (${inv.client.stateCode || "-"})<br>${inv.client.phone || ""} ${inv.client.email || ""}</p></div>
        </div>
        <table class="praavi-pdf-table">
          <thead><tr><th>Sr. No.</th><th>Description</th><th>SAC</th><th>Qty</th><th>Rate</th><th>Discount</th><th>Taxable Value</th><th>GST</th><th>Amount</th></tr></thead>
          <tbody>${inv.items.map((item, i) => `<tr><td>${i + 1}</td><td><strong>${item.serviceName || ""}</strong><br>${item.description || ""}</td><td>${item.hsnSac || ""}</td><td>${item.quantity} ${item.unit || ""}</td><td>${fmt(item.rate)}</td><td>${fmt(item.discount)}</td><td>${fmt(item.taxableAmount)}</td><td>${inv.taxMode === "Intra-State" ? `CGST ${fmt(item.cgst)}<br>SGST ${fmt(item.sgst)}` : inv.taxMode === "Inter-State" ? `IGST ${fmt(item.igst)}` : "No GST"}</td><td>${fmt(item.lineTotal)}</td></tr>`).join("")}</tbody>
        </table>
        <div class="praavi-total-grid">
          <div><strong>Amount in Words:</strong><p>${inv.amountInWords}</p><div class="praavi-pdf-box"><strong>Payment Information</strong><p>Terms: ${inv.paymentTerms}<br>Method: ${inv.paymentMethod}<br>Bank: ${inv.bankDetails.bankName || "-"}<br>Account: ${inv.bankDetails.accountName || "-"}<br>A/C No: ${inv.bankDetails.accountNumber || "-"}<br>IFSC: ${inv.bankDetails.ifsc || "-"}<br>UPI: ${inv.bankDetails.upiId || "-"}</p></div>${paymentHistoryHTML(inv)}</div>
          <div class="praavi-total-box">
            ${[
              ["Subtotal", inv.subtotal], ["Item Discount", inv.itemDiscount], ["Overall Discount", inv.overallDiscount], ["Taxable Amount", inv.taxableAmount],
              ["CGST", inv.cgst], ["SGST", inv.sgst], ["IGST", inv.igst], ["Additional Charges", inv.additionalCharges],
              ["Round Off", inv.roundOff], ["Grand Total", inv.grandTotal, true], ["Amount Paid", inv.amountPaid], ["Balance Due", inv.balanceDue, true]
            ].map(([label, value, strong]) => `<div class="praavi-total-line ${strong ? "is-strong" : ""}"><span>${label}</span><strong>${fmt(value)}</strong></div>`).join("")}
          </div>
        </div>
        <div style="margin-top:18px"><strong>Terms and Notes</strong><p>${inv.notes || ""}</p><p>${inv.terms || ""}</p></div>
        <div style="display:flex;justify-content:flex-end;margin-top:34px;text-align:center"><div>For ${inv.supplier?.name || "Praavi Consultants"}<br><br><br><strong>Authorized Signatory</strong></div></div>
        <footer style="margin-top:30px;border-top:1px solid #dde3ee;padding-top:10px;text-align:center;color:#667085">Thank you for your business. ${inv.supplier?.website || "www.praaviconsultants.in"} | ${inv.supplier?.email || "info@praaviconsultants.in"} | Page 1</footer>
      </article>`;
  }

  function pdfText(value) {
    return String(value ?? "")
      .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "")
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)");
  }

  function fitPdfText(text, maxChars) {
    const clean = pdfText(text);
    return clean.length > maxChars ? `${clean.slice(0, Math.max(0, maxChars - 3))}...` : clean;
  }

  function wrapPdfText(text, maxChars) {
    const words = String(text || "-").split(/\s+/);
    const lines = [];
    let line = "";
    words.forEach((word) => {
      if ((line + " " + word).trim().length > maxChars) {
        if (line) lines.push(line);
        line = word;
      } else {
        line = `${line} ${word}`.trim();
      }
    });
    if (line) lines.push(line);
    return lines.length ? lines : ["-"];
  }

  function makeInvoicePDF(inv) {
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 46;
    const content = [];
    let y = pageHeight - margin;
    let page = [];
    const blue = [0.078, 0.231, 0.451];
    const light = [0.975, 0.982, 0.992];
    const border = [0.86, 0.89, 0.94];
    const dark = [0.067, 0.094, 0.153];
    const supplier = inv.supplier || getSupplier(inv.supplierCompany);

    const color = (rgb) => page.push(`${rgb.join(" ")} rg ${rgb.join(" ")} RG`);
    const draw = (text, x, size = 7, bold = false) => page.push(`BT /${bold ? "F2" : "F1"} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${pdfText(text)}) Tj ET`);
    const drawAt = (text, x, yy, size = 7, bold = false) => page.push(`BT /${bold ? "F2" : "F1"} ${size} Tf ${x.toFixed(2)} ${yy.toFixed(2)} Td (${pdfText(text)}) Tj ET`);
    const drawRight = (text, rightX, size = 7, bold = false) => draw(text, rightX - pdfText(text).length * size * 0.48, size, bold);
    const drawRightAt = (text, rightX, yy, size = 7, bold = false) => drawAt(text, rightX - pdfText(text).length * size * 0.48, yy, size, bold);
    const rect = (x, yy, w, h, fillRgb = null) => {
      if (fillRgb) {
        color(fillRgb);
        page.push(`${x.toFixed(2)} ${yy.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
      }
      color(border);
      page.push(`${x.toFixed(2)} ${yy.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`);
      color(dark);
    };
    const line = (x1, y1, x2, y2) => {
      color(border);
      page.push(`${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
      color(dark);
    };
    const rowText = (text, x, yy, widthChars, size = 6.2, maxLines = 4) => {
      const lines = wrapPdfText(text, widthChars).slice(0, maxLines);
      lines.forEach((item, index) => drawAt(item, x, yy - index * (size + 2), size, index === 0 && size > 6.1));
      return lines.length;
    };
    const footer = () => {
      drawAt(`Thank you for your business. ${supplier.website} | ${supplier.email}`, margin, 30, 6.2);
    };
    const drawTableHeader = () => {
      rect(margin, y - 15, pageWidth - margin * 2, 18, blue);
      color([1, 1, 1]);
      [["Sr. No.", 52], ["Description", 86], ["SAC", 244], ["Qty", 286], ["Rate", 326], ["Discount", 370], ["Taxable Value", 416], ["GST", 482], ["Amount", 534]].forEach(([label, x]) => drawAt(label, x, y - 9, 5.8, true));
      color(dark);
      y -= 23;
    };
    const newPage = () => {
      footer();
      content.push(page.join("\n"));
      page = [];
      color(dark);
      y = pageHeight - margin;
      drawTableHeader();
    };
    const ensure = (height) => {
      if (y - height < 120) newPage();
    };

    color(dark);
    drawAt(supplier.name, margin, 790, 12, true);
    drawAt("Digital marketing, website development and business consulting services.", margin, 777, 6.5);
    drawAt(supplier.address, margin, 767, 6.5);
    drawAt(`Email: ${supplier.email}`, margin, 757, 6.5);
    drawAt(`Website: ${supplier.website}`, margin, 747, 6.5);
    drawAt(`GSTIN: ${supplier.gstin || "-"}`, margin, 737, 6.5);
    drawAt(`PAN: ${supplier.pan || "-"}`, margin, 727, 6.5);
    color(blue);
    drawAt(inv.invoiceType === "Tax Invoice" ? "TAX INVOICE" : inv.invoiceType.toUpperCase(), 447, 790, 14, true);
    color(dark);
    rect(314, 709, 235, 63);
    [
      [`Invoice No: ${fitPdfText(inv.invoiceNumber, 34)}`, 759],
      [`Invoice Date: ${inv.invoiceDate}`, 748],
      [`Due Date: ${inv.dueDate}`, 737],
      [`Quotation Ref: ${fitPdfText(inv.quotationNumber || "-", 24)}`, 726],
      [`PO Ref: ${fitPdfText(inv.poNumber || "-", 26)}`, 715],
      [`Status: ${inv.status}`, 704]
    ].forEach(([text, yy]) => drawAt(text, 324, yy, 6.5, /Invoice No|Status/.test(text)));
    line(margin, 688, pageWidth - margin, 688);

    rect(margin, 589, 232, 88);
    rect(317, 589, 232, 88);
    drawAt("Bill From", margin + 9, 663, 7.5, true);
    drawAt("Bill To", 326, 663, 7.5, true);
    rowText(`${supplier.name} ${supplier.address} Email: ${supplier.email}`, margin + 9, 648, 40, 6.5);
    rowText(`${inv.client.companyName || inv.client.name || "-"} ${inv.client.name || ""} ${inv.client.billingAddress || "-"} GSTIN: ${inv.client.gstin || "-"} State: ${inv.client.state || "-"} (${inv.client.stateCode || "-"})`, 326, 648, 40, 6.5);

    y = 568;
    drawTableHeader();
    inv.items.forEach((item, index) => {
      const descriptionLines = wrapPdfText(`${item.serviceName || ""} ${item.description || ""}`, 32).slice(0, 5);
      const rowHeight = Math.max(24, descriptionLines.length * 8 + 10);
      ensure(rowHeight + 4);
      const rowTop = y;
      rect(margin, y - rowHeight + 8, pageWidth - margin * 2, rowHeight, index % 2 ? [0.985, 0.988, 0.992] : null);
      drawAt(String(index + 1), 54, rowTop - 8, 6.2);
      descriptionLines.forEach((text, lineIndex) => drawAt(text, 86, rowTop - 8 - lineIndex * 8, lineIndex ? 5.8 : 6.2, !lineIndex));
      drawAt(item.hsnSac || "-", 244, rowTop - 8, 6.2);
      drawAt(`${item.quantity} ${item.unit || ""}`, 286, rowTop - 8, 6.2);
      drawRightAt(pdfMoney(item.rate), 360, rowTop - 8, 6.2);
      drawRightAt(pdfMoney(item.discount), 410, rowTop - 8, 6.2);
      drawRightAt(pdfMoney(item.taxableAmount), 470, rowTop - 8, 6.2);
      const gstText = inv.taxMode === "Intra-State" ? `CGST ${pdfMoney(item.cgst)} SGST ${pdfMoney(item.sgst)}` : inv.taxMode === "Inter-State" ? `IGST ${pdfMoney(item.igst)}` : "No GST";
      rowText(gstText, 482, rowTop - 8, 13, 5.6, 2);
      drawRightAt(pdfMoney(item.lineTotal), 548, rowTop - 8, 6.2, true);
      y -= rowHeight + 2;
      line(margin, y, pageWidth - margin, y);
    });

    ensure(170);
    y -= 10;
    const totalTop = y;
    const totalX = 312;
    [
      ["Subtotal", inv.subtotal], ["Item Discount", inv.itemDiscount], ["Overall Discount", inv.overallDiscount],
      ["Taxable Amount", inv.taxableAmount], ["CGST", inv.cgst], ["SGST", inv.sgst], ["IGST", inv.igst],
      ["Additional Charges", inv.additionalCharges], ["Round Off", inv.roundOff], ["Grand Total", inv.grandTotal],
      ["Amount Paid", inv.amountPaid], ["Balance Due", inv.balanceDue]
    ].forEach(([label, value]) => {
      const strong = label === "Grand Total" || label === "Balance Due";
      if (strong) color(blue);
      draw(label, totalX, strong ? 7.2 : 6.7, strong);
      drawRight(pdfMoney(value), 548, strong ? 7.2 : 6.7, true);
      color(dark);
      y -= 11;
    });

    y = totalTop;
    draw("Amount in Words:", margin, 7.2, true);
    y -= 10;
    wrapPdfText(inv.amountInWords, 48).slice(0, 4).forEach((text) => {
      draw(text, margin, 6.4);
      y -= 9;
    });
    y -= 8;
    rect(margin, y - 70, 228, 80, light);
    draw("Payment Information", margin + 9, 7.2, true);
    y -= 11; draw(`Terms: ${inv.paymentTerms}`, margin + 9, 6.3);
    y -= 9; draw(`Method: ${inv.paymentMethod}`, margin + 9, 6.3);
    y -= 9; draw(`Bank: ${inv.bankDetails.bankName || "-"}`, margin + 9, 6.3);
    y -= 9; draw(`Account: ${inv.bankDetails.accountName || "-"}`, margin + 9, 6.3);
    y -= 9; draw(`A/C No: ${inv.bankDetails.accountNumber || "-"}`, margin + 9, 6.3);
    y -= 9; draw(`IFSC: ${inv.bankDetails.ifsc || "-"} | UPI: ${inv.bankDetails.upiId || "-"}`, margin + 9, 6.3);
    y -= 18; draw((inv.paymentHistory || []).length ? `${inv.paymentHistory.length} payment(s) recorded.` : "No payments recorded yet.", margin, 6.2);
    drawAt(`For ${supplier.name}`, 420, 116, 7.2, true);
    drawAt("Authorized Signatory", 420, 70, 7.2, true);
    footer();
    content.push(page.join("\n"));

    content.forEach((stream, index) => {
      const footer = `BT /F1 8 Tf ${(pageWidth - 92).toFixed(2)} 28.00 Td (Page ${index + 1} of ${content.length}) Tj ET`;
      content[index] = `${stream}\n${footer}`;
    });

    const objects = [
      "<< /Type /Catalog /Pages 2 0 R >>",
      `<< /Type /Pages /Kids [${content.map((_, i) => `${3 + i * 2} 0 R`).join(" ")}] /Count ${content.length} >>`
    ];
    content.forEach((stream, i) => {
      const contentObject = 4 + i * 2;
      objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${3 + content.length * 2} 0 R /F2 ${4 + content.length * 2} 0 R >> >> /Contents ${contentObject} 0 R >>`);
      objects.push(`<< /Length ${new Blob([stream]).size} >>\nstream\n${stream}\nendstream`);
    });
    objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
    objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    objects.forEach((object, index) => {
      offsets.push(pdf.length);
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xref = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, "0")} 00000 n \n`; });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return new Blob([new TextEncoder().encode(pdf)], { type: "application/pdf" });
  }

  function invoiceForDownload(inv) {
    const fallbackNumber = buildNumber({
      prefix: inv.prefix || getSupplier(inv.supplierCompany).prefix,
      type: "INV",
      financialYear: inv.financialYear || getFinancialYear(),
      sequenceNumber: inv.sequenceNumber || 1
    });
    return calculateTotals({
      ...inv,
      supplier: inv.supplier || getSupplier(inv.supplierCompany),
      invoiceNumber: norm(inv.invoiceNumber) || fallbackNumber,
      invoiceDate: inv.invoiceDate || todayISO(),
      dueDate: inv.dueDate || inv.invoiceDate || todayISO(),
      client: {
        ...inv.client,
        name: norm(inv.client?.name) || "Client",
        companyName: norm(inv.client?.companyName),
        billingAddress: norm(inv.client?.billingAddress) || "-",
        state: norm(inv.client?.state) || SUPPLIER_STATE,
        stateCode: norm(inv.client?.stateCode) || "27"
      },
      items: inv.items?.length ? inv.items : [{
        serviceName: "Professional Services",
        description: "Services as per quotation",
        hsnSac: "9983",
        quantity: 1,
        unit: "Service",
        rate: 0,
        discount: 0,
        gstRate: 18
      }]
    });
  }

  function downloadInvoicePDF(inv = invoice) {
    const downloadableInvoice = invoiceForDownload(inv);
    invoice = downloadableInvoice;
    refreshLivePreview();
    const blob = makeInvoicePDF(downloadableInvoice);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${norm(downloadableInvoice.invoiceNumber).replace(/[^A-Za-z0-9-]+/g, "-") || "praavi-invoice"}.pdf`;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }

  function renderModal(errors = {}) {
    if (!modal) return;
    modal.innerHTML = `
      <div class="praavi-modal">
        <div class="praavi-modal-header">
          <div><h2>Generate Invoice</h2><p>Review quotation details, adjust invoice fields, then preview, save, print or share.</p></div>
          <button type="button" data-close>Close</button>
        </div>
        ${lockHTML(errors.lock)}
        <div class="praavi-modal-body">
          <div>
            <section class="praavi-panel"><h3>Invoice Details</h3><div class="praavi-form-grid">
              ${field("Document Prefix", "prefix")}
              ${field("Financial Year", "financialYear")}
              ${field("Sequence Number", "sequenceNumber", "number")}
              ${field("Generated Invoice Number", "invoiceNumber")}
              ${field("Supplier Company", "supplierCompany", "text", ["Praavi Consultants", "Webakoof"])}
              ${field("Invoice Type", "invoiceType", "text", ["Standard Invoice", "Tax Invoice", "Proforma Invoice", "Advance Invoice", "Milestone Invoice", "Final Invoice"])}
              ${field("GST Option", "gstBilling", "text", ["With GST", "Without GST"])}
              ${field("Invoice Date", "invoiceDate", "date")}
              ${field("Due Date", "dueDate", "date")}
              ${field("Quotation Reference Number", "quotationNumber")}
              ${field("Purchase Order Number", "poNumber")}
              ${field("Purchase Order Date", "poDate", "date")}
              ${field("Project Name", "projectName")}
              ${field("Billing Period", "billingPeriod")}
              ${field("Place of Supply", "placeOfSupply")}
              ${field("Reverse Charge", "reverseCharge", "text", ["No", "Yes"])}
              ${field("Invoice Status", "status", "text", ["Draft", "Issued", "Sent", "Partially Paid", "Paid", "Overdue", "Cancelled"])}
            </div></section>
            <section class="praavi-panel"><h3>Client Details</h3><div class="praavi-form-grid">
              ${field("Client Name", "client.name")}
              ${field("Company Name", "client.companyName")}
              ${field("Email", "client.email", "email")}
              ${field("Phone", "client.phone")}
              ${field("GSTIN", "client.gstin")}
              ${field("PAN", "client.pan")}
              ${field("State", "client.state")}
              ${field("State Code", "client.stateCode")}
              ${textField("Billing Address", "client.billingAddress")}
              ${textField("Shipping Address", "client.shippingAddress")}
            </div></section>
            <section class="praavi-panel"><h3>Line Items</h3><div class="praavi-items-wrap"><table class="praavi-items"><thead><tr><th>Sr</th><th>Service / Item</th><th>Description</th><th>HSN / SAC</th><th>Qty</th><th>Unit</th><th>Rate</th><th>Discount</th><th>Taxable</th><th>GST %</th><th>Total</th><th>Actions</th></tr></thead><tbody>${renderItems()}</tbody></table></div><button type="button" data-add-item ${invoiceUnlocked ? "" : "disabled"}>Add Item</button><div class="praavi-error">${errors.items || ""}</div></section>
            <section class="praavi-panel"><h3>Charges, GST and Payment</h3><div class="praavi-form-grid">
              ${field("Tax Mode", "taxMode", "text", invoice.gstBilling === "Without GST" ? ["No GST"] : ["Intra-State", "Inter-State", "No GST", "Custom Tax"])}
              ${field("Overall Discount", "overallDiscount", "number")}
              ${field("Additional Charges", "additionalCharges", "number")}
              ${field("Delivery / Travel Charges", "travelCharges", "number")}
              ${field("Round Off", "roundOff", "number")}
              ${readonlyMoneyField("Grand Total", invoice.grandTotal, "grandTotal")}
              ${field("Amount Already Paid", "amountPaid", "number")}
              ${readonlyMoneyField("Balance Due", invoice.balanceDue, "balanceDue")}
              ${field("Payment Terms", "paymentTerms", "text", ["Due on Receipt", "Advance Payment", "7 Days", "15 Days", "30 Days", "45 Days", "60 Days", "Custom"])}
              ${field("Payment Method", "paymentMethod", "text", ["Bank Transfer", "UPI", "Cash", "Cheque", "Card", "Online Payment", "Other"])}
              ${field("Bank Name", "bankDetails.bankName")}
              ${field("Account Name", "bankDetails.accountName")}
              ${field("Account Number", "bankDetails.accountNumber")}
              ${field("IFSC Code", "bankDetails.ifsc")}
              ${field("Branch", "bankDetails.branch")}
              ${field("UPI ID", "bankDetails.upiId")}
              ${field("UPI QR Code", "bankDetails.upiQrCode")}
              ${field("Payment Link", "bankDetails.paymentLink")}
              ${textField("Notes", "notes")}
              ${textField("Terms and Conditions", "terms")}
            </div><h3 style="margin:14px 0 8px">Payment History</h3>${paymentHistoryHTML(invoice)}</section>
          </div>
          <aside>
            <section class="praavi-panel">
              <h3>Invoice Preview</h3>
              <div class="praavi-preview-toolbar"><button type="button" data-zoom-out>Zoom Out</button><button type="button" data-zoom-in>Zoom In</button><button type="button" data-fit>Fit</button><button type="button" data-refresh>Refresh</button></div>
              <div class="praavi-preview-shell"><div class="praavi-print-root" style="width:${Math.ceil(794 * zoom)}px;min-height:${Math.ceil(1123 * zoom)}px"><div class="praavi-print-scale" style="transform:scale(${zoom})">${previewHTML()}</div></div></div>
            </section>
          </aside>
        </div>
        <div class="praavi-modal-footer">
          <strong data-footer-total>Grand Total: ${fmt(invoice.grandTotal)} | Balance Due: ${fmt(invoice.balanceDue)}</strong>
          <div class="praavi-modal-actions"><button type="button" data-save-draft ${invoiceUnlocked ? "" : "disabled"}>Save Draft</button><button type="button" data-save-issued ${invoiceUnlocked ? "" : "disabled"}>Mark Issued</button><button type="button" data-mark-paid ${invoiceUnlocked ? "" : "disabled"}>Mark Paid</button><button type="button" data-record-payment ${invoiceUnlocked ? "" : "disabled"}>Record Payment</button><button type="button" data-download>Download PDF</button><button type="button" data-print>Print</button><button type="button" data-whatsapp>WhatsApp</button><button type="button" data-email>Email</button></div>
        </div>
      </div>`;

    modal.querySelector("[data-unlock-invoice]")?.addEventListener("click", () => {
      const pin = norm(modal.querySelector("[data-invoice-pin]")?.value);
      const expectedPin = localStorage.getItem(INVOICE_EDIT_PIN_KEY) || DEFAULT_INVOICE_EDIT_PIN;
      if (pin !== expectedPin) {
        renderModal({ lock: "Incorrect numeric password." });
        return;
      }
      invoiceUnlocked = true;
      sessionStorage.setItem("praavi_invoice_edit_unlocked", "true");
      renderModal();
    });
    modal.querySelector("[data-invoice-pin]")?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") modal.querySelector("[data-unlock-invoice]")?.click();
    });
    modal.querySelector("[data-lock-invoice]")?.addEventListener("click", () => {
      invoiceUnlocked = false;
      sessionStorage.removeItem("praavi_invoice_edit_unlocked");
      renderModal();
    });

    Object.entries(errors).forEach(([key, message]) => {
      const slot = modal.querySelector(`[data-error="${CSS.escape(key)}"], [data-error="${CSS.escape(key.replace("clientName", "client.name").replace("billingAddress", "client.billingAddress"))}"]`);
      if (slot) slot.textContent = message;
    });

    modal.querySelectorAll("[data-path]").forEach((el) => {
      const liveEvent = el.tagName === "SELECT" ? "change" : "input";
      el.addEventListener(liveEvent, (event) => {
        set(event.target.dataset.path, event.target.value, false);
        if (["prefix", "financialYear", "sequenceNumber"].includes(event.target.dataset.path)) {
          const numberInput = modal.querySelector('[data-path="invoiceNumber"]');
          if (numberInput) numberInput.value = invoice.invoiceNumber;
        }
        if (event.target.dataset.path === "paymentTerms") {
          const dueDateInput = modal.querySelector('[data-path="dueDate"]');
          if (dueDateInput) dueDateInput.value = invoice.dueDate;
        }
        modal.querySelectorAll("[data-live-money]").forEach((input) => {
          const key = input.dataset.liveMoney;
          input.value = fmt(invoice[key] || 0);
        });
        if (event.target.dataset.path === "gstBilling") {
          const taxModeInput = modal.querySelector('[data-path="taxMode"]');
          if (taxModeInput) taxModeInput.value = invoice.taxMode;
        }
        if (event.target.dataset.path === "supplierCompany") {
          const prefixInput = modal.querySelector('[data-path="prefix"]');
          const numberInput = modal.querySelector('[data-path="invoiceNumber"]');
          const accountNameInput = modal.querySelector('[data-path="bankDetails.accountName"]');
          if (prefixInput) prefixInput.value = invoice.prefix;
          if (numberInput) numberInput.value = invoice.invoiceNumber;
          if (accountNameInput) accountNameInput.value = invoice.bankDetails.accountName;
          renderModal();
        }
      });
    });
    modal.querySelectorAll("[data-item]").forEach((el) => el.addEventListener("input", (event) => {
      const clone = structuredClone(invoice);
      clone.items[Number(event.target.dataset.item)][event.target.dataset.key] = event.target.value;
      invoice = calculateTotals(clone);
      refreshLivePreview();
    }));
    modal.querySelector("[data-add-item]")?.addEventListener("click", () => {
      invoice.items.push({ serviceName: "", description: "", hsnSac: "9983", quantity: 1, unit: "Service", rate: 0, discount: 0, gstRate: 18 });
      invoice = calculateTotals(invoice);
      renderModal();
    });
    modal.querySelectorAll("[data-duplicate]").forEach((el) => el.addEventListener("click", () => {
      invoice.items.splice(Number(el.dataset.duplicate) + 1, 0, { ...invoice.items[Number(el.dataset.duplicate)] });
      invoice = calculateTotals(invoice);
      renderModal();
    }));
    modal.querySelectorAll("[data-remove]").forEach((el) => el.addEventListener("click", () => {
      invoice.items.splice(Number(el.dataset.remove), 1);
      invoice = calculateTotals(invoice);
      renderModal();
    }));
    modal.querySelectorAll("[data-up]").forEach((el) => el.addEventListener("click", () => {
      const i = Number(el.dataset.up);
      if (i > 0) [invoice.items[i - 1], invoice.items[i]] = [invoice.items[i], invoice.items[i - 1]];
      invoice = calculateTotals(invoice);
      renderModal();
    }));
    modal.querySelectorAll("[data-down]").forEach((el) => el.addEventListener("click", () => {
      const i = Number(el.dataset.down);
      if (i < invoice.items.length - 1) [invoice.items[i + 1], invoice.items[i]] = [invoice.items[i], invoice.items[i + 1]];
      invoice = calculateTotals(invoice);
      renderModal();
    }));
    modal.querySelector("[data-close]")?.addEventListener("click", () => modal.classList.remove("is-open"));
    modal.querySelector("[data-save-draft]")?.addEventListener("click", () => saveInvoice("Draft"));
    modal.querySelector("[data-save-issued]")?.addEventListener("click", () => saveInvoice("Issued"));
    modal.querySelector("[data-mark-paid]")?.addEventListener("click", () => {
      invoice = calculateTotals({ ...invoice, status: "Paid", amountPaid: invoice.grandTotal });
      saveInvoice("Paid");
    });
    modal.querySelector("[data-record-payment]")?.addEventListener("click", () => {
      if (saveInvoice(invoice.status || "Draft")) openPaymentModal(invoice);
    });
    modal.querySelector("[data-print]")?.addEventListener("click", () => { if (saveInvoice(invoice.status || "Draft")) window.print(); });
    modal.querySelector("[data-download]")?.addEventListener("click", () => downloadInvoicePDF());
    modal.querySelector("[data-whatsapp]")?.addEventListener("click", () => window.open(`https://wa.me/?text=${encodeURIComponent(`Invoice ${invoice.invoiceNumber} from ${invoice.supplier?.name || invoice.supplierCompany || "Praavi Consultants"}. Balance due: ${fmt(invoice.balanceDue)}`)}`, "_blank", "noopener"));
    modal.querySelector("[data-email]")?.addEventListener("click", () => window.location.href = `mailto:${invoice.client.email || ""}?subject=${encodeURIComponent(`Invoice ${invoice.invoiceNumber}`)}&body=${encodeURIComponent(`Please find invoice ${invoice.invoiceNumber}. Balance due: ${fmt(invoice.balanceDue)}.`)}`);
    modal.querySelector("[data-zoom-in]")?.addEventListener("click", () => { zoom = Math.min(1.2, zoom + 0.1); renderModal(); });
    modal.querySelector("[data-zoom-out]")?.addEventListener("click", () => { zoom = Math.max(0.45, zoom - 0.1); renderModal(); });
    modal.querySelector("[data-fit]")?.addEventListener("click", () => { zoom = 0.42; renderModal(); });
    modal.querySelector("[data-refresh]")?.addEventListener("click", () => renderModal());
  }

  function clickExisting(pattern) {
    const button = [...document.querySelectorAll("button, a")].find((el) => pattern.test(el.textContent || "") && !el.closest(".praavi-doc-actions") && !el.closest(".praavi-doc-tabs"));
    button?.click();
  }

  function openInvoice() {
    invoice = createDraft();
    modal.classList.add("is-open");
    renderModal();
  }

  function addInvoiceTab() {
    if (document.querySelector("[data-praavi-invoice-tab]")) return;
    const scopeTab = [...document.querySelectorAll("button, a")].find((el) => /scope of work/i.test(el.textContent || "") && !el.closest(".praavi-doc-actions"));
    const quoteTab = [...document.querySelectorAll("button, a")].find((el) => /^quotation$/i.test((el.textContent || "").trim()) && !el.closest(".praavi-doc-actions"));
    const parent = quoteTab?.parentElement || scopeTab?.parentElement;
    if (!parent) return;
    const tab = document.createElement("button");
    tab.type = "button";
    tab.textContent = "Invoice";
    tab.className = quoteTab?.className || scopeTab?.className || "praavi-existing-invoice-tab";
    tab.classList.add("praavi-existing-invoice-tab");
    tab.dataset.praaviInvoiceTab = "true";
    tab.addEventListener("click", openInvoice);
    (quoteTab || scopeTab).insertAdjacentElement("afterend", tab);
  }

  function findDocumentTabContainer() {
    const scopeTab = [...document.querySelectorAll("button, a")].find((el) => /scope of work/i.test(el.textContent || "") && !el.closest(".praavi-doc-actions"));
    const quoteTab = [...document.querySelectorAll("button, a")].find((el) => /^quotation$/i.test((el.textContent || "").trim()) && !el.closest(".praavi-doc-actions"));
    return quoteTab?.parentElement || scopeTab?.parentElement || null;
  }

  function mountActions() {
    const root = document.getElementById("root");
    if (!root || !root.children.length) return;
    const h1 = [...document.querySelectorAll("h1")].find((el) => /Praavi Quotation|Quotation/i.test(el.textContent || ""));
    if (h1) {
      h1.textContent = "Praavi Quotation & Scope Generator";
    }
    addInvoiceTab();
  }

  function renderDashboard() {
    const node = document.querySelector(".praavi-invoice-dashboard");
    if (!node) return;
    const records = loadJSON(STORE_KEY, []).filter((item) => !item.archived);
    const sum = (items, key) => items.reduce((total, item) => total + asNumber(item[key]), 0);
    const overdue = records.filter((item) => item.balanceDue > 0 && item.dueDate < todayISO() && !["Paid", "Cancelled"].includes(item.status));
    node.innerHTML = `<h2>Invoice Summary</h2><div class="praavi-dashboard-grid">
      ${[
        ["Total Invoices", records.length], ["Draft Invoices", records.filter((i) => i.status === "Draft").length],
        ["Unpaid Invoices", records.filter((i) => i.balanceDue > 0).length], ["Paid Invoices", records.filter((i) => i.status === "Paid").length],
        ["Overdue Invoices", overdue.length], ["Total Invoiced", fmt(sum(records, "grandTotal"))],
        ["Total Received", fmt(sum(records, "amountPaid"))], ["Outstanding Amount", fmt(sum(records, "balanceDue"))]
      ].map(([label, value]) => `<div class="praavi-metric"><span>${label}</span><strong>${value}</strong></div>`).join("")}
    </div>`;
  }

  function renderHistory() {
    const node = document.querySelector(".praavi-invoice-history");
    if (!node) return;
    const records = loadJSON(STORE_KEY, []).filter((item) => !item.archived);
    node.innerHTML = `<h2>Saved Invoices</h2><p>Search, edit, duplicate, print, record payments, or archive invoice records.</p>
      <div class="praavi-form-grid" style="margin-top:12px"><div class="praavi-field"><label>Search</label><input data-history-search placeholder="Invoice, client, project"></div><div class="praavi-field"><label>Status</label><select data-history-status><option>All</option><option>Draft</option><option>Issued</option><option>Sent</option><option>Partially Paid</option><option>Paid</option><option>Overdue</option><option>Cancelled</option></select></div></div>
      <div class="praavi-history-wrap" style="margin-top:12px"><table class="praavi-history-table"><thead><tr><th>Invoice Number</th><th>Client</th><th>Project</th><th>Invoice Date</th><th>Due Date</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th><th>Created By</th><th>Last Updated</th><th>Actions</th></tr></thead><tbody data-history-body></tbody></table></div>`;
    const body = node.querySelector("[data-history-body]");
    const paint = () => {
      const q = norm(node.querySelector("[data-history-search]").value).toLowerCase();
      const status = node.querySelector("[data-history-status]").value;
      body.innerHTML = records
        .filter((item) => status === "All" || item.status === status)
        .filter((item) => !q || [item.invoiceNumber, item.client?.name, item.client?.companyName, item.projectName].join(" ").toLowerCase().includes(q))
        .map((item) => `<tr><td>${item.invoiceNumber}</td><td>${item.client?.companyName || item.client?.name || "-"}</td><td>${item.projectName || "-"}</td><td>${item.invoiceDate}</td><td>${item.dueDate}</td><td>${fmt(item.grandTotal)}</td><td>${fmt(item.amountPaid)}</td><td>${fmt(item.balanceDue)}</td><td><span class="praavi-status">${item.status}</span></td><td>${item.createdBy || "-"}</td><td>${new Date(item.updatedAt || item.createdAt).toLocaleString()}</td><td><button data-view="${item.id}" class="praavi-table-action">View/Edit</button><button data-copy="${item.id}" class="praavi-table-action">Duplicate</button><button data-pay="${item.id}" class="praavi-table-action">Record Payment</button><button data-sent="${item.id}" class="praavi-table-action">Mark Sent</button><button data-paid="${item.id}" class="praavi-table-action">Mark Paid</button><button data-cancel="${item.id}" class="praavi-table-action">Cancel</button><button data-archive="${item.id}" class="praavi-table-action">Archive</button></td></tr>`).join("");
      body.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => historyAction(button)));
    };
    node.querySelector("[data-history-search]").addEventListener("input", paint);
    node.querySelector("[data-history-status]").addEventListener("change", paint);
    paint();
  }

  function historyAction(button) {
    const records = loadJSON(STORE_KEY, []);
    const key = Object.keys(button.dataset)[0];
    const id = button.dataset[key];
    const index = records.findIndex((item) => item.id === id);
    if (index < 0) return;
    if (key === "view") {
      invoice = calculateTotals(records[index]);
      modal.classList.add("is-open");
      renderModal();
    } else if (key === "copy") {
      const fy = getFinancialYear();
      const seq = nextSequence("INV", fy);
      invoice = calculateTotals({ ...records[index], id: crypto.randomUUID(), status: "Draft", financialYear: fy, sequenceNumber: seq, invoiceNumber: buildNumber({ prefix: settings().invoicePrefix, type: "INV", financialYear: fy, sequenceNumber: seq }), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      modal.classList.add("is-open");
      renderModal();
    } else if (key === "pay") openPaymentModal(records[index]);
    else if (key === "archive" && confirm("Archive this invoice?")) records[index].archived = true;
    else if (key === "sent") records[index].status = "Sent";
    else if (key === "paid") records[index] = calculateTotals({ ...records[index], amountPaid: records[index].grandTotal, status: "Paid" });
    else if (key === "cancel" && confirm("Cancel this invoice?")) records[index].status = "Cancelled";
    saveJSON(STORE_KEY, records);
    renderDashboard();
    renderHistory();
  }

  function init() {
    if (!document.querySelector('link[href$="invoice-module.css"]')) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "/internal/quote-tool/myadmin/invoice-module.css";
      document.head.appendChild(css);
    }
    modal = document.createElement("div");
    modal.className = "praavi-modal-backdrop";
    document.body.appendChild(modal);
    paymentModal = document.createElement("div");
    paymentModal.className = "praavi-payment-backdrop";
    document.body.appendChild(paymentModal);
    const timer = setInterval(mountActions, 500);
    setTimeout(() => clearInterval(timer), 15000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  window.PraaviInvoice = { getFinancialYear, calculateTotals, amountToIndianWords, buildNumber };
})();
