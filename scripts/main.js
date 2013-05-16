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
});