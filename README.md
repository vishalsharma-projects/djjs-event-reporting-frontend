# DJJS Event Reporting System - Frontend

A modern Angular-based event reporting system for managing ashram data.

## Installation

### Prerequisites

Before installing the frontend application, ensure you have the following installed on your system:

- **Node.js**: Version 16.x or higher (recommended: 18.x or higher)
  - Download from [nodejs.org](https://nodejs.org/)
  - Verify installation: `node --version`
  
- **npm**: Comes bundled with Node.js
  - Verify installation: `npm --version`
  
- **Angular CLI**: Version 18 or higher
  - Will be installed as part of the setup process

### Step-by-Step Installation

1. **Navigate to the frontend directory**
   ```bash
   cd djjs-event-reporting-frontend
   ```

2. **Install project dependencies**
   ```bash
   npm install
   ```
   This will install all required packages listed in `package.json`, including:
   - Angular framework and core modules
   - Third-party libraries (Bootstrap, PrimeNG, ngx-bootstrap, etc.)
   - Development dependencies

3. **Verify installation**
   ```bash
   npm list --depth=0
   ```
   This command will show all installed packages to verify the installation was successful.

### Running the Application

#### Development Server

To start the development server:

```bash
npm start
```

Or alternatively:

```bash
ng serve
```

The application will be available at:
- **URL**: `http://localhost:4200`
- **Login Page**: `http://localhost:4200/auth/login`

The development server includes:
- Hot module replacement (HMR) for instant updates
- Source maps for debugging
- Live reload on file changes

#### Production Build

To build the application for production:

```bash
npm run build
```

Or for production with increased memory:

```bash
npm run build-prod
```

The production build will be created in the `dist/` directory, optimized and minified for deployment.

### Additional Commands

- **Run tests**: `npm test`
- **Run linting**: `npm run lint`
- **Run end-to-end tests**: `npm run e2e`
- **Open Cypress**: `npm run cypress:open`

### Troubleshooting

#### Common Issues

1. **Node version mismatch**
   - Ensure you're using Node.js v16 or higher
   - Use `nvm` (Node Version Manager) if you need to switch versions

2. **npm install fails**
   - Clear npm cache: `npm cache clean --force`
   - Delete `node_modules` folder and `package-lock.json`
   - Run `npm install` again

3. **Port 4200 already in use**
   - Use a different port: `ng serve --port 4201`
   - Or kill the process using port 4200

4. **Memory errors during build**
   - Use the production build command: `npm run build-prod`
   - This increases Node.js memory limit to 8GB

### Environment Configuration

Before running the application, ensure you have configured the environment files:

- `src/environments/environment.ts` - Development environment
- `src/environments/environment.prod.ts` - Production environment

Update the API endpoints and other configuration values as needed.

### Browser Support

The application supports the following browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### System Requirements

- **RAM**: Minimum 4GB (8GB recommended for development)
- **Disk Space**: At least 500MB free space for node_modules
- **Operating System**: Windows, macOS, or Linux

## License

This project is proprietary to DJJS and should not be distributed without permission.
