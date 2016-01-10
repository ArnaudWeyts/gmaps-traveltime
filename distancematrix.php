<?php
	$key = 'AIzaSyAXTzdGTPfaSGz1wrCEmrqX1lJ3epVDA-0';
	$from = $_GET['from'];
	$to = $_GET['to'];
	$mode = $_GET['mode'];
	$url = 'https://maps.googleapis.com/maps/api/distancematrix/json…' . urlencode($from) . '&destinations=' . urlencode($to) . '&key='. urlencode($key) .'&travelmode=' . urlencode($mode) . '&departure_time=now';
	$json = file_get_contents($url);
	echo $json;
?>