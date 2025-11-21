pipeline {
    agent any

    environment {
        IMAGE_NAME = "wilsonnn06/s-rusun-adm"
        IMAGE_TAG = "latest"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    sh """
                        docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
                    """
                }
            }
        }

        stage('Login Registry') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'registry-credentials',
                    usernameVariable: 'REGISTRY_USER',
                    passwordVariable: 'REGISTRY_PASS'
                )]) {
                    sh "echo \$REGISTRY_PASS | docker login ghcr.io -u \$REGISTRY_USER --password-stdin"
                }
            }
        }

        stage('Push Image') {
            steps {
                sh """
                    docker push ${IMAGE_NAME}:${IMAGE_TAG}
                """
            }
        }
    }

    post {
        success {
            echo "Image berhasil dibuild dan dipush!"
        }
        failure {
            echo "Pipeline gagal."
        }
    }
}
