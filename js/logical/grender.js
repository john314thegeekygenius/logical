/*
    * Logical - A digital logic simulator for HTML written in Javascript (yuck)
    *
    * Written by: The Wizard
    *
    * Aug. 4, 2023
    *
    * This project is under the GPT-3 license which states:
    *
    * The Generic Free and Open Source Software License is designed to 
    * promote the principles of free and open-source software. 
    * It allows users to use, modify, and distribute the software freely. 
    * Users can create derivative works, but they must provide proper 
    * attribution and retain the original copyright notice and 
    * license in any redistributed copies. 
    * The license also mandates the availability of the source code for 
    * distributed versions or modifications. 
    * It disclaims any warranties and limits the author's liability for damages. 
    * The license contains additional terms, including compliance with laws, 
    * adherence to community guidelines, and indemnification of the author. 
    * It is governed by the laws of a specified jurisdiction and is subject 
    * to updates by the author.
    *
    *
*/

var built_gates = {};

var r_svg = new svg_canvas(100,100); // Make a 100x100 canvas

var CalcBounds = function(svgdat){
    var infiniy = Math.pow(1000,100);
    var minx = infiniy;
    var miny = infiniy;
    var maxx = -infiniy;
    var maxy = -infiniy;

    for(var i = 0; i < svgdat.length; i++){
        var p = svgdat[i];
        if(p[0] === "frect" || p[0] === "rect"){
            var px = p[1];
            var py = p[2];
            var pw = p[3];
            var ph = p[4];
            maxx = Math.max(maxx, px+pw);
            maxy = Math.max(maxy, py+ph);

            minx = Math.min(minx, px);
            miny = Math.min(miny, py);
        }
        if(p[0] === "fcircle" || p[0] === "circle"){
            var px = p[1];
            var py = p[2];
            var pr = p[3];
            maxx = Math.max(maxx, px+pr);
            maxy = Math.max(maxy, py+pr);

            minx = Math.min(minx, px+pr);
            miny = Math.min(miny, py+pr);
        }
        if(p[0] === "line" || p[0] === "wline"){
            var px = p[1];
            var py = p[2];
            var pw = p[3];
            var ph = p[4];
            maxx = Math.max(maxx, px);
            maxy = Math.max(maxy, py);
            maxx = Math.max(maxx, pw);
            maxy = Math.max(maxy, ph);

            minx = Math.min(minx, px);
            miny = Math.min(miny, py);
            minx = Math.min(minx, pw);
            miny = Math.min(miny, ph);
        }
    }
    return { minx:minx, 
            miny:miny,
            maxx:maxx,
             maxy:maxy};

};

var DrawSVG = function(catagory,tag){
    if( gate_json_list === undefined){
        console.error("Gates not loaded?");
        return;
    }

    var ts = 2;
    var tx = 0;
    var ty = 0;
    var tw = r_svg.p_width;
    var th = r_svg.p_height;

    var item = gate_json_list[catagory];
    if(item === undefined){
        console.error("Bad catagory: "+catagory);
        return ; // Bad item???
    }
    item = gate_json_list[catagory][tag];
    if(item === undefined){
        console.error("Bad tag: "+tag);
        return ; // Bad item???
    }
    var svgthing = item["svg"];

    if(svgthing === undefined){
        console.error("No svg data for:"+catagory+":"+tag);
        return;
    }

    // Write to the database??? 
    var bounds = CalcBounds(svgthing);
    gate_json_list[catagory][tag]["box"] = {
        x: bounds.minx,
        y: bounds.miny,
        w: bounds.maxx-bounds.minx,
        h: bounds.maxy-bounds.miny,
    };

    // Center the item
    ts = Math.min(200/bounds.maxx, 200/bounds.maxy);
    tx = (tw/2) - ((bounds.maxx+bounds.minx)*ts*20/tw);
    ty = (th/2) - ((bounds.maxy+bounds.miny)*ts*20/th);
    
    for(var i = 0; i < svgthing.length; i++){
        var p = svgthing[i];
        r_svg.strokeWeight(2);
        r_svg.stroke(g_col_5);
        if(p[0] === "frect" || p[0] === "rect"){
            if(p[3] < 0) { p[1] += p[3]; p[3] = -p[3]; }
            if(p[4] < 0) { p[2] += p[4]; p[4] = -p[4]; }
            var px = (p[1]*ts/2.5)+tx;
            var py = (p[2]*ts/2.5)+ty;
            var pw = p[3]*ts*40;
            var ph = p[4]*ts*40;
            if(p[0]==="frect"){
                r_svg.fill(g_col_3);
            }else{
                r_svg.noFill();
            }
            r_svg.rect(px/tw, py/th, pw/tw, ph/th);
        }
        if(p[0] === "fcircle" || p[0] === "circle"){
            var px = (p[1]*ts/2.5)+tx;
            var py = (p[2]*ts/2.5)+ty;
            var pr = p[3]*ts/2.5;
            if(p[0]==="fcircle"){
                r_svg.fill(g_col_3);
            }else{
                r_svg.noFill();
            }
            r_svg.circle(px/tw, py/th, pr);
        }
        if(p[0] === "line" || p[0] === "wline"){
            var px = (p[1]*ts/2.5)+tx;
            var py = (p[2]*ts/2.5)+ty;
            var pw = (p[3]*ts/2.5)+tx;
            var ph = (p[4]*ts/2.5)+ty;
            if(p[0] === "wline"){
                r_svg.strokeWeight(4);
            }
            r_svg.line(px/tw, py/th, pw/tw, ph/th);
        }
    }
};

var dummy_item = "<rect x=\"0\" y=\"0\" width=\"50\" height=\"50\" fill=\"red\"></rect>\n<rect x=\"50\" y=\"0\" width=\"50\" height=\"50\" fill=\"blue\"></rect>\n<rect x=\"50\" y=\"50\" width=\"50\" height=\"50\" fill=\"red\"></rect>\n \<rect x=\"0\" y=\"50\" width=\"50\" height=\"50\" fill=\"blue\"></rect>";

var loaded_item_count = 1;
var current_catagory = "";

function buildGates(){
    // For each catagory:
    // -- Add it to the list
    //    -- For all items 
    //       -- Add to the item list for that catagory
    //          -- Generate the SVG data and store it 

    console.log("building gate icons");
    var gate_list = "";

    for (var key of Object.keys(gate_json_list)) {
        // Skip junk keys 
        if(typeof gate_json_list[key] !== 'object') continue;

        if(current_catagory === ""){
            current_catagory = key;
        }
        // Add a catagory
        built_gates[key] = {};

        // Add to the list of catagories 
        var catstr = "cat_"+key;
        var catdisc = gate_json_list[key]["name"];
        gate_list += "<li class=\"catagory-item\" id=\""+catstr+"\" onclick=\"CatChange(this)\">"+catdisc+"</li>\n";
        for (var i_key of Object.keys(gate_json_list[key])) {
            if(i_key === "name") { continue; } // Skip the name
            r_svg.clear();
            r_svg.noclip();
            DrawSVG(key,i_key);
            built_gates[key][i_key] = {cat:key, name:i_key, data:r_svg.render()};
        }
    }
    // Replace the list with the full list of things 
    var catl_element = document.getElementById("cat-list");
    catl_element.innerHTML = gate_list;
};

function updateItems(){
    var svg_element  = document.getElementById("svg-listbox");
    var svg_txt = "";
    for (var i_key of Object.keys(built_gates[current_catagory])) {
        var disc, cat, key, item;
        if(built_gates[current_catagory][i_key]===undefined){
            console.error("invalid gate name: "+name);
            disc = "unknown gate";
            item = dummy_item;
            key = "null";
            cat = "null";
        }else{
            disc = built_gates[current_catagory][i_key].name;
            cat = built_gates[current_catagory][i_key].cat;
            key = built_gates[current_catagory][i_key].name;
            item = built_gates[current_catagory][i_key].data;
        }
        svg_txt += "<svg class=\"svg-item\" data-catagory=\""+cat+"\" data-key=\""+key+"\" title=\""+disc+"\" onclick=\"GrabItem(this)\">\n<svg viewBox=\"0 0 100 100\">\n";
        svg_txt += item;
        svg_txt += "</svg>\n</svg>";
    }
    svg_element.innerHTML = svg_txt;
};

function getItemHTML(cat,key){
    var gc = built_gates[cat];
    if(gc === undefined){
        console.error("invalid catagory "+cat);
        return "";
    }
    var gk = gc[key];
    if(gk === undefined){
        console.error("invalid gate key "+key);
        return "";
    }
    var svg_txt = "";
    var disc, cat, key, item;
    disc = gk.name;
    cat = gk.cat;
    key = gk.name;
    item = gk.data;
    svg_txt += "<svg class=\"svg-item\" data-catagory=\""+cat+"\" data-key=\""+key+"\" title=\""+disc+"\" onclick=\"GrabItem(this)\">\n<svg viewBox=\"0 0 100 100\">\n";
    svg_txt += item;
    svg_txt += "</svg>\n</svg>";
    return svg_txt;
};


