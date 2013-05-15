;var fs = require('fs');
var download = require('./modules/downloader.js').download;
var levenshtein = require('./modules/levenshtein.js');

var schedule = JSON.parse(fs.readFileSync('../data/rp13-schedule.json', 'utf8')).schedule;
var knownVideos = JSON.parse(fs.readFileSync('../data/knownVideos.json', 'utf8'));

var sessions = fetchSessions(schedule);
fs.writeFileSync('../data/sessions.json', JSON.stringify(sessions, null, '\t'), 'utf8');

var newEntries = 0;
var toDos = 0;


fetchUser('republica2010', 'max-results=50&start-index=1'  );
fetchUser('republica2010', 'max-results=50&start-index=51' );
fetchUser('republica2010', 'max-results=50&start-index=101');
fetchUser('republica2010', 'max-results=50&start-index=151');
fetchUser('republica2010', 'max-results=50&start-index=201');
fetchUser('republica2010', 'max-results=50&start-index=251');
fetchUser('republica2010', 'max-results=50&start-index=301');
fetchUser('republica2010', 'max-results=50&start-index=351');
fetchVideo('ZG4FawUtYPA');
fetchVideo('-s5WvYQEr0Y');
fetchVideo('6Pu5agqAy_Q');

function fetchUser(user, query) {
	if (query) query = '&' + query;
	toDos++;
	download('http://gdata.youtube.com/feeds/api/users/'+user+'/uploads?v=2&alt=json'+query, function (data, error) {
		analyse(JSON.parse(data).feed.entry, error);
	});
}

function fetchVideo(id) {
	toDos++;
	download('http://gdata.youtube.com/feeds/api/videos/'+id+'?v=2&alt=json', function (data, error) {
		analyse([JSON.parse(data).entry], error);
	});
}

function analyse(entries, error) {
	if (entries) {
		entries.forEach(function (entry) {
			var id = entry['media$group']['yt$videoid']['$t'];
			var duration = parseInt(entry['media$group']['yt$duration'].seconds, 10);


			var viewCount, favoriteCount;
			if (entry['yt$statistics']) {
				viewCount = parseInt(entry['yt$statistics'].viewCount, 10);
				favoriteCount = parseInt(entry['yt$statistics'].favoriteCount, 10);
			} else {
				//console.warn(entry);
			}

			var numLikes = 0, numDislikes = 0;
			if (entry['yt$rating']) {
				numDislikes = parseInt(entry['yt$rating'].numDislikes, 10);
				numLikes = parseInt(entry['yt$rating'].numLikes, 10);
			}

			var title = entry.title['$t'];
			var thumbnail = 'http://i.ytimg.com/vi/'+id+'/mqdefault.jpg';

			if (knownVideos[id] !== undefined) {
				if (viewCount) knownVideos[id].viewCount = viewCount;
				if (favoriteCount) knownVideos[id].favoriteCount = favoriteCount;
				knownVideos[id].numLikes = numLikes;
				knownVideos[id].numDislikes = numDislikes;
			} else {
				newEntries++;

				var sessionIndex = titleLookup(title);
				var sTitle = sessions[sessionIndex].title;
				var status = 'ok';
				if (title.substr(title.length - sTitle.length).toLowerCase() != sTitle.toLowerCase()) {
					status = 'WARNUNG';
					console.warn('WARNUNG');
					console.warn(title + ' - ' + sTitle);
				}

				knownVideos[id] = {
					index: sessionIndex,
					title: sTitle,
					yttitle: title,
					ytduration: duration,
					viewCount: viewCount,
					favoriteCount: favoriteCount,
					numLikes: numLikes,
					numDislikes: numDislikes,
					ytid: id,
					thumbnail: thumbnail,
					status: status
				}
			}

			if (entry['media$group']['media$restriction']) {
				knownVideos[id].gesperrt = true;
				console.log('Gesperrte Id: '+id);
				//console.log(entry['media$group']['media$restriction']);
			} else {
				knownVideos[id].gesperrt = false;
			}
		});
	}
	toDos--;
	if (toDos == 0) {
		Object.keys(knownVideos).forEach(function (key) {
			if (knownVideos[key].index == null) {
				knownVideos[key] = {};
			} else {
				knownVideos[key].eventId  = parseInt(sessions[knownVideos[key].index].id, 10);
			}
		});
			
		fs.writeFileSync('../data/knownVideos.json', JSON.stringify(knownVideos, null, '\t'), 'utf8');
		console.info(newEntries);
	}
}



function fetchSessions(data) {
	var events = [];
	data.day.forEach(function(day, dayInt) {
		var date = day.date;
		day.room.forEach(function (room) {
			var name = room.name;
			room.event.forEach(function (event) {
				event.date = date;
				event.room = name;
				
				var time = event.start.split(':');
				time = parseInt(time[0],10)*60 + parseInt(time[1],10);
				event.startInt = time;
				event.dayInt = dayInt;

				var duration = event.duration.split(' ');
				if (duration[1] != 'Minuten') console.log('Was ist duration = "'+event.duration+'"');
				event.duration = parseInt(duration[0],10);

				delete event.description;

				event.persons = event.persons.person;
				if (Object.prototype.toString.call(event.persons) == '[object Object]') event.persons = [event.persons];

				events.push(event);
			});
		});
	})
	return events;
}



function titleLookup(title) {
	var i = title.indexOf(':', 3);
	if (i > 0) title = title.substr(i+1);

	var bestIndex = null;
	var bestDistance = 1e10;
	var options = {insertion_cost:10, substitution_cost:5};
	sessions.forEach(function (event, index) {
		var eventTitle = event.title;
		var d = levenshtein(eventTitle, title, options);
		if (d < bestDistance) {
			bestDistance = d;
			bestIndex = index;
		}
	})
	return bestIndex;
}