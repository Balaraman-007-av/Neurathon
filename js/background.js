document.addEventListener('DOMContentLoaded', () => {
    // Create container for interactive elements if it doesn't exist
    let container = document.getElementById('interactive-bg');
    if (!container) {
        container = document.createElement('div');
        container.id = 'interactive-bg';
        document.body.prepend(container);
    }

    // Create blobs
    const blobs = [];
    const colors = ['#22d3ee', '#818cf8', '#e879f9']; // Cyan, Indigo, Pink

    for (let i = 0; i < 3; i++) {
        const blob = document.createElement('div');
        blob.classList.add('interactive-blob');
        blob.style.backgroundColor = colors[i];
        blob.style.width = Math.random() * 300 + 200 + 'px'; // 200-500px
        blob.style.height = blob.style.width;

        // Random initial position
        blob.x = Math.random() * window.innerWidth;
        blob.y = Math.random() * window.innerHeight;
        blob.vx = (Math.random() - 0.5) * 2; // Velocity X
        blob.vy = (Math.random() - 0.5) * 2; // Velocity Y

        blob.style.left = blob.x + 'px';
        blob.style.top = blob.y + 'px';

        container.appendChild(blob);
        blobs.push(blob);
    }

    // Mouse interaction
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        // Update CSS variables for text gradient effect
        document.documentElement.style.setProperty('--mouse-x', mouseX + 'px');
        document.documentElement.style.setProperty('--mouse-y', mouseY + 'px');
    });

    // Animation Loop
    function animate() {
        blobs.forEach((blob, index) => {
            // Move blobs slightly based on mouse
            const dx = (mouseX - window.innerWidth / 2) * 0.05 * (index + 1);
            const dy = (mouseY - window.innerHeight / 2) * 0.05 * (index + 1);

            // Add floating animation
            blob.x += blob.vx;
            blob.y += blob.vy;

            // Bounce off edges
            if (blob.x < -100 || blob.x > window.innerWidth) blob.vx *= -1;
            if (blob.y < -100 || blob.y > window.innerHeight) blob.vy *= -1;

            // Apply transform
            blob.style.transform = `translate(${dx}px, ${dy}px)`;
            blob.style.left = blob.x + 'px';
            blob.style.top = blob.y + 'px';
        });

        requestAnimationFrame(animate);
    }

    animate();
});
