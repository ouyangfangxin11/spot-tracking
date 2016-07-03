function setupCanvas() {
    var frame = d3.select('#chart')
        .append('svg')
        .attr('id', 'mainpanel')
        .attr("viewBox", "0 0 " + (width + 30) + " " + (height + 30))

    var canvas = frame.append('g')
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
    var svg = canvas.append('g')
        .attr('id', 'canvaswrap')
        .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')')
        .append('g')
        .attr('id', 'canvas')

    if (dragflag) {
        function dragCanvas(d) {
            dragx += d3.event.dx
            dragy += d3.event.dy
            d3.select('#xAxis')
                .attr('transform', 'translate(' + (30 + dragx) + ', 0)')

            d3.select('#yAxis')
                .attr('transform', 'translate(0,' + (30 + dragy) + ')')

            d3.select(this)
                .attr("transform", 'translate(' + dragx + ',' + dragy + ')');
        }
        drag = d3.behavior.drag().on("drag", dragCanvas)
        d3.select('#canvas').call(drag);
    }

    svg.append('g').attr('id', 'background')
    svg.append('g').attr('id', 'bubblelayer')
    svg.append('g').attr('id', 'labellayer')
    svg.append('g').attr('id', 'yearlayer')

    if (spotlightflag) {
        var spotlayerwrap = svg.append('defs')
            .append('clipPath')
            .attr('id', 'spotlayerwrap')

        var spotlightwrap = svg.append('g').attr('class', 'spotlightwrap')

        spotlightwrap.append('defs').append('filter')
            .attr('id', 'spotlightblur')
            .append('feGaussianBlur')
            .attr('in', 'SourceGraphic')
            .attr('stdDeviation', '20')

        var spotlight = spotlightwrap.append('g')
            .attr('class', 'spotlight')
            .attr('opacity', 0.7)
            .style('pointer-events', 'none')

        outsize = width * 10
        spotlight.append('path')
            .attr('d', "M-" + outsize + ",-" + outsize + " " + outsize + ",-" + outsize + " " + outsize + "," + outsize + " -" + outsize + "," + outsize)
            .attr('opacity', 0.2)

        spotlight.append('path')
            .attr('d', "M-" + outsize + ",-" + outsize + " " + outsize + ",-" + outsize + " " + outsize + "," + outsize + " -" + outsize + "," + outsize)
            .attr('opacity', 0.8)

        spotlight.attr('clip-path', 'url(#spotlayerwrap)')
    }

    svg.append('g').attr('id', 'selectedlayer')
    svg.append('g').attr('id', 'selectedlabellayer')
}

function mainview() {

    createBubbleLayer()
    createLabelLayer();
    createYearLayer();
    createAxis()

    d3.select('#bubble-' + initialselect).each(function(d) {
        resetSelectedbubble(d)
    })
    updateSence(-2);
}

function createAxis() {
    var frame = d3.select('#mainpanel')

    frame.append('text')
        .attr('class', 'noselect')
        .attr('id', 'xaxislabel')
        .text(axislabel[dx])
        .attr('x', 50)
        .attr('y', height + 18)
        .style('fill', 'red')

    frame.append('g')
        .attr('transform', 'translate(18, ' + (height - 20) + ') rotate(-90)')
        .append('text')
        .attr('class', 'noselect')
        .attr('id', 'yaxislabel')
        .text(axislabel[dy])
        .attr('x', 0)
        .attr('y', 0)
        .attr('text-anchor', 'begin')
        .style('fill', 'red')

    var scale = toolbar['scale']
    y.domain([configdata[dy].min, configdata[dy].max]).range([height / 2 * scale, -height / 2 * scale])
    x.domain([configdata[dx].min, configdata[dx].max]).range([-width / 2 * scale, width / 2 * scale])
    var xAxis = d3.svg.axis().scale(x).orient('bottom')
    var yAxis = d3.svg.axis().scale(y).orient('left')

    if (dx == 'ppp' || dy == 'ppp') {
        var tValue1 = {}
        $.each([150, 200, 300, 400, 500, 600, 800, 1000, 1500, 2000, 3000, 4000, 6000, 8000, 15000, 20000, 25000, 30000, 40000, 50000, 60000, 80000, 100000, 120000], function(i, d) {
            if (scale > 8 || scale > 4 && i % 2 == 0 || i % 4 == 0)
                tValue1[(Math.log(d) - log100) / logbase] = d
        });
        if (dx == 'ppp') {
            xAxis.tickValues(Object.keys(tValue1))
                .tickFormat(function(d) {
                    return tValue1[d]
                })
        } else {
            yAxis.tickValues(Object.keys(tValue1))
                .tickFormat(function(d) {
                    return tValue1[d]
                })
        }
    }

    if (dx == 'le' || dy == 'le') {
        var tValue = {}
        $.each([0, 3, 5, 7, 10, 13, 15, 17, 20, 23, 25, 27, 30, 33, 35, 37, 40, 43, 45, 47, 50, 53, 55, 57, 60, 63, 65, 67, 70, 73, 75, 77, 80, 83], function(i, d) {
            if (scale > 8 || scale > 4 && i % 2 == 0 || i % 4 == 0)
                tValue[(d - 20) / 65] = d
        });
        if (dx == 'le') {
            xAxis.tickValues(Object.keys(tValue))
                .tickFormat(function(d) {
                    return tValue[d]
                })
        } else {
            yAxis.tickValues(Object.keys(tValue))
                .tickFormat(function(d) {
                    return tValue[d]
                })
        }
    }

    if (typeof paper == "undefined") {
        var xAxiswrap = frame.append('g')
            .attr('id', 'xAxiswrap')
            .attr('transform', 'translate(' + width / 2 + ',0)')
        var yAxiswrap = frame.append('g')
            .attr('id', 'yAxiswrap')
            .attr('transform', 'translate(30,' + height / 2 + ')')
        xAxiswrap.append('g')
            .attr('class', 'axis')
            .attr('id', 'xAxis')
            .attr('transform', 'translate(30, 0)')
            .call(xAxis)

        yAxiswrap.append('g')
            .attr('class', 'axis')
            .attr('id', 'yAxis')
            .attr('transform', 'translate(0, 30)')
            .call(yAxis)
    }
}

function resetAxis() {
    d3.select('#xaxislabel').text(axislabel[dx]);
    d3.select('#yaxislabel').text(axislabel[dy]);

    var scale = toolbar['scale']
    y.domain([configdata[dy].min, configdata[dy].max]).range([height / 2 * scale, -height / 2 * scale])
    x.domain([configdata[dx].min, configdata[dx].max]).range([-width / 2 * scale, width / 2 * scale])
    var xAxis = d3.svg.axis().scale(x).orient('bottom')
    var yAxis = d3.svg.axis().scale(y).orient('left')

    if (dx == 'ppp' || dy == 'ppp') {
        var tValue1 = {}
        $.each([150, 200, 300, 400, 500, 600, 800, 1000, 1500, 2000, 3000, 4000, 6000, 8000, 15000, 20000, 25000, 30000, 40000, 50000, 60000, 80000, 100000, 120000], function(i, d) {
            if (scale > 8 || scale > 4 && i % 2 == 0 || i % 4 == 0)
                tValue1[(Math.log(d) - log100) / logbase] = d
        });
        if (dx == 'ppp') {
            xAxis.tickValues(Object.keys(tValue1))
                .tickFormat(function(d) {
                    return tValue1[d]
                })
        } else {
            yAxis.tickValues(Object.keys(tValue1))
                .tickFormat(function(d) {
                    return tValue1[d]
                })
        }
    }

    if (dx == 'le' || dy == 'le') {
        var tValue = {}
        $.each([0, 3, 5, 7, 10, 13, 15, 17, 20, 23, 25, 27, 30, 33, 35, 37, 40, 43, 45, 47, 50, 53, 55, 57, 60, 63, 65, 67, 70, 73, 75, 77, 80, 83], function(i, d) {
            if (scale > 8 || scale > 4 && i % 2 == 0 || i % 4 == 0)
                tValue[(d - 20) / 65] = d
        });
        if (dx == 'le') {
            xAxis.tickValues(Object.keys(tValue))
                .tickFormat(function(d) {
                    return tValue[d]
                })
        } else {
            yAxis.tickValues(Object.keys(tValue))
                .tickFormat(function(d) {
                    return tValue[d]
                })
        }
    }

    if (typeof paper == "undefined") {
        d3.select('#xAxis').call(xAxis)
        d3.select('#yAxis').call(yAxis)
    }
}

function addFiltertoLabel() {
    bubbledata.forEach(function(d) {
        if (d.light > 0 && d.id != selected.id) {
            addtoSecondarylist(d);
        }
    })
}

function resetStage() {
    //reset axis for both scale change
    path = []
    $.each(selected, function(i, select) {
        tpath = []
        $.each(select.data[dx], function(i, d) {
            tpath.push({
                'x': x(d),
                'y': y(select.data[dy][i]),
                'pos': i
            })
        })
        path.push(tpath)
    })
    changeCameraPath()

    resetAxis()
    resetSpotLayer()
    resetSelectedHighlight()
    resetBackgroundTrace()

    updateSence(-1)

    //move the label to the middle
    $.each(selected, function(i, d){
        d3.select('#label-' + d.id).style('text-anchor', 'middle').attr('x', 0)
    })
   
}