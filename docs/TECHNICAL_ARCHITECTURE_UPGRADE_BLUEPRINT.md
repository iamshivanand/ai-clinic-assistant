# AI Clinic Assistant: Technical Architecture Upgrade & Gap-Closure Engineering Blueprint

> **Reference Source**: [Google Docs Reference Document](https://docs.google.com/document/d/1OchFFx6jTpY5PnbcJ9IdrlPKDvjymsVI9tSWiO2Rpqs/edit?usp=sharing)  
> **Repository Target**: `ai-clinic-assistant`  
> **Status**: Approved Architectural Upgrade Specification

---

## 1. Executive Summary & Architectural Delta

The existing stack (`Node.js / Express 5`, `MongoDB / Mongoose`, `Redis`, `BullMQ`, `Socket.io` with Redis Adapter, and `React 19 + Vite 8 + Zustand`) already solves webhook ingestion, signature validation, basic multi-tenancy, and real-time chat synchronization.

However, the current implementation operates as a **Deterministic State-Machine Chatbot** (`botWorker.js` + `sessionManager.js`) coupled with a web portal. To support an enterprise multimodal clinical platform—including Doctor Voice-to-Prescription, Multimodal Lab/Medicine Vision OCR, WhatsApp Flows, Family Multi-Profile Switching, Live OPD Token Tracking, and Front-Desk Fraud Auditing—this blueprint defines the exact file-by-file engineering roadmap to upgrade the repository without breaking production modules.

---

## 2. File-by-File Gap Analysis (Current vs. Target Architecture)

| Existing File / Module | Current Implementation | Critical Bottleneck / Gap | Exact Upgrade Action Required |
| :--- | :--- | :--- | :--- |
| **`workers/botWorker.js`** | Assumes every incoming WhatsApp message is from a Patient and steps through a rigid state machine. | Doctors cannot message the bot to dictate Voice Rx or trigger queue delays; patients sending voice notes or lab images mid-flow break the state machine. | Split into a top-level **Role Router** (`botWorker.js`) that dispatches to `doctorBotHandler.js` (if sender phone matches a clinic Doctor) or `patientBotHandler.js` (Hybrid LLM Intent + WhatsApp Flows). |
| **`queues/index.js`** | Only defines `message-queue` and `notification-queue`. | Heavy media jobs (downloading 5MB PDFs, Whisper audio transcription, Vision OCR, PDF generation) will stall fast text responses if processed on `message-queue`. | Add a 3rd BullMQ queue: **`ai-media-queue`** (`workers/aiMediaWorker.js`) with isolated concurrency (`concurrency: 5`) and retry backoff. |
| **`services/prescriptionService.js`** | Uses `html-pdf-node` (spawns headless Chromium/Puppeteer) and stores PDFs in MongoDB or local disk. | **Severe OOM Crash Risk**: Chromium consumes 250–400MB RAM per concurrent PDF. Storing PDFs on local disk or MongoDB bloats working-set RAM. | Replace `html-pdf-node` with **`pdfkit`** (renders in <40ms using <15MB RAM) and stream PDFs directly to Cloudflare R2 / AWS S3. |
| **`models/Patient.js`** | Indexes phone as a single patient entity per clinic. | In India, 1 WhatsApp number manages bookings for 3–5 family members (Self, Kids, Parents). Current schema overwrites names/ages and merges medical histories. | Refactor `Patient.js` to include a `familyMembers[]` sub-document array and `activeMemberId` in Redis session state. |
| **`models/Clinic.js`** | Stores `metaAccessToken` in plain text inside MongoDB. | **Security Vulnerability**: Database dump exposes permanent WABA tokens for every onboarded clinic. | Encrypt `metaAccessToken` at rest using Node native `crypto` (**AES-256-GCM**) with an environment master key (`ENCRYPTION_MASTER_KEY`). |
| **`models/User.js`** | Only supports `DOCTOR` and `SUPER_ADMIN` roles. | Giving the front-desk receptionist the `DOCTOR` login exposes clinic revenue, allows deleting walk-in billing logs, and compromises prescription integrity. | Add **`RECEPTIONIST`** and **`PHARMACIST`** roles to `User.js` and enforce route/UI restrictions in `authMiddleware.js` and `ProtectedRoute.jsx`. |
| **`services/whatsappService.js`** | Uses Meta Graph API `v18.0` with basic interactive buttons/lists and external Razorpay links. | `v18.0` faces deprecation; multi-message text trees cause 40% booking drop-off compared to single-screen forms. | Upgrade base URL to **`v21.0+`** and add helper methods for **WhatsApp Flows** (`type: "flow"`) and **Native WhatsApp UPI** (`type: "order_details"`). |
| **`models/Appointment.js` & `Message.js`** | Missing composite indexes identified in production audit. | Full-collection scans (`COLLSCAN`) as clinic appointment and chat histories scale past 50,000 documents. | Add exact compound indexes for `(clinicId, date, status, tokenNumber)` and `(clinicId, patientId, createdAt)`. |

---

## 3. Database Schema Upgrades (Mongoose Models)

### 3.1 `models/Clinic.js` (AES-256 Encryption & Prepaid Ledger)
- **AES-256-GCM Token Encryption**: Native Node `crypto` helpers for `encryptToken()` / `decryptToken()`.
- **Prepaid Message Wallet**: `messageWalletBalance: { type: Number, default: 1500 }`.
- **Paywall Gatekeeper Settings**: `freeFollowUpDays: { type: Number, default: 5 }`, `postVisitQueryFee: { type: Number, default: 200 }`.
- **Branding & Social**: `googleReviewLink: { type: String }`, `letterheadConfig: { logoUrl, headerHtml, footerText, signatureUrl }`.
- **Plans**: `subscriptionPlan: { type: String, enum: ['STARTER_1999', 'PRO_3499', 'POLYCLINIC_7999'] }`.

### 3.2 `models/Patient.js` (One-Phone Family Health Vault)
- **Family Profiles**: Sub-document array `familyMembers[]` containing:
  - `memberId`, `name`, `age`, `dob` (for pediatric vaccine tracking), `gender`, `relation` (`SELF`, `SPOUSE`, `CHILD`, `PARENT`, `OTHER`), `abhaId`, `bloodGroup`, `allergies[]`, `chronicConditions[]`.
- **Active Member Pointer**: `activeMemberId: { type: String, default: 'M1' }`.
- **Follow-up Paywall Timestamp**: `freeChatWindowExpiresAt: { type: Date }`.
- **Compound Indexes**:
  - `{ clinicId: 1, phone: 1 }` (unique)
  - `{ clinicId: 1, 'familyMembers.chronicConditions': 1 }`

### 3.3 `models/Appointment.js` (Live OPD Token Queue & Fraud Auditor)
- **Tokens & Queue**:
  - `familyMemberId: { type: String, required: true }`
  - `tokenNumber: { type: Number, required: true }` (daily auto-incrementing per clinic/doctor/date)
  - `appointmentType: { type: String, enum: ['IN_CLINIC', 'VIDEO_CONSULT', 'WHATSAPP_QUERY', 'FOLLOW_UP'] }`
  - `queueStatus: { type: String, enum: ['BOOKED', 'WAITING_OUTSIDE', 'IN_CABIN', 'COMPLETED', 'SKIPPED', 'CANCELLED'] }`
  - `estimatedTurnTime: { type: Date }` (dynamically updated by Doctor's "Delay X" commands)
- **AI Triage Pre-Read**:
  - `triageSummary: { rawVoiceUrl, symptomsTranslated, severityFlag: ['ROUTINE', 'URGENT_RED_FLAG'], aiPreReadBullets: [String] }`
- **Front-Desk Billing Audit**:
  - `billingAudit: { feeAmount, paymentMode: ['WHATSAPP_UPI', 'CASH_AT_DESK', 'UNPAID'], collectedByUserId, rxGeneratedInCabin: Boolean, isDiscrepancyFlagged: Boolean }`

### 3.4 `models/Prescription.js` (Voice Rx, Audio Explainer & Chronic Loops)
- `doctorVoiceNoteUrl`: Storage URL of doctor's dictation.
- `pdfUrl`: Cloudflare R2 URL of PDFKit prescription.
- `patientAudioExplainerUrl`: Regional/Hindi TTS voice note.
- `chiefComplaints[]`, `vitals: { bp, pulse, temp, weight, spo2 }`, `diagnosisTags[]`.
- `advisedProcedure: { name, estimatedCost, dripStatus }`.
- `labTestsAdvised: [{ testName, isFasting, sampleCollected }]`.
- `followUpCampaignStatus: { day3CheckSent, refillReminderSent, followUpBooked }`.

### 3.5 New Model: `models/MedicalRecord.js` (Vision OCR & Health Vault)
- `recordType: ['LAB_REPORT', 'OLD_HANDWRITTEN_RX', 'MEDICINE_STRIP_CHECK', 'HOME_VITALS_LCD', 'MEAL_PLATE_PHOTO', 'PROGRESS_PHOTO']`
- `mediaUrl`: Storage URL.
- `extractedBiomarkers: [{ name, value, unit, referenceRange, isAbnormal }]`.
- `aiSummaryBullets: [String]` (presented to doctor in cockpit).
- `safetyVerificationResult: { isMatchWithActiveRx, discrepancyWarning }`.

---

## 4. Worker & Queue Pipeline

### 4.1 Dedicated `ai-media-queue` (`queues/index.js`)
Separate heavy background AI processing (Whisper/Sarvam STT, Gemini Vision OCR, TTS generation, PDFKit) from text messaging to guarantee sub-100ms conversational routing.

### 4.2 Top-Level Role Dispatcher (`workers/botWorker.js`)
- Checks if sender phone number matches a registered `Doctor` in the clinic cache.
- Dispatches to **`doctorBotHandler.js`** or **`patientBotHandler.js`**.

### 4.3 Doctor WhatsApp Bot (`workers/doctorBotHandler.js`)
- **Doctor Voice Rx Dictation**:
  1. Doctor sends WhatsApp voice note (`.ogg`).
  2. STT extracts structured symptoms, vitals, medicines, dosages, and instructions.
  3. Fuzzy match against 250,000+ Indian Medicine dataset.
  4. Generates PDFKit prescription; returns interactive draft to Doctor WhatsApp with `[✅ Approve & Send Rx]` and `[🎙️ Edit]`.
  5. Upon approval: dispatches PDF to patient, triggers 30s vernacular audio explainer, advances OPD token queue, notifies next 3 waiting patients, and notifies pharmacy desk.
- **Doctor Commands**:
  - `"Delay 45"`: Shifts estimated turn times for remaining booked patients and triggers bulk WhatsApp notifications.
  - `"Status"`: Instant summary of waiting patients, today's OPD count, and UPI vs. Cash totals.

### 4.4 Patient 3-Layer Hybrid Pipeline (`workers/patientBotHandler.js`)
- **Layer 1: Deterministic Flows & Buttons (0ms, ₹0 AI cost)**: Handles WhatsApp Flow (`nfm_reply`) for 1-screen bookings and Native WhatsApp UPI (`order_details`).
- **Layer 2: Post-Visit Paywall Gatekeeper**:
  - Free consultation follow-up within 5 days.
  - After 5 days, holds clinical queries and prompts with 1-tap UPI fee (₹200) for doctor review.
- **Layer 3: Multimodal AI Router**:
  - Transcribes voice notes (Sarvam AI / Whisper).
  - Processes images (Gemini 2.5 Flash Vision): Lab report OCR, Medicine Strip cross-verification, and Home Vitals LCD reading.

### 4.5 Automated Revenue & Retention Engine (`workers/notificationWorker.js`)
1. **Sentiment-Gated Google Review Booster**: At `visitCompleted + 2 hours`, prompts 1-5 rating. If 4-5 stars, sends public Google Maps link; if 1-3 stars, routes to private feedback and alerts manager.
2. **Day-3 Acute Recovery Check-In**: Follows up on acute symptoms; offers 1-tap rebooking if unresolved.
3. **Day-25 Chronic Refill Loop**: Reminds chronic patients 3 days before medication runs out.
4. **Waitlist Flash-Fill Engine**: Automatically broadcasts cancelled slots to next-day waitlisted patients.
5. **Nightly 9:30 PM CEO Briefing & Fraud Audit**: Sends daily OPD stats, cash vs. UPI breakdown, hours saved, and highlights billing mismatches (Rx generated in cabin but reception marked UNPAID).

---

## 5. Frontend Cockpit & Role Split (`frontend/`)

1. **Role-Based Views**:
   - **`RECEPTIONIST` View**: Live OPD Token Manager (Walk-in token generation, call next, cash collection, Rx printing). Hides sensitive clinic revenue and audit logs.
   - **`DOCTOR` View**: Distraction-free "In-Cabin Cockpit"—patient AI summary bullets, lab sparklines, 1-click browser dictation backup, fraud audit badge.
   - **`PHARMACIST / LAB` View**: Real-time Socket.io board (`pharmacy:new_rx`) to pack medicines before the patient exits the cabin.
2. **Pricing Plans in `LandingPage.jsx`**:
   - **Solo Doctor Starter**: ₹1,999/month (24/7 AI Receptionist, Live Queue, Voice-to-Rx, 1,500 credits).
   - **Clinic AI Pro**: ₹3,499/month (Vision Lab OCR, Pill Safety Checker, Audio Rx Explainer, GMB Review Booster, Refill Loops, 3,000 credits).
   - **Polyclinic / Multi-Specialty**: ₹7,999/month (5 Doctors, Pharmacy/Lab Routing, Consultant Split Ledger, 10,000 credits).

---

## 6. Phased 14-Day Sprint Execution Plan

```
[Day 1-2] Core Infra, Security & Models
  ├── Compound Indexes (Appointment, Message, Prescription)
  ├── AES-256-GCM Token Encryption in Clinic.js
  ├── Replace html-pdf-node with PDFKit + R2/S3
  └── User Roles: RECEPTIONIST & PHARMACIST

[Day 3-5] Doctor Voice Rx & Dispatch Engine
  ├── Dedicated ai-media-queue & aiMediaWorker.js
  ├── Doctor-vs-Patient Role Router in botWorker.js
  └── doctorBotHandler.js (Voice STT -> Drug DB -> PDFKit -> Approve)

[Day 6-8] Family Profiles & WhatsApp Flows
  ├── Patient.js familyMembers[] schema upgrade
  ├── Meta WhatsApp Flow (v21.0) & Native UPI
  └── Live OPD Token Queue & "Delay X" broadcast

[Day 9-11] Vision OCR & Health Vault
  ├── MedicalRecord.js model
  └── Vision pipeline (Lab Report OCR, Pill Strip, BP LCD)

[Day 12-14] Revenue Engines, Fraud Audit & Frontend Cockpit
  ├── Sentiment-Gated GMB Review Booster
  ├── Day-3 / Day-25 Automated Follow-up Loops
  ├── Nightly 9:30 PM CEO Audit Briefing
  ├── Post-Visit Paywall Gatekeeper (5-day limit)
  └── AdminLayout / Dashboard Role-based Cockpit & Landing Page Pricing
```

