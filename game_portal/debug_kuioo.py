import asyncio
from playwright.async_api import async_playwright

URL = "https://kuioo.tw/g/info/Subway-Parkour-Hong-Kong/"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        print(f"Navigating to {URL}")
        await page.goto(URL)
        await page.wait_for_load_state('networkidle')
        
        # Take screenshot
        await page.screenshot(path="kuioo_debug.png")
        print("Screenshot saved to kuioo_debug.png")
        
        # Check for play button
        play_btn = await page.query_selector('.play-btn') or await page.query_selector('#play-btn') or await page.query_selector('button:has-text("Play")') or await page.query_selector('div[class*="play"]')
        
        if play_btn:
            print("Found potential play button, clicking...")
            await play_btn.click()
            await page.wait_for_timeout(5000)
            
            # Check iframe again
            iframe = await page.query_selector('#gameIframe')
            if iframe:
                src = await iframe.get_attribute('src')
                print(f"Post-click Iframe src: {src}")
        else:
            print("No obvious play button found.")
            
        # Print all scripts to see if we can find the URL in code
        scripts = await page.query_selector_all('script')
        for s in scripts:
            content = await s.inner_text()
            if "game" in content and "url" in content:
                print(f"Found script with game url: {content[:200]}...")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
