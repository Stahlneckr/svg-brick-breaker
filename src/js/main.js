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
    paddleLeft: null,
    paddle: null,
    paddleDir: null,
    draw: null,
    playerLeft: null,
    playerRight: null,
    scoreLeft: null,
    scoreRight: null,
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
          this.vx = Math.random() * 750 - 150
          this.vy = Math.random() * 750 - 150
        }
      })
    },
    drawScene() {
      this.draw = SVG('brick-breaker').size(this.width, this.height);
      var background = this.draw.rect(this.width, this.height).fill('#E3E8E6');
      // vertical divider line
      // var line = draw.line(this.width/2, 0, this.width/2, this.height);
      // line.stroke({ width: 5, color: '#fff', dasharray: '5,5' });

      this.paddleLeft = this.draw.rect(PADDLE_W, PADDLE_H);
      this.paddleLeft.x(this.width/2).cy(this.height-(PADDLE_H/2)).fill('#00ff99'); // #ff0066

      // = PADDLE =
      this.paddle = this.draw.rect(PADDLE_W, PADDLE_H);
      this.paddle.x(this.width/2).cy(this.height-(PADDLE_H/2)).fill('#00ff99'); // #ff0066

      // = BALL =
      // define ball size
      var ballSize = 20;
      // create ball
      this.ball = this.draw.circle(ballSize);
      this.ball.center(this.width/2, this.height/2).fill('#7f7f7f');

      // = SCORE =
      // define initial player score
      this.playerLeft = this.playerRight = 0
      // create text for the score, set font properties
      this.scoreLeft = this.draw.text(this.playerLeft+'').font({
        size: 32,
        family: 'Menlo, sans-serif',
        anchor: 'end',
        fill: '#fff'
      }).move(this.width/2-10, 10)
      // cloning rocks!
      this.scoreRight = this.scoreLeft.clone()
        .text(this.playerRight+'')
        .font('anchor', 'start')
        .x(this.width/2+10)
    },
    updateLoop(dt) {
      // move the ball by its velocity
      this.ball.dmove(this.vx*dt, this.vy*dt)

      // get position of ball
      var cx = this.ball.cx()
        , cy = this.ball.cy()

      // get position of ball and paddle
      var paddleLeftCy = this.paddleLeft.cy()

      // move the left paddle in the direction of the ball
      var dy = Math.min(DIFFICULTY, Math.abs(cy - paddleLeftCy))
      paddleLeftCy += cy > paddleLeftCy ? dy : -dy

      // constraint the move to the canvas area
      this.paddleLeft.cy(Math.max(PADDLE_H/2, Math.min(this.height-PADDLE_H/2, paddleLeftCy)))

      // check if we hit top/bottom borders
      if ((this.vy < 0 && cy <= 0) || (this.vy > 0 && cy >= this.height)) {
        this.vy = -this.vy
      }

      var paddleLeftY = this.paddleLeft.y()
        , paddleY = this.paddle.y()

      // check if we hit the paddle
      if((this.vx < 0 && cx <= PADDLE_W && cy > paddleLeftY && cy < paddleLeftY + PADDLE_H) ||
         (this.vx > 0 && cx >= this.width - PADDLE_W && cy > paddleY && cy < paddleY + PADDLE_H)) {
        // depending on where the ball hit we adjust y velocity
        // for more realistic control we would need a bit more math here
        // just keep it simple
        this.vy = (cy - ((this.vx < 0 ? paddleLeftY : paddleY) + PADDLE_H/2)) * 7 // magic factor

        // make the ball faster on hit
        this.vx = -this.vx * 1.10
      } else

      // check if we hit left/right borders
      if ((this.vx < 0 && cx <= 0) || (this.vx > 0 && cx >= this.width)) {
        // when x-velocity is negative, it's a point for player 2, otherwise player 1
        if(this.vx < 0) { ++this.playerRight }
        else { ++this.playerLeft }

        this.resetGame()

        this.scoreLeft.text(this.playerLeft+'')
        this.scoreRight.text(this.playerRight+'')
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
      // detect winning player
      var paddle = this.ball.cx() > this.width/2 ? this.paddleLeft : this.paddle

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
      this.ball.animate(100).center(this.width/2, this.height/2)

      // reset the position of the paddles
      this.paddleLeft.animate(100).cy(this.height/2)
      this.paddle.animate(100).cy(this.height/2)
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