$(document).ready(function(){

	var POPUP_CANCEL_TIMEOUT = -1;
//	var POPUP_CANCEL_TIMEOUT = 66666;
//	var POPUP_CANCEL_TIMEOUT = 10600;
//	var POPUP_CANCEL_TIMEOUT = 1000;
	var LAST_TASK_DESC = "timout:last_task_desc";
	var LAST_TASK_START_TIME = "timout:last_task_start_time";
	var DEFAULT_TASK_DESC = '[nameless pomodoro task]';

	var currentTaskTitle = 'Task';
	var currentTaskDesc = DEFAULT_TASK_DESC;
	var timerStart = null;
	var timerFinish = null;
	var timerName = 'unknown';
	var finalTaskMillis = -1;

	var timeout = null;
	var popup = null;

	var viewGroups = [
		"breakGroup", "inputGroup", "timeGroup"
	];

	var inputMessages = [
		"interruptedTaskMessage", "skippedBreakMessage", "lastTaskMessage", "interruptedBreakMessage"
	];

	var timers = [
		{ name: "pomodoro", title: "Pomodoro", time: 1500 },
		{ name: "long_break", title: "Long break", time: 900 },
		{ name: "short_break", title: "Short break", time: 300 }

//		{ name: "pomodoro", title: "Pomodoro Task", time: 25 },
//		{ name: "long_break", title: "Long break", time: 15 },
//		{ name: "short_break", title: "Short break", time: 5 }
//		{ name: "pomodoro", title: "Pomodoro Task", time: 5 },
//		{ name: "long_break", title: "Long break", time: 3 },
//		{ name: "short_break", title: "Short break", time: 1 }
	];

	//
	// FUNCTIONS
	//

	function getTimer(name) {
		console.log("getTimer: " + name);
		var timer, _i, _len;
		for (_i = 0, _len = timers.length; _i < _len; _i++) {
			timer = timers[_i];
			if (timer.name == name) {
				console.log("=> getTimer: " + timer);
				return timer;
			}
		}
	};

	function initTimer(name) {
		console.log("initTimer: " + name);

		for (_i = 0, _len = timers.length; _i < _len; _i++) {
			timer = timers[_i];
			if (timer.name == name) {
				$('#currentTime').addClass(timer.name);
			} else {
				$('#currentTime').removeClass(timer.name);
			}
		}

		var timer = getTimer(name);
		timerStart = new Date();
		timerName = name;

		$('#currentTime').html(formatTimeSec(timer.time));
		$('#currentTitle').html(timer.title);
		$('#currentTaskStart').html(formatTimeDate(timerStart));

		finalTaskMillis = timerStart.getTime() + (timer.time * 1000)
		console.log("finalTaskMillis: " + finalTaskMillis + " => " + (new Date (finalTaskMillis)));

		timeout = setTimeout("onTick()", 1000);
	};


	function formatTimeSec(secs) {
		var minutes, secs_remainder;
//		secs = millis / 1000;
		minutes = Math.floor(secs / 60);
//		if (minutes < 10) minutes = "0" + minutes;
		secs_remainder = secs - (minutes * 60);
		if (secs_remainder < 10) secs_remainder = "0" + secs_remainder;
		return minutes + ":" + secs_remainder;
	};

	function formatTimeDate(date) {
		console.log("formatTimeDate: " + date)

		var h=date.getHours();
		var m=date.getMinutes();
		var s=date.getSeconds();
		// add a zero in front of numbers<10
		m=checkTime(m);
		s=checkTime(s);
		return h+":"+m+":"+s;
	};

	function checkTime(i) {
		if (i<10) {
			i="0" + i;
		}
		return i;
	}

	function initViewGroup(name) {
		if ( timeout != null ) {
			console.log("Interrupt timeout: " + timeout);
			clearTimeout(timeout);
		}
		finalTaskMillis = -1;

		for (_i = 0, _len = viewGroups.length; _i < _len; _i++) {
			viewGroup = viewGroups[_i];
			if (viewGroup == name) {
				$('#' + viewGroup).slideDown("slow");
			} else {
				$('#' + viewGroup).slideUp("slow");
			}
		}
		if ( popup != null ) {
			popup.cancel();
			popup = null;
		}
	}

	function initInputMessages(name) {
		for (_i = 0, _len = inputMessages.length; _i < _len; _i++) {
			inputMessage = inputMessages[_i];
			if (inputMessage == name) {
				$('#' + inputMessage).show();
			} else {
				$('#' + inputMessage).hide();
			}
		}
	}

	window.onTick = function() {
		if ( finalTaskMillis == -1 ) {
			return;
		}
		var currentTime = new Date();
		var remTime = Math.round((finalTaskMillis - currentTime.getTime()) / 1000);
		if ( remTime < 0 ) {
			remTime = 0;
		}
		$('#currentTime').html(formatTimeSec(remTime));

//		console.log("onTick: " + (new Date()) + " - remTime: " + remTime);

		if (remTime > 0) {
			timeout = setTimeout("onTick()", 1000);
		} else {
			setTimeout("onTimeout()", 0);
		}
	};

	window.onTimeout = function() {
		taskFinished();

		var permission;
		permission = window.webkitNotifications.checkPermission();
		console.log("Permission: " + permission);
		if (permission == 0) {
			displayNotification();
		} else {
			console.log("NO window.webkitNotifications permission!");
		}
	};

	function displayNotification() {
		var permission;
		permission = window.webkitNotifications.checkPermission();
		console.log("Permission: " + permission);

		var popup_html ;
		if ( timerName == 'pomodoro' ) {
			popup_html = "popup-pomodoro.html"
		} else {
			popup_html = "popup-break.html"
		}

		window.popup = popup = window.webkitNotifications.createHTMLNotification(popup_html);
		popup.show();

		if ( POPUP_CANCEL_TIMEOUT != -1 ) {
			setTimeout("popup.cancel()", POPUP_CANCEL_TIMEOUT);
		}
	}

	function taskFinished() {
		$('#lastDescription').html(currentTaskDesc);

		finalTaskMillis = -1;

		timerFinish = new Date();
		if ( timerName == 'pomodoro' ) {
			$('#currentTaskFinish').html(formatTimeDate(timerFinish));

			initViewGroup('breakGroup');
		} else {
			$('#lastBreakFinish').html(formatTimeDate(timerFinish));

			initInputMessages('lastTaskMessage');

			initViewGroup('inputGroup');
		}
	}

	//
	// PERMISSION
	//

	$('#setPermission').click(function(event){
		event.preventDefault();
		console.log("Clicked #setPermission");

		$('#missing_permission').modal('hide');

		requestPermission();
	});

	$('#setPermissionClose').click(function(event){
		event.preventDefault();
		console.log("Clicked #setPermissionClose");

		// set NEVER_ASK_AGAIN
	});

	function requestPermission() {
		reqPerm = window.webkitNotifications.requestPermission(requestPermissionCallback)
		console.log("Request Permission: " + reqPerm);
	}

	function requestPermissionCallback() {
		permission = window.webkitNotifications.checkPermission();
		console.log("requestPermissionCallback: " + permission);
		if (permission == 1) {
			$('#missing_permission').modal('show');
		} else if ( permission == 2 ) {
			$('#no_permission').slideDown("slow");
		}
	}

	//
	// INIT VALUES
	//

	$('#taskDescription').html(localStorage[LAST_TASK_DESC]);
	$('#taskDescription').val(localStorage[LAST_TASK_DESC]);
	if ( localStorage[LAST_TASK_START_TIME] ) {
		pomodoroStart = new Date();
		pomodoroStart.setTime(localStorage[LAST_TASK_START_TIME]);
		console.log("pomodoroStart: " + pomodoroStart);
		$('#pomodoroStart').html(formatTimeDate(pomodoroStart));
	}

	// check for notifications support
	if (window.webkitNotifications) {
		console.log("Notifications are supported!");

		permission = window.webkitNotifications.checkPermission();
		console.log("Current permission: " + permission);

		if ( permission == 2 ) {
			$('#no_permission').slideDown("slow");
		}
	} else {
		console.log("Notifications are not supported for this Browser/OS version yet.");
		$('#wrong_browser').slideDown("slow");
	}

	//
	// START TASK
	//

	$('#taskStart').click(function(event){
		event.preventDefault();
		console.log("Clicked #taskStart");

		if (window.webkitNotifications) {
			permission = window.webkitNotifications.checkPermission();
			if (permission == 1) {
				requestPermission();
			}
		}

		currentTaskDesc = $('#taskDescription').val();
		if ( currentTaskDesc == '' ) {
			currentTaskDesc = DEFAULT_TASK_DESC;
		}

		$('#currentTaskDesc').html(currentTaskDesc);

		initViewGroup('timeGroup');

		initTimer('pomodoro');

		localStorage[LAST_TASK_DESC] = currentTaskDesc;
		localStorage[LAST_TASK_START_TIME] = (new Date()).getTime();
	});

	//
	// TIME INTERRUPTION
	//

	$('#timeInterrupt').click(function(event){
		event.preventDefault();
		console.log("Clicked #timeInterrupt");

		now = new Date();
		console.log("now: " + now);
		if ( timerName == 'pomodoro' ) {
			console.log("timerStart : " + timerStart);

			$('#lastTaskStart').html(formatTimeDate(timerStart));
			duration = Math.round((now - timerStart)/1000);
			console.log("duration: " + duration);
			$('#lastTaskDuration').html(formatTimeSec(duration));

			initInputMessages('interruptedTaskMessage');
		} else {
			console.log("timerFinish: " + timerFinish);
			console.log("timerStart : " + timerStart);

			$('#lastTaskFinish2').html(formatTimeDate(timerFinish));
			duration = Math.round((now - timerStart)/1000);
			console.log("duration: " + duration);
			$('#lastBreakDuration').html(formatTimeSec(duration));

			initInputMessages('interruptedBreakMessage');
		}

		initViewGroup('inputGroup');
	});

	$('#breakCancel').click(function(event){
		event.preventDefault();
		console.log("Clicked #breakCancel");

		$('#lastTaskFinish').html(formatTimeDate(timerFinish));

		initInputMessages('skippedBreakMessage');

		initViewGroup('inputGroup');
	});

	//
	// START BREAK
	//

	$('#shortBreak').click(function(event){
		event.preventDefault();
		console.log("Clicked #shortBreak");

		$('#lastDescription').html(currentTaskDesc);

		initViewGroup('timeGroup');

		initTimer('short_break');
	});

	$('#longBreak').click(function(event){
		event.preventDefault();
		console.log("Clicked #longBreak");

		$('#lastDescription').html(currentTaskDesc);

		initViewGroup('timeGroup');

		initTimer('long_break');
	});

});
