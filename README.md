# TestGrid

### Features

- 📚 Stand-repository reservation for the QA engineer
- 📜 Booking history
- 📊 Reservation metrics by testers
- 🔀 Stand switching to Smoke-testing mode
- ☸️ Kubernetes stands: one stand at a time with its state, CPU and memory, ArgoCD status and per-service stop/start, plus the cluster's CPU and memory (optional)
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

### Docker image

Every push to `develop` publishes `ghcr.io/wavix/testgrid` tagged `latest` and `sha-<short>`, plus the `package.json` version the first time that version is pushed; a later push never moves a version tag, so bump the version to publish a new one. The container listens on `7045`, keeps its database at `DATABASE_PATH` (`/data/database.sqlite` in the image) and applies pending migrations before it starts, so mount a persistent volume on `/data`. It runs as uid `10001`. `NEXT_PUBLIC_JIRA_URL` is a build argument: Next.js inlines it into the client bundle.

```bash
docker build -t testgrid .
docker run -p 7045:7045 -v testgrid-data:/data testgrid
```

The migrations alter tables of an existing `v1.0.0` database, so the container does not start on an empty volume: copy an existing `database.sqlite` into it first.

### Releasing a new version

TestGrid has no release pipeline of its own: a version is an image tag, and the Wavix QA cluster runs the tag pinned in the `wavix/mono` GitLab repository.

1. In the feature PR, bump `version` in `package.json` (for example `1.3.0` → `1.4.0`).
2. Merge the PR into `develop`. The `image` workflow publishes `ghcr.io/wavix/testgrid:<version>`.
3. Check that the tag exists before going further:

   ```bash
   gh run list -R Wavix/TestGrid --workflow image.yml --limit 1
   gh api /orgs/Wavix/packages/container/testgrid/versions --jq '.[].metadata.container.tags[]' | grep -x <version>
   ```

4. In `wavix/mono`, set `newTag: <version>` in `deploy/k8s/qa/apps/qa1/testgrid/kustomization.yaml` and the same tag in the image assertion of `services/ansible/ci/tests/test_testgrid_k8s.py`, then open a merge request to `main`.
5. After that merge request is merged, the ArgoCD Application `qa1-testgrid` deploys the new image to `booking.wavix.dev`.

Merge the mono request only after step 3 shows the tag. The Deployment uses the `Recreate` strategy, so a pin to a tag that does not exist yet stops the running pod and leaves the new one in `ImagePullBackOff`.

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
| `K8S_STAND_URLS_ANNOTATION` | No | Annotation key with the stand's URLs, separated by commas or spaces |
| `K8S_STAND_EXPIRES_ANNOTATION` | No | Annotation key with the stand's expiry time (ISO 8601) |
| `K8S_NAMESPACE_FILE` | No | Defaults to the pod's service account namespace; with `K8S_SELF_DEPLOYMENT` it names the Deployment TestGrid never scales |
| `K8S_SELF_DEPLOYMENT` | No | Defaults to `testgrid` |
| `ARGOCD_NAMESPACE` | No | Defaults to `argocd` |
| `PROMETHEUS_URL` | No | Defaults to `http://monitoring-prometheus.monitoring.svc:9090` |
| `K8S_STAND_DELETE_ENABLED` | No | `true` shows Delete on personal stands |

Inside the cluster, the pod's service account needs permission to `list` `namespaces`.

#### Stand control

The dashboard shows one stand at a time. Above the switcher, a cluster line shows CPU and memory used, and requested by Pending and Running pods against the nodes' allocatable CPU and memory (`kube_node_status_allocatable`), refreshed every 30 seconds while the tab is visible. A switcher lists one chip per stand with its state (running, degraded, stopped; refreshed every 30 seconds while the tab is visible) and, for a shared stand, the number of free modules; picked components in "Find free stands for components" highlight the shared stands where all of them are free. The selected stand is in the URL as `?stand=<name>`; without one, or with a stand that no longer exists, `qa1` is selected.

The selected stand loads its state every 10 seconds: Deployments and StatefulSets of the stand's own namespace (desired/ready replicas), the ArgoCD Applications whose `spec.destination.namespace` is that namespace (sync and health), the nodes, CPU used and requested in cores and memory used and requested in GiB (Prometheus; requested counts Pending and Running pods only), and the namespace's creation time, expiry time and URLs. A workload belongs to the Application named in its `argocd.argoproj.io/tracking-id` annotation, else in its `app.kubernetes.io/instance` label. A shared stand has a Booking tab (open by default) and a Kubernetes tab with one row per service; a personal stand has only the Kubernetes tab.

- An admin can stop and start any workload; the owner of a personal stand can stop and start its workloads and the whole stand. A shared stand has no whole-stand stop and asks for confirmation before a workload stops.
- Stop saves the replica count in `stand_replicas`, then patches the `scale` subresource to 0 with `fieldManager=testgrid`. An ArgoCD Application that ignores fields managed by `testgrid` keeps the stop.
- Start patches the saved count back (1 if none was saved) with `fieldManager=testgrid-start`, which hands `spec.replicas` back to git, then clears the saved count.
- TestGrid never scales its own Deployment.
- With `K8S_STAND_DELETE_ENABLED=true`, an admin or the owner can delete a personal stand: TestGrid deletes the namespace, then the ArgoCD Applications labelled `K8S_STAND_LABEL=<stand>` in `ARGOCD_NAMESPACE`; a refused namespace delete leaves the Applications in place. A shared stand has no Delete.
- A stand whose namespace answers 403 shows "No access, re-run bin/dev stand up".

The service account needs `get`/`list` on `deployments` and `statefulsets` and `get`/`patch` on their `scale` subresource in each stand namespace, and `list` on `applications.argoproj.io` in `ARGOCD_NAMESPACE`. Delete also needs `delete` on those Applications and on `namespaces`; restrict it in the cluster (for example with a ValidatingAdmissionPolicy) to personal stands, because RBAC cannot scope it by label. For local development run `kubectl proxy` and set `K8S_API_URL=http://127.0.0.1:8001` with `K8S_TOKEN_FILE=` empty.

Shared stands come first in the switcher. A personal stand shows its owner instead of repository bookings:

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
