# ElectroHub — Presentation Demo Guide & Quick Reference

This guide provides the exact commands, verified test accounts, and architecture walkthrough to run the live ElectroHub B2B procurement demo during tomorrow's presentation.

---

## 🚀 One-Command Demo Execution (Tomorrow's Presentation)

Both servers (Django on `http://127.0.0.1:8000` and Next.js on `http://localhost:3000`) are active and running.

To launch the automated live Chrome presentation:

### Option A: Command Prompt / PowerShell
```powershell
.\venv\Scripts\python.exe run_demo.py
```

### Option B: Windows Batch Runner
Double-click or run:
```cmd
run_demo.bat
```

*(Note: To run in silent background mode without popping up the Chrome browser window, add `--headless`: `.\venv\Scripts\python.exe run_demo.py --headless`)*

---

## 🔑 Demo Test Accounts

These existing accounts are pre-configured and verified in the database:

| Role | Email | Password | Primary Interfaces Tested |
| :--- | :--- | :--- | :--- |
| **Customer (Buyer)** | `demo_customer@test.com` | `Demo1234!` | Storefront, Voice Search, RFQ Wizard, Quotation Review & Acceptance, Payment Reference, Invoice PDF Download |
| **Admin (Staff / Approver)** | `demo_admin@test.com` | `Admin1234!` | Operations Dashboard, RFQ Mgmt, Quotation Builder, 3-Stage Approvals (HOD → Director → Accountant), Payment Confirmation |
| **Vendor (Supplier)** | `demo_vendor3@test.com` | `Demo1234!` | Vendor Workspace, Purchase Orders, PO Accept & Processing, Proforma Invoice, Logistics & Shipment Tracking |

---

## 📋 Complete End-to-End Flow Tested & Verified

1. **Discovery & Smart Search**:
   - Navigation to Homepage and Search page (`/search?q=raspberry`).
   - Voice Search microphone trigger & responsive suggestion filters.
   - B2B Catalogue exploration (`/shop`).

2. **Customer Login & B2B RFQ Submission**:
   - Login as `demo_customer@test.com`.
   - Access My Account (`/account` -> RFQ Section).
   - Complete 3-step RFQ wizard (Product: *Raspberry Pi 5 Enterprise Batch*, Quantity: 20 units, Location: *Bengaluru Tech Park*, Technical specifications: *8GB RAM with passive cooling*).
   - Submit and receive confirmation.

3. **Admin Review & Quotation Builder**:
   - Login as `demo_admin@test.com`.
   - Open Operations Dashboard (`/admin/dashboard`) showing live metrics & charts.
   - Switch to **RFQ Mgmt** -> inspect submitted RFQ -> change status to *Under Review*.
   - Launch **Quotation Builder** -> configure Unit Price (₹4,499), 5% volume discount, 18% GST, and shipping charge (₹250).
   - Dispatch quotation to customer.

4. **Customer Acceptance & PO Generation**:
   - Customer accesses My Account -> Quotations.
   - Review live line items, terms, and tax calculation -> click **Accept Quotation**.
   - Quotation status transitions to *Invoice Sent* -> Purchase Order auto-generated.

5. **Internal Multi-Level Approval Chain (HOD → Director → Accountant)**:
   - Admin accesses **Approvals** portal in Admin Dashboard:
     - **Stage 1 (HOD Queue)**: Reviews quotation -> submits approval remarks: *"Technical specifications, quantity and lead-time verified."* -> forwards to Director.
     - **Stage 2 (Director Queue)**: Reviews quotation -> submits approval remarks: *"Commercial budget, margin and high-value procurement authorized."* -> forwards to Accountant.
     - **Stage 3 (Accountant Queue)**: Reviews quotation -> submits approval remarks: *"GST breakdown, advance payment terms and fund allocation cleared."* -> marks **PO Ready**!
     - Approval status badge and chain indicator turn green (*PO Ready*).

6. **Vendor PO Processing & Logistics Tracking**:
   - Login as `demo_vendor3@test.com` -> open Vendor Purchase Orders (`/vendor/po`).
   - View newly issued PO with customer delivery details and product specifications.
   - Click **Accept PO** -> status changes to `ACCEPTED`.
   - Click **Mark as Processing** -> status changes to `PROCESSING`.
   - Click **Generate Proforma Invoice** -> Proforma Invoice linked.
   - Click **Update Shipment** -> set Carrier: *BlueDart Express*, Tracking: *BD-98452104IN*, status: *SHIPPED*.
   - Click **Update Shipment** -> set status: *DELIVERED*.
   - System updates order status to *DELIVERED* and activates the final GST Tax Invoice.

7. **Customer Payment & Final GST Tax Invoice Download**:
   - Customer views quotation -> records B2B payment reference (`HDFC982341872134`).
   - Opens the official GST Tax Invoice.
   - Direct binary PDF is generated and saved via Chrome's native A4 print engine.

---

## 📁 Artifacts & Output Locations

All demo outputs from the verified run are stored in:
`C:\Users\Ayushi\electrohub24\demo-output\`

### 1. Official Invoice PDF
- [ElectroHub_Final_GST_Invoice.pdf](file:///c:/Users/Ayushi/electrohub24/demo-output/ElectroHub_Final_GST_Invoice.pdf) (66 KB binary PDF document)

### 2. High-Resolution Screenshots
Located in `C:\Users\Ayushi\electrohub24\demo-output\screenshots\`:
- [01_voice_and_product_search.png](file:///c:/Users/Ayushi/electrohub24/demo-output/screenshots/01_voice_and_product_search.png)
- [02_shop_catalog.png](file:///c:/Users/Ayushi/electrohub24/demo-output/screenshots/02_shop_catalog.png)
- [03_customer_rfq_submitted.png](file:///c:/Users/Ayushi/electrohub24/demo-output/screenshots/03_customer_rfq_submitted.png)
- [04_admin_dashboard_overview.png](file:///c:/Users/Ayushi/electrohub24/demo-output/screenshots/04_admin_dashboard_overview.png)
- [05_admin_building_quotation.png](file:///c:/Users/Ayushi/electrohub24/demo-output/screenshots/05_admin_building_quotation.png)
- [06_admin_quotation_sent.png](file:///c:/Users/Ayushi/electrohub24/demo-output/screenshots/06_admin_quotation_sent.png)
- [07_customer_quotation_accepted.png](file:///c:/Users/Ayushi/electrohub24/demo-output/screenshots/07_customer_quotation_accepted.png)
- [08_approval_chain_completed.png](file:///c:/Users/Ayushi/electrohub24/demo-output/screenshots/08_approval_chain_completed.png)
- [09_vendor_po_fulfillment.png](file:///c:/Users/Ayushi/electrohub24/demo-output/screenshots/09_vendor_po_fulfillment.png)
- [10_customer_final_invoice_view.png](file:///c:/Users/Ayushi/electrohub24/demo-output/screenshots/10_customer_final_invoice_view.png)
- [11_chrome_invoice_print_view.png](file:///c:/Users/Ayushi/electrohub24/demo-output/screenshots/11_chrome_invoice_print_view.png)

---

## 🛠️ Server Management (If Restart Needed Tomorrow)

If you reboot your computer before tomorrow's presentation, start both servers with:

1. **Django Backend**:
   ```powershell
   .\venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000 --noreload
   ```
2. **Next.js Frontend**:
   ```powershell
   npm run dev
   ```
3. **Run Demo**:
   ```powershell
   .\venv\Scripts\python.exe run_demo.py
   ```
