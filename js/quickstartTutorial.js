//leaflet quick start guide

//initialize the map and set the view to a given place and set a zoom level
var map = L.map('map').setView([51.505, -0.09], 13);

//add tile layer to the map from OPM
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

//add markers
var marker = L.marker([51.5, -0.09]).addTo(map);

var circle = L.circle([51.508, -0.11], {
    color: 'red', //color of the circle
    fillColor: '#f03', //color of the fill
    fillOpacity: 0.5, //opacity of the fill
    radius: 500 //radius of the circle
}).addTo(map);

var polygon = L.polygon([
    [51.509, -0.08],
    [51.503, -0.06],
    [51.51, -0.047]
]).addTo(map);

//add popups to the markers
marker.bindPopup("<b>Hello world!</b><br>I am a popup.").openPopup();
circle.bindPopup("I am a circle.");
polygon.bindPopup("I am a polygon.");

//add a popup to the map
var popup = L.popup();

//add a popup to the map when the map is clicked
function onMapClick(e) {
    popup
        .setLatLng(e.latlng) //set the location of the popup
        .setContent("You clicked the map at " + e.latlng.toString()) //set the content of the popup
        .openOn(map); //open the popup on the map
}

//add the click event to the map
map.on('click', onMapClick); 