var Chart = require("chart.js");
//var graph = new Chart

//declare variables
var $origin = $('#origin');
var $destination = $('#destination');
var $allmodes = $('input[name="radios"]');
var $mode = $('input[name="radios"]:checked');
var $switchbutton = $('.switchdest-button');
var $submitbutton = $('#search');
var $addtimeButton = $('#addtime');

// check if there's something in localstorage, and if so,
// fill in the values or select the right mode
if(typeof(Storage) !== "undefined") {
    // set destination and origin from localstorage
    if (localStorage.origin && localStorage.origin !== '') {
        $origin.val(localStorage.origin);
    }
    if (localStorage.destination && localStorage.destination !== '') {
        $destination.val(localStorage.destination);
    }
    // set modes if localstorage has one defined
    if (localStorage.travelMode) {
        if (localStorage.travelMode === 'driving') {
            $('#driving').prop('checked', true);
        }
        else if (localStorage.travelMode === 'bicycling') {
            $('#bicycling').prop('checked', true);
        }
        else {
            $('#walking').prop('checked', true);
        }
    }
    // set driving as default mode
    else {
        $('#driving').prop('checked', true);
    }
    // disable buttons if the route has been calculated
    if (localStorage.calculated === 'true') {
        $origin.prop('disabled', true);
        $destination.prop('disabled', true);
        $allmodes.prop('disabled', true);
        $submitbutton.val('Edit');
        $switchbutton.prop('disabled', true);
    }
}
else {
    console.log("No localstorage supported");
}

/*
    gets the values from the inputs to calculate the route
    or shows the dialog to edit the inputs if a route was
    already calculated
*/
$submitbutton.click(function(e) {
    e.preventDefault();
    // calculating a route
    if ($submitbutton.val() === "Search") {
        // get input and set them in localstorage
        localStorage.origin = $origin.val();
        localStorage.destination = $destination.val();
        $mode = $('input[name="radios"]:checked');
        localStorage.travelMode = $mode.prop('id');
        // disable inputs
        $submitbutton.val('Edit');
        $origin.prop('disabled', true);
        $destination.prop('disabled', true);
        $('input[name="radios"]').prop('disabled', true);
        // calculate the route & tell localstorage a route was calculated
        calculateRoute($origin.val(), $destination.val(), defineTravelMode($mode.prop('id')));
        localStorage.calculated = 'true';
    }
    // show dialog to confirm changes
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
                    $origin.prop('disabled', false);
                    $destination.prop('disabled', false);
                    $('input[name="radios"]').prop('disabled', false);
                    localStorage.clear();
                },
                Cancel: function() {
                    $(this).dialog( "close" );
                }
            }
        });
        $('#dialog-confirm').dialog('open');
    }
});

/*
    Switches the origin and destination
*/
$switchbutton.click(function(e) {
    e.preventDefault();
    if ($submitbutton.val() === "Search") {
        $originvalue = $origin.val();
        $destvalue = $destination.val();
        $origin.val($destvalue);
        $destination.val($originvalue);
    }
});

/*
    Adds their own traveltime to the graph
*/
$addtimeButton.click(function(e) {
    e.preventDefault();
    
})

/*----------------------------------------------------
-                    GOOGLE MAPS                     -
----------------------------------------------------*/

var directionsDisplay;
var directionsService;
var map;

/*
    Initliazes the map
*/
window.initMap = function() {
    // options
    var mapOptions = {
        zoom: 7,
        center: {lat: 50.9373401, lng: 4.041093},
        streetViewControl: false,
        mapTypeControl: false,
    }

    map = new google.maps.Map(document.getElementById('map'), mapOptions);
    directionsService = new google.maps.DirectionsService();
    directionsDisplay = new google.maps.DirectionsRenderer();
    directionsDisplay.setMap(map);
    var trafficLayer = new google.maps.TrafficLayer();
    trafficLayer.setMap(map);

    // inputs
    var origin_input = document.getElementById('origin');
    var destination_input = document.getElementById('destination');
    var modes = document.getElementById('mode-select');


    // autocomplete functions on inputs
    var origin_autocomplete = new google.maps.places.Autocomplete(origin_input);
    origin_autocomplete.bindTo('bounds', map);
    var destination_autocomplete =
    new google.maps.places.Autocomplete(destination_input);
    destination_autocomplete.bindTo('bounds', map);

    // check if route was already calculated and recalculate
    if (localStorage.calculated === 'true') {
        calculateRoute(localStorage.origin, localStorage.destination, defineTravelMode(localStorage.travelMode));
    }
    // try HTML5 geolocation if the route wasn't calculated
    else {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                var pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                map.setCenter(pos);
            }, function() {
                handleLocationError(true, infoWindow, map.getCenter());
            });
        }
        else {
            // Browser doesn't support Geolocation
            handleLocationError(false, infoWindow, map.getCenter());
        }
    }
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
        'Error: The Geolocation service failed.' :
        'Error: Your browser doesn\'t support geolocation.');
}

/*
    Calculates the route between 2 destinations using
    the google distancematrix api
*/
function calculateRoute(origin, destination, travelMode) {
    /*var request = {
        origin: $origin.val(),
        destination: $destination.val(),
        travelMode: google.maps.TravelMode.DRIVING
    };
    directionsService.route(request, function(result, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(result);
        }
    });
    xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            $('#distancematrix').html(xhr.responseText);
        }
    };
    xhr.open('GET', '/assets/distancematrix.php', true);
    xhr.send();*/

    // the request for the directions
    var request = {
        origin:origin,
        destination:destination,
        travelMode: travelMode
    };

    // use the returned results to set the route
    directionsService.route(request, function(result, status) {
        if (status == google.maps.DirectionsStatus.OK) {
          directionsDisplay.setDirections(result);
        }
    });

    var service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
        {
            origins: [origin],
            destinations: [destination],
            travelMode: travelMode,
            unitSystem: google.maps.UnitSystem.METRIC,
            avoidHighways: false,
            avoidTolls: false,
        }, callback);

    function callback(response, status) {
        if (status == google.maps.DistanceMatrixStatus.OK) {
            var origins = response.originAddresses;
            var destinations = response.destinationAddresses;

            for (var i = 0; i < origins.length; i++) {
                var results = response.rows[i].elements;
                for (var j = 0; j < results.length; j++) {
                    var element = results[j];
                    var distance = element.distance.text;
                    var duration = element.duration.text;
                    $('#estimate').text(duration);
                    $('.estimate').css('display', 'inline-block');
                    $('.duration-input').css('display', 'inline-block');
                    var from = origins[i];
                    var to = destinations[j];
                }
            }
        }
    }
}

function defineTravelMode(mode) {
    if (mode == "driving") {
        return google.maps.TravelMode.DRIVING;
    }
    else if (mode == "bicycling") {
        return google.maps.TravelMode.BICYCLING;
    }
    else {
        return google.maps.TravelMode.WALKING;
    }
}