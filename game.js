var DEBUG = false;

var c = {
	log: function() {if (DEBUG) console.log(arguments);}	
};


/**
 * TODO
 * - Unfall: Ist ein Kind nicht beaufsichtigt, kann ein Unfall passieren, was den Krankenwagen ruft
 - - Ausbüchsen: Ist ein Kind nicht beaufsichtig, kann es abhauen
 * - Energie des Spielers, wird durch bewegen weniger
 * - Bank: Lädt Energie doppelt so schnell auf
 * - Baum: Verringert Sicht um 50%
 * - Spielzeug: Bindet Kinder an einen Ort
 * - Mitnehmen: Bewegt ein Kind von einem Ort zum Anderen
 * - Essen anbieten: Kinder bewegen sich zu Spieler, dann wieder zurück	
 */


$(document).ready(function() {
	//init Crafty with FPS of 50 and create the canvas element
	Crafty.init();
	Crafty.canvas.init();

	var DEFAULTS = {
		spriteSize: 64,
		moveKinder: true, //should Kinder move
		viewBlicke: false, //should Blicke be visible
		continousBlicke: true //shoot blicke on space
	};

	var OPTIONS = {
		blickDecay: 0.03, //visibility goes down with each frame
		blickSpeed: 20, //how fast the blick is
		blickInterval: 5, //cast a blick every x frame
		blickVector:{ //used to draw vector
			x:500,
			y:500
		},
		kind:{
		  xspeed:0.5, //max x speed
		  yspeed:0.5, //max y speed
		  minAlphaToBeWatched: 0.2,  //
		  changeMovingToStill: 50, //if higher, so lower the changes between moving and standing still
		  chanceRandomDirChange: 10 //at least 4, the higher, the less chance for directional change
		}
	};

	var sandkasten = {
		x: {
			from:Crafty.viewport.width/4,
			to:Crafty.viewport.width/4*3
		},
		y: {
			from:Crafty.viewport.height/4,
			to:Crafty.viewport.height/4*3
		}
	}
	
	//preload the needed assets
	Crafty.load(["images/sprite.png", "images/bg.png"], function() {
		//splice the spritemap
		Crafty.sprite(DEFAULTS.spriteSize, "images/sprite.png", {
			player: [0,0],
			big: [1,0],
			medium: [2,0],
			tree: [3,0]
		});

		
		Crafty.scene("main"); //start the main scene when loaded
	});
	
	Crafty.scene("main", function() {
		Crafty.background("url('images/bg.png')");

		//sandkasten
		var sandkastenBox = Crafty.e('2D, Canvas, Image')
		  .image('images/sand.png', 'repeat')
			.attr({
				x: sandkasten.x.from, 
				y: sandkasten.y.from, 
				h: sandkasten.y.to-sandkasten.y.from,
				w: sandkasten.x.to-sandkasten.x.from
			});
		
		//score display
		var score = Crafty.e("2D, DOM,  Text")
			.text("Score: 0")
			.attr({x: Crafty.viewport.width - 300, y: Crafty.viewport.height - 50, w: 200, h:50})
			.css({color: "#000"});

    var stats = {
    	kinder: 0,
    	watched: 0,
    	update: function(){
    		score.text(stats.watched + ' of ' + stats.kinder + ' watched.');	
    	}
    };


		var polyView = new Crafty.polygon([32,32], [OPTIONS.blickVector.x+32,OPTIONS.blickVector.y], [-OPTIONS.blickVector.x+32,OPTIONS.blickVector.y]);


    function newBlick(x, y, rad, color){
    	Crafty.e("2D, DOM, Color, blick")
				.attr({
					x: x, 
					y: y, 
					w: 2, 
					h: 2,
					visible:DEFAULTS.viewBlicke,
					alpha: 1, //power of blick
					rotation: rad, 
					xspeed: OPTIONS.blickSpeed * Math.sin(rad / 57.3), 
					yspeed: OPTIONS.blickSpeed * Math.cos(rad / 57.3)
				})
				.color(color || "rgb(255, 0, 0)")
				.bind("EnterFrame", function() {
					this.x += this.xspeed;
					this.y -= this.yspeed;
					
					//destroy if it goes out of bounds
					if(this._x > Crafty.viewport.width || this._x < 0 || this._y > Crafty.viewport.height || this._y < 0) {
						this.destroy();
					}

					//destrory if it goes 
					if (this.alpha > 0){

						this.alpha -= OPTIONS.blickDecay;
						c.log('blick alpha' + this.alpha);
					}
				});
    } 


    //tree
    var tree = Crafty.e('2D, DOM, tree, Collision')
      .attr({
      	 reduceAlpha: 0.5,
      	 lastBlick:0,
      	 z:100,	
				 x: Crafty.viewport.width / 2 - 100, 
				 y: Crafty.viewport.height / 2})
			.origin("center")
			.collision()
			.onHit('blick', function(e){
				 var blick = e[0].obj;
				 if (blick[0] > this.lastBlick){
				 	 blick.alpha -= this.reduceAlpha;
				 	 this.lastBlick = blick[0];
				 	 //console.log('blick hit tree', blick[0], tree);
				 }
				 //console.log('blick hit tree', blick[0], tree);
			});
  
			
		//player entity
		var player = Crafty.e("2D, Canvas, player, Controls, Collision, DebugRectangle, DebugPolygon")
			.attr({move: {left: false, right: false, up: false, down: false}, rspeed: 0, xspeed: 0, yspeed: 0, decay: 0.9, 
				x: Crafty.viewport.width / 2, y: Crafty.viewport.height / 2, score: 0, wait: 0})
			.origin("center")
		  .debugStroke("black")			
			.bind("KeyDown", function(e) {
				//on keydown, set the move booleans
				if(e.keyCode === Crafty.keys.RIGHT_ARROW) {
					this.move.right = true;
				} else if(e.keyCode === Crafty.keys.LEFT_ARROW) {
					this.move.left = true;
				} else if(e.keyCode === Crafty.keys.W || e.keyCode === Crafty.keys.UP_ARROW) {
					this.move.up = true;
				} else if(e.keyCode === Crafty.keys.S || e.keyCode === Crafty.keys.DOWN_ARROW) {
					this.move.down = true;
				} else if (e.keyCode === Crafty.keys.A) {
					this.move.strifeLeft = true;
				} else if (e.keyCode === Crafty.keys.D) {
					this.move.strifeRight = true;
				} else if (e.keyCode === Crafty.keys.SPACE) {
					this.singleBlick = true;					
				}
			}).bind("KeyUp", function(e) {
				//on key up, set the move booleans to false
				if(e.keyCode === Crafty.keys.RIGHT_ARROW) {
					this.move.right = false;
					this.rspeed = 0;
				} else if(e.keyCode === Crafty.keys.LEFT_ARROW) {
					this.move.left = false;
					this.rspeed = 0;
				} else if(e.keyCode === Crafty.keys.W || e.keyCode === Crafty.keys.UP_ARROW) {
					this.move.up = false;
				} else if(e.keyCode === Crafty.keys.S || e.keyCode === Crafty.keys.DOWN_ARROW) {
					this.move.down = false;
				} else if (e.keyCode === Crafty.keys.A) {
					this.move.strifeLeft = false;
				} else if (e.keyCode === Crafty.keys.D) {
					this.move.strifeRight = false;
				}
			}).bind("EnterFrame", function() {

				if(this.move.right) {
					this.rspeed = (this.rspeed === 0) ? 1 : this.rspeed += 0.2;
				}

				if(this.move.left) {
					this.rspeed = (this.rspeed === 0) ? -1 : this.rspeed -= 0.2;
				}

				if(this.move.right) this.rotation += this.rspeed;
				if(this.move.left) this.rotation += this.rspeed;
				
				//acceleration and movement vector
				var vx = Math.sin(this._rotation * Math.PI / 180) * 0.3,
					vy = Math.cos(this._rotation * Math.PI / 180) * 0.3;
				

				//if the move up is true, increment the y/xspeeds
				if(this.move.up) {
					this.yspeed += vy;
					this.xspeed -= vx;
				} else {
					//if released, slow down the player
					this.xspeed *= this.decay;
					this.yspeed *= this.decay;
				}

				//strifing means moving left or rigth without rotation
				var strifeMod = 0;
			  if (this.move.strifeLeft) {
			  	c.log('strifeLeft');
			  	strifeMod += 90;
			  }
			  if (this.move.strifeRight) {
			  	strifeMod += -90;
			  }  		

				var sx = Math.sin((this._rotation + strifeMod) * Math.PI / 180) * 0.3,
					sy = Math.cos((this._rotation + strifeMod) * Math.PI / 180) * 0.3;
				
				if (strifeMod !== 0){
					this.yspeed -= sy;
					this.xspeed += sx;					
				}

        // go backwards
        var bx = Math.sin((this._rotation + 180) * Math.PI / 180) * 0.3,
					by = Math.cos((this._rotation + 180) * Math.PI / 180) * 0.3;
				
				if (this.move.down && !this.move.up){
					this.yspeed += by;
					this.xspeed -= bx;					
				}					
;

				var allowMove = true;
				
				//if player goes out of bounds, put him back
				if(this.x+this.xspeed > Crafty.viewport.width - DEFAULTS.spriteSize) {
					this.xspeed = 0;
				}
				if(this.x+this.xspeed < 0) {
					this.xspeed = 0;
				}
				if(this.y+this.yspeed > Crafty.viewport.height  - DEFAULTS.spriteSize) {
					this.yspeed = 0;
				}
				if(this.y+this.yspeed < 0) {
					this.yspeed = 0;
				}

				//move the player by the x and y speeds or movement vector
				if (allowMove){
					this.x += this.xspeed;
					this.y += this.yspeed				
				}

				//cast Blicke
				if (DEFAULTS.continousBlicke || this.singleBlick){
					

					this.wait += 1;
					if (this.wait > OPTIONS.blickInterval || this.singleBlick){
						this.wait = 0;
						//calculate angle between this and each child
						var radiuses = [];

						var TARGET_OFFSET = 0;

						var elter = new Crafty.math.Vector2D(this.x+TARGET_OFFSET, this.y+TARGET_OFFSET);
						c.log('elter', elter, this._rotation);
						kinder.forEach(function(kind){
							var pos = new Crafty.math.Vector2D(kind.x+TARGET_OFFSET, kind.y+TARGET_OFFSET);
							radiuses.push(Crafty.math.radToDeg(elter.angleTo(kind)));
						}); 

						//for (var i=0, ii= 320; i<ii;i++){
						//	radiuses.push(i*10);
						//}

						var papa = this;
						var viewDegree = 48;
						var blickRange = {
							from: this._rotation-viewDegree+180,
							to: 	this._rotation+viewDegree+180
						};

						var niceRad = function(val){
							return (val+3600)%360;
						};

						['from','to'].forEach(function(prop){
							blickRange[prop] = niceRad(blickRange[prop]);
						});

						var OFFSET = 32;
						newBlick(this.x+OFFSET, this.y+OFFSET, blickRange.from);
						newBlick(this.x+OFFSET, this.y+OFFSET, blickRange.to);

						radiuses.forEach(function(rad){
							rad2 = niceRad(rad+90);
							var inBlick = false;
							if (blickRange.from > blickRange.to){
								inBlick = (blickRange.from < rad2 || rad2 < blickRange.to )
							} else {
							  inBlick = (blickRange.from < rad2 && rad2 < blickRange.to);
							}
							c.log('radius', 
								rad, 
								blickRange.from,
								blickRange.to,
								inBlick);
							//if (inBlick){
						  var  color = inBlick ? 'green' : 'red';
						  if (inBlick){
						    newBlick(papa._x+OFFSET, papa._y+OFFSET, rad+90, color);
							}
						});

					}
					//disable singleBlick
					if (this.singleBlick) {
						this.singleBlick = false;
					}	
				}

			}).collision(polyView)
			//.onHit("asteroid", function(obj) {
				//c.log('player.hit.astoid', obj);
				//if player gets hit, restart the game
				//Crafty.scene("main");
			//})
			;
		//player.debugRectangle(player);
    player.debugPolygon(polyView); 
		
		//keep a count of asteroids
		//var asteroidCount,
		//	lastCount;
		

	

		//Asteroid component
		Crafty.c("asteroid", {   
			init: function() {
				this.origin("center");
				this.attr({
					watched: false,
					moving: false,
					alpha: 1,
					targetAlpha: 0,
					z:2,
					x: Crafty.math.randomInt(sandkasten.x.from, sandkasten.x.to), //give it random positions, rotation and speed
					y: Crafty.math.randomInt(sandkasten.y.from, sandkasten.y.to),
					xspeed: Crafty.math.randomInt(-OPTIONS.kind.xspeed, OPTIONS.kind.xspeed), 
					yspeed: Crafty.math.randomInt(-OPTIONS.kind.yspeed, OPTIONS.kind.yspeed)
				}).bind("EnterFrame", function() {
										
					//TODO prevent flacker

					if (this.targetAlpha > this.alpha){
						this.alpha += 0.01;
					} else {
						this.alpha -= 0.01;
						this.targetAlpha = 0;
					}
					//this.alpha = Math.round(this.alpha*10)/10;
					

					if (!this.watched && this.alpha > OPTIONS.kind.minAlphaToBeWatched){
						this.watched = true;
						stats.watched += 1;
						stats.update();	
					}
					if (this.watched && this.alpha <= OPTIONS.kind.minAlphaToBeWatched){
						this.watched = false;
						stats.watched -= 1;
						stats.update();
					}

					if(this._x > sandkasten.x.to) {
						this.xspeed *= -1;
					}
					if(this._x < sandkasten.x.from) {
						this.xspeed *= -1;
					}
					if(this._y > sandkasten.y.to) {
						this.yspeed *= -1;
					}
					if(this._y < sandkasten.y.from) {
						this.yspeed *= -1;
					}


					if (Crafty.math.randomInt(0, OPTIONS.kind.changeMovingToStill) === 0){
						this.moving = !this.moving;
						switch (Crafty.math.randomInt(0, OPTIONS.kind.chanceRandomDirChange)) {
							case 0:
							  this.xspeed *= -1;
							case 1:
								this.yspeed *= -1;
								break;
							case 2:
								this.xspeed += 0.1;
								this.yspeed -= 0.1;
								break;
							case 3:
								this.xspeed -= 0.1;
								this.yspeed += 0.1;
								break;
						}
					}
					if (this.moving && DEFAULTS.moveKinder){
					  this.x += this.xspeed;
					  this.y += this.yspeed;
					}
				}).collision()
				/*.onHit("player", function(e) {
					c.log('hit player');
					if (!this.watched){
						this.watched = true;
						stats.watched += 1;
						stats.update();	
					}
					
					this.removeComponent("big").addComponent("medium");
				}, function(e) {
					c.log('unhit player');
					this.watched = false;
					stats.watched -= 1;
					stats.update();
					this.removeComponent("medium").addComponent("big");
				})*/
				.onHit("blick", function(e) {
					var newAlpha = e[0].obj.alpha;
					this.targetAlpha = newAlpha;					
				});
				
			}
		});

		var kinder = [];
		
		//function to fill the screen with asteroids by a random amount
		function initKinder(lower, upper) {
			var rocks = Crafty.math.randomInt(lower, upper);
			stats.kinder = rocks;
			stats.update();
			
			for(var i = 0; i < rocks; i++) {
				kinder.push(Crafty.e("2D, DOM, big, Collision, asteroid"));
			}
		}
		//first level has between 1 and 10 kinder
		initKinder(1, 10);
	});
	
});