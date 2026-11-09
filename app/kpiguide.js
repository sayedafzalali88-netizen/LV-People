/* KPI reference for the HR Assistant.
   One short entry for every KPI of the KPI library: its number, name, how it is scored, the maximum score, and what to do to score well.
   These entries are for the HR Assistant index only (they are not shown in the User Guide pages). A question like "KPI-277 kaise kaam karti hai"
   or "KPI-277 me acha score kaise laun" finds the entry of that KPI. The entries are written from the rule and the method of the KPI,
   nothing is added by hand: what to do to score well comes only from what the rule measures. */
(function () {
  var R4 = ['admin', 'hr', 'manager', 'employee'];
  var METHOD = {
    'Auto': ['Auto: the system works it out by itself from the records in the system.', 'Auto: सिस्टम इसे अपने आप सिस्टम के रिकॉर्ड से निकालता है।',
      'To score well, do the work that the rule above measures, and make sure the records it needs are entered on time. If the rule needs figures that you enter (for example in Marketing > Audience), enter them before the month closes.',
      'अच्छे स्कोर के लिए ऊपर के नियम में जो मापा जाता है वह काम करें, और उसके लिए ज़रूरी रिकॉर्ड समय पर भरें। अगर नियम को ऐसे आँकड़े चाहिए जो आप भरते हैं (जैसे Marketing > Audience में), तो महीना बंद होने से पहले उन्हें भरें।'],
    'Manager Scoring': ['Manager Scoring: your manager rates it from 1 to 10 at the month end. The score is the rating divided by 10, times the maximum score.', 'Manager Scoring: आपका मैनेजर महीने के अंत में इसे 1 से 10 की रेटिंग देता है। स्कोर = रेटिंग ÷ 10 × अधिकतम स्कोर।',
      'To score well, meet what your manager expects for this KPI and keep your work visible to your manager during the month. Ask your manager what a rating of 10 looks like for this KPI.',
      'अच्छे स्कोर के लिए इस KPI पर मैनेजर की अपेक्षा पूरी करें और महीने भर अपना काम मैनेजर को दिखाते रहें। मैनेजर से पूछें कि इस KPI में 10 की रेटिंग कैसी होती है।'],
    'Survey': ['Survey: it is scored from the answers of the survey that is sent to the people it is about.', 'Survey: यह उस सर्वे के जवाबों से स्कोर होता है जो संबंधित लोगों को भेजा जाता है।',
      'To score well, do what the people who answer the survey value in this KPI, and keep in touch with them during the month.',
      'अच्छे स्कोर के लिए वह करें जो सर्वे में जवाब देने वाले लोग इस KPI में महत्व देते हैं, और महीने भर उनसे जुड़े रहें।'],
    'Audit': ['Audit: an auditor scores it against a checklist.', 'Audit: ऑडिटर इसे एक चेकलिस्ट के आधार पर स्कोर करता है।',
      'To score well, follow every point of the checklist of this KPI at all times, not only on the day of the audit. Ask for the checklist (PMS > Checklists) and keep proof of the work.',
      'अच्छे स्कोर के लिए इस KPI की चेकलिस्ट का हर बिंदु हमेशा निभाएँ, सिर्फ़ ऑडिट के दिन नहीं। चेकलिस्ट (PMS > Checklists) माँगें और काम का सबूत रखें।'],    'Team Average': ['Team Average: it is the average of the scores of the people who report to you.', 'Team Average: यह आपको रिपोर्ट करने वाले लोगों के स्कोर का औसत है।',
      'To score well, help each person of your team to score well: guide them, follow up and remove what stops them.',
      'अच्छे स्कोर के लिए अपनी टीम के हर व्यक्ति को अच्छा स्कोर करने में मदद करें: मार्गदर्शन दें, फ़ॉलो-अप करें और जो रुकावट हो उसे हटाएँ।']
  };
  var DEFAULT_M = ['Scored as the rule above says.', 'ऊपर के नियम के अनुसार स्कोर होता है।', 'To score well, do what the rule above measures.', 'अच्छे स्कोर के लिए ऊपर के नियम में जो मापा जाता है वह करें।'];
  window.kpiGuideEntries = function () {
    if (typeof KPI === 'undefined' || !Array.isArray(KPI)) return [];
    var map = {};
    try { map = KPIMOD || {}; } catch (e) {}
    return KPI.filter(function (k) { return k && k.id && k.active !== false && k.name; }).map(function (k) {
      var m = METHOD[k.method] || DEFAULT_M, mod = map[k.id] || 'pms', num = String(k.id).replace(/^KPI-?/i, '');
      var head = k.id + ' (' + 'KPI ' + num + ', KPI' + num + ') · ' + k.name;
      var facts = 'Frequency: ' + (k.freq || '') + ' · Maximum score: ' + (k.max != null ? k.max : '');
      var factsHi = 'आवृत्ति: ' + (k.freq || '') + ' · अधिकतम स्कोर: ' + (k.max != null ? k.max : '');
      var rule = (k.rule || '').toString().trim();
      var en = head + '\n' + facts + '\nHow it is scored: ' + m[0] + (rule ? '\nRule: ' + rule : '') + '\nHow to score well: ' + m[2] + '\nWhere to see your score: PMS > My KPIs.';
      var hi = head + '\n' + factsHi + '\nकैसे स्कोर होता है: ' + m[1] + (rule ? '\nनियम (English में): ' + rule : '') + '\nअच्छा स्कोर कैसे पाएँ: ' + m[3] + '\nअपना स्कोर कहाँ देखें: PMS > My KPIs।';
      return { module_id: 'kpiref', entry_id: 'kpi-' + String(num).toLowerCase(), app_module: mod, allowed_roles: R4, module_name: 'KPI reference', title: k.id + ' · ' + k.name, path: 'PMS > KPI master', content_en: en, content_hi: hi };
    });
  };
})();
