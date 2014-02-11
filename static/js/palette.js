function Palette( canvasID, sketchCanvasID ) {
        this.canvasID = canvasID;
        this.canvas = $("#"+canvasID);
	this.sketchCanvasID = sketchCanvasID;
	this.sketchCanvas = (sketchCanvasID == null) ? this.canvas : $("#"+sketchCanvasID);
	this.context = this.canvas.get(0).getContext("2d");
	this.position = { x: 0, y: 0 };
	this.create = this.makePalette;
	this.paletteString = "";

	Palette.prototype.makePalette = function(event) {
		this.context.fillStyle = "#888888";
		this.context.fillRect(0,0,this.canvas.width(),this.canvas.height());
	}
}
