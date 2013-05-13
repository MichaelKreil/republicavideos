$(function () {
	if (navigator.userAgent.match(/(iPod|iPhone|iPad)/)) {
		$('#header' ).css({'position':'-webkit-sticky'});
		$('#sidebarwrapper').css({'position':'-webkit-sticky'});
	} else {
		$(window).scroll(function(){
			$('#header').css('left','-'+$(window).scrollLeft()+'px');
			$('#sidebarwrapper').css('top','-'+$(window).scrollTop()+'px');
		});
		$('#header').css('left',0);
		$('#sidebarwrapper').css('top',0);
	}

	var sessions, ytvideos;
	var rooms = {
		'stage 1': {title:'Stage 1', x:1},
		'stage 2': {title:'Stage 2', x:2},
		'stage 3': {title:'Stage 3', x:3},
		'stage 4': {title:'Stage 4', x:4},
		'stage 5': {title:'Stage 5', x:5},
		'stage 6': {title:'Stage 6', x:6},
		'stage 7': {title:'Stage 7', x:7},
		'workshop A': false,
		'workshop B': false,
		'workshop C': false,
		'workshop D': false,
		'newthinking': false,
		'Global Innovation Lounge': false,
		're:publica': false
	};

	$.each(rooms, function (index, room) {
		if (room) {
			var x = Math.round((room.x-1)*180 + 100);
			$('#header').append($('<div style="left:' + x + 'px" class="stage">' + room.title.toUpperCase() + '</div>'));
		}
	});

	var toDos = 2;
	var loaded = function () { toDos--; if (toDos == 0) start(); }
	$.getJSON('data/sessions.json',    function (data) { sessions = data; loaded(); });
	$.getJSON('data/knownvideos.json', function (data) { ytvideos = data; loaded(); });

	var content = $('#content');
	var sidebar = $('#sidebar');

	function start() {
		$.each(ytvideos, function (index, video) {
			if (video.index || (video.index === 0)) {
				sessions[video.index].video = video;
			}
		})

		var yScale = 3;
		var dayHeight = 750*yScale;

		for (var i = 0; i < 3; i++) {
			var node = '<h2 style="top:' + (i*dayHeight-40) + 'px">Tag '+(i+1)+'</h2>';
			content.append($(node));
			var maxHour = 21;
			if (i == 2) maxHour = 18;
			for (var j = 10; j <= maxHour; j++) {
				var y = (j*60 - 9.5*60)*yScale + i*dayHeight;
				content.append($('<div class="hour" style="top:' + y + 'px"></div>'));
				sidebar.append($('<div class="hour" style="top:' + (y+90) + 'px">'+j+':00</div>'));
			}
		}

		$.each(sessions, function (index, session) {
			var room = session.room;
			if (rooms[room]) {
				var x = Math.round((rooms[room].x-1)*180 + 80);
				var y = Math.round((session.startInt - 9.5*60)*yScale + session.dayInt*dayHeight);
				var h = Math.round(session.duration*yScale);

				var persons = [];
				$.each(session.persons, function (i, person) {
					person = person['#text'];
					if (person !== undefined) persons.push(person.replace(/^\s+|\s+$/g, ''));
				})

				var title = '<strong>'+session.title+'</strong><br>'+persons.join(', ');

				var node = $('<div class="session" style="left:'+x+'px;top:'+(y-1)+'px;height:'+(h+1)+'px"><div class="title">'+title+'</div></div>');
				content.append(node);


				if (session.video) {
					node.css({
						'background-image': 'url("'+session.video.thumbnail+'")',
						'background-color': '#000'
					});
					
					var    count = session.video.viewCount;
					var    likes = session.video.numLikes;
					var dislikes = session.video.numDislikes;
					var relevant = (count-likes-dislikes)/100 + likes + dislikes;
					   likes = Math.round(1000 *    likes/relevant )/10;
					dislikes = Math.round(1000 * dislikes/relevant )/10;
					count = Math.round(Math.sqrt(count)*7)/10;

					node.append('<div class="ratingWrapper"><div class="rating" style="width:'+count+'%"><div class="likes" style="width:'+likes+'%"></div><div class="dislikes" style="width:'+dislikes+'%"></div></div></div>');
					node.find('.title').wrap('<a href="http://youtube.com/watch?v='+session.video.ytid+'" target="_blank"></a>');
					
					node.addClass('video');
					if (session.video.gesperrt) {
						node.addClass('gesperrt');
						node.find('.title').append('<br><br><strong>Auf YouTube gesperrt!</strong>');
					}
				} else {
					node.addClass('novideo');
				}
			}
		});
	}
});