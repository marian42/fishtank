function ImageView() {
	this.displayCount = 18;
	this.count = 0;
	this.images = new Array();
	var proto = $('#pictureprototype')[0];
	var container = $('#imagecontainer')[0];
	this.imgserver = '/pics/'
	for (var i = 0; i < this.displayCount; i++) {
		this.images[i] = new Object();
		this.images[i].display = false;
		this.images[i].div = proto.cloneNode(true);
		this.images[i].img = this.images[i].div.children[0];
		container.appendChild(this.images[i].div);
	}
	
	this.wrapper = $('#showpicwrapper')[0];
	this.picture = $('#picture')[0];	
	this.description = $('#picdescription')[0];
	this.btnprev = $('#picprev')[0];
	this.btnnext = $('#picnext')[0];
	ImageView.instance = this;
	
	$(this.btnprev).click(function() {btnNextClick(1); return false;});
	$(this.btnnext).click(function() {btnNextClick(-1); return false;});	
}

ImageView.prototype.update = function(count) {
	var oldcount = this.count;
	if (count != null)
		this.count = count;
	var p = 0;
	for (var i = count; i >= Math.max(this.count - this.displayCount,1); i--) {
		this.images[p].display = true;
		this.images[p].div.style.display = 'block';
		this.images[p].img.setAttribute('src', this.imgserver + 'img' + i + '.jpg');
		this.images[p].id = i;
		$(this.images[p].img).click(makeShowImage(i));
		if (p < this.count - oldcount && oldcount != 0) {
			$(this.images[p].img).hide();
			var img = $(this.images[p].img);
			img.load(function() {
				img.show(400);
			});
		}
		p++;
	}
	
	$('#latestpicture')[0].setAttribute('src',this.imgserver + 'img' + this.count + '.jpg');
	$('#latestpicture').click(makeShowImage(this.count));
}

showImage = function(id) {
	if (!$(ImageView.instance.wrapper).is(":visible"))
		$(ImageView.instance.wrapper).fadeIn(100);
	ImageView.instance.description.innerHTML = id;
	ImageView.instance.picture.setAttribute('src', ImageView.instance.imgserver + 'img' + id + '.jpg');
	ImageView.instance.currentId = id;
}

makeShowImage = function(id) {
	return function() { showImage(id); return false; }
}

btnNextClick = function(amount) {
	var newId = ImageView.instance.currentId + amount;
	if (newId < 1)
		newId = ImageView.instance.count;
	if (newId > ImageView.instance.count)
		newId = 1;
	showImage(newId);
}

var btntakepictureenabled = true;
$('#btntakepicture').click(function() {
	if (!btntakepictureenabled)
		return;
	btntakepictureenabled = false;
	$('#pictureloading').show();
	$.ajax({
		type: "POST",
		url: 'api/takepicture',
		success: function(data) {
			network.updateStatus();
			$('#pictureloading').hide();
			btntakepictureenabled = true;
		},
		error: function(){
			$('#pictureloading').hide();
			btntakepictureenabled = true;
		}
	});
});

$('#showpicwrapper').click(function() {
	$(ImageView.instance.wrapper).fadeOut(100);
});