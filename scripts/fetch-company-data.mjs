import fs from 'node:fs';
import path from 'node:path';

const COMPANIES = [
  'Google',
  'Meta',
  'Amazon',
  'Microsoft',
  'Apple',
  'Uber',
  'Netflix',
  'Bloomberg',
  'LinkedIn',
  'ByteDance',
  'Adobe',
  'Goldman Sachs',
  'Nvidia',
  'Salesforce',
  'Stripe',
  'Airbnb',
  'PayPal',
  'Oracle',
  'Tesla'
];

const TIMEFRAMES = [
  { key: 'thirty-days', label: 'Last 30 Days', file: '1. Thirty Days.csv' },
  { key: 'three-months', label: 'Last 3 Months', file: '2. Three Months.csv' },
  { key: 'six-months', label: 'Last 6 Months', file: '3. Six Months.csv' },
  { key: 'all', label: 'All Time', file: '5. All.csv' }
];

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(content) {
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  
  const header = parseCSVLine(lines[0]);
  const diffIdx = header.findIndex(h => /diff/i.test(h));
  const titleIdx = header.findIndex(h => /title/i.test(h));
  const freqIdx = header.findIndex(h => /freq/i.test(h));
  const accIdx = header.findIndex(h => /accept/i.test(h));
  const linkIdx = header.findIndex(h => /link|url/i.test(h));
  const topicIdx = header.findIndex(h => /topic/i.test(h));

  const questions = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (!cols || cols.length < 2) continue;

    const rawDiff = cols[diffIdx] || 'Medium';
    const difficulty = rawDiff.charAt(0).toUpperCase() + rawDiff.slice(1).toLowerCase();
    const title = cols[titleIdx] || 'Unknown';
    const frequency = parseFloat(cols[freqIdx]) || 0;
    
    let rawAcc = cols[accIdx] || '';
    let acceptance = '50%';
    if (rawAcc.includes('%')) {
      acceptance = rawAcc;
    } else {
      const num = parseFloat(rawAcc);
      if (!isNaN(num)) {
        acceptance = num < 1 ? (num * 10000).toFixed(1) + '%' : num.toFixed(1) + '%';
      }
    }

    const link = cols[linkIdx] || `https://leetcode.com/problems/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const rawTopics = cols[topicIdx] || '';
    const topics = rawTopics
      ? rawTopics.split(',').map(t => t.trim()).filter(Boolean)
      : ['Algorithms'];

    questions.push({
      title,
      difficulty,
      frequency: Math.round(frequency * 10) / 10,
      acceptance,
      link,
      topics
    });
  }

  return questions;
}

async function main() {
  const outDir = path.resolve('data/companies');
  fs.mkdirSync(outDir, { recursive: true });

  const summary = [];
  const allTopicsSet = new Set();

  for (const company of COMPANIES) {
    console.log(`Fetching data for ${company}...`);
    const companyData = {
      name: company,
      slug: company.toLowerCase().replace(/\s+/g, '-'),
      timeframes: {}
    };

    for (const tf of TIMEFRAMES) {
      const url = `https://raw.githubusercontent.com/liquidslr/leetcode-company-wise-problems/main/${encodeURIComponent(company)}/${encodeURIComponent(tf.file)}`;
      try {
        const res = await fetch(url);
        if (res.ok) {
          const text = await res.text();
          const parsed = parseCSV(text);
          companyData.timeframes[tf.key] = parsed;
          parsed.forEach(q => q.topics.forEach(t => allTopicsSet.add(t)));
          console.log(`  -> ${tf.key}: ${parsed.length} questions`);
        } else {
          companyData.timeframes[tf.key] = [];
          console.log(`  -> ${tf.key}: failed (${res.status})`);
        }
      } catch (err) {
        console.error(`  -> ${tf.key} error:`, err.message);
        companyData.timeframes[tf.key] = [];
      }
    }

    // Save company json
    const compFile = path.join(outDir, `${companyData.slug}.json`);
    fs.writeFileSync(compFile, JSON.stringify(companyData, null, 2));

    summary.push({
      name: company,
      slug: companyData.slug,
      questionCounts: Object.fromEntries(
        Object.entries(companyData.timeframes).map(([k, v]) => [k, v.length])
      )
    });
  }

  // Save index metadata
  const indexMeta = {
    updatedAt: new Date().toISOString(),
    companies: summary,
    allTopics: Array.from(allTopicsSet).sort()
  };

  fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(indexMeta, null, 2));
  console.log(`Successfully generated company data for ${COMPANIES.length} companies!`);
}

main().catch(console.error);
