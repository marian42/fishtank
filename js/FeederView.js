var shiftkey = false;
var ctrlkey = false;
$(document).bind('keyup keydown', function(e){shiftkey = e.shiftKey; ctrlkey = e.ctrlKey} );

function FeederView(feeder, svgId, prototypeId, indicatorId, targetId) {
	FeederView.instance = this;
	this.svg = document.getElementById(svgId);
	this.feeder = feeder;
	this.size = this.feeder.size;
	this.c = new Array();
	this.absoluteRotation = 0;
	this.lastClicked = -1;
	var proto = document.getElementById(prototypeId);
	this.svg.containerInstance = this;
	this.indicator = document.getElementById(indicatorId);
	this.target = document.getElementById(targetId);
	this.position = 0;
	this.positionstart = new Date();
	this.positionend = new Date();
	this.positionfrom = 0;
	this.positionto = 0;
	this.moving = false;
	this.rotation = 0;
	this.mousedown = false;
	for (var i = 0; i < this.size; i++) {
		this.c[i] = new Object();
		this.c[i].container = this.feeder.container[i];
		
		this.c[i].selected = false;
		
		var svggroup = proto.cloneNode(true);
		this.c[i].svggroup = svggroup;
		svggroup.id = "c" + i;
		svggroup.addEventListener("mousedown", onContainerMouseDown, false);
		svggroup.addEventListener("mousemove", onContainerMouseMove, false);
		svggroup.addEventListener("click", onContainerClick, false);
		this.svg.appendChild(svggroup);
		
		this.c[i].svgpath = svggroup.children[0];
		this.c[i].svgimage = svggroup.children[1];
		this.c[i].svgstatus = svggroup.children[2];
		this.c[i].svgtext = svggroup.children[3];
		this.c[i].svgtext.innerHTML = (i+1);
	}
	this.svg.removeChild(proto);
	this.updateRotation();
	
	this.detailsTitle = document.getElementById("foodDetailsTitle");
}

FeederView.prototype.unselectAll = function() {
	for (var i = 0; i < this.size; i++)
		this.c[i].selected = false;
}

FeederView.prototype.updateRotation = function() {
	this.rotation = - this.position;
	this.indicator.setAttribute('transform','rotate(' + ((this.position + this.rotation) * 360.0 / this.size) + ',250,250)');								
	this.target.setAttribute('transform','rotate(' + ((-this.positionto - this.rotation) * 360.0 / this.size) + ',250,250)');								
	for (var i = 0; i < this.size; i++) {
		this.c[i].svgpath.setAttribute('transform','rotate(' + ((- i - this.rotation) * 360.0 / this.size) + ',250,250)');
		this.c[i].svgimage.setAttribute('transform','rotate(' + ((- i - this.rotation) * 360.0 / this.size) + ',250,250)');
		this.c[i].svgstatus.setAttribute('transform','rotate(' + ((- i - this.rotation) * 360.0 / this.size) + ',250,250)');
		this.c[i].svgtext.setAttribute('transform','rotate(' + ((- i - this.rotation) * 360.0 / this.size) + ',250,250)');
	}
}

FeederView.prototype.getTargetIndex = function(event) {
	var index = 0;
	for (var i = 0; i < this.size; i++)
		if (this.c[i].svggroup == event.target.parentNode)
			index = i;
	return index;
}

FeederView.prototype.onMouseDown = function(event) {
	var index = this.getTargetIndex(event);
	this.mousedown = true;
	if (!ctrlkey)
		this.unselectAll();
	if (shiftkey && this.lastClicked != -1) {
		var to = (index < this.lastClicked ? index + this.size : index);
		for (var i = this.lastClicked; i <= to; i++)
			this.c[(i % this.size)].selected = true;
	}
	this.c[index].selected = true;
	this.updateSelection();	
	this.lastClicked = index;
}

FeederView.prototype.onMouseMove = function(event) {
	if (!this.mousedown)
		return;
	var index = this.getTargetIndex(event);	
	if (this.c[index].selected)
		return;
	this.c[index].selected = true;
	this.updateSelection();	
	this.lastClicked = index;
}

FeederView.prototype.onMouseUp = function() {
	this.mousedown = false;
}

FeederView.prototype.unselectAll = function() {
	for (var i = 0; i < this.size; i++)
		this.c[i].selected = false;
}

FeederView.prototype.updateSelection = function() {
	var count = this.getSelectionCount();
	for (var i = 0; i < this.size; i++) {
		this.c[i].svggroup.setAttribute('class',(this.c[i].selected ? 'containerselected' : 'container'));
	}
	this.detailsTitle.innerHTML = this.getSelectionInfo();
	
	var container = this.getFirstSelected();
	
	if (!$('#containerdetails').is(":visible") && container != null) {
		$('#containerdetails').show(400);
		//$('html, body').animate({scrollTop: ($("#containerdetails").offset().top - 60)}, 400);
	}
	
	if (count == 1) {
		$('#btnmove').show();
		$('#btnfeedcontainer').show();
	} else {
		$('#btnmove').hide();
		$('#btnfeedcontainer').hide();
	}
	
	if (container != null) {
		containerEditor.food = container.food;
		containerEditor.amount = container.amount;
		containerEditor.priority = container.priority;
		
		if (!container.isEmpty()) {
			$('#ddfoodtypecurrentimg')[0].src = 'img/food' + container.food + '.png';
			$('#ddfoodtypecurrentimg')[0].style.display = 'inline';
			$('#ddfoodtypecurrent')[0].innerHTML = '';
		} else {
			$('#ddfoodtypecurrentimg')[0].style.display = 'none';
			$('#ddfoodtypecurrent')[0].innerHTML = 'Empty';
		}
		
		$('#ddamountcurrent')[0].innerHTML = container.amount;
		
		var priorities = ['Prefer', 'Default', 'Defer', 'Don\'t use'];
		$('#ddprioritycurrent')[0].innerHTML = priorities[container.priority];
	
		var multiplefoods = false;
		var multipleamounts = false;
		var multiplepriorities = false;
		var start = container.filled;
		var end = container.filled;
		
		for (var i = 0; i < this.size; i++) {
			if (this.c[i].selected && this.feeder.container[i].food != container.food)
				multiplefoods = true;
			if (this.c[i].selected && this.feeder.container[i].amount != container.amount)
				multipleamounts = true;
			if (this.c[i].selected && this.feeder.container[i].priority != container.priority)
				multiplepriorities = true;
			if (this.c[i].selected && this.feeder.container[i].filled < start)
				start = this.feeder.container[i].filled;
			if (this.c[i].selected && this.feeder.container[i].filled > end)
				end = this.feeder.container[i].filled;
		}
		
		if (multiplefoods) {
			containerEditor.food = -1;
			$('#ddfoodtypecurrentimg')[0].style.display = 'none';
			$('#ddfoodtypecurrent')[0].innerHTML = '(Multiple)';
		}
		if (multipleamounts) {
			containerEditor.amount = -1;
			$('#ddamountcurrent')[0].innerHTML = '(Multiple)'
		}
		if (multiplepriorities) {
			containerEditor.priority = -1;
			$('#ddprioritycurrent')[0].innerHTML = '(Multiple)'
		}
		if (moment(start).fromNow() == moment(end).fromNow())
			$('#containerlastfilled')[0].innerHTML = moment(container.filled).fromNow();
		else $('#containerlastfilled')[0].innerHTML = "between " + moment(start).fromNow() + " and " + moment(end).fromNow();
	}
	$('#diveditcontainer').hide();
}

FeederView.prototype.update = function(data) {
	for (var i = 0; i < this.size; i++) {
		this.c[i].svgimage.setAttribute('xlink:href',this.c[i].container.isEmpty() ? '' : 'img/food' + this.c[i].container.food + '.png');
		var statuses = ['containerstatusprefer', 'containerstatus','containerstatusdefer','containerstatusdontuse'];
		this.c[i].svgstatus.setAttribute('class',statuses[this.c[i].container.priority]);
	}
		
	this.position = data.position;
	this.moving = data.moving;
	if (this.moving) {
		this.positionstart = new Date();
		this.positionend = new Date(this.positionstart.getTime() + data.timeleft * 1000);
		this.position = data.start;
		this.positionfrom = data.start;
		this.positionto = data.position;
		moveAnimation();
	}
	if (this.moving)
		$(this.target).show(300);
	if (!this.moving && ($(this.target).is(":visible")))
		$(this.target).hide(0);
	this.updateRotation();
}

FeederView.prototype.move = function() {
	var now = new Date();
	if (now.getTime() > this.positionend.getTime()) {
		this.position = this.positionto;
		this.moving = false;
	}
	else 
		this.position = this.positionfrom + (this.positionto - this.positionfrom) * (now.getTime() - this.positionstart.getTime()) / (this.positionend.getTime() - this.positionstart.getTime());
	this.updateRotation();
}

function moveAnimation() {
	FeederView.instance.move();
	if (FeederView.instance.moving)
		setTimeout(moveAnimation,5);
}

FeederView.prototype.getFirstSelected = function() {
	for (var i = 0; i < this.size; i++)
		if (this.c[i].selected)
			return this.c[i].container;
	return null;
}

FeederView.prototype.getFirstSelectedIndex = function() {
	for (var i = 0; i < this.size; i++)
		if (this.c[i].selected)
			return i;
	return -1;
}

FeederView.prototype.getSelectionCount = function() {
	var count = 0;
	for (var i = 0; i < this.size; i++)
		if (this.c[i].selected)
			count++;
	return count;
}

FeederView.prototype.getSelectionInfo = function() {
	var count = this.getSelectionCount();
	if (count == 0)
		return "(Nothing selected)";
	if (count == this.size)
		return "All containers";	
	var first = -1;
	var last = -1;
	for (var i = 0; i < this.size; i++) {
		if (this.c[i].selected && first == -1)
			first = i;
		if ((i == this.size-1 || !this.c[i+1].selected) && first != -1 && last == -1)
			last = i;
		}
	if (first == 0) {
		for (var i = this.size -1; i >= 0; i--)
			if (this.c[i].selected)
				first = i;
			else break;
	}
	if (count == 1)
		return "Container " + (first + 1);
	var other = false;
	for (var i = 0; i < this.size; i++)
		if (((first <= last && (i < first || i > last)) || (first > last && i > last && i < first)) && this.c[i].selected)
			other = true;
	if (other)
		return count + " Containers"
	else return "Containers " + (first + 1) + " to " + (last + 1);
}

function onContainerMouseDown(event) {
	event.target.parentNode.parentNode.containerInstance.onMouseDown(event);
	event.preventDefault();
	return true;
}

function onContainerMouseMove(event) {
	event.target.parentNode.parentNode.containerInstance.onMouseMove(event);
	event.preventDefault();
	return true;
}

function onContainerClick(event) {
	event.preventDefault();
	return true;
}

$('#containerdismiss').click(function() {
	if ($('#containerdetails').is(":visible")) {
		feederView.unselectAll(),
		feederView.updateSelection();
		$('#containerdetails').hide(400);
	}
});