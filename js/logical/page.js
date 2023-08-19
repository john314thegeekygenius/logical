/*
    * Logical - A digital logic simulator for HTML written in Javascript (yuck)
    *
    * Written by: The Wizard
    *
    * Aug. 14, 2023
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

function Page() {
    this.camera = {
        x:80,
        y:80,
        cx:0,
        cy:0,
        sx:0,
        sy:0,
        zoom:1/32,
    };

    this.circuit = new Circuit();
    this.selected = [];
};

Page.prototype.scrollCamera = function(x,y){
    this.camera.sx = x-this.camera.x;
    this.camera.sy = y-this.camera.y;
};

Page.prototype.updateCamera = function(){
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

