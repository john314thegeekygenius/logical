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

var uuid_cnt = Math.random()*0x5432;
var uuid_seed = 0xDE3DBEAF;

function GetUUID(){
    // TODO:
    // Make a better UUID generator ???
    var result = uuid_seed;
    result += uuid_cnt<<3;
    result -= uuid_cnt;
    uuid_cnt += 1;
    uuid_seed = result;
    result = Math.floor(result); // Why are there fractions??
    return result;
};

function Wire(info){
    var name = undefined;
    
    this.links = [];
    if(info !== undefined){
        name = info.name;
        if(info.links !== undefined){
            for(var i = 0; i < info.links.length; i++){
                this.links.push(info.links[i]);
            }
        }
    }
    this.uuid = GetUUID();
    if(name === undefined){
        this.name = "wire_"+this.uuid;
    }else{
        this.name = name;
    }
    this.cur_state = 0;
    this.next_state = 3;
    this.prev_state = 3;
};

Wire.prototype.Link = function (wire_uuid) {
    this.links.push(wire_uuid);
};

function Gate(info){
    if(info === undefined){
        console.error("New Gate Failed! Bad info:");
    }
    this.uuid = GetUUID();
    this.data = "";
    // Make a new array of wires 
    this.inputs = new Array(info.inlen).fill().map(function(){return {wire:""}});
    this.outputs = new Array(info.outlen).fill().map(function(){return {wire:""}});
    console.log(info);
    if(name === undefined){
        this.name = "gate_"+this.uuid;
    }else{
        this.name = name;
    }
    this.x = info.x;
    this.y = info.y;
    this.cat = info.cat;
    this.key = info.key;
    this.box = info.key;
    this.rot = info.rot;
    this.selected = info.selected;
    this.hover = info.hover;
    // Any and all gates should have internal 
    // logic code (even simple ones?)
    //this.type = FindGateType(this.cat, this.key);
    this.type = 0; // Uhhh
};

Gate.prototype.addInput = function (wire_uuid, id) {  
    if(this.inputs[id].wire !== ""){
        console.warn("Bad wire placement! "+wire_uuid+" -- "+id);
        return 1;
    }
    // Connect the gate input to the wire 
    this.inputs[id].wire = wire_uuid;
    return 0;
};

Gate.prototype.addOutput = function (wire_uuid, id) {
    if(this.outputs[id].wire !== ""){
        console.warn("Bad wire placement! "+wire_uuid+" -- "+id);
        return 1;
    }
    // Connect the gate output to the wire 
    this.outputs[id].wire = wire_uuid;
    return 0;
};


function Circuit(){
    this.gates = [];
    this.wires = [];
    this.sim_tick = 0;
};

Circuit.prototype.addGate = function(info){
    this.gates.push(new Gate(info));
    return this.gates[this.gates.length-1];
};

Circuit.prototype.addWire = function(info){
    this.wires.push(new Wire(info));
    return this.wires[this.wires.length-1];
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
Circuit.prototype.getWire = function(wire_uuid){
    return this.wires.find((element) => element.wire === wire_uuid);
};
Circuit.prototype.linkWires = function(w1_id, w2_id){
    var w1 = this.getWire(w1_id);
    var w2 = this.getWire(w2_id);
    w1.Link(w2_id);
    w2.Link(w1_id);
};


Circuit.prototype.step = function(){
    // TODO:
    // Simulate here 
    this.sim_tick += 1;
    if((this.sim_tick % 100)==0){
        if(this.gates.length){
            console.log(this);
        }
    }
};

