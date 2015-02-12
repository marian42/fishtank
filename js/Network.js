Network = {
	reconnecting: false,
	retryInterval: 5000,

	updateStatus: function(callback) {
		$.ajax({
			type: "GET",
			url: 'api/status',
			success: function(data) {
				Network.onUpdateSuccess(data);
				if (callback) callback();
			},
			error: function(){
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
		LogView.createTable(data.log);
	},

	checkForUpdate: function() {
		$.ajax({
			type: 'GET',
			url: 'api/checkforupdate',
			data: 'version=' + Status.version,
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
	}
};