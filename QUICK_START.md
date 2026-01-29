# Quick Start: Automotive Cybersecurity MCP

## What Is This?

**Ask Claude questions about automotive cybersecurity regulations (UNECE R155/R156) and get instant answers with exact source references.**

Stop searching through 200+ page PDFs. Just ask.

---

## 30-Second Setup

1. Add to `~/.claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "automotive": {
      "command": "npx",
      "args": ["-y", "@ansvar/automotive-cybersecurity-mcp"]
    }
  }
}
```

2. Restart Claude Desktop

3. Done! Start asking questions.

---

## When to Use This

### ✅ USE THIS WHEN:

**1. Preparing for Type Approval**
- "What CSMS documentation does R155 require?"
- "Show me R155 Annex 4 certificate template"

**2. Answering Customer Questions**
- "What does R155 Article 7.2.2.2 say about vulnerability management?"
- "Explain R156 software update requirements"

**3. Creating Compliance Docs**
- "List all R155 incident response requirements"
- "Generate R155 Article 7 compliance checklist"

**4. Gap Analysis**
- "What are the R155 requirements for supply chain security?"
- "Compare our process to R156 Article 7"

**5. Training & Education**
- "Explain R155 in simple terms"
- "Create quiz questions from R155 Article 7"

---

## Common Questions

### OEM Preparing for Approval
```
Q: "I'm preparing our R155 type approval package. What do I need?"
A: [Claude returns Article 3, Annex 4, Annex 5 requirements]

Q: "Show me the CSMS certificate template"
A: [Claude returns Annex 4 complete template]
```

### Supplier Responding to RFQ
```
Q: "Customer asked about R155 Article 7.2.2.2.f - what is that?"
A: [Claude returns supply chain security requirements]

Q: "What evidence do I need to provide?"
A: [Claude explains expected documentation]
```

### Security Engineer Implementing Controls
```
Q: "What does R155 require for penetration testing?"
A: [Claude searches and returns Article 7.2.3 testing requirements]

Q: "Search R155 for 'intrusion detection'"
A: [Claude finds all mentions with context]
```

---

## What You Get

**Content:**
- ✅ Complete R155 regulation (17 items, 12 articles + 5 annexes)
- ✅ Complete R156 regulation (16 items, 12 articles + 4 annexes)
- ✅ Full-text search across 294KB of regulation text
- ✅ Exact article references for citations

**Not Included:**
- ❌ ISO 21434 full text (copyrighted - we have 1 clause guidance only)
- ❌ Legal advice (regulations ≠ legal interpretation)
- ❌ Certification decisions (contact type approval authority)

---

## ROI

**Without MCP:**
- Compliance consultant: $300/hour
- 10 questions/month = $3,000/month
- Annual cost: **$36,000**

**With MCP:**
- Cost: **$0** (open source)
- Time per question: 2 minutes vs 1 hour
- Annual savings: **$36,000**

---

## Example Workflow

**Scenario:** You received RFQ asking about R155 compliance

**Traditional Approach (2-3 days):**
1. Download 200-page R155 PDF
2. Search for relevant sections
3. Read entire articles for context
4. Cross-reference annexes
5. Write response
6. Have consultant review

**With MCP (30 minutes):**
```
You: "What does R155 require for CSMS documentation?"
→ Instant article list with references

You: "Show me Article 7.2.2.2 supply chain requirements"
→ Complete requirement text

You: "What evidence would an auditor expect?"
→ Guidance on documentation

You: "Draft response email about our compliance"
→ Claude generates response with citations
```

---

## Sample Questions to Try

**Understanding Requirements:**
- "Explain R155 Article 7 in simple terms"
- "What's the difference between R155 and R156?"
- "Show me all R155 annexes"

**Finding Specific Info:**
- "Search R155 for 'vulnerability management'"
- "What does R155 say about incident response?"
- "Find all R156 requirements about software updates"

**Creating Documentation:**
- "Generate compliance checklist from R155 Article 7"
- "Create gap analysis template for R155"
- "List all R155 required work products"

**Answering Auditor Questions:**
- "What evidence does R155 require for CSMS approval?"
- "Explain R155 Annex 5 threat categories"
- "What is conformity of production in R155?"

---

## Technical Details

**Database:** 620KB SQLite with FTS5 full-text search
**Performance:** <1ms query response
**Content:** 33 regulation items (294KB text)
**Tests:** 91/91 passing
**License:** Apache 2.0 (free commercial use)

---

## Need More?

📖 **Full Usage Guide:** `docs/USAGE_GUIDE.md`
📋 **Integration Summary:** `R155_R156_INTEGRATION_SUMMARY.md`
🐛 **Issues:** https://github.com/Ansvar-Systems/Automotive-MCP/issues
📚 **EU Regulations:** https://github.com/Ansvar-Systems/EU_compliance_MCP

---

**Ready? Just ask Claude your first R155/R156 question! 🚀**
