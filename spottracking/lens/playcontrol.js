begin = 1900
end = 2011
pos = 0

smallunit = 800;
duration = 2000 / $('#speedrange').val() //slow motion end
scrollflag = true
oldscrollpos = -1
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
    }
    else {
        //interupt current tranisition
        pause()

        //stop the autoplay
        if (autoflag == true) {
            autoflag = false
        }
        else {
            //move to current position
            duration = 500
            scrollpos = $(window).scrollTop();
            oldpos = pos

            pos = Math.floor(scrollpos / smallunit)
            if (pos > end-begin) {
                pos = end - begin
                scrollflag = false
                $(window).scrollTop(pos * smallunit);
                return
            }

            offset = scrollpos % smallunit / smallunit
            updateSence(offset)
            
            //if (oldpos != pos) {
            //    if (Math.abs(oldpos - pos) > 1)
            //        updateSence(-1)
            //    else {
            //        //split the transition to half half
            //        if (pos > oldpos) {
            //            duration = duration / 2
            //            updateSence(0)
            //            setTimeout(function () {
            //                updateSence(offset)
            //                duration *= 2

            //            }, duration);
            //        }
            //        else {
            //            duration = duration / 2
            //            tmp = pos
            //            pos = oldpos
            //            updateSence(0)
            //            setTimeout(function () {
            //                pos = tmp
            //                updateSence(offset)
            //                duration *= 2
            //            }, duration);
            //        }
            //    }
            //}
            //else {
            //    updateSence(offset)
            //}
        }
    }
}

var tid;
function mycode() {
    updateSenceUI()
    tid = setTimeout(mycode, 500); // repeat myself
}

function abortTimer() { // to be called when you want to stop the timer
    clearTimeout(tid);
}

$(window).on('load', function () {
    setupMulti()
    setupCanvas()
    $('#data_source').hide()
    $('#foot').hide()
    tid = setTimeout(mycode, 500);
})
.keydown(function (event) {
    //key board hotkey
    if (event.keyCode == 37) //left arrow, step backward
    {
        moveonestep(-1)
    }
    else if (event.keyCode == 39) //right arrow, step forward
    {
        moveonestep(1)
    }
    else if (event.keyCode == 187) {//zoom in +
        if (toolbar.scale < 20)
            changeScale(toolbar.scale + 0.2)
    }
    else if (event.keyCode == 189) { //zoom out -
        if (toolbar.scale > 1)
            changeScale(toolbar.scale - 0.2)
    }
    else if (event.keyCode == 80) { //P, play / pause
        autoplay()
    }
    else if (event.keyCode == 83) { //S, play stepwise with same speed
        moveonestep(1)
    }
})

function moveonestep(direct) {
    duration = 3000 / $('#speedrange').val()
    dist = mydist(path[pos].x, path[pos].y, path[pos + direct].x, path[pos + direct].y)
    duration = dist > duration ? dist: (duration>500?duration:500)
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

//start / stop autoplay
autoflag = false;
function autoplay() {
    if (autoflag) { //stop
        autoflag = false
    }
    else {
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