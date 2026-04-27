## ADDED Requirements

### Requirement: Three-workspace role boundaries

The migration from the current fork to a rebuilt-on-upstream codebase SHALL maintain three physically separated working directories, each with a defined role:

- `/opt/code/run/plane` (fork, branch `itemtype`) — daily-use and maintenance only; no migration work happens here
- `/opt/refcode/plane` (clean upstream, branch `preview`) — read-only reference for graphify regression and upstream comparison; no branches are created here
- `/opt/code/run/plane2` (new, branch `itemtype-v2`) — sole working directory for all subsequent OpenSpec changes from Phase 1.1 onward

#### Scenario: Daily fork usage during migration

- **WHEN** the developer needs to perform daily maintenance work on the existing fork (bug fix, production support)
- **THEN** they SHALL operate in `/opt/code/run/plane` exclusively, with no requirement to touch plane2
- **THEN** plane2's existence SHALL NOT cause any code, git, or runtime side effect on the fork

#### Scenario: Clean upstream reference

- **WHEN** the developer runs graphify regression or compares against upstream
- **THEN** `/opt/refcode/plane` SHALL remain on `preview` branch with no local commits ahead of `origin/preview`

#### Scenario: All migration work happens in plane2

- **WHEN** any OpenSpec change from Phase 1.1 onward is created
- **THEN** it SHALL be created under `/opt/code/run/plane2/openspec/changes/`, never under the fork's openspec directory

### Requirement: Runtime isolation via Compose project name

Docker Compose runtime resources (networks, volumes, containers) SHALL be isolated between plane and plane2 via the Compose project name prefix mechanism, without relying on port re-mapping.

#### Scenario: Project name prefix via .env

- **WHEN** plane2 is started with `docker compose -f compose.dev.yml up`
- **THEN** the project name SHALL resolve to `plane2` via `COMPOSE_PROJECT_NAME=plane2` set in `plane2/.env`
- **THEN** all networks, volumes, and containers SHALL be prefixed `plane2_*`, never colliding with the fork's `plane_*` resources

#### Scenario: Non-concurrent operation convention

- **WHEN** the developer switches from working in plane to plane2 (or vice versa)
- **THEN** they SHALL run `docker compose down` in the leaving workspace before `docker compose up` in the entering one
- **THEN** host port collisions (3000/3001/3002/8000/5432/6379/9000/9090/5672/15672) SHALL NOT occur because only one workspace runs services at a time

#### Scenario: Volume isolation verification

- **WHEN** plane has data in `plane_pgdata` and plane2 is started
- **THEN** plane2 SHALL initialize its own `plane2_pgdata` volume from scratch, never reading or writing to `plane_pgdata`

### Requirement: OpenSpec asset partitioning

The 33 specs from the fork's `openspec/specs/` SHALL be preserved in plane2 as a read-only reference partition, separated from the active OpenSpec workflow.

#### Scenario: Legacy specs as reference

- **WHEN** plane2 is bootstrapped
- **THEN** the fork's 33 specs SHALL be copied to `plane2/openspec/_legacy/specs/`
- **THEN** `plane2/openspec/specs/` and `plane2/openspec/changes/` SHALL be empty
- **THEN** `openspec list` executed in plane2 SHALL report no specs and no changes

#### Scenario: Legacy specs documented as reference-only

- **WHEN** the developer browses `plane2/openspec/_legacy/`
- **THEN** a README.md SHALL be present at the root of `_legacy/` explaining that these specs reflect the fork's branch context, are NOT authoritative for plane2, and are kept solely as a business-truth reference
