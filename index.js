const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = innerWidth
canvas.height = innerHeight

const friction = 0.99
const playerFriction = 0.95
let currentScore = 0
let inGame = false
let frames = 0

const scoreBoard = document.querySelector("#score-board")
const scoreElt = document.querySelector("#score")
const finalScore = document.querySelector("#final-score")
const gameOverBoard = document.querySelector("#game-over-board")
const startButton = document.querySelector("#start-button")
const restartButton = document.querySelector("#restart-button")
const startGameBoard = document.querySelector("#start-game-board")
const volumeUpButton = document.querySelector("#volume-on")
const volumeDownButton = document.querySelector("#volume-off") 

let animationID
let intervalID
let spawnPowerUpsId

function unitVector(x, y) {
    return {
        x: x / Math.hypot(x, y),
        y: y / Math.hypot(x, y)
    }
}

let player
let projectiles = []
let enemies = []
let orphanParticles = []
let powerUps = []
let backgroundParticles = []

function init() {
    const x = canvas.width / 2
    const y = canvas.height / 2
    audio.select.play()
    projectiles = []
    enemies.forEach((enemy) => {
        enemy.particles = []
    })
    enemies = []
    frames = 0
    powerUps = []
    backgroundParticles = []
    for (let x = 0; x < canvas.width + 25; x += 25) {
        for (let y = 0; y < canvas.height + 25; y += 25) {
            backgroundParticles.push(
                new BackgroundParticle(
                    {
                        position: {
                            x,
                            y
                        }
                    }
                )
            )
        }
    }
    
    gsap.to("#game-over-board", {
        opacity: 0,
        scale: 0.8,
        duration: 0.3,
        ease: 'expo.in',
        onComplete: () => {
            gameOverBoard.style.display = 'none'
        }
    })
    gsap.to("#start-game-board", {
        opacity: 0,
        scale: 0.8,
        duration: 0.3,
        ease: 'expo.in',
        onComplete: () => {
            startGameBoard.style.display = 'none'
        }
    })
    currentScore = 0
    player = new Player(x, y, 10, 'white')
    scoreElt.innerHTML = currentScore
    inGame = true
    animate()
    spawnEnemies()
    spawnPowerups()
}

function spawnEnemies() {
    intervalID = setInterval(() => {
        const r = Math.random() * 30 + 10
        const l = Math.hypot(canvas.width / 2 , canvas.height / 2)
        const angle = Math.random() * 2 * Math.PI
        const x = canvas.width / 2 + l * Math.cos(angle) + r
        const y = canvas.height / 2 - l * Math.sin(angle) - r
        const color = `hsl(${Math.random() * 360}, 50%, 50%)`
        enemies.push(
            new Enemy(
                    x,
                    y,
                    r,
                    color,
                    {
                        x: (player.x - x) / 1000, 
                        y: (player.y - y) / 1000
                    }
            )
        )
    }, 1500)
}

function spawnPowerups() {
    spawnPowerUpsId = setInterval(() => {
        let spawnNewPowerup = Math.random() > 0.5
        if (powerUps.length < 5 && spawnNewPowerup) {
            powerUps.push(
                new PowerUp({
                    position: {
                        x: Math.random() * canvas.width / 3,
                        y: Math.random() * canvas.height
                    },
                    velocity: {
                        x: Math.random() * 3,
                        y: 0
                    }
                })
            )
        }
    }, 15000)
}

function constructParticles(projectile, enemy, full) {
    const a = Math.atan2(enemy.y - projectile.y, projectile.x - enemy.x)
    const v = unitVector(Math.tan(a), 1)
    const u = unitVector(enemy.x, enemy.y)
    const angle = full ? Math.PI * 2 : Math.PI
    const numParticles = full ? enemy.radius * 4 : enemy.radius * 2
    for (let  i = 0; i < numParticles; i++) {
        const b = i * angle / (numParticles - 1)
        const x = full ? Math.cos(b) : v.x * Math.cos(b) + u.x * Math.sin(b)
        const y = full ? Math.sin(b) : v.y * Math.cos(b) + v.y * Math.sin(b)
        const scale = full ? Math.random() * 11 : Math.random() * 8
        const particle = new Particle(
            full ? enemy.x : projectile.x,
            full ? enemy.y : projectile.y,
            Math.random() * 3,
            enemy.color,
            {
                x: x * scale,
                y: y * scale
            },
            lifetime = Math.random() * 10 + 10
        )
        if (full) {
            orphanParticles.push(particle)
        } else {
            enemy.particles.push(particle)
        }
    }
}

function createScoreLabel(enemy, score) {
    const scoreLabel = document.createElement("label")
    scoreLabel.className = "score-label"
    scoreLabel.innerHTML = "+" + score
    scoreLabel.style.color = enemy.color
    scoreLabel.style.left = enemy.x - enemy.radius
    scoreLabel.style.top = enemy.y - enemy.radius
    scoreLabel.style.pointerEvents = 'none'
    document.body.appendChild(scoreLabel)

    gsap.to(scoreLabel, {
        opacity: 0,
        y: -30,
        duration: 0.75,
        onComplete: () => {
            scoreLabel.parentNode.removeChild(scoreLabel)
        }
    })
}

function endGame() {
    // game over
    audio.death.play()
    cancelAnimationFrame(animationID)
    clearInterval(intervalID)
    clearInterval(spawnPowerUpsId)
    finalScore.innerHTML = currentScore
    gameOverBoard.style.display = 'block'
    inGame = false
    gsap.fromTo("#game-over-board", 
    {
        scale: 0.8,
        opacity: 0,
    }, {
        scale: 1,
        opacity: 1,
        ease: 'expo'
    })
    gsap.to("#game-over-board", {
        opacity: 1,
        scale: 1
    })
}

function animate() {
    animationID = requestAnimationFrame(animate)
    frames += 1
    c.fillStyle = 'rgba(0, 0, 0, 0.1)'
    c.fillRect(0, 0, canvas.width, canvas.height)
    backgroundParticles.forEach((backgroundParticle) => {
        backgroundParticle.draw()
        const dist = Math.hypot(player.x - backgroundParticle.position.x, player.y - backgroundParticle.position.y)

        if (dist < 60) {
            if (dist > 40) {
                backgroundParticle.alpha = 0.5
            } else {
                backgroundParticle.alpha = 0
            }
        } else if (dist >= 60 && backgroundParticle.alpha < 0.1) {
            backgroundParticle.alpha += 0.01
        } else if (dist >= 60 && backgroundParticle.alpha > 0.1) {
            backgroundParticle.alpha -= 0.01
        }
    })
    player.update()
    projectiles.forEach((projectile) => projectile.update())
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i]
        if (powerUp.isFullyOutOfBoundary()) {
            powerUps.splice(i, 1)
            continue
        }
        powerUp.update()
        const dist = Math.hypot(player.x - powerUp.position.x, player.y - powerUp.position.y)
        // gain power up
        if (dist < powerUp.image.height / 2 + player.radius) {
            audio.powerUp.play()
            powerUps.splice(i, 1)
            player.powerUp = 'MachineGun'
            setTimeout(() => {
                player.powerUp = null
            }, 15000)
        }
    }

    if (player.powerUp === 'MachineGun' && frames % 4 === 0) {
        const d = Math.hypot(mouse.position.x - player.x, mouse.position.y - player.y)
        const velocity = {
            x: 7 * (mouse.position.x - player.x) / d,
            y: 7 * (mouse.position.y - player.y) / d
        }
        projectiles.push(
            new MovingCircle(player.x, player.y, 5, 'yellow', velocity)
        )
        audio.shoot.play()
    }
    for (let  index = enemies.length - 1; index >= 0; index--) {
        const enemy = enemies[index]
        if (enemy.hasBeenInBoundary && enemy.isFullyOutOfBoundary()) {
            enemies.splice(index, 1)
            continue
        }
        enemy.update()
        const d = Math.hypot(player.x - enemy.x, player.y - enemy.y)
        if (d < enemy.radius + player.radius) {
            endGame()
        }
        for (let  pIndex = enemy.particles.length - 1; pIndex >= 0; pIndex--) {
            const particle = enemy.particles[pIndex]
            particle.update()
            if (particle.lifetime < 1) {
                enemy.particles.splice(pIndex, 1)
            }
        }
        for (let  pIndex = projectiles.length - 1; pIndex >= 0; pIndex--) {
            const projectile = projectiles[pIndex]
            if (projectile.isFullyOutOfBoundary()) {
                projectiles.splice(pIndex, 1)
            }
            const d = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y)
            if (d < projectile.radius + enemy.radius) {
                if (enemy.radius < projectile.radius * 2) {
                    // Enemy is dead
                    audio.explode.play()
                    constructParticles(projectile, enemy, true)
                    enemies.splice(index, 1)
                    currentScore += 150
                    createScoreLabel(enemy, 150)
                } else {
                    // Enemy is hit but not dead
                    audio.damageTaken.play()
                    constructParticles(projectile, enemy, false)
                    const scale = player.powerUp === "MachineGun" ? 0.4 : 0.6
                    gsap.to(enemy, {
                        radius: enemy.radius * scale
                    })
                    currentScore += 100
                    createScoreLabel(enemy, 100)
                }
                scoreElt.innerHTML = currentScore
                projectiles.splice(pIndex, 1)

                // change background particle colors
                backgroundParticles.forEach((backgroundParticle) => {
                    gsap.set(backgroundParticle, {
                        color: 'white',
                        alpha: 1
                    })
                    gsap.to(backgroundParticle, {
                        color: enemy.color
                    })
                })
            }
        }
    }
    for (let  pIndex = orphanParticles.length - 1; pIndex >= 0; pIndex--) {
        const particle = orphanParticles[pIndex]
        particle.update()
        if (particle.lifetime < 1) {
            orphanParticles.splice(pIndex, 1)
        }
    }
}

let audioInitialized = false

function shoot({x, y}) {
    if (!inGame) return
    if (!audioInitialized && !audio.background.playing()) {
        audio.background.play()
        audioInitialized = true
    }
    audio.shoot.play()
    const d = Math.hypot(x - player.x, y - player.y)
    const velocity = {
        x: 7 * (x - player.x) / d,
        y: 7 * (y - player.y) / d
    }
    projectiles.push(
        new MovingCircle(player.x, player.y, 5, 'white', velocity)
    )
}

addEventListener('click', (e) => {
    shoot({
        x: e.clientX,
        y: e.clientY
    })
})

addEventListener('touchstart', (e) => {
    shoot({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
    })
})

const mouse = {
    position: {
        x: 0,
        y: 0
    }
}
addEventListener('mousemove', (e) => {
    mouse.position.x = e.clientX
    mouse.position.y = e.clientY
})

addEventListener('touchmove', (e) => {
    mouse.position.x = e.touches[0].clientX
    mouse.position.y = e.touches[0].clientY
})

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // inactive: clear intervals
        clearInterval(intervalID)
        clearInterval(spawnPowerUpsId)
    } else {
        // spawn enemies and powerups
        intervalID = spawnEnemies()
        spawnPowerUpsId = spawnPowerups()
    }
})

restartButton.addEventListener('click', init)
startButton.addEventListener('click', init)
volumeUpButton.addEventListener('click', () => {
    audio.background.pause()
    volumeUpButton.style.display = 'none'
    volumeDownButton.style.display = 'block'

    for (let key in audio) {
        audio[key].mute(true)
    }
})
volumeDownButton.addEventListener('click', () => {
    audio.background.play()
    volumeUpButton.style.display = 'block'
    volumeDownButton.style.display = 'none'

    for (let key in audio) {
        audio[key].mute(false)
    }
})

window.addEventListener('resize', () => {
    canvas.width = innerWidth
    canvas.height = innerHeight

    cancelAnimationFrame(animationID)
    clearInterval(intervalID)
    clearInterval(spawnPowerUpsId)
    init()
})

window.addEventListener('keydown', (e) => {
    if (!inGame) return
    switch(e.key) {
        case 'w':
        case 'ArrowUp':
            player.velocity.y = -4
            break
        case 's':
        case 'ArrowDown':
                player.velocity.y = 4
                break
        case 'a':
        case 'ArrowLeft':
                player.velocity.x = -4
                break
        case 'd':
        case 'ArrowRight':
                player.velocity.x = 4
                break
    }
})