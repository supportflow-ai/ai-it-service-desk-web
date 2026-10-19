pipeline {
    agent any
    stages {
        stage('Checkout') { steps { checkout scm } }
        stage('Runtime') { steps { sh '''node -e "if (process.versions.node.split('.')[0] !== '22') throw new Error('Node.js 22 is required')"''' } }
        stage('Install') { steps { sh 'npm ci' } }
        stage('Lint') { steps { sh 'npm run lint' } }
        stage('Typecheck') { steps { sh 'npm run typecheck' } }
        stage('Build') { steps { sh 'npm run build' } }
        stage('Test') { steps { sh 'npm test' } }
        stage('Browser Smoke') { steps { sh 'npx playwright install --with-deps chromium'; sh 'npm run test:e2e' } }
        stage('Docker Build') { steps { sh 'docker build -t service-desk-web:ci .' } }
    }
    post { failure { archiveArtifacts artifacts: 'playwright-report/**,test-results/**', allowEmptyArchive: true } }
}
