# Usage Guide: When & Why to Use the Automotive Cybersecurity MCP

## Quick Answer

**Use this MCP when you need instant answers to automotive cybersecurity regulation questions without manually searching through hundreds of pages of PDFs.**

---

## Who Should Use This

### 🚗 Automotive OEMs
**Scenario:** Preparing vehicles for UNECE type approval

**Example Questions:**
- "What does R155 require for our CSMS documentation?"
- "Show me all R155 requirements related to vulnerability management"
- "What's the difference between R155 and R156 approval processes?"

**Value:** Avoid $200-400/hour compliance consultant fees for routine questions

---

### 🔧 Tier 1/2 Suppliers
**Scenario:** Responding to OEM cybersecurity questionnaires

**Example Questions:**
- "Our customer asked about R155 Article 7.2.2.2 - what exactly does it require?"
- "What evidence do we need to show for CSMS compliance?"
- "Which R156 articles apply to our ECU software update process?"

**Value:** Quickly understand requirements to provide accurate responses

---

### 🛡️ Cybersecurity Engineers
**Scenario:** Implementing security controls and preparing for audits

**Example Questions:**
- "What are all the R155 requirements for incident response?"
- "Search for 'penetration testing' across R155 and R156"
- "What does Annex 5 say about backend server threats?"

**Value:** Find specific technical requirements without reading entire regulations

---

### 📋 Compliance Officers
**Scenario:** Creating audit documentation and compliance matrices

**Example Questions:**
- "Generate a list of all R155 monitoring and detection requirements"
- "What documentation does R155 require for type approval?"
- "Compare R155 Article 5 with R156 Article 5"

**Value:** Automate documentation generation instead of manual copy-paste

---

### 🎓 Consultants & Trainers
**Scenario:** Answering client questions and creating training materials

**Example Questions:**
- "Explain R155 Article 7 in simple terms"
- "What are the key differences between R155 Revision 1 and Revision 2?"
- "Create a summary of R156 SUMS requirements"

**Value:** Instant access to regulation text during client calls

---

## Real-World Use Cases

### Use Case 1: Pre-Audit Preparation
**Situation:** You have a CSMS audit next week

**How MCP Helps:**
```
You: "List all R155 requirements that mention 'vulnerability' or 'patch'"

Claude: [Searches and returns all relevant articles with exact references]

You: "For each requirement, what evidence would an auditor expect?"

Claude: [Provides guidance based on Article 7 specifications]
```

**Time Saved:** Hours of manual PDF searching → Seconds with AI

---

### Use Case 2: Gap Analysis
**Situation:** You need to assess compliance gaps for a new vehicle program

**How MCP Helps:**
```
You: "What are all the R155 Article 7.2.2.2 sub-requirements?"

Claude: [Returns the complete 22KB Article 7 with all subsections]

You: "Create a checklist from this content"

Claude: [Generates actionable checklist from regulation text]
```

**Time Saved:** 2-3 days of manual analysis → 30 minutes with AI

---

### Use Case 3: Supplier Assessment
**Situation:** You need to verify a supplier's R155 compliance claims

**How MCP Helps:**
```
You: "What does R155 require for supply chain security management?"

Claude: [Returns Article 7.2.2.2.f with supply chain requirements]

You: "What evidence should the supplier provide?"

Claude: [Lists expected work products and documentation]
```

**Time Saved:** Eliminates need for external consultant review

---

### Use Case 4: Customer Question Response
**Situation:** OEM customer sent RFQ asking about R156 compliance

**How MCP Helps:**
```
You: "Show me R156 Article 7 requirements for software update assessment"

Claude: [Returns complete Article 7 SUMS specifications]

You: "How does our update process at [company] map to these requirements?"

Claude: [Helps analyze your process against requirements]
```

**Time Saved:** Same-day response vs 1-week research

---

### Use Case 5: Training Materials
**Situation:** You're creating R155 training for engineering team

**How MCP Helps:**
```
You: "Explain R155 Article 7 in simple terms for software engineers"

Claude: [Translates regulation-speak to developer-friendly language]

You: "Create quiz questions from R155 Article 7.2.2.2"

Claude: [Generates training assessments from regulation content]
```

**Time Saved:** Automated content generation vs manual slide creation

---

## When NOT to Use This MCP

❌ **Legal interpretation** - Regulations require professional legal review
❌ **Certification decisions** - Type approval authorities make final calls
❌ **ISO 21434 full text** - We only have expert guidance (copyrighted standard)
❌ **Non-automotive regs** - Use EU Compliance MCP for general EU regulations

---

## Quick Start Examples

### Example 1: Simple Lookup
```
You: "What does R155 Article 7 require?"
→ Gets complete 22KB CSMS specifications
```

### Example 2: Keyword Search
```
You: "Find all R155 requirements about threat analysis"
→ Searches across all articles and returns relevant sections
```

### Example 3: Comparison
```
You: "Compare R155 and R156 approval processes"
→ Analyzes Articles 3-6 from both regulations
```

### Example 4: Documentation Help
```
You: "What documentation does R155 Annex 4 require for CSMS certificate?"
→ Returns certificate template and requirements
```

---

## ROI Calculation

**Traditional Approach:**
- Consultant: $300/hour
- Average question: 1 hour research
- 10 questions/month = $3,000/month = **$36,000/year**

**With This MCP:**
- Cost: Free (open source)
- Average question: 2 minutes
- 10 questions/month = 20 minutes
- Savings: **$36,000/year**

**Break-even:** Immediate (first question answered)

---

## Getting Started in 2 Minutes

1. **Install MCP** (one-time setup)
   ```json
   // Add to ~/.claude/claude_desktop_config.json
   {
     "mcpServers": {
       "automotive": {
         "command": "npx",
         "args": ["-y", "@ansvar/automotive-cybersecurity-mcp"]
       }
     }
   }
   ```

2. **Restart Claude Desktop**

3. **Ask your first question**
   ```
   "What does R155 Article 7.2.2.2 require for risk assessment?"
   ```

4. **Start saving time** ⚡

---

## Support

- **GitHub Issues:** https://github.com/Ansvar-Systems/Automotive-MCP/issues
- **Documentation:** See README.md
- **EU Regulations:** Use https://github.com/Ansvar-Systems/EU_compliance_MCP

**License:** Apache 2.0 - Free for commercial use
