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

function Logical() {
    this.svg = new svg_canvas('svg-ctx');
    this.NukeProject();
};

Logical.prototype.NukeProject = function(){
    // Make a new project 
    this.name = "Untitled";
    this.holding = [];
    this.scene_changed = true;
    this.modified = false;
    this.pages = [];
    this.cur_page = 0;
    this.select = null;
    this.user_wire = null;
    this.hov_wire = null;
    this.c_wire = null;
    this.dragging = false;
    // Page copies 
    this.camera = {};
    this.selected = [];
    this.grabbed = [];

};

Logical.prototype.handlePage = function(){
    this.camera = this.pages[this.cur_page].camera;
    this.selected = this.pages[this.cur_page].selected;
};

Logical.prototype.LoadPrj = function(obj){
    function deepCopy(target, source) {
        for (const prop in source) {
            if (source.hasOwnProperty(prop)) {
                if (typeof source[prop] === 'object' && source[prop] !== null && !isFunction(source[prop])) {
                    if (!target[prop]) {
                        target[prop] = {};
                    }
                    deepCopy(target[prop], source[prop]);
                } else if (!isFunction(source[prop]) && !isFunction(target[prop])) {
                    target[prop] = source[prop];
                }
            }
        }
    }

    function isFunction(obj) {
        return typeof obj === 'function';
    }
    deepCopy(this, obj);
};

Logical.prototype.SavePrj = function(name){
    this.name = name;
    this.modified = false;
    var objstr = JSON.stringify(this, null, 4);
    return objstr;
};

Logical.prototype.holdItem = function(key1, key2){
    var item = this.getItem(key1, key2 );
    if(item == undefined){
        console.error("bad item "+key1+":"+key2);
    }
    var svgsize = item["box"];
    if(svgsize === undefined){
        console.error("bad box info for "+key1+":"+key2);
        svgsize = {x:0,y:0,w:0,h:0};
    }
    this.holding = [key1, key2, svgsize, 0];
};

Logical.prototype.MouseOver = function(x,y,w,h){
    var mx = g_mouse.x;
    var my = g_mouse.y;
    if(mx >= x && my >= y && mx < x+w && my < y+h){
        return true;
    }
    return false;
};

Logical.prototype.placerHandler = function(){
    var gs = 400*this.camera.zoom;

    if(this.holding.length){
        // We need to place a gate down maybe 
        if(g_mouse.clicked){
            if(g_mouse.button === MB_RIGHT ){
                // Rotate the hovered item 
                this.holding[3] = (this.holding[3]+1)%4;
                //this.holding = [];
                //g_mouse.button = -1;
            }else if(g_mouse.button === MB_LEFT){
                var svgsize = this.holding[2];
                var mx = g_mouse.x - (svgsize.x + (svgsize.w/2))*25*this.camera.zoom;
                var my = g_mouse.y - (svgsize.y + (svgsize.h/2))*25*this.camera.zoom;
                var mx = Math.floor(mx/gs);
                var my = Math.floor(my/gs);
                var gx = (mx*gs)-this.camera.x+(this.camera.x%gs);
                var gy =  (my*gs)-this.camera.y+(this.camera.y%gs);
                gx /= gs;
                gy /= gs;
                var thing = this.getItem(this.holding[0], this.holding[1]);
                this.pages[this.cur_page].circuit.addGate({
                    inlen:thing.inputs.length/2, // Divide by two because these are coordinates 
                    outlen:thing.outputs.length/2,
                    x: Math.floor(gx),
                    y: Math.floor(gy),
                    cat:this.holding[0],
                    key:this.holding[1],
                    box:this.holding[2],
                    rot:this.holding[3],
                    selected:false,
                    hover:false
                });
                this.modified = true;
            }
            g_mouse.clicked = false;
        }
        if(g_keys[27].released){
            this.holding = [];
            this.scene_changed = true;
        }
        return true;
    }
    return false;
};

Logical.prototype.hIO_Point = function(io,e, g){
    var page = this.pages[this.cur_page];
    // If we are already holding a wire, connect it 
    var w = page.circuit.addWire({}); // Spawn an empty wire 
    console.log(w);
    console.log(this.c_wire);
    if(this.c_wire.io === 'o'){
        if(g.addInput(w.name, e/2)){ // Link the wire instead 
            w.Link(io[e/2].wire);
        }
        var g2 = page.circuit.gates[this.c_wire.gate];
        g2.addOutput(w.name,this.c_wire.id);
    }
    else if(this.c_wire.io === 'i'){
        if(g.addOutput(w.name, e/2)){ // Link the wire instead 
            w.Link(io[e/2].wire);
        }
        var g2 = page.circuit.gates[this.c_wire.gate];
        g2.addInput(w.name,this.c_wire.id);
    }

    this.c_wire = null;
};

Logical.prototype.mouseGateInteract= function(){
    var gs = 400*this.camera.zoom;
    var page = this.pages[this.cur_page];
    var skipdrag = false;

    // We don't want a continual hovering of an io point
    this.hov_wire = null;

    if(this.dragging === false){
        // Select objects 
        for(var i = page.circuit.gates.length-1; i >=0 ; i--){
            var g = page.circuit.gates[i];
            var px = g.x*gs + this.camera.x;
            var py = g.y*gs + this.camera.y;
            var pw = (g.box.w)*this.camera.zoom*40;
            var ph = (g.box.h)*this.camera.zoom*40;
            var pa = (g.box.x)*this.camera.zoom*40;
            var pb = (g.box.y)*this.camera.zoom*40;
            g.hover = false;
            if(this.MouseOver(px+pa,py+pb,pw,ph)){
                g.hover = true;

                if(g_mouse.clicked){
                    if(g_mouse.button === MB_RIGHT){
                        // Rotate the hovered item 
                        g.rot = (g.rot+1)%4;
                        this.modified = true;
                    }
                }
            }
            var gitem = this.getItem(g.cat, g.key);
            for(var e = 0; e < gitem.inputs.length; e+=2){
                var ts = this.camera.zoom*40;
                var iox = gitem.inputs[e]*ts;
                var ioy = gitem.inputs[e+1]*ts;
                var ios = ts*8;
                if(ios < 5) ios = 5;
                iox += (g.x*gs)+this.camera.x;
                ioy += (g.y*gs)+this.camera.y;
                iox -= ios/2;
                ioy -= ios/2;
                // If the mouse is over the gate, see if we are over any IO ports 
                if(this.MouseOver(iox,ioy,ios,ios)){
                    // Wire points stuff 
                    this.hov_wire = {gate:i, io:'i', id:e/2};
                    if(g_mouse.pressed){
                        // Skip the dragging motion if we are over an io point 
                        skipdrag = true;
                    }
                    if(g_mouse.clicked){
                        if(this.c_wire !== null){
                            this.hIO_Point(g.inputs, e, g);
                        }else{
                            // We clicked to make a wire, so store it
                            this.c_wire = {
                                gate:i, 
                                io:'i', 
                                id:e/2,
                                x:gitem.inputs[e]+g.x,
                                y:gitem.inputs[e+1]+g.y
                            };
                            console.log(gitem.inputs);
                            console.log(this.c_wire);
                        }
                    }
                }
            }
            for(var e = 0; e < gitem.outputs.length; e+=2){
                var ts = this.camera.zoom*40;
                var iox = gitem.outputs[e]*ts;
                var ioy = gitem.outputs[e+1]*ts;
                var ios = ts*8;
                if(ios < 5) ios = 5;
                iox += (g.x*gs)+this.camera.x;
                ioy += (g.y*gs)+this.camera.y;
                iox -= ios/2;
                ioy -= ios/2;
                // If the mouse is over the gate, see if we are over any IO ports 
                if(this.MouseOver(iox,ioy,ios,ios)){
                    // Wire points stuff 
                    this.hov_wire = {gate:i, io:'o', id:e/2};
                    if(g_mouse.pressed){
                        // Skip the dragging motion if we are over an io point 
                        skipdrag = true;
                    }
                    if(g_mouse.clicked){
                        // If we are already holding a wire, connect it 
                        if(this.c_wire !== null){
                            this.hIO_Point(g.outputs, e, g);
                        }else{
                            // We clicked to make a wire, so store it
                            this.c_wire = {
                                gate:i, 
                                io:'o', 
                                id:e/2,
                                x:gitem.outputs[e]+(g.x*10),
                                y:gitem.outputs[e+1]+(g.y*10)
                            };
                        }
                        console.log(gitem.outputs);
                        console.log(this.c_wire);
                    }
                }
            }
        }
    }
    // TODO:
    // Make sure if we are hovering an IO point, not to select the gate 
    // if the mouse is pressed
    if(g_mouse.pressed){
        if(this.grabbed.length===0 && this.select === null){
            // Move Objects 
            for(var i = 0; i < page.circuit.gates.length; i++){
                var g = page.circuit.gates[i];
                var gx = (g_mouse.x)-this.camera.x;
                var gy = (g_mouse.y)-this.camera.y;
                if(g.hover){
                    this.grabbed = [(gx), (gy)]
                    if(g_keys[17].pressed === false && g.selected == false){
                        this.pages[this.cur_page].circuit.clearSelections();
                    }
                    // Select that one item 
                    g.selected = true;
                    skipdrag = true;
                    this.modified = true;
                    break;
                }
            }
        }else{
            skipdrag = true;
        }
        if(g_mouse.button === MB_LEFT){
            if(this.grabbed.length===0){
                if(g_keys[16].pressed === true){
                    // Select tool 
                    this.select = {
                        sx: g_mouse.cx,
                        sy: g_mouse.cy,
                        sw: g_mouse.x-g_mouse.cx,
                        sh: g_mouse.y-g_mouse.cy };
                    skipdrag = true;
                }

            }
            if(skipdrag===false){
                this.pages[this.cur_page].circuit.clearSelections();
                // Drag controls
                this.camera.x = (g_mouse.x - g_mouse.cx) + this.camera.cx;
                this.camera.y = (g_mouse.y - g_mouse.cy) + this.camera.cy;
                this.dragging = true;
                this.modified = true;
            }
        }
        this.scene_changed = true; // Useless?
    }else{
        this.grabbed = [];
        this.dragging = false; 
        // Select any objects 
        if(this.select !== null){
            // Get the area 
            var sx = this.select.sx;
            var sy = this.select.sy;
            var sw = this.select.sw;
            var sh = this.select.sh;
            // Keep the values absolute
            if(sw < 0){
                sx += sw;
                sw = -sw;
            }
            if(sh < 0){
                sy += sh;
                sh = -sh;
            }
            var wx = ((sx - this.camera.x));
            var wy = ((sy - this.camera.y));
            var ww = (sw);
            var wh = (sh);
            // Find the objects in selected area 
            for(var i = 0; i < page.circuit.gates.length; i++){
                var g = page.circuit.gates[i];
                var hx = g.x*gs;
                var hy = g.y*gs;
                var hw = g.box.w;
                var hh = g.box.h;
                // Reset the gate (we don't want to accumulate unless ctrl is pressed too?)
                if(g_keys[17].pressed===false){
                    g.selected = false;
                    this.modified = true;
                }
                if(hx+gs >= wx && hy+gs >= wy){
                    if(wx+ww >= hx+hw-gs && wy+wh >= hy+hh-gs){
                        g.selected = true;
                        this.modified = true;
                    }
                }
            }

            this.select = null;
        }
    }

    if(this.grabbed.length){
        var px = (this.grabbed[0]) + (this.camera.x);
        var py = (this.grabbed[1]) + (this.camera.y);
        var mx = g_mouse.x;
        var my = g_mouse.y;
        var gx = Math.floor((px-mx)/gs);
        var gy = Math.floor((py-my)/gs);
        for(var i = 0; i < page.circuit.gates.length; i++){
            var g = page.circuit.gates[i];
            if(g.selected){
                g.x -= gx;
                g.y -= gy;
            }
        }
        this.grabbed[0] -= gx*gs;
        this.grabbed[1] -= gy*gs;
    }

};

Logical.prototype.handleInput = function(){
    var page = this.pages[this.cur_page];

    // Zoom in 
    var cx = g_mouse.x-this.camera.x;
    var cy = g_mouse.y-this.camera.y;
    if(this.camera.zoom < 100){
        if(g_mouse.wheel < 0){
            // Zoom in at the mouse (centered)
            this.camera.zoom *= 2;
            this.camera.x -= cx;
            this.camera.y -= cy;
            this.scene_changed = true;
            this.modified = true;
        }
    }
    // Zoom out 
    if(this.camera.zoom > 1/128){
        if(g_mouse.wheel > 0){
            this.camera.zoom /= 2;
            this.camera.x += cx/2;
            this.camera.y += cy/2;
            this.scene_changed = true;
            this.modified = true;
        }
    }
    if(this.camera.zoom < 1/128){
        this.camera.zoom = 1/128;
    }
    if(this.camera.zoom > 100){
        this.camera.zoom = 100;
    }
    var gs = 400*this.camera.zoom;

    if(this.placerHandler() === false){

        if(g_keys[27].released){
            // Remove all selected elements 
            this.pages[this.cur_page].circuit.clearSelections();
            this.grabbed = [];
            this.scene_changed = true;
            this.modified = true;
            this.c_wire = null;
        }
        if(g_mouse.clicked || !g_mouse.pressed){
            this.camera.cx = this.camera.x;
            this.camera.cy = this.camera.y;
        }

        this.mouseGateInteract();

        if(g_keys[32].released === true){
            // Go to the center of circuit components 
            // Find the objects locations 
            var minx = 0, miny = 0;
            var maxx = 0, maxy = 0;
            for(var i = 0; i < page.circuit.gates.length; i++){
                var g = page.circuit.gates[i];
                var gx = g.x*gs;
                var gy = g.y*gs;
                minx = Math.min(minx, gx);
                maxx = Math.max(maxx, gx+(g.box.w*100*this.camera.zoom));
                miny = Math.min(miny, gy);
                maxy = Math.max(maxy, gy+(g.box.h*100*this.camera.zoom));
            }
            // Get the center 
            var cx = (maxx-minx)/2;
            var cy = (maxy-miny)/2;
            var winx = this.svg.p_width/2;
            var winy = this.svg.p_height/2;
            page.scrollCamera(winx-cx,winy-cy);
            this.modified = true;
        }
        // Delete gates 
        if(g_keys[46].released === true){
            var rmi = [];
            // Find the objects in selected area 
            for(var i = 0; i < page.circuit.gates.length; i++){
                var g = page.circuit.gates[i];
                if(g.selected === true){
                    // Delete that gate 
                    rmi.push(i-rmi.length);
                }
            }
            for(var i = 0; i < rmi.length; i++){
                this.pages[this.cur_page].circuit.deleteGate(rmi[i]);
            }
            this.modified = true;
        }
    }

    // Movement 
    if(g_keys[38].pressed){
        this.camera.y += 10;
    }
    if(g_keys[40].pressed){
        this.camera.y -= 10;
    }
    if(g_keys[37].pressed){
        this.camera.x += 10;
    }
    if(g_keys[39].pressed){
        this.camera.x -= 10;
    }

    // Clipboard 
    if(g_keys[17].pressed){
        if(g_keys[67].released){
            // Copy the selected items 
        }
        if(g_keys[88].released){
            // Cut the selected items
        }
        if(g_keys[86].released){
            // Paste the stored items 
        }
        if(g_keys[90].released){
            // Undo changes????
        }
        if(g_keys[89].released){
            // Redo changes???
        }
    }

    page.updateCamera();

    g_mouse.released = false;
    g_mouse.clicked = false;
    clearKeys();
}

Logical.prototype.getItem = function(catagory, tag){
    var item = gate_json_list[catagory];
    if(item === undefined){
        console.error("Bad catagory: "+catagory);
        return undefined; // Bad item???
    }
    item = gate_json_list[catagory][tag];
    if(item === undefined){
        console.error("Bad tag: "+tag);
        return undefined; // Bad item???
    }
    return item;
};

Logical.prototype.drawSVG = function(catagory,tag,x, y, rot,data){
    if( gate_json_list === undefined){
        console.error("Gates not loaded?");
        return;
    }
    var ts = (this.camera.zoom*100);
    var tx = (x + this.camera.x);
    var ty = (y + this.camera.y);

    var item = this.getItem(catagory, tag);
    if(item === undefined) return; // Bad item 
    var svgthing = item["svg"];

    for(var i = 0; i < svgthing.length; i++){
        var p = svgthing[i];
        var sw = 12*this.camera.zoom;
        if(sw < 1){ sw = 1; }
        var ww = item.box.w*ts/2.5;
        var wh = item.box.h*ts/2.5;
        var px,py,pw,ph,t;
        this.svg.strokeWeight(sw);
        this.svg.stroke(g_col_5);
        if(p[0] === "frect" || p[0] === "rect"){
            px = (p[1]*ts/2.5);
            py = (p[2]*ts/2.5);
            pw = p[3]*ts*40;
            ph = p[4]*ts*40;
            if(rot === 1){
                t = pw; pw = ph; ph = t;
                px += pw/100;
                px = ww-px;
            }else if(rot === 2){
                px = ww-px;
                py = wh-py;
            }else if(rot === 3){
                t = py; py = px; px = t;
                t = pw; pw = ph; ph = t;
                py = py-ph;
            }
            px += tx; py += ty;
            if(p[0]==="frect"){
                this.svg.fill(g_col_3);
                if(tag === "led"){
                    if(data === 1){
                        this.svg.fill(255,0,0);
                    }else{
                        this.svg.fill(0,0,0);
                    }
                }
            }else{
                this.svg.noFill();
            }
            this.svg.rect(px/this.svg.p_width, py/this.svg.p_height, pw/this.svg.p_width, ph/this.svg.p_height);
        }
        if(p[0] === "fcircle" || p[0] === "circle"){
            var px = (p[1]*ts/2.5)+tx;
            var py = (p[2]*ts/2.5)+ty;
            var pr = p[3]*ts/2.5;
            if(p[0]==="fcircle"){
                this.svg.fill(g_col_3);
            }else{
                this.svg.noFill();
            }
            this.svg.circle(px/this.svg.p_width, py/this.svg.p_height, pr);
        }
        if(p[0] === "line" || p[0] === "wline"){
            px = (p[1]*ts/2.5);
            py = (p[2]*ts/2.5);
            pw = (p[3]*ts/2.5);
            ph = (p[4]*ts/2.5);
            if(rot === 1){
                t = py; py = px; px = t;
                t = pw; pw = ph; ph = t;
                px = ww-px;
                pw = ww-pw;
            }else if(rot === 2){
                px = ww-px;
                py = wh-py;
                pw = ww-pw;
                ph = wh-ph;
            }else if(rot === 3){
                t = py; py = px; px = t;
                t = pw; pw = ph; ph = t;
                py = wh-py;
                ph = wh-ph;
            }

            px += tx; py += ty;
            pw += tx; ph += ty;
            if(p[0] === "wline"){
                this.svg.strokeWeight(sw*2);
            }
            this.svg.line(px/this.svg.p_width, py/this.svg.p_height, pw/this.svg.p_width, ph/this.svg.p_height);
        }
    }
};

Logical.prototype.draw = function(){
    // Draw a grid 
    var gs = 800*this.camera.zoom;
    var gw = this.svg.p_width/gs;
    var gh = this.svg.p_height/gs;
    
    this.svg.stroke(g_col_1);
    this.svg.strokeWeight(1);
    if(this.camera.zoom >= 1/64){
        for(var i = -1; i < gw+1; i++){
            var gx = (i*gs)+(this.camera.x%gs);
            this.svg.line(gx/this.svg.p_width, 0.0, gx/this.svg.p_width, 1.0);
        }
        for(var i = -1; i < gh+1; i++){
            var gy = (i*gs)+(this.camera.y%gs);
            this.svg.line(0.0, gy/this.svg.p_height, 1.0, gy/this.svg.p_height);
        }
    }
    // Rescale into the correct cooords 
    var gs = 400*this.camera.zoom;
    var ts = this.camera.zoom*40;

    // Draw any gates
    var page = this.pages[this.cur_page];
    for(var i = 0; i < page.circuit.gates.length; i++){
        var g = page.circuit.gates[i];
        if(g.selected){
            this.svg.strokeDash(true);
        }
        this.drawSVG(g.cat,g.key,g.x*gs,g.y*gs,g.rot,g.state);
        this.svg.strokeDash(false);
        if(g.selected === true || g.hover){
            var px = g.x*gs 
            var py = g.y*gs
            var pw = g.box.w*5/gw;
            var ph = g.box.h*5/gh;
            var pa = (g.box.x)*this.camera.zoom*40;
            var pb = (g.box.y)*this.camera.zoom*40;
            var t;
            /*
    var ts = (this.camera.zoom*100);
        var ww = item.box.w*ts/2.5;
        var wh = item.box.h*ts/2.5;*/
            if(g.rot){
                t = pw; pw = ph; ph = t;
                pw *= gh/gw
                ph *= gw/gh;
            }
            px += pa + this.camera.x;
            py += pb + this.camera.y;

            this.svg.noStroke();
            if(g.hover){
                this.svg.setAlpha(200);
            }else{
                this.svg.setAlpha(128);
            }
            this.svg.fill(g_col_4);
            this.svg.rect(px/this.svg.p_width,py/this.svg.p_height,pw,ph);
            this.svg.setAlpha(255);
        }
        // Draw the IO 
        var gitem = this.getItem(g.cat, g.key);
        for(var e = 0; e < gitem.inputs.length; e+=2){
            var iox = gitem.inputs[e]*ts;
            var ioy = gitem.inputs[e+1]*ts;
            var ios = ts*8;
            if(ios < 5) ios = 5;
            iox += (g.x*gs)+this.camera.x;
            ioy += (g.y*gs)+this.camera.y;
            iox -= ios/2;
            ioy -= ios/2;

            if(this.hov_wire !== null && 
                this.hov_wire.gate == i &&
                (this.hov_wire.id*2) == e &&
                this.hov_wire.io == 'i'){
                this.svg.stroke(255,255,0);
            }else{
                this.svg.stroke(255,0,0);
            }
            this.svg.strokeWeight(2);
            this.svg.noFill();
            this.svg.rect(iox/this.svg.p_width, ioy/this.svg.p_height, ios/12, ios/12);
        }
        for(var e = 0; e < gitem.outputs.length; e+=2){
            var iox = gitem.outputs[e]*ts;
            var ioy = gitem.outputs[e+1]*ts;
            var ios = ts*8;
            if(ios < 5) ios = 5;
            iox += (g.x*gs)+this.camera.x;
            ioy += (g.y*gs)+this.camera.y;
            iox -= ios/2;
            ioy -= ios/2;

            if(this.hov_wire !== null && 
                this.hov_wire.gate == i &&
                (this.hov_wire.id*2) == e &&
                this.hov_wire.io == 'o'){
                this.svg.stroke(255,255,0);
            }else{
                this.svg.stroke(0,255,0);
            }
            this.svg.strokeWeight(2);
            this.svg.noFill();
            this.svg.rect(iox/this.svg.p_width, ioy/this.svg.p_height, ios/12, ios/12);
        }
    }
    // var gs = 800*this.camera.zoom;

    // Draw a wire to the mouse 
    if(this.c_wire !== null){
        var iox = (this.c_wire.x*ts)+this.camera.x;
        var ioy = (this.c_wire.y*ts)+this.camera.y;
        var mx = g_mouse.x;
        var my = g_mouse.y;
        var ios = ts*8;
        if(ios < 5) ios = 5;
        iox -= ios/2;
        ioy -= ios/2;
        this.svg.stroke(255,0,0);
        this.svg.line(iox/this.svg.p_width,ioy/this.svg.p_height,mx/this.svg.p_width,my/this.svg.p_height);

    }

    // Draw a select box if needed 
    if(this.select !== null){
        var sx = this.select.sx;
        var sy = this.select.sy;
        var sw = this.select.sw*100;
        var sh = this.select.sh*100;
        // Keep the values absolute
        if(sw < 0){
            sx += sw;
            sw = -sw;
        }
        if(sh < 0){
            sy += sh;
            sh = -sh;
        }

        // Scale into window view
        sx /= this.svg.p_width;
        sy /= this.svg.p_height;
        sw /= this.svg.p_width;
        sh /= this.svg.p_height;

        // Draw the selection box
        this.svg.setAlpha(64);
        this.svg.stroke(g_col_5);
        this.svg.fill(g_col_6);
        this.svg.rect(sx,sy,sw,sh);
        this.svg.setAlpha(255);
    }
    this.svg.stroke(255,0,0);
    this.svg.strokeWeight(5);
    this.svg.noFill();
    this.svg.point(this.camera.x/this.svg.p_width, this.camera.y/this.svg.p_height);

    // Draw an object floating above the screen if needed 
    if(this.holding.length ){
        var svgsize = this.holding[2];
        var mx = g_mouse.x - (svgsize.x + (svgsize.w/2))*25*this.camera.zoom;
        var my = g_mouse.y - (svgsize.y + (svgsize.h/2))*25*this.camera.zoom;
        var mx = Math.floor(mx/gs);
        var my = Math.floor(my/gs);
        var gx = (mx*gs)-this.camera.x+(this.camera.x%gs);
        var gy =  (my*gs)-this.camera.y+(this.camera.y%gs);
        // Draw the held item 
        this.drawSVG(this.holding[0], this.holding[1],gx,gy,this.holding[3]);
    }

    this.svg.fill(255,0,0);
    this.svg.noStroke();
    this.svg.textSize(20);
    this.svg.text(this.camera.x.toFixed()+","+this.camera.y.toFixed(),0.1,0.1);
    this.scene_changed = true;
};

Logical.prototype.step = function(){
    // Advance all pages 
    for(var i = 0; i < this.pages.length; i++){
        this.pages[i].circuit.step();
    }
};

Logical.prototype.run = function() {
    this.handlePage();

    this.handleInput();

    this.draw();

    this.step();

    if(this.scene_changed || this.svg.resized){
        this.scene_changed = false;
        var startTime = performance.now();
        this.svg.render();
        var endTime = performance.now();
        this.svg.drawFTime(endTime-startTime);
    }
    this.svg.clear();

    this.svg.drawFPS();
};

