size = 300
x = d3.scale.linear().range([0, size])
y = d3.scale.linear().range([size, 0])
dx = 'ppp'
dy = 'le'
start = 45
end = 101

$(function () {
    color = function (d) {
        switch (d) {
            case 'Sub-Saharan Africa': return 'blue';
            case 'South Asia': return '#46DCFA';
            case 'Middle East & North Africa': return '#57FA37';
            case 'America': return '#C6ED05';
            case 'Europe & Central Asia': return 'orange';
            case 'East Asia & Pacific': return 'red';
        }
    }

    $('.dims').change(function () {
        dx = $('select[name=dx]').find(':selected').val()
        dy = $('select[name=dx]').find(':selected').val()
        x.domain([d[dx].min, d[dx].max])
        y.domain([d[dy].min, d[dy].max])
        d3.selectAll('.multitrack').attr('d', function (d) { return createLine(d.data) })
    })

    $("#timewindow").slider({
        range: true,
        min: 0,
        max: 101,
        values: [45, 101],
        slide: function (event, ui) {
            $("#timewindow-text").text("year" + (1900 + ui.values[0]) + " - " + (1900 + ui.values[1]));
            start = ui.values[0]
            end = ui.values[1]
            d3.selectAll('.multitrack').attr('d', function (d) { return createLine(d.data) })
        }
    });

    d3.json('config.json', function (d) {
        x.domain([d[dx].min, d[dx].max])
        y.domain([d[dy].min, d[dy].max])

        $("#popfilter").slider({
            range: true,
            min: Math.log(d.pop.min),
            max: Math.log(d.pop.max)+0.1,
            step: 0.1,
            values: [Math.log(d.pop.max) / 2, Math.log(d.pop.max) + 0.1],
            slide: function (event, ui) {
                $("#popfilter-text").text("poplation between " + Math.floor(Math.exp(ui.values[0])/1000)*1000 + " and " + Math.floor(Math.exp(ui.values[1])/1000)*1000);
                d3.selectAll('.multiviewbox').each(function (d) {
                    if (Math.log(d.data.pop[end]) > ui.values[0] && Math.log(d.data.pop[end]) < ui.values[1])
                        $(this).show()
                    else
                        $(this).hide()
                })
            }
        });
    })

    d3.json('data.json', function (d) {
        //sort by continent and population
        d.sort(function (a, b) {
            tmp = a.continent.localeCompare(b.continent)
            if (tmp == 0)
                return -a.data.pop[end] + b.data.pop[end];
            else
                return tmp
        })

        svg = d3.select('#multi').selectAll('view')
        .data(d).enter()
        .append('div')
        .style('background', function (d) { return d3.scale.linear().range(['white', color(d.continent)]).domain([0, 1])(0.2) })
        .attr('class', 'multiviewbox')
        .append('svg')
        .attr('viewBox', '0 0 ' + size + ' ' + size)

        svg.append('text')
        .text(function (d) { return d.name })
        .attr('x', size / 2)
        .attr('y', size / 2)
        .style("font-size", "25px")
        .style('stroke', 'black')
        .attr('text-anchor', 'middle')

        svg
        .append('path')
        .attr('class', 'multitrack')
        .attr('stroke', function (d) { return color(d.continent) })
            .attr('stroke-width', 5)
            .attr('fill', 'none')
        .attr('d', function (d) { return createLine(d.data) })
    })
});

function createLine(d) {
    line = []
    for (i = start; i < end; i++) {
        line.push({'x':x(d[dx][i]),'y':y(d[dy][i])})
    }
    return lineChartFunction(line)

}

var lineChartFunction = d3.svg.line()
        .x(function (d) { return d.x })
        .y(function (d) { return d.y })
        .interpolate("linear");