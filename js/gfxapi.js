/***
    * SVG Graphics Utility 
    *
    * Jonathan Clevenger 2023
    *
***/

var svgc_element = document.getElementById("svg-ctx");
    //querySelector('.svg-canvas');

// Keyboard stuff 
// 
var g_keys = new Array(256).fill().map(function() {
    return {
        pressed: false,
        released: false,
    };
});

document.addEventListener('keydown', onKeyDown, false);
document.addEventListener('keyup', onKeyReleased, false);

function onKeyDown(e){
    g_keys[e.keyCode].pressed = true;
    g_keys[e.keyCode].released = false;
};

function onKeyReleased(e){
    g_keys[e.keyCode].pressed = false;
    g_keys[e.keyCode].released = true;
};

function clearKeys(){
    for(var i = 0; i < g_keys.length; i++){
        //g_keys[i].pressed = false;
        g_keys[i].released = false;
    }
};

// Mouse stuff 
//
var g_mouse = {
    x:null,
    y:null,
    px:null,
    py:null,
    cx:null,
    cy:null,
    wheel:0,
    button:-1,
    pressed:false,
    clicked:false,
    moved:false,
};

svgc_element.addEventListener('mousemove', onMouseUpdate, false);
svgc_element.addEventListener('mouseenter', onMouseUpdate, false);
svgc_element.addEventListener('mousedown', onMouseDown, false);
svgc_element.addEventListener('mouseup', onMouseUp, false);
svgc_element.addEventListener('wheel', onMouseWheel, false);
svgc_element.addEventListener('click', onMouseClicked, false);
svgc_element.addEventListener('contextmenu', onMouseClicked, false);

const MB_LEFT = 1;
const MB_MID = 2;
const MB_RIGHT = 3;

function onMouseUpdate(e) {
    g_mouse.px = g_mouse.x;
    g_mouse.x = e.offsetX;
    g_mouse.py = g_mouse.y;
    g_mouse.y = e.offsetY;
    g_mouse.moved = true;
    g_mouse.button = e.which;
};

function onMouseDown(e){
    if(g_mouse.pressed === false){
        g_mouse.cx = g_mouse.x;
        g_mouse.cy = g_mouse.y;
        g_mouse.button = e.which;
    }
    g_mouse.pressed = true;
};

function onMouseWheel(e){
    if(e.deltaY > 0){
        g_mouse.wheel = 1;
    }
    if(e.deltaY < 0){
        g_mouse.wheel = -1;
    }
};
function onMouseUp(e){
    g_mouse.pressed = false;
    g_mouse.cx = g_mouse.x;
    g_mouse.cy = g_mouse.y;
    g_mouse.button = -1;
};

function onMouseClicked(e){
    g_mouse.clicked = true;
    g_mouse.button = e.which;
    e.preventDefault();
};

// Get the attributes from the CSS file 

var g_col_1,
    g_col_2,
    g_col_3,
    g_col_4,
    g_col_5,
    g_col_6;

function loadColors(){
    // Get the info 
    var style = window.getComputedStyle(svgc_element);
    g_col_1 = parseInt( style.getPropertyValue('--color_1').substr(1), 16);
    g_col_2 = parseInt( style.getPropertyValue('--color_2').substr(1), 16);
    g_col_3 = parseInt( style.getPropertyValue('--color_3').substr(1), 16);
    g_col_4 = parseInt( style.getPropertyValue('--color_4').substr(1), 16);
    g_col_5 = parseInt( style.getPropertyValue('--color_5').substr(1), 16);
    g_col_6 = parseInt( style.getPropertyValue('--color_6').substr(1), 16);
};


function getRGBstr(val){
    if(val === -1) return "0,0,0,0";
    var R = val>>16;
    var G = (val>>8)&0xFF;
    var B = val&0xFF;
    return R.toString()+","+G.toString()+","+B.toString();
};

function makeSVG(obj){
    var extra = "";
    var internal = "";
    var stroke_s = getRGBstr(obj.stroke);
    var fill_s = getRGBstr(obj.fill);
    var retstr = "";


    if(obj.type == "line"){
        extra = "x1=\"" + obj.sx + 
            "%\" y1=\""+obj.sy + 
            "%\" x2=\""+obj.ex + 
            "%\" y2=\""+obj.ey +"%\"";
    }else 
    if(obj.type == "rect"){
        extra = "x=\"" + obj.x +
            "%\" y=\"" + obj.y +
            "%\" rx=\"" + obj.r +
            "%\" ry=\"" + obj.r +
            "%\" width=\""+obj.w +
            "%\" height=\""+obj.h + "%\"";
    }else 
    if(obj.type == "circle"){
        extra = "cx=\"" + obj.x + 
            "%\" cy=\""+obj.y + 
            "%\" r=\""+obj.r +"\"";
    }else 
    if(obj.type == "ellipse"){
        extra = "cx=\"" + obj.x + 
            "%\" cy=\""+obj.y + 
            "%\" rx=\""+obj.rx + 
            "%\" ry=\""+obj.ry+"%\"";
    }else 
    if(obj.type == "text"){
        extra = "x=\"" + obj.x +
            "%\" y=\"" + obj.y +
            "%\"font-size=\""+obj.font_size+"\""; 
        internal = obj.txt;
    }

    retstr = "<" + obj.type + " class=\"svg-thing\" " + extra;
    if(obj.stroke_w !== 0){
        retstr += " stroke=rgb(" + stroke_s + ")";
        retstr += " stroke-width=\"" + obj.stroke_w + "\"";
    }
    retstr += " fill=rgb(" + fill_s + ")";
    retstr += " opacity=\""+obj.alpha+"\""
    retstr += ">"+internal+"</"+obj.type+">\n";
    return retstr;
};

// Define a graphics context 
function svg_canvas(id, qd){
    // List of objects to render 
    this.svg_objects = [];
    // Document tag for canvas 
    this.svg_element = document.getElementById(id);
    // Internal values of color stuffs
    this.stroke_val = 0;
    this.stroke_size = 1;
    this.cur_color = 0;
    this.col_alpha = 255;
    // Internal values for text stuff 
    this.font_size = 10; // Default ???
    // Size of canvas in scaler form
    this.width = 1; // These should never not be 1???
    this.height = 1;
    // Size of canvas in pixels 
    if(this.svg_element !== null){
        var positionInfo = this.svg_element.getBoundingClientRect();
        this.p_height = positionInfo.height;
        this.p_width = positionInfo.width;
    }else{
        this.p_width = id;
        this.p_height = qd;
    }
    this.resized = false;
    // FPS stuff 
    this.FPS = 0;
    this.lastLoop = new Date();
    this.clipshapes = true; // Clips shapes off screen
    this.lastFrameTime = 0;

};

svg_canvas.prototype.clear = function(){
    this.svg_objects.length = 0;
    this.resized = false;
    // Update the size of canvas in pixels 
    if(this.svg_element !== null){
        var positionInfo = this.svg_element.getBoundingClientRect();
        if(positionInfo.height != this.p_height){
            this.p_height = positionInfo.height;
            this.resized = true;
        }
        if(positionInfo.width != this.p_width){
            this.p_width = positionInfo.width;
            this.resized = true;
        }
    }
    // Fix the mouse 
    g_mouse.clicked = false;
    g_mouse.wheel = 0;
    if(g_mouse.moved==false){
        g_mouse.px = g_mouse.x;
        g_mouse.py = g_mouse.y;
    }else{
        g_mouse.moved = false;
    }
    var thisLoop = new Date();
    this.FPS = 1000 / (thisLoop - this.lastLoop);
    this.lastLoop = thisLoop;
};
svg_canvas.prototype.render = function(){
    var obj_arr = [];

    var len = this.svg_objects.length;
    var i =0;
    var txt_e = document.getElementById('svg-things');
    txt_e.innerHTML = "Total Objects: "+len; 

    while (len--) {
        obj_arr.push( makeSVG(this.svg_objects[i]));
        i++;
    }
    var obj_str = obj_arr.join("");
    if(this.svg_element !== null){
        this.svg_element.innerHTML = obj_str;
    }
    return obj_str;
};
svg_canvas.prototype.drawFPS = function(){
    var txt_e = document.getElementById('svg-fps');
    txt_e.innerHTML = "FPS:"+Math.floor(this.FPS); 
};

svg_canvas.prototype.drawFTime = function(ftime){
    this.lastFrameTime = ftime;
    var txt_e = document.getElementById('svg-ftime');
    txt_e.innerHTML = "Last Frame:"+Math.floor(this.lastFrameTime)+"ms"; 
};

svg_canvas.prototype.noclip = function(){
    this.clipshapes = !this.clipshapes;
};
svg_canvas.prototype.stroke = function(a,b,c){
    var col;
    if(typeof b !== "undefined") {
        if(typeof c === "undefined") {
            c = 0;
        }
        col = a<<16;
        col += b<<8;
        col += c;
    }else{
        col = a;
    }
    this.stroke_val = col;
};
svg_canvas.prototype.noStroke = function(){
    this.stroke_size = 0;
};
svg_canvas.prototype.strokeWeight = function(w){
    this.stroke_size = w;
};
svg_canvas.prototype.setAlpha = function(t){
    this.col_alpha = t/255;
};
svg_canvas.prototype.fill = function(a,b,c){
    var col;
    if(typeof b !== "undefined") {
        if(typeof c === "undefined") {
            c = 0;
        }
        col = a<<16;
        col += b<<8;
        col += c;
    }else{
        col = a;
    }
    this.cur_color = col;
};
svg_canvas.prototype.noFill = function(){
    this.cur_color = -1;
};
svg_canvas.prototype.rect = function(rx,ry,w,h,r){
    if(typeof r === "undefined") {
        r = 0;
    }
    if(this.clipshapes){
        if(rx*this.p_width < -w*this.p_width) return; // Not visible 
        if(ry*this.p_height < -h*this.p_height) return; // Not visible 
        if(rx*this.p_width >= this.p_width) return; // Not visible 
        if(ry*this.p_height >= this.p_height) return; // Not visible 
    }
    this.svg_objects.push({
        type:"rect",
        x:(rx*100).toFixed(2),
        y:(ry*100).toFixed(2),
        w:w.toFixed(2),
        h:h.toFixed(2),
        r:r,
        stroke: this.stroke_val,
        stroke_w: this.stroke_size,
        fill: this.cur_color,
        alpha: this.col_alpha
    });
};
svg_canvas.prototype.ellipse = function(cx,cy,w,h){
    if(this.clipshapes){
        if(cx*this.p_width < -w) return; // Not visible 
        if(cy*this.p_height < -h) return; // Not visible 
        if(cx*this.p_width >= this.p_width+w) return; // Not visible 
        if(cy*this.p_height >= this.p_height+h) return; // Not visible 
    }
    this.svg_objects.push({
        type:"ellipse",
        x:(cx*100).toFixed(2),
        y:(cy*100).toFixed(2),
        rx:w.toFixed(2),
        ry:h.toFixed(2),
        stroke: this.stroke_val,
        stroke_w: this.stroke_size,
        fill: this.cur_color,
        alpha: this.col_alpha
    });
};
svg_canvas.prototype.circle = function(cx,cy,r){
    if(this.clipshapes){
        if(cx*this.p_width < -r) return; // Not visible 
        if(cy*this.p_height < -r) return; // Not visible 
        if(cx*this.p_width >= this.p_width+r) return; // Not visible 
        if(cy*this.p_height >= this.p_height+r) return; // Not visible 
    }
    this.svg_objects.push({
        type:"circle",
        x:(cx*100).toFixed(2),
        y:(cy*100).toFixed(2),
        r:r,
        stroke: this.stroke_val,
        stroke_w: this.stroke_size,
        fill: this.cur_color,
        alpha: this.col_alpha
    });
};
svg_canvas.prototype.line = function(x1,y1,x2,y2){
    if(this.clipshapes){
        var Sx1 = x1*this.p_width;
        var Sx2 = x2*this.p_width;
        var Sy1 = y1*this.p_height;
        var Sy2 = y2*this.p_height;
        if(Sx1 <= Sx2 && Sx2 < -this.stroke_size) return; // Not visible
        if(Sx1 <= Sx2 && Sx1 > this.p_width+this.stroke_size) return; // Not visible
        if(Sx2 <= Sx1 && Sx1 < -this.stroke_size) return; // Not visible
        if(Sx2 <= Sx1 && Sx2 > this.p_width+this.stroke_size) return; // Not visible
        if(Sy1 <= Sy2 && Sy2 < -this.stroke_size) return; // Not visible
        if(Sy1 <= Sy2 && Sy1 > this.p_height+this.stroke_size) return; // Not visible
        if(Sy2 <= Sy1 && Sy1 < -this.stroke_size) return; // Not visible
        if(Sy2 <= Sy1 && Sy2 > this.p_height+this.stroke_size) return; // Not visible
    }

    this.svg_objects.push({
        type:"line",
        sx:(x1*100).toFixed(2),
        sy:(y1*100).toFixed(2),
        ex:(x2*100).toFixed(2),
        ey:(y2*100).toFixed(2),
        stroke: this.stroke_val,
        stroke_w: this.stroke_size,
        fill: this.cur_color,
        alpha: this.col_alpha
    });
};
svg_canvas.prototype.text = function(t,x,y){
    if(this.clipshapes){
        // TODO: Text isn't clipped???
    }
    this.svg_objects.push({
        type:"text",
        x:(x*100).toFixed(2),
        y:(y*100).toFixed(2),
        txt:t,
        font_size:this.font_size,
        stroke: this.stroke_val,
        stroke_w: this.stroke_size,
        fill: this.cur_color,
        alpha: this.col_alpha
    });
};
svg_canvas.prototype.textSize = function(s){
    this.font_size = s;
};
//svg_canvas.prototype.textFont = function(){ // ???
//};
svg_canvas.prototype.triangle = function(){

};
svg_canvas.prototype.point = function(cx,cy){
    if(this.clipshapes){
        if(cx*this.p_width < -(this.stroke_size)) return; // Not visible 
        if(cy*this.p_height < -(this.stroke_size)) return; // Not visible 
        if(cx*this.p_width >= this.p_width+this.stroke_size) return; // Not visible 
        if(cy*this.p_height >= this.p_height+this.stroke_size) return; // Not visible 
    }

    this.svg_objects.push({
        type:"circle",
        x:(cx*100).toFixed(2),
        y:(cy*100).toFixed(2),
        r:this.stroke_size,
        stroke: 0,
        stroke_w: 0,
        fill: this.stroke_val,
        alpha: this.col_alpha
    });
};

