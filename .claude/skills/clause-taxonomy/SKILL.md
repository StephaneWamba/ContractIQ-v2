---
name: clause-taxonomy
description: Map raw contract text to standardized clause types. Trigger when classifying contract language.
---

# Clause Taxonomy Classifier

## Classification Rules

| Primary legal effect | Type |
|---|---|
| Governs when/how parties can exit | TERMINATION |
| Limits financial exposure | LIABILITY |
| Restricts information disclosure | CONFIDENTIALITY |
| Transfers or licenses IP | IP_OWNERSHIP |
| Handles personal data processing | DATA_PROCESSING |
| Post-contract competition restriction | NON_COMPETE |
| Governs dispute resolution | DISPUTE_RESOLUTION |
| Payment amounts/timing | PAYMENT |
| Excused non-performance | FORCE_MAJEURE |
| One party indemnifies the other | INDEMNIFICATION |
| Scope change process | CHANGE_ORDER |
| Right to inspect records | AUDIT_RIGHTS |

## Ambiguous Cases
1. Use the **primary legal effect** (not incidental)
2. If truly dual-purpose, use the higher-risk type
3. "Representations and Warranties" combined clause → REPRESENTATIONS
