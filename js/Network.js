Network = {
	reconnecting: false,
	retryInterval: 5000,

	updateStatus: function(callback) {
		$.ajax({
			type: "GET",
			url: 'api/status',
			success: function(data) {
				Network.onUpdateSuccess(data);
			},
			complete: function(){
				if (callback) callback();
			}
		});
	},

	onUpdateSuccess: function(data) {
		Status.update(data);
		
		for (var i = 0; i < Feeder.size; i++) {
			Feeder.container[i].food = data.container[i].food;
			Feeder.container[i].amount = data.container[i].amount;
			Feeder.container[i].priority = data.container[i].priority;
			Feeder.container[i].filled = new Date(data.container[i].filled * 1000);
		}
			
		FeederView.update(data.feeder);
		EventView.update(data);
		ImageView.update(data.imagecount);		
		LogView.defaultData = data.log;
		if (LogView.isDefaultFilter())
			LogView.createTable();
	},

	checkForUpdate: function() {
		$.ajax({
			type: 'GET',
			url: 'api/checkforupdate',
			data: {version: Status.version},
			success: function(data) {
				if (data == 'true' || Network.reconnecting)
					Network.updateStatus(Network.checkForUpdate);
				else Network.checkForUpdate();
				Network.reconnecting = false;
			},
			error: function(){
				$('#status')[0].innerHTML = 'Failed to connect to server. Retrying...';
				Network.reconnecting = true;
				setTimeout(Network.checkForUpdate, Network.retryInterval);
			}
		});
	},
	
	onRequestComplete: function(result) {
		if (result.status == 200 && result.responseText == null || result.responseText == 'ok' || result.responseText == '')
			return;
		text = result.responseText;
		if (text == null || result.responseText == '') {
			switch(result.status) {
				case 401:
					text = 'Login required';
					break;
				case 400:
					text = 'Not allowed';
					break;
				case 503:
					text = 'Server Error';
					break;
				default: text = 'HTTP ' + result.status;
			}
		}
		Status.alert(text, result.status >= 400 ? 3 : 0);
	}
};