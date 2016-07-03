if (typeof paper == "undefined") {
    width = 1280
    height = 705
} else {
    width = 700
    height = 500
}

begin = 1900
end = 2011
pos = 0
oldpos = -1

smallunit = 800;
duration = 2000 / $('#speedrange').val() //slow motion end
oldscrollpos = -1
distmax = 1000;

cpath = null
path = null
configdata = null
bubbledata = null

log100 = Math.log(100)
logbase = Math.log(75000) - log100

selected = null

distwithscale = patternLabel == 1 ? width : height / 3

dragx = 0
dragy = 0
dx = 'ppp'
dy = 'le'

toolbar = {}

axislabel = {
    'ppp': 'Average Income',
    'le': 'Life Expectancy',
    'kids': 'Children per Woman',
    'mortal': 'Child Mortality'
}

radius = d3.scale.sqrt().range([5, 30])
x = d3.scale.linear()
y = d3.scale.linear()

color = function(d) {
    switch (d) {
        case 'Sub-Saharan Africa':
            return 'blue';
        case 'South Asia':
            return '#46DCFA';
        case 'Middle East & North Africa':
            return '#57FA37';
        case 'America':
            return '#C6ED05';
        case 'Europe & Central Asia':
            return 'orange';
        case 'East Asia & Pacific':
            return 'red';
    }
}

$(window).on('load', function() {
    setupMulti()
    setupCanvas()
    setupglobal()
    var configfile = 'config.json'
    var datafile = 'data.json'

    d3.json(configfile, function(d) {
        configdata = d
        radius.domain([d.pop.min, d.pop.max])

        d3.json(datafile, function(data) {
            bubbledata = data

            if (typeof initialpos == "undefined") {
                pos = Math.min(Math.floor($(window).scrollTop() / smallunit), end - 1)
            } else {
                scrollflag = false;
                pos = initialpos - begin
                $(window).scrollTop(pos * smallunit);
            }

            setupToolbar()
            globalview()
            linechart('x')
            linechart('y')
            mainview()
        })
    })
    $('#data_source').hide()
    $('#foot').hide()
    tid = setTimeout(mycode, 500);
}).keydown(function(event) {
    //key board hotkey
    if (event.keyCode == 37) //left arrow, step backward
    {
        moveonestep(-1)
    } else if (event.keyCode == 39) //right arrow, step forward
    {
        moveonestep(1)
    } else if (event.keyCode == 187) { //zoom in +
        if (toolbar.scale < 20)
            changeScale(toolbar.scale + 0.2)
    } else if (event.keyCode == 189) { //zoom out -
        if (toolbar.scale > 1)
            changeScale(toolbar.scale - 0.2)
    } else if (event.keyCode == 80) { //P, play / pause
        autoplay()
    } else if (event.keyCode == 83) { //S, play stepwise with same speed
        moveonestep(1)
    }
})

//foot tool bar button
$(window).bind("load", function() {

    var footerTop = 0;
    var $footer = $("#foot");

    positionFooter();

    function positionFooter() {

        var chartwidth = $('#chart').height()

        $('#foot').css({
            width: $('#chartwrap').width()
        })
        $('#show_btn').css({
            top: ($(window).height() - 20) + 'px'
        })

        $footer.css({
            position: "fixed",
            top: $(window).height() - $('#foot').height()
        })
    }

    $(window)
        .scroll(positionFooter)
        .resize(positionFooter)
});