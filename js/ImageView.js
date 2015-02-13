ImageView = {
	displayCount: 18,
	count: 0,
	images: new Array(),
	imgserver: '/pics/',
	btntakepictureenabled: true,
	firstupdate: true,
	
	wrapper: $('#showpicwrapper')[0],
	picture: $('#picture')[0],	
	description: $('#picdescription')[0],
	
	setup: function() {	
		var proto = $('#pictureprototype')[0];
		var container = $('#imagecontainer')[0];
		
		for (var i = 0; i < this.displayCount; i++) {
			this.images[i] = new Object();
			this.images[i].display = false;
			this.images[i].div = proto.cloneNode(true);
			this.images[i].img = this.images[i].div.children[0];
			container.appendChild(this.images[i].div);
		}
		
		$('#showpicwrapper').click(function() {$('#showpicwrapper').fadeOut(100);});
		$('#picprev').click(function() {ImageView.btnNextClick(1); return false;});
		$('#picnext').click(function() {ImageView.btnNextClick(-1); return false;});
		$('#btntakepicture')[0].onclick = this.takePicture;
	},
	
	getImageUrl: function(id) {
		return this.imgserver + 'img' + id + '.jpg';
	},

	update: function(count) {
		var oldcount = this.count;
		if (count != null)
			this.count = count;
		var p = 0;
		for (var i = count; i >= Math.max(this.count - this.displayCount + 1, 1); i--) {
			this.images[p].display = true;
			this.images[p].div.style.display = 'block';
			this.images[p].img.setAttribute('src', this.getImageUrl(i));
			this.images[p].id = i;
			$(this.images[p].img).click(this.makeShowImage(i));
			if (p < this.count - oldcount && oldcount != 0) {
				$(this.images[p].img).hide();
				var img = $(this.images[p].img);
				img.load(function() {
					img.show(400);
					$('#latestpicture')[0].setAttribute('src', ImageView.getImageUrl(ImageView.count));			
				});
			}
			p++;
		}
		
		if (this.firstupdate) {
			$('#latestpicture')[0].setAttribute('src', this.getImageUrl(this.count));
			$('#latestpicture').click(this.makeShowImage(this.count));
			this.firstupdate = false;
		}
	},

	showImage: function(id) {
		if (!$(ImageView.wrapper).is(":visible"))
			$(ImageView.wrapper).fadeIn(100);
		ImageView.description.innerHTML = id;
		ImageView.picture.setAttribute('src', ImageView.getImageUrl(id));
		ImageView.currentId = id;
	},

	makeShowImage: function(id) {
		return function() { ImageView.showImage(id); return false; }
	},

	btnNextClick: function(amount) {
		var newId = ImageView.currentId + amount;
		if (newId < 1)
			newId = ImageView.count;
		if (newId > ImageView.count)
			newId = 1;
		this.showImage(newId);
	},
	
	takePicture: function() {
		if (!ImageView.btntakepictureenabled)
			return;
		ImageView.btntakepictureenabled = false;
		$('#pictureloading').show();
		$.ajax({
			type: "POST",
			url: 'api/takepicture',
			complete: function(data){
				$('#pictureloading').hide();
				ImageView.btntakepictureenabled = true;
				Network.onRequestComplete(data);
			}
		});
	}
};

ImageView.setup();