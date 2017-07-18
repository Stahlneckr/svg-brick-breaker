const DIFFICULTY = 2;
const PADDLE_SPEED = 5;
const PADDLE_H = 20;
const PADDLE_W = 100;
const BRICK_H = 20;
const BRICK_W = 100;
const BRICK_MARGIN = 5;
const COLORS = {
  bg: '#212121',
  ball: '#E53935',
  ballMorph: '#E53935',
  paddle: '#E53935',
  bricks: ['#FFEB3B','#8BC34A','#03A9F4', '#AB47BC']
}

var Main = function () {
  return {
    draw: null,
    ball: {
      pos: null,
      vx: 0,
      vy: 0,
      color: null,
    },
    scene: {
      width: 0,
      height: 0,
      lastTime: null,
      animFram: null,
      pointsDisplay: null
    },
    player: {
      paddle: null,
      paddleDir: null,
      points: null
    },
    bricks: [],
    brickArea: {},
    init() {
      this.scene.width = document.body.clientWidth;
      this.scene.height = document.body.clientHeight;

      this.drawScene();
      this.setUpEvents();
      this.animationFrame(0);
    },
    drawScene() {
      this.draw = SVG('brick-breaker').size(this.scene.width, this.scene.height);
      var background = this.draw.rect(this.scene.width, this.scene.height).fill(COLORS.bg);

      // = PADDLE =
      this.player.paddle = this.draw.rect(PADDLE_W, PADDLE_H);
      this.player.paddle.x(this.scene.width/2).cy(this.scene.height-(PADDLE_H/2)).fill(COLORS.paddle); // #ff0066

      // = BALL =
      // ball size
      var ballSize = 20;
      // ball color
      this.ball.color = new SVG.Color(COLORS.ball)
      this.ball.color.morph(COLORS.ballMorph)
      // create ball
      this.ball.pos = this.draw.circle(ballSize);
      this.ball.pos.center(this.scene.width/2, this.scene.height/2).fill(COLORS.ball);

      // = LIVES =
      this.player.points = 0
      // create text for points, set font properties
      this.scene.pointsDisplay = this.draw.text(this.player.points+'').font({
        size: 32,
        family: 'Menlo, sans-serif',
        anchor: 'end',
        fill: '#eeeeee'
      }).move(this.scene.width/2, 10)

      this.drawBricks()
    },
    drawBricks() {
      // = BRICKS =
      var line_total = Math.floor(this.scene.width/(BRICK_W+BRICK_MARGIN));
      var rem = this.scene.width%(BRICK_W+BRICK_MARGIN);
      var brick;
      var y = this.scene.height*.1;
      for(var i=0; i<8; i++) {
        y = y+BRICK_H+BRICK_MARGIN;
        var num_bricks = line_total;
        for(var j=0; j<line_total; j++) {
          if(i%2 === 0) {
            brick = this.draw.rect(BRICK_W, BRICK_H);
            brick.x((rem/2)+(j*(BRICK_W+BRICK_MARGIN))).cy(y).fill(COLORS.bricks[Math.floor(i/2)]);
          } else if(j < line_total-1) {
            brick = this.draw.rect(BRICK_W, BRICK_H);
            brick.x((rem/2)+BRICK_W/2+(j*(BRICK_W+BRICK_MARGIN))).cy(y).fill(COLORS.bricks[Math.floor(i/2)]);
          }
          this.bricks.push(brick)
        }
      }
      // used for more efficient hit detection on bricks
      this.brickArea = {
        top: this.bricks[0].y(),
        bottom: this.bricks[(this.bricks.length)-1].y() + BRICK_H,
        left: this.bricks[0].x(),
        right: this.bricks[(this.bricks.length)-1].x() + BRICK_W*2 + BRICK_MARGIN
      }
    },
    setUpEvents() {
      SVG.on(document, 'keydown', (e) => {
        console.log("keying");
        this.player.paddleDir = e.keyCode == 37 ? -1 : e.keyCode == 39 ? 1 : 0
        e.preventDefault()
      })

      SVG.on(document, 'keyup', (e) => {
        this.player.paddleDir = 0
        e.preventDefault()
      })

      this.draw.on('click', () => {
        if(this.ball.vx === 0 && this.ball.vy === 0) {
          this.ball.vx = (Math.random() * 500)-250
          this.ball.vy = Math.random() * 500
        }
      })
    },
    updateLoop(dt) {
      // move the ball by its velocity
      this.ball.pos.dmove(this.ball.vx*dt, this.ball.vy*dt)

      // get position of ball
      var cx = this.ball.pos.cx()
        , cy = this.ball.pos.cy()

      // check if we hit top/bottom borders
      if (this.ball.vy < 0 && cy <= 0) {
        this.ball.vy = -this.ball.vy
      }
      // check if we hit left/right borders
      if ((this.ball.vx < 0 && cx <= 0) || (this.ball.vx > 0 && cx >= this.scene.width)) {
        this.ball.vx = -this.ball.vx
      }

      var paddleX = this.player.paddle.x()

      // check if we hit the paddle
      if(this.ball.vy > 0 && cy >= this.scene.height - PADDLE_H && cx > paddleX && cx < paddleX + PADDLE_W) {
        // depending on where the ball hit we adjust x velocity
        this.ball.vx = (cx - (paddleX + PADDLE_W/2)) * 7 // magic factor
        // make the ball faster on hit
        this.ball.vy = -this.ball.vy * 1.10
      } else if (this.ball.vy > 0 && cy >= this.scene.height) {
        // hit the bottom -- reset game
        this.resetGame()
      }

      // check if we hit a brick
      // check if we're in the right area -- for efficiency we don't technically need this
      if(cy > this.brickArea.top && cy < this.brickArea.bottom && cx > this.brickArea.left && cx < this.brickArea.right) {
        for(var i = 0; i<this.bricks.length; i++) {
          if(cy > this.bricks[i].y() && cy < this.bricks[i].y()+BRICK_H && cx > this.bricks[i].x()  && cx < this.bricks[i].x()+BRICK_W) {
            this.ball.vx = (cx - (this.bricks[i].x() + BRICK_W/2)) * 7 // magic factor
            this.ball.vy = -this.ball.vy;
            this.bricks[i].remove();
            this.bricks.splice(i,1);
            this.player.points++
            this.scene.pointsDisplay.text(this.player.points+'')
            break;
          }
        }
      }

      // move player paddle
      var playerPaddleX = this.player.paddle.x()

      if (playerPaddleX <= 0 && this.player.paddleDir == -1) {
        this.player.paddle.cx(PADDLE_W/2)
      } else if (playerPaddleX >= this.scene.width-PADDLE_W && this.player.paddleDir == 1) {
        this.player.paddle.x(this.scene.width-PADDLE_W)
      } else {
        this.player.paddle.dx(this.player.paddleDir*PADDLE_SPEED)
      }

      // update ball color based on position
      this.ball.pos.fill(this.ball.color.at(1/this.scene.width*this.ball.pos.y()))
    },
    animationFrame(ms) {
      // we get passed a timestamp in milliseconds
      // we use it to determine how much time has passed since the last call
      if (this.scene.lastTime) {
        this.updateLoop((ms-this.scene.lastTime)/1000) // call update and pass delta time in seconds
      }

      this.scene.lastTime = ms
      this.scene.animFrame = requestAnimationFrame(this.animationFrame.bind(this))
    },
    resetGame() {
      // visualize boom
      var paddle = this.player.paddle

      // create the gradient
      var gradient = this.draw.gradient('radial', function(stop) {
        stop.at(0, paddle.attr('fill'), 1)
        stop.at(1, paddle.attr('fill'), 0)
      })

      // create circle to carry the gradient
      var blast = this.draw.circle(300)
      blast.center(this.ball.pos.cx(), this.ball.pos.cy()).fill(gradient)

      // animate to invisibility
      blast.animate(1000, '>').opacity(0).after(function() {
        blast.remove()
      })

      // reset speed values
      this.ball.vx = 0
      this.ball.vy = 0

      // position the ball back in the middle
      this.ball.pos.animate(333).center(this.scene.width/2, this.scene.height/2)

      // reset the position of the paddles
      this.player.paddle.animate(333).cx(this.scene.width/2)

      // reset bricks
      for(var i = 0; i<this.bricks.length; i++) {
        this.bricks[i].remove();
        this.bricks.splice(i,1);
      }
      this.player.points = 0;
      this.scene.pointsDisplay.text(this.player.points+'')
      this.drawBricks()
    }
  };
}();

// JS plugins
var jQuery = $ = require('jquery');
var SVG = require('svg.js')

// style
var css = require('../style/main.css');

// run
Main.init();