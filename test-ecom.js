const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function runTest() {
  console.log("==========================================");
  console.log(" Starting NexusCore Selenium E2E Test Suite");
  console.log("==========================================\n");

  const options = new chrome.Options();
  options.addArguments(
    '--disable-logging',
    '--log-level=3',
    '--silent',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage'
  );
  options.excludeSwitches('enable-logging');

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    // 1. Navigate to Storefront
    console.log("[TEST 1] Navigating to http://localhost:3000...");
    await driver.get('http://localhost:3000');
    await driver.wait(until.titleContains('NexusCore'), 5000);
    console.log("✓ Storefront loaded.\n");

    // 2. Wait for products and select first in-stock item
    console.log("[TEST 2] Verifying product catalog...");
    await driver.wait(until.elementLocated(By.css('.product-card')), 7000);
    const addBtn = await driver.wait(
      until.elementLocated(By.css('.btn-quick-add:not([disabled])')),
      5000
    );
    console.log("✓ Product catalog populated and in-stock item found.\n");

    // 3. Add to Cart
    console.log("[TEST 3] Adding hardware unit to bag...");
    await driver.executeScript("arguments[0].click();", addBtn);
    const cartBadge = await driver.findElement(By.id('cartCount'));
    await driver.wait(async () => (await cartBadge.getText()) === '1', 4000);
    console.log("✓ Cart counter updated to 1.\n");

    // 4. Open drawer and navigate to checkout
    console.log("[TEST 4] Opening bag and proceeding to checkout...");
    const bagBtn = await driver.findElement(By.id('cartButton'));
    await bagBtn.click();
    await driver.sleep(500);

    const checkoutBtn = await driver.wait(
      until.elementLocated(By.css('#cartDrawer .checkout-btn')),
      3000
    );
    await checkoutBtn.click();

    // 5. Verify redirect
    console.log("[TEST 5] Checking navigation to /checkout.html...");
    await driver.wait(until.urlContains('/checkout.html'), 5000);
    console.log("✓ Reached secure checkout page.\n");

    // 6. Complete form and apply promo code
    console.log("[TEST 6] Filling customer details and applying promo...");
    await driver.findElement(By.id('buyerName')).sendKeys('DevOps Lead QA');
    await driver.findElement(By.id('buyerEmail')).sendKeys('lead.qa@datacenter.net');
    await driver.findElement(By.id('buyerAddress')).sendKeys('Rack 4B, DC Hub 1, Hyderabad');

    const promoInput = await driver.findElement(By.id('promoInput'));
    await promoInput.sendKeys('DEVOPS10');
    const applyPromoBtn = await driver.findElement(By.xpath("//button[text()='Apply']"));
    await applyPromoBtn.click();
    await driver.wait(until.elementLocated(By.id('promoMsg')), 3000);
    console.log("✓ Applied 10% promo discount code.\n");

    // 7. Submit order and wait for mock payment gateway overlay
    console.log("[TEST 7] Authorizing order via Mock Payment Gateway...");
    const submitBtn = await driver.findElement(By.id('submitOrderBtn'));
    await driver.executeScript("arguments[0].click();", submitBtn);

    // Wait for the 2-second processing overlay to clear and receipt to show
    await driver.wait(
      until.elementLocated(By.id('orderSuccess')),
      7000
    );
    await driver.wait(async () => {
      const display = await driver.findElement(By.id('orderSuccess')).getCssValue('display');
      return display !== 'none';
    }, 7000);
    console.log("✓ Payment authorized and order recorded!\n");

    console.log("==========================================");
    console.log(" ALL TESTS PASSED SUCCESSFULLY! ✓");
    console.log("==========================================");

  } catch (err) {
    console.error("\n❌ TEST FAILED with error:", err.message);
    process.exit(1);
  } finally {
    console.log("Tearing down Selenium browser session...");
    await driver.quit();
  }
}

runTest();
