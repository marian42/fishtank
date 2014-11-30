var CONTAINERS = 27;

var containerEditor = new Object();

var feeder = new Feeder(CONTAINERS);
var feederView = new FeederView(feeder, "svgcontainers", "containerprototype", "indicator", 'target');
var serverStatus = new Status();
var logView = new LogView();
var eventView = new EventView();
var imageView = new ImageView();
var network = new Network(feeder, feederView, eventView, serverStatus, imageView);
network.checkForUpdate();

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

$(".dropdown-menu li a").click( function(event) {
	var index = $($(this)[0].parentNode.parentNode.children).index($(this)[0].parentNode);
	
	if ($(this)[0].parentNode.parentNode.parentNode.id == 'ddfoodtype') {
		if (index == 7)
			index = 0;
		else index++;
		containerEditor.food = index;
		if (index != 0) {
			$('#ddfoodtypecurrentimg')[0].src = 'img/food' + index + '.png';
			$('#ddfoodtypecurrentimg')[0].style.display = 'inline';
			$('#ddfoodtypecurrent')[0].innerHTML = '';
			if (containerEditor.amount == 0) {
				containerEditor.amount = 1;
				$('#ddamountcurrent')[0].innerHTML = 1;
			}
				
		} else {
			$('#ddfoodtypecurrentimg')[0].style.display = 'none';
			$('#ddfoodtypecurrent')[0].innerHTML = 'Empty';
			containerEditor.amount = 0;
			$('#ddamountcurrent')[0].innerHTML = '0';
		}
		if (containerEditor.food != -1 || containerEditor.amount != -1 || containerEditor.priority != -1) {
			$('#diveditcontainer').show()
			containerEditor.btnsenabled = true;
		}
	}
	if ($(this)[0].parentNode.parentNode.parentNode.id == 'ddamount') {
		var amounts = [0.1,0.2,0.33,0.5,0.66,1,1.5,2];
		containerEditor.amount = amounts[index];
		$('#ddamountcurrent')[0].innerHTML = amounts[index];
		if (containerEditor.food != -1 || containerEditor.amount != -1 || containerEditor.priority != -1) {
			$('#diveditcontainer').show()
			containerEditor.btnsenabled = true;
		}
	}
	if ($(this)[0].parentNode.parentNode.parentNode.id == 'ddpriority') {
		containerEditor.priority = index;
		$('#ddprioritycurrent')[0].innerHTML = $(this)[0].innerHTML;
		if (containerEditor.food != -1 || containerEditor.amount != -1 || containerEditor.priority != -1) {
			$('#diveditcontainer').show()
			containerEditor.btnsenabled = true;
		}
	}
	
	if ($(this)[0].parentNode.parentNode.parentNode.id == 'ddeventtype') {
		eventEditor.type = index;
		$('#ddeventtypecurrent')[0].innerHTML = $(this)[0].innerHTML;
		$('#editeventfeed')[0].style.display = (index == 0 ? 'block' : 'none');
		$('#editeventlight')[0].style.display = (index == 1 ? 'block' : 'none');
	}
	
	if ($(this)[0].parentNode.parentNode.parentNode.id == 'ddledcolor') {
		ledcolor = $(this)[0].children[0].style.backgroundColor;
		$('#ledcolorpreview')[0].style.backgroundColor = ledcolor;
	}
	
	event.preventDefault();
});

$('#containerbtncancel').click(function() {
	if (!containerEditor.btnsenabled)
		return;
	feederView.updateSelection();
});

$('#containerbtnsubmit').click(function() {
	if (!containerEditor.btnsenabled)
		return;
	$('#containerbtnsubmitloading').show();
	var containers = '';
	for (var i = 0; i < feederView.size; i++)
		if (feederView.c[i].selected)
			containers += i + ',';
	$.ajax({
		type: "POST",
		url:  network.server + 'api/updatecontainers',
		data: "containers=" + containers + "&food=" + containerEditor.food + "&amount=" + containerEditor.amount + "&priority=" + containerEditor.priority,
		success: function(data) {
			$('#containerbtnsubmitloading').hide();
			if (data == 'loginrequired') {
				alert('You need to be logged in to do this.');
				return;
			}
			for (var i = 0; i < feederView.size; i++)
				if (feederView.c[i].selected) {
					if (containerEditor.food != -1)
						feeder.container[i].food = containerEditor.food;
					if (containerEditor.amount != -1)
						feeder.container[i].amount = containerEditor.amount;
					if (containerEditor.priority != -1)
						feeder.container[i].priority = containerEditor.priority;
				}
			feederView.updateSelection();
		},
		error: function(){
			$('#containerbtnsubmitloading').hide();
		}
	});
});

$('#btnmove').click(function(){
	$("#containerloading").show();
	$.ajax({
		type: "POST",
		url:  network.server + 'api/move',
		data: "to=" + feederView.getFirstSelectedIndex(),
		success: function(data) {
			if (data == 'loginrequired')
				alert('You need to be logged in to do this.');
			$("#containerloading").hide();
		},
		error: function(){
			$("#containerloading").hide();	
		}
	});
});

$('#btnfeedcontainer').click(function(){
	$("#containerloading").show();
	$.ajax({
		type: "POST",
		url:  network.server + 'api/dump',
		data: "to=" + feederView.getFirstSelectedIndex(),
		success: function(data) {
			if (data == 'loginrequired')
				alert('You need to be logged in to do this.');
			$("#containerloading").hide();
		},
		error: function(){
			$("#containerloading").hide();
		}
	});
});

window.addEventListener("mouseup", function() {feederView.onMouseUp();});

function updateTimestamps() {
	logView.updateTimestamps();
	eventView.updateTime();
	serverStatus.updateTime();
	setTimeout(updateTimestamps, 10000);
}

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
		url:  network.server + 'api/logout',
		success: function(data) {
			serverStatus.rawdata.user = null;
			serverStatus.update()
		},
		error: function(){
			
		}
	});
	return false;
});

$('#divlogin').on("click",function (event) {
	event.stopPropagation();
});

$('#loginform').on('keypress',function(event) {
	if (event.keyCode == 13) {
		network.username = $('#inputusername').val();
		network.password = $('#inputpassword').val();
		$("#loggingin").show();
		
		var username = $('#inputusername').val();
		
		$.ajax({
			type: "POST",
			url:  network.server + 'api/login',
			data: "username=" + username + '&password=' + $('#inputpassword').val(),
			success: function(data) {
				if (data == 'ok')
					$("#divlogin").fadeOut(200);
				$('#inputpassword').val('');
				$("#loggingin").hide();
				serverStatus.rawdata.user = username;
				serverStatus.update()
			},
			error: function(){
				$("#loggingin").hide();	
				network.loggedin = false;						
			}
		});
	}
});

$('#btnswitchlights').click(function(event) {
	$("#dashboardloading").show();
	$.ajax({
		type: "POST",
		url:  network.server + 'api/switchlights',			
		success: function(data) {
			if (data == 'loginrequired')
				alert('You need to be logged in to do this.');
			$("#dashboardloading").hide();	
		},
		error: function(){
			$("#dashboardloading").hide();	
		}
	});
});

$('#btnflashled').click(function(event) {
	var parts = ledcolor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
	var val = parseInt(parts[3]) + parseInt(parts[2]) * 256 + parseInt(parts[1]) * 256 * 256;
	var color = val.toString(16).toUpperCase();
	while (color.length < 6) color = '0' + color;
	
	$("#dashboardloading").show();
	$.ajax({
		type: "POST",
		url: network.server + 'api/flashled',
		data: 'color=' + color,
		success: function(data) {
			$("#dashboardloading").hide();	
		},
		error: function(){
			$("#dashboardloading").hide();	
		}
	});
});

$('#btncalibrate').click(function(event) {
	$("#containerloading").show();
	$.ajax({
		type: "POST",
		url: network.server + 'api/calibrate',
		success: function(data) {
			if (data == 'loginrequired')
				alert('You need to be logged in to do this.');
			$("#containerloading").hide();	
		},
		error: function(){
			$("#containerloading").hide();	
		}
	});
});

var offset = 54;

$('.nav-sidebar li a').click(function(event) {
    event.preventDefault();
    $($(this).attr('href'))[0].scrollIntoView();
    scrollBy(0, -offset);
});

updateTimestamps();