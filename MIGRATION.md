# Koloti Migration Plan - Symfony 8 / PHP 8.4 / Doctrine

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task by task. Use `php-pro` and the Symfony skills relevant to each task. Keep implementation test-backed and checkpointed.

**Goal:** Replace the current SvelteKit / Vite / Supabase application with a PHP 8.4 / Symfony 8 / Doctrine application, preserving functional and visual parity.

**Architecture:** Symfony 8 application using DDD and hexagonal architecture. Domain code is framework-free, application code exposes commands/queries/handlers, and infrastructure contains Symfony controllers, Doctrine repositories, Twig, Mailer, storage, and runtime integration.

**Runtime:** Docker VPS with FrankenPHP + Caddy, PostgreSQL, persistent private document storage, and Symfony Mailer.

---

## 1. Migration Specification

### 1.1 Objective

Migrate Koloti to a full Symfony application while keeping the current product behavior, routes, labels, role model, business rules, and UI design ISO with the SvelteKit version.

The target application must remove Supabase entirely:

- Supabase Auth is replaced by Symfony Security.
- Supabase Postgres access is replaced by Doctrine ORM and Doctrine Migrations.
- Supabase Storage is replaced by private application storage.
- Supabase Edge Functions are replaced by Symfony application handlers.
- Vite/Svelte/Skeleton Svelte are replaced by Twig + Tailwind-based templates.

### 1.2 Validated Decisions

- Use one master migration spec and phased implementation plan.
- Use full replacement, not long-term coexistence.
- Use DDD with ports and adapters.
- Use CQRS-style commands and queries through Symfony Messenger buses.
- Use PostgreSQL through Doctrine.
- Use FrankenPHP + Caddy on Docker VPS.
- Preserve current public route shapes wherever technically possible.
- Preserve visual design by recreating current Skeleton/Tailwind patterns in Symfony/Twig.

### 1.3 Runtime Target

Use FrankenPHP with Caddy as the web server. Follow the Symfony Docker / FrankenPHP structure validated through current documentation:

- `app` container: FrankenPHP/Caddy serving Symfony from `public/index.php`.
- `database` container: PostgreSQL.
- Persistent volume for PostgreSQL.
- Persistent private volume for document files under `var/storage/documents`.
- Caddy handles HTTP(S), TLS, and production domain routing.

Start in standard FrankenPHP mode. Enable FrankenPHP worker mode only after a statelessness audit and functional test pass, because worker mode keeps the application process alive across requests.

Worker-mode readiness checks:

- no request/user state stored in static mutable properties;
- no request-scoped service retained between requests;
- Doctrine EntityManager state is reset safely between requests;
- functional tests pass with worker mode enabled.

### 1.4 DDD Contexts

Use these bounded contexts:

- `IdentityAccess`: accounts, credentials, roles, statuses, activation, magic links, forced credential change, profile updates.
- `Properties`: properties/lots, ownership, transfers, nominative state, CSV export.
- `Publications`: information posts, drafts, publication, markdown rendering.
- `Documents`: document metadata, upload, private storage, visibility, protected download.
- `Assemblies`: general meetings, agenda, convening, opening, reminders, notifications, attendance, quorum, closing.
- `Audit`: append-only audit log for sensitive actions.
- `Shared`: identifiers, common value objects, exceptions, clocks, authorization primitives.

### 1.5 Functional Parity Requirements

Keep these behaviors from the current application:

- Login by human identifier, not by email.
- Password login and magic-link login on the same account.
- Admin-created accounts only; no public self-registration.
- Activation link is single-use, hashed in storage, and expires after 72 hours by default.
- Admin can create accounts, edit login/email/role/status, reissue activation links, and send welcome sheets.
- Admin never knows a member password.
- `pending` and `inactive` accounts cannot access the app.
- `must_change_credentials` forces `/change-credentials`.
- Editors can manage information, documents, assemblies, agenda, and convening.
- Editors cannot manage accounts or roles.
- Members can read allowed content and non-draft assemblies.
- Document visibility levels remain `members`, `editors`, and `admin`.
- Documents are never publicly served; every download goes through authorization.
- Assembly lifecycle remains `draft -> convened -> open -> closed -> archived`.
- Agenda items are editable only while the assembly is in `draft`.
- Attendance is editable only while the assembly is `open`.
- Quorum is computed from property vote weights for `present` and `represented` attendance modes.
- Sensitive actions are written to an append-only audit log.
- Transactional emails are sent through Symfony Mailer.

### 1.6 Routes To Preserve

Authentication:

- `/login`
- `/login/identifiant-oublie`
- `/activate/{token}`
- `/change-credentials`
- `/logout`

Application shell:

- `/`
- `/profil`
- `/profil/nouveau-mot-de-passe`

Accounts:

- `/comptes`
- `/comptes/new`
- `/comptes/{id}/view`
- `/comptes/{id}/edit`

Properties:

- `/proprietes`
- `/proprietes/new`
- `/proprietes/{id}/view`
- `/proprietes/{id}/edit`
- `/proprietes/{id}/owners`

Nominative state:

- `/etat-nominatif`
- `/etat-nominatif/export.csv`

Documents:

- `/documents`
- `/documents/new`
- `/documents/{id}/edit`
- `/documents/{id}/download`

Information posts:

- `/informations`
- `/informations/page/{num}`
- `/informations/new`
- `/informations/{id}/view`
- `/informations/{id}/edit`

Assemblies:

- `/assemblees-generales`
- `/assemblees-generales/new`
- `/assemblees-generales/{id}`
- `/assemblees-generales/{id}/agenda`
- `/assemblees-generales/{id}/convoquer`
- `/assemblees-generales/{id}/relancer`
- `/assemblees-generales/{id}/notifications`
- `/assemblees-generales/{id}/emargement`
- `/assemblees-generales/{id}/quorum`

### 1.7 Public Interfaces And Types

Use PHP backed enums for existing Supabase enum values:

- `UserRole`: `admin`, `editor`, `member`
- `AccountStatus`: `pending`, `active`, `inactive`
- `ActivationKind`: `standard`, `extended`
- `DocumentType`: `statuts`, `pv_ag`, `budget`, `facture`, `cahier_charges`, `convocation`, `courrier`, `autre`
- `VisibilityLevel`: `members`, `editors`, `admin`
- `AssemblyType`: `ordinaire`, `extraordinaire`
- `AssemblyMode`: `presentiel`, `en_ligne`, `hybride`
- `AssemblyStatus`: `draft`, `convened`, `open`, `closed`, `archived`
- `AttendanceMode`: `present`, `represented`, `absent`
- `ProxyStatus`: `pending`, `accepted`, `revoked`
- `BallotStatus`: `pending`, `open`, `closed`
- `MajorityRule`: `simple`, `absolue`, `qualifiee_2_3`
- `FeeStatus`: `due`, `paid`, `partial`, `overdue`

Use value objects where invariants matter:

- `EmailAddress`
- `HumanLogin`
- `PersonName`
- `PhoneNumber`
- `VoteWeight`
- `ActivationToken`
- `StoragePath`
- `DateRange`
- `QuorumPercentage`

Use these application ports:

- `Clock`
- `PasswordHasher`
- `TokenGenerator`
- `DocumentStorage`
- `TransactionalMailer`
- `MarkdownRenderer`
- `AuditLogger`

---

## 2. Target File Structure

```text
src/
  Shared/
    Domain/
    Application/
    Infrastructure/
  IdentityAccess/
    Domain/
    Application/
    Infrastructure/
  Properties/
    Domain/
    Application/
    Infrastructure/
  Publications/
    Domain/
    Application/
    Infrastructure/
  Documents/
    Domain/
    Application/
    Infrastructure/
  Assemblies/
    Domain/
    Application/
    Infrastructure/
  Audit/
    Domain/
    Application/
    Infrastructure/
  Infrastructure/
    Symfony/
      Controller/
      Security/
      Twig/
      Storage/
      Mailer/

templates/
  layout/
  auth/
  dashboard/
  accounts/
  properties/
  nominative-state/
  documents/
  publications/
  assemblies/

assets/
  app.css

docker/
  frankenphp/
    Caddyfile
```

Doctrine mapping can use PHP attributes on persistence models if entities remain domain-compatible, or XML mapping if domain purity becomes difficult. Prefer keeping business methods in domain aggregates and using Doctrine repositories only as adapters.

---

## 3. Composer Dependencies

Add the Symfony stack:

```bash
composer require symfony/framework-bundle symfony/twig-bundle symfony/security-bundle symfony/form symfony/validator symfony/mailer symfony/messenger symfony/asset-mapper symfony/monolog-bundle symfony/uid symfony/mime symfony/string
```

Add Doctrine:

```bash
composer require doctrine/orm doctrine/doctrine-bundle doctrine/doctrine-migrations-bundle
```

Add UI and content support:

```bash
composer require symfonycasts/tailwind-bundle league/commonmark symfony/html-sanitizer
```

Add FrankenPHP runtime support only if required by the selected Symfony/FrankenPHP worker configuration:

```bash
composer require runtime/frankenphp-symfony
```

Add development tools:

```bash
composer require --dev symfony/test-pack phpunit/phpunit phpstan/phpstan phpstan/phpstan-symfony doctrine/doctrine-fixtures-bundle
```

---

## 4. Implementation Plan

### Phase 1: Bootstrap Symfony And Runtime

**Files:**

- Create: `composer.json`
- Create: `symfony.lock`
- Create: `.env.example`
- Create: `Dockerfile`
- Create: `compose.yaml`
- Create: `compose.override.yaml`
- Create: `docker/frankenphp/Caddyfile`
- Create: `config/packages/*.yaml`
- Create: `public/index.php`

Steps:

1. Create the Symfony 8 application skeleton for PHP 8.4.
2. Add Composer dependencies listed above.
3. Configure Docker with FrankenPHP/Caddy and PostgreSQL.
4. Configure environment variables:
   - `APP_ENV`
   - `APP_SECRET`
   - `SERVER_NAME`
   - `DATABASE_URL`
   - `MAILER_DSN`
   - `MAILER_FROM`
   - `MAILER_FROM_NAME`
   - `APP_PUBLIC_URL`
5. Configure `var/storage/documents` as private persistent storage.
6. Configure Caddy to serve Symfony through FrankenPHP.
7. Run:

```bash
docker compose up -d
docker compose exec app php bin/console about
composer validate
```

Expected result:

- Symfony boots in the `app` container.
- Caddy/FrankenPHP serves the application.
- PostgreSQL is reachable through `DATABASE_URL`.

### Phase 2: Shared Kernel And Buses

**Files:**

- Create: `src/Shared/Domain/ValueObject/*`
- Create: `src/Shared/Domain/Exception/*`
- Create: `src/Shared/Application/Bus/*`
- Create: `src/Shared/Infrastructure/Bus/*`
- Modify: `config/packages/messenger.yaml`
- Modify: `config/services.yaml`

Steps:

1. Create common value objects and exceptions.
2. Create `CommandBus` and `QueryBus` interfaces.
3. Implement Messenger-backed buses.
4. Configure:
   - `command.bus` with validation and Doctrine transaction middleware.
   - `query.bus` with validation only.
5. Add unit tests for value object validation.

Expected result:

- Commands and queries have stable application boundaries.
- Domain code has no Symfony dependencies.

### Phase 3: Doctrine Model And Migrations

**Files:**

- Create: domain aggregates in each bounded context.
- Create: Doctrine repositories in `*/Infrastructure/Doctrine`.
- Create: migrations under `migrations/`.
- Create: test fixtures under `src/Shared/Infrastructure/Fixtures` or `tests/Fixtures`.

Steps:

1. Translate Supabase schema into Doctrine entities and migrations.
2. Preserve all existing constraints:
   - unique login;
   - unique credential per account;
   - unique attendance per assembly/property;
   - unique agenda position per assembly;
   - vote weight positive;
   - quorum percentage between 1 and 100.
3. Represent existing enum values as PHP enums.
4. Add repositories implementing domain ports.
5. Add fixtures for:
   - admin account;
   - editor account;
   - member account;
   - one property with ownership;
   - one draft assembly.
6. Run:

```bash
php bin/console doctrine:migrations:migrate --env=test
vendor/bin/phpunit tests/Domain
```

Expected result:

- Test database schema matches current Supabase behavior.
- Domain invariants are test-covered.

### Phase 4: Identity And Security

**Files:**

- Create: `src/IdentityAccess/Domain/*`
- Create: `src/IdentityAccess/Application/Command/*`
- Create: `src/IdentityAccess/Application/Query/*`
- Create: `src/IdentityAccess/Infrastructure/Security/*`
- Create: `src/Infrastructure/Symfony/Controller/Auth/*`
- Create: `templates/auth/*`
- Modify: `config/packages/security.yaml`

Commands/use cases:

- `CreateAccount`
- `ActivateAccount`
- `IssueActivationLink`
- `IssueExtendedActivationLink`
- `ChangeForcedCredentials`
- `AuthenticateWithPassword`
- `IssueMagicLoginLink`
- `ConsumeMagicLoginLink`
- `SendForgottenIdentifierEmail`
- `UpdateOwnProfile`
- `ChangeOwnPassword`
- `AdminUpdateAccountEmail`
- `AdminUpdateAccountLogin`
- `AdminUpdateAccountRole`
- `AdminUpdateAccountStatus`

Steps:

1. Implement Symfony `UserInterface` adapter for accounts.
2. Implement login by `Credential.login`.
3. Implement password authentication.
4. Implement magic-link tokens.
5. Implement activation tokens stored hashed.
6. Recreate auth pages and redirects.
7. Add route guard equivalent to current `hooks.server.ts`:
   - public auth routes allowed;
   - unauthenticated users redirected to `/login`;
   - inactive/pending users rejected;
   - `must_change_credentials` redirected to `/change-credentials`.
8. Add voters or access decision services for admin/editor/member.
9. Add functional tests for all auth redirects and forbidden states.

Expected result:

- Current auth behavior is preserved without Supabase.

### Phase 5: Application Shell And Visual Parity

**Files:**

- Create: `templates/layout/app.html.twig`
- Create: `templates/layout/auth.html.twig`
- Create: `templates/components/sidebar.html.twig`
- Create: `templates/components/header.html.twig`
- Create: `templates/components/footer.html.twig`
- Create: `templates/components/alerts.html.twig`
- Modify: `assets/app.css`

Steps:

1. Rebuild app shell:
   - 260px left sidebar;
   - sticky header;
   - breadcrumbs;
   - main content padding;
   - footer.
2. Recreate visible navigation:
   - Tableau de bord;
   - Informations;
   - Documents;
   - Assemblees generales;
   - Comptes;
   - Proprietes;
   - Etat nominatif.
3. Recreate UI primitives:
   - cards;
   - badges;
   - alert success/error;
   - primary/secondary/danger buttons;
   - form fields;
   - data tables;
   - confirmation dialogs.
4. Keep existing French labels and messages.
5. Verify pages at desktop and mobile sizes.

Expected result:

- Symfony pages visually match the current SvelteKit application.

### Phase 6: Accounts

**Files:**

- Create: `src/Infrastructure/Symfony/Controller/Accounts/*`
- Create: `templates/accounts/*`
- Add tests under `tests/Functional/Accounts`.

Use cases:

- list accounts;
- create account;
- view account;
- edit profile data;
- update email;
- update role;
- activate/deactivate;
- update login;
- reissue activation link;
- send welcome sheet;
- attach property by reference;
- transfer property ownership.

Steps:

1. Port `/comptes`.
2. Port `/comptes/new`.
3. Port `/comptes/{id}/view`.
4. Port `/comptes/{id}/edit`.
5. Preserve admin-only authorization.
6. Add audit events for sensitive changes.
7. Add functional tests for successful and forbidden operations.

Expected result:

- Account management is ISO with the current admin experience.

### Phase 7: Properties And Nominative State

**Files:**

- Create: `src/Properties/*`
- Create: `src/Infrastructure/Symfony/Controller/Properties/*`
- Create: `templates/properties/*`
- Create: `templates/nominative-state/*`
- Add tests under `tests/Functional/Properties`.

Use cases:

- create property;
- edit property;
- view property;
- list properties;
- add owner;
- end ownership;
- transfer ownership;
- export nominative state CSV.

Steps:

1. Port property list, create, edit, view.
2. Port owner management.
3. Port nominative state page.
4. Port CSV export with same columns/order as current output.
5. Add authorization for admin/editor where current app allows it.
6. Add tests for ownership history and transfer boundaries.

Expected result:

- Property and nominative state workflows behave like the SvelteKit version.

### Phase 8: Publications

**Files:**

- Create: `src/Publications/*`
- Create: `src/Infrastructure/Symfony/Controller/Publications/*`
- Create: `templates/publications/*`
- Add tests under `tests/Functional/Publications`.

Use cases:

- list published posts;
- list drafts for admin/editor;
- view post;
- create post;
- edit post;
- publish/unpublish;
- delete post;
- render markdown safely.

Steps:

1. Port `/informations` and pagination.
2. Port creation and edit forms.
3. Use `league/commonmark` for markdown.
4. Use `symfony/html-sanitizer` to restrict rendered HTML.
5. Preserve member/editor/admin visibility.
6. Test sanitization and authorization.

Expected result:

- Information publishing is functionally equivalent and XSS-safe.

### Phase 9: Documents

**Files:**

- Create: `src/Documents/*`
- Create: `src/Infrastructure/Symfony/Storage/LocalDocumentStorage.php`
- Create: `src/Infrastructure/Symfony/Controller/Documents/*`
- Create: `templates/documents/*`
- Add tests under `tests/Functional/Documents`.

Use cases:

- list documents with filters;
- upload document;
- edit visibility;
- delete document;
- download document.

Steps:

1. Implement `DocumentStorage` port.
2. Implement local private storage adapter.
3. Port `/documents`.
4. Port `/documents/new` with max size 20 MB.
5. Port `/documents/{id}/edit`.
6. Port `/documents/{id}/download`.
7. Enforce visibility:
   - `members`: all active users;
   - `editors`: editor/admin only;
   - `admin`: admin only.
8. Test protected download and forbidden visibility paths.

Expected result:

- Documents are private and match current visibility behavior.

### Phase 10: Assemblies

**Files:**

- Create: `src/Assemblies/*`
- Create: `src/Infrastructure/Symfony/Controller/Assemblies/*`
- Create: `templates/assemblies/*`
- Add tests under `tests/Domain/Assemblies` and `tests/Functional/Assemblies`.

Use cases:

- list assemblies;
- create assembly;
- view/edit assembly;
- add/update/delete/move agenda items;
- convene assembly;
- open assembly;
- send reminders;
- view notification status;
- record attendance;
- compute quorum;
- close assembly.

Steps:

1. Port assembly list and create form.
2. Port assembly detail/edit page.
3. Port agenda page and draft-only mutation rules.
4. Port convening confirmation page and email dispatch.
5. Port open action with `convened` precondition.
6. Port reminder flow for convened assemblies.
7. Port notification tracking.
8. Port attendance table and upsert behavior.
9. Port quorum computation.
10. Port close action with `open` precondition.
11. Test all status transitions and forbidden transitions.

Expected result:

- Assembly workflows preserve current lifecycle and role restrictions.

### Phase 11: Audit And Mail

**Files:**

- Create: `src/Audit/*`
- Create: `src/Shared/Infrastructure/Mailer/*`
- Create: `templates/emails/*`
- Add tests under `tests/Application/Audit` and `tests/Application/Mail`.

Steps:

1. Implement append-only audit logger.
2. Add audit calls to sensitive handlers:
   - account creation;
   - activation;
   - credential changes;
   - account status/role/email/login changes;
   - ownership changes;
   - document create/delete;
   - publication create/update/delete;
   - assembly transitions;
   - attendance changes.
3. Recreate email templates:
   - activation;
   - extended activation;
   - forgotten identifier;
   - welcome sheet;
   - assembly convening;
   - assembly reminder/open notification.
4. Configure Mailer through `MAILER_DSN`.
5. Test email subject, recipient, and essential body content.

Expected result:

- Side effects formerly handled by Edge Functions and Nodemailer are handled by Symfony services.

### Phase 12: Decommission SvelteKit And Supabase

**Files:**

- Remove or archive after parity is confirmed:
  - `src/routes`
  - `src/lib`
  - `supabase`
  - `scripts/supabase-dev.js`
  - `vite.config.ts`
  - `svelte.config.js`
  - `package.json`
  - `package-lock.json`
  - `netlify.toml`

Steps:

1. Keep old files until Symfony parity tests pass.
2. Use old Svelte files as route and UI references during migration.
3. Remove Node/Supabase dependencies only after all Symfony routes are implemented.
4. Update:
   - `README.md`
   - `INSTALL.md`
   - `.env.example`
5. Document production deployment:
   - Docker VPS;
   - FrankenPHP/Caddy;
   - PostgreSQL backups;
   - document storage backups;
   - environment variables;
   - migration commands.

Expected result:

- The repository contains the Symfony application as the only runtime.

---

## 5. Testing Strategy

### 5.1 Unit Tests

Cover domain invariants:

- email and login validation;
- activation token expiration and usage;
- account status access rules;
- assembly transitions;
- agenda mutation only in draft;
- quorum computation;
- ownership transfer date rules;
- document visibility decisions.

### 5.2 Application Tests

Cover command/query handlers:

- creating an account creates account, credential, activation link, and audit log;
- activation marks token used and account active;
- changing forced credentials clears the flag;
- issuing magic link stores a hashed token and sends mail;
- uploading a document stores metadata and file;
- convening an assembly changes status and sends emails;
- recording attendance updates quorum.

### 5.3 Functional Tests

Cover HTTP behavior:

- unauthenticated app routes redirect to `/login`;
- pending/inactive accounts cannot access the app;
- admin-only routes reject editor/member;
- editor routes reject member where applicable;
- login/password works by human login;
- magic link works by token;
- document download enforces visibility;
- CSV export is protected and formatted;
- assembly transitions reject invalid states.

### 5.4 Visual Parity Checks

Create a route-by-route manual checklist for:

- auth pages;
- app shell;
- dashboard;
- accounts;
- properties;
- nominative state;
- documents;
- information posts;
- assemblies;
- agenda;
- attendance;
- quorum.

Each page should compare:

- route URL;
- title and labels;
- visible actions;
- alerts and errors;
- table/card layout;
- desktop and mobile behavior.

### 5.5 Validation Commands

Run before claiming completion:

```bash
composer validate
docker compose up -d
docker compose exec app php bin/console about
docker compose exec app php bin/console doctrine:migrations:migrate --env=test --no-interaction
docker compose exec app vendor/bin/phpunit
docker compose exec app vendor/bin/phpstan analyse --level=9
```

---

## 6. Acceptance Criteria

- All current user-facing routes are available or intentionally redirected to their Symfony equivalent.
- Auth and authorization behavior matches the current app.
- Admin/editor/member permissions match current behavior.
- Data model covers all existing Supabase tables and enum values.
- Documents are private and protected by Symfony authorization.
- Emails are sent through Symfony Mailer.
- Assembly workflows match current draft/convened/open/closed behavior.
- UI is visually equivalent enough that existing users do not need retraining.
- Supabase is no longer required at runtime.
- SvelteKit/Vite are no longer required at runtime.
- Docker VPS runtime with FrankenPHP + Caddy is documented and verified.
- PHPUnit and PHPStan level 9 pass.

---

## 7. Assumptions And Deferred Scope

- Existing production data migration is not included until real production data exists or export requirements are provided.
- Vote, proxy, ballot, and fee tables remain modelled because they exist in the schema, but no new behavior is added beyond the current application.
- PWA/service-worker behavior is not part of the first Symfony parity milestone unless a visible current screen depends on it.
- FrankenPHP worker mode is optional and gated by statelessness tests.
- Local private storage is acceptable for the first Docker VPS deployment, with backup documented.

