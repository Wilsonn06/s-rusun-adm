pipeline {
  agent any
  environment {
    REGISTRY = "localhost:5000"
    IMAGE = "${REGISTRY}/adm"
    INFRA_REPO = "https://github.com/Wilsonn06/s-rusun-infra.git"
    INFRA_BRANCH = "main"
    DEPLOY_PATH = "adm/deployment.yaml"
    GIT_EMAIL = "ci@local"
    GIT_NAME  = "jenkins-ci"
  }
  stages {
    stage('Checkout') {
      steps { checkout scm }
    }
    stage('Build & Push Image') {
      steps {
        sh """
          docker build -t ${IMAGE}:${GIT_COMMIT} .
          docker push ${IMAGE}:${GIT_COMMIT}
        """
      }
    }
    stage('Update Infra Repo') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'infra-repo-creds', passwordVariable: 'GIT_PASS', usernameVariable: 'GIT_USER')]) {
          sh """
            rm -rf infra || true
            git clone ${INFRA_REPO} infra
            cd infra
            git checkout ${INFRA_BRANCH}
            sed -i 's#image: ${REGISTRY}/adm:.*#image: ${REGISTRY}/adm:${GIT_COMMIT}#' ${DEPLOY_PATH}
            git config user.email "${GIT_EMAIL}"
            git config user.name "${GIT_NAME}"
            git add ${DEPLOY_PATH}
            git commit -m "ci: adm image update to ${GIT_COMMIT}" || echo "No changes"
            git push https://${GIT_USER}:${GIT_PASS}@github.com/Wilsonn06/s-rusun-infra.git ${INFRA_BRANCH}
          """
        }
      }
    }
  }
  post {
    failure {
      echo "Build failed!"
    }
    success {
      echo "Image built, pushed, and manifest updated."
    }
  }
}
