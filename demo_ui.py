import os
import time
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=False)
    context = browser.new_context(accept_downloads=True)
    page = context.new_page()
    page.goto("http://localhost:3000")
    
    # Give it a second to load
    page.wait_for_timeout(2000)

    try:
        print("Clicking Login...")
        page.get_by_text("Sign In").click()
        page.wait_for_timeout(1000)
        
        print("Filling Login...")
        page.locator("input[type='email']").fill("demo_customer@test.com")
        page.locator("input[type='password']").fill("Demo1234!")
        page.get_by_role("button", name="Sign In").click()
        page.wait_for_timeout(2000)
        
        print("Going to Account...")
        page.goto("http://localhost:3000/account")
        page.wait_for_timeout(1000)
        
        print("Going to RFQs...")
        page.goto("http://localhost:3000/account/rfqs")
        page.wait_for_timeout(1000)
        
        print("Creating RFQ...")
        page.get_by_text("Create RFQ").click()
        page.wait_for_timeout(1000)
        # Assuming there are fields, we'll try to find them by placeholder or generic locators
        page.locator("input[name='product_name']").fill("Demo Product Flow")
        page.locator("input[name='quantity']").fill("10")
        page.get_by_text("Submit").click()
        page.wait_for_timeout(2000)
        
        print("Logging out...")
        # Add logout logic if needed, or clear context and login as admin
        
    except Exception as e:
        print("Error during flow:", e)
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
