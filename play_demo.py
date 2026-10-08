"""

ElectroHub Full-Flow Demo

=========================

Tests the complete B2B procurement flow:

  1. Homepage visit

  2. Customer login

  3. Browse shop / products  

  4. Go to Account -> Create & Submit RFQ

  5. Admin: Mark Under Review -> Proceed to Quotation -> Build Quotation -> Send

  6. Customer: View Quotation details -> Accept

     (Backend auto-creates PO + Invoice on accept)

  7. Customer: Download real PDF invoice from backend



PDF URL format: /api/quotations/<id>/invoice/pdf/?token=<jwt>

"""

import os

import requests

from playwright.sync_api import sync_playwright



BASE = "http://localhost:3000"

API  = "http://127.0.0.1:8000/api"



CUSTOMER_EMAIL = "demo_customer@test.com"

CUSTOMER_PASS  = "Demo1234!"

ADMIN_EMAIL    = "demo_admin@test.com"

ADMIN_PASS     = "Admin1234!"





def api_login(email, password):

    r = requests.post(f"{API}/login/", json={"email": email, "password": password}, timeout=10)

    r.raise_for_status()

    data = r.json()

    return data["access"]





def run(playwright):

    browser = playwright.chromium.launch(headless=False, slow_mo=60)

    context = browser.new_context(accept_downloads=True)

    page    = context.new_page()

    page.set_default_timeout(30_000)



    try:

        # --- 1. Visit homepage -----------------------------------------------

        print("Step 1: ElectroHub homepage...")

        page.goto(f"{BASE}/")

        page.wait_for_load_state("networkidle")

        page.wait_for_timeout(1200)

        print("  [OK] Homepage")



        # --- 2. Customer login -----------------------------------------------

        print("Step 2: Customer login...")

        page.goto(f"{BASE}/login")

        page.wait_for_selector("#login-email", state="visible")

        page.locator("#login-email").fill(CUSTOMER_EMAIL)

        page.locator("#login-password").fill(CUSTOMER_PASS)

        page.locator("#login-submit").click()

        page.wait_for_timeout(3000)

        print("  [OK] Logged in as customer")



        # --- 3. Browse shop --------------------------------------------------

        print("Step 3: Browse shop...")

        page.goto(f"{BASE}/shop")

        page.wait_for_load_state("domcontentloaded")

        page.wait_for_timeout(1500)

        print("  [OK] Shop loaded")



        # --- 4. My Account -> RFQs -------------------------------------------

        print("Step 4: Account -> RFQs section...")

        page.goto(f"{BASE}/account")

        page.wait_for_selector("#account-nav-rfqs", state="visible")

        page.locator("#account-nav-rfqs").click()

        page.wait_for_timeout(1000)



        # --- 5. Create new RFQ -----------------------------------------------

        print("Step 5: Create new RFQ...")

        page.locator("#rfqs-new-request").click()

        page.wait_for_timeout(800)



        # Step 1 of wizard: Product

        page.get_by_text("Custom / External").click()

        page.wait_for_timeout(500)

        page.get_by_label("Product / Requirement Name").fill("Raspberry Pi 5 (8GB)")

        page.get_by_role("button", name="Next", exact=True).click()

        page.wait_for_timeout(700)



        # Step 2: Requirements

        page.get_by_label("Quantity").fill("20")

        page.get_by_label("Required By").fill("2026-12-31")

        page.get_by_label("Delivery Location").fill("Chennai, Tamil Nadu 600001")

        page.get_by_label("Technical Specifications").fill("Official Raspberry Pi 5 - 8GB RAM, latest revision")

        page.get_by_role("button", name="Next", exact=True).click()

        page.wait_for_timeout(700)



        # Step 3: Review & Submit

        page.get_by_role("button", name="Submit RFQ", exact=True).click()

        page.wait_for_timeout(2500)



        # Done

        page.get_by_role("button", name="Done").click()

        page.wait_for_timeout(800)

        print("  [OK] RFQ submitted")



        # --- 6. Customer logout ----------------------------------------------

        print("Step 6: Customer logout...")

        page.goto(f"{BASE}/")

        page.wait_for_timeout(1000)

        page.locator("#user-menu-btn").click()

        page.wait_for_timeout(500)

        page.locator("#logout-btn").click()

        page.wait_for_timeout(2000)



        # --- 7. Admin login --------------------------------------------------

        print("Step 7: Admin login...")

        page.goto(f"{BASE}/login")

        page.wait_for_selector("#login-email", state="visible")

        page.locator("#login-email").fill(ADMIN_EMAIL)

        page.locator("#login-password").fill(ADMIN_PASS)

        page.locator("#login-submit").click()

        page.wait_for_timeout(3000)

        print("  [OK] Admin logged in")



        # --- 8. Admin Dashboard -> RFQ Mgmt ----------------------------------

        print("Step 8: Admin Dashboard -> RFQ Mgmt...")

        page.goto(f"{BASE}/admin/dashboard")

        page.wait_for_selector("text=RFQ Mgmt", state="visible")

        page.get_by_text("RFQ Mgmt").click()

        page.wait_for_timeout(2000)



        # --- 9. Admin processes RFQ -----------------------------------------

        print("Step 9: Admin processing RFQ (Under Review -> Quoted -> Build)...")

        page.get_by_text("Raspberry Pi 5").first.click()

        page.wait_for_timeout(1000)



        page.get_by_role("button", name="Mark Under Review").first.click()

        page.wait_for_timeout(1000)



        page.get_by_role("button", name="Proceed to Quotation").first.click()

        page.wait_for_timeout(1000)



        page.get_by_role("button", name="Build Quotation").first.click()

        page.wait_for_timeout(2000)



        # --- 10. Admin fills quotation ---------------------------------------

        print("Step 10: Admin filling quotation (Rs.4,499/unit)...")

        page.locator("#quot-unit-price").fill("4499")

        page.locator("#quot-discount").fill("5")

        page.locator("#quot-tax").fill("18")

        page.locator("#quot-shipping").fill("250")

        page.wait_for_timeout(600)



        page.locator("#admin-quot-send").click()

        page.wait_for_timeout(3500)

        print("  [OK] Quotation sent to customer")



        # --- 11. Admin logout ------------------------------------------------

        print("Step 11: Admin logout...")

        page.goto(f"{BASE}/")

        page.wait_for_timeout(1000)

        page.locator("#user-menu-btn").click()

        page.wait_for_timeout(500)

        page.locator("#logout-btn").click()

        page.wait_for_timeout(2000)



        # --- 12. Customer login again ----------------------------------------

        print("Step 12: Customer login (to accept quotation)...")

        page.goto(f"{BASE}/login")

        page.wait_for_selector("#login-email", state="visible")

        page.locator("#login-email").fill(CUSTOMER_EMAIL)

        page.locator("#login-password").fill(CUSTOMER_PASS)

        page.locator("#login-submit").click()

        page.wait_for_timeout(3000)



        # --- 13. Customer: My Quotations -------------------------------------

        print("Step 13: Customer viewing My Quotations...")

        page.goto(f"{BASE}/account")

        page.wait_for_selector("#account-nav-quotations", state="visible")

        page.locator("#account-nav-quotations").click()

        page.wait_for_timeout(2500)



        # Open the quotation detail

        page.get_by_text("View Details").first.click()

        page.wait_for_timeout(2000)

        print("  [OK] Quotation detail page opened")



        # --- 14. Customer: Accept Quotation ----------------------------------

        print("Step 14: Customer accepting quotation...")

        page.locator("#quot-accept").click()

        page.wait_for_timeout(800)

        page.locator("#confirm-accept").click()

        page.wait_for_timeout(3000)

        print("  [OK] Quotation accepted! (Backend auto-creates PO + Invoice)")



        # --- 15. Customer: View Invoice PDF in Print Preview -----------------
        print("Step 15: Opening Chrome Print Preview...")

        with page.expect_popup() as popup_info:
            page.locator("#quot-download-pdf").click()
        
        pdf_page = popup_info.value
        # We don't wait for load state because window.print() will block the page 
        # load event and pop up the print dialog natively.
        page.wait_for_timeout(3000)
        
        print("  [OK] Print Preview opened successfully in new tab!")

        # --- Summary ---------------------------------------------------------
        print()
        print("=" * 65)
        print("[DONE]  COMPLETE FLOW SUCCESSFUL!")
        print("=" * 65)
        print("  1. Homepage               [OK]")
        print("  2. Customer Login         [OK]")
        print("  3. Shop Browse            [OK]")
        print("  4. Account -> RFQs         [OK]")
        print("  5. Create and Submit RFQ  [OK]")
        print("  6-7. Admin Login          [OK]")
        print("  8-10. Admin Quotation     [OK]")
        print("  11-12. Customer Login     [OK]")
        print("  13-14. Accept Quotation   [OK]")
        print("  15-16. Chrome Print View  [OK]")
        print("=" * 65)

        page.wait_for_timeout(8000)

    except Exception as e:
        print(f"\n[FAIL] Error: {e}")
        import traceback
        traceback.print_exc()
        page.wait_for_timeout(8000)
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
