Network.updateStatus(Network.checkForUpdate);

var ledcolor = 'rgb(0,0,255)';

function explodeBinArray(value, length) {
	result = new Array();
	for (var i = 0; i < length; i++) {
		result[i] = value % 2 == 1;
		value = Math.floor(value / 2);
	}
	return result;
}

Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

$('#btnmove').click(function(){
	if (!Status.checkLogin())
		return;
	$("#containerloading").show();
	$.ajax({
		type: "POST",
		url:  'api/move',
		data: {to: FeederView.getFirstSelectedIndex()},
		complete: function(data) {
			$("#containerloading").hide();
			Network.onRequestComplete(data);
		}
	});
});

function updateTimestamps() {
	LogView.updateTimestamps();
	EventView.updateTime();
	Status.updateTime();
	setTimeout(updateTimestamps, 10000);
}

updateTimestamps();

$(document).on("click",function () {
   if ($("#divlogin").is(":visible")){
       $("#divlogin").fadeOut(200);
   }
});

$('#btnlogin').on("click",function (event) {
	if (!$("#divlogin").is(":visible")){
		$("#divlogin").fadeIn(200);
		event.stopPropagation();
		if (!$('#navbartoggle').is(':hidden'))
			$('#navmain').collapse('hide');
		$('#inputusername')[0].focus();
	}
	return false;
});

$('#btnlogout').on("click",function (event) {
	$.ajax({
		type: "POST",
		url: 'api/logout',
		success: function(data) {
			Status.rawdata.user = null;
			Status.update(Status.rawdata)
			Status.alert('Logged out.', 0);
		}
	});
	return false;
});

$('#divlogin').on("click",function (event) {
	event.stopPropagation();
});

$('#loginform').on('keypress', function(event) {
	if (event.keyCode == 13) {
		Network.username = $('#inputusername').val();
		Network.password = $('#inputpassword').val();
		$("#loggingin").show();
		
		var username = $('#inputusername').val();
		
		$.ajax({
			type: "POST",
			url:  'api/login',
			data: {username: username, password: $('#inputpassword').val()},
			success: function(data) {
				if (data == 'ok')
					$("#divlogin").fadeOut(200);
				$('#inputpassword').val('');
				$("#loggingin").hide();
				Status.rawdata.user = username;
				Status.update(Status.rawdata)
				Status.alert('Login successful', 0);
			},
			error: function(){
				$("#loggingin").hide();	
				Network.loggedin = false;
				Status.alert('Login failed', 3);
			}
		});
	}
});

$('#btnswitchlights').click(function(event) {
	if (!Status.checkLogin())
		return;
	$("#dashboardloading").show();
	$.ajax({
		type: "POST",
		url:  'api/switchlights',
		complete: function(data){
			$("#dashboardloading").hide();
			Network.onRequestComplete(data);			
		}
	});
});

$("#ddledcolor .dropdown-menu li a").click( function(event) {
	var index = $($(this)[0].parentNode.parentNode.children).index($(this)[0].parentNode);
	
	ledcolor = $(this)[0].children[0].style.backgroundColor;
	$('#ledcolorpreview')[0].style.backgroundColor = ledcolor;
	
	event.preventDefault();
});

$('#btnflashled').click(function(event) {
	var parts = ledcolor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
	var val = parseInt(parts[3]) + parseInt(parts[2]) * 256 + parseInt(parts[1]) * 256 * 256;
	var color = val.toString(16).toUpperCase();
	while (color.length < 6) color = '0' + color;
	
	$("#dashboardloading").show();
	$.ajax({
		type: "POST",
		url: 'api/flashled',
		data: {color: color},
		complete: function(data) {
			$("#dashboardloading").hide();
			Network.onRequestComplete(data);
		}
	});
});

var offset = 54;

$('.nav-sidebar li a').click(function(event) {
    event.preventDefault();
    $($(this).attr('href'))[0].scrollIntoView();
    scrollBy(0, -offset);
});