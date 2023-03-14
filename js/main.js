/* Map of GeoJSON data from countriesInflation that shows consumer inflation prices from 1985-2020 in 5 year intervals. */
//declare map var in global scope
var map;
var dataStats = {};
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
function calcStats(data){
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
    dataStats.min = Math.min(...allValues);

    if (dataStats.min <= 0) {
        dataStats.min = 1;
    }

    dataStats.max = Math.max(...allValues);
    //calculate meanValue
    var sum = allValues.reduce(function (a, b) {
        return a + b;
    });
    dataStats.mean = sum / allValues.length;
    
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
    var radius = 1.0083 * Math.pow(attValue/dataStats.min,0.5715) * minRadius

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
    layer.bindPopup(popupContent, {
        offset: new L.Point(0, -options.radius),
    });

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

function getCircleValues(attribute) {
    //start with min at highest possible and max at lowest possible number
    var min = Infinity,
      max = -Infinity;
  
    map.eachLayer(function (layer) {
      //get the attribute value
      if (layer.feature) {
        var attributeValue = Number(layer.feature.properties[attribute]);
  
        //test for min
        if (attributeValue < min) {
          min = attributeValue;
        }
  
        //test for max
        if (attributeValue > max) {
          max = attributeValue;
        }
      }
    });
  
    //set mean
    var mean = (max + min) / 2;
  
    //return values as an object
    return {
      max: max,
      mean: mean,
      min: min,
    };
}

function updateLegend(attribute) {
    //create content for legend
    var year = attribute.split("_")[2];
    console.log("year",year)
    //replace legend content
    document.querySelector("span.year").innerHTML = year;
  
    //get the max, mean, and min values as an object
    var circleValues = getCircleValues(attribute);
  
    for (var key in circleValues) {
      //get the radius
      var radius = calcPropRadius(circleValues[key]);
  
      document.querySelector("#" + key).setAttribute("cy", 59 - radius);
      document.querySelector("#" + key).setAttribute("r", radius)
  
      document.querySelector("#" + key + "-text").textContent = Math.round(circleValues[key] * 100) / 100 + " million";
    }
}

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
            var popup = layer.getPopup();
            // this is closer to working but you will still need to address a conflict with
            // how you are creating the search layer
            if (typeof popup !== 'undefined') {
                var content = popup.getContent();
                console.log("content",content)
                popup.setContent(popupContent).update();
            }
            
        }
    });

    updateLegend(attribute);
}

function createSequenceControls(attributes) {

    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },
  
        onAdd: function () {
            // create the control container div with a particular class name
            var container = document.querySelector("#panel");
  
            //create range input element (slider)
            container.insertAdjacentHTML('beforeend', '<input class="range-slider" type="range">')
  
            //add skip buttons
            container.insertAdjacentHTML('beforeend', '<button class="step" id="reverse" title="Reverse"><img src="img/reverse.png"></button>'); 
            container.insertAdjacentHTML('beforeend', '<button class="step" id="forward" title="Forward"><img src="img/forward.png"></button>'); 
  
            //disable any mouse event listeners for the container
            L.DomEvent.disableClickPropagation(container);
  
  
            return container;
  
        }
    });
  
    map.addControl(new SequenceControl());

    ///////add listeners after adding the control!///////
    // set slider attributes
    document.querySelector(".range-slider").max = 7;
    document.querySelector(".range-slider").min = 0;
    document.querySelector(".range-slider").value = 0;
    document.querySelector(".range-slider").step = 1;

    var steps = document.querySelectorAll('.step');

    steps.forEach(function(step){
        step.addEventListener("click", function(){
            var index = document.querySelector('.range-slider').value;
            //Step 6: increment or decrement depending on button clicked
            if (step.id == 'forward'){
                index++;
                //Step 7: if past the last attribute, wrap around to first attribute
                index = index > 7 ? 0 : index;
            } else if (step.id == 'reverse'){
                index--;
                //Step 7: if past the first attribute, wrap around to last attribute
                index = index < 0 ? 7 : index;
            };

            //Step 8: update slider
            document.querySelector('.range-slider').value = index;

            //Step 9: pass new attribute to update symbols
            updatePropSymbols(attributes[index]);
        })
    })

    //Step 5: input listener for slider
    document.querySelector('.range-slider').addEventListener('input', function(){
        //Step 6: get the new index value
        var index = this.value;

        //Step 9: pass new attribute to update symbols
        updatePropSymbols(attributes[index]);
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
        identify: false,
        propertyName: 'Country Name',
        zoom: 6,
        marker: false,
        moveToLocation: function(latlng, title, map) {
            map.setView(latlng, 6);
        }
    });
    map.addControl(searchControl);
}

//create static legend
function createLegend(attributes) {
    var LegendControl = L.Control.extend({
        options: {
          position: "bottomright",
        },
    
        onAdd: function () {
          // create the control container with a particular class name
          var container = L.DomUtil.create("div", "legend-control-container");
    
          container.innerHTML = '<p class="temporalLegend">Inflation in <span class="year">1985</span></p>';
    
          //Step 1: start attribute legend svg string
          var svg = '<svg id="attribute-legend" width="160px" height="60px">';
    
          //array of circle names to base loop on
          var circles = ["max", "mean", "min"];
    
          //Step 2: loop to add each circle and text to svg string
          for (var i = 0; i < circles.length; i++) {
            //calculate r and cy
            var radius = calcPropRadius(dataStats[circles[i]]);
            console.log(radius);
            var cy = 59 - radius;
            console.log(cy);
    
            //circle string
            svg +=
              '<circle class="legend-circle" id="' +
              circles[i] +
              '" r="' +
              radius +
              '"cy="' +
              cy +
              '" fill="#F47821" fill-opacity="0.8" stroke="#000000" cx="30"/>';
    
            //evenly space out labels
            var textY = i * 20 + 20;
    
            //text string
            svg +=
              '<text id="' +
              circles[i] +
              '-text" x="65" y="' +
              textY +
              '">' +
              Math.round(dataStats[circles[i]] * 100) / 100 +
              " million" +
              "</text>";
          }
    
          //close svg string
          svg += "</svg>";
    
          //add attribute legend svg to container
          container.insertAdjacentHTML('beforeend',svg);
    
          return container;
        },
    });
    
    map.addControl(new LegendControl());
    
}

//create info box for explaining inflation percentages
function createInfoBox() {
    var infoBox = L.control({position: 'topright'});

    infoBox.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'info-box');
        div.innerHTML = '<div style="background-color: white; padding: 8px;">Proportional Symbols Tip: Negative inflation percentages are assigned the value 1. Inflation percentages over 1000 are assigned the value 750.</div>';
        return div;
    };

    infoBox.addTo(map);
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
            //calculate stats
            calcStats(json);
            //call function to create proportional symbols
            createPropSymbols(json, attributes);
            //call function to create sequence controls
            createSequenceControls(attributes);
            //add search control
            addSearchControl(json);
            //create legend
            createLegend(json);
            //create info box
            createInfoBox();
        })
};

document.addEventListener('DOMContentLoaded',createMap)
