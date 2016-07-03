//follow camera, always moves forwards, no stop
//ignore the width value, the bubble movement always in the center
function setCameraPos1(path) {
    //the global value for camera path
    tpath = {}

    //find camera position for each frame
    //[TBD] user can setup this
    arr = []
    $.each(simplifyPath(path, 100), function(i, d) {
        arr.push([d.x, d.y])
    })
    var svg = d3.select('#canvas')
    var curve = svg
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
    tpath[0] = {
        'x': path[0].x,
        'y': path[0].y,
        'z': 1
    }
    oldp = curve.node().getPointAtLength(0)
    while (i < length && index < path.length) {
        p = curve.node().getPointAtLength(i);
        d = mydist(p.x, p.y, path[index].x, path[index].y)
        if (dist > d) {
            dist = d
            i = Math.min(length - 1, i + 4)
        } else {
            //found the cloest in 4 steps
            p = curve.node().getPointAtLength(i - 2);
            //d2 = mydist(p, path[index]) modify
            d2 = mydist(p.x, p.y, path[index].x, path[index].y)
            if (d2 < d) {
                d = d2
            } else {
                p = oldp
            }

            //build camera path, default: no scale
            p.z = 1
                //move the camera to the middle of curve and original position and rise flag for zooming
            if (d > height * 0.4) {
                p.z = Math.min(1, 0.6 * height / d)
                p.x = (p.x + path[index].x) / 2
                p.y = (p.y + path[index].y) / 2
            } else if (index > 1) {
                //[option function] zoom a little if camera stay at same place for a while, to keep animation moving
                previous = tpath[path[index - 1].pos]
                if (previous.z > 0.8 && previous.x == p.x && previous.y == p.y) {
                    p.z = previous.z - 0.05
                }
            }

            lines.push({
                'p1': p,
                'p2': tpath[path[index - 1].pos]
            })
            tpath[path[index].pos] = {
                'x': p.x,
                'y': p.y,
                'z': p.z
            }

            index += 1
            dist = height * 100
            i -= 4
        }
        oldp = p
    }
    cpath = tpath
        // drawPath(lines, 'black');
}

function setCameraPos2(path) {
    //the global value for camera path
    tpath = {}

    line = []
    oldx = 0
    oldy = 0
    box = {
        'x1': path[0].x,
        'y1': path[0].y,
        'x2': path[0].x,
        'y2': path[0].y,
        'start': path[0].pos
    }
    for (i = 1; i < path.length; i++) {
        d = path[i]
        if (Math.max(box.x2, d.x) - Math.min(box.x1, d.x) > height * 0.5 ||
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
                    // zoombase = Math.min(1, 0.6 * height / dist)
                    mx = (oldx + mx) / 2
                    my = (oldy + my) / 2
                }
            }
            //[option function], push in/out a little bit for positve/negative effects, so the animation is keep moving
            // if (d.pos - box.start > 3) {
            //     startpos = path[box.start]
            //     endpos = path[d.pos - 1]
            //     if (endpos.x - startpos.x > height / 4 || startpos.y - endpos.y > height / 4)//has progress
            //         zoomstep = 1 / (d.pos - 1 - box.start) / 30
            // }
            for (j = box.start; j < d.pos; j++) {
                dist = 0
                    //the first and last step trigger boundary predict
                if ((j - box.start < 4 || d.pos - j < 6) && d.pos - box.start > 6)
                    dist = 1 - (d.pos - j) / 4
                tpath[j] = {
                    'x': mx,
                    'y': my,
                    'z': zoombase + zoomstep * (j - box.start)
                }

                line.push({
                    'p1': path[j],
                    'p2': {
                        'x': mx,
                        'y': my
                    }
                })
            }
            box = {
                    'x1': d.x,
                    'y1': d.y,
                    'x2': d.x,
                    'y2': d.y,
                    'start': d.pos
                }
                // oldx = mx;
                // oldy = my;
        } else {
            box = bonding(box, d.x, d.y)
        }
    }
    //the last box
    mx = (box.x2 + box.x1) / 2
    my = (box.y2 + box.y1) / 2
    for (i = box.start; i <= path[path.length - 1].pos; i++) {
        tpath[i] = {
            'x': mx,
            'y': my,
            'z': 1
        }
        line.push({
            'p1': path[i],
            'p2': {
                'x': mx,
                'y': my
            }
        })
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

    // drawPath(line, 'white')
}

function setCameraPosCenter(path) {
    tpath = {}
    path.forEach(function(d) {
        i
        tpath[d.pos] = d
    })
    cpath = tpath
}

function setCameraPos3(path) {
    //the global value for camera path
    tpath = {}

    //find camera position for each frame
    //[TBD] user can setup this
    arr = []
    $.each(simplifyPath(path, 100), function(i, d) {
        arr.push([d.x, d.y])
    })

    var svg = d3.select('#canvas')
    var curve = svg
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
    tpath[0] = {
        'x': path[0].x,
        'y': path[0].y,
        'z': 1
    }
    oldp = curve.node().getPointAtLength(0)
    distmax = 0;
    for (var j = 1; j < path.length; j++) {
        d = mydist(path[j - 1].x, path[j - 1].y, path[j].x, path[j].y);
        if (d > distmax) {
            distmax = d;
        };
    }
    while (i < length && index < path.length) {
        p = curve.node().getPointAtLength(i);
        d = mydist(p.x, p.y, path[index].x, path[index].y)
        if (dist > d) {
            dist = d
            i = Math.min(length - 1, i + 4)
        } else {
            //found the cloest in 4 steps
            p = curve.node().getPointAtLength(i - 2);
            //d2 = mydist(p, path[index]) modify
            d2 = mydist(p.x, p.y, path[index].x, path[index].y)
            if (d2 < d) {
                d = d2
            } else {
                p = oldp
            }

            //build camera path, default: no scale
            p.z = 1
                //move the camera to the middle of curve and original position and rise flag for zooming
            if (d > height * 0.4) {
                // p.z = Math.min(1, 0.6 * height / d)
                p.x = (p.x + path[index].x) / 2
                p.y = (p.y + path[index].y) / 2
            }

            lines.push({
                'p1': p,
                'p2': tpath[path[index - 1].pos]
            })
            tpath[path[index].pos] = {
                'x': p.x,
                'y': p.y,
                'z': p.z
            }

            index += 1
            dist = height * 100
            i -= 4
        }
        oldp = p
    }
    cpath = tpath
        // drawPath(lines, 'blue');
}

function setCameraPos4(path) {
    //the global value for camera path
    tpath = {}
    arr = []
    $.each(simplifyPath(path, 100), function(i, d) {
        arr.push([d.x, d.y])
    })

    var svg = d3.select('#canvas')
    var curve = svg
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
    tpath[0] = {
        'x': path[0].x,
        'y': path[0].y,
        'z': 1
    }
    oldp = curve.node().getPointAtLength(0)
    dmax = height * 0.25;
    distmax = 0;
    for (var j = 1; j < path.length; j++) {
        d = mydist(path[j - 1].x, path[j - 1].y, path[j].x, path[j].y);
        if (d > distmax) {
            distmax = d;
        };
    }
    zmin = 0.4;
    d0 = 200;
    d1 = distmax; //Math.max(3000 / $('#speedrange').val(), d0);
    dmax = 0;
    while (i < length && index < path.length) {
        p = curve.node().getPointAtLength(i);
        d = mydist(p.x, p.y, path[index].x, path[index].y)
        if (dist > d) {
            dist = d
            i = Math.min(length - 1, i + 4)
        } else {
            //found the cloest in 4 steps
            p = curve.node().getPointAtLength(i - 2);
            //d2 = mydist(p, path[index]) modify
            d2 = mydist(p.x, p.y, path[index].x, path[index].y)
            if (d2 < d) {
                d = d2
            } else {
                p = oldp
            }
            previous = tpath[path[index - 1].pos]
            if (index < path.length - 2) {
                p = energy(path[index], path[index + 1], path[index + 2], previous, path[index - 1], Math.min(Math.sqrt(2) * (height / 2 - distwithscale), height / 2), d0, d1, zmin);
            } else {
                p = energy(path[index], path[index], path[index], previous, path[index - 1], Math.min(Math.sqrt(2) * (height / 2 - distwithscale), height / 2), d0, d1, zmin);
            }
            dmax = Math.max(dmax, p.d);
            lines.push({
                'p1': p,
                'p2': previous
            })
            tpath[path[index].pos] = {
                'x': p.x,
                'y': p.y,
                'z': p.z
            }

            index += 1
            dist = height * 100
            i -= 4
        }
        oldp = p
    }
    distmax = dmax;
    cpath = tpath

    function energy(p1, p2, p3, c, p0, dmax, d0, d1, zmin) {
        camera = {
            'x': p1.x,
            'y': p1.y,
            'z': 1
        };

        function fdist(x1, y1, x2, y2) {
            return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
        }

        function kernal(t) {
            return Math.pow(2, -t);
        }

        scale = 0.3;
        d = mydist(p1.x, p1.y, p0.x, p0.y);
        camera.z = Math.min(1, Math.max(Math.pow(zmin, (d - d0) / (d1 - d0)), zmin));
        if (camera.z > c.z) {
            camera.z = Math.min(camera.z, c.z * (1 + scale));
        } else if (camera.z < c.z) {
            camera.z = Math.max(camera.z, c.z / (1 + scale));
        }

        function cost(x) {
            a1 = kernal(1);
            a2 = kernal(2);
            a3 = kernal(3);
            a4 = kernal(0);
            gamma = 10000000;
            return (a4 * fdist(x[0], x[1], c.x, c.y) + a1 * fdist(x[0], x[1], p1.x, p1.y) + a2 * fdist(x[0], x[1], p2.x, p2.y) + a3 * fdist(x[0], x[1], p3.x, p3.y)) + gamma * Math.pow(Math.max(0, camera.z * mydist(x[0], x[1], p1.x, p1.y) - dmax), 2);
        }
        result = numeric.uncmin(cost, [camera.x, camera.y]);
        camera.x = result.solution[0];
        camera.y = result.solution[1];
        camera.d = d * camera.z;
        return camera;
    }
    // drawPath(lines, 'green');
}

function setmultiCameraPos(path, path2) {
    tpath = {}
    for (var i = 0; i < path.length; i++) {
        tpath[path[i].pos] = {
            'x': 0,
            'y': 0,
            'z': 1
        }
        tpath[path[i].pos].x = (path[i].x + path2[i].x) / 2;
        tpath[path[i].pos].y = (path[i].y + path2[i].y) / 2;
        tpath[path[i].pos].z = Math.min(1, height / mydist(path[i].x, path[i].y, path2[i].x, path2[i].y));
    };
    cpath = tpath
}


function drawPath(lines, color) {
    //draw the location for each camera location for test
    d3.select('#background').selectAll('dist').data(lines)
        .enter()
        .append('line')
        .attr('x1', function(d) {
            return d.p1.x
        })
        .attr('y1', function(d) {
            return d.p1.y
        })
        .attr('x2', function(d) {
            return d.p2.x
        })
        .attr('y2', function(d) {
            return d.p2.y
        })
        .attr('stroke', color)

    d3.select('#background')
        .append('path')
        .datum(path)
        .attr('stroke', 'red')
        .style('fill', 'none')
        .attr('d', d3.svg.line()
            .x(function(d) {
                return d.x;
            })
            .y(function(d) {
                return d.y;
            }))
}

function bonding(box, x, y) {
    box.x1 = Math.min(box.x1, x)
    box.x2 = Math.max(box.x2, x)
    box.y1 = Math.min(box.y1, y)
    box.y2 = Math.max(box.y2, y)
    return box
}

function updateCamera(offset) {
    //reset initial drag position to current camera position
    dragx = -cpath[pos].x * (1 - offset) - cpath[pos + 1].x * offset
    dragy = -cpath[pos].y * (1 - offset) - cpath[pos + 1].y * offset
    var cameraz = cpath[pos].z * (1 - offset) + cpath[pos + 1].z * offset

    ////transfer camera as soon as possible when it is stepwise
    d3.select('#xAxis')
        .transition()
        .duration(duration)
        .attr('transform', 'translate(' + (30 + dragx) + ', 0)')
        .ease('linear')

    d3.select('#yAxis')
        .transition()
        .duration(duration)
        .attr('transform', 'translate(0,' + (30 + dragy) + ')')
        .ease('linear')
    d3.select('#xAxiswrap')
        .transition()
        .duration(duration)
        .attr('transform', 'translate(' + width / 2 + ',' + height + ') scale(' + cameraz + ')')
        .ease('linear')
    d3.select('#yAxiswrap')
        .transition()
        .duration(duration)
        .attr('transform', 'translate(30,' + height / 2 + ') scale(' + cameraz + ')')
        .ease('linear')

    //move camera
    d3.select('#canvas')
        .transition()
        .duration(duration)
        .attr('transform', 'translate(' + dragx + ',' + dragy + ')')
        .ease('linear')
        ////zoom camera
        // if (cpath[pos].z != 1) {
    d3.select('#canvaswrap')
        .transition()
        .duration(duration)
        .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ') scale(' + cameraz + ')')
        .ease('linear')
}