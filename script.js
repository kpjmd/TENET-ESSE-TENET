let canvas, ctx, width, height;
let particles = [];
let ripples = [];
let gravityWells = [];
const mouse = { x: null, y: null };

class Particle {
    constructor(x, y, char) {
        this.x = x;
        this.y = y;
        this.char = char;
        this.baseX = x;
        this.baseY = y;
        this.vx = 0;
        this.vy = 0;
    }

    draw() {
        const fontSize = Math.min(48, width / 20);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        ctx.shadowBlur = 10;
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillText(this.char, this.x, this.y);
        ctx.shadowBlur = 0;
    }

    update(mouseX, mouseY) {
        let dx = mouseX - this.x;
        let dy = mouseY - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        let maxDistance = 150;
        let force = 0;
        
        // Ripple effect
        ripples.forEach(ripple => {
            let rippleDx = ripple.x - this.x;
            let rippleDy = ripple.y - this.y;
            let rippleDistance = Math.sqrt(rippleDx * rippleDx + rippleDy * rippleDy);
            if (rippleDistance < ripple.radius) {
                let angle = Math.atan2(rippleDy, rippleDx);
                let rippleForce = (1 - rippleDistance / ripple.radius) * 0.05;
                this.vx -= Math.cos(angle) * rippleForce;
                this.vy -= Math.sin(angle) * rippleForce;
            }
        });

        // Gravity wells effect
        gravityWells.forEach(well => {
            let wellDx = well.x - this.x;
            let wellDy = well.y - this.y;
            let wellDistance = Math.sqrt(wellDx * wellDx + wellDy * wellDy);
            if (wellDistance < well.radius) {
                let force = (well.radius - wellDistance) / well.radius * well.strength;
                this.vx += wellDx * force;
                this.vy += wellDy * force;
            }
        });

        // Mouse repulsion
        if (distance < maxDistance) {
            force = (maxDistance - distance) / maxDistance;
            this.vx -= dx * force * 0.02;
            this.vy -= dy * force * 0.02;
        }

        // Return to base position
        let returnForce = 0.05;
        this.vx += (this.baseX - this.x) * returnForce;
        this.vy += (this.baseY - this.y) * returnForce;

        // Apply velocity with damping
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.9;
        this.vy *= 0.9;
    }

    mirrorParticle() {
        const centerX = width / 2;
        if (this.baseX < centerX) {
            let mirrorParticle = particles.find(p => p.baseX === 2 * centerX - this.baseX);
            if (mirrorParticle) {
                mirrorParticle.x = 2 * centerX - this.x;
                mirrorParticle.y = this.y;
                mirrorParticle.vx = -this.vx;
                mirrorParticle.vy = this.vy;
            }
        }
    }
}

class Ripple {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 0;
        this.maxRadius = 100;
        this.speed = 2;
    }

    update() {
        this.radius += this.speed;
        return this.radius < this.maxRadius;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${1 - this.radius / this.maxRadius})`;
        ctx.stroke();
    }
}

class GravityWell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.strength = 0.1;
        this.radius = 100;
        this.lifespan = 100;
    }

    update() {
        this.lifespan--;
        return this.lifespan > 0;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.lifespan / 100 * 0.2})`;
        ctx.fill();
    }
}

function init() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    initParticles();

    // Event listeners
    canvas.addEventListener('mousemove', updateMousePosition);
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        updateMousePosition(e);
    }, { passive: false });
    canvas.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
    });
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        gravityWells.push(new GravityWell(x, y));
    });

    animate();
}

function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    width = canvas.width;
    height = canvas.height;
    initParticles(); // Reinitialize particles when resizing
}

function initParticles() {
    particles = [];
    const text = "TENET ESSE TENET ↫";
    const fontSize = Math.min(48, width / 20);
    ctx.font = `bold ${fontSize}px Arial`;
    const totalWidth = ctx.measureText(text).width;
    const letterSpacing = fontSize * 0.5;
    const startX = (width - (totalWidth + letterSpacing * (text.length - 1))) / 2;
    const startY = height / 2;

    for (let i = 0; i < text.length; i++) {
        const x = startX + ctx.measureText(text.substring(0, i)).width + letterSpacing * i;
        particles.push(new Particle(x, startY, text[i]));
    }
}

function animate() {
    ctx.clearRect(0, 0, width, height);
    
    // Create gradient background
    const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height)/2);
    gradient.addColorStop(0, '#000033');
    gradient.addColorStop(1, '#000011');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Update and draw ripples
    ripples = ripples.filter(ripple => {
        if (ripple.update()) {
            ripple.draw();
            return true;
        }
        return false;
    });

    // Update and draw gravity wells
    gravityWells = gravityWells.filter(well => {
        if (well.update()) {
            well.draw();
            return true;
        }
        return false;
    });

    // Update and draw particles
    particles.forEach(p => {
        p.update(mouse.x, mouse.y);
        p.mirrorParticle();
        p.draw();
    });

    requestAnimationFrame(animate);
}

function updateMousePosition(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
        mouse.x = (e.touches[0].clientX - rect.left) * scaleX;
        mouse.y = (e.touches[0].clientY - rect.top) * scaleY;
    } else {
        mouse.x = (e.clientX - rect.left) * scaleX;
        mouse.y = (e.clientY - rect.top) * scaleY;
    }
    ripples.push(new Ripple(mouse.x, mouse.y));
}

document.addEventListener('DOMContentLoaded', init);