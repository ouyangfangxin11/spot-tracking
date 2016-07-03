var side_width = 300;
var g_x = d3.scale.linear().range([0, side_width])
var g_y = d3.scale.linear().range([side_width * 0.6, 15])

function setupglobal() {
    var g_svg = d3.select('#global')
        .append('svg')
        .attr('viewBox', '0 0 ' + (side_width + 30) + ' ' + (side_width * 0.6 + 20))
        .append('g')
        .attr('transform', 'translate(30,0)')

    //use svg path
    g_svg.append('defs')
        .append('clipPath')
        .attr('id', 'innerwin')
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', side_width)
        .attr('height', side_width * 0.6)
    g_svg.append('g').attr('id', 'globalbubblelayer')

    var spotlight = g_svg.append('g')
        .attr('clip-path', 'url(#innerwin)')
        .append('g')
        .attr('class', 'spotlight')
        .style('pointer-events', 'none')
        .attr('id', 'globalspotlight')
        .attr('opacity', 0.7)
        .append('g')
        .attr('opacity', 0.6)
        .attr('class', 'spotlightwrap')

    insize = distwithscale / initialscale * 0.3
    outsize = side_width * initialscale * 2
    spotlight.append('path')
        .attr('d', "M-" + outsize + ",-" + outsize + " " + outsize + ",-" + outsize + " " + outsize + "," + outsize + " -" + outsize + "," + outsize +
            " M-" + insize + ",0 a" + insize + "," + insize + " 0 0,0 " + insize * 2 + ",0 a " + insize + "," + insize + " 0 0,0 -" + insize * 2 + ",0")
        .attr('opacity', 0.7)

    insize += 5
    outsize = side_width * initialscale * 2
    spotlight.append('path')
        .attr('d', "M-" + outsize + ",-" + outsize + " " + outsize + ",-" + outsize + " " + outsize + "," + outsize + " -" + outsize + "," + outsize +
            " M-" + insize + ",0 a" + insize + "," + insize + " 0 0,0 " + insize * 2 + ",0 a " + insize + "," + insize + " 0 0,0 -" + insize * 2 + ",0")
        .attr('opacity', 0.3)
}

function globalview() {
    var globalbubblelayer = d3.select('globalbubblelayer')
    globalbubblelayer.selectAll('bubble')
        .data(bubbledata)
        .enter()
        .append('circle')
        .attr('class', 'globalbubble')
        .on('mouseover', function(d) {
            $(this).parent().append($(this))
            d3.select(this).attr('fill', color(d.continent))
                .attr('r', 10)
            d3.select('#globallabel')
                .text(d.name)
                .attr('fill', color(d.continent))
            $('#globallabel').show()
        })
        .on('mouseout', function() {
            $('#globallabel').hide()
            d3.select(this).attr('fill', function(d) {
                    return color(d.continent)
                })
                .attr('r', function(d) {
                    return radius(d.data.pop[pos]) / 6
                })
        })
        .on('click', function(d) {
            var bubble = d3.select(this)
            clickbubble(d, bubble, 1)
        })
        .on("contextmenu", function(d) {
            //stop showing browser menu
            d3.event.preventDefault();
            clickbubble(d, bubble, 2)
        });

    //the label, put aside because there will be overlapping
    globalbubblelayer.append('text')
        .attr('x', side_width / 2)
        .attr('y', side_width / 2 + 40)
        .attr('text-anchor', 'middle')
        .attr('font-size', 40)
        .attr('id', 'globallabel')

    $('#globallabel').hide()

    updateglobalAxis(dx, dy)
}

function lightup() {
    d3.selectAll('.globalbubble')
        .attr('fill', function(d) {
            return color(d.continent)
        })
}

function updateglobalAxis(dx, dy) {
    g_x.domain([configdata[dx].min, configdata[dx].max])
    g_y.domain([configdata[dy].min, configdata[dy].max])

    //the axises
    var g_xAxis = d3.svg.axis().scale(g_x).orient('bottom')
    var g_yAxis = d3.svg.axis().scale(g_y).orient('left')
        //customize ticks for ppp and le
    if (dx == 'ppp' || dy == 'ppp') {
        var tValue1 = {}
        $.each([400, 800, 2000, 6000, 20000, 80000], function(i, d) {
            tValue1[(Math.log(d) - log100) / logbase] = d
        });
        if (dx == 'ppp') {
            g_xAxis.tickValues(Object.keys(tValue1))
                .tickFormat(function(d) {
                    return tValue1[d]
                })
        } else {
            g_yAxis.tickValues(Object.keys(tValue1))
                .tickFormat(function(d) {
                    return tValue1[d]
                })
        }
    }

    if (dx == 'le' || dy == 'le') {
        var tValue = {}
        $.each([20, 40, 60, 80], function(i, d) {
            tValue[(d - 20) / 65] = d
        });
        if (dx == 'le') {
            g_xAxis
                .tickValues(Object.keys(tValue))
                .tickFormat(function(d) {
                    return tValue[d]
                })
        } else {
            g_yAxis
                .tickValues(Object.keys(tValue))
                .tickFormat(function(d) {
                    return tValue[d]
                })
        }
    }

    var g_svg = d3.select('#global').select('svg').select('g')
    $('.g_axis').empty()

    g_svg.append('g')
        .attr('class', 'g_axis')
        .attr('transform', 'translate(0,' + side_width * 0.6 + ')')
        .call(g_xAxis)

    g_svg.append('g')
        .attr('class', 'g_axis')
        .call(g_yAxis)
}

function updateglobalsence(pos) {
    if (selected == null || selected.length == 0)
        return
    pos = 2011 < pos ? 2011 : pos

    $.each(selected, function(i, select) {
        d3.select('#globalspotlight' + select.id)
            .transition()
            .attr('transform',
                'translate(' + g_x(select.data[dx][pos]) + ', ' + g_y(select.data[dy][pos]) + ')')
    })


    d3.selectAll('.globalbubble')
        .transition()
        .attr('fill', function(d) {
            if (d.visited > 10 || d.light < 0)
                return color(d.continent)
            else
                return d3.scale.linear().range(['black', color(d.continent)]).domain([-2, 10])(d.visited)
        })
        .attr('r', function(d) {
            return radius(d.data.pop[pos]) / 6
        })
        .attr('cx', function(d) {
            return g_x(d.data[dx][pos])
        })
        .attr('cy', function(d) {
            return g_y(d.data[dy][pos])
        })
        .attr('stroke', function(d) {
            if (d.light < 0)
                return 'yellow'
            else
                return 'none'
        })
        .attr('stroke-width', '2px')
}