var tid;
function updateSenceUI() {
    if (bubbledata == null)
        return
    // if not scrolled
    if (oldscrollpos == $(window).scrollTop()) {
        return
    }
    oldscrollpos = $(window).scrollTop()

    //scroll trigger by other operation
    if (scrollflag == false) {
        scrollflag = true
    } else {
        //interupt current tranisition
        pause()

        //stop the autoplay
        if (autoflag == true) {
            autoflag = false
        } else {
            //move to current position
            duration = 500
            scrollpos = $(window).scrollTop();
            oldpos = pos

            pos = Math.floor(scrollpos / smallunit)
            if (pos > end - begin) {
                pos = end - begin
                scrollflag = false
                $(window).scrollTop(pos * smallunit);
                return
            }

            offset = scrollpos % smallunit / smallunit
            updateSence(offset)
        }
    }
}

function mycode() {
    updateSenceUI()
    tid = setTimeout(mycode, 500); // repeat myself
}

function abortTimer() { // to be called when you want to stop the timer
    clearTimeout(tid);
}

function moveonestep(direct) {
    var v = $('#speedrange').val(); // * 1000 / mydist(path[pos].x, path[pos].y, path[pos+direct].x, path[pos+direct].y);
    duration = distmax / v;

    // duration = $('#speedmax').val();
    // dist = mydist(path[pos].x, path[pos].y, path[pos + direct].x, path[pos + direct].y)
    // duration = dist > duration ? dist: (duration>500?duration:500)
    pos += direct;
    $(window).scrollTop(pos * smallunit);
    scrollflag = false;

    updateSence(0);

    return duration
}

function rolltoPos(p) {
    scrollflag = false
    pos = p
    pos = pos > 111 ? 111 : pos;
    $(window).scrollTop(pos * smallunit);
    scrollflag = false
    updateSence(-2);
}

function autoplay() {
    if (autoflag) { //stop
        autoflag = false
    } else {
        autoflag = true
        moveforward()
    }
}

function moveforward() {
    if (autoflag) {
        duration = moveonestep(1)
        setTimeout(moveforward, duration)
    }
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

    d3.selectAll('.year')
    .transition()
    .duration(0)

    d3.selectAll('.light')
    .transition()
    .duration(0)

    d3.selectAll('.label')
    .transition()
    .duration(0)

    d3.selectAll('.axis')
    .transition()
    .duration(0)
}