from playwright.sync_api import sync_playwright
import time

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        errors = []
        page.on("pageerror", lambda err: errors.append(err.message))
        page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
        
        print("Navigating to http://localhost:5173")
        try:
            page.goto("http://localhost:5173", wait_until="networkidle")
            time.sleep(2)  # Wait for React to render and potentially crash
        except Exception as e:
            print(f"Failed to navigate: {e}")
            
        print("Captured Errors:")
        for e in errors:
            print(f"ERROR: {e}")
            
        browser.close()

if __name__ == "__main__":
    main()
