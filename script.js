//declare variables
var $start = $('#from');
var $destination = $('#to');
var $mode = $('input[name="radios"]:checked');
var $submitbutton = $('input[type="submit"]');

//check if there's something in localstorage, and if so,
//fill in the values or select the right mode
if(typeof(Storage) !== "undefined") {
	if (localStorage.start && localStorage.start !== '') {
		$start.val(localStorage.start);
	}
	if (localStorage.destination && localStorage.destination !== '') {
		$destination.val(localStorage.destination);
	}
	if (localStorage.mode) {
		if (localStorage.mode === 'car') {
			$('#car').prop('checked', true);
		}
		if (localStorage.mode === 'bicycle') {
			$('#bicycle').prop('checked', true);
		}
		if (localStorage.mode === 'walking') {
			$('#walking').prop('checked', true);
		}
	}
	else {
		$('#car').prop('checked', true);
	}
	//if we already did a search, the search button will
	//be an edit button and everything will be disabled
	if (localStorage.calculated === 'true') {
		$submitbutton.val('Edit');
		$start.prop('disabled', true);
		$destination.prop('disabled', true);
		$('input[name="radios"]').prop('disabled', true);
	}
}
else {
	console.log("No localstorage supported");
}

//remember the values & selected modes when the form is
//submitted
$submitbutton.click(function(e) {
	e.preventDefault();
	//check if editing, or searching
	if ($submitbutton.val() === "Search") {
		localStorage.start = $start.val();
		localStorage.destination = $destination.val();
		$mode = $('input[name="radios"]:checked');
		localStorage.mode = $mode.prop('id');
		$submitbutton.val('Edit');
		$start.prop('disabled', true);
		$destination.prop('disabled', true);
		$('input[name="radios"]').prop('disabled', true);
		localStorage.calculated = 'true';
	}
	else {
		$('#dialog-confirm').dialog({
			resizable: false,
			height:140,
			modal: true,
			autoOpen: false,
			buttons: {
				"Delete all items": function() {
					$(this).dialog( "close" );
					$submitbutton.val('Search');
					$start.prop('disabled', false);
					$destination.prop('disabled', false);
					$('input[name="radios"]').prop('disabled', false);
				},
				Cancel: function() {
					$(this).dialog( "close" );
				}
			}
		});
		$('#dialog-confirm').dialog('open');
	}
});

//GOOGLE MAPS
function initMap() {
  var map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: -34.397, lng: 150.644},
    zoom: 8
  });
  var infoWindow = new google.maps.InfoWindow({map: map});

  // Try HTML5 geolocation.
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      infoWindow.setPosition(pos);
      map.setCenter(pos);
    }, function() {
      handleLocationError(true, infoWindow, map.getCenter());
    });
  } else {
    // Browser doesn't support Geolocation
    handleLocationError(false, infoWindow, map.getCenter());
  }
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(browserHasGeolocation ?
                    	'Error: The Geolocation service failed.' :
                        'Error: Your browser doesn\'t support geolocation.');
}