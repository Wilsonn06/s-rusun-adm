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
  - name: kaniko
    image: gcr.io/kaniko-project/executor:latest
    command:
    - cat
    tty: true
    volumeMounts:
    - name: docker-config
      mountPath: /kaniko/.docker
  volumes:
  - name: docker-config
    secret:
      secretName: dockerhub-config-secret
"""
        }
    }

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

        stage('Build & Push with Kaniko') {
            steps {
                sh """
                /kaniko/executor \
                    --context `pwd` \
                    --dockerfile `pwd`/Dockerfile \
                    --destination=${IMAGE_NAME}:${IMAGE_TAG}
                """
            }
        }
    }

    post {
        success { echo "Build & Push via Kaniko berhasil!" }
        failure { echo "Pipeline gagal." }
    }
}
