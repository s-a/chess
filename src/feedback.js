function get(which, type) {
	const p = require('./feedback.json')
	const phrases = p[which][type]
	const n = random(0, phrases.length - 1)
	return phrases[n]
}

function nicejob() {
	return get('positive', 'text')
}

function nicejoby() {
	return get('positive', 'emoji')
}

function notNiceJob() {
	return get('negative', 'text')
}

function notNiceJoby() {
	return get('negative', 'emoji')
}

function random(min, max) {
	let mi = min
	let ma = max
	if (max == null) {
		ma = min
		mi = 0
	}
	return mi + Math.floor(Math.random() * (ma - mi + 1))
}

nicejob.bad = notNiceJob
nicejob.good = nicejob
nicejob.bady = notNiceJoby
nicejob.goody = nicejoby

module.exports = nicejob