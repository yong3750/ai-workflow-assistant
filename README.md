# AI Workflow Assistant for Service Teams

Sample portfolio project for Upwork profile development.

This project demonstrates a practical AI-style workflow assistant for service businesses, agencies, and support teams. It turns inbound client messages into structured operations output:

- Intent classification
- Priority and SLA estimate
- Client reply draft
- Automation plan
- Queue filtering
- JSON handoff export
- Responsive dashboard layout

The public demo uses a deterministic local analysis engine so it can run safely without API keys. In a real client project, the same interface can be connected to an LLM API, CRM, ticketing system, email inbox, spreadsheet, or database.

## Why This Exists

Many small teams receive work through email, Upwork messages, web forms, Slack, and spreadsheets. The first bottleneck is not always building a large AI system. Often it is:

1. Cleanly categorizing inbound work
2. Drafting a consistent first response
3. Turning vague requests into next actions
4. Exporting a handoff the team can trust

This demo shows how I would design that workflow before connecting production integrations.

## Features

- Inbound request queue with category filters
- High, medium, and low priority labels
- AI-style request analysis
- Reply draft generation
- Automation checklist generation
- New message testing form
- Queue export and selected handoff export
- Mobile responsive interface

## Tech Stack

- HTML
- CSS
- JavaScript
- Static JSON sample data

No build step is required.

## Run Locally

Open `index.html` directly in a browser, or serve the folder with any static file server.

```bash
python3 -m http.server 4180
```

Then open:

```text
http://127.0.0.1:4180
```

## Honest Portfolio Framing

This is a sample project, not a paid client project. It is designed to demonstrate workflow design, AI product thinking, frontend implementation, and automation handoff structure.
