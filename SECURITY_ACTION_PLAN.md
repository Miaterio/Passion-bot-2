# Secrets Management - Next Steps and Action Plan

## ✅ Completed Actions

The following protective measures have been implemented:

- [x] Created `.gitignore` to prevent future secret exposure
- [x] Created `bot-core/.env.example` template file
- [x] Modified `bot-core/bot.js` to use environment variables exclusively
- [x] Removed hardcoded secrets from source code
- [x] Added `dotenv` package for environment variable loading
- [x] Implemented credential validation with clear error messages
- [x] Created `bot-core/.env.local` with current (compromised) credentials

## 🚨 CRITICAL: Immediate Actions Required

### Priority 1: Rotate Compromised Credentials (DO THIS NOW!)

#### Step 1: Revoke Telegram Bot Token

1. Open Telegram and message `@BotFather`
2. Send command: `/mybots`
3. Select your bot from the list
4. Navigate to: `Bot Settings` → `API Token`
5. Click: `Revoke current token`
6. Copy the new token that is generated
7. Update `bot-core/.env.local` with the new token:
   ```
   BOT_TOKEN=your_new_token_here
   ```

#### Step 2: Revoke OpenRouter API Key

1. Login to https://openrouter.ai
2. Navigate to: API Keys section
3. Find the compromised key (ends with ...e06cbe9f)
4. Click: Delete/Revoke
5. Click: Create New API Key
6. Copy the new key
7. Update `bot-core/.env.local` with the new key:
   ```
   OPENROUTER_API_KEY=sk-or-v1-your_new_key_here
   ```

#### Step 3: Verify New Credentials Work

```bash
cd bot-core
node bot.js
```

You should see: `✅ Environment variables validated successfully`

### Priority 2: Clean Git History

⚠️ **WARNING**: This will rewrite repository history. Coordinate with your team first!

#### Option A: Using BFG Repo-Cleaner (Recommended)

1. **Install BFG Repo-Cleaner**:
   ```bash
   brew install bfg
   ```

2. **Clone a fresh mirror of your repository**:
   ```bash
   cd ~/Desktop
   git clone --mirror https://github.com/Miaterio/Passion-bot-2.git
   cd Passion-bot-2.git
   ```

3. **Create a file with secrets to remove** (`secrets.txt`):
   ```
   ***REMOVED***
   ***REMOVED***
   ```

4. **Run BFG to replace secrets**:
   ```bash
   bfg --replace-text secrets.txt
   ```

5. **Clean up and verify**:
   ```bash
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   ```

6. **Force push cleaned history**:
   ```bash
   git push --force
   ```

#### Option B: Using git filter-repo

1. **Install git-filter-repo**:
   ```bash
   brew install git-filter-repo
   ```

2. **Navigate to your repository**:
   ```bash
   cd /Users/macintosh/development/Passion-bot-2
   ```

3. **Create expressions file** (`filter-expressions.txt`):
   ```
   ***REMOVED***==>TELEGRAM_BOT_TOKEN_REMOVED
   ***REMOVED***==>OPENROUTER_API_KEY_REMOVED
   ```

4. **Run filter-repo**:
   ```bash
   git filter-repo --replace-text filter-expressions.txt --force
   ```

5. **Force push cleaned history**:
   ```bash
   git remote add origin https://github.com/Miaterio/Passion-bot-2.git
   git push --force --all
   ```

#### Post-Cleanup Actions

After cleaning git history:

1. **Notify all team members** to delete and re-clone the repository:
   ```bash
   rm -rf Passion-bot-2
   git clone https://github.com/Miaterio/Passion-bot-2.git
   ```

2. **Verify secrets are removed**:
   ```bash
   git log --all --pretty=format: --name-only --diff-filter=A | \
   xargs -I {} git log --all --pretty=format: -S "8315370424" {}
   ```
   Should return no results.

3. **Close GitHub's secret scanning alerts** in the repository settings.

### Priority 3: Enable GitHub Security Features

1. **Navigate to**: https://github.com/Miaterio/Passion-bot-2/settings/security_analysis

2. **Enable the following**:
   - ✅ Dependency graph (if not already enabled)
   - ✅ Dependabot alerts
   - ✅ Dependabot security updates
   - ✅ Secret scanning alerts (should already be enabled)
   - ✅ Push protection (CRITICAL - prevents future secret commits)

3. **Configure custom secret patterns** (optional but recommended):
   - Go to: Settings → Code security and analysis → Secret scanning
   - Add custom patterns for Telegram Bot Tokens and OpenRouter keys

## 📚 Long-term Best Practices

### For Local Development

1. **Never commit `.env.local` files**
   - They're already in `.gitignore`
   - Always use `.env.example` as a template

2. **Share credentials securely**
   - Use password managers (1Password, Bitwarden, etc.)
   - Use encrypted channels for sharing
   - Never send via email or Slack

3. **Regular credential rotation**
   - Rotate API keys every 90 days
   - Use different keys for development and production

### For Production Deployment

1. **Use platform environment variables**:
   - Vercel: Project Settings → Environment Variables
   - Heroku: `heroku config:set KEY=value`
   - AWS: AWS Secrets Manager or Parameter Store

2. **Implement least privilege**:
   - Create separate API keys for different environments
   - Limit key permissions where possible

3. **Monitor API usage**:
   - Set up alerts for unusual activity
   - Review API logs regularly

### Team Workflow

1. **Onboarding new developers**:
   ```bash
   git clone https://github.com/Miaterio/Passion-bot-2.git
   cd Passion-bot-2/bot-core
   cp .env.example .env.local
   # Then manually fill in credentials
   ```

2. **Pre-commit checks**:
   Consider adding a pre-commit hook to scan for secrets:
   ```bash
   npm install --save-dev @commitlint/cli husky
   ```

3. **Documentation**:
   - Keep README.md updated with setup instructions
   - Document where to obtain credentials
   - Include troubleshooting section

## 🔍 Verification Checklist

Before considering this issue resolved:

- [ ] New Telegram Bot Token generated and working
- [ ] New OpenRouter API Key generated and working
- [ ] Bot starts successfully with new credentials
- [ ] Old credentials have been revoked
- [ ] Git history has been cleaned (no secrets in any commit)
- [ ] GitHub secret scanning alerts have been resolved
- [ ] Push protection is enabled on GitHub
- [ ] `.gitignore` is working (`.env.local` files don't appear in `git status`)
- [ ] All team members have been notified of the changes
- [ ] Production environment variables have been updated (if applicable)

## 📞 Support Resources

- **Telegram Bot API Documentation**: https://core.telegram.org/bots/api
- **OpenRouter Documentation**: https://openrouter.ai/docs
- **GitHub Secret Scanning**: https://docs.github.com/en/code-security/secret-scanning
- **BFG Repo-Cleaner**: https://rtyley.github.io/bfg-repo-cleaner/
- **git-filter-repo**: https://github.com/newren/git-filter-repo

## 🎯 Timeline Recommendation

| Priority | Task | Recommended Completion |
|----------|------|------------------------|
| **P0 - Critical** | Rotate credentials | Within 1 hour |
| **P1 - High** | Clean git history | Within 24 hours |
| **P2 - High** | Enable push protection | Within 24 hours |
| **P3 - Medium** | Notify team members | Within 48 hours |
| **P4 - Low** | Document process | Within 1 week |

## ⚠️ Known Risks

If you don't rotate credentials immediately:

1. **Unauthorized bot access**: Anyone can control your bot
2. **API cost abuse**: Attackers can rack up charges on your OpenRouter account
3. **Data exposure**: Bot conversations and user data could be compromised
4. **Reputation damage**: Your bot could be used for spam or malicious activities

## 🎉 Success Criteria

You'll know this is resolved when:

1. ✅ GitHub sends an email confirming secret scanning alerts are resolved
2. ✅ No hardcoded secrets exist in your repository
3. ✅ Git history search returns no results for old credentials
4. ✅ Bot works with new credentials
5. ✅ Team is aware of new security practices

---

**Need help?** Review the design document at `.qoder/quests/secrets-management-plan.md` for detailed explanations.
