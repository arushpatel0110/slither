export default class Menu extends Phaser.Scene {
    constructor() {
        super({ key: 'Menu' });
        this.currentFaceIndex = 1;
        this.maxFaces = 7;

    }
    preload() {
        this.load.image('logo', 'assets/logo.png');
        this.load.image('bg', 'assets/bg.jpg');
        this.load.image('start', 'assets/start.png');

        for (let i = 1; i <= this.maxFaces; i++) {
            this.load.image(`face${i}`, `assets/face${i}.png`);
        }
    }

    create() {
 if (window.injectAdSense && typeof window.injectAdSense === 'function') {
  window.injectAdSense().then(() => {
    console.log("Ad system ready");
    window.gShowAd();
  });
} else {
  console.warn("Ad system not available");
}

        const width = this.scale.width;
        const height = this.scale.height;
        this.add.image(width / 2, height / 2, 'bg')
            .setDisplaySize(width, height)
            .setAlpha(0.6);

        this.add.image(width / 2 - 630, height / 2 - 250, 'logo')
            .setScale(0.3)
            .setDepth(2);
   
this.createTitleText('Snake.IO', this.scale.width / 2 - 300, this.scale.height / 2 - 350);

const instructionText = this.add.text(this.scale.width / 2+30, this.scale.height /2+110,
    'Use ← and → to change snake head', {
        fontSize: '32px',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        color: '#ffffff',   
        padding: { x: 20, y: 10 },
        align: 'center'
    }
).setOrigin(0.5)
 .setAlpha(0); 

this.tweens.add({
    targets: instructionText,
    alpha: 1,
    duration: 1000,
    ease: 'Power2',
    yoyo: true,
    hold: 2000, 
    onComplete: () => {
        instructionText.destroy();
    }
});


        this.nameInput = document.createElement('input');
        this.nameInput.type = 'text';
        this.nameInput.placeholder = 'Nickname';
        this.nameInput.maxLength = 12;

        Object.assign(this.nameInput.style, {
            position: 'absolute',
            fontSize: '20px',
            padding: '10px',
            borderRadius: '10px',
            textAlign: 'center',
            border: '2px solid #444',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000
        });

        document.body.appendChild(this.nameInput);

        this.faceImage = this.add.image(width / 2+250, height / 2, 'face1')
            .setScale(0.1)
            .setDepth(2).setAngle(90);

        this.input.keyboard.on('keydown-LEFT', () => {
            this.changeFace(-1);
        });

        this.input.keyboard.on('keydown-RIGHT', () => {
            this.changeFace(1);
        });

        this.btn = this.add.image(width / 2 , height / 2 + 240, 'start')
            .setScale(1)
            .setAlpha(0.2)
            .setDepth(2);

        const validate = () => {
            const name = this.nameInput.value.trim();
            const validName = /^[a-zA-Z]+$/.test(name);

            if (validName) {
                this.btn.setAlpha(1);
                this.btn.setInteractive();
            } else {
                this.btn.setAlpha(0.4);
                this.btn.disableInteractive();
            }
        };

        this.nameInput.addEventListener('input', validate);
        validate();

        this.btn.on('pointerdown', () => {
            const name = this.nameInput.value.trim();
            if (/^[a-zA-Z]+$/.test(name)) {
                localStorage.setItem('playerName', name);
                localStorage.setItem('selectedFace', `face${this.currentFaceIndex}`);
                this.nameInput.remove();
                this.scene.start('Game');
            }
        });
        this.scale.on('resize', this.updateInputPosition, this);
        this.updateInputPosition();

        this.events.once('shutdown', () => {
            if (this.nameInput) {
                this.nameInput.remove();
                this.nameInput = null;
            }
        });
    }
createTitleText(text, startX, y) {
    const colors = ['#4dff4d'];
    const delay = 150;
    let totalDelay = 0;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const color = colors[i % colors.length];

        const letter = this.add.text(startX + i * 70, y, char, {
            fontFamily: 'Maferic',
            fontSize: '120px',
            fontStyle: 'bold',
            color: color,
            stroke: '#000',
            strokeThickness: 9
        }).setAlpha(0);

        this.time.delayedCall(totalDelay, () => {
            this.tweens.add({
                targets: letter,
                alpha: 1,
                scale: { from: 0.5, to: 1 },
                ease: 'Back.Out',
                duration: 400
            });
        });

        totalDelay += delay;
    }
}

    changeFace(direction) {
        this.currentFaceIndex += direction;
        if (this.currentFaceIndex > this.maxFaces) {
            this.currentFaceIndex = 1;
        } else if (this.currentFaceIndex < 1) {
            this.currentFaceIndex = this.maxFaces;
        }

        this.faceImage.setTexture(`face${this.currentFaceIndex}`);
    }

    updateInputPosition() {
        const canvasBounds = this.game.canvas.getBoundingClientRect();
        const centerX = canvasBounds.left + canvasBounds.width / 2;
        const centerY = canvasBounds.top + canvasBounds.height / 2 ;

        if (this.nameInput) {
            this.nameInput.style.left = `${centerX}px`;
            this.nameInput.style.top = `${centerY}px`;
        }
    }
}
