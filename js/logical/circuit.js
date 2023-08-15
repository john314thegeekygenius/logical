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



function Circuit(){
    this.gates = [];
    this.wires = [];
};

Circuit.prototype.addGate = function(info){
    this.gates.push(info);
};

Circuit.prototype.addWire = function(info){
    this.wires.push(info);
};

Circuit.prototype.clearSelections = function(){
    // Remove all selected elements 
    for(var i = 0; i < this.gates.length; i++){
        var g = this.gates[i];
        g.selected = false;
    }
};
Circuit.prototype.deleteGate = function(key){
    this.gates.splice(key,1);
};


Circuit.prototype.step = function(){
    // TODO:
    // Simulate here 
};

