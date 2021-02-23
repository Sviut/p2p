const fs = require('fs')

function getRandomLine () {
	const data = fs.readFileSync('./rankedHashtags.txt', 'utf8')
	const splitData = data.split('\n')

	let hashtagString = ''

	for (let i = 0; i < 30; i++) {
		const randomNumber = Math.floor(Math.random() * splitData.length)
		hashtagString = `${hashtagString}${splitData[randomNumber]}`
	}

	console.log('splitData.length ', splitData.length)
	console.log(hashtagString)
}

getRandomLine()
