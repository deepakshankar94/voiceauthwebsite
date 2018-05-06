$(document).ready(function() {
	var audio_context,
	recorder,
	microphone,
	blobData,
	encodedBlob,
	siriwave_update_callback,
	user;

	try {
		// webkit shim
		window.AudioContext = window.AudioContext || window.webkitAudioContext;
		navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
		window.URL = window.URL || window.webkitURL;

		audio_context = new AudioContext;
		console.log('Audio context set up.');
		console.log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));
	} catch (e) {
		alert('No web audio support in this browser!');
	}

	navigator.getUserMedia({audio: true}, startUserMedia, function(e) {
		console.log('No live audio input: ' + e);
	});

	function startUserMedia(stream) {
		var input = audio_context.createMediaStreamSource(stream);
		console.log('Media stream created.');

		// Uncomment if you want the audio to feedback directly
		//input.connect(audio_context.destination);
		//__log('Input connected to audio context destination.');

		recorder = new Recorder(input);
		microphone = new p5.AudioIn();
		console.log('Recorder initialised.');
	}

	function startRecording() {
		recorder.clear();
		recorder && recorder.record();
		console.log('Recording...');
	}

	function stopRecording() {
		recorder && recorder.stop();
		console.log('Stopped recording.');

		if (downloadableAudio) {
			// create WAV download link using audio data blob
			createDownloadLink();
		}
	}

	function createDownloadLink() {

		recorder && recorder.getBuffer(function(buffers){
			encoder = new WavAudioEncoder(16000, 1);
			encoder.encode(buffers);
			encodedBlob = encoder.finish();
		});

		recorder && recorder.exportWAV(function(blob) {
			blobData = blob;
			var url = URL.createObjectURL(blob);
			blobUrl = url;
			var li = document.createElement('li');
			var au = document.createElement('audio');
			var hf = document.createElement('a');

			au.controls = true;
			au.src = url;
			hf.href = url;
			hf.download = new Date().toISOString() + '.wav';
			hf.innerHTML = hf.download;
			li.appendChild(au);
			li.appendChild(hf);
			$(currentPanel.children("#recordingslist")[0]).html(li);
		});
	}

	var animating = false,
	recording = false,
	timer = new Timer(),
	minAudioLength = -1,
	downloadableAudio = false,
	noOfAttempts = -1,
	attemptNumber = 0,
	submitPhase1 = 1100,
	submitPhase2 = 400,
	logoutPhase1 = 800,
	currentPanel = null,
	$main = $(".main"),
	$signin = $(".login"),
	$signin_2fa = $(".signin__2fa"),
	$signin_safeword = $(".signin__safeword"),
	$signup = $(".signup"),
	$signup_2fa = $(".signup__2fa"),
	$signup_safeword = $(".signup__safeword"),
	$app = $(".app");

	var randomTexts = [
		'adjustments lift folders conversions retailer characteristics secretary fathoms electrons twos',
		'patterns pupil fillers rigging fractions hoofs procurements admiral agreement illustrations',
		'item soap compresses regrets schoolhouses mists linkages notes leg cements',
		'exchanger beliefs curves caves rakes measurements berries person patterns net',
		'boiler obligation millions passages significance addresses pick confidences mornings harbors',
		'legging turbine nameplate burn inference partners look victim indicator skins'
	];

	var securityQuestion = "What is your Mother's name?";

	var siriWave = new SiriWave({
		container: document.getElementById('siri-container'),
		speed: 0.1,
		// color: '#000',
		style: 'ios9',
		cover: true
	});

	$signup.hide();
	$signup.addClass("inactive");

	$main.hide();
	$main.addClass("inactive");

	$signin_2fa.hide();
	$signin_2fa.addClass("inactive");

	$signin_safeword.hide();
	$signin_safeword.addClass("inactive");

	$signup_2fa.hide();
	$signup_2fa.addClass("inactive");

	$signup_safeword.hide();
	$signup_safeword.addClass("inactive");

	//On click record button
	$(document).on("click", ".record", function(e) {
		if (recording) {
			recording = false;
			console.log("Final length is " + timer.getTimeValues());

			$(".record").removeClass("processing");
			// $(".record").text("Record Again?");

			if (timer.getTotalTimeValues().seconds >= minAudioLength) {
				$(".record").text("Record Again?");
				attemptNumber++;
				downloadableAudio = true;
				$(currentPanel.children('.submit')[0]).show();
			}
			else {
				$(".record").text("Record");
			}

			stopRecording();
			clearInterval(siriwave_update_callback);
			microphone.stop();
			siriWave.stop();
			timer.stop();

			var canvas = $("#siri-container").find('canvas')[0];
			const context = canvas.getContext('2d');
			context.clearRect(0, 0, canvas.width, canvas.height);

			return;
		}
		startRecording();
		microphone.start();
		siriwave_update_callback = setInterval(function() {
			siriWave.setAmplitude(microphone.getLevel() * 1000);
		}, 10);
		recording = true;
		console.log("Starting to record");
		siriWave.start();
		timer.start();
		$(currentPanel.children('.submit')[0]).hide();
		$(".record").addClass("processing");
		$(".record").text("Stop");
	});

	timer.addEventListener('secondsUpdated', function (e) {
		$('.timer').html(timer.getTimeValues().toString());
		if (timer.getTotalTimeValues().seconds < (minAudioLength / 2)) {
			$('.timer-status').text('Not enough audio!');
		}
		else if (timer.getTotalTimeValues().seconds < minAudioLength) {
			$('.timer-status').text('Keep repeating the sentence!');
		}
		else {
			$('.timer-status').text('You can stop and submit now..');
			// $(currentPanel.children('.submit')[0]).show();
		}
	});
	timer.addEventListener('started', function (e) {
		$('.timer').html(timer.getTimeValues().toString());
	});
	timer.addEventListener('reset', function (e) {
		$('.timer').html("");
	});

	// Validation 	/////////////////////////////////////////////////////////////////
	$('.login__form .login__input').each(function(){
		$(this).focus(function(){
			hideValidate(this);
		});
	});

	function validate (input) {
		if($(input).attr('type') == 'email' || $(input).attr('name') == 'email') {
			if($(input).val().trim().match(/^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{1,5}|[0-9]{1,3})(\]?)$/) == null) {
				return false;
			}
		}
		else if ($(input).attr('name') == 'confirmPassword' ) {
			if ($(input).val().length > 0 && ($(input).val() == $(currentPanel.find("input[name='password']")[0]).val()) ) {
				console.log('same');
				return true;
			}
			return false;
		}
		else {
			if($(input).val().trim() == ''){
				return false;
			}
		}
	}

	function showValidate(input) {
		var thisAlert = $(input).parent();

		$(thisAlert).addClass('alert-validate');
	}

	function hideValidate(input) {
		var thisAlert = $(input).parent();

		$(thisAlert).removeClass('alert-validate');
	}
	/////////////////////////////////////////////////////////////////////////////////

	// UTILS ////////////////////////////////////////////////////////////////////////
	function toggle(first, second) {
		$('.submit').hide();
		first.show();
		first.css("top");
		first.removeClass("inactive");
		first.addClass("active");
		second.show();
		second.css("top");
		second.removeClass("inactive");
		second.addClass("active");
		currentPanel = second;
	}

	function ripple(elem, e) {
		$(".ripple").remove();
		var elTop = elem.offset().top,
		elLeft = elem.offset().left,
		x = e.pageX - elLeft,
		y = e.pageY - elTop;
		var $ripple = $("<div class='ripple'></div>");
		$ripple.css({top: y, left: x});
		elem.append($ripple);
	};

	// Reset button states
	var reset = function() {
		minAudioLength = -1;
		downloadableAudio = false;
		noOfAttempts = -1;
		$('.record').text("Record");
		$('.timer').text('');
		$('.error').text('');
		$('.timer-status').text('');
		if (currentPanel) {
			$(currentPanel.children('.submit')[0]).hide();
		}
		$("#recordingslist").html('');
	};
	////////////////////////////////////////////////////////////////////////////////

	// LOGIN FLOW //////////////////////////////////////////////////////////////
	// Onclick Login submit
	$(document).on("click", ".login__submit", function(e) {
		currentPanel = $signup;
		var input = $signin.find('.validate-input .login__input');
		var check = true;
		for(var i=0; i<input.length; i++) {
			if(validate(input[i]) == false){
				showValidate(input[i]);
				check=false;
			}
		}
		if (!check) {
			console.log('validation failed');
			return ;
		}

		if (animating) return;
		animating = true;
		var that = this;
		ripple($(that), e);
		$(that).addClass("processing");

		var username = $signin.find('input[name="username"]').val();
		var password = $signin.find('input[name="password"]').val();

		var settings = {
			"async": true,
			"crossDomain": true,
			"url": "https://labsdev.knolskape.com:8083/voiceauth/signin",
			"method": "POST",
			"headers": {
				"content-type": "application/json",
				"cache-control": "no-cache",
				"postman-token": "2d82e94d-3ee0-5dce-3b3c-f57c463a1b62"
			},
			"processData": false,
			"data": "{\n\t\"username\":\"" + username  + "\",\n\t\"password\":\"" + password + "\"\n\t\n}"
		}

		$.ajax(settings).done(function (response) {
			console.log(response);
			user = username;
			var randomIndex = Math.floor(Math.random() * randomTexts.length);
			var text = randomTexts[randomIndex];

			setTimeout(function() {
				$(that).addClass("success");
				setTimeout(function() {
					reset();
					toggle($main, $signin_2fa);

					$($signin_2fa.children(".random-text")[0]).text(text);

					minAudioLength = 10;
					// noOfAttempts = 1;

				}, submitPhase2 - 70);
				setTimeout(function() {
					$signin.hide();
					$signin.addClass("inactive");
					animating = false;
					$(that).removeClass("success processing");
				}, submitPhase2);
			}, submitPhase1);
		})
		.fail(function(response) {
			console.log(response);
			animating = false;
			$(that).removeClass("processing");
			$(".error").text("User does not exist or the password is wrong!");
		})
	});

	// on submit 2FA login
	$(document).on("click", ".submit_2fa", function(e) {
		if (animating) return;
		animating = true;
		var that = this;
		ripple($(that), e);
		$(that).addClass("processing");

		console.log(user);
		console.log(blobData);

		var data = new FormData();
		data.append("file", blobData);

		var settings = {
			"async": true,
			"crossDomain": true,
			"url": "https://labsdev.knolskape.com:8083/voiceauth/identification/" + user,
			"method": "POST",
			"headers": {
				"cache-control": "no-cache"
			},
			"contentType": false,
			"processData": false,
			"data": data
		}

		$.ajax(settings).done(function (response) {
			console.log(response);
			setTimeout(function() {
				$(that).addClass("success");
				setTimeout(function() {
					reset();
					toggle($app, $signin_2fa);

					// noOfAttempts = 3;
					$($app.children(".panel-text")[0]).text("You have successfully signed in!");
				}, submitPhase2 - 70);
				setTimeout(function() {
					$signin_2fa.hide();
					$signin_2fa.addClass("inactive");
					animating = false;
					$(that).removeClass("success processing");
				}, submitPhase2);
			}, submitPhase1);
		})
		.fail(function(response) {
			console.log(response);
			animating = false;
			$(that).removeClass("processing");
			$(".error").text("User not verified!");
		});
	});

	// on submit securityQuestion signin
	$(document).on("click", ".submit_safeword", function(e) {
		if (animating) return;
		animating = true;
		var that = this;
		ripple($(that), e);
		$(that).addClass("processing");

		setTimeout(function() {
			$(that).addClass("success");
			setTimeout(function() {
				toggle($app, $signin_safeword);
			}, submitPhase2 - 70);
			setTimeout(function() {
				$signin_safeword.hide();
				$signin_safeword.addClass("inactive");
				animating = false;
				$(that).removeClass("success processing");
			}, submitPhase2);
		}, submitPhase1);
	});

	////////////////////////////////////////////////////////////////////////////

	// SIGNUP FLOW /////////////////////////////////////////////////////////////
	// Onclick signup submit
	$(document).on("click", ".signup__submit", function(e) {
		currentPanel = $signup;
		var input = $signup.find('.validate-input .login__input');
		var check = true;

		for(var i=0; i<input.length; i++) {
			if(validate(input[i]) == false){
				showValidate(input[i]);
				check=false;
			}
		}

		if (!check) {
			console.log('validation failed');
			return ;
		}

		var username = $signup.find('input[name="username"]').val();
		var password = $signup.find('input[name="password"]').val();

		var settings = {
			"async": true,
			"crossDomain": true,
			"url": "https://labsdev.knolskape.com:8083/voiceauth/signup",
			"method": "POST",
			"headers": {
				"content-type": "application/json",
				"cache-control": "no-cache",
			},
			"processData": false,
			"data": "{\n\t\"username\":\"" + username + "\",\n\t\"password\":\"" + password + "\"\n\t\n}"
		}

		if (animating) return;
		animating = true;
		var that = this;
		ripple($(that), e);
		$(that).addClass("processing");

		$.ajax(settings).done(function (response) {
			console.log(response);
			user = username;
			var randomIndex = Math.floor(Math.random() * randomTexts.length);
			var text = randomTexts[randomIndex];

			setTimeout(function() {
				$(that).addClass("success");
				setTimeout(function() {
					reset();
					toggle($main, $signup_2fa);

					$($signup_2fa.children(".random-text")[0]).text(text);

					minAudioLength = 25;
					noOfAttempts = 1;
				}, submitPhase2 - 70);
				setTimeout(function() {
					$signup.hide();
					$signup.addClass("inactive");
					animating = false;
					$(that).removeClass("success processing");
				}, submitPhase2);
			}, submitPhase1);
		})
		.fail(function(response) {
			console.log(response);
			animating = false;
			$(that).removeClass("processing");
			$(".error").text("User already exists");
		});
	});

	// on submit 2FA signup
	$(document).on("click", ".submit_2fa_signup", function(e) {
		if (animating) return;
		animating = true;
		var that = this;
		ripple($(that), e);
		$(that).addClass("processing");

		var data = new FormData();
		data.append("file", blobData);

		var settings = {
			"async": true,
			"crossDomain": true,
			"url": "https://labsdev.knolskape.com:8083/voiceauth/enroll/" + user,
			"method": "POST",
			"headers": {
				"cache-control": "no-cache",
			},
			"contentType": false,
			"processData": false,
			"data": data
		}

		$.ajax(settings).done(function (response) {
			console.log(response);
			setTimeout(function() {
				$(that).addClass("success");
				setTimeout(function() {
					reset();
					toggle($app, $signup_2fa);

					// noOfAttempts = 3;

					$($app.children(".panel-text")[0]).text("You have successfully signed up!");
				}, submitPhase2 - 70);
				setTimeout(function() {
					$signup_2fa.hide();
					$signup_2fa.addClass("inactive");
					animating = false;
					$(that).removeClass("success processing");
				}, submitPhase2);
			}, submitPhase1);
		})
		.fail(function(response) {
			console.log(response);
			animating = false;
			$(that).removeClass("processing");
		});
	});

	// on submit securityQuestion signup
	$(document).on("click", ".submit_safeword_signup", function(e) {
		if (animating) return;
		animating = true;
		var that = this;
		ripple($(that), e);
		$(that).addClass("processing");

		setTimeout(function() {
			$(that).addClass("success");
			setTimeout(function() {
				toggle($app, $signup_safeword);
			}, submitPhase2 - 70);
			setTimeout(function() {
				$signup_safeword.hide();
				$signup_safeword.addClass("inactive");
				animating = false;
				$(that).removeClass("success processing");
			}, submitPhase2);
		}, submitPhase1);
	});

	////////////////////////////////////////////////////////////////////////////

	// On click Signup button
	$(document).on("click", ".login__signup", function(e) {
		if (animating) return;
		animating = true;
		var that = this;
		ripple($(that), e);
		$(that).addClass("processing");
		setTimeout(function() {
			$(that).addClass("success");
			setTimeout(function() {
				$signup.show();
				$signup.css("top");
				$signup.removeClass("inactive");
				$signup.addClass("active");
				reset();
			}, submitPhase2 - 70);
			setTimeout(function() {
				$signin.hide();
				$signin.removeClass("active");
				$signin.addClass("inactive");
				animating = false;
				$(that).removeClass("success processing");
			}, submitPhase2);
		}, submitPhase1);
	});

	// on click Signin button
	$(document).on("click", ".login__signin", function(e) {
		if (animating) return;
		animating = true;
		var that = this;
		ripple($(that), e);
		$(that).addClass("processing");
		setTimeout(function() {
			$(that).addClass("success");
			setTimeout(function() {
				$signin.show();
				$signin.css("top");
				$signin.removeClass("inactive");
				$signin.addClass("active");
				reset();
			}, submitPhase2 - 70);
			setTimeout(function() {
				$signup.hide();
				$signup.removeClass("active");
				$signup.addClass("inactive");
				animating = false;
				$(that).removeClass("success processing");
			}, submitPhase2);
		}, submitPhase1);
	});

	// Logout button
	$(document).on("click", ".app__logout", function(e) {
		if (animating) return;
		$(".ripple").remove();
		animating = true;
		var that = this;
		$(that).addClass("clicked");
		setTimeout(function() {
			$signin.show();
			$signin.css("top");
			$app.removeClass("active");
			$signin.removeClass("inactive");
		}, logoutPhase1 - 120);
		setTimeout(function() {
			$app.hide();
			reset();
			animating = false;
			$(that).removeClass("clicked");
		}, logoutPhase1);
	});

});
