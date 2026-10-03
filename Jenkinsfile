pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()

        buildDiscarder(
            logRotator(
                numToKeepStr: '10'
            )
        )
    }

    environment {
        CI = 'true'
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }

        stage('Verify Environment') {
            steps {
                echo 'Checking Jenkins workspace and tools...'

                sh 'pwd'
                sh 'ls -la'
                sh 'node -v'
                sh 'npm -v'
            }
        }

        stage('Install Backend Dependencies') {
            steps {
                dir('backend') {
                    echo 'Installing backend dependencies...'

                    sh '''
                        if [ -f package-lock.json ]; then
                            npm ci
                        elif [ -f package.json ]; then
                            npm install
                        else
                            echo "No backend package.json found"
                            exit 1
                        fi
                    '''
                }
            }
        }

        stage('Install Frontend Dependencies') {
            steps {
                dir('frontend') {
                    echo 'Installing frontend dependencies...'

                    sh '''
                        if [ -f package-lock.json ]; then
                            npm ci
                        elif [ -f package.json ]; then
                            npm install
                        else
                            echo "No frontend package.json found"
                            exit 1
                        fi
                    '''
                }
            }
        }

        stage('Lint') {
            parallel {

                stage('Backend Lint') {
                    steps {
                        dir('backend') {
                            echo 'Running backend lint...'
                            sh 'npm run lint --if-present'
                        }
                    }
                }

                stage('Frontend Lint') {
                    steps {
                        dir('frontend') {
                            echo 'Running frontend lint...'
                            sh 'npm run lint --if-present'
                        }
                    }
                }
            }
        }

        stage('Test') {
            parallel {

                stage('Backend Test') {
                    steps {
                        dir('backend') {
                            echo 'Running backend tests...'
                            sh 'npm test --if-present'
                        }
                    }
                }

                stage('Frontend Test') {
                    steps {
                        dir('frontend') {
                            echo 'Running frontend tests...'
                            sh 'npm test --if-present'
                        }
                    }
                }
            }
        }

        stage('Build') {
            parallel {

                stage('Backend Build') {
                    steps {
                        dir('backend') {
                            echo 'Building backend...'
                            sh 'npm run build --if-present'
                        }
                    }
                }

                stage('Frontend Build') {
                    steps {
                        dir('frontend') {
                            echo 'Building frontend...'
                            sh 'npm run build --if-present'
                        }
                    }
                }
            }
        }

        stage('Check Build Output') {
            steps {
                echo 'Checking generated files...'

                sh '''
                    echo "===== Backend ====="
                    ls -la backend || true

                    echo "===== Frontend ====="
                    ls -la frontend || true

                    if [ -d frontend/dist ]; then
                        echo "Frontend dist folder found"
                        ls -la frontend/dist
                    fi

                    if [ -d frontend/build ]; then
                        echo "Frontend build folder found"
                        ls -la frontend/build
                    fi

                    if [ -d backend/dist ]; then
                        echo "Backend dist folder found"
                        ls -la backend/dist
                    fi
                '''
            }
        }

        stage('Deploy') {
            steps {
                echo 'Build and testing completed successfully.'
                echo 'Actual deployment command will be added here.'
            }
        }
    }

    post {

        success {
            echo '===================================='
            echo 'PIPELINE SUCCESS'
            echo 'Frontend and backend completed'
            echo '===================================='
        }

        failure {
            echo '===================================='
            echo 'PIPELINE FAILED'
            echo 'Check Console Output for the error'
            echo '===================================='
        }

        always {
            echo 'Jenkins pipeline execution finished.'
        }
    }
}
