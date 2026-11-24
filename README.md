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

### Kubernetes stands (optional)

TestGrid can read stands from a Kubernetes cluster. The feature is off by default: without `K8S_ENABLED=true` TestGrid behaves exactly as in `v1.0.0` and never calls the cluster.

When enabled, TestGrid lists the cluster namespaces that carry the label `K8S_STAND_LABEL`. The label value is the stand name, so several namespaces with the same value form one stand:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: qa1
  labels:
    example.org/stand: qa1
```

- A stand found in the cluster appears on the dashboard of the `K8S_TESTGRID_NAMESPACE` namespace with `source: "k8s"`.
- A stand that already exists with the same name becomes a Kubernetes stand and keeps its bookings.
- A Kubernetes stand whose namespaces leave the cluster is removed together with its bookings. The booking history stays.
- Stands created by `/api/book` or by hand stay `source: "manual"` and are never removed.
- If the cluster cannot be read, the stands stay as they are and the error is logged.

| Variable | Required | Description |
|----------|----------|-------------|
| `K8S_ENABLED` | Yes | `true` turns the feature on |
| `K8S_STAND_LABEL` | Yes | Label key on namespaces; the value is the stand name |
| `K8S_TESTGRID_NAMESPACE` | Yes | TestGrid namespace that owns the cluster's stands |
| `K8S_STAND_KIND_LABEL` | No | Label key; the value `ephemeral` marks a personal stand, anything else is a shared stand |
| `K8S_STAND_OWNER_ANNOTATION` | No | Annotation key with the owner's email, shown on the stand card |
| `K8S_API_URL` | No | Defaults to `https://kubernetes.default.svc` |
| `K8S_TOKEN_FILE` | No | Defaults to the pod's service account token; set it empty to send no token |
| `K8S_CA_FILE` | No | Defaults to the pod's service account CA |

Inside the cluster, the pod's service account needs permission to `list` `namespaces`. For local development run `kubectl proxy` and set `K8S_API_URL=http://127.0.0.1:8001` with `K8S_TOKEN_FILE=` empty.

Shared and personal stands are listed in separate sections. A personal stand shows its owner instead of repository bookings:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: dev-ann
  labels:
    example.org/stand: dev-ann
    example.org/stand-kind: ephemeral
  annotations:
    example.org/stand-owner: ann@company.org
```

When a stand spans several namespaces, the kind and owner are read from the namespace named after the stand.

Upgrading from `v1.0.0`: run `pnpm migrate up` to add the `stands.source`, `stands.kind` and `stands.owner` columns.

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
