const fs = require('fs')
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())
const axios = require('axios')
const delay = require('delay')
// const iPhone = puppeteer.devices['iPhone 6']

const MIN = 50000
const MAX = 500000

let browser = null
let page = null

// puppeteer.launch({ headless: false }).then(async browser => {
// 	console.log('Running tests..')
// 	const page = await browser.newPage()
// 	const cookiesString = await fs.readFile('./cookies.json');
// 	const cookies = JSON.parse(cookiesString);
// 	await page.setCookie(...cookies);
// 	await page.goto('https://www.instagram.com/explore/tags/fashion')
//
// 	// await delay (15000)
//
// 	// const cookies = await page.cookies();
// 	// await fs.writeFile('cookies.json', JSON.stringify(cookies, null, 2));
// 	// console.log(`All done, check the screenshot. ✨`)
// })

async function init () {
	browser = await puppeteer.launch({
		headless: false,
		args: [
			'--window-size=375,667',
			// '--proxy-server=http://49.204.79.85:80'
		],
		defaultViewport: {
			width: 375,
			height: 667,
			isMobile: true,
		},
	})
	page = await browser.newPage()
	// await page.authenticate({
	// 	username: 'qqHecI0jB9',
	// 	password: 'FzUmBUPBuk'
	// });
	const cookiesString = await fs.readFileSync('./cookies.json')
	const cookies = JSON.parse(cookiesString)
	await page.setCookie(...cookies)
	// await page.emulate(iPhone)lf
	await page.setRequestInterception(true)

	page.on('request', (req) => {
		if (req.resourceType() == 'font' || req.resourceType() == 'image') {
			req.abort()
		} else {
			req.continue()
		}
	})
}

async function scrap (hash) {
	await page.goto('https://www.instagram.com/explore/tags/' + hash)
	// await delay(1000)
	const count = await page.evaluate(() => {
		const header = document.querySelector('header') // mob
		let strNumber = ''
		if(header) {
			strNumber = document.querySelector('header').querySelectorAll('div')[6].innerText
		}
		return parseFloat(strNumber.replace(/,/g, '')) || 0
	})

	if (count < MAX && count > MIN) {
		saveToFile(hash)
		console.log('Save ' + hash)
	} else {
		console.log('Skip ' + hash + ' count: ' + count)
	}
	await saveCookies()
}

async function saveCookies () {
	const cookies = await page.cookies()
	await fs.writeFileSync('cookies.json', JSON.stringify(cookies, null, 2))
}

async function getWords () {
	console.log('Get random words')
	const res = await axios.get('https://random-word-api.herokuapp.com/word?number=100&swear=1')
	return res.data
}

function saveToFile (hash) {
	fs.appendFileSync('hash.txt', hash + '\n')
}

(async function() {
	await init()
	await page.goto('https://www.instagram.com')
})()
//
// (async function () {
// 	await init()
//
// 	while (true) {
// 		try {
// 			const words = await getWords()
// 			for (const word of words) {
// 				await scrap(word)
// 			}
// 		} catch (e) {
// 			console.log('Global error', e)
// 			await delay(5000)
// 		}
// 	}
// })()
