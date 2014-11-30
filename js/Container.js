function Container() {
	this.food = 0;
	this.amount = 0;
	this.filled = 0;
	this.priority = 0;
}

Container.prototype.isEmpty = function() {
	return (this.food == 0 || this.amount == 0);
}