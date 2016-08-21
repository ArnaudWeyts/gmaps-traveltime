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
    imageModule.init();
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
    * Clears all the traveldata from localstorage
    * @returns {void}
    */
    clearTravelData: function() {
        localStorage.removeItem('travelData');
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
    * Clears all of the chartdata from localstorage
    * @returns {void}
    */
    clearChartData: function() {
        localStorage.removeItem('chartData');
    },

    setImageData: function() {
        var imageData = {
            albumID: imageS.albumID,
            albumHash: imageS.albumHash,
            imageIDs: imageS.imageIDs
        }

        localStorage.setItem('imageData', JSON.stringify(imageData));
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

                    imageS.chartImages.removeClass('hide');
                }
            }
            else {
                // set all the inputs to default
                actionModule.toggleInputs(false);
                $('#driving').prop('checked', true);
            }

            if (localStorage.getItem('imageData')) {
                var imageData = JSON.parse(localStorage.getItem('imageData'));

                imageS.chartImages.removeClass('hide');

                imageS.albumID = imageData.albumID;
                imageS.albumHash = imageData.albumHash;
                imageS.imageIDs = imageData.imageIDs;

                if (imageS.imageIDs.length !== 0) {
                    $('#nograph-msg').hide();
                }

                imageModule.displayAllImages(imageModule.getAllImages(imageS.imageIDs));
            }
            // show some example images if none were saved
            else {
                $('#nograph-msg').hide();

                imageModule.displaySampleImages();
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
        switchButton: $('#switch'),
        saveButton: $('#saveimage'),
        deleteButton: $('.delete-btn')
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

                            // clear directions
                            mapS.directionsDisplay.setMap(null);

                            // clear graph
                            chartS.travelChart.data.datasets[0].data = [];
                            chartS.travelChart.data.datasets[1].data = [];
                            chartS.travelChart.update();

                            $('#estimate').hide();
                            $('.estimate').hide();
                            $('.duration-input').hide();
                            $('.graph').hide();

                            // clear localstorage
                            storageModule.clearTravelData();
                            storageModule.clearChartData();
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

        // show chartimages
        actionS.addtimeButton.one("click", function() {
            $('.chartimages').removeClass("hide");
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

        // hide the message when save is clicked the first time
        actionS.saveButton.one("click", function() {
            $('#nograph-msg').hide();
        });

        actionS.saveButton.click(function(e) {
            e.preventDefault();
            while(!chartS.readyToSave) {
                //window.console.log("waiting")
            }
            // convert the chart to a base64Image string
            var image = chartS.travelChart.toBase64Image();

            // check if an album already exists
            if (imageS.albumHash === null) {
                // create an album
                imageModule.createAlbum();
            }

            var title = mapS.origin + " to " + mapS.destination + " (" + mapS.travelMode + ")";
            // upload the image and save the id
            var imageID = imageModule.upload(image, title);

            // add the image to the album
            imageModule.updateAlbum(imageID, imageS.albumHash);

            // write the album variables to localstorage
            storageModule.setImageData();

            // display the image that was just uploaded
            imageModule.displaySingleImage(imageModule.getSingleImage(imageID));

            imageModule.removeSampleImages();
        });

        // jquery dynamic event handler to handle all the deletebuttons
        $(document).on('click', '.delete-btn', function(e) {
            e.preventDefault();
            // get the node to be deleted
            var imageNode = $(this).parent();

            // delete the node using the parent
            imageNode.remove();

            // delete from the imgur album
            if ($(this).attr('id') !== '') {
                imageModule.deleteFromAlbum($(this).attr('id'), imageS.albumHash);
            }
        });
    },

    /**
    * Deprecated function
    * @returns {void}
    */
    updateUIActions: function() {
        actionS.deleteButton = $('.delete-btn');
        actionS.deleteButton.click(function(e) {
            e.preventDefault();
            // get the node to be deleted
            var imageNode = this.parentNode;

            // get its parent
            var parent = imageNode.parentNode;

            // delete the node using the parent
            parent.removeChild(imageNode);

            // delete from the imgur album
            if (this.id !== '') {
                imageModule.deleteFromAlbum(this.id, imageS.albumHash);
            }
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
                        $('#estimate').show();
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
        readyToSave: false,
        data: {
            labels: [],
            datasets: [
                {
                    label: "Google's estimate",
                    fill: false,
                    backgroundColor: "#43A047",
                    borderColor: "#43A047",
                    pointBackgroundColor: "#fff",
                    pointHoverBackgroundColor: "#43A047",
                    pointHoverBorderWidth: 4,
                    data: []
                },
                {
                    label: "Your travel time",
                    fill: false,
                    backgroundColor: "#2196F3",
                    borderColor: "#2196F3",
                    pointBackgroundColor: "#fff",
                    pointHoverBackgroundColor: "#2196F3",
                    pointHoverBorderWidth: 4,
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
                        },
                    }],
                    yAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: 'Duration (min)',
                        },
                    }],
                },
                tooltips: {
                    mode: 'label',
                    backgroundColor: 'rgba(0,0,0,1)'
                },
                animation: {
                    onProgress: function() {
                        chartS.readyToSave = false;
                    },
                    onComplete: function() {
                        chartS.readyToSave = true;
                    }
                }
            },
        });
    },

    /**
    * Function to add data to the graph
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
    },
}

/**
* The image module handles all of the imgur api communication
*/
var imageS,
    imageModule = {

    settings: {
        chartImages: $('#chartimages'),
        albumHash: null,
        albumID: null,
        imageIDs: []
    },

    init: function() {
        imageS = this.settings;
    },

    /**
    * Handles an upload of a base64image
    * @param {image} base64Image the image
    * @param {string} title the title, aka the origin, destination & mode
    * @returns {number} id the imgur id of the image
    */
    upload: function(base64Image, title) {
        var imgData = JSON.stringify(base64Image.replace(/^data:image\/(png|jpg);base64,/, ""));
        var imageID = null;
        $.ajax({
            url: 'https://api.imgur.com/3/image',
            headers: {
                'Authorization': 'Client-ID 41ade810c7d2a5f'
            },
            async: false,
            type: 'POST',
            data: {
                'image': imgData,
                'title': title
            },
            success: function(result) {
                imageID = result.data.id;
                imageS.imageIDs.push(imageID);
            }
        });

        return imageID;
    },

    /**
    * Creates an album & sets the albumHash & albumID
    * @returns {void}
    */
    createAlbum: function() {
        $.ajax({
            url: 'https://api.imgur.com/3/album',
            headers: {
                'Authorization': 'Client-ID 41ade810c7d2a5f'
            },
            type: 'POST',
            async: false,
            data: {
                title: "Your Graphs"
            },
            success: function(result) {
                imageS.albumHash = result.data.deletehash;
                imageS.albumID = result.data.id;
            }
        });
    },

    /**
    * Adds an image to an album
    * @param {number} imageID the imgur image id
    * @param {number} albumHash the album deletehash
    * @return {void}
    */
    updateAlbum: function(imageID, albumHash) {
        $.ajax({
            url: 'https://api.imgur.com/3/album/' + albumHash + '/add',
            headers: {
                'Authorization': 'Client-ID 41ade810c7d2a5f'
            },
            type: 'PUT',
            async: false,
            data: {
                ids: [imageID]
            }
        });
    },

    /**
    * Deletes a given image from an album
    * @param {number} imageID the imgur image id
    * @param {number} albumHash the album deletehash
    * @returns {void}
    */
    deleteFromAlbum: function(imageID, albumHash) {
        $.ajax({
            url: 'https://api.imgur.com/3/album/' + albumHash + '/remove_images/?ids=' + imageID,
            headers: {
                'Authorization': 'Client-ID 41ade810c7d2a5f'
            },
            type: 'DELETE',
            success: function() {
                // delete the id from the array
                var index = imageS.imageIDs.indexOf(imageID);
                imageS.imageIDs.splice(index, 1);

                if (imageS.imageIDs.length === 0) {
                    $('#nograph-msg').show();
                }

                // rewrite to localstorage
                storageModule.setImageData();
            }
        });
    },

    /**
    * Gets all the images for an album using the imgur API.
    * This is useful, but it's better to load the images using the saved ID's
    * in localstorage.
    * @param {number} albumID the imgur album id
    * @returns {array} images all of the images
    */
    getAlbumImages: function(albumID) {
        var images = null;
        $.ajax({
            url: 'https://api.imgur.com/3/album/' + albumID + '/images',
            headers: {
                'Authorization': 'Client-ID 41ade810c7d2a5f'
            },
            async: false,
            type: 'GET',
            success: function(result) {
                images = result.data;
            }
        });

        return images;
    },

    /**
    * Gets all the images using the localstorage ID's
    * @param {array} imageIDs the image IDs
    * @returns {array} images all of the images
    */
    getAllImages: function(imageIDs) {
        var images = [];
        for (var i = imageIDs.length - 1; i >= 0; i--) {
            $.ajax({
                url: 'https://api.imgur.com/3/image/' + imageIDs[i],
                headers: {
                    'Authorization': 'Client-ID 41ade810c7d2a5f'
                },
                async: false,
                type: 'GET',
                success: function(result) {
                    images.push(result.data);
                }
            });
        }

        return images;
    },

    /**
    * Gets a single image using an ID
    * @param {number} imageID the imgur image id
    * @return {object} image the image object
    */
    getSingleImage: function(imageID) {
        var image;
        $.ajax({
            url: 'https://api.imgur.com/3/image/' + imageID,
            headers: {
                'Authorization': 'Client-ID 41ade810c7d2a5f'
            },
            async: false,
            type: 'GET',
            success: function(result) {
                image = result.data;
            }
        });

        return image;
    },

    /**
    * Adds a single image to the layout
    * @param {object} image the image object
    * @returns {void}
    */
    displaySingleImage: function(image) {
        var parent = document.getElementById('chartimages');
        var div = document.createElement('div');
        div.className = 'image-container';
        var title = document.createElement('h2');
        title.textContent = image.title;
        div.appendChild(title);
        var img = document.createElement('img');
        img.src = image.link.replace(/^http:/, 'https:');
        img.className = 'chart-img';
        div.appendChild(img);
        var openImage = document.createElement('a');
        openImage.href = image.link.replace(/^http:/, 'https:');
        openImage.className = 'material-btn gallery-btn';
        openImage.textContent = "Download";
        var deleteImage = document.createElement('a');
        deleteImage.id = image.id;
        deleteImage.className = 'material-btn gallery-btn delete-btn';
        deleteImage.textContent = "Delete";
        div.appendChild(openImage);
        div.appendChild(deleteImage);
        parent.appendChild(div);
    },

    /**
    * Displays all of the images in the html
    * @param {array} images an array of images
    * @returns {void}
    */
    displayAllImages: function(images) {
        var parent = document.getElementById('chartimages');
        images.forEach(function(entry) {
            window.console.log(entry);
            var div = document.createElement('div');
            div.className = 'image-container'
            var title = document.createElement('h2');
            title.textContent = entry.title;
            div.appendChild(title);
            var img = document.createElement('img');
            img.src = entry.link.replace(/^http:/, 'https:');
            img.className = 'chart-img';
            div.appendChild(img);
            var openImage = document.createElement('a');
            openImage.href = entry.link.replace(/^http:/, 'https:');
            openImage.className = 'material-btn gallery-btn';
            openImage.textContent = "Download";
            var deleteImage = document.createElement('a');
            deleteImage.id = entry.id;
            deleteImage.className = 'material-btn gallery-btn delete-btn';
            deleteImage.textContent = "Delete";
            div.appendChild(openImage);
            div.appendChild(deleteImage);
            parent.appendChild(div);
        })
    },

    displaySampleImages: function() {
        var imageIDs = ['k02OrG2', 'yXirSfe', 'fq7dKKU'];
        var images = this.getAllImages(imageIDs);
        var parent = document.getElementById('chartimages');
        images.forEach(function(entry) {
            window.console.log(entry);
            var div = document.createElement('div');
            div.className = 'image-container'
            div.id = entry.id;
            var title = document.createElement('h2');
            title.textContent = entry.title;
            div.appendChild(title);
            var img = document.createElement('img');
            img.src = entry.link.replace(/^http:/, 'https:');
            img.className = 'chart-img';
            div.appendChild(img);
            var openImage = document.createElement('a');
            openImage.href = entry.link.replace(/^http:/, 'https:');
            openImage.className = 'material-btn gallery-btn';
            openImage.textContent = "Download";
            var deleteImage = document.createElement('a');
            deleteImage.className = 'material-btn gallery-btn delete-btn';
            deleteImage.textContent = "Delete";
            div.appendChild(openImage);
            div.appendChild(deleteImage);
            parent.appendChild(div);
        })
    },

    removeSampleImages: function() {
        var imageIDs = ['k02OrG2', 'yXirSfe', 'fq7dKKU'];
        var parent = document.getElementById('chartimages');
        for (var i = imageIDs.length - 1; i >= 0; i--) {
            var child = document.getElementById(imageIDs[i]);
            if (child) {
                parent.removeChild(child);
            }
        }
    }
}