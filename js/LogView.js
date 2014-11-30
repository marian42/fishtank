function LogView() {
	this.table = $('#tablelog')[0];
	this.loglevel = ['Log','Info','Event','Warning','Error','Critical Error'];
	this.logcolor = ['default', 'info', 'primary', 'warning', 'danger', 'danger'];
	this.data = 0;
}

LogView.prototype.createTable = function(data) {
	if (data != null)
		this.data = data;
	if (this.data == null)
		return;
	
	while(this.table.hasChildNodes())
		this.table.removeChild(this.table.firstChild);
	
	for (var i = 0; i < data.length; i++) {
		var row = this.table.insertRow();
		
		var cell = row.insertCell(0);
		cell.innerHTML = data[i][5];
		
		cell = row.insertCell(0);
		cell.className += " hidden-xs";
		cell.innerHTML = (data[i][4] == 0 ? '' : data[i][4]);	
		
		cell = row.insertCell(0);
		cell.innerHTML = data[i][2];
		
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