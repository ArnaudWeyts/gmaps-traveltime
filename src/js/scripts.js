/*
    Clientside Webscripten 1 - Google Maps API
    @author Arnaud Weyts
*/

/*
*   The storage module handles all of the storage actions
*   f.e. getting data from localstorage and setting data in
*   localstorage
*/

var $ = require("jquery");

var storageS,
    storageModule = {

    settings: {
        // inputs and buttons
        originInput: $('origin'),
        destinationInput: $('destination'),
        allModes: $('input[name="radios"]'),
        selectedMode: $('input[name="radios"]:checked'),
        switchButton: $('.switchdest-button'),
        submitButton: $('#search'),
        addtimeButton: $('#addtime'),
        // actual variables
        origin: $('origin').val(),
        destination: $('destination').val(),
        travelMode: $('input[name="radios"]:checked').prop('id')
    },

    init: function() {
        // kick things off
        storageS = this.settings;
        this.loadFromStorage();
    },

    /*
        This function sets the data in localstorage
    */
    setTravelData: function() {
        var travelData = {
            origin: this.origin.val,
            destination: this.destination.val,
            mode: this.travelMode
        };

        localStorage.setItem('travelData', JSON.stringify(travelData));
        localStorage.setItem('calculated', true);
    },

    /*
        Loads stuff from localstorage if there's something to be found
        WIP
    */
    loadFromStorage: function() {
        if(typeof(Storage) !== "undefined") {

            // get data from localstorage
            var travelData = JSON.parse(localStorage.getItem('travelData'));
            this.origin = travelData.origin;
            this.destination = travelData.destination;
            this.travelMode = travelData.mode;

            // set modes if localstorage has one defined
            if (this.travelMode) {
                if (this.travelMode === 'driving') {
                    $('#driving').prop('checked', true);
                }
                else if (this.travelMode === 'bicycling') {
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
            if (localStorage.getItem('calculated') === 'true') {
                this.originInput.prop('disabled', true);
                this.destinationInput.prop('disabled', true);
                this.allModes.prop('disabled', true);
                this.submitButton.val('Edit');
                this.switchButton.prop('disabled', true);
            }
        }
        else {
            window.console.log("No localstorage supported");
        }
    }
};

var actionS,
    actionModule = {

    settings: {
        originInput: $('origin'),
        destinationInput: $('destination'),
        allModes: $('input[name="radios"]'),
        submitButton: $('#search'),
        addtimeButton: $('#addtime'),
        switchButton: $('#switch')
    },

    init: function() {
        actionS = this.settings;
        this.bundUIActions();
    },

    /*
    *   Enables or disables all of the inputs
    */
    toggleInputs: function(disable) {
        this.originInput.prop('disabled', disable);
        this.destinationInput.prop('disabled', disable);
        this.allModes.prop('disabled', disable);
        if (disable) {
            this.submitButton.val('Edit');
        }
        else {
            this.submitButton.val('Search');
        }
    },

    /*
    *   Handle all the UI actions, all the button etc.
    */
    bindUIActions: function() {
        /*
            gets the values from the inputs to calculate the route
            or shows the dialog to edit the inputs if a route was
            already calculated
        */
        this.submitButton.click(function(e) {
            e.preventDefault();
            // calculating a route
            if (this.submitButton.val() === "Search") {
                // get input and set them in localstorage
                storageModule.setTravelData();

                // disable buttons
                this.toggleInputs(true);

                // calculate the route & tell localstorage a route was calculated
                calculateRoute($origin.val(), $destination.val(), defineTravelMode($mode.prop('id')));
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
                            // enable the inputs again
                            this.toggleInputs(false);
                            // clear localstorage
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
        *   Switches destination and origin around
        */
        this.switchButton.click(function(e) {
            e.preventDefault();
            if (this.submitButton.val() === "Search") {
                var originvalue = this.originInput.val();
                var destvalue = this.destinationInput.val();
                this.originInput.val(destvalue);
                this.destinationInput.val(originvalue);
            }
        });
    }

};

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
    @param origin the chosen origin
    @param destination the chosen destination
    @param travelMode the selected travelmode
*/
function calculateRoute(origin, destination, travelMode) {
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

    // callback function
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


/*
    function to define the travelmode from a given string
    @param string mode
    @return google.maps.TraveMode.*
*/
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

/*--------------------------------------------------
-                   CHART.JS                       -
---------------------------------------------------*/

var Chart = require("chart.js");
// get the chart
var ctx = $("#travelchart");

// set the default options on the data, and enter empty data
var data =
    {
        labels: [],
        datasets: [
            {
                label: "Google estimate",
                fill: false,
                backgroundColor: "#84CA50",
                borderColor: "#84CA50",
                pointBorderColor: "#84CA50",
                pointBackgroundColor: "#fff",
                pointHoverBackgroundColor: "#84CA50",
                pointHoverBorderColor: "#84CA50",
                pointHoverBorderWidth: 5,
                data: []
            },
            {
                label: "Your travel time",
                fill: false,
                backgroundColor: "#3367D6",
                borderColor: "#3367D6",
                pointBorderColor: "#3367D6",
                pointBackgroundColor: "#fff",
                pointHoverBackgroundColor: "#3367D6",
                pointHoverBorderColor: "#3367D6",
                pointHoverBorderWidth: 5,
                data: []
            }
        ]
    }


var travelChart = new Chart(ctx, {
    type: 'line',
    data: data,
    options: {
        scales: {
            xAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: 'DateTime DD/MM HH:MM',
                    fontFamily: 'Roboto',
                    fontStyle: 'bold'

                },
                ticks: {
                    fontFamily: 'Roboto'
                }
            }],
            yAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: 'Time (min)',
                    fontFamily: 'Roboto',
                    fontStyle: 'bold'
                },
                ticks: {
                    fontFamily: 'Roboto'
                }
            }],
        },
        tooltips: {
            mode: 'label',
            fontFamily: 'Roboto',
            backgroundColor: 'rgba(42,42,42,1)'
        }
    }
});

/*
* Function to add a data pair to the graph
*
* @param number google's estimate
* @param number the user's input
* @param string date
*/
function addGraphData(data1, data2, label) {
    // Add data to graph
    this.graph.data.datasets[0].data.push(parseInt(data1));
    this.graph.data.datasets[1].data.push(parseInt(data2));
    this.graph.data.labels.push(label);
    this.graph.update();
}