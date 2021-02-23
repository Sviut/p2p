//https://www.tagsfinder.com/en-us/ajax/?hashtag=mantels&limit=30&country=us&fs=off&fp=off&fg=off&custom=&type=live

const delay = require('delay')
const axios = require('axios')
const fs = require('fs')
const cheerio = require('cheerio')

async function scrap (hash) {
	const html = await axios.get(`https://www.tagsfinder.com/en-us/ajax/?hashtag=${hash}&limit=30&country=us&fs=off&fp=off&fg=off&custom=&type=live`)
	const $ = await cheerio.load(html.data);

	if ($(".tag").length !== 30) {
		return
	}

	$(".tag").each((i, hashtag) => {
		const text = $(hashtag).text().replace(/X/g, '')
		saveToFile(text)
	});
	await delay(500)
}

scrap('love')

async function getWords () {
	console.log('Get random words')
	const res = await axios.get('https://random-word-api.herokuapp.com/word?number=100&swear=1')
	return res.data
}

function saveToFile (hash) {
	console.log(hash)
	if (!hash) {
		return
	}
	fs.appendFileSync('hashtags.txt', hash + '\n')
}

(async function () {

	while (true) {
		try {
			const words = await getWords()
			for (const word of words) {
				await scrap(word)
			}
		} catch (e) {
			console.log('Global error', e)
			await delay(5000)
		}
	}
})()
