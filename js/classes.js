class CanvasObject {
    isInBoundary() {
        return this.x + this.radius <= canvas.width
        && this.x - this.radius >= 0
        && this.y + this.radius <= canvas.height
        && this.y - this.radius >= 0
    }

    isFullyOutOfBoundary() {
        return this.x - this.radius > canvas.width
        || this.y - this.radius > canvas.height
        || this.x + this.radius < 0
        || this.y + this.radius < 0
    }

    willBeInBoundary() {
        return this.x + this.radius + this.velocity.x <= canvas.width
        && this.x - this.radius + this.velocity.x >= 0
        && this.y + this.radius + this.velocity.y <= canvas.height
        && this.y - this.radius + this.velocity.y >= 0
    }
}

class Circle extends CanvasObject{
    constructor(x, y, radius, color) {
        super()
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
    }

    draw() {
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        c.fillStyle = this.color
        c.fill()
    }
}

class MovingCircle extends Circle {
    constructor(x, y, radius, color, velocity) {
        super(x, y, radius, color)
        this.velocity = velocity
        this.hasBeenInBoundary = this.isInBoundary()
    }

    update() {
        this.draw()
        this.x += this.velocity.x
        this.y += this.velocity.y
    }
}

class Player extends MovingCircle {
    constructor(x, y, radius, color) {
        super(x, y, radius, color, {x: 0, y:0})
        this.powerUp = null
        this.initRadius = radius
    }

    update() {
        this.draw()
        if (this.powerUp === "MachineGun") {
            this.color = 'yellow'
            this.radius = this.initRadius * 1.5
        } else {
            this.color = 'white'
            this.radius = this.initRadius
        }
        if (this.willBeInBoundary()) {
            this.velocity.x *= playerFriction
            this.velocity.y *= playerFriction
            this.x += this.velocity.x
            this.y += this.velocity.y
        } else {
            this.velocity.x = 0
            this.velocity.y = 0
        }
    }
}

class Enemy extends MovingCircle{
    constructor(x, y, radius, color, velocity) {
        super(x, y, radius, color, velocity)
        this.particles = []
        const rand = Math.random()
        if (rand < 0.10) {
            this.type = 'SPINNING'
            this.center = {x, y}
            this.radians = 0
        } else if (rand < 0.5) {
            this.type = 'HOMING'
        } else if (rand < 0.55) {
            this.type = 'HOMING-SPINNING'
            this.center = {x, y}
            this.radians = 0
        } else {
            this.type = 'LINEAR'
        }
    }

    update() {
        if (this.isInBoundary()) {
            this.hasBeenInBoundary = true
        }
        let direction
        switch(this.type) {
            case 'HOMING':
                direction = unitVector(player.x - this.x, player.y - this.y)
                this.velocity.x = direction.x
                this.velocity.y = direction.y
                super.update()
                break
            case 'SPINNING':
                super.draw()
                this.center.x += this.velocity.x
                this.center.y += this.velocity.y
                this.radians += 0.1
                this.x = this.center.x + Math.cos(this.radians) * 30
                this.y = this.center.y + Math.sin(this.radians) * 30
                break
            case 'HOMING-SPINNING':
                super.draw()
                direction = unitVector(player.x - this.x, player.y - this.y)
                this.velocity.x = direction.x
                this.velocity.y = direction.y
                this.center.x += this.velocity.x
                this.center.y += this.velocity.y
                this.radians += 0.1
                this.x = this.center.x + Math.cos(this.radians) * 30
                this.y = this.center.y + Math.sin(this.radians) * 30
                break
            default:
                super.update()

        }
    }
}

class Particle extends MovingCircle {
    constructor(x, y, radius, color, velocity, lifetime) {
        super(x, y, radius, color, velocity)
        this.lifetime = lifetime
        this.initLifetime = lifetime
    }

    draw() {
        c.save()
        c.globalAlpha = this.lifetime / this.initLifetime
        super.draw()
        c.restore()
    }

    update() {
        this.draw()
        this.velocity.x *= playerFriction
        this.velocity.y *= playerFriction
        this.x += this.velocity.x
        this.y += this.velocity.y
        this.lifetime -= 1
    }
}

class PowerUp extends CanvasObject{
    constructor({position = {x: 0, y:0}, velocity}) {
        super()
        this.position = position
        this.velocity = velocity
        this.image = new Image()
        this.image.src = "./img/lightningBolt.png"
        this.alpha = 1
        this.radians = 0

        gsap.to(this, {
            alpha: 0,
            duration: 0.2,
            repeat: -1,
            yoyo: true,
            ease: 'linear'
        })
    }

    draw() {
        c.save()
        c.globalAlpha = this.alpha
        c.translate(this.position.x + this.image.width / 2, this.position.y + this.image.height / 2)
        c.rotate(this.radians)
        c.translate(-this.position.x - this.image.width / 2, -this.position.y - this.image.height / 2)
        c.drawImage(this.image, this.position.x, this.position.y)
        c.restore()
    }

    update() {
        this.draw()
        this.radians += 0.01
        this.position.x += this.velocity.x
        this.position.y += this.velocity.y
    }
}

class BackgroundParticle {
    constructor({position, radius = 1.5, color = 'grey'}) {
        this.position = position
        this.radius = radius
        this.color = color
        this.alpha = 0.1
    }

    draw() {
        c.save()
        c.globalAlpha = this.alpha
        c.beginPath()
        c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2)
        c.fillStyle = this.color
        c.fill()
        c.restore()
    }
}