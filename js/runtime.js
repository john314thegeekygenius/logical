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
            if(gate_json_list["description"] !== undefined){
                delete gate_json_list["description"];
            }
            if(gate_json_list["KA-Link"] !== undefined){
                delete gate_json_list["KA-Link"];
            }
        } catch (error) {
            console.error('Error parsing JSON:', error);
        }
    });
};

// Search stuff 
var search_element = document.getElementById("search_feild");
search_element.addEventListener('input', SearchQuery, false);

function SearchQuery(e){
    var search_txt = search_element.value.toLowerCase().split(' ');
    var j_matches = [];
    if(search_txt[0].length===0){
        updateItems();
        return;
    }
    // Find all matches for all gates 
    for (var cat in gate_json_list) {
        for (var key in gate_json_list[cat]) {
            var gateobj = gate_json_list[cat][key];
            var json_str = gateobj.name;
            // Make sure we remembered to add a name to it!
            if(json_str === undefined){
                continue;
            }
            // Make it matchable 
            json_str = json_str.toLowerCase();
            for(var i = 0; i < search_txt.length; i++){
                var stxt = search_txt[i];
                if(stxt.length){
                    if(json_str.includes(stxt) || key.includes(stxt)){
                        j_matches.push([cat,key]);
                    }
                }
            }
        }
    }
    // Clean up the list if there are duplicates
    var uniqueMatches = [];
    $.each(j_matches, function(i, el){
        if($.inArray(el, uniqueMatches) === -1) uniqueMatches.push(el);
    });

    var svg_listbox= document.getElementById("svg-listbox");
    var new_list = "";
    // For all matches, replace the items_list element things
    for(var i = 0; i < uniqueMatches.length; i++){
        new_list += getItemHTML(uniqueMatches[i][0],uniqueMatches[i][1]);
    }
    svg_listbox.innerHTML = new_list;
};

// File Stuff 

var confirmation = null;
var conf_element = document.getElementById("dialog-text");
var conf_input = "";

function Confirm(txt, y_txt, n_txt, title="Confirm"){
    // Make a dialog that gets the users input on if they want to do an action
    var dilog = {
      resizable: false,
      height: "auto",
      width: 400,
      modal: true,
        buttons:{}
    };
    dilog.buttons[y_txt] = function() {
        $( this ).dialog( "close" );
        var te = document.getElementById("dialog-confirm");
        if(te){ te.innerHTML = ""; }
        if(confirmation !== null){
            confirmation[0]();
        }
    };
    dilog.buttons[n_txt] = function() {
        $( this ).dialog( "close" );
        var te = document.getElementById("dialog-confirm");
        if(te){ te.innerHTML = ""; }
        if(confirmation !== null){
            confirmation[1]();
        }

    }
    $( function() {
        $( "#dialog-confirm" ).dialog(dilog);
    });
    var te = document.getElementById("dialog-confirm");
    if(te){
        te.setAttribute("title",title);
        te.innerHTML = "<p id=\"dialog-text\" class=\"dialog\">"+txt+"</p>";
    }
    var ce = document.getElementById("ui-id-1");
    if(ce){
        ce.textContent = title;
    }
};

function Alert(txt, ok_txt="Ok"){
    // Make a dialog that gets the users input on if they want to do an action
    var dilog = {
      resizable: false,
      height: "auto",
      width: 400,
      modal: true,
        buttons:{}
    };
    dilog.buttons[ok_txt] = function() {
        $( this ).dialog( "close" );
        var te = document.getElementById("dialog-confirm");
        if(te){ te.innerHTML = ""; }
    };
    $( function() {
        $( "#dialog-confirm" ).dialog(dilog);
    });
    var te = document.getElementById("dialog-confirm");
    if(te){
        te.innerHTML = "<p id=\"dialog-text\" class=\"dialog\">"+txt+"</p>";
        te.setAttribute("title","Alert");
    }
    var ce = document.getElementById("ui-id-1");
    if(ce){
        ce.textContent = "Alert!";
    }
};

function Input(txt, y_txt, n_txt, title="Input"){
    // Make a dialog that gets the users input on if they want to do an action
    var dilog = {
      resizable: false,
      height: "auto",
      width: 400,
      modal: true,
        buttons:{}
    };
    dilog.buttons[y_txt] = function() {
        if(confirmation !== null){
            var ie = document.getElementById("conf_txt");
            conf_input = ie.value;
            confirmation[0]();
        }
        $( this ).dialog( "close" );
        var te = document.getElementById("dialog-confirm");
        if(te){ te.innerHTML = ""; }
    };
    dilog.buttons[n_txt] = function() {
        $( this ).dialog( "close" );
        var te = document.getElementById("dialog-confirm");
        if(te){ te.innerHTML = ""; }
        if(confirmation !== null){
            confirmation[1]();
        }

    }
    $( function() {
        $( "#dialog-confirm" ).dialog(dilog);
    });
    var te = document.getElementById("dialog-confirm");
    if(te){
        te.setAttribute("title",title);
        te.innerHTML = "<p id=\"dialog-text\" class=\"dialog\">"+txt+"</p>";
        te.innerHTML += "<input type=\"text\" id=\"conf_txt\" class=\"dialog-in\" name=\"input\"></input>";
    }
    var ce = document.getElementById("ui-id-1");
    if(ce){
        ce.textContent = title;
    }
};


function subNewCircuit(){
    console.log("Making new project");
    logical.NukeProject();
    // Add a new pages to get started 
    for(var i = 0; i < 10; i++){
        AddTab();
    }
    SetTab(1);
    UpdateTitle();
};

function NewCircuit(){
    if(logical.modified){
        confirmation = [
            subNewCircuit,
            function(){}
        ];
        Confirm("Are you sure you want to start a new project? (Current project is not saved!)","Overwrite","No");
    }else{
        subNewCircuit();
    }
};

// Open a dialog function 
function openFileDialog(accept, multy = false, callback) { 
    var inputElement = document.createElement("input");
    inputElement.type = "file";
    inputElement.accept = accept; // Note Edge does not support this attribute
    if (multy) {
        inputElement.multiple = multy;
    }
    if (typeof callback === "function") {
         inputElement.addEventListener("change", callback);
    }
    inputElement.dispatchEvent(new MouseEvent("click")); 
}

function SaveFile(fname, content){
    var bb = new Blob([content], { type: "application/json" });
    var a = document.createElement('a');
    a.download = fname;
    a.href = window.URL.createObjectURL(bb);
    a.click();
}

function subLoadCircuit(e){
    [...this.files].forEach(file => {
        var fr=new FileReader();
        fr.onload=function(){
            var jstr;
            try {
                jstr = JSON.parse(fr.result);
            } catch (e) {
                console.error("Invalid JSON file:"+file.name);
                Alert("Invalid Project File!");
                return;
            }
            logical.LoadPrj(jstr);
            // Fix the tab stuff 
            FixTabs(logical.cur_page+1);
            // Update the title 
            UpdateTitle();
        }
        fr.readAsText(file);
    });
};

async function LoadCircuit(){
    console.log("Loading Circuit...");
    if(logical.modified){
        confirmation = [
            function(){
                openFileDialog(".json,text/plain", false, subLoadCircuit);
            },
            function(){}
        ];
        Confirm("Are you sure you want to load a project? (Current project is not saved!)","Overwrite","No");
    }else{
        openFileDialog(".json,text/plain", false, subLoadCircuit);
    }
};

function SaveCircuit(){
    confirmation = [
        function(){
            SaveFile(conf_input, logical.SavePrj(conf_input));
            UpdateTitle();
        },
        function(){}
    ];
    Input("Enter Project Name", "Save", "Cancel", "Save");
};

function PrintCircuit(e){
    var doc = new jsPDF();
    var specialElementHandlers = {
        '#editor': function (element, renderer) {
            return true;
        }
    };


    doc.fromHTML($('#svg-ctx').html(), 15, 15, {
        'width': 170,
        'elementHandlers': specialElementHandlers
    });
    var svge = document.getElementById("svg-ctx");
    // Do somthing with the svg stuff, idk
    //doc.addSVG(svge.innerHTML, 20, 20, doc.internal.pageSize.width - 20*2)
    doc.save('logical-printout.pdf');

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

function FixTabs(id){
    if(id < 1 || id > logical.pages.length) return ; // ????
    // Find old element 
    for(var i = 0; i < logical.pages.length; i++){
        var element = document.getElementById("page_"+i);
        if(element !== null){
            element.setAttribute("class", "tab-button"); 
        }
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

function UpdateTitle(){
    var e = document.getElementById("prj_title");
    e.textContent = logical.name;
    if(logical.modified){
        e.textContent += "*";
    }
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
    // Update the title 
    UpdateTitle();
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
    var oldmod = logical.modified;
    logical.run()
    if(logical.modified !== oldmod){
        UpdateTitle();
    }
}, 1000/60);

window.onload = initFunction;


