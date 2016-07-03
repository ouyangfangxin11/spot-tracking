function createBubbleLayer() {
    var bubble = d3.select('#bubblelayer').selectAll('bubble')
        .data(bubbledata)
        .enter()
        .append('g')
        .attr('class', 'bubble')
        .attr('id', function(d) {
            d.light = 0;
            d.area = 0
            return 'bubble-' + d.id;
        })

    bubble.append('circle')
        .attr('class', 'dot')
        .attr('cx', 0)
        .attr('cy', 0)
        .style('fill', 'lightgrey')
        .style('stroke', 'grey')
        .attr('r', 3)
        .on('mouseover', function(d) {
            if (d.light != 0)
                return
                //add to the bubble layer and change (so there is no reorder)
            $('#selectedlayer').append($('#bubble-' + d.id))
            d3.select(this)
                .attr('r', function(d) {
                    return radius(d.data.pop[pos]);
                })
                .style('fill', function(d) {
                    return color(d.continent)
                })
                //show label
            $('#selectedlabellayer').append($('#label-' + d.id))
            $('#label-' + d.id).show()
        })
        .on('mouseout', function(d) {
            if (d.light != 0)
                return
                //remove from the label layer and add back to bubble layer
            $('#labellayer').append($('#label-' + d.id))
            $('#bubblelayer').append($('#bubble-' + d.id))
            $('#label-' + d.id).hide()

            if (d.rel > distwithscale) {
                d3.select(this).attr('r', 3).style('fill', 'lightgrey')
            } else {
                d3.select(this)
                    .attr('r', function(d) {
                        if ($('input:checkbox[name="size"]').is(':checked'))
                            return radius(d.data.pop[pos])
                        else
                            return 3
                    })
                    .style('fill', function(d) {
                        if ($('input:checkbox[name="color"]').is(':checked'))
                            return color(d.continent)
                        else
                            return 'lightgrey'
                    })
            }
        }) //modify
        .on('click', function(d) {
            var bubble = d3.select(this)
            clickbubble(d, bubble, 1)
        })
        .on("contextmenu", function(d) {
            //stop showing browser menu
            d3.event.preventDefault();
            var bubble = d3.select(this)
            clickbubble(d, bubble, 2)
        });
}

function updateBubble(offset) {
    var sizecheck = $('input:checkbox[name="size"]').is(':checked');
    var colorcheck = $('input:checkbox[name="color"]').is(':checked');

    d3.selectAll('#bubblelayer .bubble')
        .transition()
        .duration(duration)
        .attr('transform', function(d) {
            return 'translate(' + (x(d.data[dx][pos]) * (1 - offset) + x(d.data[dx][pos + 1]) * offset) + ',' + (y(d.data[dy][pos]) * (1 - offset) + y(d.data[dy][pos + 1]) * offset) + ')'
        })
        .ease('linear')

    var dur2 = Math.min(duration, 800)
    d3.selectAll('.dot')
        .transition()
        .duration(dur2)
        .attr('r', function(d) {
            if (d.light != 0) //pattern highlighted
                return radius(d.data.pop[pos])
            else if (sizecheck && d.rel < distwithscale) //neighbor with condition
                return radius(d.data.pop[pos])
            else
                return 3
        })
        .style('fill', function(d) {
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
        .attr('transform', function(d) {
            return 'translate(' + (x(d.data[dx][pos]) * (1 - offset) + x(d.data[dx][pos + 1]) * offset) + ',' + (y(d.data[dy][pos]) * (1 - offset) + y(d.data[dy][pos + 1]) * offset) + ')'
        })
        .ease('linear')
        .attr('y', function(d) {
            return radius(d.data.pop[pos]) + 10
        })
        .each(function(d) {
            if (d.light != 0 || (d.rel < distwithscale && ($.inArray(d.id, highlightlist) >= 0 || patternLabel == 2))) //pattern highlighted
                $(this).show()
            else
                $(this).hide()
        })
}

function clickbubble(d, bubble, flag) {
    if (flag == 1) {
        if (clickevent == 2) {
            //put secondarylist on top of selected
            $.each(selected, function(i, select) {
                if (select.id == d.id)
                    return;
            })
            if (bubble.style('stroke-width') != '1px') {
                if (multiflag) {
                    addtoSelectedlist(d)
                } else {
                    resetSelectedbubble(d)
                }
            } else {
                addtoSecondarylist(d)
            }
        }
    } else if (flag == 2) {
        //handle right click
        $.each(selected, function(i, select) {
            if (select.id == d.id) {
                if (selected.length == 1)
                    return;
                resetSelectedbubble(d)
            }
        })
        if (bubble.style('stroke-width') != '1px') {
            removeSecondarylist(d)
        }
    };
}

function addtoSecondarylist(d) {
    $('#selectedlayer').append($('#bubble-' + d.id))
    d.light = -1;
    d3.selectAll('#bubble-' + d.id + ' circle')
        .style('stroke', 'yellow')
        .style('stroke-width', 2)

    $('#selectedlabellayer').append($('#label-' + d.id))
    $('#label-' + d.id).show()

    //update sidelist
    var showlist = []
    $.each(selected, function(i, d) {
        showlist.push(d)
    })
    d3.selectAll('#selectedlayer .bubble').each(function(d) {
        showlist.push(d)
    })
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
    var showlist = selected
    d3.selectAll('#selectedlayer .bubble').each(function(d) {
        showlist.push(d)
    })
    updateLineSelect(showlist)
}

function cleanlist() {
    $('#selectedlayer .bubble').each(function(d) {
        $('#bubblelayer').append(this)
            .style('stroke', 'grey')
            .style('stroke-width', 1)
        d.light = 0

    })
    $('#selectedlabellayer .label').each(function(d) {
        $('#labellayer').append(this)
    })

    //update sideline 
    updateLineSelect(selected)
}

function resetSelectedbubble(d) {

    selected = [d]
    cleanlist()

    resetBubblelight();

    //reset visit list
    bubbledata.forEach(function(d) {
        d.visited = 0
    })
    selected[0].visited = 1000

    //move the spotlight layer
    d3.selectAll('#spotlayer-' + selected[0].id).attr('transform', d3.select('#bubble-' + selected[0].id).attr('transform'))
    d3.selectAll('#year-' + selected[0].id).attr('transform', d3.select('#bubble-' + selected[0].id).attr('transform'))

    resetStage()
}

function addtoSelectedlist(d, bubble) {
    select = d
        //add selected bubble into the bubble layer
    $('#bubblelayer').append($('#bubble-' + select.id))
    select.light = -1;
    select.visited = 1000

    d3.selectAll('#spotlayer-' + select.id).attr('transform', d3.select('#bubble-' + select.id).attr('transform'))
    d3.selectAll('#year-' + select.id).attr('transform', d3.select('#bubble-' + select.id).attr('transform'))


    resetSelectedHighlight()

    selected.push(select)
    resetStage()
}

function removeSelectedlist(d) {
    select = d
    delete select.light
    select.visited = 0

    //reset highlighting edge
    d3.selectAll('.dot')
        .style('stroke', function(d) {
            if (d.id == select.id)
                return ' grey'
        })
        .style('stroke-width', function(d) {
            if (d.id == select.id)
                return 1
        })
    var tmp = []
    $.each(selected, function(i, d) {
        if (d.id != select.id) {
            tmp.push(d)
        };
    })
    selected = tmp
    resetStage()
}

//called when the scale is changes, the selected bubble is change, or the event is changed
function resetBubblelight() {
    d3.selectAll('bubblelayer .bubble').each(function(d) {
        delete d.light;
    })
    $.each(selected, function(i, d) {
        d.light = -1;
    })
}

function resetSpotLayer() {
    $('#spotlayerwrap').empty()
    var spotlayerwrap = d3.select('#spotlayerwrap')
    $.each(selected, function(i, d) {
        spotlayerwrap.append('circle')
            .attr('r', distwithscale)
            .attr('id', 'spotlayer-' + d.id)
            .attr('class', 'light')
    })
}

function resetSelectedHighlight() {
    d3.selectAll('.dot')
        .style('stroke', function(d) {
            $.each(selected, function(i, select) {
                if (d.id == select.id)
                    return ' yellow'
            })
            return 'grey'
        })
        .style('stroke-width', function(d) {
            $.each(selected, function(i, select) {
                if (d.id == select.id)
                    return 3
            })
            return 1
        })
}