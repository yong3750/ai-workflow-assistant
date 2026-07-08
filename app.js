const fallbackInbox = [
  {
    id: "req-101",
    client: "Bright Ledger Co.",
    channel: "Email",
    subject: "Invoice reminders and payment follow-up",
    message:
      "Can you automate reminders for overdue invoices and give our team a weekly list of clients who still have not paid? We use Stripe exports and a shared Google Sheet.",
    value: 1800,
    received: "09:10",
  },
  {
    id: "req-102",
    client: "Northstar Dental",
    channel: "Website form",
    subject: "Appointment CSV dashboard",
    message:
      "We need a simple dashboard that pulls appointment CSV files, flags missed follow-ups, and sends a weekly summary to the office manager.",
    value: 2400,
    received: "09:42",
  },
];

const state = {
  requests: [],
  selectedId: null,
  ready: new Set(),
};

const elements = {
  queueList: document.querySelector("#queueList"),
  queueFilter: document.querySelector("#queueFilter"),
  detailTitle: document.querySelector("#detailTitle"),
  detailPriority: document.querySelector("#detailPriority"),
  intentValue: document.querySelector("#intentValue"),
  sentimentValue: document.querySelector("#sentimentValue"),
  slaValue: document.querySelector("#slaValue"),
  requestBody: document.querySelector("#requestBody"),
  draftOutput: document.querySelector("#draftOutput"),
  automationPlan: document.querySelector("#automationPlan"),
  metricOpen: document.querySelector("#metricOpen"),
  metricHigh: document.querySelector("#metricHigh"),
  metricDrafts: document.querySelector("#metricDrafts"),
  metricValue: document.querySelector("#metricValue"),
  sidebarResolved: document.querySelector("#sidebarResolved"),
  messageForm: document.querySelector("#messageForm"),
  clientInput: document.querySelector("#clientInput"),
  channelInput: document.querySelector("#channelInput"),
  messageInput: document.querySelector("#messageInput"),
  copyDraft: document.querySelector("#copyDraft"),
  markReady: document.querySelector("#markReady"),
  exportQueue: document.querySelector("#exportQueue"),
  generateHandoff: document.querySelector("#generateHandoff"),
};

function includesAny(text, words) {
  return words.some((word) => text.includes(word));
}

function classifyRequest(request) {
  const text = `${request.subject} ${request.message}`.toLowerCase();
  let intent = "Workflow Automation";
  let category = "support";
  let priorityScore = 2;
  const plan = [];

  if (includesAny(text, ["ticket", "support", "login", "agent", "queue"])) {
    intent = "Support Triage";
    category = "support";
    priorityScore += 2;
    plan.push("Classify tickets by urgency, product area, and owner.");
    plan.push("Generate first-response drafts for repeat issues.");
    plan.push("Route high-risk tickets to a human before SLA breach.");
  } else if (includesAny(text, ["invoice", "payment", "paid", "stripe", "billing"])) {
    intent = "Billing Follow-up";
    category = "billing";
    priorityScore += 2;
    plan.push("Import invoice records from Stripe exports or a shared sheet.");
    plan.push("Detect overdue accounts and group them by owner and days late.");
    plan.push("Draft reminder emails and a weekly finance summary.");
  } else if (includesAny(text, ["lead", "prospect", "hubspot", "crm", "qualified"])) {
    intent = "Lead Qualification";
    category = "lead";
    priorityScore += 1;
    plan.push("Capture inbound form fields and normalize contact data.");
    plan.push("Score the lead based on budget, urgency, and fit signals.");
    plan.push("Create a CRM handoff with a suggested first reply.");
  } else if (includesAny(text, ["csv", "dashboard", "report", "summary", "vendor"])) {
    intent = "Reporting Automation";
    category = "support";
    priorityScore += 1;
    plan.push("Parse CSV uploads and validate missing or malformed rows.");
    plan.push("Build a dashboard with exceptions and weekly summary metrics.");
    plan.push("Export a manager-ready report with next actions.");
  }

  if (includesAny(text, ["urgent", "overdue", "missed", "backlog", "noisy"])) {
    priorityScore += 2;
  }

  const priority = priorityScore >= 4 ? "High" : priorityScore >= 3 ? "Medium" : "Low";
  const sentiment = includesAny(text, ["urgent", "missed", "backlog", "overdue", "noisy"])
    ? "Concerned"
    : "Neutral";
  const sla = priority === "High" ? "Respond today" : priority === "Medium" ? "24 hours" : "48 hours";

  return {
    ...request,
    intent,
    category,
    priority,
    sentiment,
    sla,
    plan,
    draft: buildReply(request, intent, sla),
  };
}

function buildReply(request, intent, sla) {
  return `Hi ${request.client},

Thanks for sharing the workflow. I can help turn this into a small, reliable automation rather than a manual process.

Based on your message, I would start by mapping the current data source, defining the key rules, and building a first version that produces a clear dashboard or handoff summary. For this ${intent.toLowerCase()} workflow, I would also include a human-review step so the team can approve the output before it affects clients.

Suggested first milestone:
1. Confirm inputs, owners, and success criteria.
2. Build a working prototype with sample data.
3. Add export, notification, or CRM handoff behavior.

I can respond within ${sla.toLowerCase()} with a concrete implementation plan and estimate.

Best,
Phil`;
}

function priorityClass(priority) {
  return `priority-${priority.toLowerCase()}`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function filteredRequests() {
  const filter = elements.queueFilter.value;
  if (filter === "all") return state.requests;
  if (filter === "high") return state.requests.filter((request) => request.priority === "High");
  return state.requests.filter((request) => request.category === filter);
}

function renderMetrics() {
  const highCount = state.requests.filter((request) => request.priority === "High").length;
  const totalValue = state.requests.reduce((sum, request) => sum + request.value, 0);

  elements.metricOpen.textContent = state.requests.length;
  elements.metricHigh.textContent = highCount;
  elements.metricDrafts.textContent = state.requests.length;
  elements.metricValue.textContent = formatCurrency(totalValue);
  elements.sidebarResolved.textContent = `${state.ready.size} workflows ready`;
}

function renderQueue() {
  const template = document.querySelector("#queueItemTemplate");
  elements.queueList.innerHTML = "";

  filteredRequests().forEach((request) => {
    const item = template.content.firstElementChild.cloneNode(true);
    item.dataset.id = request.id;
    item.classList.toggle("active", request.id === state.selectedId);
    item.querySelector(".queue-client").textContent = request.client;
    item.querySelector(".queue-priority").textContent = request.priority;
    item.querySelector(".queue-priority").classList.add(priorityClass(request.priority));
    item.querySelector(".queue-subject").textContent = request.subject;
    item.querySelector(".queue-meta").textContent = `${request.channel} - ${request.received} - ${formatCurrency(request.value)}`;
    item.addEventListener("click", () => selectRequest(request.id));
    elements.queueList.append(item);
  });
}

function selectRequest(id) {
  state.selectedId = id;
  const request = state.requests.find((item) => item.id === id);
  if (!request) return;

  elements.detailTitle.textContent = request.client;
  elements.detailPriority.textContent = request.priority;
  elements.detailPriority.className = `status-pill ${priorityClass(request.priority)}`;
  elements.intentValue.textContent = request.intent;
  elements.sentimentValue.textContent = request.sentiment;
  elements.slaValue.textContent = request.sla;
  elements.requestBody.textContent = request.message;
  elements.draftOutput.value = request.draft;
  elements.automationPlan.innerHTML = request.plan.map((step) => `<li>${step}</li>`).join("");
  renderQueue();
}

function addRequestFromForm(event) {
  event.preventDefault();
  const next = classifyRequest({
    id: `req-${Date.now()}`,
    client: elements.clientInput.value.trim(),
    channel: elements.channelInput.value,
    subject: "New workflow analysis",
    message: elements.messageInput.value.trim(),
    value: 2200,
    received: "Now",
  });
  state.requests = [next, ...state.requests];
  renderMetrics();
  renderQueue();
  selectRequest(next.id);
}

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function selectedRequest() {
  return state.requests.find((request) => request.id === state.selectedId);
}

async function loadInbox() {
  try {
    const response = await fetch("data/inbox.json");
    if (!response.ok) throw new Error("Could not load sample inbox.");
    const inbox = await response.json();
    state.requests = inbox.map(classifyRequest);
  } catch {
    state.requests = fallbackInbox.map(classifyRequest);
  }

  state.selectedId = state.requests[0]?.id || null;
  renderMetrics();
  renderQueue();
  if (state.selectedId) selectRequest(state.selectedId);
}

elements.queueFilter.addEventListener("change", renderQueue);
elements.messageForm.addEventListener("submit", addRequestFromForm);
elements.copyDraft.addEventListener("click", async () => {
  await navigator.clipboard.writeText(elements.draftOutput.value);
  elements.copyDraft.textContent = "Copied";
  setTimeout(() => {
    elements.copyDraft.textContent = "Copy";
  }, 1400);
});
elements.markReady.addEventListener("click", () => {
  if (state.selectedId) {
    state.ready.add(state.selectedId);
    renderMetrics();
  }
});
elements.exportQueue.addEventListener("click", () => {
  downloadJson("ai-workflow-queue.json", state.requests);
});
elements.generateHandoff.addEventListener("click", () => {
  const request = selectedRequest();
  if (!request) return;
  downloadJson("ai-workflow-handoff.json", {
    client: request.client,
    intent: request.intent,
    priority: request.priority,
    sla: request.sla,
    draft: request.draft,
    automationPlan: request.plan,
  });
});

loadInbox();
