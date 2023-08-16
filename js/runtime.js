//
// Runs the app script here 
//

// Configure RequireJS
require.config({
    paths: {
        text: 'js/text' // Path to the RequireJS text plugin
    }
});


var gate_json_list;

// Make a new logical framework object 
var logical = new Logical();



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

// Page stuff 
function SetTab(id){
    if(id < 1 || id > logical.pages.length) return ; // ????
    // Find old element 
    var element = document.getElementById("page_"+(logical.cur_page+1));
    if(element !== null){
        element.setAttribute("class", "tab-button"); 
    }
    logical.cur_page = id-1;
    // Get new element
    element = document.getElementById("page_"+id);
    element.setAttribute("class", "tab-button-selected"); 
    console.log("Switched to page "+id);
};

function AddTab(){
    // Get the tabs element 
    var element = document.getElementById("tabs-list");
    var buttonstr = "";
    logical.pages.push(new Page());
    for(var id = 1; id <= logical.pages.length; id++){
        buttonstr +="<button id=\"page_"+id+"\" class=\"tab-button\" onclick=\"SetTab("+id+")\">Page "+id+"</button>\n";
    }
    // Add the new tab button 
    buttonstr +="<button id=\"new-tab\" class=\"tab-button\" onclick=\"AddTab()\">+</button>\n";
    element.innerHTML = buttonstr;
    SetTab(logical.pages.length);
};

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
    // Add a new page to get started 
    for(var i = 0; i < 10; i++){
        AddTab();
    }
    SetTab(1);
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


