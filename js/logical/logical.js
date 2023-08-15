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

    this.holding = [];

    this.scene_changed = true; // We want to update ONCE 

    this.pages = [];
    this.cur_page = 0;
    this.select = null;

    // Page copies 

    this.camera = {};
    this.selected = [];
};

Logical.prototype.handlePage = function(){
    this.camera = this.pages[this.cur_page].camera;
    this.selected = this.pages[this.cur_page].selected;
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
    this.holding = [key1, key2, svgsize];
};

Logical.prototype.handleInput = function(){
    var gs = 400*this.camera.zoom;

    // Zoom in 
    if(g_mouse.wheel < 0){
        // Zoom in at the mouse (centered)
        var gx = (g_mouse.x/gs);
        var gy = (g_mouse.y/gs);
        this.camera.x -= gx;
        console.log(gx);

        this.camera.zoom *= 2;
        this.scene_changed = true;
    }
    // Zoom out 
    if(g_mouse.wheel > 0){
        this.camera.zoom /= 2;
        this.scene_changed = true;
    }
    if(this.camera.zoom < 1/128){
        this.camera.zoom = 1/128;
    }
    if(this.camera.zoom > 100){
        this.camera.zoom = 100;
    }

    if(this.holding.length){
        // We need to place a gate down maybe 
        if(g_mouse.button == 2){
            this.holding = [];
            g_mouse.button = -1;
        }else if(g_mouse.clicked){
            var svgsize = this.holding[2];
            var mx = g_mouse.x - (svgsize.x + (svgsize.w/2))*25*this.camera.zoom;
            var my = g_mouse.y - (svgsize.y + (svgsize.h/2))*25*this.camera.zoom;
            var mx = Math.floor(mx/gs);
            var my = Math.floor(my/gs);
            var gx = (mx*gs)-this.camera.x+(this.camera.x%gs);
            var gy =  (my*gs)-this.camera.y+(this.camera.y%gs);
            gx /= gs;
            gy /= gs;
            this.pages[this.cur_page].circuit.addGate({
                x: gx,
                y: gy,
                cat:this.holding[0],
                key:this.holding[1],
                box:svgsize,
                selected:false
            });
            g_mouse.clicked = false;
        }
        if(g_keys[27].released){
            this.holding = [];
            this.scene_changed = true;
            g_keys[27].released = false;
        }
        return;
    }
    if(g_keys[27].released){
        // Remove all selected elements 
        this.pages[this.cur_page].circuit.clearSelections();

        this.scene_changed = true;
        g_keys[27].released = false;
    }
    if(g_mouse.clicked || !g_mouse.pressed){
        this.camera.cx = this.camera.x;
        this.camera.cy = this.camera.y;
    }
    if(g_mouse.pressed){
        if(g_keys[16].pressed === true){
            // Select tool 
            this.select = {
                sx: g_mouse.cx,
                sy: g_mouse.cy,
                sw: g_mouse.x-g_mouse.cx,
                sh: g_mouse.y-g_mouse.cy };
        }else{
            // Drag controls
            this.camera.x = (g_mouse.x - g_mouse.cx) + this.camera.cx;
            this.camera.y = (g_mouse.y - g_mouse.cy) + this.camera.cy;
            this.scene_changed = true;
        }
    }else{
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
            var page = this.pages[this.cur_page];
            for(var i = 0; i < page.circuit.gates.length; i++){
                var g = page.circuit.gates[i];
                var hx = g.x*gs;
                var hy = g.y*gs;
                var hw = g.box.w;
                var hh = g.box.h;
                // Reset the gate (we don't want to accumulate unless ctrl is pressed too?)
                if(g_keys[17].pressed===false){
                    g.selected = false;
                }
                if(hx+gs >= wx && hy+gs >= wy){
                    if(wx+ww >= hx+hw-gs && wy+wh >= hy+hh-gs){
                        g.selected = true;
                    }
                }
            }

            this.select = null;
        }
    }

    if(g_keys[32].released === true){
        // Go back to the center
        this.scrollCamera(0,0);
        g_keys[32].released = false;
    }
    // Delete gates 
    if(g_keys[46].released === true){
        var rmi = [];
        // Find the objects in selected area 
        var page = this.pages[this.cur_page];
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
        g_keys[46].released = false;
    }

    // Make the camera move
    if(Math.abs(this.camera.sx) < 0.1){
        this.camera.sx = 0;
    }
    if(Math.abs(this.camera.sy) < 0.1){
        this.camera.sy = 0;
    }
    if(this.camera.sx){
        this.camera.sx /= 2;
        this.camera.x += this.camera.sx;
        this.scene_changed = true;
    }
    if(this.camera.sy){
        this.camera.sy /= 2;
        this.camera.y += this.camera.sy;
        this.scene_changed = true;
    }
};

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

Logical.prototype.drawSVG = function(catagory,tag,x, y){
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
        this.svg.strokeWeight(sw);
        this.svg.stroke(g_col_5);
        if(p[0] === "frect" || p[0] === "rect"){
            var px = (p[1]*ts/2.5)+tx;
            var py = (p[2]*ts/2.5)+ty;
            var pw = p[3]*ts*40;
            var ph = p[4]*ts*40;
            if(p[0]==="frect"){
                this.svg.fill(g_col_3);
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
            var px = (p[1]*ts/2.5)+tx;
            var py = (p[2]*ts/2.5)+ty;
            var pw = (p[3]*ts/2.5)+tx;
            var ph = (p[4]*ts/2.5)+ty;
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
    
    // Draw any gates
    var page = this.pages[this.cur_page];
    for(var i = 0; i < page.circuit.gates.length; i++){
        var g = page.circuit.gates[i];
        this.drawSVG(g.cat,g.key,g.x*gs,g.y*gs);
        if(g.selected === true){
            var px = g.x*gs + this.camera.x;
            var py = g.y*gs + this.camera.y;
            var pw = g.box.w*5/gw;
            var ph = g.box.h*5/gh;
            this.svg.noStroke();
            this.svg.setAlpha(128);
            this.svg.fill(g_col_4);
            this.svg.rect(px/this.svg.p_width,py/this.svg.p_height,pw,ph);
            this.svg.setAlpha(255);
        }
    }

    // Draw a select box if needed 
    if(this.select !== null){
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

        // Scale into window view
        sx /= this.svg.p_width;
        sy /= this.svg.p_height;
        sw /= this.svg.p_width/100;
        sh /= this.svg.p_height/100;

        // Draw the selection box
        this.svg.setAlpha(64);
        this.svg.fill(g_col_6);
        this.svg.rect(sx,sy,sw,sh);
        this.svg.setAlpha(255);
    }

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
        this.drawSVG(this.holding[0], this.holding[1],gx,gy);
    }
    this.scene_changed = true;
};

Logical.prototype.run = function() {
    this.handlePage();

    this.handleInput();

    this.draw();
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

