/// <reference path="scripts/d3.v3.min.js" />
/// <reference path="scripts/jquery-1.10.2.js" />
/// <reference path="scripts/jquery-ui.js" />
/// <reference path="scripts/jquery.timer.js" />

if (typeof paper == "undefined") {
    width = 1280
    height = 705
	//height = 700
}
else {
    width = 700
    height = 500
}
x = d3.scale.linear()
y = d3.scale.linear()
dx = 'ppp'
dy = 'le'

axislabel = {
    'ppp': 'Average Income',
    'le': 'Life Expectancy',
    'kids': 'Children per Woman',
    'mortal': 'Child Mortality'
}

radius = d3.scale.sqrt().range([5, 30])
color = function(d){
    switch(d){
        case 'Sub-Saharan Africa': return 'blue';
        case 'South Asia': return '#46DCFA';
        case 'Middle East & North Africa': return '#57FA37';
        case 'America': return '#C6ED05';
        case 'Europe & Central Asia': return 'orange';
        case 'East Asia & Pacific': return 'red';
    }
}

cpath = null
path = null
configdata = null
bubbledata = null

log100 = Math.log(100)
logbase = Math.log(75000) - log100

selected = null

distwithscale = patternLabel==1? width : height/3
//distwithscale = width

var drag = d3.behavior.drag()    
    .on("drag", dragCanvas)

dragx = 0
dragy = 0
function dragCanvas(d) {
    dragx += d3.event.dx
    dragy += d3.event.dy
    d3.select('#xAxis')
    .attr('transform', 'translate(' + (width/2+dragx) + ','+height+' )')

    d3.select('#yAxis')
        .attr('transform', 'translate(30,' + (dragy+height/2) + ')')

    d3.select(this).attr("transform", 'translate('+dragx+','+dragy+')');
}

function setupCanvas() {
    //setup canvas and basic bubble movement
    frame = d3.select('#chart')
            .append('svg')
            .attr("viewBox", "0 0 "+(width+30)+" "+(height+30))

    canvas = frame.append('g')
        .attr('transform', 'translate(30,0)')

    if (typeof paper == "undefined") {
        frame.append('defs')
        .append('clipPath')
        .attr('id', 'innerwin2')
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', width)
        .attr('height', height)

        canvas.attr('clip-path', 'url(#innerwin2)')
        initialframe()
    }

    //background image
    canvas.append('defs')
        .append('pattern')
        .attr('id', 'textureimg')
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 800)
        .attr('height', 400)
        .append('svg:image')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 800)
        .attr('height', 400)
        .attr("xlink:href", "texture.png")

    //for camera vertical movement. zooming not affect axis and outlier bubble
    svg = canvas
        .append('g')
        .attr('id', 'canvaswrap')
        .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')')
        .append('g')
        .attr('id', 'canvas')
    
    if (dragflag){
        d3.select('#canvas').call(drag);
    }
    
    bg = svg.append('g').attr('id', 'background')

    //layer order
    bubblelayer = svg.append('g').attr('id', 'bubblelayer')
    
    labellayer = svg.append('g').attr('id', 'labellayer')

    if (spotlightflag) {
        spotlayer = svg.append('g').attr('id', 'spotlayer').attr('class', 'camera')
    }

    svg.append('g').attr('id', 'selectedlayer')

    svg.append('g').attr('id', 'selectedlabellayer')

    configfile = 'config.json'
    datafile = 'data.json'

    d3.json(configfile, function (d) {
        configdata = d
        radius.domain([d.pop.min, d.pop.max])

        //create layer of bubbles
        //setup configure data
        d3.json(datafile, function (data) {
            bubbledata = data
            setupInterface()

            //draw the side bars
            globalview();
            linechart('x')
            linechart('y')

            updateglobalAxis(dx, dy)
            updateLineDim(dx, 'x')
            updateLineDim(dy, 'y')
            
            //first add all bubble to grey layer
            bubble = bubblelayer.selectAll('bubble')
                .data(bubbledata)
                .enter()
                .append('g')
                .attr('class', 'bubble')
                .attr('id', function (d) {
                    d.light = 0;
                    d.area = 0
                    return 'bubble-' + d.id;
                })

            bubble.append('circle')
                .attr('class', 'dot')
                .attr('cx', 0)
                .attr('cy', 0)
                .style('fill', 'lightgrey')
                .style('stroke','grey')
                .attr('r', 3)
                .on('mouseover', function (d) {
                    if (d.light != 0)
                        return

                    //add to the bubble layer and change (so there is no reorder)
                    $('#selectedlayer').append($('#bubble-' + d.id))
                    d3.select(this)
                        .attr('r', function (d) { return radius(d.data.pop[pos]); })
                        .style('fill', function (d) { return color(d.continent) })
                    //show label
                    $('#selectedlabellayer').append($('#label-' + d.id))
                    $('#label-' + d.id).show()
                })
                .on('mouseout', function (d) {
                    if (d.light != 0)
                        return

                    //remove from the label layer and add back to bubble layer
                    $('#labellayer').append($('#label-' + d.id))
                    $('#bubblelayer').append($('#bubble-' + d.id))
                    $('#label-' + d.id).hide()

                    if (d.rel > distwithscale) {
                        d3.select(this).attr('r', 3).style('fill', 'lightgrey')
                    }
                    else {
                        d3.select(this)
                        .attr('r', function (d) {
                            if ($('input:checkbox[name="size"]').is(':checked'))
                                return radius(d.data.pop[pos])
                            else
                                return 3
                        })
                        .style('fill', function (d) {
                            if ($('input:checkbox[name="color"]').is(':checked'))
                                return color(d.continent)
                            else
                                return 'lightgrey'
                        })                        
                    }
                })
                .on('click', function (d) {
                    if (clickevent == 2) {
                        //put secondarylist on top of selected
                        if (selected.id != d.id) {
                            //in the labelled list
                            if (d3.select(this).style('stroke-width') != '1px') {
                                resetSelectedbubble(d)
                            }
                            else {
                                //add to the secondarylist
                                addtoSecondarylist(d)
                            }
                        }
                    }
                    updateglobalsence(pos)
                })
                .on("contextmenu", function (d) {
                    //stop showing browser menu
                    d3.event.preventDefault();

                    //handle right click
                    if (selected.id == d.id)
                        return;

                    if (d3.select(this).style('stroke-width') != '1px'){
                        removeSecondarylist(d)
                    }
                });

            createLabelLayer(labellayer);

            if (spotlightflag) {
                //the decoration for select bubble
                addSelectHighlight(spotlayer)
            }

            //addYearlabel;
            //on the top of everything
            svg.append('text')
            .attr('id', 'yearlabel')
            .attr('class', 'camera noselect')
            .attr('x', 0)
            .attr('y', 0)
            .style("font-size", "25px")
            .style('stroke', 'black')
            .attr('text-anchor', 'middle')

            //initial page 
            if (typeof initialpos == "undefined") {
                pos = Math.min(Math.floor($(window).scrollTop() / smallunit), end - 1)
            }
            else {
                scrollflag = false;
                pos = initialpos - begin
                $(window).scrollTop(pos * smallunit);
            }
            toolbar['scale'] = initialscale

            d3.select('#bubble-' + initialselect).each(function (d) {
                resetSelectedbubble(d)
            })

            changeScale(initialscale)

            updateSence(-2);
        })
    })
}

function createLabelLayer(svg) {
    //label and bubble on different layer, for collision detection
    label = svg.selectAll('label')
            .data(bubbledata)
            .enter()
            .append('text')
            .attr('class', 'label noselect')
            .attr('id', function (d) { return 'label-' + d.id })
            .attr('x', 0)
            .attr('y', function (d) {
                return radius(d.data.pop[pos])
            })
            .text(function (d) { return d.name })
            .attr('text-anchor', 'middle')
            .style('stroke', 'black')
            .style('stroke-width', 0.5)
            .style("font-size", "12px")
            .style('pointer-events', 'none')
            .style('font-family', 'Verdana')
                .style('fill', function (d) {
                    return color(d.continent)
                })
}

function addSelectHighlight(bubble) {
    //use svg to adopt selected color theme
    bubble.append('defs').append('filter')
    .attr('id','spotlightblur')
    .append('feGaussianBlur')
    .attr('in','SourceGraphic')
    .attr('stdDeviation','20')
        
    spotlight = bubble.append('g')
    .attr('class', 'spotlight')
    .attr('opacity', 0.7)
    .style('pointer-events', 'none')
    .append('g')
    .attr('class', 'spotlightwrap')

    outsize = width * 2
    insize = distwithscale
    spotlight
    .append('path')
//    .attr('class', 'selectedcolor')
    .attr('d', "M-" + outsize + ",-" + outsize + " " + outsize + ",-" + outsize + " " + outsize + "," + outsize + " -" + outsize + "," + outsize +
    " M-" + insize + ",0 a" + insize + "," + insize + " 0 0,0 " + insize * 2 + ",0 a " + insize + "," + insize + " 0 0,0 -" + insize * 2 + ",0")
    .attr('opacity', 0.2)

    //insize = distwithscale + 70
    //spotlight
    //.append('path')
    //.attr('d', "M-" + outsize + ",-" + outsize + " " + outsize + ",-" + outsize + " " + outsize + "," + outsize + " -" + outsize + "," + outsize +
    //" M-" + insize + ",0 a" + insize + "," + insize + " 0 0,0 " + insize * 2 + ",0 a " + insize + "," + insize + " 0 0,0 -" + insize * 2 + ",0")
    //.attr('opacity', 0.7)
    ////.attr('filter', 'url(#spotlightblur)')


    //draw a pie

    var arc = d3.svg.arc()
    .outerRadius(insize+100)
    .innerRadius(insize+70);

    var pie = d3.layout.pie()
        .sort(null)
        .value(function (d) { return d; });

    var g = spotlight.selectAll(".arc")
        .data(pie([1]))
        .enter().append("g")

    g.append("path")
        .attr("d", arc)
    .attr('class', 'selectedcolor')


    ///

    insize = distwithscale+70
    spotlight
    .append('path')
//    .attr('class', 'selectedcolor')
    .attr('d', "M-" + outsize + ",-" + outsize + " " + outsize + ",-" + outsize + " " + outsize + "," + outsize + " -" + outsize + "," + outsize +
    " M-" + insize + ",0 a" + insize + "," + insize + " 0 0,0 " + insize * 2 + ",0 a " + insize + "," + insize + " 0 0,0 -" + insize * 2 + ",0")
    .attr('opacity', 0.8)
//    .attr('filter', 'url(#spotlightblur)')

    ////use image as spotlight
    //d = [0,1,2,3]
    //bubble.append('g')
    //    .attr('class', 'spotlight')
    //    .style('pointer-events', 'none')
    //    .attr('opacity', 0.7)
    //    .append('g')
    //    .attr('class', 'spotlightwrap')
    //    .selectAll('spot')
    //    .data(d)
    //    .enter()
    //    .append('svg:image')
    //    .attr('x', -1)
    //    .attr('y', -1)
    //    .attr('width', width*4/3)
    //    .attr('height', width*4/3)
    //    .attr('transform', function (d) { return 'rotate(' + 90 * d + ')' })
    //    .attr("xlink:href", "spotlight2.png")
}

function addFiltertoLabel() {
    bubbledata.forEach(function (d) {
        if (d.light > 0 && d.id != selected.id) {
            addtoSecondarylist(d);
        }
    })
}

function addtoSecondarylist(d) {   
    $('#selectedlayer').append($('#bubble-' + d.id))
    d.light = -1;
    d3.selectAll('#bubble-'+d.id+' circle')
        .style('stroke', 'yellow')
        .style('stroke-width', 2)

    $('#selectedlabellayer').append($('#label-' + d.id))
    $('#label-' + d.id).show()

    //update sidelist
    showlist = [selected]
    d3.selectAll('#selectedlayer .bubble').each(function (d) {
        showlist.push(d)
    })
    updateglobalsence(pos)
    updateLineSelect(showlist)
}

function removeSecondarylist(d) {
    $('#bubblelayer').append($('#bubble-' + d.id))
    d.light = 0;
    d3.selectAll('#bubble-' + d.id + ' circle')
        .style('stroke', 'grey')
        .style('stroke-width', 1)

    $('#labellayer').append($('#label-' + d.id))
    
    //update sidelist
    showlist = [selected]
    d3.selectAll('#selectedlayer .bubble').each(function (d) {
        showlist.push(d)
    })
    updateglobalsence(pos)
    updateLineSelect(showlist)
}

function cleanlist() {
    //reset the secondarylist 
    $('#secondarylist').empty();
    $('#selectedlayer .bubble').each(function (d) {
        $('#bubblelayer').append(this)
    })
    $('#selectedlabellayer .label').each(function (d) {
        $('#labellayer').append(this)
    })
    $('.outlier').hide()
    //the edge
    //reset highlighting edge
    d3.selectAll('.dot')
        .style('stroke', function (d) {
            if (d.id == selected.id)
                return ' yellow'
            else {
                d.light = 0
                return 'grey'
            }
        })
        .style('stroke-width', function (d) {
            if (d.id == selected.id)
                return 3
            else
                return 1
        })

    //update sideline 
    updateLineSelect([selected])
}

function resetSelectedbubble(d) {
    selected = d
    cleanlist()
    //add selected bubble into the bubble layer
    $('#bubblelayer').append($('#bubble-' + d.id))
    resetBubblelight();

    //reset visit list
    bubbledata.forEach(function (d) {
        d.visited = 0
    })
    selected.visited = 1000

    $('#selectedlabel').text(selected.name + ' ')


    //move the spotlight layer
    d3.select('#spotlayer').attr('transform',d3.select('#bubble-'+selected.id).attr('transform'))

    //reset highlighting edge
    d3.selectAll('.dot')
        .style('stroke', function (d) { 
            if (d.id == selected.id) 
                return ' yellow'
            else
                return 'grey'
        })
        .style('stroke-width', function (d) {
            if (d.id == selected.id)
                return 3
            else
                return 1
        })

    resetStage()
}

//change the dimensions
function changeDimension(dimx, dimy) {
    dx = dimx;
    dy = dimy;
    d3.select('#xaxislabel').text(axislabel[dx]);
    d3.select('#yaxislabel').text(axislabel[dy]);

    //change side bar
    updateglobalAxis(dx, dy)
    updateLineDim(dx, 'x')
    updateLineDim(dy, 'y')

    resetStage();
}

//function called when scale changes or selected bubble changes during pause
function resetStage() {
    //reset axis for both scale change
    drawAxis()

    //reset selected bubble path
    path = []
    $.each(selected.data[dx], function (i, d) {
        path.push({ 'x': x(d), 'y': y(selected.data[dy][i]), 'pos': i })
    })

    changeCameraPath()

    //input=-2 : the animation is paused
    setupSoloBackground()

    updateSence(-1)
    //updateSence(-2) will show the biggest bubble in view

    //move the label to the middle
    d3.select('#label-' + selected.id).style('text-anchor', 'middle').attr('x',0)
}

var frame
function initialframe() {

    frame.append('text')
        .attr('class', 'noselect')
        .attr('id','xaxislabel')
        .text(axislabel[dx])
        .attr('x', 50)
        .attr('y', height+18)
        .style('fill', 'red')

    frame.append('g')
        .attr('transform', 'translate(18, '+(height-20)+') rotate(-90)')
        .append('text')
        .attr('class', 'noselect')
        .attr('id', 'yaxislabel')
        .text(axislabel[dy])
        .attr('x', 0)
        .attr('y', 0)
        .attr('text-anchor', 'begin')
        .style('fill', 'red')

    // //the color map legend
    // frame.append('svg:image')
        // .attr('x', width-94)
        // .attr('y', 0)
        // .attr('width', 124)
        // .attr('height', 80)
        // .style('pointer-events', 'none')
        // .attr("xlink:href", "legend.png")
}

function changeCameraPath() {
    //reset camera path and important level basing on current path
    if (path == null)
        return

    switch ($('input:radio[name="camera"]:checked').val()){
        case  'stage': setCameraPos2(path); break;
        case 'follow': setCameraPos1(path); break;
        case 'center': setCameraPosCenter(path); break;
    }
}

function mydist(x1, y1, x2, y2) {
    return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2))
}

//parameter for all feature setups:
toolbar = {}
function setupInterface() {
    //initial search tool
    var tags = []
    $.each(bubbledata, function (i, t) {
        tags.push({ 'label': t.name, 'value': t })
    })
    $("#search").autocomplete({
        source: tags,
        focus: function (event, ui) {
            event.preventDefault();
            $("#tags").val(ui.item.label);
        },
        select: function (event, ui) {
            event.preventDefault();
            resetSelectedbubble(ui.item.value)
            resetStage()
        }
    });
    $('input:radio[name="camera"]').change(function () {
        //can only change path when paused
        //resetStage()
        changeCameraPath()
    })

    
    $('#scalerange').change(
        function () {
            $('#scalelabel').text($('#scalerange').val())
            changeScale(parseFloat($('#scalerange').val()))
        })
    changeScale(parseFloat($('#scalerange').val()))

    $('#filterrange').change(
    function () {
        $('#filterlabel').text($('#filterrange').val())
        resetBubblelight()
    })

    toolbar['speed'] = 1
    $('#speedlabel').text($('#speedrange').val())
    $('#speedrange').change(
        function () {

            $('#speedlabel').text($('#speedrange').val())            
        })

    $('input:checkbox[name="size"]').change(function () {
        if ($(this).is(':checked'))
            d3.selectAll('.dot').attr("r", function (d) {
                if (d.light !=0 || d.rel < distwithscale)
                    return radius(d.data.pop[pos])
                else
                    return 3;
            })
        else
            d3.selectAll('.dot').attr("r", function (d) {
                if (d.light == 0)
                    return 3
                return radius(d.data.pop[pos])
            })
    })

    $('input:checkbox[name="color"]').change(function () {
        if ($(this).is(':checked'))
            d3.selectAll('.dot').style("fill", function (d) {
                if (d.light != 0 || d.rel < distwithscale)
                    return color(d.continent)
                else 
                    return 'lightgrery'
            })

        else
            d3.selectAll('.dot').style("fill", function (d) {
                if (d.light == 0)
                    return 'lightgrey'
                return color(d.continent)
            })
    })

    $('input:checkbox[name="trace"]').change(function () {
        if ($(this).is(':checked'))
            $('#bgtrack').show()
        else
            $('#bgtrack').hide()
    })

    $('input:checkbox[name="bgtexture"]').change(function () {
        if ($(this).is(':checked'))
            $('#background').show()
        else
            $('#background').hide()
    })

    $('#spotrange').change(function () {
        val = $('#spotrange').val()
        if (val > 0.2) {
            $('.spotlight').show()
            d3.selectAll('.spotlight').attr('opacity', val)
        }
        else {
            $('.spotlight').hide()
        }
    })

    $('#spotsizerange').change(function () {
        val = $('#spotsizerange').val()
        distwithscale = patternLabel == 1 ? height / 18*val : height / 3*val
        d3.selectAll('#chart .spotlightwrap').attr('transform', 'scale(' + val + ')')
        d3.selectAll('#global .spotlightwrap').attr('transform', 'scale(' + val / toolbar['scale'] * initialscale + ')')
    })

    //highlight optional
    $('input:radio[name="lightevent"]').change(function () {
        resetBubblelight()
    })

    //adjust interface for different page setting 
    if (cameraView == false) {
        $('.cameratool').hide()
    }
}

function changeScale(scale) {
    //$('#spotsizerange').val($('#spotsizerange').val() / toolbar['scale'] * scale)
    $('#spotsizerange').trigger("change");

    toolbar['scale'] = scale
    if (selected != null) {
        //move the select bubble to the center
        if (cpath != null) {
            dragx = -cpath[pos].x
            dragy = -cpath[pos].y
        }
        else {
            dragx = -x(selected.data[dx][pos])
            dragy = -y(selected.data[dy][pos])
        }

        resetStage()
        resetBubblelight()
    }
}

function drawAxis() {
    $('.axis').remove()
    //the axis for scale reference, no grid background
    //draw axis on the edge of canvas, redraw when scale changes
    scale = toolbar['scale']
    y.domain([configdata[dy].min, configdata[dy].max]).range([height / 2 * scale, -height / 2 * scale])
    x.domain([configdata[dx].min, configdata[dx].max]).range([-width / 2 * scale, width / 2 * scale])
    xAxis = d3.svg.axis().scale(x).orient('bottom')
    yAxis = d3.svg.axis().scale(y).orient('left')


    //customize ticks for ppp and le
    if (dx == 'ppp' || dy == 'ppp') {
        var tValue1 = {}
        $.each([150, 200, 300, 400, 500, 600, 800, 1000, 1500, 2000, 3000, 4000, 6000, 8000, 15000, 20000, 25000, 30000, 40000, 50000, 60000, 80000, 100000, 120000], function (i, d) {
            if (scale > 8 || scale > 4 && i % 2 == 0 || i % 4 == 0)
                tValue1[(Math.log(d) - log100) / logbase] = d
        });
        if (dx == 'ppp') {
            xAxis
                .tickValues(Object.keys(tValue1))
                .tickFormat(function (d) { return tValue1[d] })
        }
        else {
            yAxis
                .tickValues(Object.keys(tValue1))
                .tickFormat(function (d) { return tValue1[d] })
        }
    }
        
    if (dx == 'le' || dy == 'le') {
        var tValue = {}
        $.each([0, 3, 5, 7, 10, 13, 15, 17, 20, 23, 25, 27, 30, 33, 35, 37, 40, 43, 45, 47, 50, 53, 55, 57, 60, 63, 65, 67, 70, 73, 75, 77, 80, 83], function (i, d) {
            if (scale > 8 || scale > 4 && i % 2 == 0 || i % 4 == 0)
                tValue[(d - 20) / 65] = d
        });
        if (dx == 'le') {
            xAxis
                .tickValues(Object.keys(tValue))
                .tickFormat(function (d) { return tValue[d] })
        }
        else {
            yAxis
                .tickValues(Object.keys(tValue))
                .tickFormat(function (d) { return tValue[d] })
        }
    }

    if (typeof paper == "undefined") {
        frame.append('g')
            .attr('class', 'axis')
            .attr('id', 'xAxis')
            .call(xAxis)

        frame.append('g')
            .attr('class', 'axis')
            .attr('id', 'yAxis')
            .call(yAxis)
    }
}
