$(document).bind('keyup keydown', function(e){} );

FeederView = {
	shiftKey: false,
	ctrlKey: false,
	mousedown: false,
	
	svg: $('#svgcontainers')[0],
	indicator: $('#indicator')[0],
	target: $('#target')[0],
	detailsTitle: $('#foodDetailsTitle')[0],
	
	containers: new Array(),
	absoluteRotation: 0,
	lastClicked: -1,
	
	position: 0,
	positionstart: new Date(),
	positionend: new Date(),
	positionfrom: 0,
	positionto: 0,
	moving: false,
	rotation: 0,
	indicatorDefaultPosition: Math.PI,
	
	setup: function() {
		$(document).bind('keyup keydown', function(event){FeederView.onKeyPress(event);});
		window.addEventListener("mouseup", function(){FeederView.onMouseUp();});
		
		var proto = $('#containerprototype')[0];	
		
		for (var i = 0; i < Feeder.size; i++) {
			this.containers[i] = new Object();
			this.containers[i].container = Feeder.container[i];
			
			this.containers[i].selected = false;
			
			var svggroup = proto.cloneNode(true);
			this.containers[i].svggroup = svggroup;
			svggroup.id = "c" + i;
			svggroup.addEventListener("mousedown", this.onContainerMouseDown, false);
			svggroup.addEventListener("mousemove", this.onContainerMouseMove, false);
			svggroup.addEventListener("click", this.onContainerClick, false);
			this.svg.appendChild(svggroup);
			
			this.containers[i].svgpath = svggroup.children[0];
			this.containers[i].svgimage = svggroup.children[1];
			this.containers[i].svgstatus = svggroup.children[2];
			this.containers[i].svgtext = svggroup.children[3];
			this.containers[i].svgtext.innerHTML = (i+1);
		}
		this.svg.removeChild(proto);
		this.updateRotation();
		
		$('#containerdismiss')[0].onclick = this.onContainerDismiss;
		$('#btnfeedcontainer')[0].onclick = this.btnFeedClick;
		$('#btncalibrate')[0].onclick = this.btnCalibrateClick;
	},
	
	onKeyPress: function(event) {
		this.shiftKey = event.shiftKey;
		this.ctrlKey = event.ctrlKey
	},

	unselectAll: function() {
		for (var i = 0; i < Feeder.size; i++)
			this.containers[i].selected = false;
	},
	
	updateRotation: function() {
		this.rotation = - this.position + Feeder.size * this.indicatorDefaultPosition / (2 * Math.PI);
		this.indicator.setAttribute('transform','rotate(' + ((-this.position - this.rotation) * 360.0 / Feeder.size) + ',250,250)');								
		this.target.setAttribute('transform','rotate(' + ((-this.positionto - this.rotation) * 360.0 / Feeder.size) + ',250,250)');								
		for (var i = 0; i < Feeder.size; i++) {
			this.containers[i].svgpath.setAttribute('transform','rotate(' + ((- i - this.rotation) * 360.0 / Feeder.size) + ',250,250)');
			this.containers[i].svgimage.setAttribute('transform','rotate(' + ((- i - this.rotation) * 360.0 / Feeder.size) + ',250,250)');
			this.containers[i].svgstatus.setAttribute('transform','rotate(' + ((- i - this.rotation) * 360.0 / Feeder.size) + ',250,250)');
			this.containers[i].svgtext.setAttribute('transform','rotate(' + ((- i - this.rotation) * 360.0 / Feeder.size) + ',250,250)');
		}
	},

	getTargetIndex: function(event) {
		var index = 0;
		for (var i = 0; i < Feeder.size; i++)
			if (this.containers[i].svggroup == event.target.parentNode)
				index = i;
		return index;
	},

	onMouseDown: function(event) {
		var index = this.getTargetIndex(event);
		this.mousedown = true;
		if (!this.ctrlKey)
			this.unselectAll();
		if (this.shiftKey && this.lastClicked != -1) {
			var to = (index < this.lastClicked ? index + Feeder.size : index);
			for (var i = this.lastClicked; i <= to; i++)
				this.containers[(i % Feeder.size)].selected = true;
		}
		this.containers[index].selected = true;
		this.updateSelection();	
		this.lastClicked = index;
	},

	onMouseMove: function(event) {
		if (!this.mousedown)
			return;
		var index = this.getTargetIndex(event);	
		if (this.containers[index].selected)
			return;
		this.containers[index].selected = true;
		this.updateSelection();	
		this.lastClicked = index;
	},

	onMouseUp: function() {
		this.mousedown = false;
	},

	unselectAll: function() {
		for (var i = 0; i < Feeder.size; i++)
			this.containers[i].selected = false;
	},

	updateSelection: function() {
		var count = this.getSelectionCount();
		for (var i = 0; i < Feeder.size; i++) {
			this.containers[i].svggroup.setAttribute('class',(this.containers[i].selected ? 'containerselected' : 'container'));
		}
		this.detailsTitle.innerHTML = this.getSelectionInfo();
		
		var container = this.getFirstSelected();
		
		if (!$('#containerdetails').is(":visible") && container != null) {
			$('#containerdetails').show(400);
		}
		
		if (count == 1) {
			$('#btnmove').show();
			$('#btnfeedcontainer').show();
		} else {
			$('#btnmove').hide();
			$('#btnfeedcontainer').hide();
		}
		
		if (container != null) {
			ContainerEditor.food = container.food;
			ContainerEditor.amount = container.amount;
			ContainerEditor.priority = container.priority;
			
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
			
			for (var i = 0; i < Feeder.size; i++) {
				if (this.containers[i].selected && Feeder.container[i].food != container.food)
					multiplefoods = true;
				if (this.containers[i].selected && Feeder.container[i].amount != container.amount)
					multipleamounts = true;
				if (this.containers[i].selected && Feeder.container[i].priority != container.priority)
					multiplepriorities = true;
				if (this.containers[i].selected && Feeder.container[i].filled < start)
					start = Feeder.container[i].filled;
				if (this.containers[i].selected && Feeder.container[i].filled > end)
					end = Feeder.container[i].filled;
			}
			
			if (multiplefoods) {
				ContainerEditor.food = -1;
				$('#ddfoodtypecurrentimg')[0].style.display = 'none';
				$('#ddfoodtypecurrent')[0].innerHTML = '(Multiple)';
			}
			if (multipleamounts) {
				ContainerEditor.amount = -1;
				$('#ddamountcurrent')[0].innerHTML = '(Multiple)'
			}
			if (multiplepriorities) {
				ContainerEditor.priority = -1;
				$('#ddprioritycurrent')[0].innerHTML = '(Multiple)'
			}
			if (moment(start).fromNow() == moment(end).fromNow())
				$('#containerlastfilled')[0].innerHTML = moment(container.filled).fromNow();
			else $('#containerlastfilled')[0].innerHTML = "between " + moment(start).fromNow() + " and " + moment(end).fromNow();
		}
		$('#diveditcontainer').hide();
	},

	update: function(data) {
		for (var i = 0; i < Feeder.size; i++) {
			this.containers[i].svgimage.setAttribute('xlink:href',this.containers[i].container.isEmpty() ? '' : 'img/food' + this.containers[i].container.food + '.png');
			var statuses = ['containerstatusprefer', 'containerstatus','containerstatusdefer','containerstatusdontuse'];
			this.containers[i].svgstatus.setAttribute('class',statuses[this.containers[i].container.priority]);
		}
			
		this.position = data.position;
		this.moving = data.moving;
		if (this.moving) {
			this.positionstart = new Date();
			this.positionend = new Date(this.positionstart.getTime() + data.timeleft * 1000);
			this.position = data.start;
			this.positionfrom = data.start;
			this.positionto = data.position;
			this.moveAnimation();
		}
		if (this.moving)
			$(this.target).show(300);
		if (!this.moving && ($(this.target).is(":visible")))
			$(this.target).hide(0);
		this.updateRotation();
	},

	move: function() {
		var now = new Date();
		if (now.getTime() > this.positionend.getTime()) {
			this.position = this.positionto;
			this.moving = false;
		}
		else 
			this.position = this.positionfrom + (this.positionto - this.positionfrom) * (now.getTime() - this.positionstart.getTime()) / (this.positionend.getTime() - this.positionstart.getTime());
		this.updateRotation();
	},

	moveAnimation: function() {
		FeederView.move();
		if (FeederView.moving)
			setTimeout(FeederView.moveAnimation, 5);
	},

	getFirstSelected: function() {
		for (var i = 0; i < Feeder.size; i++)
			if (this.containers[i].selected)
				return this.containers[i].container;
		return null;
	},

	getFirstSelectedIndex: function() {
		for (var i = 0; i < Feeder.size; i++)
			if (this.containers[i].selected)
				return i;
		return -1;
	},

	getSelectionCount: function() {
		var count = 0;
		for (var i = 0; i < Feeder.size; i++)
			if (this.containers[i].selected)
				count++;
		return count;
	},
	
	getSelectionInfo: function() {
		var count = this.getSelectionCount();
		if (count == 0)
			return "(Nothing selected)";
		if (count == Feeder.size)
			return "All containers";	
		var first = -1;
		var last = -1;
		for (var i = 0; i < Feeder.size; i++) {
			if (this.containers[i].selected && first == -1)
				first = i;
			if ((i == Feeder.size-1 || !this.containers[i+1].selected) && first != -1 && last == -1)
				last = i;
			}
		if (first == 0) {
			for (var i = Feeder.size -1; i >= 0; i--)
				if (this.containers[i].selected)
					first = i;
				else break;
		}
		if (count == 1)
			return "Container " + (first + 1);
		var other = false;
		for (var i = 0; i < Feeder.size; i++)
			if (((first <= last && (i < first || i > last)) || (first > last && i > last && i < first)) && this.containers[i].selected)
				other = true;
		if (other)
			return count + " Containers"
		else return "Containers " + (first + 1) + " to " + (last + 1);
	},

	onContainerMouseDown: function(event) {
		FeederView.onMouseDown(event);
		event.preventDefault();
		return true;
	},

	onContainerMouseMove: function(event) {
		FeederView.onMouseMove(event);
		event.preventDefault();
		return true;
	},

	onContainerClick: function(event) {
		event.preventDefault();
		return true;
	},

	onContainerDismiss: function() {
		if ($('#containerdetails').is(":visible")) {
			FeederView.unselectAll(),
			FeederView.updateSelection();
			$('#containerdetails').hide(400);
		}
	},
	
	btnFeedClick: function() {
		if (!Status.checkLogin())
			return;	
		
		$("#containerloading").show();
		$.ajax({
			type: "POST",
			url: 'api/dump',
			data: {to: FeederView.getFirstSelectedIndex()},
			success: function(data) {
				if (data == 'loginrequired')
					alert('You need to be logged in to do this.');
				$("#containerloading").hide();
			},
			error: function(){
				$("#containerloading").hide();
			}
		});
	},
	
	btnCalibrateClick: function() {
		if (!Status.checkLogin())
			return;	
		
		$("#containerloading").show();
		$.ajax({
			type: "POST",
			url: 'api/calibrate',
			success: function(data) {
				if (data == 'loginrequired')
					alert('You need to be logged in to do this.');
				$("#containerloading").hide();	
			},
			error: function(){
				$("#containerloading").hide();	
			}
		});
	}
};

FeederView.setup();