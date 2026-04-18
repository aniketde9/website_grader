/**
 * Single source of truth: parameter id, CSV column (Appendix A), tier, category for weighting.
 * Categories match spec §13 CATEGORY_WEIGHTS groupings.
 */

const CATEGORIES = {
  first_impression_cta: 'first_impression_cta',
  trust_social_proof: 'trust_social_proof',
  lead_capture_forms: 'lead_capture_forms',
  copy_quality: 'copy_quality',
  funnel_pricing: 'funnel_pricing',
  technical_performance: 'technical_performance',
  tracking_infra: 'tracking_infra'
};

/** @type {{ id: string, csvColumn: string, tier: 1|2|3, category: string }[]} */
const PARAMETERS = [
  { id: 'p01', csvColumn: 'p01_subheadline', tier: 1, category: CATEGORIES.first_impression_cta },
  { id: 'p02', csvColumn: 'p02_cta_above_fold', tier: 1, category: CATEGORIES.first_impression_cta },
  { id: 'p03', csvColumn: 'p03_cta_verb_copy', tier: 1, category: CATEGORIES.first_impression_cta },
  { id: 'p04', csvColumn: 'p04_cta_contrast', tier: 1, category: CATEGORIES.first_impression_cta },
  { id: 'p05', csvColumn: 'p05_single_cta_per_view', tier: 1, category: CATEGORIES.first_impression_cta },
  { id: 'p06', csvColumn: 'p06_cta_repeated', tier: 1, category: CATEGORIES.first_impression_cta },
  { id: 'p07', csvColumn: 'p07_cta_sticky_mobile', tier: 1, category: CATEGORIES.first_impression_cta },
  { id: 'p08', csvColumn: 'p08_video_testimonial', tier: 1, category: CATEGORIES.trust_social_proof },
  { id: 'p09', csvColumn: 'p09_star_rating', tier: 1, category: CATEGORIES.trust_social_proof },
  { id: 'p10', csvColumn: 'p10_customer_stat', tier: 1, category: CATEGORIES.trust_social_proof },
  { id: 'p11', csvColumn: 'p11_countdown_timer', tier: 1, category: CATEGORIES.trust_social_proof },
  { id: 'p12', csvColumn: 'p12_friction_microcopy', tier: 1, category: CATEGORIES.lead_capture_forms },
  { id: 'p13', csvColumn: 'p13_form_field_count_score', tier: 1, category: CATEGORIES.lead_capture_forms },
  { id: 'p14', csvColumn: 'p14_label_above_field', tier: 1, category: CATEGORIES.lead_capture_forms },
  { id: 'p15', csvColumn: 'p15_multistep_form', tier: 1, category: CATEGORIES.lead_capture_forms },
  { id: 'p16', csvColumn: 'p16_privacy_microcopy', tier: 1, category: CATEGORIES.lead_capture_forms },
  { id: 'p17', csvColumn: 'p17_transparent_pricing', tier: 1, category: CATEGORIES.funnel_pricing },
  { id: 'p18', csvColumn: 'p18_pricing_comparison_table', tier: 1, category: CATEGORIES.funnel_pricing },
  { id: 'p19', csvColumn: 'p19_billing_toggle', tier: 1, category: CATEGORIES.funnel_pricing },
  { id: 'p20', csvColumn: 'p20_live_chat', tier: 1, category: CATEGORIES.funnel_pricing },
  { id: 'p21', csvColumn: 'p21_booking_widget', tier: 1, category: CATEGORIES.funnel_pricing },
  { id: 'p22', csvColumn: 'p22_core_web_vitals', tier: 1, category: CATEGORIES.technical_performance },
  { id: 'p23', csvColumn: 'p23_mobile_perf_score', tier: 1, category: CATEGORIES.technical_performance },
  { id: 'p24', csvColumn: 'p24_tap_targets', tier: 1, category: CATEGORIES.technical_performance },
  { id: 'p25', csvColumn: 'p25_ga4_gtm', tier: 1, category: CATEGORIES.tracking_infra },
  { id: 'p26', csvColumn: 'p26_retargeting_pixels', tier: 1, category: CATEGORIES.tracking_infra },
  { id: 'p27', csvColumn: 'p27_session_replay', tier: 1, category: CATEGORIES.tracking_infra },
  { id: 'p28', csvColumn: 'p28_ab_testing', tier: 1, category: CATEGORIES.tracking_infra },
  { id: 'p29', csvColumn: 'p29_logo_wall', tier: 2, category: CATEGORIES.trust_social_proof },
  { id: 'p30', csvColumn: 'p30_attributed_testimonials', tier: 2, category: CATEGORIES.trust_social_proof },
  { id: 'p31', csvColumn: 'p31_trust_badges_decision', tier: 2, category: CATEGORIES.trust_social_proof },
  { id: 'p32', csvColumn: 'p32_urgency_scarcity', tier: 2, category: CATEGORIES.trust_social_proof },
  { id: 'p33', csvColumn: 'p33_guarantee_near_cta', tier: 2, category: CATEGORIES.trust_social_proof },
  { id: 'p34', csvColumn: 'p34_faq_section', tier: 2, category: CATEGORIES.trust_social_proof },
  { id: 'p35', csvColumn: 'p35_lead_magnet', tier: 2, category: CATEGORIES.lead_capture_forms },
  { id: 'p36', csvColumn: 'p36_popup_trigger_timing', tier: 2, category: CATEGORIES.lead_capture_forms },
  { id: 'p37', csvColumn: 'p37_inline_optin', tier: 2, category: CATEGORIES.lead_capture_forms },
  { id: 'p38', csvColumn: 'p38_blog_content_upgrades', tier: 2, category: CATEGORIES.lead_capture_forms },
  { id: 'p39', csvColumn: 'p39_inline_form_validation', tier: 2, category: CATEGORIES.lead_capture_forms },
  { id: 'p40', csvColumn: 'p40_nav_removed_lp', tier: 2, category: CATEGORIES.funnel_pricing },
  { id: 'p41', csvColumn: 'p41_plan_persona_mapping', tier: 2, category: CATEGORIES.funnel_pricing },
  { id: 'p42', csvColumn: 'p42_headline_clarity', tier: 3, category: CATEGORIES.copy_quality },
  { id: 'p43', csvColumn: 'p43_hero_visual_quality', tier: 3, category: CATEGORIES.copy_quality },
  { id: 'p44', csvColumn: 'p44_three_question_test', tier: 3, category: CATEGORIES.copy_quality },
  { id: 'p45', csvColumn: 'p45_benefit_led_copy', tier: 3, category: CATEGORIES.copy_quality },
  { id: 'p46', csvColumn: 'p46_claim_specificity', tier: 3, category: CATEGORIES.copy_quality },
  { id: 'p47', csvColumn: 'p47_differentiation', tier: 3, category: CATEGORIES.copy_quality },
  { id: 'p48', csvColumn: 'p48_voc_language', tier: 3, category: CATEGORIES.copy_quality },
  { id: 'p49', csvColumn: 'p49_benefit_subheadings', tier: 3, category: CATEGORIES.copy_quality }
];

const METADATA_COLUMNS = [
  'domain',
  'profession',
  'location',
  'website_name',
  'url',
  'is_directory'
];

const DEBUG_COLUMNS = [
  'llm_raw_response',
  'psi_lcp_ms',
  'psi_inp_ms',
  'psi_cls',
  'psi_mobile_score'
];

const ERROR_COLUMNS = ['scrape_status', 'scrape_error_message'];

const SCORE_COLUMNS = [
  'tier1_score',
  'tier2_score',
  'tier3_score',
  'total_raw_score',
  'total_weighted_score',
  'grade'
];

function getOutputHeader() {
  return [
    ...METADATA_COLUMNS,
    ...PARAMETERS.map(p => p.csvColumn),
    ...DEBUG_COLUMNS,
    ...ERROR_COLUMNS,
    ...SCORE_COLUMNS
  ];
}

module.exports = {
  PARAMETERS,
  METADATA_COLUMNS,
  CATEGORIES,
  getOutputHeader,
  PARAMETER_BY_ID: Object.fromEntries(PARAMETERS.map(p => [p.id, p]))
};
