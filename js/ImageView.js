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
}

ImageView.prototype.update = function(count) {
	var oldcount = this.count;
	if (count != null)
		this.count = count;
	var p = 0;
	for (var i = count; i > Math.max(this.count - this.displayCount,1); i--) {
		this.images[p].display = true;
		this.images[p].div.style.display = 'block';
		this.images[p].img.setAttribute('src',this.imgserver + 'img' + i + '.jpg');
		this.images[p].id = i;
		if (p < this.count - oldcount) {
			$(this.images[p].img).hide();
			$(this.images[p].img).show(400);
		}
		p++;
	}
	
	$('#latestpicture')[0].setAttribute('src',this.imgserver + 'img' + this.count + '.jpg');
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