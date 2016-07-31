/**
* Clientside Webscripten 1 - Google Maps API
* @author Arnaud Weyts{arnaud.weyts@student.odisee.be}
*/

/**
* This function inits everything, and is used in the callback by google
* @returns {void}
*/
window.initMap = function() {
    mapModule.init();
    chartModule.init();
    actionModule.init();
    storageModule.init();
}

/**
* The storage module handles all of the storage actions
* f.e. getting data from localstorage and setting data in
* localstorage
*/
var storageModule = {

    init: function() {
        // kick things off
        this.loadFromStorage();
    },

    /**
    * This function sets the data in localstorage
    * @returns {void}
    */
    setTravelData: function() {
        var travelData = {
            origin: mapS.origin,
            destination: mapS.destination,
            mode: mapS.travelMode
        };

        localStorage.setItem('travelData', JSON.stringify(travelData));
    },

    /**
    * Function to set graph data in local storage
    * @returns {void}
    */
    setchartData: function() {
        var chartData = {
            user: chartS.data.datasets[0].data,
            google: chartS.data.datasets[1].data,
            labels: chartS.data.labels
        }

        // Write object to localstorage
        localStorage.setItem('chartData', JSON.stringify(chartData));
    },

    /**
    * Loads stuff from localstorage if there's something found
    * @returns {void}
    */
    loadFromStorage: function() {
        if(typeof(Storage) !== "undefined") {

            // get data from localstorage
            var travelData = JSON.parse(localStorage.getItem('travelData'));
            if (travelData !== null) {
                mapS.origin = travelData.origin;
                mapS.destination = travelData.destination;
                mapS.travelMode = travelData.mode;

                if (mapS.travelMode === 'driving') {
                    $('#driving').prop('checked', true);
                }
                else if (mapS.travelMode === 'bicycling') {
                    $('#bicycling').prop('checked', true);
                }
                else {
                    $('#walking').prop('checked', true);
                }

                // set the inputs
                mapS.$originInput.val(mapS.origin);
                mapS.$destinationInput.val(mapS.destination);

                // disable buttons if the route has been calculated
                mapS.$originInput.prop('disabled', true);
                mapS.$destinationInput.prop('disabled', true);
                mapS.allModes.prop('disabled', true);
                actionS.submitButton.val('Edit');
                actionS.switchButton.prop('disabled', true);

                mapModule.calculateRoute(mapS.origin, mapS.destination, mapModule.defineTravelMode(mapS.travelMode));

                // check if there's any chartData
                if (localStorage.getItem('chartData')) {
                    // get data from localstorage
                    var chartData = JSON.parse(localStorage.getItem('chartData'));

                    // Update the graph with the data
                    chartS.data.datasets[0].data = chartData.user;
                    chartS.data.datasets[1].data = chartData.google;
                    chartS.data.labels = chartData.labels;
                    chartS.travelChart.update();
                }
            }
            else {
                // set all the inputs to default
                actionModule.toggleInputs(false);
                $('#driving').prop('checked', true);
            }
        }
        else {
            window.console.log("No localstorage supported");
        }
    }
};

/**
* The actionmodule handles all of the actions, this includes all the buttons.
* It also contains some other commonly used functions
*/
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

    /**
    * Enables or disables all of the inputs
    * @param {boolean} disable wether to disable it or not
    * @returns {void}
    */
    toggleInputs: function(disable) {
        mapS.$originInput.prop('disabled', disable);
        mapS.$destinationInput.prop('disabled', disable);
        mapS.allModes.prop('disabled', disable);
        if (disable) {
            actionS.submitButton.val('Edit');
        }
        else {
            actionS.submitButton.val('Search');
        }
    },

    /**
    * Handle all the UI actions, all the buttons etc.
    * @returns {void}
    */
    bindUIActions: function() {
        /**
        * gets the values from the inputs to calculate the route
        * or shows the dialog to edit the inputs if a route was
        * already calculated
        */
        actionS.submitButton.click(function(e) {
            e.preventDefault();
            // calculating a route
            if (actionS.submitButton.val() === "Search") {
                // get input and set them in localstorage
                mapModule.getInputs();
                storageModule.setTravelData();

                // disable buttons
                actionModule.toggleInputs(true);

                // calculate the route & tell localstorage a route was calculated
                mapModule.calculateRoute(mapS.origin, mapS.destination, mapModule.defineTravelMode(mapS.travelMode));
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
                            actionModule.toggleInputs(false);
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

        // Switches destination and origin around
        actionS.switchButton.click(function(e) {
            e.preventDefault();
            if (actionS.submitButton.val() === "Search") {
                var originvalue = mapS.$originInput.val();
                var destvalue = mapS.$destinationInput.val();
                mapS.$originInput.val(destvalue);
                mapS.$destinationInput.val(originvalue);
            }
        });

        // Handles everything when you add a traveltime
        actionS.addtimeButton.click(function(e) {
            e.preventDefault();
            // Calculate time in minutes
            var time = actionModule.getMinutes($('#days').val(), $('#hours').val(), $('#minutes').val());

            // Get travel duration from Google Maps, display it and add it to the graph
            var mapTime = $('#estimate').text();
            chartModule.addChartData(mapTime, time, actionModule.formatDate(new Date()));

            storageModule.setchartData();
        });
    },

    /**
    * Calculates total of minutes from hours, minutes, days
    * @param {number} days Number of days
    * @param {number} hours Number of hours
    * @param {number} minutes Number of minutes
    * @returns {number} Calcuted amount of minutes from days, hours and minutes
    */
    getMinutes: function(days, hours, minutes) {
        var totalMins = minutes ?
            parseInt(minutes) :
            0;
        totalMins += days ?
            days * 1440 :
            0;
        totalMins += hours ?
            hours * 60 :
            0;

        return totalMins;
    },

    /**
    * Formats a date as DD/MM HH:mm
    * @param {object} date The date that needs to be formatted
    * @returns {string} The date formatted as DD/MM HH:mm
    */
    formatDate: function(date) {
        var hours = date.getHours() < 10 ?
            '0' + date.getHours() :
            date.getHours();
        var minutes = date.getMinutes() < 10 ?
            '0' + date.getMinutes() :
            date.getMinutes();
        var day = date.getDate() < 10 ?
            '0' + date.getDate() :
            date.getDate();
        var month = (date.getMonth() + 1) < 10 ?
            '0' + (date.getMonth() + 1) :
            (date.getMonth() + 1);

        return day + '/' + month + ' ' + hours + ':' + minutes;
    }
};

/**
* The mapmodule handles all of the map actions, the inputs, etc.
*/
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
        origin: $('#origin').val(),
        destination: $('#destination').val(),
        travelMode: $('input[name="radios"]:checked').prop('id')
    },

    /**
    * Inits the map, using the map options
    * @returns {void}
    */
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

        // autocomplete functions on inputs
        var origin_autocomplete = new google.maps.places.Autocomplete(mapS.originInput);
        origin_autocomplete.bindTo('bounds', mapS.map);
        var destination_autocomplete = new google.maps.places.Autocomplete(mapS.destinationInput);
        destination_autocomplete.bindTo('bounds', mapS.map);

        // check if route was already calculated
        if (!localStorage.getItem('travelData')) {
            // try HTML5 geolocation if the route wasn't calculated
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

        google.maps.event.addDomListener(window, 'resize', function() {
            var center = mapS.map.getCenter();
            google.maps.event.trigger(mapS.map, "resize");
            mapS.map.setCenter(center);
        });
    },

    /**
    * Function used when an error occurs in the map
    * @param {boolean} browserHasGeolocation does the browser support geolocation
    * @param {object} infoWindow the infowinow object
    * @param {object} pos the position object
    * @returns {void}
    */
    handleLocationError: function(browserHasGeolocation, infoWindow, pos) {
        infoWindow.setPosition(pos);
        infoWindow.setContent(browserHasGeolocation ?
            'Error: The Geolocation service failed.' :
            'Error: Your browser doesn\'t support geolocation.');
    },

    /**
    * Calculates the route between 2 destinations using
    * the google distancematrix api
    * @param {string} origin the chosen origin
    * @param {string} destination the chosen destination
    * @param {string} travelMode the selected travelmode
    * @returns {void}
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
                //var destinations = response.destinationAddresses;

                for (var i = 0; i < origins.length; i++) {
                    var results = response.rows[i].elements;
                    for (var j = 0; j < results.length; j++) {
                        var element = results[j];
                        //var distance = element.distance.text;
                        var duration = element.duration.text;
                        $('#estimate').text(duration);
                        $('.estimate').css('display', 'inline-block');
                        $('.duration-input').css('display', 'inline-block');
                        $('.graph').show();
                        //var from = origins[i];
                        //var to = destinations[j];
                    }
                }
            }
        }
    },

    /**
    * Function to define the travelmode from a given string
    * @param {string} mode the travelmode string
    * @returns {object} google.maps.TraveMode.* the google maps travelmode object
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
    },

    /**
    * Function to get the current inputs
    * @returns {void}
    */
    getInputs: function() {
        mapS.origin = $('#origin').val();
        mapS.destination = $('#destination').val();
        mapS.travelMode = $('input[name="radios"]:checked').prop('id');
    }
};

/**
* The chart module handles all the graph stuff
*/
var chartS,
    chartModule = {

    settings: {
        Chart: require("chart.js"),
        ctx: $("#travelchart"),
        travelChart: null,
        data: {
            labels: [],
            datasets: [
                {
                    label: "Google's estimate",
                    fill: false,
                    backgroundColor: "#43A047",
                    borderColor: "#43A047",
                    pointBorderColor: "#43A047",
                    pointBackgroundColor: "#fff",
                    pointHoverBackgroundColor: "#43A047",
                    pointHoverBorderColor: "#43A047",
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
        },

    },

    init: function() {
        chartS = this.settings;
        chartS.travelChart = new chartS.Chart(chartS.ctx, {
            type: 'line',
            data: chartS.data,
            options: {
                scales: {
                    xAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: 'Date & Time DD/MM HH:MM',
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
                            labelString: 'Duration (min)',
                            fontFamily: 'Roboto',
                            fontStyle: 'bold'
                        },
                        ticks: {
                            beginAtZero: true,
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
    },

    /**
    * Function to add a data pair to the graph
    * @param {number} data1 google's estimate
    * @param {number} data2 the user's input
    * @param {string} label date
    * @returns {void}
    */
    addChartData: function(data1, data2, label) {
        // Add data to graph
        chartS.travelChart.data.datasets[0].data.push(parseInt(data1));
        chartS.travelChart.data.datasets[1].data.push(parseInt(data2));
        chartS.travelChart.data.labels.push(label);
        chartS.travelChart.update();
    }
}