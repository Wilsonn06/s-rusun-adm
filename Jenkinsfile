pipeline {
    agent {
        kubernetes {
            yaml """
apiVersion: v1
kind: Pod
metadata:
  labels:
    jenkins: agent
spec:
  containers:
  - name: docker
    image: docker:24.0.5
    command:
    - cat
    tty: true
    volumeMounts:
    - name: dockersock
      mountPath: /var/run/docker.sock
  volumes:
  - name: dockersock
    hostPath:
      path: /var/run/docker.sock
"""
        }
    }

    environment {
        IMAGE_NAME = "s-rusun-adm"
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
                sh """
                    docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
                """
            }
        }

        stage('Export Image TAR') {
            steps {
                sh """
                    docker save ${IMAGE_NAME}:${IMAGE_TAG} -o image.tar
                """
                archiveArtifacts artifacts: 'image.tar', fingerprint: true
            }
        }
    }

    post {
        success {
            echo "Image berhasil dibuild & diexport!"
        }
    }
}
