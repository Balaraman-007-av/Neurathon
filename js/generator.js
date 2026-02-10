
// Check Auth
const currentUser = Auth.checkAuth(true);
if (currentUser) {
    document.getElementById('userName').innerText = currentUser.name;
    // Auto-fill existing user info if available (skipped for now as we just have name/email)
}

const generateBtn = document.getElementById('generateBtn');
const progressBar = document.getElementById('progressBar');
const statusText = document.getElementById('statusText');
const statusCard = document.getElementById('statusCard');
const previewFrame = document.getElementById('previewFrame');
const leftCol = document.getElementById('leftCol');
const rightCol = document.getElementById('rightCol');
const mainContainer = document.getElementById('mainContainer');
const actionButtons = document.getElementById('actionButtons');
const hostLink = document.getElementById('hostLink');

let generatedHTML = '';


// Helper to read file as base64
const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
};

document.getElementById('portfolioForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const bio = document.getElementById('pBio').value;
    if (bio.length < 25) {
        alert("Bio must be at least 25 characters long.");
        return;
    }

    // Gemini API Key is now hardcoded as requested
    const apiKey = "AIzaSyBdRdOqg8JFwC9AOkt2A4toPtqcMVBGZBo";

    // UI Loading State 
    setLoading(true);
    statusText.innerText = "Reading files...";

    // Handle File Uploads
    const photoFile = document.getElementById('pPhoto').files[0];
    const resumeFile = document.getElementById('pResume').files[0];

    let photoBase64 = null;
    let resumeBase64 = null;

    try {
        if (photoFile) {
            photoBase64 = await readFileAsBase64(photoFile);
        }
        if (resumeFile) {
            resumeBase64 = await readFileAsBase64(resumeFile);
        }
    } catch (err) {
        console.error("File Read Error", err);
        statusText.innerText = "Error reading files.";
        setLoading(false);
        return;
    }

    statusText.innerText = "Initializing AI model...";

    const formData = {
        name: document.getElementById('pName').value,
        title: document.getElementById('pTitle').value,
        bio: document.getElementById('pBio').value,
        // We do NOT pass the base64 to the AI prompt to save tokens. We use placeholders.
        photo: photoBase64 ? "USE_PLACEHOLDER_PHOTO" : null,
        resume: resumeBase64 ? "USE_PLACEHOLDER_RESUME" : null,
        email: document.getElementById('pEmail').value,
        linkedin: document.getElementById('pLinkedin').value,
        github: document.getElementById('pGithub').value,
        skills: document.getElementById('pSkills').value,
        tools: document.getElementById('pTools').value,
        design: document.getElementById('pDesign').value,
        projects: collectProjectData()
    };

    try {
        let code; // This will hold the HTML string

        // Always try real API first since we have the key
        try {
            code = await generatePortfolio(apiKey, formData);
        } catch (apiError) {
            console.warn("Generation failed, switching to demo mode.");
            statusText.innerText = `Taking longer than expected... Switching to Offline Mode...`;
            statusText.classList.add('text-yellow-400');
            await new Promise(r => setTimeout(r, 2000));
            code = generateMockPortfolio(formData);
        }

        statusText.innerText = "Processing files...";
        statusText.classList.remove('text-yellow-400');

        // Post-processing: Inject the Real Base64 Data
        if (photoBase64) {
            // Replace placeholder with actual base64
            code = code.replace(/['"]USE_PLACEHOLDER_PHOTO['"]/g, `"${photoBase64}"`);
            // Also try to catch if AI did something like src="USE_PLACEHOLDER_PHOTO" without quotes
            code = code.replace(/USE_PLACEHOLDER_PHOTO/g, photoBase64);
        } else {
            // Fallback if no photo
            code = code.replace(/USE_PLACEHOLDER_PHOTO/g, 'https://via.placeholder.com/150');
        }

        if (resumeBase64) {
            code = code.replace(/['"]USE_PLACEHOLDER_RESUME['"]/g, `"${resumeBase64}"`);
            code = code.replace(/USE_PLACEHOLDER_RESUME/g, resumeBase64);
        } else {
            code = code.replace(/USE_PLACEHOLDER_RESUME/g, '#');
        }


        renderPortfolio(code);
        generatedHTML = code;
        setLoading(false);

    } catch (error) {
        setLoading(false);
        statusText.innerText = 'Critical Error: ' + error.message;
        statusText.classList.add('text-red-400');
    }
});

// Project Field Management
const projectCountInput = document.getElementById('projectCount');
const projectsContainer = document.getElementById('projectsContainer');

if (projectCountInput && projectsContainer) {
    projectCountInput.addEventListener('change', updateProjectFields);
    projectCountInput.addEventListener('input', updateProjectFields);
}

function updateProjectFields() {
    const count = parseInt(projectCountInput.value) || 0;
    const currentFields = projectsContainer.children.length;

    if (count > currentFields) {
        // Add fields
        for (let i = currentFields; i < count; i++) {
            const projectDiv = document.createElement('div');
            projectDiv.className = 'glass p-4 rounded-xl border border-slate-600/50 space-y-3 animate-fade-in';
            projectDiv.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <span class="text-xs font-bold text-cyan-400 uppercase">Project ${i + 1}</span>
                </div>
                <input type="text" class="proj-name w-full bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-400 outline-none" placeholder="Project Name" required>
                <textarea class="proj-desc w-full bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-400 outline-none resize-none h-16" placeholder="Brief description of the project..." required></textarea>
                <input type="text" class="proj-tech w-full bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-400 outline-none" placeholder="Tech Stack (e.g., React, Node.js)" required>
            `;
            projectsContainer.appendChild(projectDiv);
        }
    } else if (count < currentFields) {
        // Remove fields
        while (projectsContainer.children.length > count) {
            projectsContainer.removeChild(projectsContainer.lastChild);
        }
    }
}

function collectProjectData() {
    const projects = [];
    if (!projectsContainer) return projects;

    const projectDivs = projectsContainer.children;
    for (let div of projectDivs) {
        projects.push({
            name: div.querySelector('.proj-name').value,
            description: div.querySelector('.proj-desc').value,
            tech: div.querySelector('.proj-tech').value
        });
    }
    return projects;
}


function generateMockPortfolio(data) {
    // Simple logic to detect if user wants light mode in Mock
    const designLower = data.design.toLowerCase();
    const isLight = designLower.includes('light') || designLower.includes('white') || designLower.includes('clean') || designLower.includes('minimal');

    const bgClass = isLight ? "bg-white text-slate-900" : "bg-slate-900 text-slate-100";
    const cardClass = isLight ? "bg-white/50 border border-slate-200 shadow-xl" : "bg-slate-800/50 border border-slate-700";
    const accentColor = "cyan"; // Could be dynamic too

    const skillsList = data.skills.split(',').map(s => s.trim()).filter(s => s).map(s => `<span class="${isLight ? 'bg-cyan-100 text-cyan-700 border-cyan-200' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'} px-3 py-1 rounded-full text-sm font-medium border">${s}</span>`).join('');
    const toolsList = data.tools.split(',').map(t => t.trim()).filter(t => t).map(t => `<span class="${isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-700 text-slate-300'} px-3 py-1 rounded-full text-sm font-medium">${t}</span>`).join('');

    return `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.name} - Portfolio</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">
    <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
    <style>
        body { font-family: 'Inter', sans-serif; }
        .glass-card { backdrop-filter: blur(10px); }
        .gradient-text { background: linear-gradient(to right, #22d3ee, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    </style>
</head>
<body class="${bgClass} overflow-x-hidden">
    
    <!-- Hero -->
    <section class="min-h-screen flex items-center justify-center relative overflow-hidden">
        ${!isLight ? `<div class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div class="absolute top-20 right-20 w-72 h-72 bg-cyan-500/20 rounded-full blur-[100px]"></div>
        <div class="absolute bottom-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-[100px]"></div>` : ''}
        
        <div class="container mx-auto px-6 relative z-10 text-center" data-aos="fade-up">
            <!-- Content same as before but adapted -->
             <div class="w-32 h-32 mx-auto mb-8 rounded-full border-4 border-cyan-500/30 p-1">
                <img src="${data.photo}" alt="Profile" class="w-full h-full rounded-full object-cover">
            </div>
            <h1 class="text-5xl md:text-7xl font-bold mb-4">Hi, I'm <span class="gradient-text">${data.name}</span></h1>
            <p class="text-xl md:text-2xl opacity-80 mb-8">${data.title}</p>
            <div class="flex justify-center gap-4">
                <a href="#contact" class="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105">Hire Me</a>
                <a href="${data.resume}" target="_blank" class="border ${isLight ? 'border-slate-300 text-slate-600 hover:bg-slate-50' : 'border-slate-600 text-slate-300 hover:text-white'} py-3 px-8 rounded-full transition-all">View Resume</a>
            </div>
        </div>
    </section>
    
    <!-- Simplified rest of Mock for brevity, using class variables -->
    <section class="py-20 ${isLight ? 'bg-slate-50' : 'bg-slate-800/50'}" id="about">
        <div class="container mx-auto px-6 max-w-4xl">
            <h2 class="text-3xl font-bold mb-12 text-center" data-aos="fade-up">About Me</h2>
            <div class="glass-card ${cardClass} p-8 rounded-2xl" data-aos="fade-up" data-aos-delay="100">
                <p class="text-lg opacity-90 leading-relaxed">${data.bio}</p>
            </div>
        </div>
    </section>

    <!-- Projects (Mock) -->
    ${data.projects && data.projects.length > 0 ? `
    <section class="py-20 ${isLight ? 'bg-slate-100' : 'bg-slate-900/50'}" id="projects">
        <div class="container mx-auto px-6 max-w-5xl">
            <h2 class="text-4xl font-bold mb-16 text-center" data-aos="fade-up">Featured Projects</h2>
            <div class="space-y-16">
                ${data.projects.map((p, index) => `
                <div class="glass-card ${cardClass} p-10 rounded-3xl hover:transform hover:scale-[1.01] transition-all duration-300 border-l-4 border-cyan-400" data-aos="fade-up" data-aos-delay="${index * 100}">
                    <h3 class="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">${p.name}</h3>
                    <p class="opacity-80 mb-8 text-xl leading-relaxed">${p.description}</p>
                    <div class="flex flex-wrap gap-3">
                        ${p.tech.split(',').map(t => `<span class="text-sm px-4 py-2 rounded-full ${isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-700/50 text-cyan-300 border border-cyan-500/30'}">${t.trim()}</span>`).join('')}
                    </div>
                </div>
                `).join('')}
            </div>
        </div>
    </section>
    ` : ''}

    <!-- Skills -->
    <section class="py-20" id="skills">
        <div class="container mx-auto px-6 max-w-4xl">
            <h2 class="text-3xl font-bold mb-12 text-center" data-aos="fade-up">Technical Arsenal</h2>
            
            <div class="mb-10" data-aos="fade-right">
                <h3 class="text-xl text-cyan-400 mb-4 font-semibold">Core Skills</h3>
                <div class="flex flex-wrap gap-3">
                    ${skillsList}
                </div>
            </div>

            <div data-aos="fade-left">
                <h3 class="text-xl text-blue-400 mb-4 font-semibold">Tools & Frameworks</h3>
                <div class="flex flex-wrap gap-3">
                    ${toolsList}
                </div>
            </div>
        </div>
    </section>



    <!-- Contact -->
    <section class="py-20" id="contact">
        <div class="container mx-auto px-6 text-center max-w-2xl" data-aos="fade-up">
            <h2 class="text-3xl font-bold mb-8">Let's Work Together</h2>
            <p class="opacity-70 mb-8">I'm currently available for freelance work or full-time opportunities.</p>
            <div class="flex justify-center gap-6 text-3xl">
                <a href="mailto:${data.email}" class="opacity-60 hover:text-cyan-400 transition-colors"><i class="fas fa-envelope"></i></a>
                <a href="${data.linkedin}" target="_blank" class="opacity-60 hover:text-blue-500 transition-colors"><i class="fab fa-linkedin"></i></a>
                <a href="${data.github}" target="_blank" class="opacity-60 hover:opacity-100 transition-colors"><i class="fab fa-github"></i></a>
            </div>
        </div>
    </section>

    <footer class="py-8 text-center opacity-50 text-sm border-t border-slate-700">
        <p>© ${new Date().getFullYear()} ${data.name}. All rights reserved.</p>
    </footer>

    <script>
        AOS.init({ duration: 800, once: true });
    </script>
</body>
</html>`;
}

// Keep existing generatePortfolio function but ensure error handling


function setLoading(isLoading) {
    if (isLoading) {
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<div class="loader"></div> Generating...';

        // Show status card
        statusCard.classList.remove('hidden');

        // Hide preview and actions initially
        previewFrame.classList.add('hidden');
        actionButtons.classList.add('hidden');

        // Trigger Layout Transition
        if (leftCol && rightCol) {
            // Check if layout is already transformed
            const isAlreadyTransformed = mainContainer && mainContainer.classList.contains('gap-[20px]');

            if (!isAlreadyTransformed) {
                // Add gap to container (20px)
                if (mainContainer) {
                    mainContainer.classList.remove('gap-0');
                    mainContainer.classList.add('gap-[20px]');
                }

                // Move Left Col to side
                leftCol.classList.remove('max-w-3xl', 'mx-auto');
                leftCol.classList.add('lg:w-[calc(50%-10px)]');

                // Show Right Col
                rightCol.classList.remove('w-0', 'opacity-0', 'overflow-hidden');
                rightCol.classList.add('w-full', 'lg:w-[calc(50%-10px)]', 'opacity-100');
            }
        }

        // Progress simulation
        let width = 0;
        statusText.innerText = "Generating... 0%";
        const interval = setInterval(() => {
            if (width >= 99) {
                clearInterval(interval);
            } else {
                width += Math.random() * 2; // Slower increment
                if (width > 99) width = 99;
                progressBar.style.width = width + '%';
                statusText.innerText = `Generating... ${Math.round(width)}%`;
            }
        }, 100);
        window.progressInterval = interval;
    } else {
        clearInterval(window.progressInterval);
        progressBar.style.width = '100%';
        statusText.innerText = "Generating... 100%";
        setTimeout(() => {
            statusText.innerText = "Generation Complete!";
        }, 500);

        generateBtn.disabled = false;
        generateBtn.innerHTML = '<span>Generate New Version</span><i class="fas fa-magic"></i>';
    }
}

async function generatePortfolio(apiKey, data) {
    const prompt = `
    You are an expert Frontend Developer. Create a Single Page Personal Portfolio Website using HTML, CSS (Tailwind CDN), and JavaScript.
    
    Here are the user details:
    - Name: ${data.name}
    - Title: ${data.title}
    - Bio: ${data.bio}
    - Photo URL: ${data.photo === "USE_PLACEHOLDER_PHOTO" ? "USE_PLACEHOLDER_PHOTO" : (data.photo || 'https://via.placeholder.com/150')}
    - Email: ${data.email}
    - LinkedIn: ${data.linkedin}
    - GitHub: ${data.github}
    - Resume URL: ${data.resume === "USE_PLACEHOLDER_RESUME" ? "USE_PLACEHOLDER_RESUME" : data.resume}
    - Skills: ${data.skills}
    - Tools: ${data.tools}
    - Projects: ${JSON.stringify(data.projects)}
    
    REQUIREMENTS:
    1. STRICTLY SINGLE FILE: Put all CSS in <style> and JS in <script> tags within one HTML file.
    2. Use Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
    3. Make it INTERACTIVE: Add hover effects, smooth scrolling, and scroll animations.
    4. Sections: Hero (with Name/Title/Photo), About, Featured Projects (if any), Skills & Tools (Display as pills/grid), Contact.
    5. IMPORTANT: For the Profile Photo, put the exact string "USE_PLACEHOLDER_PHOTO" in the src attribute.
    6. IMPORTANT: For the Resume Link, put the exact string "USE_PLACEHOLDER_RESUME" in the href attribute (and add download attribute if it makes sense).

    **CRITICAL DESIGN INSTRUCTIONS (FOLLOW THESE STRICTLY):**
    - **USER'S DESIGN REQUEST**: "${data.design}"
    - **BACKGROUND COLOR**: If user asks for Light/White/Clean -> Body MUST be 'bg-white' or 'bg-slate-50'. If Dark/Modern -> 'bg-slate-900' or 'bg-black'.
    - **PROJECTS SECTION**: 
        - Layout: **Vertical Stack** (One project per row), NOT a grid.
        - Typography: Use **Large Fonts** for project titles (text-3xl or larger) and increase description size (text-lg).
        - Styling: **NO IMAGES/ICONS** for projects. Focus on typography and card styling (glassmorphism/borders).
    - **DO NOT** use a generic "Dark Slate" theme unless the user asked for it.
    - **DO NOT** simply center everything. Use interesting layouts (asymmetric, split screen, grid-based).
    - **COLOR PALETTE**: derive a unique color palette relative to the user's request. If they say "Nature", use Greens/Browns. If "Ocean", use Teals/Blues. If "Elegant", use Black/Gold or Serif fonts.
    - **Create a truly unique portfolio** that looks different from a standard template.
    
    7. Return ONLY the raw HTML code. Do not wrap it in markdown blocks like \`\`\`html.
    `;

    // Gemini API Endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: prompt }]
            }]
        })
    });

    const json = await response.json();

    if (json.error) {
        throw new Error(json.error.message || "Gemini API Error");
    }

    if (!json.candidates || !json.candidates[0].content) {
        throw new Error("Gemini returned an empty response. blocked?");
    }

    let content = json.candidates[0].content.parts[0].text;
    // Cleanup simple markdown if present
    content = content.replace(/^```html/, '').replace(/```$/, '');
    return content;
}

function renderPortfolio(htmlCode) {
    // Create Blob to simulate hosting
    const blob = new Blob([htmlCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    previewFrame.src = url;
    previewFrame.classList.remove('hidden');

    hostLink.href = url;
    actionButtons.classList.remove('hidden');
}

function downloadCode() {
    const blob = new Blob([generatedHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'portfolio.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
