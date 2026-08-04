import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from './generated/prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config();

console.log('CodeGuard AI Worker started (Express Mode)...');
console.log(`------------------------------------------------------------`);

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = express();
app.use(cors());
app.use(express.json());

async function fetchRepoTree(owner: string, repo: string, branch: string, token: string) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch repo tree');
  return res.json();
}

async function fetchFileContent(owner: string, repo: string, path: string, token: string) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch file: ${path} - ${res.status}`);
  }
  const data = await res.json();
  if (data.content && data.encoding === 'base64') {
    return Buffer.from(data.content, 'base64').toString('utf-8');
  }
  return '';
}

// Background processing function
async function processScanJob(data: any) {
  const { scanReportId, owner, repo, branch, githubToken, openRouterKey, aiModel } = data;
  console.log(`Processing scan job for ${owner}/${repo} on branch ${branch}...`);
  
  try {
    await prisma.scanReport.update({
      where: { id: scanReportId },
      data: { status: 'processing' }
    });

    const treeData = await fetchRepoTree(owner, repo, branch, githubToken);
    
    // Filter code files
    const ignoreRegex = /(\.png|\.jpg|\.jpeg|\.gif|\.ico|\.svg|\.woff|\.woff2|\.ttf|\.eot|\.mp4|\.webm|\.zip|\.tar|\.gz|\.pdf|package-lock\.json|yarn\.lock|\.env|node_modules|dist|build|\.next|\.git)/i;
    let files = treeData.tree.filter((t: any) => t.type === 'blob' && !ignoreRegex.test(t.path));
    
    // Prioritize source code files
    const sourceCodeRegex = /(\.ts|\.tsx|\.js|\.jsx|\.py|\.go|\.java|\.rb|\.php|\.c|\.cpp|\.h|\.cs)$/i;
    files.sort((a: any, b: any) => {
      const aIsSource = sourceCodeRegex.test(a.path) ? 1 : 0;
      const bIsSource = sourceCodeRegex.test(b.path) ? 1 : 0;
      return bIsSource - aIsSource; // Source files come first
    });

    // Cap at 15 files to avoid massive context
    files = files.slice(0, 15);

    if (files.length === 0) {
      throw new Error('No code files found after filtering. Ensure the repository has source code files.');
    }

    let codeContext = '';
    for (const file of files) {
      try {
        const content = await fetchFileContent(owner, repo, file.path, githubToken);
        if (content) {
          codeContext += `\n--- File: ${file.path} ---\n${content}\n`;
        }
      } catch (err: any) {
        console.warn(`Could not read ${file.path}:`, err.message);
      }
    }

    if (!codeContext.trim()) {
      throw new Error('Failed to fetch the contents of any files. The repository might be empty or the API request failed.');
    }

    // Prepare prompt
    const prompt = `
You are an expert Security Engineer and Senior Software Developer.
Analyze the following codebase with a strict focus on:
1. Security Vulnerabilities: OWASP Top 10 (Injection, XSS, CSRF, insecure auth, hardcoded secrets, IDOR, etc.).
2. Good Practices & Code Quality: SOLID principles, DRY, proper error handling, modularity, and logging.

Respond ONLY in the following JSON format, without any markdown formatting or extra text:

{
  "summary": "A concise 2-3 sentence summary evaluating the overall security posture and code quality.",
  "score": <integer from 0 to 100. Start at 100. Deduct 20 for CRITICAL, 10 for HIGH, 5 for MEDIUM, 2 for LOW. Minimum is 0.>,
  "issuesFound": <integer number of issues found>,
  "details": [
    {
      "title": "Short title of the issue",
      "category": "Security" | "Best Practice" | "Code Smell",
      "description": "Detailed explanation of why this is an issue, potential impact, and how to fix it.",
      "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
      "file": "path/to/file (optional, but highly recommended)",
      "line": <line number if applicable (optional)>,
      "vulnerableCode": "The snippet of code that has the problem (if applicable)",
      "fixExample": "A robust code snippet demonstrating how to properly fix the issue"
    }
  ]
}

Here is the codebase:
${codeContext}
`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    let openRouterRes;
    try {
      openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: aiModel || 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0,
          top_p: 0.1
        }),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!openRouterRes.ok) {
      const errTxt = await openRouterRes.text();
      throw new Error(`OpenRouter API error: ${errTxt}`);
    }

    const aiData = await openRouterRes.json();
    const resultText = aiData.choices[0].message.content;
    
    // Parse JSON safely
    let parsedResult;
    try {
      const cleanText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedResult = JSON.parse(cleanText);
    } catch (parseErr) {
      console.error('Failed to parse AI response:', resultText);
      throw new Error('AI returned malformed JSON');
    }

    await prisma.scanReport.update({
      where: { id: scanReportId },
      data: {
        status: 'completed',
        summary: parsedResult.summary,
        score: parsedResult.score,
        issuesFound: parsedResult.issuesFound,
        details: parsedResult.details,
      }
    });

    console.log(`Scan completed for ${owner}/${repo}`);

  } catch (error: any) {
    console.error(`Job failed:`, error);
    try {
      await prisma.scanReport.update({
        where: { id: scanReportId },
        data: { status: 'failed' }
      });
    } catch (dbErr) {
      console.error('Failed to update DB on job failure:', dbErr);
    }
  }
}

app.post('/process', (req, res) => {
  const data = req.body;
  if (!data.scanReportId) {
    return res.status(400).json({ error: 'Missing scanReportId' });
  }
  
  // Kick off background job immediately and return 202
  processScanJob(data).catch(console.error);
  
  res.status(202).json({ message: 'Job accepted' });
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Worker listening for HTTP jobs on port ${PORT}`);
});
