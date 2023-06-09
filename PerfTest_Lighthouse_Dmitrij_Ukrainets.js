const fs = require('fs')
const puppeteer = require('puppeteer')
const lighthouse = require('lighthouse/lighthouse-core/fraggle-rock/api.js')

const waitTillHTMLRendered = async (page, timeout = 30000) => {
  const checkDurationMsecs = 1000;
  const maxChecks = timeout / checkDurationMsecs;
  let lastHTMLSize = 0;
  let checkCounts = 1;
  let countStableSizeIterations = 0;
  const minStableSizeIterations = 3;

  while(checkCounts++ <= maxChecks){
    let html = await page.content();
    let currentHTMLSize = html.length; 

    let bodyHTMLSize = await page.evaluate(() => document.body.innerHTML.length);

    //console.log('last: ', lastHTMLSize, ' <> curr: ', currentHTMLSize, " body html size: ", bodyHTMLSize);

    if(lastHTMLSize != 0 && currentHTMLSize == lastHTMLSize) 
      countStableSizeIterations++;
    else 
      countStableSizeIterations = 0; //reset the counter

    if(countStableSizeIterations >= minStableSizeIterations) {
      console.log("Fully Rendered Page: " + page.url());
      break;
    }

    lastHTMLSize = currentHTMLSize;
    await page.waitForTimeout(checkDurationMsecs);
  }  
};

async function captureReport() {
	const browser = await puppeteer.launch({args: ['--allow-no-sandbox-job', '--allow-sandbox-debugging', '--no-sandbox', '--disable-gpu', '--disable-gpu-sandbox', '--display', '--ignore-certificate-errors', '--disable-storage-reset=true']}); //run test with background browser
	//const browser = await puppeteer.launch({"headless": false, args: ['--allow-no-sandbox-job', '--allow-sandbox-debugging', '--no-sandbox', '--ignore-certificate-errors', '--disable-storage-reset=true']}); //run test with UI browser
	const page = await browser.newPage();
	const baseURL = "http://localhost/";
	
	await page.setViewport({"width":1920,"height":1080});
	await page.setDefaultTimeout(10000);
	
	const navigationPromise = page.waitForNavigation({timeout: 30000, waitUntil: ['domcontentloaded']});
	await page.goto(baseURL);
    await navigationPromise;
		
	const flow = await lighthouse.startFlow(page, {
		name: 'Shopizer',
		configContext: {
		  settingsOverrides: {
			throttling: {
			  rttMs: 40,
			  throughputKbps: 10240,
			  cpuSlowdownMultiplier: 1,
			  requestLatencyMs: 0,
			  downloadThroughputKbps: 0,
			  uploadThroughputKbps: 0
			},
			throttlingMethod: "simulate",
			screenEmulation: {
			  mobile: false,
			  width: 1920,
			  height: 1080,
			  deviceScaleFactor: 1,
			  disabled: false,
			},
			formFactor: "desktop",
			onlyCategories: ['performance'],
		  },
		},
	});

  	//================================NAVIGATE================================
    await flow.navigate(baseURL, {
		stepName: 'Open main page'
		});
  	console.log('Main page is opened');
	
		
	//================================SELECTORS================================
	const homePage      = ".btn";
	const tables 		= ".main-menu nav ul li:nth-child(2)"
	const tableIcon 	= ".product-content h3 a";
	const addToCart 	= ".pro-details-cart button"
	const goToCart 		=  "button.icon-cart"
	const openCartMenu 	= ".shopping-cart-btn.btn-hover.text-center"
	const openCart = "div.shopping-cart-btn.btn-hover.text-center a:nth-child(1)"
	const proceedToCheckout = ".grand-totall.cart-total-box a"
	const CheckoutPage 	= ".billing-info-wrap"
	
	
	//================================PAGE_ACTIONS================================
	await page.waitForSelector(homePage);
	await flow.startTimespan({ stepName: 'Go to tables' });
		await page.click(tables);
        await waitTillHTMLRendered(page);
		await page.waitForSelector(tableIcon);
    await flow.endTimespan();
    console.log('Go to tables is completed');
	
	await flow.startTimespan({ stepName: 'Open table' });
		await page.click(tableIcon);
		await waitTillHTMLRendered(page);
	await flow.endTimespan();
	console.log('Open table is completed');
	
	await page.waitForSelector(addToCart);
	await flow.startTimespan({ stepName: 'Add table to cart' });
		await page.click(addToCart);
		await waitTillHTMLRendered(page);
		await page.waitForSelector(goToCart);
	await flow.endTimespan();
	console.log('Add table to cart is completed');
	
	await flow.startTimespan({ stepName: 'Open cart menu' });
		await page.click(goToCart);
		await waitTillHTMLRendered(page);
		await page.waitForSelector(openCartMenu);
	await flow.endTimespan();
	console.log('Open cart menu is completed');
	
	await flow.startTimespan({ stepName: 'Go to cart' });
		await page.click(openCart);
		await waitTillHTMLRendered(page);
		await page.waitForSelector(openCart);
	await flow.endTimespan();
	console.log('Go to cart is completed');
	
	await flow.startTimespan({ stepName: 'Proceed to chechout' });
		await page.click(proceedToCheckout);
		await waitTillHTMLRendered(page);
		await page.waitForSelector(CheckoutPage);
	await flow.endTimespan();
	console.log('Proceed to chechout is completed');

	//================================REPORTING================================
	const reportPath = __dirname + '/Lighthouse.Dmitrij.Ukrainets.report.html'; //HTML report path
	const reportPathJson = __dirname + '/Lighthouse.Dmitrij.Ukrainets.report.json'; //JSON report path

	const report = await flow.generateReport();	//generate HTML report
	const reportJson = JSON.stringify(await flow.createFlowResult()).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029'); //generate JSON report
	
	fs.writeFileSync(reportPath, report); //write HTML report
	fs.writeFileSync(reportPathJson, reportJson); //write HTML report
	
    await browser.close();
}
captureReport();