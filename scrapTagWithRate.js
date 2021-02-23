//https://www.tagsfinder.com/en-us/ajax/?hashtag=mantels&limit=30&country=us&fs=off&fp=off&fg=off&custom=&type=live

const delay = require('delay')
const axios = require('axios')
const fs = require('fs').promises
const cheerio = require('cheerio')

const startPage = 50001
const lastPage = 110001


async function scrap (page) {
	const html = await axios.get('https://top-hashtags.com/instagram/'+ page)
	const $ = await cheerio.load(html.data)

	$('.i-tag').each((i, hashtagEl) => {
		const hashtag = $(hashtagEl).text()
		saveToFile(hashtag)
	})
}

async function saveToFile (hash) {
	console.log(hash)
	if (!hash) {
		return
	}
	await fs.appendFile('rankedHashtags.txt', hash + '\n')
}

(async function () {
		try {
			for (let i = startPage; i < lastPage; i+=100) {
				console.log('Page :' + i)
				await scrap(i)
			}
		} catch (e) {
			console.log('Global error', e)
			await delay(5000)
		}
})()
