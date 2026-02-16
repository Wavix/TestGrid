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

### Local setup

#### Requirements

- Node.js 20+
- pnpm 10+

#### 1. Install dependencies

```bash
pnpm install
```

#### 2. Configure env

```bash
cp .env.example .env
```

`NEXT_PUBLIC_JIRA_URL` is used for Jira links in the UI.

Optional (if you need to remap Jira task prefixes parsed from branch names):

- `JIRA_TASK_REPLACE_FROM`
- `JIRA_TASK_REPLACE_TO`

Example:

- branch contains `WX-123`
- with `JIRA_TASK_REPLACE_FROM=WX-` and `JIRA_TASK_REPLACE_TO=DEV-`
- UI will show `DEV-123`

#### 3. Initialize database

Create local SQLite database and tables:

```bash
pnpm cli dbcreate
```

This command recreates the database from models (`sync({ force: true })`), so it removes existing local data.

#### 4. Run application

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

#### 5. Create first user via API

Send a booking request (this creates namespace/user/repository/stand automatically if they do not exist):

```bash
curl -XPOST -H "Content-type: application/json" \
  -d '{ "repository": "backend", "user_name": "John Smit", "user_email": "john@company.org", "namespace": "myorg", "stand": "qa1", "branch": "infra/test" }' \
  "http://localhost:3000/api/book"
```

Expected response:

```json
"Success!"
```

After that, sign in with `john@company.org` on [http://localhost:3000](http://localhost:3000) and set password.

#### 6. Production build check

```bash
pnpm build
```

### Troubleshooting

- `SQLITE_ERROR: no such table: namespaces`
  - Database is not initialized. Run `pnpm cli dbcreate` and restart `pnpm dev`.
- `Could not locate the bindings file ... sqlite3`
  - Rebuild sqlite3 native module:
    - `pnpm rebuild sqlite3`
- Port `3000` already in use
  - Stop previous dev process or use the URL shown in terminal (for example `http://localhost:3001`).

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
