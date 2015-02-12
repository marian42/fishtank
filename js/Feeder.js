Feeder = {
	size: 27,
	container: new Array(),
	
	setup: function() {
		for (var i = 0; i < this.size; i++)
			this.container[i] = new Container();
	},
	
	getTotalAmountOfFood: function() {
		var sum = 0;
		for (var i = 0; i < this.size; i++)
			sum += this.container[i].amount;
		return sum;
	}
};

Feeder.setup();