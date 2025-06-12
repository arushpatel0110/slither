  const MAP_BOUND = 10000; 
export default class Game extends Phaser.Scene   {
    constructor() {
        super({ key: 'Game' });
       this.snakeBody = [];
       this.positionHistory = [];
       this.bodySpacing = 1; 
       this.otherSnakesMap = {};
       this.baseScale = 0.1;
           this.isSpeedingUp = false;
    this.minSegments = 10;
    this.normalSpeed = 200;
    this.fastSpeed = 660;
    this.segmentDecreaseTimer = null;
    this.glowTween = null;
    }
    preload() {
        this.load.image('bg', 'assets/snake.jpg'); 
         this.load.image('snake', 'assets/body1.png');
        const selectedFace = localStorage.getItem('selectedFace') || 'face1';
        this.load.image('selectedFace', `assets/${selectedFace}.png`);
    }
    create() {
          gPrerollAd();
this.score = 0;  
this.scoreText = this.add.text(10, 10, `Score: ${this.score}`, {
    fontSize: '24px',
    color: '#ffffff',
    fontStyle: 'bold',
    stroke: '#000',
    strokeThickness: 4
}).setScrollFactor(0).setDepth(10);
        this.playerName = localStorage.getItem('playerName') || 'Player';
         const selectedFace = localStorage.getItem('selectedFace') || 'face1';
        this.socket = io('https://slither-fux5.onrender.com',{
            query: { 
                name: this.playerName ,
                face:selectedFace
            }
        });
        this.nameText = this.add.text(0, 0, this.playerName, {
    fontSize: '16px',
    color: '#ffffff',
    fontStyle: 'bold',
    stroke: '#000',
    strokeThickness: 4
}).setOrigin(0.5).setDepth(1);

const leaderboardList = document.getElementById('leaderboard-list');

this.socket.on('leaderboardUpdate', (topPlayers) => {
    leaderboardList.innerHTML = '';
    topPlayers.forEach((player, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${player.name} - Score: ${player.score}`;
        leaderboardList.appendChild(li);
    });
});

this.otherSnakes = this.add.group();

this.socket.on('currentPlayers', (players) => {
     if (!players || typeof players !== 'object') return;
  Object.keys(players).forEach((id) => {
    const playerInfo = players[id];
    if (id !== this.socket.id) {
        console.log('Adding other snake:', playerInfo);
        this.addOtherSnake(playerInfo);
    }
});

});

this.socket.on('newPlayer', (playerInfo) => {
    if (playerInfo.id !== this.socket.id) {
        console.log('Adding other snake:', playerInfo);
    this.addOtherSnake(playerInfo);
    }
});
this.socket.on('initialDots', (dots) => {
    this.spawnFoodDotsFromServer(dots);
});
this.socket.on('dotRemoved', (dotId) => {
    const dot = this.dots.getChildren().find(d => d.id === dotId);
    if (dot) {
        dot.destroy();
    }
});


this.socket.on('dotSpawned', (dotData) => {
    const dot = this.add.circle(dotData.x, dotData.y, 14, dotData.color);
    dot.id = dotData.id  || Phaser.Math.RND.uuid();  ;
    this.physics.add.existing(dot);
    dot.body.setCircle(14);
    dot.body.setAllowGravity(false);
    dot.body.setImmovable(true);
    this.dots.add(dot);
});

this.socket.on('updateScore', ({ playerId, score }) => {
    if (playerId === this.socket.id) {
        this.score = score;
        this.scoreText.setText(`Score: ${this.score}`);
    }

    this.updateLeaderboardScore?.(playerId, score);
});

this.socket.on('playerDiedBroadcast', ({ playerId, bodyData }) => {
    const snake = this.otherSnakesMap[playerId];

    if (snake) {
        if (snake.head && snake.head.active) {
            snake.head.destroy();
        }

        if (Array.isArray(snake.body)) {
            snake.body.forEach(segment => {
                if (segment && segment.destroy) {
                    segment.destroy();
                }
            });
        }     
        if (snake.nameText && snake.nameText.destroy) {
            snake.nameText.destroy();
        }

        delete this.otherSnakesMap[playerId]; 
    }

    bodyData.forEach(dotData => {
        if (!this.dots.getChildren().some(d => d.id === dotData.id)) {
        const dot = this.add.circle(dotData.x, dotData.y, 14, dotData.color);
        this.physics.add.existing(dot);
        dot.body.setCircle(14);
        dot.body.setAllowGravity(false);
        dot.body.setImmovable(true);
        dot.id = dotData.id;
        this.dots.add(dot);
        }
    });
    console.log(`Player ${playerId} died and ${bodyData.length} food dots created`);
});

this.socket.on('playerDisconnected', (playerId) => {

    const snake = this.otherSnakes.getChildren().find(s => s.playerId === playerId);
if (snake) {
    if (snake.head && snake.head.destroy) {
        snake.head.destroy();
    }

    if (Array.isArray(snake.body)) {
        snake.body.forEach(segment => {
            if (segment && segment.destroy) {
                segment.destroy();
            }
        });
    }
    delete players[id]; 
    delete this.otherSnakesMap[playerId];
}


})

this.socket.on('playerMoved', (playerInfo) => {
    let other = this.otherSnakesMap[playerInfo.id];
    if (!other) return;

if (other.nameText) {
    other.nameText.setPosition(playerInfo.x, playerInfo.y - 40);
    other.nameText.setRotation(0);
}


    other.head.x = playerInfo.x;
    other.head.y = playerInfo.y;
    other.head.rotation = playerInfo.angle;



    if (Array.isArray(playerInfo.body)) {
        playerInfo.body.forEach((pos, index) => {
            if (!other.body[index]) {
                let seg = this.add.image(pos.x, pos.y, 'snake').setScale(0.1);
               
                other.body.push(seg);
            } else {
                other.body[index].x = pos.x;
                other.body[index].y = pos.y;
             
            }
        });

       
        if (other.body.length > playerInfo.body.length) {
            for (let i = playerInfo.body.length; i < other.body.length; i++) {
                other.body[i].destroy();
            }
            other.body.length = playerInfo.body.length;
        }
    }
});
this.input.on('pointerdown', (pointer) => {
    if (pointer.leftButtonDown()) {
        this.startSpeedUp();
    }
});

this.input.on('pointerup', (pointer) => {
    if (!pointer.leftButtonDown()) {
        this.stopSpeedUp();
    }
});


this.physics.world.setBounds(-MAP_BOUND, -MAP_BOUND, MAP_BOUND * 2, MAP_BOUND * 2);
this.cameras.main.setBounds(-MAP_BOUND, -MAP_BOUND, MAP_BOUND * 2, MAP_BOUND * 2);

    this.bg = this.add.tileSprite(
        0, 0,
        this.cameras.main.width,
        this.cameras.main.height,
        'bg'
    ).setOrigin(0, 0).setScrollFactor(0).setDepth(-1);


        this.snake = this.physics.add.image(0, 0,  selectedFace).setCircle(205);
        this.snake.setCollideWorldBounds(false);
        this.snake.body.setAllowGravity(false);
        this.snakeSpeed = 200;
        this.snakeAngle = 0;
      this.snake.setScale(this.baseScale);  
        this.snake.setDepth(2);
        

this.snake.body.setOffset(60, 60);    

const segmentCount = 10;
for (let i = 0; i < segmentCount; i++) {
    const offsetX = this.snake.x - (i + 1) * 10; 
    const offsetY = this.snake.y;
    const segment = this.physics.add.image(offsetX, offsetY, 'snake')
        .setScale(this.baseScale);
    segment.setCircle(10);
    segment.body.setAllowGravity(false);
    segment.body.setImmovable(true);
    segment.setDepth(1);

    this.snakeBody.push(segment);
}
this.snake.setScale(this.baseScale); 

const requiredHistory = (this.snakeBody.length + 1) * this.bodySpacing;
while (this.positionHistory.length < requiredHistory) {
    this.positionHistory.push({ x: this.snake.x, y: this.snake.y });
}



        this.cameras.main.startFollow(this.snake);

        this.dots = this.physics.add.group();


        this.input.on('pointermove', (pointer) => {
            const angle = Phaser.Math.Angle.Between(
                this.snake.x,
                this.snake.y,
                pointer.worldX,
                pointer.worldY
            );
            this.snakeAngle = angle;
        });
        
        this.physics.add.overlap(this.snake, this.dots, this.eatDot, null, this);
    }


update() {
    this.socket.emit('playerMovement', {
    x: this.snake.x,
    y: this.snake.y,
    angle: this.snakeAngle,
    body: this.snakeBody.map(seg => ({ x: seg.x, y: seg.y }))
});


this.otherSnakes.getChildren().forEach(otherSnake => {
    const dist = Phaser.Math.Distance.Between(
        this.snake.x, this.snake.y,
        otherSnake.x, otherSnake.y
    );

    if (dist < 30) { 
        this.playerDied();
       setTimeout(() => {
    this.socket.disconnect();
}, 100);
    }
});
Object.values(this.otherSnakesMap).forEach(other => {
    other.body.forEach(segment => {
        const dist = Phaser.Math.Distance.Between(
            this.snake.x, this.snake.y,
            segment.x, segment.y
        );
        if (dist < 20) {
            this.playerDied();
           setTimeout(() => {
    this.socket.disconnect();
}, 100);
        }
    });
});


this.nameText.setPosition(this.snake.x, this.snake.y - 40);
this.nameText.setRotation(0);   


    this.physics.velocityFromRotation(this.snakeAngle, this.snakeSpeed, this.snake.body.velocity);

    this.updateSnakeDirection();

    this.positionHistory.unshift({ x: this.snake.x, y: this.snake.y });

    const maxHistory = this.snakeBody.length * this.bodySpacing;
    if (this.positionHistory.length > maxHistory) {
        this.positionHistory.pop();
    }

    for (let i = 0; i < this.snakeBody.length; i++) {
        const index = (i + 1) * this.bodySpacing;
        const point = this.positionHistory[index];
         const nextPoint = this.positionHistory[index - 1];

        if (point) {
                const segment = this.snakeBody[i];
            this.snakeBody[i].x = point.x;
            this.snakeBody[i].y = point.y;
            this.snake.setDepth(10);
for (let i = 0; i < this.snakeBody.length; i++) {
    this.snakeBody[i].setDepth(5 - i * 0.01); 
}

        
          if (nextPoint) {
            segment.rotation = Phaser.Math.Angle.Between(point.x, point.y, nextPoint.x, nextPoint.y);
        }
    }}
  if (this.bg) {
    const scrollX = Phaser.Math.Clamp(this.cameras.main.scrollX, -MAP_BOUND, MAP_BOUND);
    const scrollY = Phaser.Math.Clamp(this.cameras.main.scrollY, -MAP_BOUND, MAP_BOUND);
    this.bg.tilePositionX = scrollX + MAP_BOUND; 
    this.bg.tilePositionY = scrollY + MAP_BOUND;
}

}
startSpeedUp() {
    if (this.isSpeedingUp) return;
    if (this.snakeBody.length <= this.minSegments) return; 

    this.isSpeedingUp = true;
    this.snakeSpeed = this.fastSpeed;

    const targets = [this.snake, ...this.snakeBody];
    this.glowTween = this.tweens.add({
        targets: targets,
        alpha: { from: 1, to: 0.5 },
        duration: 300,
        yoyo: true,
        repeat: -1,
    });


    this.segmentDecreaseTimer = this.time.addEvent({
        delay: 100,
          callback: () => {
            if (this.snakeBody.length > this.minSegments) {
                const removed = this.snakeBody.pop();
                if (removed) removed.destroy();

                const requiredHistory = (this.snakeBody.length + 1) * this.bodySpacing;
                if (this.positionHistory.length > requiredHistory) {
                    this.positionHistory.splice(requiredHistory);
                }
                this.score = Math.max(this.score - 1, 0);
                this.scoreText.setText(`Score: ${this.score}`);

                this.socket.emit('scoreUpdate', { playerId: this.socket.id, score: this.score });
            } else {
                this.stopSpeedUp();
            }
        },

        loop: true
    });
}

stopSpeedUp() {
    if (!this.isSpeedingUp) return;
    this.isSpeedingUp = false;
    this.snakeSpeed = this.normalSpeed;

 
    if (this.glowTween) {
        this.glowTween.stop();
        this.glowTween = null;
    }
    this.snake.setAlpha(1);
    this.snakeBody.forEach(segment => segment.setAlpha(1));


    if (this.segmentDecreaseTimer) {
        this.segmentDecreaseTimer.remove();
        this.segmentDecreaseTimer = null;
    }
}

    addOtherSnake(playerInfo) {
    const faceKey = (playerInfo.face && this.textures.exists(playerInfo.face)) ? playerInfo.face : 'face1';

    if (!playerInfo.face) {
        console.warn('playerInfo.face is undefined or null, using default face1');
    } else if (!this.textures.exists(playerInfo.face)) {
        console.warn(`Face image ${playerInfo.face} not loaded, using default.`);
    }
       const head = this.add.image(playerInfo.x, playerInfo.y, faceKey);
    head.setDepth(1).setScale(this.baseScale);
    this.otherSnakes.add(head);
    const nameText = this.add.text(playerInfo.x, playerInfo.y - 40, playerInfo.name || 'Player', {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 4
    }).setOrigin(0.5).setDepth(10);
    const body = [];
    if (Array.isArray(playerInfo.body)) {
        playerInfo.body.forEach(pos => {
            const segment = this.add.image(pos.x, pos.y, 'snake');

            segment.setDepth(0).setScale(this.baseScale * 0.9);
            body.push(segment);
             this.otherSnakes.add(segment);
        });
    }
this.otherSnakesMap[playerInfo.id] = { head, body, nameText };
}
spawnFoodDotsFromServer(dotsData) {
    dotsData.forEach(dotData => {
        const dot = this.add.circle(dotData.x, dotData.y, 14, dotData.color);
         dot.id = dotData.id;
        this.physics.add.existing(dot);
        dot.body.setCircle(14);
        dot.body.setAllowGravity(false);
        dot.body.setImmovable(true);
        this.dots.add(dot);
    });
}
  spawnFoodDots(count) {
    for (let i = 0; i < count; i++) {
        const x = Phaser.Math.Between(this.snake.x - 100, this.snake.x + 100);
        const y = Phaser.Math.Between(this.snake.y - 100, this.snake.y + 100);
        const color = Phaser.Display.Color.RandomRGB().color;

        const dot = this.add.circle(x, y, 14, color);
        this.physics.add.existing(dot);
        dot.body.setCircle(14);
        dot.body.setAllowGravity(false);
        dot.body.setImmovable(true);
        this.dots.add(dot);
    }
}

updateSnakeDirection() {
    const deg = Phaser.Math.RadToDeg(this.snakeAngle);
    this.snake.setRotation(this.snakeAngle);

}

playerDied() {

   const bodyData = this.snakeBody.map((seg, i) => ({
        id: `${this.socket.id}_${i}_${Date.now()}`,
        x: seg.x,
        y: seg.y,
        color: this.snake.tintTopLeft || 0xffffff 
    }));



this.socket.emit('playerDied', bodyData);
setTimeout(() => {
    this.socket.disconnect();
}, 100);


this.cameras.main.fadeOut(1000); 
this.time.delayedCall(100, () => {
    this.scene.start('Menu');
});
 
    this.snakeBody.forEach(seg => seg.destroy());
    this.nameText.destroy();
    this.snakeBody = [];
    this.positionHistory = [];
    this.baseScale = 0.1;
        this.snake.setPosition(0, 0);
    this.snake.setScale(this.baseScale);
    this.cameras.main.stopFollow();
this.snake.setVisible(false);
    this.snakeAngle = 0;

}


eatDot(snake, dot) {
      const dotId = dot.id; 
    this.socket.emit('dotEaten', dotId); 
    dot.destroy();

    const lastSegment = this.snakeBody.length > 0
        ? this.snakeBody[this.snakeBody.length - 1]
        : this.snake;
        this.baseScale += 0.00005;


this.snake.setScale(this.baseScale);


this.snakeBody.forEach(segment => {
    segment.setScale(this.baseScale);
});
const newSegment = this.physics.add.image(lastSegment.x, lastSegment.y, 'snake')
    .setScale(this.baseScale);

    newSegment.setCircle(10);
    newSegment.body.setAllowGravity(false);
    newSegment.body.setImmovable(true);
    newSegment.setDepth(1);


    this.snakeBody.push(newSegment);

    const requiredHistory = (this.snakeBody.length + 1) * this.bodySpacing;
    while (this.positionHistory.length < requiredHistory) {
        this.positionHistory.push({ x: this.snake.x, y: this.snake.y });
    }

}
}
