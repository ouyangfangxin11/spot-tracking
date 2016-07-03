side_height = 100
x_time = d3.scale.linear().range([0, side_width])
line_scale = {
    'x': d3.scale.linear().range([side_height, 0]),
    'y': d3.scale.linear().range([side_height, 0])
}

function linechart(axis) {
    x_time.domain([configdata.year.min - begin, configdata.year.max - begin])

    //range label
    d3.select('.linechart[data-axis=' + axis + ']')
        .append('div')
        .attr('class', 'linelabel title')

    linesvg = d3.select('.linechart[data-axis=' + axis + ']')
        .append('svg')
        .attr('viewBox', '0 0 ' + (side_width+30) + ' ' + side_height)
        .append('g')
        .attr('transform', 'translate(30,0)')

    cliparea = linesvg
        .append('defs')
        .append('clipPath')
        .attr('id', axis + '_clip')

    tmp = Array.apply(null, Array((configdata.year.max - configdata.year.min))).map(Number.prototype.valueOf, 0);

    
    cliparea
        .selectAll('clip_step')
        .data(tmp).enter()
        .append('rect')
        .attr('class', function (d, i) { return 'clip_step clip_step' + i })
        .attr('x', function (d, i) { return side_width / (configdata.year.max - configdata.year.min) * i })
        .attr('y', y)
        .style('stroke-width', 1)
        .attr('height', side_height)
        .attr('width', side_width / (configdata.year.max - configdata.year.min))

    ////axis, only the peak value
    //linesvg.append('path')
    //    .style('stroke-width', 2)
    //    .attr('fill', 'none')
    //    .style('stroke','black')
    //    .attr('d', lineChartFunction([
    //    { 'x': 30, 'y': side_height },
    //    { 'x': side_width, 'y': side_height}
    //    ]))
}

function updateLineSelect(showlist) {
    if (showlist.length == 1)
        $('.clip_step').show()

    d3.selectAll('.pathwrap').remove()

    $('.linechart').each(function () {
        axis = $(this).attr('data-axis')
        dim = $(this).attr('data-dim')

        pathwarp = d3.select(this)
            .select('svg').select('g')
            .selectAll('pathwrap')
            .data(showlist)
            .enter()
            .append('g')
            .attr('class', 'pathwrap')
            .on('mouseover', function (d) {
                coordinates = d3.mouse(this);
                d3.select(this).selectAll('path')
                    .style('stroke-width', '5px')
                d3.select(this).selectAll('.linelabel')
                    .attr('x', coordinates[0])
                    .attr('y', coordinates[1])
                    .style('visibility', 'visible')
                d3.select(this).selectAll('.lineyear')
                    .attr('x', coordinates[0])
                    .text(Math.round(x_time.invert(coordinates[0]))+begin)
                    .style('visibility', 'visible')
                
            })
            .on('mouseout', function (d) {
                d3.select(this).selectAll('path')
                    .style('stroke-width', '2px')
                
                d3.select(this).selectAll('text')
                    .style('visibility', 'hidden')

                d3.select(this).selectAll('.lineyear')
                    .style('visibility', 'hidden')

            })
            .on('click', function (d) {                
                rolltoPos(Math.round(x_time.invert(d3.mouse(this)[0])))
            })

        //frontier
        pathwarp.append('path')
            .attr('class', 'linechart')
            .attr('d', function (d) {
                return createLine(d.data[dim], axis)
            })
            .style('stroke', function (d) { return color(d.continent) })
            .style('stroke-width', '2px')
            .attr('fill', 'none')

        // shadow
        pathwarp.append('path')
            .attr('class', 'linechart')
            .attr('d', function(d){
                return createLine(d.data[dim], axis)
            })
            .style('stroke', 'grey')
            .style('stroke-width', '3px')
                .attr('opacity', 0.8)
            .attr('fill', 'none')
            .attr('clip-path', 'url(#' + axis + '_clip)')

        // line label
        pathwarp.append('text')
            .attr('class', 'linelabel')
            .text(function (d) { return d.name })
            .style('visibility', 'hidden')
            .style('pointer-events', 'none')

        //year label
        pathwarp.append('text')
            .attr('class', 'lineyear')
            .style('visibility', 'hidden')
            .attr('y', side_height)
            .style('pointer-events', 'none')

        //current niddle
        pathwarp.append('line')
            .attr('class','niddle')
            .attr('x1', 0)
            .attr('x2', 0)
            .attr('y1', 0)
            .attr('y2', side_height)
            .style('stroke', 'grey')
            .style('stroke-width', '1px')
            .attr('transform', 'translate(' + pos * side_width / (configdata.year.max - configdata.year.min) + ')')
    })
}

function updateLineDim(dim, axis) {
    $(this).attr('data-dim', dim)
    line_scale[axis].domain([configdata[dim].min, configdata[dim].max])

    wrap = d3.select('.linechart[data-axis=' + axis + ']')

    wrap.selectAll('.linelabel').text(dim)

    wrap
        .selectAll('.linechart')
        .attr('d', function (d) {
            return createLine(d.data[dim], axis)
        })

    wrap.selectAll('svg')
    .each(function (d) {
        //update axis
        l_yAxis = d3.svg.axis().scale(line_scale[axis]).orient('left')
        //customize ticks for ppp and le
        if (dim == 'ppp') {
            var tValue1 = {}
            $.each([400, 1500, 6000, 20000, 80000], function (i, d) {
                tValue1[(Math.log(d) - log100) / logbase] = d
            });
            l_yAxis
                .tickValues(Object.keys(tValue1))
                .tickFormat(function (d) {
                    tmp = d3.formatPrefix(tValue1[d])
                    return tmp.scale(tValue1[d]).toFixed() + tmp.symbol
                })
        }
        else if (dim == 'le') {
            var tValue = {}
            $.each([10, 30, 50, 70], function (i, d) {
                tValue[(d - 20) / 65] = d
            });
            l_yAxis
                .tickValues(Object.keys(tValue))
                .tickFormat(function (d) { return tValue[d] })
        }

        d3.select(this).append('g')
            .attr('class', 'g_axis')
            .attr('transform', 'translate(32,0)')
            .call(l_yAxis)
    })

    wrap.select('div').text(axislabel[dim])
}

function updateLineScence(pos) {
    if (configdata == null)
        return 
    //move current niddle
    d3.selectAll('.niddle').attr('transform', 'translate(' + pos * side_width / (configdata.year.max - configdata.year.min) + ')')
    //hide the pos
    $('.clip_step'+pos).hide()
}

function createLine(d, axis) {
    line = []
    $.each(d, function (time, value) {
        line.push({ 'x': x_time(time), 'y': line_scale[axis](value) })
    })
    return lineChartFunction(line)

}

var lineChartFunction = d3.svg.line()
        .x(function (d) { return d.x })
        .y(function (d) { return d.y })
        .interpolate("linear");