/*
    Simple, no-frills 2D Vector class.
*/
function Vector2D(x,y) {
    this.x = x;
    this.y = y;

    this.Add = function(x,y) {
        this.x += x;
        this.y += y;
    }
}