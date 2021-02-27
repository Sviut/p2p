const fs = require('fs')
const puppeteer = require('puppeteer')
const delay = require('delay')

const PUBLIC_NAMES = ['modeblog']

function getPublicFolder () {
	return PUBLIC_NAMES[Math.floor(Math.random() * PUBLIC_NAMES.length)]
}

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

puppeteer.launch({ args: ['--no-sandbox'] }, { headless: false }).then(async browser => {
	console.log('Running script..')
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

	console.log('open p2p')

	await page.waitForSelector('.add-publication-button')
	await page.evaluate(() => {
		document.querySelector('.add-publication-button').querySelector('.pmp-btn-circle').click()
	})

	console.log('click add')

	await page.waitForSelector('.attache')
	await page.click('.attache')

	const folder = getPublicFolder()
	const fileName = random_file(folder)

	console.log('add file')


	const input = await page.$('input[type="file"]')
	await input.uploadFile(`./p2p/${folder}/${fileName}`)

	await page.evaluate(() => {
		document.querySelector('[title="Что у вас нового?"]').innerText = '1, 2 or 3?'
	})

	await page.waitForSelector('.pencil')

	console.log('file uploaded')

	fs.unlinkSync(`./p2p/${folder}/${fileName}`)

	console.log('file deleted')

	await delay(3000)

	const [publish] = await page.$x('//button[contains(., \'Опубликовать\')]')
	await publish.click()
	console.log('Publich post')
	await delay(10000)
	await page.waitForFunction('document.querySelectorAll(\'publication\')[0].querySelector(\'.status-1\')', { timeout: 600000 })

	console.log('Post posted - ok')
	//
	// // //_________-
	for (let i = 0; i < 4; i++) {
		await doComment(page)
	}

	await browser.close()
	console.log('Work done!')
}).catch(e => {
	console.log(e)
	process.exit(0)
})

async function doComment (page) {
	console.log('Do commenting')
	await delay(10000)

	await page.waitForFunction('document.querySelectorAll(\'publication\')[0].querySelector(\'.smile\')')
	//
	await delay(10000)

	await page.evaluate(() => {
			const publications = document.querySelectorAll('publication')
			publications[0].querySelector('.smile').click()
			publications[0].querySelector('.emojione-32-people').click()
			publications[0].querySelector('.sent').click()
		},
	)

	console.log('send smile')

	await delay(5000)

	await page.waitForFunction('document.querySelectorAll(\'publication\')[0].querySelector(\'.c-comment-action__item--button\')')

	let text = getRandomLine()

	console.log('Paste tags')
	await page.evaluate((text) => {
			const publications = document.querySelectorAll('.c-comment-thread__item')
			publications[0].querySelector('.c-comment-action__item--button').click()

			setTimeout(() => {
				publications[0].querySelector('.c-message-form__message').innerText = text
				publications[0].querySelector('.c-comment-action__item--button').click()
			}, 1000)
		}, text,
	)


	await delay(5000)

	console.log('Send tags')
	await page.evaluate(() => {
			const publications = document.querySelectorAll('.c-comment-thread__item')
			publications[0].querySelector('.sent').click()
		},
	)


	await delay(10000)

	console.log('Delete smile comment')
	await page.evaluate(() => {
			const publications = document.querySelectorAll('.c-comment-thread__item')
			publications[0].querySelectorAll('.c-comment-layout__delete-button')[0].click()
		},
	)


	await delay(5000)

	console.log('Reload page')
	await page.reload({ waitUntil: ['networkidle0', 'domcontentloaded'] })
}

function random_file (folder) {
	const files = fs.readdirSync('./p2p/' + folder + '/')
	return files[Math.floor(Math.random() * files.length)]
}
