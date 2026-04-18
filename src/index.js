#!/usr/bin/env node
const { program } = require('commander');
const dotenv = require('dotenv');

dotenv.config();

if (process.argv.length <= 2) {
  process.argv.push('grade', '--help');
}

program
  .name('website-grader')
  .description('CRO parameter grader for competitor websites')
  .version('1.0.0');

program
  .command('grade')
  .description('Grade websites from input CSV')
  .option('-i, --input <path>', 'Input CSV file path', 'ads.csv')
  .option('-o, --output <path>', 'Output CSV file path', 'results.csv')
  .option('-c, --concurrency <n>', 'Parallel workers', '3')
  .option('--skip-psi', 'Skip PageSpeed Insights API calls')
  .option('--skip-llm', 'Skip Claude LLM grading')
  .option('--only-domain <domain>', 'Grade only one domain (testing)')
  .option('--no-resume', 'Do not skip domains already present in output CSV')
  .option('--limit <n>', 'Process at most N URLs (smoke test)')
  .option('--vision-hero', 'Use screenshot in LLM for hero/visual (p43)')
  .option('--weights <path>', 'JSON file with category weights')
  .action(async options => {
    const { runGrader } = require('./queue');
    await runGrader({
      input: options.input,
      output: options.output,
      concurrency: options.concurrency,
      skipPsi: options.skipPsi,
      skipLlm: options.skipLlm,
      onlyDomain: options.onlyDomain,
      resume: options.resume,
      limit: options.limit,
      visionHero: options.visionHero,
      weightsProfile: options.weights || options.weightsProfile
    });
  });

program.parse();
