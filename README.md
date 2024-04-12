# TestGrid

### Features

- 📚 Stand-repository reservation for the QA engineer
- 📜 Booking history
- 📊 Reservation metrics by testers
- 🔀 Stand switching to Smoke-testing mode
- 💡 Intuitive web interface
- 🔧 Support for multiple namespaces in your company (if you have several different development teams)

### How does it work? 

After integrating into the pipeline process, you gain the ability to control the deployment to test stands for your QA engineers. If a test stand is occupied by another QA engineer, the deployment to the occupied stand will be blocked. You can also switch the stand into smoke-test mode, and deployment for testers will not be possible.

### Quick start

1. For a quick demonstration, simulate the operation of the CI by passing the user's name, email, and other data through a `curl` request to initiate the automatic creation of a user in the system.

```
curl -XPOST -H "Content-type: application/json" -d '{ "repository": "backend", "user_name": "John Smit", "user_email": "john@company.org", "namespace": "myorg", "stand": "qa1", "branch": "infra/test" }' "http://localhost:3000/api/book"
```

2. Open http://localhost:3000 in your browser and enter `john@company.org` as the user for authentication. After that, the system will prompt you to set a password for this user.

### Pipeline Integration
**Example: GitLab Integration**

To integrate with GitLab, utilize the provided GitLab template:

```yaml
.testgrid:
  before_script:
    - 'RESPONSE=$(curl -XPOST -H "Content-type: application/json" -d "{ \"repository\": \"$CI_PROJECT_NAME\", \"user_name\": \"$GITLAB_USER_NAME\", \"user_email\": \"$GITLAB_USER_EMAIL\", \"namespace\": \"$CI_PROJECT_NAMESPACE\", \"stand\": \"$DEPLOY_CLUSTER\", \"user_login\": \"$GITLAB_USER_LOGIN\", \"branch\": \"$CI_COMMIT_REF_NAME\" }" "https://testgrid.company.org/api/book" -s)'
    - 'if echo "$RESPONSE" | grep -q "|"; then ERROR_MSG=$(echo "$RESPONSE" | cut -d "|" -f 2); echo -e "\033[0;31mTestGrid Error: $ERROR_MSG\033[0m"; exit 1; fi'
```

An approximate task in GitLabCI using TestGrid looks as follows:

```yaml
review:
  stage: deploy
  parallel:
    matrix:
      - DEPLOY_CLUSTER:
          - qa1
          - qa2
  extends: .testgrid
  script:
    - mkdir -p ~/.ssh
    - eval $(ssh-agent -s)
    - echo -e "Host *\nAddKeysToAgent yes\nIgnoreUnknown UseKeychain\nUseKeychain yes\nForwardAgent yes\n\nHost *.company.dev\nPort 22\n\n" > ~/.ssh/config
    ...
  when: manual
  only:
    - branches
  except:
    - master
    - develop
```
