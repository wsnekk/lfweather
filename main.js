var request = new XMLHttpRequest();
var data = {};
var bigData = {};
var currentDate = new Date();
var timeUpdateLoop = false;
var minutesAgo;
var lastData;
var lastRainDate;
var updateLoop;
var geocodedResponse;
var reverseGeocodedResponse;
var geocode;
var dataError = false;
var unitsTemp = 'F';
var unitsAmount = 'in';
var unitsRate = 'in/hr';
var unitsSpeed = 'mph';
var unitsDistance = 'miles';

function setCookie(cname, cvalue, exdays) {
	var d = new Date();
	d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
	var expires = "expires=" + d.toUTCString();
	document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
	var name = cname + "=";
	var ca = document.cookie.split(';');
	for (var i = 0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == ' ') {
			c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length);
		}
	}
	return "";
}

function latToAddress(inLat, inLong) {
	var geocodeRequest = new XMLHttpRequest();
	geocodeRequest.open('GET', 'https://us1.locationiq.com/v1/reverse.php?key=c42be66f0066c5&lat=' + inLat + '&lon=' + inLong + '&format=json');
	geocodeRequest.onreadystatechange = function () {
		if (this.readyState === 4) {
			reverseGeocodedResponse = JSON.parse(this.responseText);
			console.log('Reverse geocode data recieved: ', reverseGeocodedResponse);
			geocode = 'backward';
			return reverseGeocodedResponse.display_name;
		}
	}
	geocodeRequest.send();
}

function addressToLat() {
	if (document.getElementById('weatherLocationSearchBox').value != "") {
		console.log('User searching for location, searching...');
		document.getElementById('rainCurrentText').style.display='block';
		document.getElementById('rainCurrentText').innerHTML='Requesting Location...';
		var geocodeRequest = new XMLHttpRequest();
		geocodeRequest.open('GET', 'https://us1.locationiq.com/v1/search.php?key=c42be66f0066c5&q=' + document.getElementById('weatherLocationSearchBox').value + '&format=json');
		geocodeRequest.onreadystatechange = function () {
			if (this.readyState === 4) {
				geocodedResponse = JSON.parse(this.responseText);
				console.log('Geocode data recieved: ', geocodedResponse);
				lat = geocodedResponse[0].lat;
				lon = geocodedResponse[0].lon;
				url = ('https://lfweather.herokuapp.com/forecast/' + lat + ',' + lon);
				customLocation = true;
				geocode = 'forward';
				getData(true);
			}
		}
		geocodeRequest.send();
	} else { 
		console.log('Search box empty...');
		document.getElementById('rainCurrentText').style.display='block';
		document.getElementById('rainCurrentText').innerHTML='Search box is empty, please enter a place';
	}					
}

request.open('GET', 'https://ambientweather.herokuapp.com/current/13');

request.onreadystatechange = function () {
	if (this.readyState === 4) {
		currentDate = new Date();
		try {
			data = JSON.parse(this.responseText);
		} catch(err) {
			console.log('!Error fetching AmbientWeather data! Message: ' + err + '. Re-requesting in 3 seconds...');
			gtag('event', 'exception', {
				'description': ('AmbientWeather Request failed: ' + err),
				'fatal': false
			});
			ga("gtag_UA_52495574_19.send", "event", {eventCategory: "error", eventAction: "data", eventLabel: "AmbientWeather request failed", eventValue: 0});
			setTimeout(function() {
				ga("gtag_UA_52495574_19.send", "event", {eventCategory: "data", eventAction: "reRequest", eventLabel: "Re-requesting failed AmbientWeather", eventValue: 0});
				fetchData();
				}, 8000);
			return;
		}
		lastRainDate = new Date(data[0].lastRain);
		minutesAgo = Math.floor((currentDate - data[0].dateutc) / 60000);
		document.getElementById('compass').style.transform='rotate(' + data[0].winddir + 'deg)';
		
		if (data[0].windspeedmph === 0) {
			document.getElementById('windSpeed').innerHTML='0.0';
		} else {
			document.getElementById('windSpeed').innerHTML=data[0].windspeedmph;
		}
		if (data[0].windgustmph === 0) {
			document.getElementById('gusts').innerHTML='0.0';
		} else {
			document.getElementById('gusts').innerHTML=data[0].windgustmph;
		}
		
		document.getElementById('maxWind').innerHTML=data[0].maxdailygust;
		document.getElementById('temp').innerHTML=data[0].tempf;
		
		if (minutesAgo == 1) {
			document.getElementById('currentText').innerHTML='Current Conditions - ' + minutesAgo + ' minute ago';
		} else {
			document.getElementById('currentText').innerHTML='Current Conditions - ' + minutesAgo + ' minutes ago';
		}
		
		document.getElementById('currentPM25').innerHTML=data[0].pm25;
		document.getElementById('averagePM25').innerHTML=data[0].pm25_24h;
		var ea;
		var tempMaxPM = 0;
		for (ea = 0; ea < data.length; ea++) {
			if (data[ea].pm25 > tempMaxPM) {
				tempMaxPM = data[ea].pm25;
			}
		}
		document.getElementById('maxPM25').innerHTML=tempMaxPM;
		if (data[0].pm25 <= 12) {
			document.getElementById('aqiLabel').innerHTML="GOOD";
			document.getElementById('aqiNeedle').style.transform='rotate(' + (27 * data[0].pm25 / 12 - 88) + 'deg)';
			document.getElementById('aqiLabel').style.color="#00de94";
		} else if (data[0].pm25 < 35.5) {
			document.getElementById('aqiLabel').innerHTML="MODERATE";
			document.getElementById('aqiNeedle').style.transform='rotate(' + (31 * (data[0].pm25 - 12) / 23.49 - 61) + 'deg)';
			document.getElementById('aqiLabel').style.color="#FFDE32";
		} else if (data[0].pm25 < 55.5) {
			document.getElementById('aqiLabel').innerHTML="UNHEALTHY FOR SENSITIVE GROUPS";
			document.getElementById('aqiNeedle').style.transform='rotate(' + (30 * (data[0].pm25 - 35.49) / 19.99 - 30) + 'deg)';
			document.getElementById('aqiLabel').style.color="#ffa345";
		} else if (data[0].pm25 < 150.5) {
			document.getElementById('aqiLabel').innerHTML="UNHEALTHY";
			document.getElementById('aqiNeedle').style.transform='rotate(' + (30 * (data[0].pm25 - 55.49) / 94.99) + 'deg)';
			document.getElementById('aqiLabel').style.color="#ff6363";
		} else if (data[0].pm25 < 250.5) {
			document.getElementById('aqiLabel').innerHTML="VERY UNHEALTHY";
			document.getElementById('aqiNeedle').style.transform='rotate(' + (30 + 31 * (data[0].pm25 - 150.49) / 99.99) + 'deg)';
			document.getElementById('aqiLabel').style.color="#cd6aff";
		} else {
			document.getElementById('aqiLabel').innerHTML="HAZARDOUS";
			document.getElementById('aqiNeedle').style.transform='rotate(' + (61 + 27 * (data[0].pm25 - 250.49) / 249.5) + 'deg)';
			document.getElementById('aqiLabel').style.color="#67021E";
		}
		
		document.getElementById('dewPoint').innerHTML=data[0].dewPoint;
		document.getElementById('feelsLike').innerHTML=data[0].feelsLike;
		document.getElementById('humidity').innerHTML=data[0].humidity;
		document.getElementById('barometerINHG').innerHTML=data[0].baromrelin;
		document.getElementById('barometerPointerIcon').style.transform='rotate(' + ((-168) + ((data[0].baromrelin - 27.75) / 0.0625 * 3.66) ) + 'deg)';
		document.getElementById('eventRain').innerHTML=data[0].eventrainin;
		document.getElementById('hourlyRain').innerHTML=data[0].hourlyrainin;
		document.getElementById('dailyRain').innerHTML=data[0].dailyrainin;
		document.getElementById('weeklyRain').innerHTML=data[0].weeklyrainin;
		document.getElementById('monthlyRain').innerHTML=data[0].monthlyrainin;
		document.getElementById('yearlyRain').innerHTML=data[0].yearlyrainin;
		document.getElementById('barometerChange').innerHTML=((data[0].baromrelin - data[12].baromrelin).toFixed(2));
		
		if (data[0].baromrelin - data[12].baromrelin > 0.06) {
			document.getElementById("barometerChangeWrap").className = "change upRapid";
			document.getElementById('barometerIcon').src = "weatherIcons/sunny.png";
			document.getElementById('barometerIcon').alt = "Sunny";
			document.getElementById('barometerIcon').style.display = "";
		} else if (data[0].baromrelin - data[12].baromrelin > 0.03) {
			document.getElementById("barometerChangeWrap").className = "change upFast";
			document.getElementById('barometerIcon').src = "weatherIcons/sunny.png";
			document.getElementById('barometerIcon').alt = "Sunny";
			document.getElementById('barometerIcon').style.display = "";
		} else if (data[0].baromrelin - data[12].baromrelin > 0) {
			document.getElementById("barometerChangeWrap").className = "change up";
			document.getElementById('barometerIcon').src = "weatherIcons/partlyCloudy.png";
			document.getElementById('barometerIcon').alt = "Partly Cloudy";
			document.getElementById('barometerIcon').style.display = "";
		} else if (data[0].baromrelin - data[12].baromrelin < -0.06) {
			document.getElementById("barometerChangeWrap").className = "change downRapid";
			document.getElementById('barometerIcon').src = "weatherIcons/thunderStorm.png";
			document.getElementById('barometerIcon').alt = "Thunder";
			document.getElementById('barometerIcon').style.display = "";
		} else if (data[0].baromrelin - data[12].baromrelin < -0.03) {
			document.getElementById("barometerChangeWrap").className = "change downFast";
			document.getElementById('barometerIcon').src = "weatherIcons/rainy.png";
			document.getElementById('barometerIcon').alt = "Rainy";
			document.getElementById('barometerIcon').style.display = "";
		} else if (data[0].baromrelin - data[12].baromrelin < 0) {
			document.getElementById("barometerChangeWrap").className = "change down";
			document.getElementById('barometerIcon').src = "weatherIcons/cloudy.png";
			document.getElementById('barometerIcon').alt = "Cloudy";
			document.getElementById('barometerIcon').style.display = "";
		} else {
			document.getElementById("barometerChangeWrap").className = "change stable";
			document.getElementById('barometerIcon').src = "";
			document.getElementById('barometerIcon').alt = "Sustained";
			document.getElementById('barometerIcon').style.display = "none";
		}
		
		if (data[0].hourlyrainin >= 0.23) {
			document.getElementById("rainText").innerHTML = "Heavy Rain";
			document.getElementById('rainText').style.color = "#73BFFF";
		} else if (data[0].hourlyrainin >= 0.08) {
			document.getElementById("rainText").innerHTML = "Moderate Rain";
			document.getElementById('rainText').style.color = "#6DC6D4";
		} else if (data[0].hourlyrainin >= 0.03) {
			document.getElementById("rainText").innerHTML = "Light Rain";
			document.getElementById('rainText').style.color = "#4ED2E6";
		} else if (data[0].hourlyrainin > 0) {
			document.getElementById("rainText").innerHTML = "Drizzle";
			document.getElementById('rainText').style.color = "#00F3FF";
		} else {
			document.getElementById("rainText").innerHTML = "Not Raining";
			document.getElementById('rainText').style.color = "#FFFFEA";
		}
		
		if (timeUpdateLoop === false) {
			timeUpdateLoop = true;
			bigData = data;
			if (data[0].hourlyrainin > 0) {
				ga("gtag_UA_52495574_19.send", "event", {eventCategory: "data", eventAction: "rainData", eventLabel: "Rain in past 60 minutes", eventValue: 0});
				buildChart(false);
			} else {
				ga("gtag_UA_52495574_19.send", "event", {eventCategory: "data", eventAction: "rainData", eventLabel: "No rain in past 60 minutes", eventValue: 0});
				console.log('No rain in last hour, not building past hour chart. Minutes since last rain: ' + ((currentDate.getTime() - lastRainDate.getTime()) / 1000 / 60));
			}
			console.log('Starting time update loop');
			updateLoop = setInterval(updateTime, 10000);
		} else if (data[0].hourlyrainin > 0) {
			if (data[1].hourlyrainin > 0) {
				buildChart(true);
			} else {
				buildChart(false);
			}
		}
		
		if (lastData == data[0].dateutc) {
			console.log('Same data retrived (' + data[0].date + '), re-fetching in 2 minutes');
		} else {
			lastData = data[0].dateutc;
			console.log('New data:', data);
		}
	}
};

request.onerror = function () {
	document.getElementById('errorMessage').style.display='block';
	dataError = true;
	gtag('event', 'exception', {
		'description': 'AmbientWeather data request failed',
		'fatal': false
	});
	ga("gtag_UA_52495574_19.send", "event", {eventCategory: "error", eventAction: "data", eventLabel: "AmbientWeather request failed", eventValue: 0});
};

request.send();

function updateTime(){
	currentDate = new Date();
	if (minutesAgo !== Math.floor((currentDate - data[0].dateutc) / 60000)) {
		console.log('Updating from ' + minutesAgo + ' to ' + Math.floor((currentDate - data[0].dateutc) / 60000) + ' minutes ago');
		minutesAgo = Math.floor((currentDate - data[0].dateutc) / 60000);
		if (minutesAgo == 1) {
			document.getElementById('currentText').innerHTML='Current Conditions - ' + minutesAgo + ' minute ago';
		} else {
			document.getElementById('currentText').innerHTML='Current Conditions - ' + minutesAgo + ' minutes ago';
		}
		if (minutesAgo >= 8 && (minutesAgo % 2) == 0) {
			fetchData();
		}
	}
};

function fetchData(){
	console.log('Fetching new data...');
	request.open('GET', 'https://ambientweather.herokuapp.com/current/13');
	request.send();
}

window.addEventListener("resize", function() {
	var widget = document.getElementsByClassName("device-widget square");
	var rainsquare = document.getElementsByClassName("device-widget square rain");
	var needle = document.getElementsByClassName("needle");
	var entirePageWidth = document.getElementById("widget-wrap").offsetWidth;
	var aqisquare = document.getElementsByClassName("device-widget square air");
	if (entirePageWidth < 1197) {
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
		rainsquare[0].style.height = ((widget[0].offsetWidth) + 'px');
		needle[0].style.height = (((widget[0].offsetWidth) - 20) + 'px');
		aqisquare[0].style.height = (((widget[0].offsetWidth) - 30) + 'px');
	}
});

function buildChart(alreadyBuilt) {
	console.log("Queing Past Rain Chart...");
	google.charts.load('current', {packages: ['corechart', 'line']});
	google.charts.setOnLoadCallback(drawCurveTypes);
	
	var times = [];
	var rates = [];
	var totals = [];
	var e;
	for (e = 0; e < data.length; e++) {
		times.push(Math.round((currentDate - data[e].dateutc) / 60000));
		rates.push(data[e].hourlyrainin);
		totals.push(data[e].eventrainin);
	}
	
	function drawCurveTypes() {
		var times = [];
		var rates = [];
		var totals = [];
		var e;
		for (e = 0; e < data.length; e++) {
			times.push(Math.round((currentDate - data[e].dateutc) / 60000));
			rates.push(data[e].hourlyrainin);
			totals.push(data[e].eventrainin);
		}
		var chartData = new google.visualization.DataTable();
		chartData.addColumn('number', 'X');
		chartData.addColumn('number', 'Rate');
		chartData.addColumn('number', 'Event Total');

		chartData.addRows([
			[times[12], rates[12], totals[12]],
			[times[11], rates[11], totals[11]],
			[times[10], rates[10], totals[10]],
			[times[9], rates[9], totals[9]],
			[times[8], rates[8], totals[8]],
			[times[7], rates[7], totals[7]],
			[times[6], rates[6], totals[6]],
			[times[5], rates[5], totals[5]],
			[times[4], rates[4], totals[4]],
			[times[3], rates[3], totals[3]],
			[times[2], rates[2], totals[2]],
			[times[1], rates[1], totals[1]],
			[times[0], rates[0], totals[0]]
		]);

		var options = {
			title: 'Rain in the past hour',
			titleTextStyle: {
				color: '#FFFFEA',
				fontName: 'verdana'
			},
			hAxis: {
				title: 'Minutes ago',
				direction: '-1',
				baselineColor: '#FFFFEA',
				textStyle: {
					color: '#FFFFEA',
					fontName: 'verdana',
					italic: true
				},
				titleTextStyle: {
					color: '#FFFFEA',
					fontName: 'verdana',
					italic: true
				},
				gridlines: {
					color: '#FFFFEA'
				}
			},
			vAxis: {
				title: 'Rain (in)',
				baselineColor: '#FFFFEA',
				textStyle: {
					color: '#FFFFEA',
					fontName: 'verdana',
					italic: true
				},
				titleTextStyle: {
					color: '#FFFFEA',
					fontName: 'verdana',
					italic: true
				},
				gridlines: {
					color: '#FFFFEA'
				}
			},
			legend: {
				textStyle: {
					color: '#FFFFEA',
					fontName: 'verdana'
				},
				position: 'top',
				alignment: 'end'
			},
			width: '100%',
			height: '100%',
			backgroundColor: '#0843A2',
			colors: ['#99F5FF', '#80FF80']
		};

		var chart = new google.visualization.LineChart(document.getElementById('chart_div'));
		chart.draw(chartData, options);
	}
	
	if (alreadyBuilt === true) {
		drawCurveTypes();
	}
	
	$(window).resize(function(){
		drawCurveTypes();
	});
}

var lat = '33.646963';
var lon = '-117.686047';
var customLocation = false;
var url = ('https://lfweather.herokuapp.com/forecast/' + lat + ',' + lon);
var darkSkyData = {};
var darkRequest = new XMLHttpRequest();
var darkCurrentDate = new Date();
var queued = false;
var simpleChart = true;

function currentlyDark() {
	console.log('Stopping AmbientWeather update loop and using Dark Sky data!');
	clearInterval(updateLoop);
	currentDate = new Date();
	document.getElementById('compass').style.transform='rotate(' + darkSkyData.currently.windBearing + 'deg)';
	
	if (darkSkyData.currently.windSpeed === 0) {
		document.getElementById('windSpeed').innerHTML='0.0';
	} else {
		document.getElementById('windSpeed').innerHTML=(darkSkyData.currently.windSpeed).toFixed(1);
	}
	if (darkSkyData.currently.windGust === 0) {
		document.getElementById('gusts').innerHTML='0.0';
	} else {
		document.getElementById('gusts').innerHTML=darkSkyData.currently.windGust;
	}
	
	document.getElementById('maxWind').innerHTML=darkSkyData.daily.data[0].windGust;
	document.getElementById('temp').innerHTML=(darkSkyData.currently.temperature).toFixed(1);
	
	if (geocode == 'backward') {
		if (reverseGeocodedResponse.address.city) {
			document.getElementById('currentText').innerHTML='Current Conditions for ' + reverseGeocodedResponse.address.city + ', ' + reverseGeocodedResponse.address.state;
			document.getElementById('forecastText').innerHTML='For ' + reverseGeocodedResponse.address.city + ', ' + reverseGeocodedResponse.address.state;
		} else {
			document.getElementById('currentText').innerHTML='Current Conditions for ' + reverseGeocodedResponse.display_name;
			document.getElementById('forecastText').innerHTML='For ' + reverseGeocodedResponse.display_name;
		}
	} else if (geocode == 'forward') {
		if (geocodedResponse[0].address) {
			document.getElementById('currentText').innerHTML='Current Conditions for ' + geocodedResponse[0].address.city + ', ' + geocodedResponse[0].address.state;
			document.getElementById('forecastText').innerHTML='For ' + geocodedResponse[0].address.city + ', ' + geocodedResponse[0].address.state;
		} else {
			document.getElementById('currentText').innerHTML='Current Conditions for ' + geocodedResponse[0].display_name;
			document.getElementById('forecastText').innerHTML='For ' + geocodedResponse[0].display_name;
		}
	}
	document.getElementById('dewPoint').innerHTML=darkSkyData.currently.dewPoint;
	document.getElementById('feelsLike').innerHTML=darkSkyData.currently.apparentTemperature;
	document.getElementById('humidity').innerHTML= (Math.round(darkSkyData.currently.humidity * 100));
	document.getElementById('barometerINHG').innerHTML=(darkSkyData.currently.pressure / 33.8638866).toFixed(2);
	document.getElementById('barometerPointerIcon').style.transform='rotate(' + ((-168) + (((darkSkyData.currently.pressure / 33.8638866) - 27.75) / 0.0625 * 3.66) ) + 'deg)';
	document.getElementById('eventRain').innerHTML=(darkSkyData.daily.data[0].precipIntensity).toFixed(2);
	document.getElementById('hourlyRain').innerHTML=darkSkyData.currently.precipIntensity;
	document.getElementById('dailyRain').innerHTML=(darkSkyData.daily.data[0].precipIntensity * 24).toFixed(2);
	document.getElementById('bottomRain').style.display='none';
	document.getElementById('barometerChange').innerHTML=((Math.round(darkSkyData.hourly.data[1].pressure / 33.8638866) - Math.round(darkSkyData.currently.pressure / 33.8638866)).toFixed(2));
	//document.getElementById('rainChartDiv').innerHTML = "chart_div";
	
	if (((darkSkyData.hourly.data[1].pressure / 33.8638866) - (darkSkyData.currently.pressure / 33.8638866)).toFixed(2) > 0.06) {
		document.getElementById("barometerChangeWrap").className = "change upRapid";
		document.getElementById('barometerIcon').src = "weatherIcons/sunny.png";
		document.getElementById('barometerIcon').alt = "Sunny";
		document.getElementById('barometerIcon').style.display = "";
	} else if (((darkSkyData.hourly.data[1].pressure / 33.8638866) - (darkSkyData.currently.pressure / 33.8638866)).toFixed(2) > 0.03) {
		document.getElementById("barometerChangeWrap").className = "change upFast";
		document.getElementById('barometerIcon').src = "weatherIcons/sunny.png";
		document.getElementById('barometerIcon').alt = "Sunny";
		document.getElementById('barometerIcon').style.display = "";
	} else if (((darkSkyData.hourly.data[1].pressure / 33.8638866) - (darkSkyData.currently.pressure / 33.8638866)).toFixed(2) > 0) {
		document.getElementById("barometerChangeWrap").className = "change up";
		document.getElementById('barometerIcon').src = "weatherIcons/partlyCloudy.png";
		document.getElementById('barometerIcon').alt = "Partly Cloudy";
		document.getElementById('barometerIcon').style.display = "";
	} else if (((darkSkyData.hourly.data[1].pressure / 33.8638866) - (darkSkyData.currently.pressure / 33.8638866)).toFixed(2) < -0.06) {
		document.getElementById("barometerChangeWrap").className = "change downRapid";
		document.getElementById('barometerIcon').src = "weatherIcons/thunderStorm.png";
		document.getElementById('barometerIcon').alt = "Thunder";
		document.getElementById('barometerIcon').style.display = "";
	} else if (((darkSkyData.hourly.data[1].pressure / 33.8638866) - (darkSkyData.currently.pressure / 33.8638866)).toFixed(2) < -0.03) {
		document.getElementById("barometerChangeWrap").className = "change downFast";
		document.getElementById('barometerIcon').src = "weatherIcons/rainy.png";
		document.getElementById('barometerIcon').alt = "Rainy";
		document.getElementById('barometerIcon').style.display = "";
	} else if (((darkSkyData.hourly.data[1].pressure / 33.8638866) - (darkSkyData.currently.pressure / 33.8638866)).toFixed(2) < 0) {
		document.getElementById("barometerChangeWrap").className = "change down";
		document.getElementById('barometerIcon').src = "weatherIcons/cloudy.png";
		document.getElementById('barometerIcon').alt = "Cloudy";
		document.getElementById('barometerIcon').style.display = "";
	} else {
		document.getElementById("barometerChangeWrap").className = "change stable";
		document.getElementById('barometerIcon').src = "";
		document.getElementById('barometerIcon').alt = "Sustained";
		document.getElementById('barometerIcon').style.display = "none";
	}
	
	if (darkSkyData.currently.precipIntensity >= 0.23) {
		document.getElementById("rainText").innerHTML = "Heavy Rain";
		document.getElementById('rainText').style.color = "#73BFFF";
	} else if (darkSkyData.currently.precipIntensity >= 0.08) {
		document.getElementById("rainText").innerHTML = "Moderate Rain";
		document.getElementById('rainText').style.color = "#6DC6D4";
	} else if (darkSkyData.currently.precipIntensity >= 0.03) {
		document.getElementById("rainText").innerHTML = "Light Rain";
		document.getElementById('rainText').style.color = "#4ED2E6";
	} else if (darkSkyData.currently.precipIntensity > 0) {
		document.getElementById("rainText").innerHTML = "Drizzle";
		document.getElementById('rainText').style.color = "#00F3FF";
	} else {
		document.getElementById("rainText").innerHTML = "Not Raining";
		document.getElementById('rainText').style.color = "#FFFFEA";
	}
}

function getLocation() {
	if (queued === false) {
		queued = true;
		console.log('Locating user...');
		if (navigator.geolocation) {
			console.log('Posible GPS found...');
			document.getElementById('rainCurrentText').style.display='block';
			document.getElementById('rainCurrentText').innerHTML='Requesting Location...';
			navigator.geolocation.getCurrentPosition(checkPosition, handleError);
		} else {
			console.log('Location not avalible, defaulting to 33.646963, -117.686047');
			document.getElementById('forecastErrorMessage').innerHTML='You do not have onboard GPS. Try searching for a location';
			document.getElementById('forecastErrorMessage').style.display='block';
			gtag('event', 'exception', {
				'description': 'User doesn\'t have GPS',
				'fatal': false
			});
			ga("gtag_UA_52495574_19.send", "event", {eventCategory: "error", eventAction: "gps", eventLabel: "User doesn't have GPS", eventValue: 0});
		}
	} else {
		console.log('GPS requested but already queued!');
	}
}

function checkPosition(position) {
	//bottom left: 33.606301, -117.718207
	//top right: 33.706016, -117.619621
	lat = position.coords.latitude;
	lon = position.coords.longitude;
	url = ('https://lfweather.herokuapp.com/forecast/' + lat + ',' + lon);
	console.log('Found user location, setting new latitude and longitude: ' + lat + ', ' + lon);
	console.log('New URL: ' + url);
	//document.getElementById('map-embed-iframe').src = 'https://maps.darksky.net/@radar,' + lat + ',' + lon + ',10?domain=file%3A%2F%2F%2FC%3A%2FUsers%2Ffordf%2FDesktop%2Flfweather%2Findex.html&amp;auth=1547925784_1597c1ace68e31ce860f03d19e60ca58&amp;marker=' + lat + '%2C' + lon + '&amp;embed=true&amp;timeControl=false&amp;fieldControl=false&amp;defaultField=radar';
	//console.log('New radar link: ' + document.getElementById('map-embed-iframe').src);
	if (!(position.coords.latitude > '33.606301' && position.coords.latitude < '33.706016' && position.coords.longitude > '-117.718207' && position.coords.longitude < '-117.619621')) {
		console.log('User outside Lake Forest, beginning reverse geocode');
		customLocation = true;
		latToAddress(lat, lon);
	} else {
		console.log('User still within Lake Forest, only getting forecast data');
	}
	getData(false);
}

function handleError(error) {
	switch(error.code) {
		case error.PERMISSION_DENIED:
			console.log('User denied the request for Geolocation! Alerting user...');
			document.getElementById('forecastErrorMessage').innerHTML='You denied the GPS request. Try again or search for a place';
			document.getElementById('forecastErrorMessage').style.display='block';
			gtag('event', 'exception', {
				'description': 'User denied GPS',
				'fatal': false
			});
			ga("gtag_UA_52495574_19.send", "event", {eventCategory: "error", eventAction: "gps", eventLabel: "User denied GPS", eventValue: 0});
			break;
		case error.POSITION_UNAVAILABLE:
			console.log('Location information is unavailable! Alerting user...');
			document.getElementById('forecastErrorMessage').innerHTML='Your device could not find your location. Try again or search for a place';
			document.getElementById('forecastErrorMessage').style.display='block';
			gtag('event', 'exception', {
				'description': 'GPS position unavailable',
				'fatal': false
			});
			ga("gtag_UA_52495574_19.send", "event", {eventCategory: "error", eventAction: "gps", eventLabel: "GPS position unavailable", eventValue: 0});
			break;
		case error.TIMEOUT:
			console.log('The request to get user location timed out! Alerting user...');
			document.getElementById('forecastErrorMessage').innerHTML='Your device could not find your location in time. Try again or search for a place';
			document.getElementById('forecastErrorMessage').style.display='block';
			gtag('event', 'exception', {
				'description': 'GPS position timeout',
				'fatal': false
			});
			ga("gtag_UA_52495574_19.send", "event", {eventCategory: "error", eventAction: "gps", eventLabel: "GPS timed out", eventValue: 0});
			break;
		case error.UNKNOWN_ERROR:
			console.log('An unknown error occurred! Alerting user...');
			document.getElementById('forecastErrorMessage').innerHTML='There was an unknown error getting your position. Try again or search for a place';
			document.getElementById('forecastErrorMessage').style.display='block';
			gtag('event', 'exception', {
				'description': 'GPS unknown error',
				'fatal': false
			});
			ga("gtag_UA_52495574_19.send", "event", {eventCategory: "error", eventAction: "gps", eventLabel: "Unknown GPS error", eventValue: 0});
			break;
	}
}

function getData(searchBox) {
	if (searchBox) {
		ga("gtag_UA_52495574_19.send", "event", {eventCategory: "data", eventAction: "dataOnClick", eventLabel: "DarkSky Data Requested using search box", eventValue: 0});
	} else {
		ga("gtag_UA_52495574_19.send", "event", {eventCategory: "data", eventAction: "dataOnClick", eventLabel: "DarkSky Data Requested", eventValue: 0});
	}
	
	console.log('Hiding buttons...');
	document.getElementById('forecastErrorMessage').style.display='none';
	document.getElementById('forecastLinksGroup').style.display = "none";
	document.getElementById('forecastSearchGroup').style.display = "none";
	document.getElementById('rainCurrentText').style.display='block';
	document.getElementById('rainCurrentText').innerHTML='Fetching Data...';
	var arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
	console.log('Requesting data...');
	darkRequest.open('GET', url);

	darkRequest.onreadystatechange = function () {
		if (this.readyState === 4) {
			if (this.status === 200) {
				darkCurrentDate = new Date();
				darkSkyData = JSON.parse(this.responseText);
				document.getElementById('forecastErrorMessage').style.display='none';
				console.log('Dark Sky data recieved: ', darkSkyData);
				document.getElementById('rainCurrentText').style.display='none';
				document.getElementById('futureForecastContainer').style.display='block';
				queued = false;
				if (darkSkyData.flags.units == 'us') {
					console.log('us units, not changing anything');
				} else if (darkSkyData.flags.units == 'si') {
					console.log('si units, changing');
					unitsTemp = 'C';
					unitsRate = 'mm/hr';
					unitsSpeed = 'mps';
					unitsDistance = 'kilometers';
					unitsAmount = 'cm';
				} else if (darkSkyData.flags.units == 'uk2') {
					console.log('uk2 units, changing');
					unitsTemp = 'C';
					unitsRate = 'mm/hr';
					unitsAmount = 'cm';
				} else if (darkSkyData.flags.units == 'ca') {
					console.log('ca units, changing');
					unitsTemp = 'C';
					unitsRate = 'mm/hr';
					unitsSpeed = 'kph';
					unitsDistance = 'kilometers';
					unitsAmount = 'cm';
				}
				if (darkSkyData.alerts) {
					console.log(darkSkyData.alerts.length + ' active alerts, displaying them');
					var o;
					for (o = 0; o < darkSkyData.alerts.length; o++) {
						var baseNode = document.getElementById("emergencyAlerts");
						document.getElementById('emergencyAlertsTitle').innerHTML = darkSkyData.alerts[o].title;
						document.getElementById('emergencyAlertsDescription').innerHTML = darkSkyData.alerts[o].description;
						document.getElementById('emergencyAlertsLink').href = darkSkyData.alerts[o].uri;
						document.getElementById('emergencyAlertsLink').onclick="trackOutboundLink('" + darkSkyData.alerts[o].uri + "'); return false;"
						document.getElementById('emergencyAlertsStart').innerHTML = ('Starts on ' + new Date((darkSkyData.alerts[o].time) * 1000).toDateString() + ' at ' + new Date((darkSkyData.alerts[o].time) * 1000).toTimeString());
						document.getElementById('emergencyAlertsExpire').innerHTML = ('Expires on ' + new Date((darkSkyData.alerts[o].expires) * 1000).toDateString() + ' at ' + new Date((darkSkyData.alerts[o].expires) * 1000).toTimeString());
						if (darkSkyData.alerts[o].severity != 'warning') {
							document.getElementById('emergencyAlerts').style.background = '#FFFFE8';
							document.getElementById('emergencyAlerts').style.borderColor = '#FFC800';
							document.getElementById('emergencyAlertsTitle').style.color = '#D83C00';
							document.getElementById('emergencyAlertsLink').style.textDecorationColor = '#D83C00';
						} else {
							document.getElementById('emergencyAlerts').style.background = '#FFE8E8';
							document.getElementById('emergencyAlerts').style.borderColor = 'red';
							document.getElementById('emergencyAlertsTitle').style.color = '#D80000';
							document.getElementById('emergencyAlertsLink').style.textDecorationColor = '#D80000';
						}
						document.getElementById('emergencyAlerts').style.display = "block";
						if (darkSkyData.alerts.length > (o + 1)) {
							var original = document.getElementById('emergencyAlerts');
							var clone = original.cloneNode(true); 
							clone.id = ('emergencyAlerts' + o);
							clone.querySelector('#emergencyAlertsTitle').setAttribute('id', ('emergencyAlertsTitle' + o));
							clone.querySelector('#emergencyAlertsLink').setAttribute('id', ('emergencyAlertsLink' + o));
							clone.querySelector('#emergencyAlertsDescription').setAttribute('id', ('emergencyAlertsDescription' + o));
							clone.querySelector('#emergencyAlertsExpire').setAttribute('id', ('emergencyAlertsExpire' + o));
							clone.querySelector('#emergencyAlertsStart').setAttribute('id', ('emergencyAlertsStart' + o));
							original.parentNode.appendChild(clone);
						}
					}
				} else {
					console.log('No active alerts, not displaying them');
				}
				if (darkSkyData.minutely) {
					var r;
					var tempr = 0;
					for (r = 0; r < darkSkyData.minutely.data.length; r++) {
						tempr = darkSkyData.minutely.data[r].precipIntensity + tempr;
					}
					if (tempr > 0) {
						console.log('Rain detected, average of ' + (tempr / 60) + ' in/hr');
						document.getElementById('chartButtonsGroup').style.display = "flex";
						if (getCookie('chartPref') == 'a') {
							rainBuildChart(false, true);
							ga("gtag_UA_52495574_19.send", "event", {eventCategory: "preference", eventAction: "chart", eventLabel: "User used advanced chart", eventValue: 0});
						} else if (getCookie('chartPref') == 's') {
							simpleRainBuildChart(false, true);
							ga("gtag_UA_52495574_19.send", "event", {eventCategory: "preference", eventAction: "chart", eventLabel: "User used simple chart", eventValue: 0});
						} else {
							simpleRainBuildChart(false, false);
							ga("gtag_UA_52495574_19.send", "event", {eventCategory: "preference", eventAction: "chart", eventLabel: "User had no chart preference", eventValue: 0});
						}
					} else {
						console.log('No rain for the next hour, not displaying the chart. Total = ' + tempr);
					}
				}
				try {
					if ((tempr / 60) > 0) {
						document.getElementById('hourlySummary').innerHTML = (darkSkyData.hourly.summary + ' ' + darkSkyData.minutely.summary);
					} else if (darkSkyData.currently.nearestStormDistance > 0 && darkSkyData.currently.nearestStormDistance <= 10) {
						var bear = Math.floor((darkSkyData.currently.windBearing / 22.5) + 0.5);
						bear = arr[(bear % 16)];
						document.getElementById('hourlySummary').innerHTML = (darkSkyData.hourly.summary + ' ' + darkSkyData.minutely.summary + ' Nearest storm is ' + darkSkyData.currently.nearestStormDistance + ' miles to the ' + bear);
					} else if (darkSkyData.currently.nearestStormDistance > 10) {
						document.getElementById('hourlySummary').innerHTML = (darkSkyData.daily.summary + ' ' + darkSkyData.hourly.summary + ' No precipitation in the area.');
					} else {
						document.getElementById('hourlySummary').innerHTML = (darkSkyData.daily.summary + ' ' + darkSkyData.hourly.summary);
					}
				}
				catch(err) {
					console.log('Error when displaying text forecast: ' + err);
				}
					
				if (darkSkyData.daily.data[0].temperatureHigh) {
					document.getElementById('high').innerHTML = "High: " + darkSkyData.daily.data[0].temperatureHigh.toFixed(1) + "\&#176;" + unitsTemp;
					document.getElementById('low').innerHTML = "Low: " + darkSkyData.daily.data[0].temperatureLow.toFixed(1) + "\&#176;" + unitsTemp;
				}
				document.getElementById('dewPointSym').innerHTML = "\&#176;" + unitsTemp;
				document.getElementById('feelsLikeSym').innerHTML = "\&#176;" + unitsTemp;
				document.getElementById('windSpeedSym').innerHTML = unitsSpeed;
				document.getElementById('windMaxSym').innerHTML = unitsSpeed;
				document.getElementById('eventRainSym').innerHTML = unitsAmount;
				document.getElementById('hourlyRateSym').innerHTML = unitsRate;
				document.getElementById('dayRainSym').innerHTML = unitsAmount;
				if (darkSkyData.daily.data[0].icon) {
					document.getElementById('dailyIcon').src = ("weatherIcons/darkSky/" + darkSkyData.currently.icon + ".png");
					document.getElementById('dailyIcon').style.display = "";
				}
				if (darkSkyData.flags["nearest-station"]) {
					document.getElementById('distanceLabel').innerHTML = 'Forecast generated using a station ' + (darkSkyData.flags["nearest-station"]).toFixed(1) + ' ' + unitsDistance + ' away';
				}
				hourlyBuildChart(false);
				dailyBuildChart(false);
				if (customLocation === true) {
					currentlyDark();
				}
			}
		} else if (this.readyState === 3) {
			document.getElementById('rainCurrentText').innerHTML='Downloading Data...';
		}
	};
	
	function hourlyBuildChart(alreadyBuilt) {
		console.log("Queing Hourly Chart...");
		google.charts.load('current', {packages: ['table']});
		google.charts.setOnLoadCallback(drawHourlyCurveTypes);
	
		function drawHourlyCurveTypes() {
			console.log('Redrawing hourly graph...');
			var hourlyConditions = [];
			var hourlyTemps = [];
			var hourlyHumidity = [];
			var hourlyRainChance = [];
			var hourlyRainRates = [];
			var hourlyWindSpeed = [];
			var hourlyWindGusts = [];
			var hourlyWindDir = [];
			var hourlyStartTimes = [];
			var hourlyEndTimes = [];
			var e;
			var hourlyCurrentDate = new Date();
			var hourlyChartData = new google.visualization.DataTable();
			hourlyChartData.addColumn('date', 'Time');
			hourlyChartData.addColumn('string', 'Condition');
			hourlyChartData.addColumn('number', 'Temperature');
			hourlyChartData.addColumn('number', 'Humidity');
			hourlyChartData.addColumn('number', 'Precip Chance');
			hourlyChartData.addColumn('number', 'Precip Rate');
			hourlyChartData.addColumn('number', 'Wind Speed');
			hourlyChartData.addColumn('number', 'Wind Gusts');
			hourlyChartData.addColumn('string', 'Wind Direction');
			for (e = 0; e < darkSkyData.hourly.data.length; e++) {
				var bear = Math.floor((darkSkyData.hourly.data[e].windBearing / 22.5) + 0.5);
				bear = arr[(bear % 16)];
				hourlyConditions.push("<img src='weatherIcons/darkSky/" + darkSkyData.hourly.data[e].icon + ".png' style='width: 16px'> " + darkSkyData.hourly.data[e].summary);
				hourlyTemps.push(darkSkyData.hourly.data[e].temperature);
				hourlyHumidity.push(darkSkyData.hourly.data[e].humidity);
				hourlyRainChance.push(darkSkyData.hourly.data[e].precipProbability);
				hourlyRainRates.push(darkSkyData.hourly.data[e].precipIntensity);
				hourlyWindSpeed.push(darkSkyData.hourly.data[e].windSpeed);
				hourlyWindGusts.push(darkSkyData.hourly.data[e].windGust);
				hourlyWindDir.push(bear);
				hourlyStartTimes.push(new Date((new Date(darkSkyData.hourly.data[e].time).getTime() + (new Date(darkSkyData.hourly.data[e].time).getTimezoneOffset() * 60) + (darkSkyData.offset * 3600)) * 1000));
				hourlyChartData.addRows([
					[hourlyStartTimes[e], hourlyConditions[e], hourlyTemps[e], hourlyHumidity[e], hourlyRainChance[e], hourlyRainRates[e], hourlyWindSpeed[e], hourlyWindGusts[e], hourlyWindDir[e]]
				]);
			}
									
			var options = {
				showRowNumber: false,
				width: '100%',
				height: '100%',
				allowHtml: true,
				orientation: 'vertical',
				cssClassNames: {
					tableCell: 'tableCell',
					headerCell: 'headerCell'
				}
			};
			var hourlyFormatter = new google.visualization.DateFormat({pattern: 'haa EEE'});
			hourlyFormatter.format(hourlyChartData, 0);
			var formatterChance = new google.visualization.NumberFormat({pattern: '#,###%'});
			formatterChance.format(hourlyChartData, 4);
			formatterChance.format(hourlyChartData, 3);
			var formatterRate = new google.visualization.NumberFormat({suffix: ' ' + unitsRate});
			formatterRate.format(hourlyChartData, 5);
			var formatterRate = new google.visualization.NumberFormat({suffix: ' \u00B0' + unitsTemp});
			formatterRate.format(hourlyChartData, 2);
			var formatterRate = new google.visualization.NumberFormat({suffix: ' ' + unitsSpeed});
			formatterRate.format(hourlyChartData, 6);
			formatterRate.format(hourlyChartData, 7);
			
			var hourlyChartByGoogle = new google.visualization.Table(document.getElementById('hourlyTimelineDiv'));
			hourlyChartByGoogle.draw(hourlyChartData, options);
		}
	
		if (alreadyBuilt === true) {
			drawHourlyCurveTypes();
		}
	}
	
	function dailyBuildChart(alreadyBuilt) {
		console.log("Queing Daily Chart...");
		google.charts.load('current', {packages: ['table']});
		google.charts.setOnLoadCallback(drawDailyCurveTypes);
	
		function drawDailyCurveTypes() {
			console.log('Redrawing daily graph...');
			var dailyConditions = [];
			var dailyTempHigh = [];
			var dailyTempLow = [];
			var dailyHumidity = [];
			var dailyRainChance = [];
			var dailyRainRates = [];
			var dailyRainTotal = [];
			var dailyWindSpeed = [];
			var dailyWindDir = [];
			var dailyStartTimes = [];
			var dailyEndTimes = [];
			var e;
			var dailyCurrentDate = new Date();
			var dailyChartData = new google.visualization.DataTable();
			dailyChartData.addColumn('date', 'Day');
			dailyChartData.addColumn('string', 'Condition');
			dailyChartData.addColumn('number', 'High');
			dailyChartData.addColumn('number', 'Low');
			dailyChartData.addColumn('number', 'Humidity');
			dailyChartData.addColumn('number', 'Precip Chance');
			dailyChartData.addColumn('number', 'Precip Rate');
			dailyChartData.addColumn('number', 'Total Precip');
			dailyChartData.addColumn('number', 'Wind Speed');
			dailyChartData.addColumn('string', 'Wind Direction');
			for (e = 0; e < darkSkyData.daily.data.length; e++) {
				var bear = Math.floor((darkSkyData.daily.data[e].windBearing / 22.5) + 0.5);
				bear = arr[(bear % 16)];
				dailyConditions.push("<img src='weatherIcons/darkSky/" + darkSkyData.daily.data[e].icon + ".png' style='width: 16px'> " + darkSkyData.daily.data[e].summary);
				dailyTempHigh.push(darkSkyData.daily.data[e].temperatureHigh);
				dailyTempLow.push(darkSkyData.daily.data[e].temperatureLow);
				dailyHumidity.push(darkSkyData.daily.data[e].humidity);
				dailyRainChance.push(darkSkyData.daily.data[e].precipProbability);
				dailyRainRates.push(darkSkyData.daily.data[e].precipIntensity);
				dailyRainTotal.push(darkSkyData.daily.data[e].precipIntensity * 24);
				dailyWindSpeed.push(darkSkyData.daily.data[e].windSpeed);
				dailyWindDir.push(bear);
				dailyStartTimes.push(new Date((new Date(darkSkyData.daily.data[e].time).getTime() + (new Date(darkSkyData.daily.data[e].time).getTimezoneOffset() * 60) + (darkSkyData.offset * 3600)) * 1000));
				dailyChartData.addRows([
					[dailyStartTimes[e], dailyConditions[e], dailyTempHigh[e], dailyTempLow[e], dailyHumidity[e], dailyRainChance[e], dailyRainRates[e], dailyRainTotal[e], dailyWindSpeed[e], dailyWindDir[e]]
				]);
			}
									
			var options = {
				showRowNumber: false,
				allowHtml: true,
				width: '100%',
				height: '100%',
				orientation: 'vertical',
				legend: {
					position: 'none'
				},
				cssClassNames: {
					tableCell: 'tableCell',
					headerCell: 'headerCell'
				}
			};
			var dailyFormatter = new google.visualization.DateFormat({pattern: 'EEEE d'});
			dailyFormatter.format(dailyChartData, 0);
			var formatterChance = new google.visualization.NumberFormat({pattern: '#,###%'});
			formatterChance.format(dailyChartData, 4);
			formatterChance.format(dailyChartData, 5);
			var formatterRate = new google.visualization.NumberFormat({suffix: ' ' + unitsRate});
			formatterRate.format(dailyChartData, 6);
			var formatterRate = new google.visualization.NumberFormat({suffix: ' \u00B0' + unitsTemp});
			formatterRate.format(dailyChartData, 2);
			formatterRate.format(dailyChartData, 3);
			var formatterRate = new google.visualization.NumberFormat({suffix: ' ' + unitsAmount});
			formatterRate.format(dailyChartData, 7);
			var formatterRate = new google.visualization.NumberFormat({suffix: ' ' + unitsSpeed});
			formatterRate.format(dailyChartData, 8);
			
			var dailyChartByGoogle = new google.visualization.Table(document.getElementById('dailyTimelineDiv'));
			dailyChartByGoogle.draw(dailyChartData, options);
		}
	
		if (alreadyBuilt === true) {
			drawdailyCurveTypes();
		}
	}
	
	darkRequest.onerror = function () {
		console.log('!Error while requesting dark data, onError triggered');
		document.getElementById('forecastErrorMessage').innerHTML='There was an error fetching the data';
		document.getElementById('forecastErrorMessage').style.display='block';
		dataError = true;
		gtag('event', 'exception', {
			'description': 'Dark Sky data request failed',
			'fatal': false
		});
		ga("gtag_UA_52495574_19.send", "event", {eventCategory: "error", eventAction: "data", eventLabel: "Dark Sky data request failed", eventValue: 0});
	};

	darkRequest.send();
}

function simpleRainBuildChart(alreadyBuilt, cookie) {
	google.charts.load('current', {packages: ['corechart']});
	google.charts.setOnLoadCallback(drawRainCurveTypes);
	document.getElementById("advancedChartButton").disabled = false;
	document.getElementById("simpleChartButton").disabled = true;
	document.getElementById("simpleChartButton").style.backgroundColor = '#ffffff26';
	document.getElementById("simpleChartButton").style.cursor = 'not-allowed';
	document.getElementById("advancedChartButton").style.backgroundColor = '';
	document.getElementById("advancedChartButton").style.cursor = 'default';
	if (cookie === false) {
		setCookie('chartPref', 's', 730);
	}
	
	function drawRainCurveTypes() {
		var rainTimes = [];
		var rainChance= [];
		var sleetChance= [];
		var snowChance= [];
		var e;
		var rainCurrentDate = new Date();
		var rainChartData = new google.visualization.DataTable();
		var maxRate = 0;
		var max = 1;
		var med = 0.667;
		var min = 0.333;
		rainChartData.addColumn('date', 'X');
		rainChartData.addColumn('number', 'Rain');
		rainChartData.addColumn('number', 'Sleet');
		rainChartData.addColumn('number', 'Snow');
		for (e = 0; e < darkSkyData.minutely.data.length; e++) {
			var rainRate = darkSkyData.minutely.data[e].precipProbability * darkSkyData.minutely.data[e].precipIntensity;
			if (rainRate === 0) {
				rainRate = null;
			} else {
				//var inv = 1.0 / 0.01;
				//rainRate = Math.round(rainRate * inv) / inv;
				rainRate = (4 * (1 - Math.exp(-2.209389806 * Math.sqrt(rainRate))));
				rainRate <= 1 ? rainRate *= .15 : rainRate = rainRate <= 2 ? .15 + (rainRate - 1) * (.33 - .15) : rainRate <= 3 ? .33 + .34 * (rainRate - 2) : .67 + (rainRate - 3) * (1 - .67);
			}
			rainTimes.push(new Date(darkSkyData.minutely.data[e].time * 1000));
			if (e ==(darkSkyData.minutely.data.length - 1)) {
				if (darkSkyData.minutely.data[e].precipType == 'rain') {
					rainChance.push(rainRate);
					sleetChance.push(null);
					snowChance.push(null);
				} else if (darkSkyData.minutely.data[e].precipType == 'sleet') {
					sleetChance.push(rainRate);
					rainChance.push(null);
					snowChance.push(null);
				} else if (darkSkyData.minutely.data[e].precipType == 'snow') {
					snowChance.push(rainRate);
					rainChance.push(null);
					sleetChance.push(null);
				} else {
					rainChance.push(rainRate);
					sleetChance.push(null);
					snowChance.push(null);
				}
			} else if (darkSkyData.minutely.data[e].precipType == 'rain') {
				rainChance.push(rainRate);
				if (darkSkyData.minutely.data[e+1].precipType == 'sleet') {
					sleetChance.push(rainRate);
					snowChance.push(null);
				} else if (darkSkyData.minutely.data[e+1].precipType == 'snow') {
					sleetChance.push(null);
					snowChance.push(rainRate);
				} else {
					sleetChance.push(null);
					snowChance.push(null);
				}
			} else if (darkSkyData.minutely.data[e].precipType == 'sleet') {
				sleetChance.push(rainRate);
				if (darkSkyData.minutely.data[e+1].precipType == 'rain') {
					rainChance.push(rainRate);
					snowChance.push(null);
				} else if (darkSkyData.minutely.data[e+1].precipType == 'snow') {
					rainChance.push(null);
					snowChance.push(rainRate);
				} else {
					rainChance.push(null);
					snowChance.push(null);
				}
			} else if (darkSkyData.minutely.data[e].precipType == 'snow') {
				snowChance.push(rainRate);
				if (darkSkyData.minutely.data[e+1].precipType == 'rain') {
					rainChance.push(rainRate);
					sleetChance.push(null);
				} else if (darkSkyData.minutely.data[e+1].precipType == 'sleet') {
					rainChance.push(null);
					sleetChance.push(rainRate);
				} else {
					rainChance.push(null);
					sleetChance.push(null);
				}
			} else {
				rainChance.push(rainRate);
				sleetChance.push(null);
				snowChance.push(null);
			}
			
			if (maxRate < (darkSkyData.minutely.data[e].precipProbability * darkSkyData.minutely.data[e].precipIntensity)) {
				maxRate = (darkSkyData.minutely.data[e].precipProbability * darkSkyData.minutely.data[e].precipIntensity);
			}
			rainChartData.addRows([
				[rainTimes[e], rainChance[e], sleetChance[e], snowChance[e]]
			]);
		}
		
		var options = {
			title: 'Precip in the next hour',
			titleTextStyle: {
				color: '#FFFFEA',
				fontName: 'verdana'
			},
			hAxis: {
				title: 'Time',
				baselineColor: '#FFFFEA',
				textStyle: {
					color: '#FFFFEA',
					fontName: 'verdana',
					italic: true
				},
				titleTextStyle: {
					color: '#FFFFEA',
					fontName: 'verdana',
					italic: true
				},
				gridlines: {
					color: '#FFFFEA'
				}
			},
			
			vAxes: [
				{
					title:'',
					format: 'percent',
					slantedText: true,
					baselineColor: 'transparent',
					textStyle: {
						color: '#FFFFEA',
						fontName: 'verdana',
						italic: true
					},
					titleTextStyle: {
						color: '#FFFFEA',
						fontName: 'verdana',
						italic: true
					},
					gridlines: {
						color: '#FFFFEA',
						count: 3
					},
					ticks: [{
						v: 0, 
						f: 'Light\n\n'
					}, 
					{
						v: min, 
						f: 'Moderate\n\n'
					}, 
					{
						v: med, 
						f: 'Heavy\n\n'
					}, 
					{
						v: max, 
						f: ''
					}]
				}
			],
			series: {
				1: {
					targetAxisIndex:0,
					lineWidth: 2
				},
				2: {
					targetAxisIndex:0,
					lineWidth: 2
				},
				0: {
					targetAxisIndex:0,
					lineWidth: 2
				}
			},
			legend: {
				textStyle: {
					color: '#FFFFEA',
					fontName: 'verdana'
				},
				position: 'top',
				alignment: 'end'
			},
			width: '100%',
			height: '100%',
			isStacked: false,
			backgroundColor: '#0843A2',
			enableInteractivity: false,
			areaOpacity: '0.8',
			colors: ['#99F5FF', '#AA99FF', '#D599FF']
		};

		document.getElementById('rainChartDiv').innerHTML = "";
		var rainChartByGoogle = new google.visualization.AreaChart(document.getElementById('rainChartDiv'));
		var formatterChance = new google.visualization.NumberFormat({pattern: '#,###%'});
		formatterChance.format(rainChartData, 1);
		var formatterTime = new google.visualization.DateFormat({pattern: 'h:mm aa'});
		formatterTime.format(rainChartData, 0);
		rainChartByGoogle.draw(rainChartData, options);
	}

	if (alreadyBuilt === true) {
		drawRainCurveTypes();
	}

	$(window).resize(function(){
		drawRainCurveTypes();
	});
}

function rainBuildChart(alreadyBuilt, cookie) {
	google.charts.load('current', {packages: ['corechart', 'line']});
	google.charts.setOnLoadCallback(drawRainCurveTypes);
	document.getElementById("advancedChartButton").disabled = true;
	document.getElementById("simpleChartButton").disabled = false;
	document.getElementById("advancedChartButton").style.backgroundColor = '#ffffff26';
	document.getElementById("advancedChartButton").style.cursor = 'not-allowed';
	document.getElementById("simpleChartButton").style.backgroundColor = '';
	document.getElementById("simpleChartButton").style.cursor = 'default';
	if (cookie === false) {
		setCookie('chartPref', 'a', 730);
	}

	function drawRainCurveTypes() {
		var rainTimes = [];
		var rainRates = [];
		var rainChance = [];
		var rainErrorHigh = [];
		var rainErrorLow = [];
		var e;
		var rainCurrentDate = new Date();
		var rainChartData = new google.visualization.DataTable();
		rainChartData.addColumn('date', 'X');
		rainChartData.addColumn('number', 'Rate');
		rainChartData.addColumn({type:'number', id:'Uppper Error', role:'interval'});
		rainChartData.addColumn({type:'number', id:'Lower Error', role:'interval'});
		rainChartData.addColumn('number', 'Chance');
		for (e = 0; e < darkSkyData.minutely.data.length; e++) {
			//rainTimes.push(new Date(darkSkyData.minutely.data[e].time * 1000));
			rainTimes.push(new Date((new Date(darkSkyData.minutely.data[e].time).getTime() + (new Date(darkSkyData.minutely.data[e].time).getTimezoneOffset() * 60) + (darkSkyData.offset * 3600)) * 1000));
			rainRates.push(darkSkyData.minutely.data[e].precipIntensity);
			rainChance.push(darkSkyData.minutely.data[e].precipProbability);
			rainErrorHigh.push(darkSkyData.minutely.data[e].precipIntensity + darkSkyData.minutely.data[e].precipIntensityError);
			rainErrorLow.push(darkSkyData.minutely.data[e].precipIntensity - darkSkyData.minutely.data[e].precipIntensityError);
			rainChartData.addRows([
				[rainTimes[e], rainRates[e], rainErrorHigh[e], rainErrorLow[e], rainChance[e]]
			]);
		}
								
		var options = {
			title: 'Precip in the next hour',
			seriesType: 'line',
			titleTextStyle: {
				color: '#FFFFEA',
				fontName: 'verdana'
			},
			hAxis: {
				title: 'Time',
				baselineColor: '#FFFFEA',
				textStyle: {
					color: '#FFFFEA',
					fontName: 'verdana',
					italic: true
				},
				titleTextStyle: {
					color: '#FFFFEA',
					fontName: 'verdana',
					italic: true
				},
				gridlines: {
					color: '#FFFFEA'
				}
			},
			
			vAxes: [
				{
					title:'Percent Chance',
					format: 'percent',
					baselineColor: '#FFFFEA',
					textStyle: {
						color: '#FFFFEA',
						fontName: 'verdana',
						italic: true
					},
					titleTextStyle: {
						color: '#FFFFEA',
						fontName: 'verdana',
						italic: true
					},
					gridlines: {
						color: '#FFFFEA'
					},
					viewWindow: {
						max: 1,
						min: 0
					}
				},
				{
					title: 'Precip (' + unitsRate + ')',
					baselineColor: '#FFFFEA',
					textStyle: {
						color: '#FFFFEA',
						fontName: 'verdana',
						italic: true
					},
					titleTextStyle: {
						color: '#FFFFEA',
						fontName: 'verdana',
						italic: true
					},
					gridlines: {
						color: '#FFFFEA'
					},
					viewWindow: {
						min: 0
					}
				}
			],
			series: {
				0: {targetAxisIndex:1},
				1: {targetAxisIndex:0}
			},
			legend: {
				textStyle: {
					color: '#FFFFEA',
					fontName: 'verdana'
				},
				position: 'top',
				alignment: 'end'
			},
			width: '100%',
			height: '100%',
			backgroundColor: '#0843A2',
			intervals: { 'style':'area' },
			colors: ['#99F5FF', '#80FF80']
		};

		document.getElementById('rainChartDiv').innerHTML = "";
		var rainChartByGoogle = new google.visualization.LineChart(document.getElementById('rainChartDiv'));
		var formatterChance = new google.visualization.NumberFormat({pattern: '#,###%'});
		formatterChance.format(rainChartData, 4);
		var formatterRate = new google.visualization.NumberFormat({suffix: ' ' + unitsRate});
		formatterRate.format(rainChartData, 1);
		formatterRate.format(rainChartData, 3);
		formatterRate.format(rainChartData, 2);
		var formatterTime = new google.visualization.DateFormat({pattern: 'h:mm aa'});
		formatterTime.format(rainChartData, 0);
		rainChartByGoogle.draw(rainChartData, options);
	}

	if (alreadyBuilt === true) {
		drawRainCurveTypes();
	}

	$(window).resize(function(){
		drawRainCurveTypes();
	});
}

document.addEventListener('DOMContentLoaded', init, false);

function init(){
	console.log("DOM Content loaded & parsed");
	adsBlocked(function(blocked){
		if (blocked && navigator.onLine) {
			console.log('Adblock detected');
			document.getElementById('bKSMcyXAlDun').style.display='block';
		}
	})
	
	if (!navigator.onLine) {
		console.log('Site is offline, displaying message');
		document.getElementById('errorMessage').innerHTML='You are currently offline. Please connect to the internet to fetch data!';
		document.getElementById('errorMessage').style.display='block';
	}
}

window.addEventListener('online', function(e) {
	console.log('Back online');
	document.getElementById('errorMessage').innerHTML='There was an error fetching the data';
	if (dataError === false) {
		document.getElementById('errorMessage').style.display='none';
	}
	location.reload();
});

window.addEventListener('offline', function(e) {
	console.log('Site is offline, displaying message');
	document.getElementById('errorMessage').innerHTML='You are currently offline. Please connect to the internet to fetch data!';
	document.getElementById('errorMessage').style.display='block';
});

function adsBlocked(callback){
	var testURL = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'

	var myInit = {
		method: 'HEAD',
		mode: 'no-cors'
	};

	var myRequest = new Request(testURL, myInit);

	fetch(myRequest).then(function(response) {
		return response;
	}).then(function(response) {
		console.log(response);
		callback(false)
	}).catch(function(e){
		console.log(e)
		callback(true)
	});
}

window.onload = function listenForInstall() {
	if (window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches) {
		console.log('Site launched in app');
		ga("gtag_UA_52495574_19.send", "event", {eventCategory: "app", eventAction: "launch", eventLabel: "User launched website through app", eventValue: 0});
	}

	var config = {
		apiKey: "AIzaSyC7hI9y4wNiUAcCnHlh8doZVJSauHbcA8c",
		authDomain: "lf-weather.firebaseapp.com",
		databaseURL: "https://lf-weather.firebaseio.com",
		projectId: "lf-weather",
		storageBucket: "lf-weather.appspot.com",
		messagingSenderId: "110489295641"
	};
	firebase.initializeApp(config);
	
	var statusRef = firebase.database().ref('status');
	statusRef.once('value', function(snapshot) {
		if (snapshot.val().serverity == 2) {
			document.getElementById('statusAlertTitle').innerHTML = snapshot.val().title;
			document.getElementById('statusAlertDescription').innerHTML = snapshot.val().description;
			document.getElementById('statusAlert').style.display = "block";
		} else if (snapshot.val().serverity == 1) {
			document.getElementById('statusAlertTitle').innerHTML = snapshot.val().title;
			document.getElementById('statusAlertDescription').innerHTML = snapshot.val().description;
			document.getElementById('statusAlert').style.background = '#FFFFE8';
			document.getElementById('statusAlert').style.borderColor = '#FFC800';
			document.getElementById('statusAlertTitle').style.color = '#D83C00';
			document.getElementById('statusAlert').style.display = "block";
		}
	});

	function setCookie(cname, cvalue, exdays) {
		var d = new Date();
		d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
		var expires = "expires=" + d.toUTCString();
		document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
	}

	function getCookie(cname) {
		var name = cname + "=";
		var ca = document.cookie.split(';');
		for (var i = 0; i < ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0) == ' ') {
				c = c.substring(1);
			}
			if (c.indexOf(name) == 0) {
				return c.substring(name.length, c.length);
			}
		}
		return "";
	}
	
	console.log("Window finished loading, checking for a prompt cookie");
	var promptMem = getCookie("promptMem");
	if (promptMem == "") {
		console.log("No cookie found, starting install timer");
		var deferredPrompt;
		var accept = false;
		console.log('Waiting for the install prompt...');
		window.addEventListener('beforeinstallprompt', function(e) {
			console.log('Got install prompt, stashing it');
			// Prevent Chrome 67 and earlier from automatically showing the prompt
			e.preventDefault();
			// Stash the event so it can be triggered later.
			deferredPrompt = e;
			ga("gtag_UA_52495574_19.send", "event", {eventCategory: "app", eventAction: "promptRecieved", eventLabel: "Prompt to install was recieved from the server", eventValue: 0});
		});
			
		setTimeout(function() {
			function showAddToHomeScreen() {
				console.log('Showing install prompt...');
				ga("gtag_UA_52495574_19.send", "event", {eventCategory: "app", eventAction: "promptShown", eventLabel: "Prompt to install was shown to the user", eventValue: 0});
				var a2hsWrap = document.querySelector(".ad2hs-prompt");
				var a2hsAdd = document.querySelector(".addButton");
				var a2hsHide = document.querySelector(".dismissButton");
				a2hsWrap.style.display = "flex";
				a2hsAdd.addEventListener("click", addToHomeScreen);
				a2hsHide.addEventListener("click", hideAddToHomeScreen);
			}

			function hideAddToHomeScreen() {
				console.log('Hiding prompt from site');
				var a2hsWrap = document.querySelector(".ad2hs-prompt");
				a2hsWrap.style.display = 'none';
				if (accept === false) {
					ga("gtag_UA_52495574_19.send", "event", {eventCategory: "app", eventAction: "dismissed", eventLabel: "User dismissed homescreen app prompt by site", eventValue: 0});
					setCookie("promptMem", 'no', 7);
				}
			}
			
			function addToHomeScreen() {
				ga("gtag_UA_52495574_19.send", "event", {eventCategory: "app", eventAction: "accept", eventLabel: "User accepted homescreen app prompt by site", eventValue: 0});
				accept = true;
				hideAddToHomeScreen();
				if (deferredPrompt) {
					// Show the prompt
					console.log('Showing server prompt');
					deferredPrompt.prompt();
					// Wait for the user to respond to the prompt
					deferredPrompt.userChoice.then((choiceResult) => {
						if (choiceResult.outcome === 'accepted') {
							console.log('User accepted the A2HS prompt');
							ga("gtag_UA_52495574_19.send", "event", {eventCategory: "app", eventAction: "install", eventLabel: "User installed homescreen app", eventValue: 0});
						} else {
							console.log('User dismissed the A2HS prompt');
							ga("gtag_UA_52495574_19.send", "event", {eventCategory: "app", eventAction: "denied", eventLabel: "User denied homescreen app prompt by server", eventValue: 0});
						}
						deferredPrompt = null;
					});
				} else {
					console.log('No deferredPrompt! Is the manifest installed correctly?');
					ga("gtag_UA_52495574_19.send", "event", {eventCategory: "app", eventAction: "failed", eventLabel: "No deferredPrompt was found when user accepted", eventValue: 0});
					gtag('event', 'exception', {
						'description': 'App install requested, no deferredPrompt',
						'fatal': false
					});
				}
			}
			if (deferredPrompt) {
				showAddToHomeScreen();
			} else {
				console.log('No prompt to install was sent');
				ga("gtag_UA_52495574_19.send", "event", {eventCategory: "app", eventAction: "noPromptRecieved", eventLabel: "No prompt to install was recieved from the server", eventValue: 0});
			}
			window.addEventListener('appinstalled', function(evt) {
				setCookie("promptMem", 'yes', 730);
				console.log('a2hs', 'installed');
			});
		}, 7000);
	} else if (promptMem == 'no') {
		console.log('User dismissed prompt with the last week, not displaying prompt');
		ga("gtag_UA_52495574_19.send", "event", {eventCategory: "app", eventAction: "promptNotShown", eventLabel: "Prompt to install was not shown because they dismissed the prompt in the next week", eventValue: 0});
	} else if (promptMem == 'yes') {
		console.log('User already installed, not displaying prompt');
		ga("gtag_UA_52495574_19.send", "event", {eventCategory: "app", eventAction: "promptNotShown", eventLabel: "Prompt to install was not shown because they already installed the app", eventValue: 0});
	}
};