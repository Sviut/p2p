const fs = require('fs')
const puppeteer = require('puppeteer')
const delay = require('delay')

function getRandomLine () {
	const data = fs.readFileSync('./rankedHashtags.txt', 'utf8')
	const splitData = data.split('\n')

	let hashtagString = ''

	for (let i = 0; i < 20; i++) {
		const randomNumber = Math.floor(Math.random() * splitData.length)
		hashtagString = `${hashtagString}${splitData[randomNumber]}`
	}
	console.log(hashtagString)
	return hashtagString
}

puppeteer.launch({ headless: false }).then(async browser => {
	console.log('Running tests..')
	const page = await browser.newPage()
	const cookiesString = await fs.readFileSync('./p2p/cookies.json')
	const cookies = JSON.parse(cookiesString)
	await page.setCookie(...cookies)
	await page.setRequestInterception(true)

	page.on('request', (req) => {
		if (req.resourceType() == 'font' || req.resourceType() == 'image') {
			req.abort()
		} else {
			req.continue()
		}
	})

	await page.goto('https://app.postmypost.io/ru/project/76791/publication')


	await page.waitForSelector('.add-publication-button')
	await page.evaluate(() => {
		document.querySelector('.add-publication-button').querySelector('.pmp-btn-circle').click()
	})

	await page.waitForSelector('.attache')
	await page.click('.attache')

	const fileName = random_file()

	const input = await page.$('input[type="file"]')
	await input.uploadFile('./p2p/posts/' + fileName)

	await page.waitForSelector('.pencil')

	fs.unlinkSync('./p2p/posts/' + fileName)

	await delay(3000)

	const [publish] = await page.$x('//button[contains(., \'Опубликовать\')]')
	await publish.click()
	await delay(10000)
	await page.waitForFunction("document.querySelectorAll('publication')[0].querySelector('.status-1')", {timeout: 300000})
	//
	// // //_________-
	for (let i = 0; i < 4; i++) {
		await doComment(page)
	}
})

async function doComment(page) {

	await page.waitForFunction('document.querySelectorAll(\'publication\')[0].querySelector(\'.smile\')')
	//
	await delay(5000)

	await page.evaluate(() => {
			const publications = document.querySelectorAll('publication')
			publications[0].querySelector('.smile').click()
			publications[0].querySelector('.emojione-32-people').click()
			publications[0].querySelector('.sent').click()
		},
	)

	await delay(5000)
	let text = getRandomLine()

	const cors = await page.evaluate((text) => {
			const publications = document.querySelectorAll('.c-comment-thread__item')
			publications[0].querySelector('.c-comment-action__item--button').click()

			setTimeout(() => {
				publications[0].querySelector('.c-message-form__message').innerText = text
				publications[0].querySelector('.c-comment-action__item--button').click()
			}, 2000)
		}, text,
	)


	await delay(3000)


	await page.evaluate(() => {
			const publications = document.querySelectorAll('.c-comment-thread__item')
			publications[0].querySelector('.sent').click()
		},
	)

	await delay(5000)
	await page.evaluate(() => {
			const publications = document.querySelectorAll('.c-comment-thread__item')
			publications[0].querySelectorAll('.c-comment-layout__delete-button')[0].click()
		},
	)

	await delay(5000)

	await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
}


function random_file () {
	const files = fs.readdirSync('./p2p/posts')
	return files[Math.floor(Math.random() * files.length)]
}
