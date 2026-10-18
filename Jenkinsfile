pipeline {
    agent any
    stages {
        stage('Checkout') { steps { checkout scm } }
        stage('Install') { steps { sh 'npm ci' } }
        stage('Lint') { steps { sh 'npm run lint' } }
        stage('Build') { steps { sh 'npm run build' } }
        stage('Test') { steps { sh 'npm test' } }
        stage('Docker Build') { steps { sh 'docker build -t service-desk-web:ci .' } }
    }
}
