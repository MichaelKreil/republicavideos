var fs = require('fs');
var download = require('./modules/downloader.js').download;
var levenshtein = require('./modules/levenshtein.js');
var html = require('./modules/html.js');

var schedule = JSON.parse(fs.readFileSync('../data/rp13-schedule.json', 'utf8')).schedule;
var knownVideos = JSON.parse(fs.readFileSync('../data/knownVideos.json', 'utf8'));

var sessions = fetchSessions(schedule);
fs.writeFileSync('../data/sessions.json', JSON.stringify(sessions, null, '\t'), 'utf8');

var newEntries = 0;
var toDos = 0;


fetchYouTubeUser('republica2010', 'max-results=50&start-index=1'  );
fetchYouTubeUser('republica2010', 'max-results=50&start-index=51' );
fetchYouTubeUser('republica2010', 'max-results=50&start-index=101');
fetchYouTubeUser('republica2010', 'max-results=50&start-index=151');
fetchYouTubeUser('republica2010', 'max-results=50&start-index=201');
fetchYouTubeUser('republica2010', 'max-results=50&start-index=251');
fetchYouTubeUser('republica2010', 'max-results=50&start-index=301');
fetchYouTubeUser('republica2010', 'max-results=50&start-index=351');

fetchYouTubeVideo('ZG4FawUtYPA');
fetchYouTubeVideo('-s5WvYQEr0Y');
fetchYouTubeVideo('6Pu5agqAy_Q');

fetchVimeoVideo('65905002');


function fetchYouTubeUser(user, query) {
	if (query) query = '&' + query;
	toDos++;
	download('http://gdata.youtube.com/feeds/api/users/'+user+'/uploads?v=2&alt=json'+query, function (data, error) {
		analyseYouTubeVideos(JSON.parse(data).feed.entry);
	});
}

function fetchYouTubeVideo(id) {
	toDos++;
	download('http://gdata.youtube.com/feeds/api/videos/'+id+'?v=2&alt=json', function (data, error) {
		analyseYouTubeVideos([JSON.parse(data).entry]);
	});
}

function fetchVimeoVideo(id) {
	toDos++;
	download('http://vimeo.com/api/v2/video/'+id+'.json', function (data, error) {
		analyseVimeoVideos(JSON.parse(data));
	});
}

function analyseVimeoVideos(entries) {
	entries.forEach(function (entry) {
		var newEntry = {
			video_id: entry.id,
			thumbnail: entry.thumbnail_large,
			video_title: entry.title,
			video_url: entry.url,
			viewCount: entry.stats_number_of_plays,
			numLikes: entry.stats_number_of_likes,
			video_duration: entry.duration
		};
		addVideo(newEntry);
	});
	toDos--;
	checkReady();
}

function analyseYouTubeVideos(entries) {
	if (entries) {
		entries.forEach(function (entry) {
			var id = entry['media$group']['yt$videoid']['$t'];

			var newEntry = {
				video_id: id,
				video_duration: parseInt(entry['media$group']['yt$duration'].seconds, 10),
				video_title: entry.title['$t'],
				thumbnail: 'http://i.ytimg.com/vi/'+id+'/mqdefault.jpg',
				video_url: 'http://youtube.com/watch?v='+id,
			};
			
			if (entry['yt$statistics']) {
				newEntry.viewCount = parseInt(entry['yt$statistics'].viewCount, 10);
				newEntry.favoriteCount = parseInt(entry['yt$statistics'].favoriteCount, 10);
			}

			if (entry['yt$rating']) {
				newEntry.numDislikes = parseInt(entry['yt$rating'].numDislikes, 10);
				newEntry.numLikes = parseInt(entry['yt$rating'].numLikes, 10);
			}

			if (entry['media$group']['media$restriction']) {
				newEntry.gesperrt = true;
				console.log('Gesperrte YouTube-Id: '+id);
			}

			addVideo(newEntry);
		});
	}
	toDos--;
	checkReady();
}

function addVideo(entry) {
	var id = entry.video_id;

	if (!entry.numLikes)      entry.numLikes      = 0;
	if (!entry.viewCount)     entry.viewCount     = 0;
	if (!entry.numDislikes)   entry.numDislikes   = 0;
	if (!entry.favoriteCount) entry.favoriteCount = 0;

	if (knownVideos[id] === undefined) {
		newEntries++;
		var title = entry.video_title;
		entry.index = titleLookup(title);
		var sTitle = sessions[entry.index].title;
		if (cleanUp(title).indexOf(cleanUp(sTitle)) < 0) {
			entry.status = 'WARNUNG';
			console.warn('WARNUNG');
			console.warn(title + ' - ' + sTitle);
		}
	} else {
		var oldEntry = knownVideos[id];
		entry.index = knownVideos[id].index;
		if (oldEntry.status) entry.status = oldEntry.status;
	}

	if (entry.index) entry.session_title = sessions[entry.index].title;

	knownVideos[id] = entry;
}

function checkReady() {
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

		html.generate(sessions, knownVideos);
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
	title = cleanUp(title);

	var bestIndex = null;
	var bestDistance = 1e10;
	var options = {deletion_cost:20, substitution_cost:5};
	sessions.forEach(function (event, index) {
		var eventTitle = cleanUp(event.title);
		var d = levenshtein(eventTitle, title, options);

		console.log(eventTitle);
		console.log(title);
		console.log(d);
		console.log('');

		if (d < bestDistance) {
			bestDistance = d;
			bestIndex = index;
		}
	})
	return bestIndex;
}

function cleanUp(text) {
	return text.toLowerCase().replace(/[^a-z]+/g, ' ');
}