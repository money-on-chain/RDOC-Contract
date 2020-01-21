pipeline {
	agent none
	post {
        aborted {
	        updateGitlabCommitStatus name: 'Test', state: 'canceled'
		}
		failure {
			updateGitlabCommitStatus name: 'Test', state: 'failed'
		}
		success {
			updateGitlabCommitStatus name: 'Test', state: 'success'
		}
	}
	stages {
		stage("test") {
      post {
        cleanup {
          sh 'rm -rf node_modules'
          cleanWs()
        }
      }
      agent {
        dockerfile {
          filename 'Dockerfile'
          args '-u 0:0'
        }
      }
      steps {
        checkout scm
        updateGitlabCommitStatus name: 'Test', state: 'pending'
          sshagent(credentials: ['ssh_jenkins_global', 'gitlab_acces'], ignoreMissing: false) {
            sh 'ssh -oStrictHostKeyChecking=no git@gitlab.com' // Add as known host		
            sh 'npm install'
            sh 'npm run solium'
            sh 'npm run eslint'
            sh 'npm test'
        }
      }
		}
	}
}
