---
name: risk-scoring
description: Aggregate clause-level risks into contract-level score and executive summary. Trigger when producing an overall contract risk assessment.
---

# Contract Risk Scoring

## Aggregation Algorithm
1. CRITICAL clauses → overall = CRITICAL (regardless of others)
2. Any HIGH, no CRITICAL → overall = HIGH
3. All MEDIUM or below → overall = MEDIUM
4. All LOW/INFO → overall = LOW

## Score (0-100)
- CRITICAL clauses: 25 points each (capped at 75)
- HIGH clauses: 10 points each (capped at 40)
- MEDIUM clauses: 3 points each (capped at 15)
- BASE: 10 points (every contract has some baseline risk)

## Output
```json
{
  "overall_risk": "HIGH",
  "score": 68,
  "breakdown": {"CRITICAL": 0, "HIGH": 4, "MEDIUM": 6, "LOW": 5, "INFO": 3},
  "top_concerns": ["...", "..."],
  "missing_clauses": ["DATA_PROCESSING", "FORCE_MAJEURE"],
  "recommendation": "Negotiate liability cap and auto-renewal notice before signing."
}
```

## Party Perspective Adjustment
When reviewing party is CUSTOMER: weight PAYMENT and TERMINATION risks higher.
When reviewing party is VENDOR: weight IP_OWNERSHIP and LIABILITY risks higher.
When reviewing party is EMPLOYEE: weight NON_COMPETE and SEVERANCE risks higher.
