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
            origin: mapS.origin,
            destination: mapS.destination,
            mode: mapS.travelMode
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
            mapS.origin = travelData.origin;
            mapS.destination = travelData.destination;
            mapS.travelMode = travelData.mode;

            // set modes if localstorage has one defined
            if (mapS.travelMode) {
                if (mapS.travelMode === 'driving') {
                    $('#driving').prop('checked', true);
                }
                else if (mapS.travelMode === 'bicycling') {
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
                mapS.originInput.prop('disabled', true);
                mapS.destinationInput.prop('disabled', true);
                mapS.allModes.prop('disabled', true);
                actionS.submitButton.val('Edit');
                actionS.switchButton.prop('disabled', true);
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
        originInput: $('#origin'),
        destinationInput: $('#destination'),
        allModes: $('input[name="radios"]'),
        submitButton: $('#search'),
        addtimeButton: $('#addtime'),
        switchButton: $('#switch')
    },

    init: function() {
        actionS = this.settings;
        this.bindUIActions();
    },

    /*
    *   Enables or disables all of the inputs
    */
    toggleInputs: function(disable) {
        mapS.originInput.prop('disabled', disable);
        mapS.destinationInput.prop('disabled', disable);
        mapS.allModes.prop('disabled', disable);
        if (disable) {
            actionS.submitButton.val('Edit');
        }
        else {
            actionS.submitButton.val('Search');
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
        actionS.submitButton.click(function(e) {
            e.preventDefault();
            // calculating a route
            if (actionS.submitButton.val() === "Search") {
                // get input and set them in localstorage
                storageModule.setTravelData();

                // disable buttons
                this.toggleInputs(true);

                // calculate the route & tell localstorage a route was calculated
                this.calculateRoute(mapS.origin, mapS.destination, this.defineTravelMode(mapS.travelMode));
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
        actionS.switchButton.click(function(e) {
            e.preventDefault();
            if (actionS.submitButton.val() === "Search") {
                var originvalue = mapS.$originInput.val();
                var destvalue = mapS.$destinationInput.val();
                mapS.$originInput.val(destvalue);
                mapS.$destinationInput.val(originvalue);
            }
        });
    }

};

/*----------------------------------------------------
-                    GOOGLE MAPS                     -
----------------------------------------------------*/

var mapS,
    mapModule = {

    settings: {
        directionsDisplay: null,
        directionsService: null,
        map: null,
        originInput: document.getElementById('origin'),
        destinationInput: document.getElementById('destination'),
        $originInput: $('#origin'),
        $destinationInput: $('#destination'),
        allModes: $('input[name="radios"]'),
        selectedMode: $('input[name="radios"]:checked'),
        origin: $('origin').val(),
        destination: $('destination').val(),
        travelMode: $('input[name="radios"]:checked').prop('id')
    },

    init: function() {
        mapS = this.settings;
        var mapOptions = {
            zoom: 7,
            center: {lat: 50.9373401, lng: 4.041093},
            streetViewControl: false,
            mapTypeControl: false
        }

        mapS.map = new google.maps.Map(document.getElementById('map'), mapOptions);
        mapS.directionsService = new google.maps.DirectionsService();
        mapS.directionsDisplay = new google.maps.DirectionsRenderer();
        mapS.directionsDisplay.setMap(mapS.map);
        var trafficLayer = new google.maps.TrafficLayer();
        trafficLayer.setMap(mapS.map);

        // inputs
        var modes = document.getElementById('mode-select');

        // autocomplete functions on inputs
        var origin_autocomplete = new google.maps.places.Autocomplete(mapS.originInput);
        origin_autocomplete.bindTo('bounds', mapS.map);
        var destination_autocomplete = new google.maps.places.Autocomplete(mapS.destinationInput);
        destination_autocomplete.bindTo('bounds', mapS.map);

        // check if route was already calculated and recalculate
        if (localStorage.getItem('calculated')) {
            this.calculateRoute(localStorage.origin, localStorage.destination, this.defineTravelMode(localStorage.travelMode));
        }
        // try HTML5 geolocation if the route wasn't calculated
        else {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position) {
                    var pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };

                    mapS.map.setCenter(pos);
                }, function() {
                    mapS.handleLocationError(true, infoWindow, mapS.map.getCenter());
                });
            }
            else {
                // Browser doesn't support Geolocation
                mapS.handleLocationError(false, infoWindow, mapS.map.getCenter());
            }
        }
    },

    handleLocationError: function(browserHasGeolocation, infoWindow, pos) {
        infoWindow.setPosition(pos);
        infoWindow.setContent(browserHasGeolocation ?
            'Error: The Geolocation service failed.' :
            'Error: Your browser doesn\'t support geolocation.');
    },

    /*
    Calculates the route between 2 destinations using
    the google distancematrix api
    @param origin the chosen origin
    @param destination the chosen destination
    @param travelMode the selected travelmode
    */
    calculateRoute: function(origin, destination, travelMode) {
        // the request for the directions
        var request = {
            origin:origin,
            destination:destination,
            travelMode: travelMode
        };

        // use the returned results to set the route
        mapS.directionsService.route(request, function(result, status) {
            if (status == google.maps.DirectionsStatus.OK) {
              mapS.directionsDisplay.setDirections(result);
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
    },

    /*
        function to define the travelmode from a given string
        @param string mode
        @return google.maps.TraveMode.*
    */
    defineTravelMode: function(mode) {
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
};

window.initMap = function() {
    mapModule.init();
    actionModule.init();
    storageModule.init();
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