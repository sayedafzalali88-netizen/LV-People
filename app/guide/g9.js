/* Mirror-HR User Guide: HR Assistant (Policy Management for HR and Admin, and the HR Assistant chat for every employee). */
G('policies', ['Policy Management', 'पॉलिसी मैनेजमेंट'],
  ['HR and Admin upload the company policies here. HR Assistant (the chat button at the bottom right of every page) answers employees only from these policies, never from general knowledge or the law.',
   'HR और Admin यहाँ कंपनी की पॉलिसी अपलोड करते हैं। HR सहायक (हर पेज पर नीचे दाईं ओर का चैट बटन) कर्मचारियों को सिर्फ़ इन्हीं पॉलिसी से जवाब देता है, कभी सामान्य ज्ञान या क़ानून से नहीं।'],
  [
    { id: 'list', n: ['Policies', 'पॉलिसी'], hr: true,
      path: ['Administration > Policy Management > Policies', 'प्रशासन > पॉलिसी मैनेजमेंट > पॉलिसी'],
      what: ['The list of company policies with their live version, who may see them and their status: Processing, Ready to test, Active, Failed or Archived.', 'कंपनी की पॉलिसी की सूची: चालू वर्ज़न, कौन देख सकता है और स्थिति: प्रोसेस हो रही, टेस्ट के लिए तैयार, चालू, विफल या आर्काइव।'],
      why: ['HR Assistant can answer only what is written in an Active policy. Keeping this list correct keeps the answers correct.', 'HR सहायक सिर्फ़ वही बता सकता है जो किसी चालू पॉलिसी में लिखा है। यह सूची सही रहेगी तो जवाब सही रहेंगे।'],
      who: ['HR and Admin.', 'HR और Admin।'],
      steps: [
        ['Open Administration > Policy Management and press "+ Upload policy".', 'प्रशासन > पॉलिसी मैनेजमेंट खोलें और "+ पॉलिसी अपलोड करें" दबाएँ।'],
        ['Write the policy name, choose the category (Leave, Attendance, Salary, Conduct, Travel …), the version and the effective date.', 'पॉलिसी का नाम लिखें, श्रेणी चुनें (छुट्टी, हाज़िरी, वेतन, आचरण, यात्रा …), वर्ज़न और लागू होने की तारीख़।'],
        ['Tick the roles that may get answers from it. A policy only for managers: tick Manager, HR and Admin. Choose "Only selected departments" if it is for some departments only.', 'वे रोल चुनें जिन्हें इससे जवाब मिलें। सिर्फ़ मैनेजरों की पॉलिसी: Manager, HR और Admin चुनें। कुछ ही विभागों के लिए हो तो "सिर्फ़ चुने हुए विभाग" चुनें।'],
        ['Choose the file: PDF, DOCX or TXT, up to 20 MB. Scanned PDFs are read with OCR.', 'फ़ाइल चुनें: PDF, DOCX या TXT, 20 MB तक। स्कैन की हुई PDF OCR से पढ़ी जाती है।'],
        ['Leave "Switch it on … as soon as it is processed" ticked to make it live at once, or untick it to test first in Test Chat.', '"प्रोसेस होते ही … चालू करें" चुना रहने दें ताकि यह तुरंत चालू हो, या पहले टेस्ट चैट में जाँचने के लिए हटा दें।'],
        ['Press Upload. The status shows Processing and changes by itself (usually within a minute; a long scanned file takes longer). You can keep working.', 'अपलोड दबाएँ। स्थिति "प्रोसेस हो रही" दिखेगी और अपने आप बदलेगी (आम तौर पर एक मिनट में; लंबी स्कैन फ़ाइल में ज़्यादा)। आप काम जारी रख सकते हैं।'],
        ['Press View to see the text that was read from the file: check headings, numbers and Hindi text.', 'फ़ाइल से पढ़ा गया टेक्स्ट देखने के लिए "देखें" दबाएँ: हेडिंग, अंक और हिंदी टेक्स्ट जाँचें।'],
        ['When the policy changes, press "New version" and upload the new file. When it is processed, the old version stops being used automatically.', 'पॉलिसी बदले तो "नया वर्ज़न" दबाएँ और नई फ़ाइल अपलोड करें। प्रोसेस होते ही पुराना वर्ज़न अपने आप इस्तेमाल होना बंद हो जाएगा।'],
        ['"Edit" changes the name, category, roles and departments without a new upload. "Archive" stops a policy at once (Restore brings it back). "Delete" removes it and its files for good.', '"बदलें" से नाम, श्रेणी, रोल और विभाग बिना नई फ़ाइल के बदलते हैं। "आर्काइव" से पॉलिसी तुरंत रुकती है (वापस लाएँ से फिर चालू)। "हटाएँ" से पॉलिसी और उसकी फ़ाइलें हमेशा के लिए हटती हैं।'],
      ],
      notes: [
        ['Failed: the reason is shown under the status (for example a password-protected PDF). Fix the file and press "Try again" or upload a New version.', 'विफल: कारण स्थिति के नीचे दिखता है (जैसे पासवर्ड वाली PDF)। फ़ाइल ठीक करें और "फिर कोशिश" दबाएँ या नया वर्ज़न अपलोड करें।'],
        ['Each company sees and searches only its own policies.', 'हर कंपनी सिर्फ़ अपनी ही पॉलिसी देखती और खोजती है।'],
        ['A .doc file (old Word): open it in Word and save it as .docx first.', '.doc फ़ाइल (पुराना Word): Word में खोलकर पहले .docx में सेव करें।'],
      ] },
    { id: 'test', n: ['Test Chat', 'टेस्ट चैट'], hr: true,
      path: ['Administration > Policy Management > Test Chat', 'प्रशासन > पॉलिसी मैनेजमेंट > टेस्ट चैट'],
      what: ['A chat for HR to ask questions as an employee, a manager, HR or Admin of a chosen department, before a policy is published. It also searches versions that are processed but not yet published, and shows the match score.', 'HR के लिए चैट, जिसमें पॉलिसी प्रकाशित करने से पहले किसी चुने हुए विभाग के कर्मचारी, मैनेजर, HR या Admin की तरह सवाल पूछ सकते हैं। यह प्रोसेस हो चुके पर अभी अप्रकाशित वर्ज़न भी खोजती है और मिलान स्कोर दिखाती है।'],
      why: ['To be sure the answers are right and that a manager-only policy is not shown to employees, before everybody uses it.', 'ताकि सब लोग इस्तेमाल करें उससे पहले पक्का हो कि जवाब सही हैं और मैनेजर वाली पॉलिसी कर्मचारियों को नहीं दिखती।'],
      who: ['HR and Admin.', 'HR और Admin।'],
      steps: [
        ['Choose "Ask as" (for example Employee) and the department.', '"इस रूप में पूछें" (जैसे कर्मचारी) और विभाग चुनें।'],
        ['Ask a question the policy answers, for example "CL kitni milti hai?". The answer must match the policy and show the source.', 'ऐसा सवाल पूछें जिसका जवाब पॉलिसी में हो, जैसे "CL कितनी मिलती है?"। जवाब पॉलिसी से मिलना चाहिए और स्रोत दिखना चाहिए।'],
        ['Ask a question the policy does not answer. The reply must be "Is vishay par company policy me jaankari uplabdh nahi hai…".', 'ऐसा सवाल पूछें जिसका जवाब पॉलिसी में नहीं है। जवाब "Is vishay par company policy me jaankari uplabdh nahi hai…" आना चाहिए।'],
        ['If all is right, go back to Policies and press Publish on the version that is Ready to test.', 'सब सही हो तो पॉलिसी पर वापस जाएँ और "टेस्ट के लिए तैयार" वर्ज़न पर Publish दबाएँ।'],
      ],
      notes: [['Test chats are not counted in Unanswered Questions or Chat Logs.', 'टेस्ट चैट "बिना जवाब के सवाल" या "चैट लॉग" में नहीं गिनी जातीं।'],
        ['When there is no answer, a red "Why" line under the reply tells the reason (for example the best match is below the needed score, or the answer had a number that is not in the policy). In Chat Logs, open a question to see "Why no answer".', 'जवाब न मिलने पर जवाब के नीचे लाल "कारण" लाइन वजह बताती है (जैसे सबसे अच्छा मिलान ज़रूरी स्कोर से कम है, या जवाब में ऐसा नंबर था जो पॉलिसी में नहीं है)। चैट लॉग में सवाल खोलने पर "जवाब क्यों नहीं मिला" दिखता है।'],
        ['When the app is in Hindi (हि), the HR Assistant answers in Hindi.', 'ऐप हिंदी (हि) में हो तो HR सहायक हिंदी में जवाब देता है।'],
        ['If the Hindi text of an uploaded file looks broken (an old Hindi font), the policy list shows a ⚠ note. PDF pages like that are read again by OCR; for the best result upload the policy from Word (DOCX) or with a Unicode font (Mangal, Nirmala UI).', 'अपलोड की फ़ाइल का हिंदी टेक्स्ट बिगड़ा दिखे (पुराना हिंदी फ़ॉन्ट) तो पॉलिसी सूची में ⚠ नोट दिखता है। ऐसे PDF पेज OCR से दोबारा पढ़े जाते हैं; सबसे अच्छे नतीजे के लिए पॉलिसी Word (DOCX) से या यूनिकोड फ़ॉन्ट (Mangal, Nirmala UI) से अपलोड करें।']] },
    { id: 'unans', n: ['Unanswered Questions', 'बिना जवाब के सवाल'], hr: true,
      path: ['Administration > Policy Management > Unanswered Questions', 'प्रशासन > पॉलिसी मैनेजमेंट > बिना जवाब के सवाल'],
      what: ['The questions employees asked that the policies did not answer: a count per date, and each question with how many times it was asked.', 'कर्मचारियों के वे सवाल जिनका जवाब पॉलिसी में नहीं मिला: हर तारीख़ की गिनती, और हर सवाल कितनी बार पूछा गया।'],
      why: ['It shows what is missing in the policies, so HR can add it.', 'इससे पता चलता है कि पॉलिसी में क्या कमी है, ताकि HR उसे जोड़ सके।'],
      who: ['HR and Admin.', 'HR और Admin।'],
      steps: [
        ['Choose the dates.', 'तारीख़ें चुनें।'],
        ['Read the questions asked most often.', 'सबसे ज़्यादा पूछे गए सवाल पढ़ें।'],
        ['Add the missing point to the policy and upload it as a New version.', 'कमी वाली बात पॉलिसी में जोड़ें और नया वर्ज़न अपलोड करें।'],
        ['Press "Mark resolved". "CSV" downloads the list.', '"हल मार्क करें" दबाएँ। "CSV" से सूची डाउनलोड होती है।'],
      ] },
    { id: 'logs', n: ['Chat Logs', 'चैट लॉग'], hr: true,
      path: ['Administration > Policy Management > Chat Logs', 'प्रशासन > पॉलिसी मैनेजमेंट > चैट लॉग'],
      what: ['Every question asked to HR Assistant: employee, question, answer, source, date and time, and the 👍/👎 feedback with its comment.', 'HR सहायक से पूछा गया हर सवाल: कर्मचारी, सवाल, जवाब, स्रोत, तारीख़ और समय, और 👍/👎 फ़ीडबैक उसकी टिप्पणी के साथ।'],
      why: ['For audit, and to see where the answers can be improved.', 'ऑडिट के लिए, और यह देखने के लिए कि जवाब कहाँ बेहतर हो सकते हैं।'],
      who: ['HR and Admin.', 'HR और Admin।'],
      steps: [
        ['Choose the dates; search by employee or question; filter by answer type or feedback.', 'तारीख़ें चुनें; कर्मचारी या सवाल से खोजें; जवाब के प्रकार या फ़ीडबैक से छाँटें।'],
        ['Click a row to see the full answer and the part of the policy it came from.', 'पूरा जवाब और पॉलिसी का वह हिस्सा देखने के लिए किसी पंक्ति पर क्लिक करें।'],
        ['"CSV" downloads the filtered list.', '"CSV" से छाँटी गई सूची डाउनलोड होती है।'],
      ] },
  ]);

/* HR Assistant for every employee: added to the Dashboard module of the guide, which everyone can open */
(function () {
  var mod = window.GUIDE.filter(function (x) { return x.id === 'dashboard'; })[0];
  if (!mod || mod.entries.some(function (e) { return e.id === 'policysahayak'; })) return;
  mod.entries.push({ id: 'policysahayak', n: ['HR Assistant (policy chat)', 'HR सहायक (पॉलिसी चैट)'],
    path: ['The "HR Assistant" button at the bottom right of every page', 'हर पेज पर नीचे दाईं ओर "HR Assistant" बटन'],
    what: ['A chat that answers your questions about company policy (leave, attendance, travel, conduct …) only from the policies your company uploaded, and questions about using Mirror-HR (for example how to apply for leave) from this User Guide.', 'एक चैट जो कंपनी पॉलिसी (छुट्टी, हाज़िरी, यात्रा, आचरण …) के बारे में आपके सवालों का जवाब सिर्फ़ आपकी कंपनी की अपलोड की गई पॉलिसी से देती है, और Mirror-HR चलाने के सवालों (जैसे छुट्टी के लिए आवेदन कैसे करें) का जवाब इसी यूज़र गाइड से।'],
    why: ['You get the rule at once, in your own language, with the policy name and section, without waiting for HR.', 'HR का इंतज़ार किए बिना आपको तुरंत नियम मिलता है, आपकी अपनी भाषा में, पॉलिसी के नाम और सेक्शन के साथ।'],
    who: ['Every employee (when the HR Assistant module is on for the company).', 'हर कर्मचारी (जब कंपनी के लिए HR सहायक मॉड्यूल चालू हो)।'],
    steps: [
      ['Press "HR Assistant" at the bottom right.', 'नीचे दाईं ओर "HR Assistant" दबाएँ।'],
      ['Type your question in Hindi, Hinglish or English, or press one of the suggested questions.', 'अपना सवाल हिंदी, हिंग्लिश या अंग्रेज़ी में लिखें, या सुझाए गए सवालों में से कोई दबाएँ।'],
      ['Read the answer. Press the source chip under it to see the exact part of the policy (📄) or of the User Guide (📘). For the guide, "Open in User Guide" opens that entry.', 'जवाब पढ़ें। पॉलिसी (📄) या यूज़र गाइड (📘) का ठीक वही हिस्सा देखने के लिए नीचे के स्रोत चिप को दबाएँ। गाइड के लिए "यूज़र गाइड में खोलें" से वही एंट्री खुलती है।'],
      ['Press 👍 or 👎 to tell HR whether it helped.', 'HR को बताने के लिए कि काम का था या नहीं, 👍 या 👎 दबाएँ।'],
      ['"History" shows your earlier chats; "+" starts a new chat.', '"इतिहास" में आपकी पिछली चैट दिखती हैं; "+" से नई चैट शुरू होती है।'],
    ],
    notes: [
      ['If the policy does not say it, the answer is "Is vishay par company policy me jaankari uplabdh nahi hai. Kripya HR vibhag se sampark karein."', 'अगर पॉलिसी में नहीं लिखा, तो जवाब होगा "Is vishay par company policy me jaankari uplabdh nahi hai. Kripya HR vibhag se sampark karein."'],
      ['It does not work out your own salary and does not tell anything about other employees.', 'यह आपकी अपनी सैलरी का हिसाब नहीं लगाता और दूसरे कर्मचारियों के बारे में कुछ नहीं बताता।'],
      ['Answers are based on company policy. The final decision is HR\'s.', 'जवाब कंपनी पॉलिसी पर आधारित हैं। अंतिम निर्णय HR का होगा।'],
      ['At most a few questions per minute can be asked.', 'एक मिनट में कुछ ही सवाल पूछे जा सकते हैं।'],
    ] });
})();
