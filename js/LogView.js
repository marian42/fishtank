LogView = {	
	table: $('#tablelog')[0],
	loglevel: ['Log','Info','Event','Warning','Error','Critical Error'],
	logcolor: ['default', 'info', 'primary', 'warning', 'danger', 'danger'],
	currentData: 0,
	defaultData: 0,
	
	minlevel: 0,
	page: 1,
	notelevel: 0,
	
	setup: function() {	
		$('#btnnextpage')[0].onclick = this.btnNextPage;
		$('#btnprevpage')[0].onclick = this.btnPrevPage;
		$('#btnaddnote')[0].onclick = this.btnAddNote;
		$('#btnsubmitnote')[0].onclick = this.btnSubmitNote;
		
		$("#ddloglevel .dropdown-menu li a").click( function(event) {LogView.dropDownLogLevelClick(this); event.preventDefault();});
		$("#ddnotelevel .dropdown-menu li a").click( function(event) {LogView.dropDownNoteLevelClick(this); event.preventDefault();});
	},

	refresh: function() {
		$('#ddloglevelcurrent')[0].innerHTML = this.loglevel[this.minlevel];
		if (this.page < 1)
			this.page = 1;
		$('#currentpage')[0].innerHTML = this.page;
		
		if (this.isDefaultFilter()) {
			this.createTable(this.defaultData);
			return;
		}
		$('#logloading').show();
		$.ajax({
			type: "GET",
			url: 'api/log',
			data: {entries: 15, minlevel: this.minlevel, page: this.page},		
			success: function(data) {
				LogView.createTable(data);			
			},
			complete: function(data){			
				$('#logloading').hide();
				if (data.status != 200)
					Network.onRequestComplete(data);
			}
		});
	},
	
	isDefaultFilter: function() {
		return this.page == 1 && this.minlevel == 0;
	},

	createTable: function(data) {
		if (data == null)
			data = this.defaultData;
		this.currentData = data;
		
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
				link.onclick = ImageView.makeShowImage(data[i][4]);
				cell.appendChild(link);
			}
			
			cell = row.insertCell(0);

			var foodIcon = '';
			for (var j = 1; j < 6; j++) {
				if (data[i][2].indexOf('Food ' + j) > -1) {
					foodIcon = '<img src="/img/food' + j + '.png" class="logFoodIcon">';
				}
			}

			cell.innerHTML = foodIcon + data[i][2];
			if (data[i][4] != 0) {
				cell.onclick = ImageView.makeShowImage(data[i][4]);
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
	},

	updateTimestamps: function() {
		for (var i = 0; i < this.currentData.length; i++) {		
			var date = new Date(this.currentData[i][1] * 1000);
			var now = new Date();
			$('#timestamp' + this.currentData[i][0])[0].innerHTML = '<span class="hidden-xs" title="' + moment(date).calendar() + '" class="tooltip2"><span>' + moment(date).fromNow() + '</span></span><span class="visible-xs" title="' + moment(date).fromNow() + '" class="tooltip2"><span>' + (((new Date) - date) < (24 * 60 * 60 * 1000) ? moment(date).format('HH:mm') : moment(date).format('DD.MM')) + '</span></span>';
		}
	},
	
	btnNextPage: function() {
		LogView.page++;
		LogView.refresh();
	},
	
	btnPrevPage: function() {
		LogView.page--;
		LogView.refresh();		
	},

	btnAddNote: function() {
		if ($('#formaddnote').is(":visible")) {
			$('#formaddnote').hide();
		} else {
			$('#formaddnote').show();
			$('#notetext').focus();
			$('#ddnotelevelcurrent')[0].innerHTML = LogView.loglevel[LogView.notelevel];
		}
	},
	
	btnSubmitNote: function() {
		$('#logloading').show();
		$('#formaddnote').hide();
		$.ajax({
			type: "POST",
			url: 'api/note',
			data: {level: LogView.notelevel, note: $('#notetext').val()},
			success: function(data) {
				$('#notetext').val('');
				LogView.minlevel = Math.min(LogView.minlevel, LogView.notelevel);
				LogView.page = 1;
				if (LogView.minlevel != 0)
					LogView.refresh();
				LogView.notelevel = 0;
			},
			complete: function(data){
				$('#logloading').hide();
				Network.onRequestComplete(data);
			}
		});
	},
	
	dropDownLogLevelClick: function(element) {
		var index = $($(element)[0].parentNode.parentNode.children).index($(element)[0].parentNode);
		
		LogView.minlevel = index;
		LogView.refresh();	
	},
	
	dropDownNoteLevelClick: function(element) {
		var index = $($(element)[0].parentNode.parentNode.children).index($(element)[0].parentNode);
		
		$('#ddnotelevelcurrent')[0].innerHTML = LogView.loglevel[index];
		LogView.notelevel = index;
	}
};

LogView.setup();