function Feeder(size) {
	this.container = new Array();
	this.size = size;
	for (var i = 0; i < size; i++)
		this.container[i] = new Container();
}

Feeder.prototype.getTotalAmountOfFood = function() {
	var sum = 0;
	for (var i = 0; i < this.size; i++)
		sum += this.container[i].amount;
	return sum;
}