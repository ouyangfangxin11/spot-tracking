function resetBackgroundTrace() {
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

    var step = 4
    var size = 7
    $.each(path, function(i, d) {
        var bgcolor = d3.scale.linear().range([color(selected[i].continent), 'white']).domain([1, 0])
        var groups = []
        for (i = 0; i < d.length - size; i += step) {
            ver = []
            refver = []
            for (j = i; j < size + i; j++) {
                ver.push([d[j].x, d[j].y])
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
            .attr("d", function(d) {
                return "M" +
                    d3.geom.hull(d)
                    .join("L") + "Z";
            })

        d3.select('#bgtrack')
            .append('path')
            .attr('fill', 'none')
            .attr('d', lineChartFunction(d))
            .attr('stroke', bgcolor(0.5))
            //.attr('stroke-width', 1)

        shadowbubble = d3.select('#bgtrack')
            .selectAll('shadowbubble')
            .data(d)
            .enter()
            .append('g')
            .attr('transform', function(d) {
                return 'translate(' + d.x + ',' + d.y + ')'
            })
            .on('mouseover', function(d) {
                $(this).parent().append($(this))
                $(this).find('text').show()
            })
            .on('mouseout', function(d) {
                $(this).find('text').hide()
            })
            .on('click', function(d, i) {
                rolltoPos(i)
                updateSence(-1)
            })
        shadowbubble.append('path')
            .attr('d', d3.svg.symbol().type("circle"))
            .attr('transform', 'scale(0.5)')
            .attr('fill', bgcolor(0.4))

        shadowbubble.append('text')
            .text(function(d, i) {
                return begin + i
            })
            .each(function(d) {
                $(this).hide()
            })
    })

    if (!$('input:checkbox[name="trace"]').is(':checked'))
        $('#bgtrack').hide()
}

//Interface: function called every sample during animation
function updateSence(offset) {
    if (pos < 0 || pos > end - begin - 1)
        return

    //change the small multiple view
    updateSMSence(pos);

    updateglobalsence(pos)

    updateLineScence(pos)

    //offset=-2: animation is paused
    if (offset == -2) {
        updateLabelByDistance()
    } else {
        updateLabelByMotion()
    }

    //move the objects in the view
    if (offset < 0) {
        duration = 0
        offset = 0
    }

    updateYearLabel()
    updateBubble(offset)
    updateSelected(offset)
    updateLineScence(pos)

    if (cameraView)
        updateCamera(offset)

    $.each(selected, function(i, d) {
        d3.selectAll('#spotlayer-' + d.id)
            .transition()
            .duration(duration)
            .attr('transform', 'translate(' + (x(d.data[dx][pos]) * (1 - offset) + x(d.data[dx][pos + 1]) * offset) + ',' + (y(d.data[dy][pos]) * (1 - offset) + y(d.data[dy][pos + 1]) * offset) + ')')
            .ease('linear')
        d3.selectAll('#year-' + d.id)
            .transition()
            .duration(duration)
            .attr('transform', 'translate(' + (x(d.data[dx][pos]) * (1 - offset) + x(d.data[dx][pos + 1]) * offset) + ',' + (y(d.data[dy][pos]) * (1 - offset) + y(d.data[dy][pos + 1]) * offset) + ')')
            .ease('linear')
    })

    if (offset == 1) {
        pos += 1;
    }
}

function updateSelected(offset) {
    //if it is outlier, cut off the transition
    //if the begin and end belong to different edge, then no transition
    var camerax = cpath[pos].x * (1 - offset) + cpath[pos + 1].x * offset
    var cameray = cpath[pos].y * (1 - offset) + cpath[pos + 1].y * offset
    var cameraz = cpath[pos].z * (1 - offset) + cpath[pos + 1].z * offset

    d3.selectAll('#selectedlayer .bubble').each(function(d) {
        d.posx = x(d.data[dx][pos]) * (1 - offset) + x(d.data[dx][pos + 1]) * offset
        d.posy = y(d.data[dy][pos]) * (1 - offset) + y(d.data[dy][pos + 1]) * offset
        d.textalign = 'middle'
        d.textx = 0
        d.texty = radius(d.data.pop[pos]) + 10
        if ((d.posx - camerax) * cameraz < -width / 2) {
            d.posx = -width / 2 + camerax
            d.area = 1
            d.textx = radius(d.data.pop[pos])
            d.textalign = 'start'
        } else if ((d.posx - camerax) * cameraz > width / 2) {
            d.posx = width / 2 + camerax
            d.area = 3
            d.textx = -radius(d.data.pop[pos])
            d.textalign = 'end'
        }
        if ((d.posy - cameray) * cameraz > height / 2) {
            d.posy = height / 2 + cameray
            d.area = 4
            d.texty = -radius(d.data.pop[pos])
        } else if ((d.posy - cameray) * cameraz < -height / 2) {
            d.posy = -height / 2 + cameray
            d.area = 2
            d.texty = 8 + radius(d.data.pop[pos])
        }
    })

    d3.selectAll('#selectedlayer .bubble')
        .transition()
        .duration(duration)
        .attr('transform', function(d) {
            return 'translate(' + d.posx + ',' + d.posy + ')'
        })
        .ease('linear')

    d3.selectAll('#selectedlabellayer .label')
        .transition()
        .duration(duration)
        .attr('transform', function(d) {
            return 'translate(' + d.posx + ',' + d.posy + ')'
        })
        .ease('linear')
        .attr('y', function(d) {
            return d.texty
        })
        .attr('x', function(d) {
            return d.textx
        })
        .style('text-anchor', function(d) {
            return d.textalign
        })
}

