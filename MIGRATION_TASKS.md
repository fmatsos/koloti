# Koloti Migration Tasks

Task checklist for implementing `MIGRATION.md`.

> Execute in order. Each phase must finish with its validation commands passing before the next phase starts.

---

## Phase 0 - Preparation

- [ ] Read `MIGRATION.md`, `SPEC.md`, `PLAN.md`, `README.md`, and `INSTALL.md`.
- [ ] Review current SvelteKit routes under `src/routes`.
- [ ] Review current Supabase schema in `supabase/migrations/0001_schema.sql`.
- [ ] Review current Edge Functions under `supabase/functions`.
- [ ] Review current auth/security behavior in `src/hooks.server.ts`.
- [ ] Review current UI shell components in `src/lib/components`.
- [ ] Create an implementation branch.
- [ ] Confirm the worktree state before changes with `git status --short`.
- [ ] Keep old Svelte/Supabase files available as reference until Symfony parity is complete.

---

## Phase 1 - Symfony And Runtime Bootstrap

### Composer And Symfony Skeleton

- [ ] Create Symfony 8 application structure.
- [ ] Require PHP 8.4 in `composer.json`.
- [ ] Add Symfony core packages.
- [ ] Add Doctrine ORM and migrations packages.
- [ ] Add Symfony Security, Form, Validator, Mailer, Messenger, Twig, AssetMapper, Monolog, UID, Mime, String.
- [ ] Add Tailwind support through `symfonycasts/tailwind-bundle`.
- [ ] Add markdown and sanitization packages.
- [ ] Add dev packages for PHPUnit, PHPStan, Symfony PHPStan, and fixtures.
- [ ] Create `public/index.php`.
- [ ] Create Symfony config files under `config/`.
- [ ] Create `.env.example` for Symfony variables.
- [ ] Add `composer validate` to the validation checklist.

### FrankenPHP + Caddy Docker Runtime

- [ ] Create `Dockerfile` for the Symfony app with FrankenPHP.
- [ ] Create `compose.yaml` with app and PostgreSQL services.
- [ ] Create `compose.override.yaml` for local development.
- [ ] Create `docker/frankenphp/Caddyfile`.
- [ ] Configure Caddy to serve Symfony from `public/index.php`.
- [ ] Configure app service environment variables.
- [ ] Configure PostgreSQL service, healthcheck, and persistent volume.
- [ ] Configure persistent private volume for `var/storage/documents`.
- [ ] Configure `SERVER_NAME` for local and production use.
- [ ] Keep FrankenPHP worker mode disabled initially.
- [ ] Document worker-mode activation as a later gated task.

### Phase 1 Validation

- [ ] Run `composer validate`.
- [ ] Run `docker compose build`.
- [ ] Run `docker compose up -d`.
- [ ] Run `docker compose exec app php bin/console about`.
- [ ] Confirm the app responds over Caddy/FrankenPHP.
- [ ] Commit Phase 1.

---

## Phase 2 - Shared DDD Kernel

### Directory Structure

- [ ] Create `src/Shared/Domain`.
- [ ] Create `src/Shared/Application`.
- [ ] Create `src/Shared/Infrastructure`.
- [ ] Create bounded-context directories for `IdentityAccess`, `Properties`, `Publications`, `Documents`, `Assemblies`, and `Audit`.
- [ ] Create `src/Infrastructure/Symfony` for framework integration.

### Shared Value Objects

- [ ] Create `EmailAddress`.
- [ ] Create `HumanLogin`.
- [ ] Create `PersonName`.
- [ ] Create `PhoneNumber`.
- [ ] Create `VoteWeight`.
- [ ] Create `ActivationToken`.
- [ ] Create `StoragePath`.
- [ ] Create `DateRange`.
- [ ] Create `QuorumPercentage`.
- [ ] Create UUID/id value object strategy for aggregate IDs.

### Shared Ports

- [ ] Create `Clock` interface.
- [ ] Create `TokenGenerator` interface.
- [ ] Create `DocumentStorage` interface.
- [ ] Create `TransactionalMailer` interface.
- [ ] Create `MarkdownRenderer` interface.
- [ ] Create `AuditLogger` interface.

### Command And Query Buses

- [ ] Create `CommandBus` interface.
- [ ] Create `QueryBus` interface.
- [ ] Implement Messenger-backed command bus.
- [ ] Implement Messenger-backed query bus.
- [ ] Configure `command.bus`.
- [ ] Configure `query.bus`.
- [ ] Add validation middleware to both buses.
- [ ] Add Doctrine transaction middleware to command bus.

### Phase 2 Tests

- [ ] Test valid and invalid `EmailAddress`.
- [ ] Test valid and invalid `HumanLogin`.
- [ ] Test positive-only `VoteWeight`.
- [ ] Test bounded `QuorumPercentage`.
- [ ] Test immutable date range behavior.
- [ ] Run `docker compose exec app vendor/bin/phpunit tests/Shared`.
- [ ] Commit Phase 2.

---

## Phase 3 - Database Model And Doctrine Migrations

### Enums

- [ ] Create `UserRole`.
- [ ] Create `AccountStatus`.
- [ ] Create `ActivationKind`.
- [ ] Create `DocumentType`.
- [ ] Create `VisibilityLevel`.
- [ ] Create `AssemblyType`.
- [ ] Create `AssemblyMode`.
- [ ] Create `AssemblyStatus`.
- [ ] Create `AttendanceMode`.
- [ ] Create `ProxyStatus`.
- [ ] Create `BallotStatus`.
- [ ] Create `MajorityRule`.
- [ ] Create `FeeStatus`.

### IdentityAccess Persistence

- [ ] Create account/profile aggregate.
- [ ] Create credential entity.
- [ ] Create activation link entity.
- [ ] Map account/profile Doctrine table.
- [ ] Map credential Doctrine table.
- [ ] Map activation link Doctrine table.
- [ ] Preserve unique credential per account.
- [ ] Preserve unique login.
- [ ] Preserve activation token hash storage.

### Properties Persistence

- [ ] Create property aggregate/entity.
- [ ] Create ownership entity.
- [ ] Create presidency entity.
- [ ] Map property table.
- [ ] Map ownership table.
- [ ] Map presidency table.
- [ ] Preserve ownership uniqueness by property/profile/start date.
- [ ] Preserve active ownership index behavior where relevant.

### Publications Persistence

- [ ] Create information post entity.
- [ ] Map information post table.
- [ ] Preserve draft/published fields.
- [ ] Preserve author relation.

### Documents Persistence

- [ ] Create document entity.
- [ ] Map document table.
- [ ] Preserve document type and visibility enums.
- [ ] Preserve metadata fields: title, description, year, storage path, MIME type, size, uploader, creation date.

### Assemblies Persistence

- [ ] Create assembly aggregate.
- [ ] Create agenda item entity.
- [ ] Create attendance entity.
- [ ] Create proxy entity.
- [ ] Create ballot entity.
- [ ] Create vote log entity.
- [ ] Create ballot vote entity.
- [ ] Create fee call entity.
- [ ] Create fee assignment entity.
- [ ] Create assembly notification entity.
- [ ] Map all assembly-related tables.
- [ ] Preserve unique agenda position per assembly.
- [ ] Preserve unique attendance per assembly/property.
- [ ] Preserve positive vote weights.
- [ ] Preserve quorum percentage constraint.

### Audit Persistence

- [ ] Create audit log entity.
- [ ] Map audit log table.
- [ ] Enforce append-only behavior at application level.

### Migrations And Fixtures

- [ ] Generate Doctrine migration for all mapped tables.
- [ ] Review generated SQL against Supabase schema.
- [ ] Add indexes equivalent to current schema.
- [ ] Add fixtures for admin, editor, member, property, ownership, information post, document metadata, and draft assembly.
- [ ] Add test database setup.

### Phase 3 Validation

- [ ] Run `docker compose exec app php bin/console doctrine:migrations:migrate --env=test --no-interaction`.
- [ ] Run `docker compose exec app php bin/console doctrine:schema:validate --env=test`.
- [ ] Run persistence smoke tests.
- [ ] Commit Phase 3.

---

## Phase 4 - Identity And Access

### Security Configuration

- [ ] Configure Symfony firewall.
- [ ] Configure password hashing.
- [ ] Configure login route `/login`.
- [ ] Configure logout route `/logout`.
- [ ] Configure access rules for public auth routes.
- [ ] Configure role hierarchy if needed.

### Authentication Use Cases

- [ ] Implement `CreateAccount`.
- [ ] Implement `IssueActivationLink`.
- [ ] Implement `IssueExtendedActivationLink`.
- [ ] Implement `ActivateAccount`.
- [ ] Implement `ChangeForcedCredentials`.
- [ ] Implement `AuthenticateWithPassword`.
- [ ] Implement `IssueMagicLoginLink`.
- [ ] Implement `ConsumeMagicLoginLink`.
- [ ] Implement `SendForgottenIdentifierEmail`.
- [ ] Implement `ChangeOwnPassword`.
- [ ] Implement `UpdateOwnProfile`.

### Admin Account Use Cases

- [ ] Implement `AdminUpdateAccountEmail`.
- [ ] Implement `AdminUpdateAccountLogin`.
- [ ] Implement `AdminUpdateAccountRole`.
- [ ] Implement `AdminUpdateAccountStatus`.
- [ ] Implement `SendWelcomeSheet`.

### Controllers And Templates

- [ ] Create `/login` controller and template.
- [ ] Create `/login/identifiant-oublie` controller and template.
- [ ] Create `/activate/{token}` controller and template.
- [ ] Create `/change-credentials` controller and template.
- [ ] Create `/logout` action.
- [ ] Create `/profil` controller and template.
- [ ] Create `/profil/nouveau-mot-de-passe` controller and template.

### Guards And Authorization

- [ ] Redirect unauthenticated users to `/login`.
- [ ] Redirect `must_change_credentials` users to `/change-credentials`.
- [ ] Reject `pending` accounts.
- [ ] Reject `inactive` accounts.
- [ ] Prevent authenticated users from visiting login page unless forced credential flow applies.
- [ ] Add admin/editor/member authorization service or voters.

### Phase 4 Tests

- [ ] Test password login by human login.
- [ ] Test invalid login errors.
- [ ] Test magic link issue and consumption.
- [ ] Test activation token expiration.
- [ ] Test pending account rejection.
- [ ] Test inactive account rejection.
- [ ] Test forced credential redirect.
- [ ] Test admin-only account mutations.
- [ ] Commit Phase 4.

---

## Phase 5 - UI Shell And Visual Parity

### Layout

- [ ] Create base auth layout.
- [ ] Create base app layout.
- [ ] Create sidebar component.
- [ ] Create header component.
- [ ] Create breadcrumb component.
- [ ] Create footer component.
- [ ] Create alert component.
- [ ] Create confirmation dialog pattern.

### Styles

- [ ] Recreate current surface theme.
- [ ] Recreate primary action buttons.
- [ ] Recreate secondary buttons.
- [ ] Recreate danger buttons.
- [ ] Recreate small buttons.
- [ ] Recreate cards.
- [ ] Recreate form controls.
- [ ] Recreate status badges.
- [ ] Recreate tables.
- [ ] Recreate auth cards.
- [ ] Recreate quorum visual components.
- [ ] Recreate responsive behavior.

### Navigation

- [ ] Add Tableau de bord link.
- [ ] Add Informations link.
- [ ] Add Documents link.
- [ ] Add Assemblees generales link.
- [ ] Add Comptes admin link.
- [ ] Add Proprietes admin/editor link.
- [ ] Add Etat nominatif admin/editor link.
- [ ] Add Mon profil action.
- [ ] Add Deconnexion action.
- [ ] Hide admin/editor links for members.

### Phase 5 Validation

- [ ] Compare `/login` with current Svelte login page.
- [ ] Compare app shell with current Svelte app layout.
- [ ] Compare sidebar active states.
- [ ] Compare desktop layout.
- [ ] Compare mobile layout.
- [ ] Commit Phase 5.

---

## Phase 6 - Accounts

### Queries

- [ ] Implement account list query.
- [ ] Implement account detail query.
- [ ] Implement account edit query.
- [ ] Implement credential lookup query.
- [ ] Implement account ownership summary query.

### Routes And Screens

- [ ] Port `/comptes`.
- [ ] Port `/comptes/new`.
- [ ] Port `/comptes/{id}/view`.
- [ ] Port `/comptes/{id}/edit`.

### Actions

- [ ] Create account.
- [ ] Attach property by reference.
- [ ] Directly attach property.
- [ ] Confirm property transfer.
- [ ] Update account name and phone.
- [ ] Update account email.
- [ ] Update account role.
- [ ] Activate/deactivate account.
- [ ] Reissue activation link.
- [ ] Update account login.
- [ ] Send welcome sheet.

### Tests

- [ ] Test admin can list accounts.
- [ ] Test editor/member cannot list accounts.
- [ ] Test account creation creates credential.
- [ ] Test duplicate email/login handling.
- [ ] Test account detail ownership data.
- [ ] Test role update.
- [ ] Test status update.
- [ ] Test login update conflict.
- [ ] Test activation reissue sends email.
- [ ] Test welcome sheet sends email.
- [ ] Commit Phase 6.

---

## Phase 7 - Properties And Nominative State

### Queries

- [ ] Implement property list query.
- [ ] Implement property detail query.
- [ ] Implement property owners query.
- [ ] Implement nominative state query.

### Routes And Screens

- [ ] Port `/proprietes`.
- [ ] Port `/proprietes/new`.
- [ ] Port `/proprietes/{id}/view`.
- [ ] Port `/proprietes/{id}/edit`.
- [ ] Port `/proprietes/{id}/owners`.
- [ ] Port `/etat-nominatif`.
- [ ] Port `/etat-nominatif/export.csv`.

### Actions

- [ ] Create property.
- [ ] Edit property.
- [ ] Add owner.
- [ ] End ownership.
- [ ] Transfer property ownership.
- [ ] Export nominative state CSV.

### Tests

- [ ] Test property creation.
- [ ] Test property edit.
- [ ] Test owner add.
- [ ] Test owner end date.
- [ ] Test transfer closes old ownership and creates new ownership.
- [ ] Test nominative state visibility.
- [ ] Test CSV content type.
- [ ] Test CSV columns and order.
- [ ] Commit Phase 7.

---

## Phase 8 - Publications

### Queries

- [ ] Implement published posts query.
- [ ] Implement paginated posts query.
- [ ] Implement editable posts query for admin/editor.
- [ ] Implement post detail query.

### Routes And Screens

- [ ] Port `/informations`.
- [ ] Port `/informations/page/{num}`.
- [ ] Port `/informations/new`.
- [ ] Port `/informations/{id}/view`.
- [ ] Port `/informations/{id}/edit`.

### Actions

- [ ] Create information post.
- [ ] Edit information post.
- [ ] Publish information post.
- [ ] Unpublish information post.
- [ ] Delete information post.
- [ ] Render markdown to sanitized HTML.

### Tests

- [ ] Test member sees published posts.
- [ ] Test member does not see drafts.
- [ ] Test editor sees drafts.
- [ ] Test editor can create/edit.
- [ ] Test admin can delete.
- [ ] Test markdown rendering.
- [ ] Test unsafe HTML is sanitized.
- [ ] Test pagination redirects invalid pages.
- [ ] Commit Phase 8.

---

## Phase 9 - Documents

### Storage

- [ ] Implement `DocumentStorage` local adapter.
- [ ] Ensure stored files are outside public document root.
- [ ] Generate safe storage paths.
- [ ] Support delete from storage.
- [ ] Support streaming protected downloads.

### Queries

- [ ] Implement document list query.
- [ ] Implement document detail query.
- [ ] Implement visibility filter.

### Routes And Screens

- [ ] Port `/documents`.
- [ ] Port `/documents/new`.
- [ ] Port `/documents/{id}/edit`.
- [ ] Port `/documents/{id}/download`.

### Actions

- [ ] Upload document.
- [ ] Validate file is present.
- [ ] Validate max size 20 MB.
- [ ] Persist document metadata.
- [ ] Edit document visibility.
- [ ] Delete document metadata and file.
- [ ] Download document after authorization.

### Tests

- [ ] Test upload success.
- [ ] Test missing file fails.
- [ ] Test oversized file fails.
- [ ] Test members visibility.
- [ ] Test editors visibility.
- [ ] Test admin visibility.
- [ ] Test forbidden download.
- [ ] Test delete removes metadata and file.
- [ ] Commit Phase 9.

---

## Phase 10 - Assemblies

### Queries

- [ ] Implement assembly list query.
- [ ] Implement assembly detail query.
- [ ] Implement agenda query.
- [ ] Implement convening summary query.
- [ ] Implement reminder recipients query.
- [ ] Implement notification status query.
- [ ] Implement attendance table query.
- [ ] Implement quorum query.

### Routes And Screens

- [ ] Port `/assemblees-generales`.
- [ ] Port `/assemblees-generales/new`.
- [ ] Port `/assemblees-generales/{id}`.
- [ ] Port `/assemblees-generales/{id}/agenda`.
- [ ] Port `/assemblees-generales/{id}/convoquer`.
- [ ] Port `/assemblees-generales/{id}/relancer`.
- [ ] Port `/assemblees-generales/{id}/notifications`.
- [ ] Port `/assemblees-generales/{id}/emargement`.
- [ ] Port `/assemblees-generales/{id}/quorum`.

### Assembly Actions

- [ ] Create assembly.
- [ ] Edit draft assembly.
- [ ] Convene assembly.
- [ ] Open convened assembly.
- [ ] Close open assembly.
- [ ] Send reminder for convened assembly.

### Agenda Actions

- [ ] Add agenda item.
- [ ] Edit agenda item.
- [ ] Delete agenda item.
- [ ] Move agenda item up.
- [ ] Move agenda item down.
- [ ] Reindex positions after delete.
- [ ] Reject agenda mutation outside draft status.

### Attendance And Quorum Actions

- [ ] Record attendance.
- [ ] Update existing attendance.
- [ ] Reject attendance when assembly is not open.
- [ ] Compute total vote weight.
- [ ] Compute present/represented vote weight.
- [ ] Compute quorum ratio.
- [ ] Compare quorum ratio to assembly threshold.

### Notification Actions

- [ ] Create assembly notification rows.
- [ ] Send convening emails.
- [ ] Send reminder/open notification emails.
- [ ] Store sent/failed status.
- [ ] Show notification summary.

### Tests

- [ ] Test assembly creation.
- [ ] Test draft edit allowed.
- [ ] Test non-draft edit rejected.
- [ ] Test convene only from draft.
- [ ] Test open only from convened.
- [ ] Test close only from open.
- [ ] Test agenda add/update/delete in draft.
- [ ] Test agenda mutation rejected outside draft.
- [ ] Test attendance upsert in open status.
- [ ] Test attendance rejected outside open status.
- [ ] Test quorum reached.
- [ ] Test quorum not reached.
- [ ] Test notification statuses.
- [ ] Commit Phase 10.

---

## Phase 11 - Audit And Mail

### Audit

- [ ] Implement audit logger adapter.
- [ ] Ensure audit logs are append-only through application code.
- [ ] Audit account creation.
- [ ] Audit activation.
- [ ] Audit credential change.
- [ ] Audit account role/status/email/login changes.
- [ ] Audit ownership changes.
- [ ] Audit document create/update/delete.
- [ ] Audit publication create/update/delete.
- [ ] Audit assembly transitions.
- [ ] Audit agenda changes.
- [ ] Audit attendance changes.

### Mail

- [ ] Implement transactional mailer adapter.
- [ ] Create activation email template.
- [ ] Create extended activation email template.
- [ ] Create forgotten identifier email template.
- [ ] Create welcome sheet email template.
- [ ] Create assembly convening email template.
- [ ] Create assembly reminder/open notification email template.
- [ ] Configure `MAILER_DSN`.
- [ ] Configure sender email and sender name.

### Tests

- [ ] Test audit row creation for each sensitive handler group.
- [ ] Test email recipient.
- [ ] Test email subject.
- [ ] Test essential email body content.
- [ ] Test failed email handling where applicable.
- [ ] Commit Phase 11.

---

## Phase 12 - Cross-Route Visual And Behavior Parity

- [ ] Compare `/login`.
- [ ] Compare `/login/identifiant-oublie`.
- [ ] Compare `/activate/{token}`.
- [ ] Compare `/change-credentials`.
- [ ] Compare `/`.
- [ ] Compare `/profil`.
- [ ] Compare `/comptes`.
- [ ] Compare `/comptes/new`.
- [ ] Compare `/comptes/{id}/view`.
- [ ] Compare `/comptes/{id}/edit`.
- [ ] Compare `/proprietes`.
- [ ] Compare `/proprietes/new`.
- [ ] Compare `/proprietes/{id}/view`.
- [ ] Compare `/proprietes/{id}/edit`.
- [ ] Compare `/proprietes/{id}/owners`.
- [ ] Compare `/etat-nominatif`.
- [ ] Compare `/documents`.
- [ ] Compare `/documents/new`.
- [ ] Compare `/documents/{id}/edit`.
- [ ] Compare `/informations`.
- [ ] Compare `/informations/new`.
- [ ] Compare `/informations/{id}/view`.
- [ ] Compare `/informations/{id}/edit`.
- [ ] Compare `/assemblees-generales`.
- [ ] Compare `/assemblees-generales/new`.
- [ ] Compare `/assemblees-generales/{id}`.
- [ ] Compare `/assemblees-generales/{id}/agenda`.
- [ ] Compare `/assemblees-generales/{id}/convoquer`.
- [ ] Compare `/assemblees-generales/{id}/relancer`.
- [ ] Compare `/assemblees-generales/{id}/notifications`.
- [ ] Compare `/assemblees-generales/{id}/emargement`.
- [ ] Compare `/assemblees-generales/{id}/quorum`.
- [ ] Confirm labels match current French UI.
- [ ] Confirm alerts match current wording.
- [ ] Confirm role-based visible actions match current UI.
- [ ] Confirm desktop layout.
- [ ] Confirm mobile layout.
- [ ] Commit Phase 12.

---

## Phase 13 - Quality Gates

- [ ] Run `composer validate`.
- [ ] Run `docker compose build`.
- [ ] Run `docker compose up -d`.
- [ ] Run `docker compose exec app php bin/console about`.
- [ ] Run `docker compose exec app php bin/console doctrine:migrations:migrate --env=test --no-interaction`.
- [ ] Run `docker compose exec app php bin/console doctrine:schema:validate --env=test`.
- [ ] Run `docker compose exec app vendor/bin/phpunit`.
- [ ] Run `docker compose exec app vendor/bin/phpstan analyse --level=9`.
- [ ] Fix all PHPUnit failures.
- [ ] Fix all PHPStan level 9 findings.
- [ ] Re-run all quality gates after fixes.
- [ ] Commit quality-gate fixes.

---

## Phase 14 - FrankenPHP Worker Mode Gate

- [ ] Audit services for static mutable request/user state.
- [ ] Audit Doctrine EntityManager lifecycle with FrankenPHP.
- [ ] Audit security token/session handling with long-running process.
- [ ] Audit mailer/storage services for request state leakage.
- [ ] Enable FrankenPHP worker configuration in Caddyfile only after audits pass.
- [ ] Add `APP_RUNTIME` worker configuration if required.
- [ ] Run full functional test suite in worker mode.
- [ ] Disable worker mode again if any state leakage or flaky behavior appears.
- [ ] Document final worker-mode decision.
- [ ] Commit worker-mode configuration only if accepted.

---

## Phase 15 - Documentation

- [ ] Update `README.md` with Symfony runtime instructions.
- [ ] Update `INSTALL.md` with Docker VPS setup.
- [ ] Update `.env.example` with Symfony variables.
- [ ] Document local development commands.
- [ ] Document production deployment commands.
- [ ] Document PostgreSQL backup procedure.
- [ ] Document document-storage backup procedure.
- [ ] Document migration command procedure.
- [ ] Document test command procedure.
- [ ] Document FrankenPHP/Caddy runtime.
- [ ] Document worker-mode status.
- [ ] Commit documentation updates.

---

## Phase 16 - Decommission SvelteKit, Vite, And Supabase

Only start this phase after all parity checks and quality gates pass.

- [ ] Remove SvelteKit route files.
- [ ] Remove Svelte component files.
- [ ] Remove Supabase client/server helpers.
- [ ] Remove Supabase migrations from runtime path or archive as historical reference.
- [ ] Remove Supabase Edge Functions from runtime path or archive as historical reference.
- [ ] Remove Supabase templates from runtime path after Symfony email templates are verified.
- [ ] Remove `scripts/supabase-dev.js`.
- [ ] Remove Vite config.
- [ ] Remove Svelte config.
- [ ] Remove TypeScript config if no longer needed.
- [ ] Remove Node package scripts.
- [ ] Remove Node dependencies if no longer needed.
- [ ] Remove Netlify config if no longer used.
- [ ] Remove generated Supabase database types.
- [ ] Verify no imports reference removed files.
- [ ] Run final quality gates.
- [ ] Commit decommissioning.

---

## Final Acceptance Checklist

- [ ] All current routes are implemented or intentionally redirected.
- [ ] Symfony auth replaces Supabase Auth.
- [ ] Doctrine/PostgreSQL replaces Supabase database access.
- [ ] Symfony Mailer replaces Nodemailer and Edge Function email dispatch.
- [ ] Private storage replaces Supabase Storage.
- [ ] Admin/editor/member permissions match current behavior.
- [ ] Account activation and magic links work.
- [ ] Documents are protected by authorization.
- [ ] Publications render sanitized markdown.
- [ ] Assemblies follow current lifecycle rules.
- [ ] Quorum matches current calculation behavior.
- [ ] Audit log is populated for sensitive actions.
- [ ] UI is visually ISO enough for existing users.
- [ ] Docker VPS runtime uses FrankenPHP + Caddy.
- [ ] Supabase is not required at runtime.
- [ ] SvelteKit/Vite are not required at runtime.
- [ ] PHPUnit passes.
- [ ] PHPStan level 9 passes.
- [ ] Documentation is updated.

