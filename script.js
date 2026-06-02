const yearElement = document.getElementById("current-year");
if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}

const revealItems = document.querySelectorAll("[data-reveal]");
const revealObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                revealObserver.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.12 }
);

revealItems.forEach((item) => revealObserver.observe(item));

const navLinks = document.querySelectorAll(".site-nav a");
const navTargets = Array.from(navLinks)
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

const navObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            navLinks.forEach((link) => {
                link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
            });
        });
    },
    { rootMargin: "-42% 0px -52% 0px", threshold: 0 }
);

navTargets.forEach((target) => navObserver.observe(target));

const githubProjects = document.getElementById("github-projects");
const githubStatus = document.getElementById("github-status");
const githubUsername = "Jayasankar-R";

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatRepoDate(value) {
    if (!value) return "recent";

    return new Intl.DateTimeFormat("en", {
        month: "short",
        year: "numeric"
    }).format(new Date(value));
}

function renderGithubProjects(repos) {
    if (!githubProjects || !githubStatus) return;

    if (!repos.length) {
        githubStatus.textContent = "No public repositories found yet.";
        return;
    }

    githubStatus.textContent = `Showing ${repos.length} live repositories from GitHub.`;
    githubProjects.innerHTML = repos.map((repo) => {
        const description = repo.description || "Public GitHub repository by Jayasankar R.";
        const language = repo.language || "Code";
        const stars = repo.stargazers_count || 0;
        const updated = formatRepoDate(repo.pushed_at || repo.updated_at);

        return `
            <article class="github-card">
                <h4>${escapeHtml(repo.name)}</h4>
                <p>${escapeHtml(description)}</p>
                <div class="github-card-footer">
                    <span>${escapeHtml(language)}</span>
                    <span>${stars} stars</span>
                    <span>${escapeHtml(updated)}</span>
                    <a href="${escapeHtml(repo.html_url)}" target="_blank" rel="noreferrer">Open</a>
                </div>
            </article>
        `;
    }).join("");
}

async function loadGithubProjects() {
    if (!githubProjects || !githubStatus) return;

    try {
        const response = await fetch(`https://api.github.com/users/${githubUsername}/repos?sort=pushed&per_page=12`, {
            headers: {
                Accept: "application/vnd.github+json"
            }
        });

        if (!response.ok) {
            throw new Error(`GitHub responded with ${response.status}`);
        }

        const repos = await response.json();
        const visibleRepos = repos
            .filter((repo) => !repo.fork && !repo.archived && repo.name.toLowerCase() !== githubUsername.toLowerCase())
            .slice(0, 6);

        renderGithubProjects(visibleRepos);
    } catch (error) {
        githubStatus.textContent = "GitHub projects could not load right now. Use the GitHub link above to view all repositories.";
        githubProjects.innerHTML = "";
    }
}

loadGithubProjects();

const canvas = document.getElementById("signal-canvas");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (canvas && !reduceMotion) {
    const context = canvas.getContext("2d");
    const pointer = { x: 0, y: 0, active: false };
    let width = 0;
    let height = 0;
    let nodes = [];
    let animationFrame = null;

    function resizeCanvas() {
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = Math.floor(width * ratio);
        canvas.height = Math.floor(height * ratio);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        context.setTransform(ratio, 0, 0, ratio, 0, 0);

        const nodeCount = Math.max(34, Math.min(82, Math.floor(width / 18)));
        nodes = Array.from({ length: nodeCount }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.26,
            vy: (Math.random() - 0.5) * 0.26,
            radius: Math.random() * 1.8 + 1.1,
            hue: Math.random() > 0.62 ? "amber" : "cyan"
        }));
    }

    function drawConnection(a, b, distance) {
        const opacity = Math.max(0, 1 - distance / 190) * 0.22;
        context.strokeStyle = `rgba(118, 217, 207, ${opacity})`;
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
        context.stroke();
    }

    function updateNode(node) {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < -20) node.x = width + 20;
        if (node.x > width + 20) node.x = -20;
        if (node.y < -20) node.y = height + 20;
        if (node.y > height + 20) node.y = -20;

        if (pointer.active) {
            const dx = pointer.x - node.x;
            const dy = pointer.y - node.y;
            const distance = Math.hypot(dx, dy);

            if (distance < 180 && distance > 1) {
                node.x -= (dx / distance) * 0.22;
                node.y -= (dy / distance) * 0.22;
            }
        }
    }

    function drawNode(node) {
        context.fillStyle = node.hue === "amber" ? "rgba(242, 200, 107, 0.75)" : "rgba(89, 215, 200, 0.8)";
        context.beginPath();
        context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        context.fill();
    }

    function render() {
        context.clearRect(0, 0, width, height);

        for (let i = 0; i < nodes.length; i += 1) {
            const node = nodes[i];
            updateNode(node);

            for (let j = i + 1; j < nodes.length; j += 1) {
                const other = nodes[j];
                const distance = Math.hypot(node.x - other.x, node.y - other.y);
                if (distance < 190) {
                    drawConnection(node, other, distance);
                }
            }

            drawNode(node);
        }

        animationFrame = window.requestAnimationFrame(render);
    }

    resizeCanvas();
    render();

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("mousemove", (event) => {
        pointer.x = event.clientX;
        pointer.y = event.clientY;
        pointer.active = true;
    });
    window.addEventListener("mouseleave", () => {
        pointer.active = false;
    });

    window.addEventListener("pagehide", () => {
        if (animationFrame) {
            window.cancelAnimationFrame(animationFrame);
        }
    });
}
