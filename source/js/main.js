var features = [
	'kill',
	'revived',
	'death',
	'killer',
	'match',
	'rank',
	'location',
	'me',
	'team',
	'phase',
	'map'
]

var team_members = []
var mode = ''
var my_name = ''
var total_teams = 0
var total_players = 0
var my_rank = 0
var phase = ''
var map = ''
var inMatch = false
var kills = 0

var name = 'Hellman2741'

function registerEvents() {
	overwolf.games.events.onError.addListener(logError)

	overwolf.games.events.onInfoUpdates2.addListener(decodeInfo)

	overwolf.games.events.onNewEvents.addListener(decodeEvent)
}

function logError(info) {
	console.log("Error: " + JSON.stringify(info))
}

function decodeInfo(info) {
	var feature = info.feature
	info = info.info
	var endpoint = ''
	var value = ''
	switch (feature) {
	case 'kill':
		endpoint = 'kills'
		value = info.match_info.kills
		break;
	case 'phase':
		endpoint = 'phase'
		value = info.game_info.phase
		break;
	case 'map':
		endpoint = 'map'
		value = info.match_info.map
		break;
	case 'team':
		var members = info.match_info.nicknames
		var data = JSON.parse(members)
		var team_members = []
		for (var member in data.team_members) {
			team_members.push(member.player)
		}
		endpoint = 'team_members'
		value = JSON.stringify(team_members)
		break;
	case 'match':
		endpoint = 'mode'
		value = info.match_info.mode
		break;
	case 'me':
		my_name = info.me.name
		console.log('Updating my information. Playing on account: ' + my_name)
		break;
	case 'rank':
		var teams = info.match_info.total_teams
		var total = info.match_info.total
		var me = info.match_info.me
		if (teams > 0) {
			endpoint = 'total_teams'
			value = teams
			console.log('Total teams: '+value)
		}
		if (total) {
			endpoint = 'total_players'
			value = total
		}
		if (me) {
			endpoint = 'rank'
			value = me
		}
		break
	}
	if(endpoint != '' && value != '')
		sendToDiscord(endpoint, value)
}

function decodeEvent(info) {
	if (!info) return
	var events = info.events
	for (var i = 0; i < events.length; i++) {
		var event = events[i]
		var name = event.name
		if (typeof name === 'undefined') {
			console.log('Name is null. Printing event.')
			console.log(JSON.stringify(event))
			console.log(JSON.stringify(info))
		}
		var endpoint = ''
		var value = ''
		switch (name) {
		case 'kill':
			console.log('You have received a kill!')
			break;
		case 'killer':
			var data = JSON.parse(event.data)
			endpoint = 'killed_by'
			value = data.killer_name
			break;
		case 'matchEnd':
			endpoint = 'game_end'
			value = new Date().getTime()
			inMatch = false
			break;
		case 'matchStart':
			endpoint = 'game_start'
			value = new Date().getTime()
			inMatch = true
			break;
		}
		if(endpoint != '' && value != '')
			sendToDiscord(endpoint, value)
	}
}

function registerFeatures() {
	overwolf.games.events.setRequiredFeatures(features, (info) => {
		if (info.status == 'error') {
			window.setTimeout(registerFeatures, 2000)
			return
		}
		console.log('Set required features')
		console.log(JSON.stringify(info))
	})
}

function gameRunning(info) {
	if (!info || !info.isRunning || !info.id)
		return false
	var gameId = Math.floor(info.id / 10)
	if (gameId != 10906)
		return false
	console.log("PUBG Running.")
	return true
}

function hasGameLaunched(info) {
	if (!info || !info.gameInfo || info.runningChanged || !info.gameChanged || !info.gameInfo.isRunning)
		return false
	var gameId = Math.floor(info.gameInfo.id / 10)
	if (gameId != 10906)
		return false
	console.log("PUBG Launched.")
	return true
}

function sendToDiscord(endpoint, data) {
	console.log(`Sending ${data} to ${endpoint}`)
	$.get(`http://66.70.190.195:8090/pubg/${name}/${endpoint}/${data}`, {}, (ret) => {
		var data = getJSON(ret)
		if (data == null) {
			console.log(data.error)
			return false
		}
		console.log('Successfully sent data to discord server!')
	})
}

function getJSON(ret) {
	var data = JSON.parse(ret);
	if (data.success == null) {
		console.log('Invalid response.');
		return null;
	}
	if (!data.success) {
		if(data.error !== '')
			console.log(data.error);
		return null;
	}
	return data;
}

sendToDiscord('running', 'true')

overwolf.games.onGameInfoUpdated.addListener((info) => {
	if (hasGameLaunched(info)) {
		registerEvents()
		setTimeout(registerFeatures, 1000)
	}
})

overwolf.games.getRunningGameInfo((info) => {
	if (gameRunning(info)) {
		registerEvents()
		setTimeout(registerFeatures, 1000)
	} else {
		console.log('Game is not running!')
	}
})
