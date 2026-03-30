# 🚀 AppForge — AI-Powered Multi-Language App Builder

Build Any App. Any Language. Instantly.

AppForge is a production-ready AI-powered developer platform that generates full-stack applications using modern, high-performance languages and frameworks — all from a single prompt.

---

## ✨ Features

### 🧠 AI App Generation

* Generate full-stack apps using a simple prompt
* Supports multiple backend languages:

  * Golang (Gin / Fiber)
  * Rust (Actix / Axum)
  * Zig
* Frontend:

  * Angular (default)
  * Flutter (optional)

---

### ⚙️ Smart Stack Enforcement

* Strict allowlist-based architecture
* Rejects unsupported technologies (e.g., React, Node.js)
* Automatically selects best stack if not specified

---

### 🧩 Template-Based Engine

* Prebuilt templates for:

  * Blog apps
  * Dashboards
  * APIs
  * Full-stack systems
* AI customizes templates dynamically

---

### 📁 Project Viewer

* File tree explorer
* Code preview panel
* Project stats and structure visualization

---

### 🔗 GitHub Integration

* Create repositories
* Push generated code directly
* Token-based authentication support

---

### 🚀 Deployment Ready

* Docker-ready projects
* One-click deploy simulation
* Vercel-compatible frontend

---

## 🏗️ Tech Stack

### Frontend

* Angular 17 (Standalone Components)
* TypeScript
* SCSS

### Backend (Generated Apps)

* Golang / Rust / Zig

### API Layer

* Vercel Serverless Functions (`/api`)

### DevOps

* Docker
* Terraform (optional)

---

## 📁 Project Structure

```
appforge/
│
├── src/
│   ├── app/
│   │   ├── components/
│   │   ├── services/
│   │   ├── app.component.ts
│   │   ├── app.routes.ts
│   │
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
│
├── api/
│   ├── parsePrompt.ts
│   ├── generateProject.ts
│   ├── validateStack.ts
│   ├── getTemplates.ts
│   ├── createRepo.ts
│   ├── pushRepo.ts
│   └── deployProject.ts
│
├── angular.json
├── package.json
├── tsconfig.json
└── vercel.json
```

---

## ⚡ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/appforge.git
cd appforge
```

---

### 2. Install Dependencies

```bash
npm install
```

---

### 3. Run Locally

```bash
npm start
```

---

### 4. Build Project

```bash
npm run build
```

---

## 🚀 Deploy on Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Use settings:

```
Build Command: npm run build
Output Directory: dist/appforge
Install Command: npm install
```

---

## 🔌 API Endpoints

| Endpoint               | Method | Description                     |
| ---------------------- | ------ | ------------------------------- |
| `/api/parsePrompt`     | POST   | Extracts stack from user prompt |
| `/api/generateProject` | POST   | Generates full project          |
| `/api/validateStack`   | POST   | Validates allowed tech          |
| `/api/getTemplates`    | GET    | Returns available templates     |
| `/api/createRepo`      | POST   | Creates GitHub repo             |
| `/api/pushRepo`        | POST   | Pushes code to GitHub           |
| `/api/deployProject`   | POST   | Simulates deployment            |

---

## 🎯 Use Case

* Developers who want to quickly bootstrap apps
* Hackathon teams
* Rapid prototyping
* Learning new stacks

---

## 🛑 Constraints

* Only allowed technologies are supported
* Disallowed tech returns:

  > "This technology is not allowed in current system constraints"

---

## 🌟 Future Improvements

* Live preview inside browser
* Real deployment integrations (AWS / GCP)
* Multi-user dashboard
* Project history & versioning

---

## 👩‍💻 Author

Built with ❤️ by Khushi

---

## ⭐ If you like this project

Give it a star ⭐ on GitHub and share with others!
