# Maze Generator

This version of a Maze Generator is inspired by the CodingTrain video series

- https://www.youtube.com/watch?v=HyK_Q5rrcr4 -- Part 1
- https://www.youtube.com/watch?v=D8UgRyRnvXU -- Part 2
- https://www.youtube.com/watch?v=8Ju_uxJ9v44 -- Part 3

**Source for those videos:**
https://github.com/CodingTrain/Coding-Challenges/tree/main/010_Maze_DFS

This version generates the maze in a circular arrangement of cells.

Example #1 -- <a href="https://mrjimmo.com/HTMLDooDads/MazeGenerator/MazeGeneratorCircular.htm?rows=10&cols=10">Simple 10x10</a><br>
Example #2 -- <a href="https://mrjimmo.com/HTMLDooDads/MazeGenerator/MazeGeneratorCircular.htm?rows=10&cols=10&asbw">Simple 10x10, shown in Black & White.</a><br>

It also has a few other hot-key features for solving, showing cell 'length',
pause, and flipping between the rectangular and circular arrangements.

|key|Operation|
|-|-|
|[SPACE]|Pause the maze creation|
|"B"|Draw maze as black lines on white bg, solution line is dashed.|
|"C"|Flip between showing maze as circular or rectangular arrangement|
|"L"|Show the stack size for each cell|
|"S"|Show the solution for the maze.|

"Solution" in this case, is considered to be the cell that has the longest
path back to the starting cell.  The starting cell in center of the grid.

3 URL Query params are supported:
|Param|Meaning|
|-|-|
|rows=n|Number of rows|
|cols=n|Number of columns|
|asbw|Show as Black & White (Solution will be shown as dashed line)|

NOTE: This version does not use P5.js.

Also see the Polar Coordinates video, for some great education: 
[3.4 Polar Coordinates - The Nature of Code](https://www.youtube.com/watch?v=O5wjXoFrau4&ab_channel=TheCodingTrain)

Polar coordinates are used in this version, as it makes it easier to
figure out the vertices based on the radius of the circle.

# Examples
These are all displays of the same maze in various states...

**Generated maze, Circular**:

<img src=".\/MazeGeneratorMedia/Circular_10x10.PNG"/>

**Generated maze, Circular, solved**:

<img src=".\/MazeGeneratorMedia/Circular_10x10_solved.PNG"/>

**Generated Maze, Circular, Black & White**:

<img src=".\/MazeGeneratorMedia/Circular_10x10_BW.PNG"/>

**Generated Maze, Circular, Black & White, Solved**:

<img src=".\/MazeGeneratorMedia/Circular_10x10_BW_Solved.PNG"/>

**Generated maze, Rectangular**:

<img src=".\/MazeGeneratorMedia/Rectangular_10x10.PNG"/>

**Generated maze, Rectangular, solved**:

<img src=".\/MazeGeneratorMedia/Rectangular_10x10_solved.PNG"/>

**Generated Maze, Rectangular, Black & White**:

<img src=".\/MazeGeneratorMedia/Rectangular_10x10_BW.PNG"/>

**Generated Maze, Rectangular, Black & White, Solved**:

<img src=".\/MazeGeneratorMedia/Rectangular_10x10_BW_Solved.PNG"/>
