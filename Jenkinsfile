pipeline {
    agent any

    environment {
        IMAGE_NAME = "s-rusun-adm:latest"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                sh """
                    docker build -t ${IMAGE_NAME} .
                """
            }
        }

        stage('Save Image to TAR') {
            steps {
                sh """
                    docker save ${IMAGE_NAME} -o adm-image.tar
                """
            }
        }

        stage('Load Image to k3d') {
            steps {
                sh """
                    k3d image import adm-image.tar --cluster default
                """
            }
        }
    }

    post {
        success {
            echo "Image berhasil dibuild & dimuat ke k3d!"
        }
    }
}
