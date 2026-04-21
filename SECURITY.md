# Security Policy

## Supported Versions

The following versions of Brave Sync Notes are currently supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 2.2.x   | :white_check_mark: |
| 2.1.x   | :white_check_mark: |
| 2.0.x   | :x:                |
| < 2.0   | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly.

### Private Disclosure

**Please DO NOT create a public GitHub issue** for security vulnerabilities.

Instead, please report security issues via:

- Email: [Create a private security advisory](https://github.com/LessUp/brave-sync-notes/security/advisories/new)
- Or use GitHub's [Private Vulnerability Reporting](https://github.com/LessUp/brave-sync-notes/security/advisories)

### What to Include

When reporting a vulnerability, please include:

1. **Description**: A clear description of the vulnerability
2. **Impact**: What could an attacker do with this vulnerability?
3. **Reproduction**: Step-by-step instructions to reproduce the issue
4. **Environment**: Version, OS, browser (if applicable)
5. **Suggested Fix**: (Optional) If you have suggestions for fixing the issue

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 1 week
- **Fix Timeline**: Depends on severity and complexity
  - Critical: 1-2 weeks
  - High: 2-4 weeks
  - Medium: 1-2 months
  - Low: Next release

## Security Best Practices

When using Brave Sync Notes:

1. **Keep your mnemonic phrase secure** - It's the only way to recover your encrypted notes
2. **Use strong passwords** if additional authentication is enabled
3. **Keep dependencies updated** - We monitor and update dependencies regularly
4. **Use HTTPS** in production deployments
5. **Regular backups** - Export your notes periodically

## Security Features

Brave Sync Notes implements the following security measures:

- **End-to-End Encryption**: Client-side AES-256-GCM encryption
- **Zero-Knowledge Architecture**: Server never sees plaintext or encryption keys
- **Secure Key Derivation**: Password-based key derivation using PBKDF2
- **Mnemonic Recovery**: BIP39-based 12-word recovery phrase

## Security Updates

Security updates will be announced through:

1. GitHub Security Advisories
2. Release notes (marked as "Security Fix")
3. CHANGELOG.md updates

## Acknowledgments

We thank the following individuals for responsibly disclosing security issues:

*(This list is currently empty - be the first!)*
