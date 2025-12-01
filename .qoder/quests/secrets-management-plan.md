# Secrets Management Plan

## Problem Overview

GitHub's secret scanning detected exposed API credentials in the repository at commit 739d38ff:
- OpenRouter API Key in bot-core/bot.js at line 9
- Telegram Bot Token in bot-core/bot.js at line 8

These hardcoded secrets pose a critical security risk as anyone with repository read access can view and misuse them.

## Immediate Actions Required

### 1. Revoke Compromised Credentials

All exposed credentials must be regenerated to prevent unauthorized access:

| Credential Type | Current Location | Action Required | Platform |
|----------------|------------------|-----------------|----------|
| Telegram Bot Token | bot-core/bot.js line 8 | Regenerate via BotFather | Telegram |
| OpenRouter API Key | bot-core/bot.js line 9 | Revoke and create new key | openrouter.ai |

#### Steps for Telegram Bot Token:
1. Open Telegram and message @BotFather
2. Use /mybots command
3. Select your bot
4. Navigate to Bot Settings → API Token
5. Select "Revoke current token"
6. Generate new token and store securely

#### Steps for OpenRouter API Key:
1. Login to openrouter.ai account
2. Navigate to API Keys section
3. Revoke the exposed key
4. Generate a new API key
5. Store securely in environment configuration

### 2. Remove Secrets from Git History

The exposed secrets exist in commit history and must be removed:

| Task | Description | Priority |
|------|-------------|----------|
| Force push with history rewrite | Remove secrets from all commits | High |
| Use BFG Repo-Cleaner or git filter-repo | Cleanse repository history | High |
| Notify all contributors | Inform team to re-clone repository | High |

#### Git History Cleanup Process:

The repository must undergo history rewriting to eliminate exposed credentials. Two primary approaches exist:

##### Option A: Using BFG Repo-Cleaner
1. Clone a fresh mirror of the repository
2. Run BFG to replace sensitive strings with placeholder text
3. Perform garbage collection to remove old data
4. Force push the cleaned history

##### Option B: Using git filter-repo
1. Install git-filter-repo tool
2. Create expressions file with patterns matching exposed secrets
3. Execute filter-repo command to remove matching content
4. Verify cleaned history and force push

## Long-term Prevention Strategy

### Environment Variable Architecture

All sensitive configuration must be externalized from source code into environment variables.

#### Bot-Core Module Configuration

Environment variables shall be loaded at application initialization:

| Variable Name | Purpose | Required | Default Behavior |
|--------------|---------|----------|------------------|
| BOT_TOKEN | Telegram bot authentication | Yes | Application fails to start |
| OPENROUTER_API_KEY | AI model API access | Yes | Application fails to start |

#### Implementation Approach:

The bot initialization logic will be modified to:
1. Attempt to load environment variables from system environment
2. Provide clear error messaging if required variables are missing
3. Validate credential format before proceeding with initialization
4. Refuse to start if validation fails

No fallback hardcoded values shall be provided.

### Repository Protection Configuration

#### .gitignore Implementation

A .gitignore file must be created at repository root with the following exclusions:

| Pattern | Purpose | Scope |
|---------|---------|-------|
| .env | Development environment files | Root level |
| .env.local | Local overrides | All directories |
| .env.*.local | Environment-specific locals | All directories |
| sessions/ | Session storage data | All directories |
| node_modules/ | Package dependencies | All directories |

#### .env.example Template

A template file will guide developers in creating their local environment configuration:

| Field | Description | Format |
|-------|-------------|--------|
| BOT_TOKEN | Telegram bot token from BotFather | String starting with numeric ID |
| OPENROUTER_API_KEY | OpenRouter API authentication | String starting with sk-or-v1- |

The template will contain placeholder text indicating where actual values should be inserted, without containing real credentials.

### GitHub Secret Scanning Configuration

#### Repository Settings Enhancement

| Setting | Configuration | Purpose |
|---------|--------------|---------|
| Secret scanning | Enabled | Detect future credential exposure |
| Push protection | Enabled | Block commits containing secrets |
| Dependabot alerts | Enabled | Monitor dependency vulnerabilities |

#### Custom Secret Patterns

Additional scanning patterns can be configured for project-specific credentials:

| Pattern Type | Regular Expression Pattern | Detection Target |
|-------------|---------------------------|------------------|
| Telegram Bot Token | [0-9]{8,10}:[A-Za-z0-9_-]{35} | Bot authentication tokens |
| OpenRouter Key | sk-or-v1-[A-Za-z0-9]{64} | OpenRouter API keys |

### Development Workflow Guidelines

#### Local Development Setup

Developers working on the project must follow this initialization sequence:

1. Clone the repository
2. Copy .env.example to .env.local
3. Populate .env.local with personal development credentials
4. Verify .env.local is listed in .gitignore
5. Run application and confirm successful initialization

#### Environment Variable Management

| Environment | Storage Method | Access Control |
|------------|---------------|----------------|
| Development | .env.local file | Individual developer responsibility |
| Production | Platform environment configuration | Platform admin access only |
| CI/CD | Repository secrets | Repository maintainer access |

### Documentation Requirements

#### README Enhancement

The project README shall include:

| Section | Content |
|---------|---------|
| Prerequisites | Required credentials and where to obtain them |
| Setup Instructions | Step-by-step environment configuration |
| Environment Variables | Complete list with descriptions |
| Security Best Practices | Guidelines for credential handling |

#### Security Policy Document

A dedicated security documentation file will establish:

| Topic | Coverage |
|-------|----------|
| Credential Management | How to handle sensitive data |
| Incident Response | What to do if secrets are exposed |
| Reporting Procedures | How to report security issues |
| Regular Review Schedule | Periodic security audit cadence |

## Code Modification Scope

### Files Requiring Changes

| File Path | Modification Type | Description |
|-----------|------------------|-------------|
| bot-core/bot.js | Critical | Remove hardcoded credentials, add validation |
| passion/.env.local | Rename | Move to .env.example as template |
| .gitignore | Create | Add comprehensive ignore patterns |
| README.md | Enhance | Add security setup documentation |
| .env.example | Create | Provide configuration template |

### Bot.js Modification Strategy

The current implementation at lines 8-9 contains fallback hardcoded values. The code structure shall be transformed to:

1. Attempt environment variable loading
2. Validate presence of required variables
3. Validate format of credential values
4. Throw explicit error if validation fails
5. Initialize bot only after successful validation

The modified logic will include startup checks that log configuration status without exposing actual credential values.

## Validation and Testing

### Post-Implementation Verification

| Verification Step | Expected Outcome | Validation Method |
|------------------|------------------|-------------------|
| Credentials revoked | Old tokens return authentication errors | API request with old credentials |
| Git history cleaned | Repository contains no sensitive data | Text search across all commits |
| Environment loading works | Application starts with .env file | Local development test |
| Missing credentials fail gracefully | Clear error message displayed | Start without environment file |
| .gitignore effective | .env files excluded from git status | Add .env and verify git ignores it |

### Security Audit Checklist

Pre-deployment validation confirms:

- [ ] All exposed credentials have been regenerated
- [ ] Git history contains no sensitive data
- [ ] .gitignore properly excludes environment files
- [ ] Application refuses to start without credentials
- [ ] No hardcoded secrets remain in codebase
- [ ] Documentation clearly explains setup process
- [ ] GitHub secret scanning is enabled
- [ ] Push protection is configured

## Migration Path

### Implementation Sequence

| Phase | Activities | Validation Gate |
|-------|-----------|----------------|
| Phase 1: Emergency Response | Revoke compromised credentials | New credentials generated |
| Phase 2: Repository Cleanup | Remove secrets from git history | History scan shows no secrets |
| Phase 3: Code Modification | Implement environment variable loading | Application starts successfully |
| Phase 4: Protection Setup | Configure .gitignore and GitHub settings | Test commit blocked with secrets |
| Phase 5: Documentation | Update README and create security policy | Team review completed |
| Phase 6: Deployment | Push cleaned repository with new structure | Production validation successful |

### Rollout Communication

Team members must be notified about:

| Communication Topic | Audience | Method |
|-------------------|----------|--------|
| Repository history rewrite | All contributors | Email notification |
| New setup procedures | Developers | Updated documentation |
| Security policy establishment | Entire team | Team meeting |
| Credential management practices | Technical staff | Security training session |

## Risk Mitigation

### Identified Risks

| Risk | Impact | Likelihood | Mitigation Strategy |
|------|--------|-----------|---------------------|
| Credentials used before rotation | High | Medium | Monitor API usage logs for suspicious activity |
| History cleanup affects active branches | Medium | High | Coordinate with team before force push |
| Developers commit secrets again | High | Medium | Enable push protection and provide clear guidance |
| Missing environment variables in production | High | Low | Pre-deployment checklist validation |

### Monitoring Strategy

Post-implementation monitoring includes:

| Monitoring Area | Check Frequency | Alert Condition |
|----------------|----------------|-----------------|
| API usage patterns | Real-time | Unusual request patterns |
| GitHub secret alerts | Immediate | New secret detection |
| Failed authentication attempts | Daily review | Multiple failures from single source |
| Environment configuration | Deployment time | Missing required variables |

## Compliance Considerations

### Data Protection Alignment

The secrets management approach aligns with security best practices:

| Principle | Implementation |
|-----------|---------------|
| Least Privilege | Credentials accessible only to authorized systems |
| Defense in Depth | Multiple layers: gitignore, secret scanning, push protection |
| Transparency | Clear documentation of credential handling |
| Auditability | GitHub provides audit trail of repository access |

## Conclusion

This plan addresses both immediate credential exposure and establishes sustainable secrets management practices. Implementation priority focuses on credential rotation and repository cleanup, followed by preventive infrastructure configuration. Success depends on team adherence to established security procedures and proper use of environment variable management.
