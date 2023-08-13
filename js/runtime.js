//
// Runs the app script here 
//

var gate_json_list;

// Configure RequireJS
require.config({
  paths: {
    text: 'js/text' // Path to the RequireJS text plugin
  }
});

// Function to load a JSON file
function LoadGatesJson() {
    require(['text!' + "data/items.json"], function(jsonText) {
        try {
            var jsonData = JSON.parse(jsonText);
            // Assign the loaded JSON data
            gate_json_list = jsonData;

        } catch (error) {
            console.error('Error parsing JSON:', error);
        }
    });
};

// File Stuff 
function NewCircuit(){

};

function LoadCircuit(){
    // creating input on-the-fly
    var input = $(document.createElement("input"));
    input.attr("type", "file");
    input.trigger("click"); // opening dialog
    console.log(input);
    // Read the file 
   fetch("file:///home/jonathan/projects/logical/index.html")
  .then(response => response.text())
  .then(response => {
      console.log(response);
  })
  .catch((e) => {
      console.error(e)
      alert("error reading json -"+e);
  });


};

function SaveCircuit(){

};

// Make a new logical framework object 
var logical = new Logical();

function CatChange(e){
    var id = e.id;
    current_catagory = id.substring(4);
    updateItems();
};

function GrabItem(e){
    var cat = e.attributes["data-catagory"].nodeValue;
    var key = e.attributes["data-key"].nodeValue;
    logical.holdItem(cat,key);
};

function initFunction(){
    // Get the colors 
    loadColors();
    // Load the gates 
    LoadGatesJson();
};

var loaded_gates = false;
setInterval(function loaderTimed(){
    if( gate_json_list === undefined || loaded_gates){
        return;
    }
    loaded_gates = true;
    // Load the gates and stuff 
    buildGates();
    // Update the items 
    updateItems();
    // Update the scene 
    logical.scene_changed = true;
}, 1000);

// Setup a loop for the simulator
setInterval(function myFunction(){
    logical.run()
}, 1000/60);

window.onload = initFunction;


