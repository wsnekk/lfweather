var widget = document.getElementsByClassName("device-widget square");
var pageWidth = document.getElementById("widget-wrap").offsetWidth;
var needle = document.getElementsByClassName("needle");
var rainsquare = document.getElementsByClassName("device-widget square rain");
var aqisquare = document.getElementsByClassName("device-widget square air");
if (pageWidth < 1197) {
	var i;
	for (i = 0; i < widget.length; i++) {
		widget[i].style.height = ((widget[i].offsetWidth * 0.8) + 'px');
	}
	needle[0].style.height = (((widget[0].offsetWidth) - 20) + 'px');
	aqisquare[0].style.height = (((widget[0].offsetWidth) - 30) + 'px');
} else {
	var i;
	for (i = 0; i < widget.length; i++) {
		widget[i].style.height = 'auto';
	}
	needle[0].style.height = (((widget[0].offsetWidth) - 20) + 'px');
	rainsquare[0].style.height = ((widget[0].offsetWidth) + 'px');
	aqisquare[0].style.height = (((widget[0].offsetWidth) - 30) + 'px');
}

var coll = document.getElementsByClassName("collapsible");
var i;

for (i = 0; i < coll.length; i++) {
	coll[i].addEventListener("click", function() {
		this.classList.toggle("active");
		var content = this.nextElementSibling;
		if (content.style.maxHeight) {
			content.style.maxHeight = null;
		} else {
			content.style.maxHeight = content.scrollHeight + "px";
		}
		if (this.innerHTML == "Open Hourly") {
			this.innerHTML = "Close Hourly";
		} else if (this.innerHTML == "Close Hourly") {
			this.innerHTML = "Open Hourly";
		}
		
		if (this.innerHTML == "Open Daily") {
			this.innerHTML = "Close Daily";
		} else if (this.innerHTML == "Close Daily") {
			this.innerHTML = "Open Daily";
		}
	});
}