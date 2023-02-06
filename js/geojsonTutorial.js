//leaflet quick start guide

//initialize the map and set the view to a given place and set a zoom level
var map = L.map('map').setView([39.74, -104.98], 5.4);

//add tile layer to the map from OPM
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

//create a geojson point object 
var geojsonFeature = {
    "type": "Feature",
    "properties": {
        "name": "Coors Field",
        "amenity": "Baseball Stadium",
        "popupContent": "This is where the Rockies play!"
    },
    "geometry": {
        "type": "Point",
        "coordinates": [-104.99404, 39.75621]
    }
};

//create a geojson line object
var myLines = [{
    "type": "LineString",
    "coordinates": [[-100, 40], [-105, 45], [-110, 55]]
}, {
    "type": "LineString",
    "coordinates": [[-105, 40], [-110, 45], [-115, 55]]
}];

//create a style for the line object
var myStyle = {
    "color": "#ff7800", //color of the line
    "weight": 5, //width of the line
    "opacity": 0.65 //opacity of the line
};

//add the line object to the map with the style created
L.geoJSON(myLines, {
    style: myStyle
}).addTo(map);

//create a geojson polygon object
var states = [{
    "type": "Feature",
    "properties": {"party": "Republican"},
    "geometry": {
        "type": "Polygon",
        "coordinates": [[
            [-104.05, 48.99],
            [-97.22,  48.98],
            [-96.58,  45.94],
            [-104.03, 45.94],
            [-104.05, 48.99]
        ]]
    }
}, {
    "type": "Feature",
    "properties": {"party": "Democrat"},
    "geometry": {
        "type": "Polygon",
        "coordinates": [[
            [-109.05, 41.00],
            [-102.06, 40.99],
            [-102.03, 36.99],
            [-109.04, 36.99],
            [-109.05, 41.00]
        ]]
    }
}];

//add the polygon object to the map with a style based on the party property
L.geoJSON(states, {
    style: function(feature) {
        switch (feature.properties.party) {
            case 'Republican': return {color: "#ff0000"}; 
            case 'Democrat':   return {color: "#0000ff"}; 
        }
    }
}).addTo(map);

//create marker options for the geojson point object
var geojsonMarkerOptions = {
    radius: 8, //size of the circle
    fillColor: "#ff7800", //color of the circle
    color: "#000",//color of the circle border
    weight: 1,//width of the circle border
    opacity: 1,//opacity of the circle border
    fillOpacity: 0.8//opacity of the circle
};

//add the marker with specified options to the map
L.geoJSON(geojsonFeature, { //
    pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, geojsonMarkerOptions);
    }
}).addTo(map);

//function to display the popup content of the geojson point object
function onEachFeature(feature, layer) {
    // does this feature have a property named popupContent?
    if (feature.properties && feature.properties.popupContent) { 
        layer.bindPopup(feature.properties.popupContent);
    }
}

//add the geojson point object to the map with the function to display the popup content
L.geoJSON(geojsonFeature, { 
    onEachFeature: onEachFeature
}).addTo(map);