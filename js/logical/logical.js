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

    this.camera = {
        x:80,
        y:80,
        cx:0,
        cy:0,
        sx:0,
        sy:0,
        zoom:1/8,
    };

    this.holding = [];

    this.scene_changed = true; // We want to update ONCE 

    this.circuit = {
        gates:[],
        wires:[],
    }; // An empty circuit 
};

Logical.prototype.scrollCamera = function(x,y){
    this.camera.sx = x-this.camera.x;
    this.camera.sy = y-this.camera.y;
};


Logical.prototype.holdItem = function(key1, key2){
    this.holding = [key1, key2];
};

Logical.prototype.handleInput = function(){
    var gs = 100*this.camera.zoom;
    if(this.holding.length){
        // We need to place a gate down maybe 
        if(g_mouse.clicked){
            if(g_mouse.button == 2){
                this.holding = [];
                g_mouse.button = -1;
            }else{
                this.circuit.gates.push({
                    x: Math.floor(g_mouse.x/gs)-4,
                    y:Math.floor(g_mouse.y/gs)-4,
                    cat:this.holding[0],
                    key:this.holding[1]
                });
                this.scene_changed = true;
            }
            g_mouse.clicked = false;
        }
        if(g_keys[27].released){
            this.holding = [];
            g_keys[27].released = false;
        }
        return;
    }
    if(g_mouse.clicked || !g_mouse.pressed){
        this.camera.cx = this.camera.x;
        this.camera.cy = this.camera.y;
    }
    if(g_mouse.pressed){
        // Drag controls
        this.camera.x = (g_mouse.x - g_mouse.cx) + this.camera.cx;
        this.camera.y = (g_mouse.y - g_mouse.cy) + this.camera.cy;
        this.scene_changed = true;
    }
    if(g_mouse.wheel < 0){
        this.camera.zoom *= 2;
        this.scene_changed = true;
    }
    if(g_mouse.wheel > 0){
        this.camera.zoom /= 2;
        this.scene_changed = true;
    }
    if(this.camera.zoom < 0.0025){
        this.camera.zoom = 0.0025;
    }
    if(this.camera.zoom > 100){
        this.camera.zoom = 100;
    }
    if(g_keys[32].released){
        // Go back to the center
        this.scrollCamera(0,0);
        g_keys[32].released = false;
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

Logical.prototype.drawSVG = function(catagory,tag,x, y){
    if( gate_json_list === undefined){
        console.error("Gates not loaded?");
        return;
    }
    var ts = (this.camera.zoom*100);
    var tx = (x*ts + this.camera.x);
    var ty = (y*ts + this.camera.y);

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

    for(var i = 0; i < svgthing.length; i++){
        var p = svgthing[i];
        this.svg.strokeWeight(12*this.camera.zoom);
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
                this.svg.strokeWeight(24*this.camera.zoom);
            }
            this.svg.line(px/this.svg.p_width, py/this.svg.p_height, pw/this.svg.p_width, ph/this.svg.p_height);
        }
    }
};

Logical.prototype.draw = function(){
    // Draw a grid 
    var gs = 100*this.camera.zoom;
    var gw = this.svg.p_width/gs;
    var gh = this.svg.p_height/gs;
    this.svg.stroke(g_col_1);
    this.svg.strokeWeight(1);
    if(this.camera.zoom >= 0.05){
        for(var i = -1; i < gw+1; i++){
            var gx = (i*gs)+(this.camera.x%gs);
            this.svg.line(gx/this.svg.p_width, 0.0, gx/this.svg.p_width, 1.0);
        }
        for(var i = -1; i < gh+1; i++){
            var gy = (i*gs)+(this.camera.y%gs);
            this.svg.line(0.0, gy/this.svg.p_height, 1.0, gy/this.svg.p_height);
        }
    }
    // Draw any gates
    for(var i = 0; i < this.circuit.gates.length; i++){
        var g = this.circuit.gates[i];
        this.drawSVG(g.cat,g.key,g.x,g.y);
    }

    if(this.holding.length ){
        var gx = Math.floor(g_mouse.x/gs)-4;
        var gy = Math.floor(g_mouse.y/gs)-4;
        // Draw the held item 
        this.drawSVG(this.holding[0], this.holding[1],gx,gy);
        this.scene_changed = true;
    }
};

Logical.prototype.run = function() {
    this.handleInput();
    this.draw();
    if(this.scene_changed || this.svg.resized){
        this.scene_changed = false;
        this.svg.render();
    }
    this.svg.clear();
    this.svg.drawFPS();
};

