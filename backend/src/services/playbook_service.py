from src.services.gcs_service import GCSService

CONTRACT_TYPES = ["nda", "saas_agreement", "employment", "msa", "sow", "ip_license", "generic"]

DEFAULT_PLAYBOOKS: dict[str, str] = {
    "nda": """# NDA Playbook

## Required Clauses
- CONFIDENTIALITY, TERMINATION, GOVERNING_LAW, DISPUTE_RESOLUTION

## Risk Calibration
- One-way NDA where we are the disclosing party = CRITICAL if no carve-outs for prior knowledge
- Survival period > 3 years post-termination = HIGH
- Mutual NDA = LOW base risk for confidentiality

## Red Flags
- No definition of "Confidential Information" = CRITICAL
- Residuals clause (retaining knowledge in unaided memory) = CRITICAL
- Unlimited remedy / injunctive relief without reciprocity = HIGH

## Jurisdiction Notes
- UK: implied duty of confidence exists even without a contract
- France: RGPD compliance required if personal data is in scope
- US/CA: trade secret protections under DTSA may supplement

## Negotiation Priorities
1. Narrow the definition of Confidential Information
2. Add carve-outs: public domain, independent development, prior knowledge
3. Cap survival period to 2 years
4. Remove or reciprocate residuals clause
5. Add mutual injunctive relief or remove it entirely
""",
    "saas_agreement": """# SaaS Agreement Playbook

## Required Clauses
- PAYMENT, LIABILITY, CONFIDENTIALITY, DATA_PROCESSING, TERMINATION, IP_OWNERSHIP

## Risk Calibration
- No liability cap = CRITICAL for vendor
- Auto-renewal without notice period = HIGH for customer
- Data processing terms absent when PII involved = CRITICAL

## Red Flags
- Unlimited indemnification scope = CRITICAL
- Vendor can modify terms unilaterally = HIGH
- No SLA or uptime guarantee = MEDIUM

## Jurisdiction Notes
- EU customers: GDPR DPA required, SCCs if data leaves EU
- US: CCPA compliance for California customers

## Negotiation Priorities
1. Cap liability at 12 months of fees paid
2. Add 30-day notice before auto-renewal
3. Negotiate DPA with appropriate SCCs
4. Define acceptable use policy scope
5. Add data portability and deletion rights on termination
""",
    "employment": """# Employment Agreement Playbook

## Required Clauses
- PAYMENT, NON_COMPETE, CONFIDENTIALITY, TERMINATION, GOVERNING_LAW

## Risk Calibration
- Non-compete scope > 1 year or > regional = HIGH for employee
- IP assignment clause covering pre-employment inventions = CRITICAL for employee
- At-will termination with no severance = HIGH

## Red Flags
- Blanket IP assignment with no carve-out for personal projects = CRITICAL
- Non-solicitation covering customers AND employees with no time limit = HIGH
- Arbitration clause waiving class action = HIGH

## Jurisdiction Notes
- California: non-competes generally unenforceable
- UK: non-competes enforceable if reasonable in scope and duration

## Negotiation Priorities
1. Carve out pre-employment inventions from IP assignment
2. Limit non-compete to 6 months, direct competitors only
3. Add severance provision (minimum 1 month per year of service)
4. Define termination for cause narrowly
5. Remove class action waiver
""",
    "msa": """# Master Services Agreement Playbook

## Required Clauses
- PAYMENT, LIABILITY, INDEMNIFICATION, CONFIDENTIALITY, TERMINATION, GOVERNING_LAW

## Risk Calibration
- No mutual indemnification = HIGH for service provider
- Payment terms > Net 60 = HIGH for service provider
- Uncapped indemnification for IP infringement = CRITICAL

## Red Flags
- Step-in rights allowing customer to replace personnel = HIGH
- Change order process absent = HIGH

## Negotiation Priorities
1. Cap total liability at 12 months of fees
2. Mutual IP indemnification
3. Net 30 payment terms
4. Define change order process explicitly
5. Limit audit rights to once per year with 30 days notice
""",
    "sow": """# Statement of Work Playbook

## Required Clauses
- PAYMENT, ACCEPTANCE_CRITERIA, IP_OWNERSHIP, CHANGE_ORDER, TERMINATION

## Risk Calibration
- Acceptance criteria undefined or purely subjective = CRITICAL
- IP ownership silent (defaults to work-for-hire) = HIGH for contractor
- No change order process = HIGH

## Red Flags
- Unlimited revisions without change order = HIGH
- Penalty clauses for delay without force majeure = HIGH
- Payment tied solely to final acceptance = HIGH

## Negotiation Priorities
1. Define acceptance criteria with objective pass/fail tests
2. Explicit IP ownership (license vs. assignment)
3. Change order triggers and pricing mechanism
4. Milestone-based payment schedule
5. Force majeure clause covering delays
""",
    "ip_license": """# IP License Playbook

## Required Clauses
- IP_OWNERSHIP, PAYMENT, TERMINATION, GOVERNING_LAW

## Risk Calibration
- Exclusive license with no minimum royalty = HIGH for licensor
- Sublicensing rights without approval = HIGH for licensor
- No audit rights on royalty reporting = HIGH

## Red Flags
- Assignment of improvements to licensee = CRITICAL for licensor
- Termination for convenience without royalty tail = HIGH

## Negotiation Priorities
1. Define licensed field of use narrowly
2. Minimum annual royalties or reversion clause
3. Audit rights on royalty statements
4. Improvement ownership stays with licensor
5. Termination for cause only (not convenience)
""",
    "generic": """# Generic Contract Playbook

## Required Clauses
- TERMINATION, GOVERNING_LAW

## Risk Calibration
- No limitation of liability = HIGH
- Automatic renewal without notice = MEDIUM

## Red Flags
- One-sided amendment rights = HIGH
- Entire agreement clause missing = MEDIUM

## Negotiation Priorities
1. Add liability cap
2. Define termination triggers clearly
3. Require mutual written amendment process
""",
}


async def seed_workspace_playbooks(workspace_id: str) -> None:
    """Write default playbooks and empty memory files to GCS for a new workspace."""
    gcs = GCSService()
    for contract_type, content in DEFAULT_PLAYBOOKS.items():
        path = f"workspaces/{workspace_id}/skills/playbook-{contract_type}.md"
        await gcs.write_text(path, content)

    await gcs.write_text(
        f"workspaces/{workspace_id}/memory/counterparties.md",
        "# Counterparty Memory\n\nNo counterparties analyzed yet.\n"
    )
    await gcs.write_text(
        f"workspaces/{workspace_id}/memory/positions.md",
        "# Our Positions\n\nAdd your company's standard negotiation positions here.\n"
    )
    await gcs.write_text(
        f"workspaces/{workspace_id}/portfolio.md",
        "# Portfolio\n\nNo documents analyzed yet.\n"
    )
