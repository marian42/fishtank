function LogView() {
	this.table = $('#tablelog')[0];
	this.loglevel = ['Log','Info','Event','Warning','Error','Critical Error'];
	this.logcolor = ['default', 'info', 'primary', 'warning', 'danger', 'danger'];
	this.data = 0;
	
	this.minlevel = 0;
	this.page = 1;
	this.notelevel = 0;
	LogView.instance = this;
}

LogView.prototype.refresh = function() {
	$('#ddloglevelcurrent')[0].innerHTML = this.loglevel[this.minlevel];
	if (this.page < 1)
		this.page = 1;
	$('#currentpage')[0].innerHTML = this.page;
	
	if (this.minlevel == 0 && this.page == 1) {
		this.createTable(this.defaultdata);
		return;
	}
	$('#logloading').show();
	$.ajax({
		type: "GET",
		url: 'api/log',
		data: "entries=15&minlevel=" + this.minlevel + '&page=' + this.page,		
		success: function(data) {
			$('#logloading').hide();
			LogView.instance.createTable(data);			
		},
		error: function(){			
			$('#logloading').hide();
			alert("error!");
		}
	});
}

LogView.prototype.createTable = function(data) {
	if (data == null)
		return;
	this.data = data;
	if (this.page == 1 && this.minlevel == 0)
		this.defaultdata = data;
	
	while(this.table.hasChildNodes())
		this.table.removeChild(this.table.firstChild);
	
	for (var i = 0; i < data.length; i++) {
		var row = this.table.insertRow();
		
		var cell = row.insertCell(0);
		cell.innerHTML = data[i][5];
		
		cell = row.insertCell(0);
		cell.className += " hidden-xs";
		if (data[i][4] != 0) {
			link = document.createElement('span');
			link.innerHTML = data[i][4];
			link.onclick = makeShowImage(data[i][4]);
			cell.appendChild(link);
		}
		
		cell = row.insertCell(0);
		cell.innerHTML = data[i][2];
		if (data[i][4] != 0) {
			cell.onclick = makeShowImage(data[i][4]);
		}
		
		cell = row.insertCell(0);
		cell.innerHTML = '<span class="label label-' + this.logcolor[data[i][3]] + '">' + this.loglevel[data[i][3]] + '</span>'; 		
		
		cell = row.insertCell(0);		
		var date = new Date(data[i][1] * 1000);
		var now = new Date();
		cell.id = 'timestamp' + data[i][0];			
				
		cell = row.insertCell(0);
		cell.className += " hidden-xs";
		cell.innerHTML = '<span class="logindex">' + data[i][0] + '</span>';
	}
	this.updateTimestamps();
}

LogView.prototype.updateTimestamps = function() {
	for (var i = 0; i < this.data.length; i++) {		
		var date = new Date(this.data[i][1] * 1000);
		var now = new Date();
		$('#timestamp' + this.data[i][0])[0].innerHTML = '<span class="hidden-xs" title="' + moment(date).calendar() + '" class="tooltip2"><span>' + moment(date).fromNow() + '</span></span><span class="visible-xs" title="' + moment(date).fromNow() + '" class="tooltip2"><span>' + moment(date).format('h:mm') + '</span></span>';
	}
}

$('#btnnextpage').click(function() {
	LogView.instance.page++;
	LogView.instance.refresh();
});

$('#btnprevpage').click(function() {
	LogView.instance.page--;
	LogView.instance.refresh();
});

$('#btnaddnote').click(function() {
	if ($('#formaddnote').is(":visible")) {
		$('#formaddnote').hide();
	} else {
		$('#formaddnote').show();
		$('#notetext').focus();
		$('#ddnotelevelcurrent')[0].innerHTML = LogView.instance.loglevel[LogLevel.instance.notelevel];
	}
});

$('#btnsubmitnote').click(function() {
	$('#logloading').show();
	$('#formaddnote').hide();
	$.ajax({
		type: "POST",
		url: 'api/note',
		data: "level=" + LogView.instance.notelevel + '&note=' + $('#notetext').val(),
		success: function(data) {
			$('#logloading').hide();
			$('#notetext').val('');
			LogView.instance.notelevel = 0;
		},
		error: function(){
			$('#logloading').hide();
			alert("error!");
		}
	});
});