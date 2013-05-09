$(function () {
	$(window).scroll(function(){
		$('#header').css('left','-'+$(window).scrollLeft()+'px');
		$('#sidebar').css('top','-'+$(window).scrollTop()+'px');
	});

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

	var toDos = 2;
	var loaded = function () { toDos--; if (toDos == 0) start(); }
	$.getJSON('data/sessions.json',    function (data) { sessions = data; loaded(); });
	$.getJSON('data/knownvideos.json', function (data) { ytvideos = data; loaded(); });

	var content = $('#content');
	var sidebar = $('#sidebar');

	function start() {
		$.each(ytvideos, function (index, video) {
			if (video.index) {
				sessions[video.index].video = video;
			}
		})

		var yScale = 3;
		var dayHeight = 750*yScale;

		for (var i = 0; i < 3; i++) {
			var node = '<h1 style="top:' + i*dayHeight + 'px">Tag '+(i+1)+'</h1>';
			content.append($(node));
			for (var j = 10; j <= 21; j++) {
				var y = (j*60 - 9.5*60)*yScale + i*dayHeight;
				content.append($('<div class="hour" style="top:' + y + 'px"></div>'));
				sidebar.append($('<div class="hour" style="top:' + (y+95) + 'px">'+j+':00</div>'));
			}
		}

		$.each(sessions, function (index, session) {
			var room = session.room;
			if (rooms[room]) {
				var x = (rooms[room].x-1)*180;
				var y = (session.startInt - 9.5*60)*yScale + session.dayInt*dayHeight;
				var height = session.duration*yScale;

				var persons = [];
				$.each(session.persons, function (i, person) {
					person = person['#text'];
					if (person !== undefined) persons.push(person.replace(/^\s+|\s+$/g, ''));
				})

				var title = '<strong>'+session.title+'</strong><br>'+persons.join(', ');

				var node = $('<div class="session" style="left:'+x+'px;top:'+y+'px;height:'+(height-1)+'px"><a href="#" target="_blank"><div class="title">'+title+'</div></a></div>');
				content.append(node);

				if (session.video) {
					node.css({
						'background-image': 'url("'+session.video.thumbnail+'")',
						'background-color': '#000'
					});
					node.addClass('video');
					node.find('a').attr('href', 'http://youtube.com/watch?v='+session.video.ytid);
				}
			}
		});
	}
});