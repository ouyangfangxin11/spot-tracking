//follow camera, always moves forwards, no stop
//ignore the width value, the bubble movement always in the center
function setCameraPos1(path) {
    //the global value for camera path
    tpath = {}

    //find camera position for each frame
    //[TBD] user can setup this
    arr = []
    $.each(simplifyPath(path, 100), function (i, d) {
        arr.push([d.x, d.y])
    })

    curve = svg
        .append("path")
        .data([arr])
        .style('fill', 'none')
        .attr("d", d3.svg.line()
                    .tension(0) // Catmull–Rom
                    .interpolate("basis"));

    length = curve.node().getTotalLength()
    index = 1
    i = 0
    dist = height * 100
    lines = []
    tpath[0] = { 'x': path[0].x, 'y': path[0].y, 'z': 1 }
    oldp = curve.node().getPointAtLength(0);
    while (i < length && index < path.length) {
        p = curve.node().getPointAtLength(i);
        d = mydist(p.x, p.y, path[index].x, path[index].y)
        if (dist > d) {
            dist = d
            i = Math.min(length - 1, i + 4)
        }
        else {
            //found the cloest in 4 steps
            p = curve.node().getPointAtLength(i - 2);
            d2 = mydist(p, path[index])
            if (d2 < d) {
                d = d2
            }
            else {
                p = oldp
            }
            
            //build camera path, default: no scale
            p.z = 1
            //move the camera to the middle of curve and original position and rise flag for zooming
            if (d > height * 0.4) {
                p.z = Math.min(1, 0.6 * height / d)
                p.x = (p.x + path[index].x) / 2
                p.y = (p.y + path[index].y) / 2
            }
            else if (tpath.length > 0){
                //[option function] zoom a little if camera stay at same place for a while, to keep animation moving
                previous = tpath[length - 1]
                if (previous.z > 0.8 && previous.x == p.x && previous.y == p.y) {
                    p.z = previous.z-0.05
                }
            }

            lines.push({ 'p1': p, 'p2': path[index] })
            tpath[path[index].pos] = { 'x': p.x, 'y': p.y, 'z': p.z }

            index += 1
            dist = height * 100
            i -= 4
        }
        oldp = p
    }
    cpath = tpath
}

//state path
viewarare = 0.5
function setCameraPos2(path) {
    //the global value for camera path
    tpath = {}

    line = []
    oldx = 0
    oldy = 0
    box = { 'x1': path[0].x, 'y1': path[0].y, 'x2': path[0].x, 'y2': path[0].y, 'start': path[0].pos }
    for (i = 1; i < path.length; i++){
        d = path[i]
        if (Math.max(box.x2, d.x)-Math.min(box.x1, d.x) > height * 0.5 ||
            Math.max(box.y2, d.y) - Math.min(box.y1, d.y) > height * 0.5) {
            //put camera in the center of bonding box
            mx = (box.x2 + box.x1) / 2
            my = (box.y2 + box.y1) / 2
            zoomstep = 0
            zoombase = 1
            //zoom out when two box are far away
            if (oldx * oldy != 0) {
                dist = mydist(oldx, oldy, mx, my)
                if (dist > height / 3) {
                    zoombase = Math.min(1, 0.6 * height / dist)
                    mx = (oldx + mx) / 2
                    my = (oldy + my) / 2
                }
            }
            //[option function], push in/out a little bit for positve/negative effects, so the animation is keep moving
            if (d.pos - box.start > 3) {
                startpos = path[box.start]
                endpos = path[d.pos - 1]
                if (endpos.x - startpos.x > height / 4 || startpos.y - endpos.y > height / 4)//has progress
                    zoomstep = 1 / (d.pos - 1 - box.start) / 30
            }
            for (j = box.start; j < d.pos; j++) {
                dist = 0
                //the first and last step trigger boundary predict
                if ((j-box.start < 4 || d.pos - j < 6) && d.pos - box.start > 6)
                    dist = 1-(d.pos - j)/4
                tpath[j] = { 'x': mx, 'y': my, 'z': zoombase + zoomstep * (j-box.start)}

                line.push({ 'p1': path[j], 'p2': { 'x': mx, 'y': my } })
            }
            box = { 'x1': d.x, 'y1': d.y, 'x2': d.x, 'y2': d.y, 'start': d.pos }
        }
        else {
            box = bonding(box, d.x, d.y)
        }
    }
    //the last box
    mx = (box.x2 + box.x1) / 2
    my = (box.y2 + box.y1) / 2
    for (i = box.start; i <= path[path.length-1].pos; i++) {
        tpath[i] = { 'x': mx, 'y': my, 'z': 1 }
        line.push({ 'p1': path[i], 'p2': { 'x': mx, 'y': my } })
    }
    cpath = tpath

    //add boundary for reference 
    //d3.select('#canvaswrap').append('g')
    //    .attr('id', 'boundary')
    //    .append('rect')
    //    .attr('x', -width/4)
    //    .attr('y', -height/4)
    //    .attr('width', width / 2)
    //    .attr('height', height / 2)
    //    .style('fill', 'none')
    //    .style('stroke', 'grey')
    //    .style("stroke-dasharray", ("3, 3"))
    //    .style('stroke-width', '3px')

//    drawPath(line)
}

function setCameraPosCenter(path) {
    tpath = {}
    path.forEach(function (d) {
        tpath[d.pos] = d
    })
    cpath = tpath
}

function drawPath(lines) {
    //draw the location for each camera location for test
    d3.select('#background').selectAll('dist').data(lines)
        .enter()
        .append('line')
        .attr('x1', function (d) { return d.p1.x })
        .attr('y1', function (d) { return d.p1.y })
        .attr('x2', function (d) { return d.p2.x })
        .attr('y2', function (d) { return d.p2.y })
        .attr('stroke', 'black')

    d3.select('#background')
    .append('path')
    .datum(path)
    .attr('stroke', 'red')
    .style('fill', 'none')
    .attr('d', d3.svg.line()
         .x(function (d) { return d.x; })
         .y(function (d) { return d.y; }))
}

function bonding(box, x, y) {
    box.x1 = Math.min(box.x1, x)
    box.x2 = Math.max(box.x2, x)
    box.y1 = Math.min(box.y1, y)
    box.y2 = Math.max(box.y2, y)
    return box
}