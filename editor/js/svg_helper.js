var programCode = function(processingInstance) {
    with (processingInstance) {
        size(2700, 3400); 
        frameRate(30);
        var res = 40;
        var mThresh = 4; // Number of pixels next to a 
        //point that interacts with the mouse

        var sx = floor(400/res);
        var sy = floor(400/res);

        var loadedsvg = {
        };

        var svg_list = [];
        var inputs = [];
        var outputs = [];

        var loadSVG = function(){
            var thing = loadedsvg.svg;
            if(thing === undefined){
                return ; // Nothing to load 
            }
            var rx = sx/2.5;
            var ry = sy/2.5;
            for(var i = 0; i < thing.length; i++){
                var tag = thing[i][0];
                if(tag === "line"){
                    svg_list.push({
                        type:"line",
                        x:thing[i][1]*rx, 
                        y:thing[i][2]*ry,
                        x2:thing[i][3]*rx, 
                        y2:thing[i][4]*ry });

                }
            }

        };

        loadSVG();

        var m_hoverx = 0; // Where is the mouse hovering?
        var m_hovery = 0;
        var m_hovrad = 0; // Radius from click point
        var m_on_obj = -1; // Is the mouse over an object
        var m_on_in = -1;
        var m_on_out = -1;

        var click_x = -1; // Where did we just click?
            var click_y = -1;

        var cur_tool = 0;
        var m_click = false; // Did we click

        var keys = [];

        var mouse_out_of_frame = true;

        var Trans = {x:10,y:10};

        var mouseOverP = function(x,y){
            if(mouseX > x-mThresh && mouseX < x+mThresh){
                if(mouseY > y-mThresh && mouseY < y+mThresh){
                    m_hoverx = x;
                    m_hovery = y;
                    return true;
                }
            }
            return false;
        };

        var genGrid = function(){
            var gfx = createGraphics(width,height);
            for(var i = 0; i <= height/sy; i++){
                for(var e = 0; e <= width/sx; e++){
                    var px = (sx*e)+Trans.x;
                    var py = (sy*i)+Trans.y;
                    gfx.stroke(97, 97, 97);
                    gfx.strokeWeight(4);
                    gfx.point(px,py);
                }
            }

            gfx.pushMatrix();
            gfx.translate(Trans.x,Trans.y);
            // Draw construction lines
            gfx.stroke(255, 0, 40,240);
            gfx.strokeWeight(2);
            for(var i = 0; i <= res*10; i++){
                // Horz
                gfx.line(i*sx*8,0,i*sx*8,height);
                // Vertical
                gfx.line(0,i*sy*8,width, i*sy*8);
            }
            gfx.stroke(0, 0, 255,180);
            for(var i = 0; i <= res*10; i+=1){
                // Horz
                gfx.line(i*sx*4,0,i*sx*4,height);
                // Vertical
                gfx.line(0,i*sy*4,width, i*sy*4);
            }
            gfx.stroke(255, 200, 0,60);
            for(var i = 0; i <= res*10; i+=1){
                // Horz
                gfx.line(i*sx*2,0,i*sx*2,height);
                // Vertical
                gfx.line(0,i*sy*2,width, i*sy*2);
            }
            gfx.stroke(0, 180, 0,128);
            for(var i = 0; i <= res*10; i+=1){
                // Horz
                gfx.line(i*sx*5*8,0,i*sx*5*8,height);
                // Vertical
                gfx.line(0,i*sy*5*8,width, i*sy*5*8);
            }
            gfx.popMatrix();

            return gfx.get(0,0,gfx.width,gfx.height);
        };


        var gridback = undefined;

        var drawGrid = function(){
            var hovx = 0;
            var hovy = 0;

            if(gridback === undefined){
                gridback = genGrid();
            }

            background(0, 0, 0);
            m_hoverx = -1;
            m_hovery = -1;

            image(gridback,0,0);


            for(var i = 0; i <= res*6; i++){
                for(var e = 0; e <= res*7; e++){
                    var px = (sx*e)+Trans.x;
                    var py = (sy*i)+Trans.y;
                    if(mouseX < width-80){
                        mouseOverP(px,py);
                    }
                }
            }

            hovx = m_hoverx;
            hovy = m_hovery;

            pushMatrix();
            translate(Trans.x,Trans.y);
            // Draw any objects 
            m_on_obj = -1;
            for(var i = 0; i < svg_list.length; i++){
                var itm = svg_list[i];
                if(mouseOverP(itm.x+Trans.x,itm.y+Trans.y)){
                    stroke(255, 252, 76);
                    strokeWeight(6);
                    m_on_obj = i;
                }else{
                    stroke(255, 0, 0);
                    strokeWeight(3);
                }
                if(itm.type === "line"){
                    line(itm.x,itm.y, itm.x2, itm.y2);
                }
                if(itm.type === "wline"){
                    strokeWeight(6);
                    line(itm.x,itm.y, itm.x2, itm.y2);
                }
                if(itm.type === "fcircle"){
                    fill(214, 214, 214,128);
                    ellipse(itm.x,itm.y, itm.r*2, itm.r*2);
                }
                if(itm.type === "frect"){
                    fill(214, 214, 214,128);
                    rect(itm.x,itm.y, itm.w, itm.h);
                }
                if(itm.type === "circle"){
                    noFill();
                    ellipse(itm.x,itm.y, itm.r*2, itm.r*2);
                }
                if(itm.type === "rect"){
                    noFill();
                    rect(itm.x,itm.y, itm.w, itm.h);
                }
            }
            m_on_in = -1;
            // Draw any IO points 
            for(var i = 0; i < inputs.length; i++){
                var p = inputs[i];
                if(mouseOverP(p.x+Trans.x,p.y+Trans.y)){
                    stroke(255, 252, 76);
                    strokeWeight(20);
                    m_on_in = i;
                }else{
                    stroke(255, 0, 238);
                    strokeWeight(15);
                }
                point(p.x,p.y);
            }
            m_on_out = -1;
            for(var i = 0; i < outputs.length; i++){
                var p = outputs[i];
                if(mouseOverP(p.x+Trans.x,p.y+Trans.y)){
                    stroke(255, 252, 76);
                    strokeWeight(20);
                    m_on_out = i;
                }else{
                    stroke(255, 170, 0);
                    strokeWeight(15);
                }
                point(p.x,p.y);
            }
            popMatrix();

            // Draw a connecting line from the users last 
            // point of clicking
            stroke(0, 4, 255);
            if(click_x !== -1 && m_hoverx !== -1){
                var yy = m_hovery-click_y;
                var xx = m_hoverx-click_x;
                m_hovrad = sqrt(xx*xx + yy*yy);
                strokeWeight(6);
                switch(cur_tool){
                    case 0: // Line
                        line(click_x, click_y, m_hoverx, m_hovery);
                        break;
                    case 1: // Wide Line
                        strokeWeight(10);
                        line(click_x, click_y, m_hoverx, m_hovery);
                        break;
                    case 2: // Filled Circle
                        fill(255, 157, 0);
                        ellipse(click_x, click_y, m_hovrad*2, m_hovrad*2);
                        break;
                    case 3: // Filled Rect
                        fill(255, 157, 0);
                        rect(click_x, click_y, m_hoverx-click_x, m_hovery-click_y);
                        break;
                    case 4: // Empty Circle
                        noFill();
                        ellipse(click_x, click_y, m_hovrad*2, m_hovrad*2);
                        break;
                    case 5: // Empty Rect
                        noFill();
                        rect(click_x, click_y, m_hoverx-click_x, m_hovery-click_y);
                        break;
                }
            }
            // Draw a point at the mouse location
            stroke(52, 237, 23);
            strokeWeight(6);
            point(hovx,hovy);

        };

        var drawToolBar = function(){
            for(var i = 0; i < 8; i++){
                var tx = width-40;
                var ty = i*40;
                stroke(0);
                strokeWeight(2);
                fill(43, 43, 43);
                pushMatrix();
                if(cur_tool === i){
                    translate(-20,0);
                }
                if(mouseX > width-60){
                    if(mouseY >= i*40 && mouseY < (i*40)+40){
                        translate(-10,0);
                        if(m_click){
                            cur_tool = i;
                        }
                    }
                }
                rect(tx, ty,40,40);
                noFill();
                stroke(255, 251, 0);
                strokeWeight(4);
                switch(i){
                    case 0: // Line
                        line(tx+5,ty+35,tx+35,ty+5);
                        break;
                    case 1: // Wide Line
                        strokeWeight(6);
                        line(tx+5,ty+35,tx+35,ty+5);
                        break;
                    case 2: // Filled Circle
                        fill(255, 157, 0);
                        ellipse(tx+20,ty+20,35,35);
                        break;
                    case 3: // Filled Rect
                        fill(255, 157, 0);
                        rect(tx+5,ty+5,30,30);
                        break;
                    case 4: // Empty Circle
                        ellipse(tx+20,ty+20,35,35);
                        break;
                    case 5: // Empty Rect
                        rect(tx+5,ty+5,30,30);
                        break;
                    case 6: // Input
                        line(tx+20,ty+20,tx+35,ty+20);
                        line(tx+5,ty+5,tx+20,ty+20);
                        line(tx+5,ty+35,tx+20,ty+20);
                        break;
                    case 7: // Output
                        line(tx+5,ty+20,tx+35,ty+20);
                        line(tx+25,ty+5,tx+35,ty+20);
                        line(tx+25,ty+35,tx+35,ty+20);
                        break;
                }
                popMatrix();
            }

        };

        var draw = function() {

            drawGrid();

            drawToolBar();

            if(mouse_out_of_frame){
                stroke(10, 10, 10);
                strokeWeight(15);
                fill(242, 242, 242,128);
                rect(0,0,width,height);
                fill(255, 0, 0);
                textSize(40);
                textAlign(CENTER, CENTER);
                text("Click on canvas", width/2,height/2);
            }
            m_click = false;
        };

        mouseClicked = function(){
            if(mouse_out_of_frame){
                mouse_out_of_frame = false;
                return;
            }

            m_click = true;

            if(m_hoverx === -1 || m_hovery === -1){
                return; // Bad location
            }
            if(mouseButton === RIGHT){
                if(m_on_obj === -1){
                    if(m_on_in !== -1){
                        // Delete the input
                        inputs.splice(m_on_in,1);
                        return; // Bad location
                    }else
                        if(m_on_out !== -1){
                            // Delete the input
                            outputs.splice(m_on_out,1);
                            return; // Bad location
                        }
                }else{
                    // Delete the object
                    svg_list.splice(m_on_obj,1);
                    return;
                }
            }
            if(click_x === -1 || click_y === -1){
                if(mouseButton === LEFT){
                    if(cur_tool === 6 || cur_tool === 7){
                        if(cur_tool === 6){
                            inputs.push({x:m_hoverx-Trans.x, y:m_hovery-Trans.y});
                        }else{
                            outputs.push({x:m_hoverx-Trans.x, y:m_hovery-Trans.y});
                        }
                    }else{
                        click_x = m_hoverx;
                        click_y = m_hovery;
                    }
                }
                if(mouseButton === RIGHT){
                    click_x = -1;
                    click_y = -1;
                }
            }else{

                if(mouseButton === LEFT){
                    // Fix position
                    if(cur_tool !== 0 && 
                        cur_tool !== 2 && 
                        cur_tool !== 4){
                        if(m_hoverx < click_x){
                            var t = click_x; click_x = m_hoverx; m_hoverx = t;
                        }
                        if(m_hovery < click_y){
                            var t = click_y; click_y = m_hovery; m_hovery = t;
                        }
                    }
                    // Add a new object to the list 
                    switch(cur_tool){
                        case 0: // Line
                            svg_list.push({
                                type:"line",
                                x:click_x-Trans.x, 
                                y:click_y-Trans.y,
                                x2:m_hoverx-Trans.x, 
                                y2:m_hovery-Trans.y});
                            break;
                        case 1: // Wide Line
                            svg_list.push({
                                type:"wline",
                                x:click_x-Trans.x, 
                                y:click_y-Trans.y,
                                x2:m_hoverx-Trans.x, 
                                y2:m_hovery-Trans.y});
                            break;
                        case 2: // Filled Circle
                            svg_list.push({
                                type:"fcircle",
                                x:click_x-Trans.x, 
                                y:click_y-Trans.y,
                                r:m_hovrad});
                            break;
                        case 3: // Filled Rect
                            svg_list.push({
                                type:"frect",
                                x:click_x-Trans.x, 
                                y:click_y-Trans.y,
                                w:m_hoverx-click_x,
                                h:m_hovery-click_y,
                            });
                            break;
                        case 4: // Empty Circle
                            svg_list.push({
                                type:"circle",
                                x:click_x-Trans.x, 
                                y:click_y-Trans.y,
                                r:m_hovrad});
                            break;
                        case 5: // Empty Rect
                            svg_list.push({
                                type:"rect",
                                x:click_x-Trans.x, 
                                y:click_y-Trans.y,
                                w:m_hoverx-click_x,
                                h:m_hovery-click_y,
                            });
                            break;
                    }
                }
                // Reset the click location
                click_x = -1;
                click_y = -1;
            }
        };

        mouseOut = function() {
            mouse_out_of_frame = true;
        };

        keyReleased = function(){
            if(mouse_out_of_frame){
                mouse_out_of_frame = false;
                return;
            }
            keys[keyCode] = false;
            if(keyCode === 32){
                var logstr = "";
                var pstring = "";
                for(var i = 0; i < svg_list.length; i++){
                    var p = svg_list[i];
                    pstring += "\t[\""+p.type+"\",";
                    if(p.type === "line" || p.type === "wline"){
                        pstring += (p.x/4).toFixed(1) + "," + (p.y/4).toFixed(1) + ",";
                        pstring += (p.x2/4).toFixed(1) + "," + (p.y2/4).toFixed(1) + "]";
                    }
                    if(p.type === "fcircle" || p.type === "circle"){
                        pstring += (p.x/4).toFixed(1) + "," + (p.y/4).toFixed(1) + ",";
                        pstring += (p.r/4).toFixed(1) + "]";
                    }
                    if(p.type === "frect" || p.type === "rect"){
                        pstring += (p.x/4).toFixed(1) + "," + (p.y/4).toFixed(1) + ",";
                        pstring += (p.w/4).toFixed(1) + "," + (p.h/4).toFixed(1) + "]";
                    }
                    if(i < svg_list.length-1){
                        pstring += ",";
                    }
                    pstring += "\n";
                }
                console.log("======================== COPY START ====================");
                logstr += "\"svg\":[\n"+pstring+"],\n";
                pstring = "";
                for(var i = 0; i < inputs.length; i++){
                    var p = inputs[i];
                    pstring += (p.x/4).toFixed(1) + "," + (p.y/4).toFixed(1) ;
                    if(i < inputs.length-1){
                        pstring += ",";
                    }
                }
                logstr += "\"inputs\":["+pstring+"],\n";
                pstring = "";
                for(var i = 0; i < outputs.length; i++){
                    var p = outputs[i];
                    pstring += (p.x/4).toFixed(1) + "," + (p.y/4).toFixed(1) ;
                    if(i < outputs.length-1){
                        pstring += ",";
                    }
                }
                logstr += "\"outputs\":["+pstring+"],\n";
                logstr += "\"logic\":\"\"\n";
                console.log(logstr);
            }
            if(m_hoverx === -1 || m_hovery === -1 || m_on_obj === -1){
                return; // Bad location
            }
        };

        keyPressed = function(){
            keys[keyCode] = true;
        };

        // DO NOT REMOVE 
    }}; // ka_main()
