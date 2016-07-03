function createLabelLayer() {
    d3.select('#labellayer').selectAll('label')
        .data(bubbledata)
        .enter()
        .append('text')
        .attr('class', 'label noselect')
        .attr('id', function(d) {
            return 'label-' + d.id
        })
        .attr('x', 0)
        .attr('y', function(d) {
            return radius(d.data.pop[pos])
        })
        .text(function(d) {
            return d.name
        })
        .attr('text-anchor', 'middle')
        .style('stroke', 'black')
        .style('stroke-width', 0.5)
        .style("font-size", "12px")
        .style('pointer-events', 'none')
        .style('font-family', 'Verdana')
        .style('fill', function(d) {
            return color(d.continent)
        })
}

function updateLabelByMotion() {
    if (pos == oldpos)
        return
    oldpos = pos

    //fade the highlighting each time the function is called
    $.each(bubbledata, function(i, d) {
        if ('light' in d && d.light > 0) {
            d.light = 0;
        }
        delete d.compare
    })

    $.each(path, function(i, tpath) {
        var selectpos = {
            'x1': tpath[pos].x,
            'y1': tpath[pos].y,
            'x2': tpath[pos + 1].x,
            'y2': tpath[pos + 1].y,
        }

        //the defaule vaule of highlight life circle
        event = $('input:radio[name="lightevent"]:checked').val();
        var selectdist = mydist(selectpos.x1, selectpos.y1, selectpos.x2, selectpos.y2)
        var tmp = []

        $.each(bubbledata, function(k, d) {
            if (d.light < 0)
                return true

            var c = {
                'x1': x(d.data[dx][pos]),
                'x2': x(d.data[dx][pos + 1]),
                'y1': y(d.data[dy][pos]),
                'y2': y(d.data[dy][pos + 1]),
            }

            var d1x = c.x1 - selectpos.x1
            var d2x = c.x2 - selectpos.x2
            var d1y = c.y1 - selectpos.y1
            var d2y = c.y2 - selectpos.y2

            var t = -(d2x * (d1x - d2x) + d2y * (d1y - d2y)) / ((d1x - d2x) * (d1x - d2x) + (d1y - d2y) * (d1y - d2y))
            var rel = -1
            if (t > 1) {
                rel = mydist(selectpos.x1, selectpos.y1, c.x1, c.y1)
            } else if (t < 0) {
                rel = mydist(selectpos.x2, selectpos.y2, c.x2, c.y2)
            } else {
                rel = mydist(
                    c.x1 * t + c.x2 * (1 - t),
                    c.y1 * t + c.y2 * (1 - t),
                    selectpos.x1 * t + selectpos.x2 * (1 - t),
                    selectpos.y1 * t + selectpos.y2 * (1 - t)
                )
            }

            if (event == 'close') {
                d['compare'] = rel
                tmp.push(d)
            }

            //should be in the view, must be faster when view movement
            if (event == 'fast') {
                if (rel < distwithscale) {
                    d['compare'] = -mydist(c.x1, c.y1, c.x2, c.y2)
                    tmp.push(d)
                }
            }
            d.rel = rel

            // if the bubble is in the view, update visited flag
            if (rel < distwithscale) {
                d.visited += 1
            }
        })

        tmp.sort(function(a, b) {
            if (a.compare < b.compare)
                return -1
            else if (a.compare == b.compare)
                return b.data.pop[pos] - a.data.pop[pos]
            else
                return 1
        })

        //relation distance is distance to the center bubble on each step
        //absolute is the exact position at this position
        // ????
        filter = parseInt($('#filterrange').val())
        tmp.forEach(function(d, i) {
            if (i >= Math.min(filter, tmp.length))
                return false;
            d.light = 1
            tmp.push(d)
        })

        //reorder bubbles by current size
        tmp.sort(function(a, b) {
            return b.data.pop[pos] - a.data.pop[pos]
        })
        tmp.forEach(function(d) {
            $('#bubble-' + d.id).parent().append($('#bubble-' + d.id));
        })
    })
}

//interface called during pause
function updateLabelByDistance() {
    var viewlist = []
    var nodes = []
    d3.selectAll('#bubblelayer .bubble').each(function(d) {
        if (d.light < 0)
            return true

        if (Math.abs(cpath[pos].x - x(d.data[dx][pos])) < width / 2 && Math.abs(cpath[pos].y - y(d.data[dy][pos])) < height / 2)
            viewlist.push(d)
    })
    if (viewlist.length > 0) {
        viewlist.sort(function(b, a) {
            return a.data.pop[pos] - b.data.pop[pos]
        })
        viewlist = viewlist.slice(0, Math.min($('#filterrange').val(), viewlist.length))

        d3.selectAll('#bubblelayer .dot')
            .each(function(d) {
                if (viewlist.indexOf(d) >= 0) {
                    d.light = 1
                    nodes.push(d)
                }
            })
    }
    if (nodes.length > 0) {
        //if highlight flag is changed, reorder bubbles by current size
        nodes.sort(function(a, b) {
            return b.data.pop[pos] - a.data.pop[pos]
        })
        nodes.forEach(function(d) {
            $('#bubble-' + d.id).parent().append($('#bubble-' + d.id));
        })
    }
}

function createYearLayer() {
    d3.select('#yearlayer').selectAll('year')
        .data(bubbledata)
        .enter()
        .append('text')
        .attr('class', 'year noselect')
        .attr('id', function(d) {
            return 'year-' + d.id
        })
        .attr('x', 0)
        .attr('y', 0)
        .style("font-size", "25px")
        .style('stroke', 'black')
        .attr('text-anchor', 'middle')      
}

function updateYearLabel() {

    $('li').removeClass('hover')
    $('a[title="' + (pos + begin) + '"]').parent().addClass('hover')

    // go to current position
    $('#article').animate({
        'margin-top': -smallunit * (pos) + 500
    })

    d3.selectAll('#yearlayer .year')
        .each(function(d) {
            if (d.light != 0 || (d.rel < distwithscale && ($.inArray(d.id, highlightlist) >= 0 || patternLabel == 2))) //pattern highlighted
                $(this).show()
            else
                $(this).hide()
        })

    $.each(selected, function(i, select) {
        d3.select('#year-' + select.id)
            .text(pos + begin)
            .attr('y', -radius(select.data.pop[pos]))
            .style('fill', color(select.continent))
    })
}