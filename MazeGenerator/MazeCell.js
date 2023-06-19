/*
    The MazeCell class is the main entity in the maze generation.

    It keeps track of its state and position of vertices in both cartesian and
    polar coordinates.

    It also handles drawing of itself and the solution line (if it's part of
    the solution path).

    NOTE:
    In the case of being rendered in a circular arrangement, the TOP
    neighbor is the neighbor nearest to the center.

    And the BOTTOM neighbor, is the cell farther from the center.
*/

// Line types, for Color vs. Black & White rendering.
// See HTML5 documentation for CanvasRenderingContext2D.setLineDash() for
// more info on how these are defined.
let LINE_DASHED = [5, 5];
let LINE_SOLID  = [];

function MazeCell(row, col){
    this.row = row;
    this.col = col;

    this.angleSweep = degToRads(360.0 / g_cols);

    this.walls = [true, true, true, true]; //Top, Right, Bottom, Left

    // Array of simple objects with .x and .y properties that represent
    // the end points used during solution rendering.
    this.solutionLines = []; // { "x" : xVal, "y" : "yVal" }

    // Similar to solutionLines, with the addition of a neighbor indicator. This
    // allows drawing a straight line or arc, depending on neighbor being
    // left/right (straight line) or top/bottom (as an arc).
    this.solutionCircularLines = [];

    // Keep track, so we don't get stuck in a circle or going back and forth
    // somewhere.
    this.visited = false;

    // TRUE == this cell is part of solution, thus needs special rendering
    this.isPartOfSolution = false;

    this.isStartCell = false;
    this.isEndCell   = false;

    // Stacklength at the time the cell is first visited
    this.stackLength = 0;

    // May be unecessary, but variations of this project introduce some real
    // time modification of cell values, and this is meant as a way to
    // signal a cell should update its values.
    this.Update = function() {
        this.updateValues();
    }

    /*
        This method does all the calculations for the various vertices and
        Cell values.
    */
    this.updateValues = function () {
        // Calculate the Pixel locations of the for corners.
        // Top-Left
        this.topLeft = new Vector2D(this.col * g_cellWidth,
                                    this.row * g_cellHeight);

        // Top-Right
        this.topRight = new Vector2D(this.topLeft.x + g_cellWidth,
                                     this.topLeft.y);

        // Bottom-Right
        this.bottomRight = new Vector2D(this.topRight.x,
                                        this.topRight.y + g_cellHeight);

        this.bottomLeft = new Vector2D(this.topLeft.x,
                                       this.topLeft.y + g_cellHeight)


        // This implementation allows for cell Width and Height to be different.
        // This allows the maze to be built to cover the entire visible canvas
        // area, even when CANVAS_WIDTH and CANVAS_HEIGHT are different (non-
        // square).  To make this work for the circular arrangement, we need to
        // clamp the maze to which ever is smallest.
        // After calculating which is smaller (Width or Height), it is then
        // halved, so it draws within the visible canvas area.

        // The radialScaling value allows this calculation to be used in the
        // polar coordinate math below, and we end up with the correct values
        // for the vertices.
        this.radialScaling = (g_cellWidth < g_cellHeight) ? g_cellWidth :
            g_cellHeight;
        this.radialScaling /= 2.0;

        // All these radial values are calculated using polar cooardinate math:
        //      x = r * cos(angle)
        //      y = r * sin(angle)
        // ...we use this method because the circular arrangement of the cells
        // is based on its radius location and angle at which its LEFT side is
        // positioned.
        //
        // It's easy to get confused with what "TopLeft" or "BottomRight" might
        // be.  Remember, like in rectangular orientation, the points are
        // 'wound' clockwise. TopLeft->TopRight->BottomRight->BottomLeft
        this.radialTopLeft = new Vector2D(
            ((this.radialScaling * this.row) *
                Math.cos( this.angleSweep * this.col )),
            ((this.radialScaling * this.row) *
                Math.sin( this.angleSweep * this.col ))
            );

        this.radialTopRight = new Vector2D(
            ((this.radialScaling * this.row) *
                (Math.cos( (this.angleSweep * this.col) + this.angleSweep ))),
            ((this.radialScaling * this.row) *
                (Math.sin( (this.angleSweep * this.col) + this.angleSweep )))
            );

        this.radialBottomRight = new Vector2D(
            (((this.radialScaling * this.row) + this.radialScaling) *
                (Math.cos( (this.angleSweep * this.col) + this.angleSweep ))),
            (((this.radialScaling * this.row) + this.radialScaling) *
                (Math.sin( (this.angleSweep * this.col) +this.angleSweep )))
            );

        this.radialBottomLeft = new Vector2D(
            (((this.radialScaling * this.row) + this.radialScaling) *
                Math.cos( this.angleSweep * this.col)),
            (((this.radialScaling * this.row) + this.radialScaling) *
                Math.sin( this.angleSweep * this.col ))
        );

        // Translate these points to be relative to the center of the canvas
        // With out this translation, the maze is drawn centered on
        // upper right corner (0,0).
        this.radialTopLeft.Add(    CANVAS_WIDTH_HALF, CANVAS_HEIGHT_HALF);
        this.radialTopRight.Add(   CANVAS_WIDTH_HALF, CANVAS_HEIGHT_HALF);
        this.radialBottomRight.Add(CANVAS_WIDTH_HALF, CANVAS_HEIGHT_HALF);
        this.radialBottomLeft.Add( CANVAS_WIDTH_HALF, CANVAS_HEIGHT_HALF);

        // Calculate center of the cell, which is mostly used when displaying
        // the stack length and points used in drawing the solution lines.
        this.radialCellCenter = new Vector2D(
            (((this.radialScaling * this.row) +
            (this.radialScaling / 2.0)) * Math.cos( (this.angleSweep * this.col)
                + (this.angleSweep / 2.0))),
            (((this.radialScaling * this.row) +
            (this.radialScaling / 2.0)) * Math.sin( (this.angleSweep * this.col)
                + (this.angleSweep / 2.0)))
        );
    }

    this.Update();

    /*
        This is another method  that remains similar to the CodingTrain
        example, and is key to creating the actual maze.
    */
    this.checkNeighbors = function() {
        let neighbors = [];
        let top    = g_allCells[getIndex(this.row - 1, this.col)    ];
        let right  = g_allCells[getIndex(this.row,     this.col + 1)];
        let bottom = g_allCells[getIndex(this.row + 1, this.col)    ];
        let left   = g_allCells[getIndex(this.row,     this.col - 1)];

        if (top && !top.visited){
            neighbors.push(top);
        }
        if (right && !right.visited){
            neighbors.push(right);
        }
        if (bottom && !bottom.visited){
            neighbors.push(bottom);
        }
        if (left && !left.visited){
            neighbors.push(left);
        }

        if (neighbors.length > 0) {
            let r = Math.floor(rnd(0, neighbors.length));
            return neighbors[r];
        } else {
            return undefined;
        }
    }

    /*
        This method handles drawing the cell in Cartesian Coordinates.
    */
    this.drawAsCartesianCoords = function() {
        g_context.beginPath();

        g_context.setLineDash(LINE_SOLID);

        if (this.walls[WALL.TOP]){
            g_context.moveTo(this.topLeft.x,  this.topLeft.y);
            g_context.lineTo(this.topRight.x, this.topRight.y);
        }

        if (this.walls[WALL.RIGHT]){
            g_context.moveTo(this.topRight.x,    this.topRight.y);
            g_context.lineTo(this.bottomRight.x, this.bottomRight.y);
        }

        if (this.walls[WALL.BOTTOM]){
            g_context.moveTo(this.bottomRight.x, this.bottomRight.y);
            g_context.lineTo(this.bottomLeft.x,  this.bottomLeft.y);
        }

        if (this.walls[WALL.LEFT]){
            g_context.moveTo(this.bottomLeft.x, this.bottomLeft.y);
            g_context.lineTo(this.topLeft.x,    this.topLeft.y);
        }

        g_context.lineWidth = 2;

        // Handle case when Black/White rendering is specified.
        if (control_draw_as_bw) {
            g_context.strokeStyle = 'black';
        } else {
            g_context.strokeStyle = 'red';
        }

        g_context.stroke();

        this.drawThisCell();
    };

    /*
        This method handles drawing the cell in the circular arrangement.
        This is where the various Radial values are used.
    */
    this.drawAsCircular = function() {
        let strokeStyle;

        // Handle case when Black/White rendering is specified.
        if (control_draw_as_bw) {
            strokeStyle = 'black';
        } else {
            strokeStyle = 'green';
        }

        g_context.setLineDash(LINE_SOLID);

        if (this.walls[WALL.TOP]) {
            g_context.beginPath();
            g_context.arc(
                CANVAS_WIDTH / 2.0,  // Center X
                CANVAS_HEIGHT / 2.0, // Center Y
                (this.radialScaling * this.row), // Radius
                (this.angleSweep    * this.col), // startAngle
                ((this.angleSweep   * this.col) + this.angleSweep), // endAngle
                false); /* FALSE == Clockwise */
            g_context.strokeStyle = strokeStyle;
            g_context.stroke();
        }

        if (this.walls[WALL.RIGHT]) {
            g_context.beginPath();
            g_context.moveTo(this.radialTopRight.x,   this.radialTopRight.y);
            g_context.lineTo(this.radialBottomRight.x,this.radialBottomRight.y);
            g_context.strokeStyle = strokeStyle;
            g_context.stroke();
        }

        if (this.walls[WALL.BOTTOM]) {
            g_context.beginPath();
            g_context.arc(
                CANVAS_WIDTH / 2.0,  // Center X
                CANVAS_HEIGHT / 2.0, // Center Y
                (this.radialScaling * this.row) + this.radialScaling,// Radius
                (this.angleSweep    * this.col), // startAngle
                ((this.angleSweep   * this.col) + this.angleSweep), // endAngle
                false); /* FALSE == Clockwise */
            g_context.strokeStyle = strokeStyle;
            g_context.stroke();
        }

        if (this.walls[WALL.LEFT]) {
            g_context.beginPath();
            g_context.moveTo(this.radialBottomLeft.x, this.radialBottomLeft.y);
            g_context.lineTo(this.radialTopLeft.x,    this.radialTopLeft.y);
            g_context.strokeStyle = strokeStyle;
            g_context.stroke();
        }

        g_context.lineWidth = 2;

        // Handle case when Black/White rendering is specified.
        if (control_draw_as_bw) {
            g_context.strokeStyle = 'black';
        } else {
            g_context.setLineDash(LINE_SOLID);
            if (control_draw_as_circular) {
                g_context.strokeStyle = 'green';

            } else {
                g_context.strokeStyle = 'red';
            }
        }

        g_context.stroke();

        g_context.setLineDash(LINE_SOLID);

        this.drawThisCell();
    };

    /*
        This method handles drawing the solution lines for cells that are
        part of the solution path.
    */
    this.drawThisCell = function() {

        if (!control_draw_solution) {
            return;
        }

        // Loop through and draw path lines
        if (this.isPartOfSolution) {

            let strokeStyle;
            let lineDash = LINE_SOLID;

            // Handle case when Black/White rendering is specified.
            if (control_draw_as_bw) {
                strokeStyle = 'black';
                lineDash    = LINE_DASHED;
            } else {
                strokeStyle = 'yellow';
                lineDash = LINE_SOLID;
            }

            if (!control_draw_as_circular) {
                let xCenterPoint = this.topLeft.x + (g_cellWidth / 2.0);
                let yCenterPoint = this.topLeft.y + (g_cellHeight / 2.0);
                for (let l = 0; l < this.solutionLines.length; l++) {
                    g_context.beginPath();
                    g_context.moveTo(xCenterPoint, yCenterPoint);
                    g_context.lineTo(this.solutionLines[l].x,
                        this.solutionLines[l].y);
                    g_context.lineWidth = 2;
                    g_context.setLineDash(lineDash);
                    g_context.strokeStyle = strokeStyle;
                    g_context.stroke();
                }
            } else {
                let xCenterPoint = CANVAS_WIDTH_HALF  + this.radialCellCenter.x;
                let yCenterPoint = CANVAS_HEIGHT_HALF + this.radialCellCenter.y;

                for (let l = 0; l < this.solutionCircularLines.length; l++) {
                    // This is for TOP or BOTTOM neighbors, so draw straight
                    // line from center of cell towards (TOP) or away from
                    // (BOTTOM)
                    if (
                        (this.solutionCircularLines[l].neighbor == WALL.TOP) ||
                        (this.solutionCircularLines[l].neighbor == WALL.BOTTOM)
                        ) {
                        g_context.beginPath();
                        g_context.moveTo(xCenterPoint,
                                         yCenterPoint);
                        g_context.lineTo(CANVAS_WIDTH_HALF +
                                            this.solutionCircularLines[l].x,
                                       CANVAS_HEIGHT_HALF +
                                            this.solutionCircularLines[l].y);
                        g_context.lineWidth = 2;
                        g_context.setLineDash(lineDash);
                        g_context.strokeStyle = strokeStyle;
                        g_context.stroke();
                    } else if (this.solutionCircularLines[l].neighbor ==
                                 WALL.RIGHT) {
                        g_context.beginPath();
                        g_context.arc(
                            CANVAS_WIDTH_HALF,  // Center X
                            CANVAS_HEIGHT_HALF, // Center Y
                            (this.radialScaling * this.row) +
                                (this.radialScaling / 2.0), // Radius
                            (this.angleSweep * this.col) +
                                this.angleSweep, //Right side end point
                            ((this.angleSweep * this.col) +
                                (this.angleSweep/2.0)), //center point
                            true); /* FALSE == Clockwise */
                        g_context.lineWidth = 2;
                        g_context.setLineDash(lineDash);
                        g_context.strokeStyle = strokeStyle;
                        g_context.stroke();

                    } else if (this.solutionCircularLines[l].neighbor ==
                                WALL.LEFT) {
                        g_context.beginPath();
                        g_context.arc(
                            CANVAS_WIDTH_HALF,  // Center X
                            CANVAS_HEIGHT_HALF, // Center Y
                            (this.radialScaling * this.row) +
                                (this.radialScaling / 2.0), // Radius
                            (this.angleSweep * this.col), //Right side end point
                            ((this.angleSweep * this.col) +
                                (this.angleSweep/2.0)),//center point
                            false); /* FALSE == Clockwise */
                        g_context.lineWidth = 2;
                        g_context.setLineDash(lineDash);
                        g_context.strokeStyle = strokeStyle;
                        g_context.stroke();
                    }
                }
            }
        }

        // Draw a start (blue) and end (red) indicator when drawing the solution
        if (this.isStartCell || this.isEndCell) {
            let startCellCenter;
            g_context.beginPath();
            if (!control_draw_as_circular) {
                startCellCenter = new Vector2D(
                        (this.topLeft.x + g_cellWidth / 2.0),
                        (this.topLeft.y + g_cellHeight / 2.0)
                );
            } else {
                startCellCenter = new Vector2D(
                        (CANVAS_WIDTH_HALF  + this.radialCellCenter.x),
                        (CANVAS_HEIGHT_HALF + this.radialCellCenter.y)
                );
            }

            g_context.arc(startCellCenter.x,
                          startCellCenter.y,
                          5,           // Radius
                          0,           // Start arc
                          2 * Math.PI, // End arc, 2 * Math.PI == full circle
                          false);

            // Handle case when Black/White rendering is specified.
            if (control_draw_as_bw) {
                g_context.fillStyle = "black";
            } else {
                g_context.fillStyle = (this.isStartCell) ? "blue" : "red";
            }
            g_context.fill();
        }

    }

    /*
        This method handles drawing the stack length for the cell.
        The stack depth at the time the cell was first visited.
        For large mazes, the 16px makes the display a bit of a mess.
        Future enhancement here would be to scale the font size in those cases.
    */
    this.drawStackLength = function () {
        g_context.beginPath();
        g_context.font = "16px Consolas";

        // Handle case when Black/White rendering is specified.
        if (control_draw_as_bw) {
            g_context.setLineDash(LINE_DASHED);
            g_context.fillStyle = "black";
        } else {
            g_context.setLineDash(LINE_SOLID);
            g_context.fillStyle = "white";
        }

        if (control_draw_as_circular) {
            g_context.fillText(`${this.stackLength}`,
                CANVAS_WIDTH_HALF  + this.radialCellCenter.x,
                CANVAS_HEIGHT_HALF + this.radialCellCenter.y);
        } else {
            g_context.fillText(`${this.stackLength}`,
                (this.topLeft.x + g_cellWidth/2.0),
                (this.topLeft.y + g_cellHeight/2.0));
        }
    }

    /*
        This method handles setting the stackLength property as well as
        see if it should take over the honors of having the longest stack.
        When the maze creation has completed, this is the routine that will
        ensure that g_currentMaxStackLength is the Cell with the longest stack.
    */
    this.setStackLength = function(stackLength) {
        this.stackLength = stackLength;
        if (this.stackLength > g_currentMaxStackLength) {
            g_currentMaxStackLength  = this.stackLength;
            g_cellWithMaxStackLength = this;

            // Mainly useful during debugging, but also interesting detail to
            // see as the maze is being created.
            console.log(`CELL[${this.row},${this.col}(${this.row * g_cols +
                this.col})] has highest stack at Stack:${this.stackLength}`);
        }
    }

    /*
        This method handles creating the points that will later be used when
        drawing the solution path through the maze.

        Each cell (that is part of the solution) will have a list of
        solutionLines that will be use to draw the actual solution line.

        In the case of the circular arrangement, the end points of the arc
        are stored, and require the extra "neighbor" indicator, so it will
        draw the appropriate arc.
    */
    this.addSolutionLines = function() {
        if (!this.walls[WALL.TOP]) {
            if (g_allCells[getIndex(this.row - 1, this.col)].isPartOfSolution) {
                this.solutionLines.push(
                    {
                        "x": (this.topLeft.x + (g_cellWidth / 2.0)),
                        "y": (this.topLeft.y)
                    }
                );

                // Add end point for the TOP neighbor
                this.solutionCircularLines.push(
                    {
                        "x" : (this.radialScaling * this.row) * Math.cos(
                                (this.angleSweep * this.col) +
                                (this.angleSweep / 2.0) ),
                        "y" : (this.radialScaling * this.row) * Math.sin(
                                (this.angleSweep * this.col) +
                                (this.angleSweep / 2.0) ),
                        "neighbor" : WALL.TOP
                    }
                );
            }
        }

        if (!this.walls[WALL.RIGHT]) {
            if (g_allCells[getIndex(this.row, this.col + 1)].isPartOfSolution) {
                this.solutionLines.push(
                    {
                        "x": (this.topRight.x),
                        "y": (this.topRight.y + (g_cellHeight / 2.0)),
                    }
                );

                // Add the end point for the RIGHT neighbor
                this.solutionCircularLines.push(
                    {
                        "x": ((this.radialScaling * this.row) +
                            this.radialScaling / 2.0) *
                                (Math.cos( (this.angleSweep * this.col) +
                                    (this.angleSweep))),
                        "y": ((this.radialScaling * this.row) +
                            this.radialScaling / 2.0) *
                                (Math.sin( (this.angleSweep * this.col) +
                                    (this.angleSweep))),
                        "neighbor" : WALL.RIGHT
                    }
                );
            }
        }

        if (!this.walls[WALL.BOTTOM]) {
            if (g_allCells[getIndex(this.row + 1, this.col)].isPartOfSolution) {
                this.solutionLines.push(
                    {
                        "x": (this.bottomLeft.x + (g_cellWidth / 2.0)),
                        "y": (this.bottomLeft.y),
                    }
                );

                // Add the end point for the BOTTOM neighbor
                this.solutionCircularLines.push(
                    {
                        "x" : ((this.radialScaling * this.row) +
                                this.radialScaling) *
                                    (Math.cos( (this.angleSweep * this.col) +
                                        this.angleSweep / 2.0)),
                        "y" : ((this.radialScaling * this.row) +
                                this.radialScaling) *
                                    (Math.sin( (this.angleSweep * this.col) +
                                        this.angleSweep / 2.0)),
                        "neighbor" : WALL.BOTTOM
                    }
                );
            };
        }

        if (!this.walls[WALL.LEFT]) {
            if (g_allCells[getIndex(this.row, this.col - 1)].isPartOfSolution) {
                this.solutionLines.push(
                    {
                        "x": (this.bottomLeft.x),
                        "y": (this.bottomLeft.y - (g_cellHeight / 2.0))
                    }
                );

                // Add the end point for the LEFT neighbor
                this.solutionCircularLines.push(
                    {
                        "x": ((this.radialScaling * this.row) +
                                this.radialScaling/2.0) *
                                    (Math.cos( this.angleSweep * this.col)),
                        "y": ((this.radialScaling * this.row) +
                                this.radialScaling/2.0) *
                                    (Math.sin( this.angleSweep * this.col)),
                        "neighbor" : WALL.LEFT
                    }
                );
            }
        }
    }
}