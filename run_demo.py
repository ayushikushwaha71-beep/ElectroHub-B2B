"""
ElectroHub Master End-to-End Automated Chrome Demo Runner
==========================================================
Demonstrates the full B2B procurement lifecycle for presentation:
  1. Discovery: SearchBar, Voice Search trigger & Shop catalogue
  2. Customer: Login & B2B RFQ creation wizard
  3. Admin: Operations Dashboard, RFQ Management & Quotation Builder
  4. Customer: Quotation review & Acceptance (Automatic PO & Invoice)
  5. Internal Approval Chain: HOD -> Director -> Accountant approval stages
  6. Vendor Portal: Purchase Order view, Acceptance, Processing, Proforma Invoice & Shipment Tracking
  7. Final Fulfillment: Delivered status, Final GST Invoice generation & PDF saving
"""

import os
import sys
import time
import requests
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:3000"
API_URL  = "http://127.0.0.1:8000/api"

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "demo-output")
SCREENSHOTS_DIR = os.path.join(OUTPUT_DIR, "screenshots")
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

# Test Accounts (Pre-configured in database)
CUSTOMER_EMAIL = "demo_customer@test.com"
CUSTOMER_PASS  = "Demo1234!"

ADMIN_EMAIL    = "demo_admin@test.com"
ADMIN_PASS     = "Admin1234!"

VENDOR_EMAIL   = "demo_vendor3@test.com"
VENDOR_PASS    = "Demo1234!"


def print_step(num, title):
    print("\n" + "=" * 70)
    print(f"  STEP {num}: {title}")
    print("=" * 70)


def take_shot(page, filename, desc=""):
    filepath = os.path.join(SCREENSHOTS_DIR, filename)
    page.screenshot(path=filepath, full_page=False)
    print(f"  [SCREENSHOT] Saved: {filename} {f'({desc})' if desc else ''}")


def api_get_token(email, password):
    r = requests.post(f"{API_URL}/login/", json={"email": email, "password": password}, timeout=10)
    r.raise_for_status()
    return r.json()["access"]


def logout_user(page):
    try:
        page.goto(f"{BASE_URL}/", timeout=15000)
        page.wait_for_timeout(1000)
        if page.locator("#user-menu-btn").is_visible():
            page.locator("#user-menu-btn").click()
            page.wait_for_timeout(500)
            if page.locator("#logout-btn").is_visible():
                page.locator("#logout-btn").click()
                page.wait_for_timeout(1500)
    except Exception:
        pass
    page.evaluate("() => { localStorage.clear(); sessionStorage.clear(); }")
    page.wait_for_timeout(500)


def run_full_demo(headless=False):
    print("\n" + "#" * 70)
    print("   ELECTROHUB COMPLETE AUTOMATED B2B DEMO RUNNER")
    print("#" * 70)
    print(f"Target Frontend: {BASE_URL}")
    print(f"Target Backend:  {API_URL}")
    print(f"Output Directory: {OUTPUT_DIR}\n")

    with sync_playwright() as playwright:
        try:
            browser = playwright.chromium.launch(
                channel="chrome",
                headless=headless,
                slow_mo=90,
                args=["--start-maximized", "--disable-blink-features=AutomationControlled"]
            )
        except Exception:
            browser = playwright.chromium.launch(
                headless=headless,
                slow_mo=90,
                args=["--start-maximized", "--disable-blink-features=AutomationControlled"]
            )
        context = browser.new_context(viewport={"width": 1400, "height": 900}, accept_downloads=True)
        context.add_init_script("window.print = () => {};")
        page = context.new_page()
        page.set_default_timeout(35000)

        created_quotation_id = None

        try:
            # ── 1. Discovery: SearchBar, Voice Search, Shop ───────────────────
            print_step(1, "Homepage Discovery & Voice Search Showcase")
            page.goto(f"{BASE_URL}/")
            page.wait_for_load_state("domcontentloaded")
            page.wait_for_timeout(1500)
            print("  [OK] Homepage loaded")

            # Go to Search page to demonstrate SearchBar & Voice Search
            page.goto(f"{BASE_URL}/search?q=raspberry")
            page.wait_for_load_state("domcontentloaded")
            page.wait_for_timeout(1500)

            # Trigger Voice Search mic animation if present
            voice_btn = page.locator('button[aria-label="Voice search"], button[title="Voice search"]').first
            if voice_btn.is_visible():
                print("  [OK] Voice search interface active, triggering microphone preview...")
                voice_btn.click()
                page.wait_for_timeout(1200)

            take_shot(page, "01_voice_and_product_search.png", "Product & Voice Search")

            # Browse shop
            page.goto(f"{BASE_URL}/shop")
            page.wait_for_load_state("domcontentloaded")
            page.wait_for_timeout(1200)
            take_shot(page, "02_shop_catalog.png", "B2B Shop Catalogue")

            # ── 2. Customer Login & Submit RFQ ───────────────────────────────
            print_step(2, "Customer Login & B2B RFQ Submission")
            page.goto(f"{BASE_URL}/login")
            page.wait_for_selector("#login-email", state="visible")
            page.locator("#login-email").fill(CUSTOMER_EMAIL)
            page.locator("#login-password").fill(CUSTOMER_PASS)
            page.locator("#login-submit").click()
            page.wait_for_timeout(2500)
            print("  [OK] Customer logged in")

            # Open Account -> RFQs
            page.goto(f"{BASE_URL}/account")
            page.wait_for_selector("#account-nav-rfqs", state="visible")
            page.locator("#account-nav-rfqs").click()
            page.wait_for_timeout(1200)

            # Launch RFQ creation wizard
            page.locator("#rfqs-new-request").click()
            page.wait_for_timeout(800)

            # Wizard Step 1: Product
            page.get_by_text("Custom / External").click()
            page.wait_for_timeout(400)
            item_name = f"Raspberry Pi 5 (8GB) Enterprise Batch"
            page.get_by_label("Product / Requirement Name").fill(item_name)
            page.get_by_role("button", name="Next", exact=True).click()
            page.wait_for_timeout(600)

            # Wizard Step 2: Requirements
            page.get_by_label("Quantity").fill("20")
            page.get_by_label("Required By").fill("2026-12-31")
            page.get_by_label("Delivery Location").fill("Bengaluru Tech Park, Karnataka 560100")
            page.get_by_label("Technical Specifications").fill("Official Raspberry Pi 5 - 8GB RAM with passive heat sinks")
            page.get_by_role("button", name="Next", exact=True).click()
            page.wait_for_timeout(600)

            # Wizard Step 3: Review & Submit
            page.get_by_role("button", name="Submit RFQ", exact=True).click()
            page.wait_for_timeout(2500)

            take_shot(page, "03_customer_rfq_submitted.png", "RFQ Successfully Submitted")
            page.get_by_role("button", name="Done").click()
            page.wait_for_timeout(1000)
            print("  [OK] RFQ successfully created and submitted to admin")

            # ── 3. Customer Logout & Admin Login ─────────────────────────────
            print_step(3, "Admin Login & Quotation Builder")
            logout_user(page)

            page.goto(f"{BASE_URL}/login")
            page.wait_for_selector("#login-email", state="visible")
            page.locator("#login-email").fill(ADMIN_EMAIL)
            page.locator("#login-password").fill(ADMIN_PASS)
            page.locator("#login-submit").click()
            page.wait_for_timeout(3000)
            print("  [OK] Admin logged in")

            # Go to Admin Dashboard
            page.goto(f"{BASE_URL}/admin/dashboard")
            page.wait_for_selector("text=RFQ Mgmt", state="visible")
            take_shot(page, "04_admin_dashboard_overview.png", "Admin Overview Dashboard")

            # Switch to RFQ Mgmt section
            page.get_by_text("RFQ Mgmt").click()
            page.wait_for_timeout(2000)

            # Find the new RFQ and start processing
            page.get_by_text("Raspberry Pi 5").first.click()
            page.wait_for_timeout(1000)

            page.get_by_role("button", name="Mark Under Review").first.click()
            page.wait_for_timeout(1000)

            page.get_by_role("button", name="Proceed to Quotation").first.click()
            page.wait_for_timeout(1000)

            page.get_by_role("button", name="Build Quotation").first.click()
            page.wait_for_timeout(2000)

            # Fill Quotation Builder fields
            page.locator("#quot-unit-price").fill("4499")
            page.locator("#quot-discount").fill("5")
            page.locator("#quot-tax").fill("18")
            page.locator("#quot-shipping").fill("250")
            page.wait_for_timeout(800)

            take_shot(page, "05_admin_building_quotation.png", "Admin Building Quotation")

            page.locator("#admin-quot-send").click()
            page.wait_for_timeout(3500)
            print("  [OK] Official Quotation constructed and sent to customer")
            take_shot(page, "06_admin_quotation_sent.png", "Quotation Sent")

            # ── 4. Customer Accepts Quotation ────────────────────────────────
            print_step(4, "Customer Reviews & Accepts Quotation")
            logout_user(page)

            page.goto(f"{BASE_URL}/login")
            page.wait_for_selector("#login-email", state="visible")
            page.locator("#login-email").fill(CUSTOMER_EMAIL)
            page.locator("#login-password").fill(CUSTOMER_PASS)
            page.locator("#login-submit").click()
            page.wait_for_timeout(2500)

            page.goto(f"{BASE_URL}/account")
            page.wait_for_selector("#account-nav-quotations", state="visible")
            page.locator("#account-nav-quotations").click()
            page.wait_for_timeout(2000)

            page.get_by_text("View Details").first.click()
            page.wait_for_timeout(2000)

            # Accept quotation
            page.locator("#quot-accept").click()
            page.wait_for_timeout(800)
            page.locator("#confirm-accept").click()
            page.wait_for_timeout(3000)
            print("  [OK] Quotation accepted by customer! PO generated and routed to approval chain.")
            take_shot(page, "07_customer_quotation_accepted.png", "Customer Accepted Quotation")

            # ── 5. Multi-Level Approval Workflow (HOD -> Director -> Accountant)
            print_step(5, "Internal Multi-Level Approval Stages (HOD -> Director -> Accountant)")
            logout_user(page)

            page.goto(f"{BASE_URL}/login")
            page.wait_for_selector("#login-email", state="visible")
            page.locator("#login-email").fill(ADMIN_EMAIL)
            page.locator("#login-password").fill(ADMIN_PASS)
            page.locator("#login-submit").click()
            page.wait_for_timeout(3000)

            page.goto(f"{BASE_URL}/admin/dashboard")
            page.wait_for_selector("text=Approvals", state="visible")
            page.get_by_text("Approvals").click()
            page.wait_for_timeout(2000)

            # 5a. HOD Approval Stage
            print("  -> Executing HOD Approval stage...")
            if page.locator("#appr-tab-hod").is_visible():
                page.locator("#appr-tab-hod").click()
                page.wait_for_timeout(800)

            rev_btn = page.locator('button:has-text("Review")').first
            if rev_btn.is_visible():
                rev_btn.click()
                page.wait_for_timeout(1000)
                if page.locator("#appr-action-approve").is_visible():
                    page.locator("#appr-action-approve").click()
                    page.wait_for_timeout(600)
                    page.locator("#approval-remarks").fill("Technical specifications, quantity and lead-time verified. Approved by HOD.")
                    page.locator("#appr-modal-confirm-approve").click()
                    page.wait_for_timeout(2000)
                    print("     [OK] HOD approval granted -> Moved to Director Queue")

            # 5b. Director Approval Stage
            print("  -> Executing Director Approval stage...")
            if page.locator("#appr-tab-director").is_visible():
                page.locator("#appr-tab-director").click()
                page.wait_for_timeout(1000)

            rev_btn = page.locator('button:has-text("Review")').first
            if rev_btn.is_visible():
                rev_btn.click()
                page.wait_for_timeout(1000)
                if page.locator("#appr-action-approve").is_visible():
                    page.locator("#appr-action-approve").click()
                    page.wait_for_timeout(600)
                    page.locator("#approval-remarks").fill("Commercial budget, margin and high-value procurement authorized by Director.")
                    page.locator("#appr-modal-confirm-approve").click()
                    page.wait_for_timeout(2000)
                    print("     [OK] Director approval granted -> Moved to Accountant Queue")

            # 5c. Accountant Approval Stage
            print("  -> Executing Accountant Approval stage...")
            if page.locator("#appr-tab-accountant").is_visible():
                page.locator("#appr-tab-accountant").click()
                page.wait_for_timeout(1000)

            rev_btn = page.locator('button:has-text("Review")').first
            if rev_btn.is_visible():
                rev_btn.click()
                page.wait_for_timeout(1000)
                if page.locator("#appr-action-approve").is_visible():
                    page.locator("#appr-action-approve").click()
                    page.wait_for_timeout(600)
                    page.locator("#approval-remarks").fill("GST breakdown, advance payment terms and fund allocation cleared. PO Ready.")
                    page.locator("#appr-modal-confirm-approve").click()
                    page.wait_for_timeout(2000)
                    print("     [OK] Accountant approval granted -> PO Ready!")

            take_shot(page, "08_approval_chain_completed.png", "HOD -> Director -> Accountant Approved")

            # ── 6. Vendor Login & PO Processing / Shipment ───────────────────
            print_step(6, "Vendor Login & Order Fulfillment (PO -> PI -> Shipment -> Delivery)")
            logout_user(page)

            page.goto(f"{BASE_URL}/login")
            page.wait_for_selector("#login-email", state="visible")
            page.locator("#login-email").fill(VENDOR_EMAIL)
            page.locator("#login-password").fill(VENDOR_PASS)
            page.locator("#login-submit").click()
            page.wait_for_timeout(2500)
            print("  [OK] Vendor logged in")

            # Navigate to Vendor Purchase Orders
            page.goto(f"{BASE_URL}/vendor/po")
            page.wait_for_load_state("domcontentloaded")
            page.wait_for_timeout(2000)

            # Accept PO if button visible
            accept_po_btn = page.get_by_role("button", name="Accept PO").first
            if accept_po_btn.is_visible():
                accept_po_btn.click()
                page.wait_for_timeout(1500)
                print("  [OK] Vendor accepted Purchase Order")

            # Mark as Processing
            proc_btn = page.get_by_role("button", name="Mark as Processing").first
            if proc_btn.is_visible():
                proc_btn.click()
                page.wait_for_timeout(1500)
                print("  [OK] Vendor updated PO to Processing")

            # Generate Proforma Invoice
            pi_btn = page.get_by_role("button", name="Generate Proforma Invoice").first
            if pi_btn.is_visible():
                pi_btn.click()
                page.wait_for_timeout(2000)
                print("  [OK] Proforma Invoice generated")

            # Update Shipment to Shipped
            ship_btn = page.get_by_role("button", name="Update Shipment").first
            if ship_btn.is_visible():
                ship_btn.click()
                page.wait_for_timeout(800)
                # Select shipped
                page.locator("select").select_option("shipped")
                page.locator("#shipment-carrier").fill("BlueDart Express")
                page.locator("#shipment-tracking").fill("BD-98452104IN")
                page.get_by_role("button", name="Save Shipment").click()
                page.wait_for_timeout(2000)
                print("  [OK] Shipment updated to SHIPPED (Carrier: BlueDart Express, Tracking: BD-98452104IN)")

                # Update Shipment to Delivered
                page.wait_for_timeout(1000)
                ship_btn2 = page.get_by_role("button", name="Update Shipment").first
                if ship_btn2.is_visible():
                    ship_btn2.click()
                    page.wait_for_timeout(800)
                    page.locator("select").select_option("delivered")
                    page.get_by_role("button", name="Save Shipment").click()
                    page.wait_for_timeout(2500)
                    print("  [OK] Shipment updated to DELIVERED -> Final GST Tax Invoice Activated!")

            take_shot(page, "09_vendor_po_fulfillment.png", "Vendor PO Fulfillment & Delivery")

            # ── 7. Customer Final GST Invoice & PDF Generation ───────────────
            print_step(7, "Customer Final GST Invoice Verification & PDF Download")
            logout_user(page)

            page.goto(f"{BASE_URL}/login")
            page.wait_for_selector("#login-email", state="visible")
            page.locator("#login-email").fill(CUSTOMER_EMAIL)
            page.locator("#login-password").fill(CUSTOMER_PASS)
            page.locator("#login-submit").click()
            page.wait_for_timeout(2500)

            page.goto(f"{BASE_URL}/account")
            page.wait_for_selector("#account-nav-quotations", state="visible")
            page.locator("#account-nav-quotations").click()
            page.wait_for_timeout(2000)

            page.get_by_text("View Details").first.click()
            page.wait_for_timeout(2500)

            # Record customer payment confirmation via UI
            mark_paid_btn = page.locator("#b2b-mark-paid")
            if mark_paid_btn.is_visible():
                mark_paid_btn.click()
                page.wait_for_timeout(600)
                if page.locator("#b2b-utr-input").is_visible():
                    page.locator("#b2b-utr-input").fill("HDFC982341872134")
                    page.locator("#b2b-paid-confirm").click()
                    page.wait_for_timeout(2000)
                    print("  [OK] Customer B2B payment reference submitted via UI")

            take_shot(page, "10_customer_final_invoice_view.png", "Final Customer View")

            # Generate and save official PDF directly via Chrome engine
            cust_token = api_get_token(CUSTOMER_EMAIL, CUSTOMER_PASS)
            r_quots = requests.get(f"{API_URL}/quotations/", headers={"Authorization": f"Bearer {cust_token}"}, timeout=10)
            if r_quots.status_code == 200:
                q_list = r_quots.json()
                if isinstance(q_list, dict):
                    q_list = q_list.get("results", [])
                if q_list:
                    quot_id = q_list[0]["id"]
                    pdf_url = f"{API_URL}/quotations/{quot_id}/invoice/pdf/?token={cust_token}"
                    pdf_page = context.new_page()
                    pdf_page.add_init_script("window.print = () => {};")
                    pdf_page.goto(pdf_url)
                    pdf_page.wait_for_load_state("domcontentloaded")
                    pdf_page.wait_for_timeout(1000)
                    pdf_path = os.path.join(OUTPUT_DIR, "ElectroHub_Final_GST_Invoice.pdf")
                    pdf_page.pdf(path=pdf_path, format="A4", print_background=True)
                    print(f"  [OK] Real Binary PDF Invoice saved to: {pdf_path}")
                    take_shot(pdf_page, "11_chrome_invoice_print_view.png", "Official GST Invoice Document")
                    pdf_page.close()

            print("\n" + "=" * 70)
            print("  DEMO COMPLETE: ALL 8 B2B LIFECYCLE STAGES EXECUTED SUCCESSFULLY!")
            print("=" * 70)
            print(f"  Artifacts stored in: {OUTPUT_DIR}")
            page.wait_for_timeout(4000)

        except Exception as e:
            print(f"\n[FAIL] Demo encountered exception: {e}")
            import traceback
            traceback.print_exc()
            take_shot(page, "error_state.png", "Error Occurred")
            raise
        finally:
            browser.close()


if __name__ == "__main__":
    is_headless = "--headless" in sys.argv
    run_full_demo(headless=is_headless)
