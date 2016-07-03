
function setupSoloBackground() {
    $('#background').empty()
    //add texture image to the lowest level of background
    if (typeof bgtrack == "undefined") {
        d3.select('#background')
            .append('rect')
            .attr('id', 'texture')
            .attr('x', -width * toolbar['scale'])
            .attr('y', -height * toolbar['scale'])
            .attr('width', width * 2 * toolbar['scale'])
            .attr('height', height * 2 * toolbar['scale'])
            .style('fill', "url(#textureimg)")
    }

    d3.select('#background')
        .append('g')
        .attr('id', 'bgtrack')

    bgcolor = d3.scale.linear().range([color(selected.continent), 'white']).domain([1, 0])

    //if (typeof bgtrack == "undefined")
    {
        //background track is convex hull of selected point group
        //group path into small groups
        groups = []
        step = 4
        size = 7
        for (i = 0; i < path.length - size; i += step) {
            ver = []
            refver = []
            for (j = i; j < size + i; j++) {
                ver.push([path[j].x, path[j].y])
            }
            groups.push(ver)
        }

        d3.select('#bgtrack')
            .selectAll('hull')
            .data(groups)
            .enter()
            .append('path')
            //.style('stroke-width', '5')
            //.style('stroke-linejoin', 'round')
            .style('stroke', bgcolor(0.35))
            .style('fill', bgcolor(0.35))
            .attr('opacity', 0.85)
            .attr("d", function (d) {
                return "M" +
                  d3.geom.hull(d)
                    .join("L")
                + "Z";
            })
    }

    d3.select('#bgtrack')
        .append('path')
        .attr('fill','none')
        .attr('d', lineChartFunction(path))
        .attr('stroke', bgcolor(0.5))
        //.attr('stroke-width', 1)

    shadowbubble = d3.select('#bgtrack')
    .selectAll('shadowbubble')
    .data(path)
    .enter()
    .append('g')
    .attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')' })
    .on('mouseover', function (d) {
        $(this).parent().append($(this))
        $(this).find('text').show()
    })
    .on('mouseout', function (d) {
        $(this).find('text').hide()
    })
    .on('click', function (d,i) {
        rolltoPos(i)
        updateSence(-1)
    })

    shadowbubble.append('path')
        .attr('d', d3.svg.symbol().type("circle"))
        .attr('transform','scale(0.5)')
        .attr('fill', bgcolor(0.4))

    shadowbubble.append('text')
    .text(function (d, i) { return begin + i })
    .each(function (d) { $(this).hide() })

    if (!$('input:checkbox[name="trace"]').is(':checked'))
        $('#bgtrack').hide()
}

//Interface: function called every sample during animation
function updateSence(offset) {
    if (pos < 0 || pos > end-begin-1)
        return
    $('#nextstep').fadeIn(Math.min(duration, 500))

    //change the small multiple view
    updateSMSence(pos);

    //change the side views
    updateglobalsence(pos)

    updateLineScence(pos)

    //offset=-2: animation is paused
    if (offset == -2) {
        updateLabelByDistance()
    }
    else {
        //the importance level criteria
        updateLabelByMotion()
    }

    //move the objects in the view
    if (offset < 0) {
        duration = 0
        offset = 0
    }

    //if it is moving (duration != 0), show the landscape
    if (duration == 0) {
        $('.nextstep').hide()
    }
    else {
        d3.selectAll('.nextstep').attr('transform', function (d) {
            if (offset != 0 || direct < 0)
                return 'translate(' + path[pos + d].x + ',' + path[pos + d].y + ')'
            else
                return 'translate(' + path[pos + d - 1].x + ',' + path[pos + d - 1].y + ')'
        })
        $('.nextstep').delay(100).show()
    }

    updateYearLabel()
    updateBubble(offset)
    updateSelected(offset)

    updateLineScence(pos)

    if (cameraView)
        updateCamera(offset)

    d3.selectAll('.camera')
    .transition()
    .duration(duration)
    .attr('transform', 'translate(' + (x(selected.data[dx][pos]) * (1 - offset) + x(selected.data[dx][pos + 1]) * offset) + ',' + (y(selected.data[dy][pos]) * (1 - offset) + y(selected.data[dy][pos + 1]) * offset) + ')')
    .ease('linear')

    if (offset == 1) {
        pos += 1;
    }
}

function updateBubble(offset) {
    
    sizecheck = $('input:checkbox[name="size"]').is(':checked');
    colorcheck = $('input:checkbox[name="color"]').is(':checked');

    d3.selectAll('#bubblelayer .bubble')
    .transition()
    .duration(duration)
    .attr('transform', function (d) {
        return 'translate(' + (x(d.data[dx][pos]) * (1 - offset) + x(d.data[dx][pos + 1]) * offset) + ',' + (y(d.data[dy][pos]) * (1 - offset) + y(d.data[dy][pos + 1]) * offset) + ')'
    })
    .ease('linear')

    dur2 = Math.min(duration, 800)
    d3.selectAll('.dot')
        .transition()
        .duration(dur2)
        .attr('r', function (d) {
            if (d.light != 0) //pattern highlighted
                return radius(d.data.pop[pos])
            else if (sizecheck && d.rel < distwithscale) //neighbor with condition
                return radius(d.data.pop[pos])
            else
                return 3
        })
        .style('fill', function (d) {
            if (d.light != 0) //pattern highlighted
                return color(d.continent)
            else if (colorcheck && d.rel < distwithscale) //neighbor with condition
                return color(d.continent)
            else
                return 'lightgrey'
        })

    d3.selectAll('#labellayer .label')
        .transition()
        .duration(duration)
        .attr('transform', function (d) {
            return 'translate(' + (x(d.data[dx][pos]) * (1 - offset) + x(d.data[dx][pos + 1]) * offset) + ',' + (y(d.data[dy][pos]) * (1 - offset) + y(d.data[dy][pos + 1]) * offset) + ')'
        })
        .ease('linear')
        .attr('y', function (d) {
            return radius(d.data.pop[pos]) + 10
        })
        .each(function (d) {
            if (d.light != 0 || (d.rel < distwithscale && ($.inArray(d.id, highlightlist) >= 0 || patternLabel == 2))) //pattern highlighted
                $(this).show()
            else
                $(this).hide()
        })    
}

function updateSelected(offset) {
    //if it is outlier, cut off the transition
    //if the begin and end belong to different edge, then no transition
    camerax = cpath[pos].x * (1 - offset) + cpath[pos + 1].x * offset
    cameray = cpath[pos].y * (1 - offset) + cpath[pos + 1].y * offset
    //cameraz = cpath[pos].z * (1 - offset) + cpath[pos + 1].z * offset
            
    d3.selectAll('#selectedlayer .bubble').each(function (d) {
        d.posx = x(d.data[dx][pos]) * (1 - offset) + x(d.data[dx][pos + 1]) * offset
        d.posy = y(d.data[dy][pos]) * (1 - offset) + y(d.data[dy][pos + 1]) * offset
        d.textalign = 'middle'
        d.textx = 0
        d.texty = radius(d.data.pop[pos])+10
        if (d.posx - camerax < -width / 2) {
            d.posx = -width / 2 + camerax
            d.area = 1
            d.textx = radius(d.data.pop[pos])
            d.textalign = 'start'
        }
        else if (d.posx - camerax > width / 2) {
            d.posx = width / 2 + camerax
            d.area = 3
            d.textx = -radius(d.data.pop[pos])
            d.textalign = 'end'
        }
        if (d.posy - cameray > height / 2) {
            d.posy = height / 2 + cameray
            d.area = 4
            d.texty = - radius(d.data.pop[pos])
        }
        else if (d.posy - cameray < -height / 2) {
            d.posy = -height / 2 + cameray
            d.area = 2
            d.texty = 8 + radius(d.data.pop[pos])
        }
    })

    d3.selectAll('#selectedlayer .bubble')
    .transition()
    .duration(duration)
    .attr('transform', function (d) { return 'translate(' + d.posx + ',' + d.posy + ')' })
    .ease('linear')

    d3.selectAll('#selectedlabellayer .label')
    .transition()
    .duration(duration)
    .attr('transform', function (d) { return 'translate(' + d.posx + ',' + d.posy + ')' })
    .ease('linear')
    .attr('y', function (d) { return d.texty })
    .attr('x', function (d) { return d.textx })
    .style('text-anchor', function (d) { return d.textalign })

    d3.selectAll('.selectedcolor').attr('fill', color(selected.continent));
}

function updateCamera(offset) {
    //reset initial drag position to current camera position
    dragx = -cpath[pos].x * (1 - offset) - cpath[pos + 1].x * offset
    dragy = -cpath[pos].y * (1 - offset) - cpath[pos + 1].y * offset

    ////transfer camera as soon as possible when it is stepwise
    d3.select('#xAxis')
        .transition()
        .duration(duration)
        .attr('transform', 'translate(' + (width / 2 + 30 + dragx) + ', '+height+' )')
        .ease('linear')

    d3.select('#yAxis')
        .transition()
        .duration(duration)
        .attr('transform', 'translate(30,' + (height / 2 + 30 + dragy) + ')')
        .ease('linear')

    //move camera
    d3.select('#canvas')
        .transition()
        .duration(duration)
        .attr('transform', 'translate(' + dragx + ',' + dragy + ')')
        .ease('linear')
    ////zoom camera
    //if (cpath[pos + 1].z != 1) {
    //    d3.select('#canvaswrap')
    //        .transition()
    //        .duration(duration)
    //        .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ') scale(' + (cpath[pos].z * (1 - offset) + cpath[pos + 1].z * offset) + ')')
    //        .ease('linear')
    //}
}

function updateYearLabel() {
    //roll the article
    $('li').removeClass('hover')
    $('a[title="' + (pos+begin) + '"]').parent().addClass('hover')

    // go to current position
    $('#article').animate({
        'margin-top':-smallunit*(pos)+500
    })

    //update pos labels
    d3.select('#yearlabel')
        .text(pos+begin)
        .attr('y', -radius(selected.data.pop[pos]))
        .style('fill', color(selected.continent))
}

function interrupt() {
    duration = 0
    updateSence(-1)
}

function pause() {
    duration = 0
    d3.selectAll('.bubble')
    .transition()
    .duration(0)

    d3.selectAll('#canvas')
    .transition()
    .duration(0)

    d3.selectAll('.camera')
    .transition()
    .duration(0)

    d3.selectAll('.label')
    .transition()
    .duration(0)

    d3.selectAll('.axis')
    .transition()
    .duration(0)
}