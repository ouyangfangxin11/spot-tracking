var multi_size = 80;
var scales;
var wa;

function setupMulti() {
    d3.json('wa.json', function(d) {
        wa = d;
        //get dimension names and create panel
        var dims = Object.keys(wa[0].data);
        var views = []

        for (i = 0; i < dims.length; i++) {
            for (j = i + 1; j < dims.length; j++)
                views.push({
                    'x': dims[i],
                    'y': dims[j]
                })
        }
        //create multiple layout 
        var div = d3.select('#multi').selectAll('views')
            .data(views).enter()
            .append('div')
            .attr('class', 'multi')
            .style('width', Math.floor(100 / (views.length + 1)) + '%')
            .attr('title', function(d) {
                return JSON.stringify(d);
            }) //tooltip
            .on('click', function(d) {
                changeDimension(d.x, d.y)
            })

        var canvas = div.append('svg')
            .attr('viewBox', '0 0 ' + multi_size + ' ' + multi_size)
            .attr('width', '100%')

        //filp btn
        canvas.append('circle')
            .attr('r', 10)
            .attr('cx', 0)
            .attr('cy', multi_size)
            .attr('title', 'filp dimensions')
            .attr('fill', 'red')
            .on('click', function(d) {
                var tmp = d.x
                d.x = d.y
                d.y = tmp
                    //redraw the lines
                p = d3.select(this.parentNode)
                p.selectAll('.movepanel')
                    .each(
                        function() {
                            drawSMLines(d, this)
                        }
                    );
            })

        var msvg = canvas.append('g') //move the scale panel to the center
            .attr('class', 'scalepanel')
            .attr('transform', 'translate(' + multi_size / 2 + ',' + multi_size / 2 + ') scale(0.9)')
            .append('g')
            .attr('class', 'movepanel')

        //  get the domain of scale
        var domain = {}
        for (i = 0; i < wa.length; i++) {
            $.each(wa[i].data, function(k, v) {
                if (k in domain)
                    domain[k] = {
                        'max': Math.max(domain[k].max, d3.max(d3.values(v))),
                        'min': Math.min(domain[k].min, d3.min(d3.values(v)))
                    }
                else
                    domain[k] = {
                        'max': d3.max(d3.values(v)),
                        'min': d3.min(d3.values(v))
                    }

            })
        }

        scales = {}
        for (i = 0; i < dims.length; i++) {
            scales[dims[i]] = d3.scale.linear()
                .domain([domain[dims[i]].min, domain[dims[i]].max])
                .range([-multi_size / 2, multi_size / 2])
        }

        msvg.each(function(d) {
            drawSMLines(d, this)
        })
    })
}

function drawSMLines(dims, panel) {
    d3.select(panel).selectAll('*').remove()

    var xdim = dims.x
    var ydim = dims.y

    //axis labels
    d3.select(panel).append('g').attr('transform', 'translate(' + -multi_size / 2 + ', 0) rotate(90)')
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('font-size', 6)
        .text(function(d) {
            return axislabel[d.y]
        })

    d3.select(panel).append('g').attr('transform', 'translate(0, ' + multi_size / 2 + ')')
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('font-size', 6)
        .text(function(d) {
            return axislabel[d.x]
        })

    //overview path from begin to end, scale to current year
    var path = d3.select(panel)
        .selectAll('continentpath')
        .data(wa)
        .enter() //for each continent
        .append('g')

    path.append('path')
        .attr('stroke', function(d) {
            return color(d.continent);
        })
        .attr('fill', 'none')
        .attr('class', 'multipath')
        .attr('d', function(d) {
            linedata = []
            for (i = begin; i < end; i += 2) {
                linedata.push({
                    'x': scales[xdim](d.data[xdim][i]),
                    'y': -scales[ydim](d.data[ydim][i]),
                    'year': i
                })
            }
            d[xdim + ydim] = linedata;
            return lineFunction(linedata);
        })

    path.append('path')
        .attr('stroke', function(d) {
            return color(d.continent);
        })
        .attr('stroke-opacity', 0.1)
        .attr('fill', 'none')
        .attr('d', function(d) {
            return lineFunction(d[xdim + ydim]);
        })

    path
        .append('circle') //the start point in black
        .attr('r', 1)
        .attr('fill', 'black')
        .attr('transform', function(d) {
            return 'translate(' + scales[xdim](d.data[xdim][begin]) + ',' + -scales[ydim](d.data[ydim][begin]) + ')'
        })

    path
        .append('circle') //the start point in red
        .attr('r', 1)
        .attr('fill', 'red')
        .attr('transform', function(d) {
            return 'translate(' + scales[xdim](d.data[xdim][end]) + ',' + -scales[ydim](d.data[ydim][end]) + ')'
        })
}

function updateSMSence(pos) {
    //make before and after in different color
    d3.selectAll('.movepanel').each(function(dims) {
        var xdim = dims.x
        var ydim = dims.y
        d3.select(this).selectAll('.multipath')
            .attr('d', function(d) {
                return lineFunction(d[xdim + ydim].slice(0, Math.round(pos / 2)))
            })
    })
}

function setupToolbar() {
    //initial search tool
    var tags = []
    $.each(bubbledata, function(i, t) {
        tags.push({
            'label': t.name,
            'value': t
        })
    })
    $("#search").autocomplete({
        source: tags,
        focus: function(event, ui) {
            event.preventDefault();
            $("#tags").val(ui.item.label);
        },
        select: function(event, ui) {
            event.preventDefault();
            resetSelectedbubble(ui.item.value)
        }
    });
    //modify
    $('input:radio[name="camera"]').change(function() {
        resetStage()
    })

    toolbar['scale'] = initialscale
    //modify
    // $('#scalerange').change(function() {
    //     $('#scalelabel').text($('#scalerange').val())
    //     changeScale(parseFloat($('#scalerange').val()))
    // })
    // changeScale(parseFloat($('#scalerange').val()))

    $('#filterrange').change(function() {
        $('#filterlabel').text($('#filterrange').val())
        resetBubblelight()
    })

    toolbar['speed'] = 1
    $('#speedlabel').text($('#speedrange').val())
    $('#speedrange').change(function() {
        $('#speedlabel').text($('#speedrange').val())
    })

    $('input:checkbox[name="size"]').change(function() {
        if ($(this).is(':checked'))
            d3.selectAll('.dot').attr("r", function(d) {
                if (d.light != 0 || d.rel < distwithscale)
                    return radius(d.data.pop[pos])
                else
                    return 3;
            })
        else
            d3.selectAll('.dot').attr("r", function(d) {
                if (d.light == 0)
                    return 3
                return radius(d.data.pop[pos])
            })
    })

    $('input:checkbox[name="color"]').change(function() {
        if ($(this).is(':checked'))
            d3.selectAll('.dot').style("fill", function(d) {
                if (d.light != 0 || d.rel < distwithscale)
                    return color(d.continent)
                else
                    return 'lightgrery'
            })

        else
            d3.selectAll('.dot').style("fill", function(d) {
                if (d.light == 0)
                    return 'lightgrey'
                return color(d.continent)
            })
    })

    $('input:checkbox[name="trace"]').change(function() {
        if ($(this).is(':checked'))
            $('#bgtrack').show()
        else
            $('#bgtrack').hide()
    })

    $('input:checkbox[name="bgtexture"]').change(function() {
        if ($(this).is(':checked'))
            $('#background').show()
        else
            $('#background').hide()
    })

    $('input:checkbox[name="multi"]').change(function() {
        if ($(this).is(':checked')) {
            multiflag = true
        } else {
            multiflag = false
        }
    })

    $('#spotrange').change(function() {
        val = $('#spotrange').val()
        if (val > 0.2) {
            $('.spotlight').show()
            d3.selectAll('.spotlight').attr('opacity', val)
        } else {
            $('.spotlight').hide()
        }
    })

    $('#spotsizerange').change(function() {
        val = $('#spotsizerange').val()
        distwithscale = patternLabel == 1 ? height / 18 * val : height / 3 * val
        d3.selectAll('#chart .spotlightwrap').attr('transform', 'scale(' + val + ')')
        d3.selectAll('#global .spotlightwrap').attr('transform', 'scale(' + val / toolbar['scale'] * initialscale + ')')
    })

    //highlight optional
    $('input:radio[name="lightevent"]').change(function() {
        resetBubblelight()
    })

    //adjust interface for different page setting 
    if (cameraView == false) {
        s$('.cameratool').hide()
    }
}


var lineFunction = d3.svg.line()
    .x(function(d) {
        return d.x
    })
    .y(function(d) {
        return d.y
    })
    .interpolate("linear")

function data_source_btn() {
    $('#data_source').show()
    $('#toolbar_panel').hide()
}

function toolbar_btn() {
    $('#data_source').hide()
    $('#toolbar_panel').show()
}

function hide_btn() {
    $('#foot').hide()
}

function show_btn() {
    $('#foot').show()
}