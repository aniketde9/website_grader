function buildCavemanPrompt(context, opts = {}) {
  const visionNote = opts.includeVision
    ? '\nQ2 uses the attached hero screenshot (stock vs specific / real).'
    : '';
  return `Website content:
${context}
${visionNote}
Score 1-5 (1=worst,5=best). Reply ONLY with 8 comma-separated integers, nothing else.

Q1: H1 clarity - visitor understands what product is and who it's for
Q2: Above-fold copy specificity - real outcomes vs vague marketing (and hero visual if image provided)
Q3: Above-fold answers What/Who/Next-action
Q4: Body copy leads with customer outcomes not product features
Q5: Claims use specific numbers or timeframes not vague superlatives
Q6: Page states clear unique positioning vs alternatives
Q7: Copy uses audience's natural language not corporate jargon
Q8: H2/H3 headings convey customer outcomes not feature names

Reply format: N,N,N,N,N,N,N,N`;
}

module.exports = { buildCavemanPrompt };
