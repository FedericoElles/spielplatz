$(document).ready(function() {
	//init Crafty with FPS of 50 and create the canvas element
	Crafty.init();
	Crafty.canvas.init();

	var DEFAULTS = {
		moveKinder: true,
		viewBlicke: false
	};
	
	//preload the needed assets
	Crafty.load(["images/sprite.png", "images/bg.png"], function() {
		//splice the spritemap
		Crafty.sprite(64, "images/sprite.png", {
			ship: [0,0],
			big: [1,0],
			medium: [2,0],
			small: [3,0]
		});

		//start the main scene when loaded
		Crafty.scene("main");
	});
	
	Crafty.scene("main", function() {
		Crafty.background("url('images/bg.png')");
		
		//score display
		var score = Crafty.e("2D, DOM, Text")
			.text("Score: 0")
			.attr({x: Crafty.viewport.width - 300, y: Crafty.viewport.height - 50, w: 200, h:50})
			.css({color: "#000"});

    var stats = {
    	kinder: 0,
    	watched: 0
    };

		var updateScore = function(){
			score.text(stats.watched + ' of ' + stats.kinder + ' watched.');
		}

		//play view 
		var viewRange = 300;
		var viewFar = 300;

		var polyView = new Crafty.polygon([32,32], [viewRange+32,viewFar], [-viewRange+32,viewFar]);
		/*var view = Crafty.e("2D, Collision, Color, DebugCanvas, DebugPolygon")
		  .color("#969696")
		  .debugStroke("green")
		  .attr({x: Crafty.viewport.width / 2, y: Crafty.viewport.height / 2})
			.origin("center")
			.collision(polyView);
		view.debugPolygon(polyView); 
    */

    var newBlick = function(x, y, rad, color){
    	Crafty.e("2D, DOM, Color, bullet")
							.attr({
								x: x, 
								y: y, 
								w: 2, 
								h: 2,
								visible:DEFAULTS.viewBlicke, 
								rotation: rad, 
								xspeed: 20 * Math.sin(rad / 57.3), 
								yspeed: 20 * Math.cos(rad / 57.3)
							})
							.color(color || "rgb(255, 0, 0)")
							.bind("EnterFrame", function() {
								this.x += this.xspeed;
								this.y -= this.yspeed;
								
								//destroy if it goes out of bounds
								if(this._x > Crafty.viewport.width || this._x < 0 || this._y > Crafty.viewport.height || this._y < 0) {
									this.destroy();
								}
							});
    } 


			
		//player entity
		var player = Crafty.e("2D, Canvas, ship, Controls, Collision, DebugRectangle, DebugPolygon")
			.attr({move: {left: false, right: false, up: false, down: false}, rspeed: 0, xspeed: 0, yspeed: 0, decay: 0.9, 
				x: Crafty.viewport.width / 2, y: Crafty.viewport.height / 2, score: 0, wait: 0})
			.origin("center")
		  .debugStroke("red")			
			.bind("KeyDown", function(e) {
				//on keydown, set the move booleans
				if(e.keyCode === Crafty.keys.RIGHT_ARROW) {
					this.move.right = true;
				} else if(e.keyCode === Crafty.keys.LEFT_ARROW) {
					this.move.left = true;
				} else if(e.keyCode === Crafty.keys.W) {
					this.move.up = true;
				} else if(e.keyCode === Crafty.keys.S) {
					this.move.down = true;
				} else if (e.keyCode === Crafty.keys.A) {
					this.move.strifeLeft = true;
				} else if (e.keyCode === Crafty.keys.D) {
					this.move.strifeRight = true;
				} else if (e.keyCode === Crafty.keys.SPACE) {
					console.log("Blast");
					//create a bullet entity

					//raycast at all childs
					//kinder = array of all astroids
					//calculate angle between this and each child
					var radiuses = [];

					var TARGET_OFFSET = 0;

					var elter = new Crafty.math.Vector2D(this.x+TARGET_OFFSET, this.y+TARGET_OFFSET);
					console.log('elter', elter, this._rotation);
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
						console.log('radius', 
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
			}).bind("KeyUp", function(e) {
				//on key up, set the move booleans to false
				if(e.keyCode === Crafty.keys.RIGHT_ARROW) {
					this.move.right = false;
					this.rspeed = 0;
				} else if(e.keyCode === Crafty.keys.LEFT_ARROW) {
					this.move.left = false;
					this.rspeed = 0;
				} else if(e.keyCode === Crafty.keys.W) {
					this.move.up = false;
				} else if(e.keyCode === Crafty.keys.S) {
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
					//if released, slow down the ship
					this.xspeed *= this.decay;
					this.yspeed *= this.decay;
				}

				//strifing means moving left or rigth without rotation
				var strifeMod = 0;
			  if (this.move.strifeLeft) {
			  	console.log('strifeLeft');
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

				//move the ship by the x and y speeds or movement vector
				this.x += this.xspeed;
				this.y += this.yspeed;
				
				//if ship goes out of bounds, put him back
				if(this._x > Crafty.viewport.width) {
					this.x = -64;
				}
				if(this._x < -64) {
					this.x =  Crafty.viewport.width;
				}
				if(this._y > Crafty.viewport.height) {
					this.y = -64;
				}
				if(this._y < -64) {
					this.y = Crafty.viewport.height;
				}
				

				//cast Blicke
				this.wait += 1;
				if (this.wait > 10){
					this.wait = 0;
					//calculate angle between this and each child
					var radiuses = [];

					var TARGET_OFFSET = 0;

					var elter = new Crafty.math.Vector2D(this.x+TARGET_OFFSET, this.y+TARGET_OFFSET);
					console.log('elter', elter, this._rotation);
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
						console.log('radius', 
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



				//if all asteroids are gone, start again with more
				if(asteroidCount <= 0) {
					initRocks(lastCount, lastCount * 2);
				}
			}).collision(polyView)
			.onHit("asteroid", function(obj) {
				//console.log('player.hit.astoid', obj);
				//if player gets hit, restart the game
				//Crafty.scene("main");
			});
		//player.debugRectangle(player);
    player.debugPolygon(polyView); 
		
		//keep a count of asteroids
		var asteroidCount,
			lastCount;
		

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

		//Asteroid component
		Crafty.c("asteroid", {   
			init: function() {
				this.origin("center");
				this.attr({
					watched: false,
					moving: false,
					alpha: 1,
					x: Crafty.math.randomInt(sandkasten.x.from, sandkasten.x.to), //give it random positions, rotation and speed
					y: Crafty.math.randomInt(sandkasten.y.from, sandkasten.y.to),
					xspeed: Crafty.math.randomInt(-0.5, 0.5), 
					yspeed: Crafty.math.randomInt(-0.5, 0.5), 
					rspeed: Crafty.math.randomInt(-2, 2)
				}).bind("EnterFrame", function() {
					
					//this.rotation += this.rspeed;
					this.alpha -= 0.01;



					if (!this.watched && this.alpha > 0.2){
						this.watched = true;
						stats.watched += 1;
						updateScore();	
					}
					if (this.watched && this.alpha <= 0.2){
						this.watched = false;
						stats.watched -= 1;
						updateScore();
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


					if (Crafty.math.randomInt(0,10) === 0){
						this.moving = !this.moving;
						switch (Crafty.math.randomInt(0,10)) {
							case 0:
							  this.xspeed *= -1;
							case 1:
								this.yspeed *= -1;
								break;
						}
					}
					if (this.moving && DEFAULTS.moveKinder){
					  this.x += this.xspeed;
					  this.y += this.yspeed;
					}
				}).collision()
				/*.onHit("ship", function(e) {
					console.log('hit player');
					if (!this.watched){
						this.watched = true;
						stats.watched += 1;
						updateScore();	
					}
					
					this.removeComponent("big").addComponent("medium");
				}, function(e) {
					console.log('unhit player');
					this.watched = false;
					stats.watched -= 1;
					updateScore();
					this.removeComponent("medium").addComponent("big");
				})*/
				.onHit("bullet", function(e) {
					
					//e[0].obj.destroy(); //destroy the bullet
					this.alpha = 1;
					var size;
					//decide what size to make the asteroid
					/*if(this.has("big")) {
						this.removeComponent("big").addComponent("medium");
						size = "medium";
					} else if(this.has("medium")) {
						this.removeComponent("medium").addComponent("small");
						size = "small";
					} else if(this.has("small")) { //if the lowest size, delete self
						asteroidCount--;
						this.destroy();
						return;
					}*/
					
					var oldxspeed = this.xspeed;
					this.xspeed = -this.yspeed;
					this.yspeed = oldxspeed;
					
					//asteroidCount++;
					//split into two asteroids by creating another asteroid
					//Crafty.e("2D, DOM, "+size+", Collision, asteroid").attr({x: this._x, y: this._y});
				});
				
			}
		});

		var kinder = [];
		
		//function to fill the screen with asteroids by a random amount
		function initRocks(lower, upper) {
			var rocks = Crafty.math.randomInt(lower, upper);
			asteroidCount = rocks;
			lastCount = rocks;
			stats.kinder = rocks;
			updateScore();
			
			for(var i = 0; i < rocks; i++) {
				kinder.push(Crafty.e("2D, DOM, big, Collision, asteroid"));
			}
		}
		//first level has between 1 and 10 asteroids
		initRocks(1, 10);
	});
	
});