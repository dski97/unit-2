/* Map of GeoJSON data from countriesInflation that shows consumer inflation prices from 1985-2020 in 5 year intervals. */
//declare map var in global scope
var map;
var minValue
//Step 1:function to instantiate the Leaflet map
function createMap(){
    //create the map
    map = L.map('map', {
        center: [17, 10],
        zoom: 2.5,
        scrollWheelZoom: 'center'
    });

    //add ARCgis base tilelayer
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
        maxZoom: 8,
        minZoom: 3
    }).addTo(map);

    //call getData function
    getData(map);
};

//step 2: create arrays of the values to be used in proportional symbols
function calculateMinValue(data){
    var allValues = [];
    //loop through each country
    for (var country of data.features){
        //loop through each year
        for (var year = 1985; year <= 2020; year+=5){
            //get inflation value for country
            var value = country.properties["Consumer_Inflation%_"+String(year)];
            //add value to array
            allValues.push(value);
        }
    }
    //get minimum value of our array
    var minValue = Math.min(...allValues);
    return minValue < 0 ? 1 : minValue;
}
//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //constant factor adjusts symbol sizes evenly
    var minRadius = 5;

    //negative values turn to 1
    if (attValue < 0) {
        attValue = 1;
    }

    //set maximum value to 750 for inflation percentages over 1000
    if (attValue > 1000) {
        attValue = 750;
    }


    //Flannery Apperance Compensation formula
    var radius = 1.0083 * Math.pow(attValue/minValue,0.5715) * minRadius

    return radius;
};

function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with population values
        if (attribute.indexOf("Consumer_Inflation%") > -1){
            attributes.push(attribute);
        };
    };

    //check result
    console.log(attributes);

    return attributes;
};


//Step 3: add circle markers for point features to the map
function pointToLayer(feature, latlng, attributes){
    //Step 4: determine which attribute to visualize with proportional symbols
    var attribute = attributes[0];

    //check
    console.log(attribute);

    //create marker options
    var options = {
    radius: 8,
    fillColor: "#ff7800",
    color: "#fff",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
    };

    //for each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);

    //give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    //create circle markers
    var layer = L.circleMarker(latlng, options);

    //build popup content string
    var popupContent = "<p><b>Country:</b> " + feature.properties['Country Name'] + "</p>";

    //add formatted attribute to popup content string
    var year = attribute.split("_")[2];
    popupContent += "<p><b>Inflation in " + year + ":</b> " + feature.properties[attribute] + "%</p>";

    //bind the popup to the circle marker
    layer.bindPopup(popupContent)

    return layer;
};

//add circle markers for point features to the map
function createPropSymbols(data, attributes){
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};

//resize proportional symbols according to new attribute values
function updatePropSymbols(attribute){
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            //update the layer style and popup
            var props = layer.feature.properties;
            //access feature properties
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);

            //add city to popup content string
            var popupContent = "<p><b>Country:</b> " + props['Country Name'] + "</p>";

            //add formatted attribute to panel content string
            var year = attribute.split("_")[2];
            popupContent += "<p><b>Inflation in " + year + ":</b> " + props[attribute] + "%</p>";

            //replace the layer popup
            if (popup = layer.getPopup()) {
                var popup = layer.getPopup();
                popup.setContent(popupContent).update();
            }
        };
    });
};

function createSequenceControls(attributes) {
    // create range input element (slider)
    var slider = "<input class='range-slider' type='range'></input>";
    document.querySelector("#panel").insertAdjacentHTML("beforeend", slider);
  
    // set slider attributes
    document.querySelector(".range-slider").max = 7;
    document.querySelector(".range-slider").min = 0;
    document.querySelector(".range-slider").value = 0;
    document.querySelector(".range-slider").step = 1;
  
    // add reverse and forward buttons
    document.querySelector("#panel").insertAdjacentHTML("beforeend", "<button class='step' id='reverse'>Reverse</button>");
    document.querySelector("#panel").insertAdjacentHTML("beforeend", "<button class='step' id='forward'>Forward</button>");
  
    // replace buttons with images
    document.querySelector("#reverse").insertAdjacentHTML("beforeend", "<img src='img/reverse.png'>");
    document.querySelector("#forward").insertAdjacentHTML("beforeend", "<img src='img/forward.png'>");
  
    // add year display text box
    var yearDisplay = document.createElement("div");
    yearDisplay.id = "year-display";
    document.querySelector("#panel").appendChild(yearDisplay);
  
    // click listener for buttons
    document.querySelectorAll(".step").forEach(function (step) {
      step.addEventListener("click", function () {
        var index = document.querySelector(".range-slider").value;
        // increment or decrement depending on button clicked
        if (step.id == "forward") {
          index++;
          // if past the last attribute, wrap around to first attribute
          index = index > 7 ? 0 : index;
        } else if (step.id == "reverse") {
          index--;
          // if past the first attribute, wrap around to last attribute
          index = index < 0 ? 7 : index;
        }
  
        // update slider
        document.querySelector(".range-slider").value = index;
  
        // pass new attribute to update symbols and year display
        var attribute = attributes[index];
        updatePropSymbols(attribute);
        updateYearDisplay(attribute);
      });
    });
  
    // input listener for slider
    document.querySelector(".range-slider").addEventListener("input", function () {
      // get the new index value
      var index = this.value;
  
      // pass new attribute to update symbols and year display
      var attribute = attributes[index];
      updatePropSymbols(attribute);
      updateYearDisplay(attribute);
    });
  }
  // update year display text box
  function updateYearDisplay(attribute) {
    // extract year from attribute name and update year display text box
    var year = attribute.split("_")[2];
    document.querySelector("#year-display").textContent = "Year: " + year;
  }
  
  //add a search control
  function addSearchControl(data) {
    var searchControl = new L.Control.Search({
        layer: L.geoJson(data, {
            pointToLayer: function(feature, latlng) {
                return L.circleMarker(latlng, {
                    radius: 0, // set the radius to 0 to hide the blue markers
                    fillOpacity: 0,
                    opacity: 0
                });
            }
        }),
        propertyName: 'Country Name',
        zoom: 6,
        marker: false,
        moveToLocation: function(latlng, title, map) {
            map.setView(latlng, 6);
        }
    });
    map.addControl(searchControl);
}


//Step 7: Import GeoJSON data
function getData(){
    //load the data
    fetch("data/countriesInflation.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            //create an attributes array
            var attributes = processData(json);
            //calculate minimum data value
            minValue = calculateMinValue(json);
            //call function to create proportional symbols
            createPropSymbols(json, attributes);
            //call function to create sequence controls
            createSequenceControls(attributes);
            //update year display for start page
            updateYearDisplay(attributes[0]);
            //add search control
            addSearchControl(json);
        })
};

document.addEventListener('DOMContentLoaded',createMap)
