var ContainerEditor = {
	btnsenabled: false,
	amounts: [0.1, 0.2, 0.33, 0.5, 0.66, 1, 1.5, 2],
	
	setup: function() {
		$('#containerbtncancel')[0].onclick = this.btnCancelClick;
		$('#containerbtnsubmit')[0].onclick = this.btnSubmitClick;
		
		$("#ddfoodtype .dropdown-menu li a").click( function(event) {ContainerEditor.dropDownFoodTypeClick(this); event.preventDefault();});
		$("#ddamount .dropdown-menu li a").click( function(event) {ContainerEditor.dropDownAmountClick(this); event.preventDefault();});
		$("#ddpriority .dropdown-menu li a").click( function(event) {ContainerEditor.dropDownPriorityClick(this); event.preventDefault();});
	},
	
	btnCancelClick: function() {
		if (!ContainerEditor.btnsenabled)
			return;
		FeederView.updateSelection();
	},
	
	btnSubmitClick: function() {
		if (!ContainerEditor.btnsenabled)
			return;
		$('#containerbtnsubmitloading').show();
		var containers = '';
		for (var i = 0; i < Feeder.size; i++)
			if (FeederView.containers[i].selected)
				containers += i + ',';
		$.ajax({
			type: "POST",
			url: 'api/updatecontainers',
			data: {containers: containers, food: ContainerEditor.food, amount: ContainerEditor.amount, priority: ContainerEditor.priority},
			success: function(data) {
				$('#containerbtnsubmitloading').hide();
				if (data == 'loginrequired') {
					alert('You need to be logged in to do this.');
					return;
				}
				for (var i = 0; i < Feeder.size; i++)
					if (FeederView.containers[i].selected) {
						if (ContainerEditor.food != -1)
							Feeder.container[i].food = ContainerEditor.food;
						if (ContainerEditor.amount != -1)
							Feeder.container[i].amount = ContainerEditor.amount;
						if (ContainerEditor.priority != -1)
							Feeder.container[i].priority = ContainerEditor.priority;
					}
				FeederView.updateSelection();
			},
			error: function(){
				$('#containerbtnsubmitloading').hide();
			}
		});
	},
	
	dropDownFoodTypeClick: function(element) {
		var index = $($(element)[0].parentNode.parentNode.children).index($(element)[0].parentNode);	
	
		if (index == 7)
			index = 0;
		else index++;
		ContainerEditor.food = index;
		if (index != 0) {
			$('#ddfoodtypecurrentimg')[0].src = 'img/food' + index + '.png';
			$('#ddfoodtypecurrentimg')[0].style.display = 'inline';
			$('#ddfoodtypecurrent')[0].innerHTML = '';
			if (ContainerEditor.amount == 0) {
				ContainerEditor.amount = 1;
				$('#ddamountcurrent')[0].innerHTML = 1;
			}
				
		} else {
			$('#ddfoodtypecurrentimg')[0].style.display = 'none';
			$('#ddfoodtypecurrent')[0].innerHTML = 'Empty';
			ContainerEditor.amount = 0;
			$('#ddamountcurrent')[0].innerHTML = '0';
		}
		if (ContainerEditor.food != -1 || ContainerEditor.amount != -1 || ContainerEditor.priority != -1) {
			$('#diveditcontainer').show()
			ContainerEditor.btnsenabled = true;
		}
	},
	
	dropDownAmountClick: function(element) {
		var index = $($(element)[0].parentNode.parentNode.children).index($(element)[0].parentNode);
		
		ContainerEditor.amount = ContainerEditor.amounts[index];
		$('#ddamountcurrent')[0].innerHTML = ContainerEditor.amounts[index];
		if (ContainerEditor.food != -1 || ContainerEditor.amount != -1 || ContainerEditor.priority != -1) {
			$('#diveditcontainer').show()
			ContainerEditor.btnsenabled = true;
		}
	},
	
	dropDownPriorityClick: function(element) {
		var index = $($(element)[0].parentNode.parentNode.children).index($(element)[0].parentNode);
		
		ContainerEditor.priority = index;
		$('#ddprioritycurrent')[0].innerHTML = $(element)[0].innerHTML;
		if (ContainerEditor.food != -1 || ContainerEditor.amount != -1 || ContainerEditor.priority != -1) {
			$('#diveditcontainer').show()
			ContainerEditor.btnsenabled = true;
		}
	}
};

ContainerEditor.setup();