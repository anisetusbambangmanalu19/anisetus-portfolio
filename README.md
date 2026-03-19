# Personal Portfolio - Anisetus Bambang Manalu

Portfolio website built with HTML, CSS, and JavaScript. This project is ready for free deployment with GitHub Pages.

## Tech Stack
- HTML5
- CSS3
- Vanilla JavaScript
- GitHub Actions (auto deploy)

## Local Preview
Open `index.html` directly in browser, or use a simple local server.

## Publish (Free) - Recommended: GitHub Pages
This repository already includes `.github/workflows/deploy.yml` for automatic deployment.

### Steps
1. Create a new GitHub repository, example: `anisetus-portfolio`.
2. Push this project to branch `main`.
3. In GitHub repository settings, open **Pages** and set source to **GitHub Actions**.
4. Push any change to `main`.
5. Wait for workflow `Deploy Portfolio to GitHub Pages` to finish.

Your website URL will be:
`https://anisetusbambangmanalu19.github.io/anisetus-portfolio/`

## Other Free Options
1. **Cloudflare Pages** (fast global CDN, very good for static sites)
2. **Netlify** (easy drag-and-drop deploy)
3. **Vercel** (great DX, simple deploy)

## Free Temporary Domain Alternatives

### Cloudflare Pages (recommended alternative)
This gives you a free temporary domain like:
`https://anisetus-portfolio.pages.dev`

Steps:
1. Login to Cloudflare Dashboard.
2. Open **Workers & Pages** > **Create** > **Pages**.
3. Connect your GitHub repository (`anisetus-portfolio`).
4. Build settings:
	- Framework preset: **None**
	- Build command: *(empty)*
	- Build output directory: `.`
5. Click **Save and Deploy**.

### Netlify
This gives you a free temporary domain like:
`https://anisetus-portfolio.netlify.app`

Steps:
1. Login to Netlify.
2. Click **Add new site** > **Import an existing project**.
3. Connect GitHub repository.
4. Build settings:
	- Build command: *(empty)*
	- Publish directory: `.`
5. Deploy site.

You can rename subdomain from Site settings.

## Customization Quick Notes
- Edit profile text in `index.html`.
- Theme and layout in `styles.css`.
- GitHub project cards in `script.js`.
