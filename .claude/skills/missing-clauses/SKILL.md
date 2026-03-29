---
name: missing-clauses
description: Detect missing standard clauses based on contract type. Trigger when performing post-extraction completeness check.
---

# Missing Clause Detector

## Checklists by Contract Type

### saas_agreement
Required: PAYMENT, LIABILITY, CONFIDENTIALITY, DATA_PROCESSING, TERMINATION, IP_OWNERSHIP, SECURITY, GOVERNING_LAW
Recommended: FORCE_MAJEURE, NOTICE, ENTIRE_AGREEMENT, ASSIGNMENT, AUDIT_RIGHTS

### employment
Required: PAYMENT, TERMINATION, GOVERNING_LAW, NOTICE
Recommended: NON_COMPETE, NON_SOLICITATION, CONFIDENTIALITY, IP_OWNERSHIP

### nda
Required: CONFIDENTIALITY, TERMINATION, GOVERNING_LAW, NOTICE
Recommended: ENTIRE_AGREEMENT, SURVIVAL, DISPUTE_RESOLUTION

### msa
Required: PAYMENT, LIABILITY, CONFIDENTIALITY, TERMINATION, IP_OWNERSHIP, NOTICE, GOVERNING_LAW
Recommended: FORCE_MAJEURE, INDEMNIFICATION, AUDIT_RIGHTS, CHANGE_ORDER

### generic
Required: TERMINATION, GOVERNING_LAW
Recommended: LIABILITY, NOTICE

## Output
- Missing required clause → risk_level = HIGH, document-level flag
- Missing recommended clause → risk_level = MEDIUM, document-level flag
- Never flag at clause-level — these are document-level gaps
