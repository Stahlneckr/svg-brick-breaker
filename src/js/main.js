const DIFFICULTY = 2;
const PADDLE_SPEED = 5;
const PADDLE_H = 20;
const PADDLE_W = 100;

var Main = function () {
  return {
    vx: 0,
    vy: 0,
    lastTime: null,
    animFram: null,
    width: 0,
    height: 0,
    ball: null,
    ballColor: null,
    paddle: null,
    paddleDir: null,
    draw: null,
    lives: null,
    livesDisplay: null,
    init() {
      this.width = document.body.clientWidth;
      this.height = document.body.clientHeight;

      this.drawScene();
      this.animationFrame(0);
      this.setUpEvents();

      // ball color update
      this.ballColor = new SVG.Color('#ff0066')
      this.ballColor.morph('#00ff99')
    },
    setUpEvents() {
      SVG.on(document, 'keydown', (e) => {
        console.log("keying");
        this.paddleDir = e.keyCode == 37 ? -1 : e.keyCode == 39 ? 1 : 0
        e.preventDefault()
      })

      SVG.on(document, 'keyup', (e) => {
        this.paddleDir = 0
        e.preventDefault()
      })

      this.draw.on('click', () => {
        if(this.vx === 0 && this.vy === 0) {
          this.vx = (Math.random() * 500)-250
          this.vy = Math.random() * 500
        }
      })
    },
    drawScene() {
      this.draw = SVG('brick-breaker').size(this.width, this.height);
      var background = this.draw.rect(this.width, this.height).fill('#E3E8E6');
      // vertical divider line
      // var line = draw.line(this.width/2, 0, this.width/2, this.height);
      // line.stroke({ width: 5, color: '#fff', dasharray: '5,5' });

      // = PADDLE =
      this.paddle = this.draw.rect(PADDLE_W, PADDLE_H);
      this.paddle.x(this.width/2).cy(this.height-(PADDLE_H/2)).fill('#00ff99'); // #ff0066

      // = BALL =
      // define ball size
      var ballSize = 20;
      // create ball
      this.ball = this.draw.circle(ballSize);
      this.ball.center(this.width/2, this.height/2).fill('#7f7f7f');

      // = LIVES =
      this.lives = 3
      // create text for lives, set font properties
      this.livesDisplay = this.draw.text(this.lives+'').font({
        size: 32,
        family: 'Menlo, sans-serif',
        anchor: 'end',
        fill: '#fff'
      }).move(this.width/2, 10)
    },
    updateLoop(dt) {
      // move the ball by its velocity
      this.ball.dmove(this.vx*dt, this.vy*dt)

      // get position of ball
      var cx = this.ball.cx()
        , cy = this.ball.cy()


      // // move the left paddle in the direction of the ball
      // var dy = Math.min(DIFFICULTY, Math.abs(cy - paddleLeftCy))
      // paddleLeftCy += cy > paddleLeftCy ? dy : -dy

      // // constraint the move to the canvas area
      // this.paddleLeft.cy(Math.max(PADDLE_H/2, Math.min(this.height-PADDLE_H/2, paddleLeftCy)))

      // check if we hit top/bottom borders
      if (this.vy < 0 && cy <= 0) {
        this.vy = -this.vy
      }
      // check if we hit left/right borders
      if ((this.vx < 0 && cx <= 0) || (this.vx > 0 && cx >= this.width)) {
        this.vx = -this.vx
      }

      var paddleX = this.paddle.x()

      // check if we hit the paddle
      if(this.vy > 0 && cy >= this.height - PADDLE_H && cx > paddleX && cx < paddleX + PADDLE_W) {
        // depending on where the ball hit we adjust x velocity
        this.vx = (cx - (paddleX + PADDLE_W/2)) * 7 // magic factor

        // make the ball faster on hit
        this.vy = -this.vy * 1.10

      } else if (this.vy > 0 && cy >= this.height) {

        --this.lives
        this.livesDisplay.text(this.lives+'')

        this.resetGame()

      }


      // move player paddle
      var playerPaddleX = this.paddle.x()

      if (playerPaddleX <= 0 && this.paddleDir == -1) {
        this.paddle.cx(PADDLE_W/2)
      } else if (playerPaddleX >= this.width-PADDLE_W && this.paddleDir == 1) {
        this.paddle.x(this.width-PADDLE_W)
      } else {
        this.paddle.dx(this.paddleDir*PADDLE_SPEED)
      }


      // update ball color based on position
      this.ball.fill(this.ballColor.at(1/this.width*this.ball.x()))
    },
    animationFrame(ms) {
      // we get passed a timestamp in milliseconds
      // we use it to determine how much time has passed since the last call
      if (this.lastTime) {
        this.updateLoop((ms-this.lastTime)/1000) // call update and pass delta time in seconds
      }

      this.lastTime = ms
      this.animFrame = requestAnimationFrame(this.animationFrame.bind(this))
    },
    resetGame() {
      // visualize boom
      var paddle = this.paddle

      // create the gradient
      var gradient = this.draw.gradient('radial', function(stop) {
        stop.at(0, paddle.attr('fill'), 1)
        stop.at(1, paddle.attr('fill'), 0)
      })

      // create circle to carry the gradient
      var blast = this.draw.circle(300)
      blast.center(this.ball.cx(), this.ball.cy()).fill(gradient)

      // animate to invisibility
      blast.animate(1000, '>').opacity(0).after(function() {
        blast.remove()
      })

      // reset speed values
      this.vx = 0
      this.vy = 0

      // position the ball back in the middle
      this.ball.animate(333).center(this.width/2, this.height/2)

      // reset the position of the paddles
      this.paddle.animate(333).cx(this.width/2)
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