var fs = require('fs');
	
var rooms = {
	'stage 1': {title:'Stage 1', x:1},
	'stage 2': {title:'Stage 2', x:2},
	'stage 3': {title:'Stage 3', x:3},
	'stage 4': {title:'Stage 4', x:4},
	'stage 5': {title:'Stage 5', x:5},
	'stage 6': {title:'Stage 6', x:6},
	'stage 7': {title:'Stage 7', x:7},
	'workshop A': {title:'Workshop A', x:9},
	'workshop B': {title:'Workshop B', x:10},
	'workshop C': {title:'Workshop C', x:11},
	'workshop D': {title:'Workshop D', x:12},
	'newthinking': false,
	'Global Innovation Lounge': false,
	're:publica': false
};

var yScale = 3;
var dayHeight = 750*yScale;

exports.generate = function (sessions, knownVideos) {
	var html = fs.readFileSync('./template.html', 'utf8');
	
	var header = [], sidebar = [], content = [];

	Object.keys(knownVideos).forEach(function (name) {
		var video = knownVideos[name];
		if (video.index || (video.index === 0)) sessions[video.index].video = video;
	});

	// generate Header
	Object.keys(rooms).forEach(function (name) {
		var room = rooms[name];
		if (room) {
			var x = Math.round((room.x-1)*180 + 100);
			header.push('<div style="left:' + x + 'px" class="stage">' + room.title.toUpperCase() + '</div>');
		}
	});

	// generate sidebar
	for (var i = 0; i < 3; i++) {
		content.push('<h2 style="top:' + (i*dayHeight-40) + 'px">Day '+(i+1)+'</h2>');
		var maxHour = (i == 2) ? 18 : 21;
		for (var j = 10; j <= maxHour; j++) {
			var y = (j*60 - 9.5*60)*yScale + i*dayHeight;
			content.push('<div class="hour" style="top:' + y + 'px"></div>');
			sidebar.push('<div class="hour" style="top:' + (y+90) + 'px">'+j+':00</div>');
		}
	}

	// generate content

	sessions.forEach(function (session) {
		var room = session.room;
		session.room = rooms[room] ? rooms[room] : false;
	})

	sessions = sessions.sort(function (a,b) {
		if (!a.room) return  1;
		if (!b.room) return -1;
		if (a.startInt < b.startInt) return -1;
		if (a.startInt > b.startInt) return  1;
		if (a.room.x < b.room.x) return -1;
		if (a.room.x > b.room.x) return  1;
		return 0;
	})

	sessions.forEach(function (session, index) {
		if (session.room) {
			var x = Math.round((session.room.x - 1)*180 + 80);
			var y = Math.round((session.startInt - 9.5*60)*yScale + session.dayInt*dayHeight);
			var h = Math.round(session.duration*yScale);

			var persons = [];
			session.persons.forEach(function (person) {
				if (person !== undefined) persons.push(person.replace(/^\s+|\s+$/g, ''));
			});

			var title = '<strong>'+session.title+'</strong><br>'+persons.join(', ');

			var styles = ['left:'+x+'px', 'top:'+(y-1)+'px', 'height:'+(h+1)+'px'];
			var classes = ['session'];
			
			if (session.video) {
				styles.push('background-image:url(\''+session.video.thumbnail+'\')');
				styles.push('background-color:#000');
				
				var    count = session.video.viewCount;
				var    likes = session.video.numLikes;
				var dislikes = session.video.numDislikes;
				var relevant = (count-likes-dislikes)/50 + likes + dislikes;

				   likes = Math.round(1000 *    likes/relevant )/10;
				dislikes = Math.round(1000 * dislikes/relevant )/10;
				count = Math.round(Math.sqrt(count)*7)/10;
				
				classes.push('video');
				if (session.video.gesperrt) {
					classes.push('gesperrt');
					title += '<br><br><strong>Auf YouTube gesperrt!</strong>';
				}

				title = '<div class="title">'+title+'</div>';
				title = '<a href="'+session.video.video_url+'" target="_blank">'+title+'</a>';

				title += '<div class="ratingWrapper"><div class="rating" style="width:'+count+'%"><div class="likes" style="width:'+likes+'%"></div><div class="dislikes" style="width:'+dislikes+'%"></div></div></div>';
			} else {
				title = '<div class="title">'+title+'</div>';
				classes.push('novideo');
			}

			content.push('<div class="'+classes.join(' ')+'" style="'+styles.join(';')+'">'+title+'</div>');
		}
	});



	html = replace(html, header, 'header');
	html = replace(html, sidebar, 'sidebar');
	html = replace(html, content, 'content');

	fs.writeFileSync('../index.html', html, 'utf8');
}

function replace(html, nodes, name) {
	var match = html.match(new RegExp('(\\t*)%'+name+'%'));
	var indent = match[1];
	nodes = nodes.join('\n'+indent);
	return html.replace(new RegExp('%'+name+'%'), nodes)
}