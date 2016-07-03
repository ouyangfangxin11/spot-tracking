function changeCameraPath() {
    //reset camera path and important level basing on current path
    if (path == null || path.length == 0)
        return

    if (multiflag && path.length == 2) {
        setmultiCameraPos(path[0], path[1]);
    } else {
        switch ($('input:radio[name="camera"]:checked').val()) {
            case 'stage':
                setCameraPos2(path[0]);
                break;
            case 'follow':
                setCameraPos1(path[0]);
                break;
            case 'center':
                setCameraPosCenter(path[0]);
                break;
            case 'smooth':
                setCameraPos4(path[0]);
                break;
        }
    }
}

function changeScale(scale) {
    $('#spotsizerange').trigger("change");
    toolbar['scale'] = scale
    if (selected != null) {
        //move the select bubble to the center
        if (cpath != null) {
            dragx = -cpath[pos].x
            dragy = -cpath[pos].y
        } else {
            dragx = -x(selected.data[dx][pos])
            dragy = -y(selected.data[dy][pos])
        }

        resetStage()
        resetBubblelight()
    }
}

function changeDimension(dimx, dimy) {
    dx = dimx;
    dy = dimy;
    //change side bar
    updateglobalAxis(dx, dy)
    updateLineDim(dx, 'x')
    updateLineDim(dy, 'y')

    resetStage();
}

function mydist(x1, y1, x2, y2) {
    return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2))
}
