/* Step-by-step entries for the tabs of: Cockpit, Engagement, My Asset, Assets, Expense, Business data, CRM and ER, Stock ageing, Library, Marketing */
(function () {
  var MN = {
    cockpit: ['Cockpit', 'कॉकपिट'], engage: ['Engagement', 'एंगेजमेंट'], myasset: ['My Asset', 'मेरा एसेट'], assets: ['Assets', 'एसेट'],
    expense: ['Expense', 'एक्सपेंस'], bizdata: ['Business data', 'बिज़नेस डेटा'], crm: ['CRM and ER', 'CRM और ER'], stock: ['Stock ageing', 'स्टॉक एजिंग'],
    library: ['Library', 'लाइब्रेरी'], marketing: ['Marketing', 'मार्केटिंग'], decision: ['My Assignment', 'मेरा असाइनमेंट'],
    training: ['Training', 'ट्रेनिंग'], pms: ['PMS', 'पीएमएस'], analytics: ['Analytics', 'एनालिटिक्स']
  };
  function E(m, id, nEn, nHi, what, why, who, steps, notes) {
    var mod = window.GUIDE.filter(function (x) { return x.id === m; })[0];
    if (!mod || mod.entries.some(function (e) { return e.id === id; })) return;
    var o = { id: id, n: [nEn, nHi], path: [MN[m][0] + ' > ' + nEn, MN[m][1] + ' > ' + nHi], what: what, why: why, who: who, steps: steps };
    if (notes) o.notes = notes;
    mod.entries.push(o);
  }
  var ALL = ['Every employee.', 'हर कर्मचारी।'], HR = ['HR and Admin.', 'HR और Admin।'], MGR = ['Managers, HR and Admin.', 'मैनेजर, HR और Admin।'];

  /* ---------- Cockpit ---------- */
  E('cockpit', 'home', 'Search', 'Search',
    ['Find any employee and see the full picture of that person, then act from the same screen.', 'किसी भी कर्मचारी को खोजें, उसकी पूरी तस्वीर देखें और उसी स्क्रीन से काम करें।'],
    ['So that HR answers a question about a person in one place.', 'ताकि HR एक व्यक्ति के बारे में सवाल का जवाब एक जगह दे सके।'], HR,
    [['Open Cockpit. Type a name, code, designation, email or phone, or use the filters.', 'Cockpit खोलें। नाम, कोड, पद, ईमेल या फ़ोन लिखें, या फ़िल्टर इस्तेमाल करें।'], ['Press Open on the person to see attendance, leave, salary, KPIs and documents together.', 'व्यक्ति के आगे Open दबाएँ। हाज़िरी, छुट्टी, सैलरी, KPI और दस्तावेज़ एक साथ दिखेंगे।'], ['Under “Go to” press a module card to open the list of its sections right here.', '“Go to” के नीचे मॉड्यूल का कार्ड दबाएँ, उसके सेक्शन की लिस्ट यहीं खुलेगी।']]);
  E('cockpit', 'act', 'Actions', 'Actions',
    ['Quick actions for HR on one or many employees, without going to each module.', 'HR के लिए एक या कई कर्मचारियों पर जल्दी के काम, हर मॉड्यूल में गए बिना।'],
    ['To save the clicks of the daily HR work.', 'रोज़ के HR काम के क्लिक बचाने के लिए।'], HR,
    [['Open Cockpit > Actions.', 'Cockpit > Actions खोलें।'], ['Choose the action, then choose the employees (search or use the filters).', 'काम चुनें, फिर कर्मचारी चुनें (खोजें या फ़िल्टर लगाएँ)।'], ['Check the summary and confirm. The change is saved in the audit trail.', 'सार देखकर पुष्टि करें। बदलाव ऑडिट ट्रेल में दर्ज होता है।']]);
  E('cockpit', 'imp', 'Imports', 'Imports',
    ['Upload a file of daily attendance with status, check it, and see the history of earlier uploads.', 'स्टेटस के साथ रोज़ की हाज़िरी की फ़ाइल अपलोड करें, जाँचें, और पिछली अपलोड का इतिहास देखें।'],
    ['So that attendance from a machine or a sheet reaches the system without typing each row.', 'ताकि मशीन या शीट की हाज़िरी हर लाइन टाइप किए बिना सिस्टम में आए।'], HR,
    [['Open Cockpit > Imports. Press Download template and fill it.', 'Cockpit > Imports खोलें। Download template दबाकर उसे भरें।'], ['Press Choose file and pick your file, then press Check file. Errors are shown row by row.', 'Choose file दबाकर फ़ाइल चुनें, फिर Check file दबाएँ। गलतियाँ लाइन के हिसाब से दिखती हैं।'], ['Fix the errors in the file and check again. When it is clean, import it. The table below shows when, which file, who and how many rows.', 'फ़ाइल की गलतियाँ सुधारकर फिर जाँचें। साफ़ होने पर इम्पोर्ट करें। नीचे की टेबल में कब, कौन सी फ़ाइल, किसने और कितनी लाइनें दिखती हैं।'], ['Employee bulk upload is on the same page. Press Download template, and Download master codes to see every code. The columns are: Employee Code, Name, Mobile, Email, DOB, Gender, DOJ, Function Code, Department Code, Branch Code, Division Code, Sub-division Code, Designation Code, Reporting Manager Code, Functional Manager Code, and an optional last column Career Level (L1 to L12). Leave Employee Code empty to get the next code; if you write one it must follow the Code series (numbers only, or letters and numbers like E001) and be new. The six organization codes must belong together. A manager can be a person already in the system or a row of the same file (with an Employee Code). Dates are DD/MM/YYYY. There is no CTC: after the upload (and after + Add employee too) HR gets an Inbox task, “Set the career level and salary structure”, for every employee who has no career level or salary structure yet.', 'कर्मचारी बल्क अपलोड इसी पेज पर है। Download template दबाएँ, और सारे कोड देखने के लिए Download master codes। कॉलम हैं: Employee Code, Name, Mobile, Email, DOB, Gender, DOJ, Function Code, Department Code, Branch Code, Division Code, Sub-division Code, Designation Code, Reporting Manager Code, Functional Manager Code, और आख़िर में वैकल्पिक कॉलम Career Level (L1 से L12)। अगला कोड चाहिए तो Employee Code ख़ाली छोड़ें; लिखें तो वह Code series के अनुसार हो (सिर्फ़ अंक, या अक्षर और अंक जैसे E001) और नया हो। छह ऑर्गनाइज़ेशन कोड आपस में जुड़ते हों। मैनेजर पहले से सिस्टम में कोई व्यक्ति हो सकता है या इसी फ़ाइल की कोई पंक्ति (Employee Code के साथ)। तारीख़ें DD/MM/YYYY। CTC नहीं है: अपलोड के बाद (और + Add employee से जोड़ने पर भी) जिस किसी कर्मचारी का करियर लेवल या सैलरी स्ट्रक्चर अभी तय नहीं है, उसके लिए HR के Inbox में “Set the career level and salary structure” का टास्क आता है।'],
     ['Import mode. Above the template buttons choose one of three: Add new only (the default: an Employee Code that already exists is an error and nothing changes), Update existing only (matched by Employee Code; a code that is not found is an error), or Add new and update existing. In update mode a blank cell means no change; write - (a dash) to clear the date of birth or a manager. Name, mobile, email, DOB, gender, DOJ, the six organization codes, the two manager codes and the Career Level can be changed. A changed designation or career level is written in the level history, and the salary comes from the new salary structure. The salary of an employee is not changed here: a salary revision goes through the approval workflow.', 'इम्पोर्ट मोड। टेम्पलेट बटनों के ऊपर तीन में से एक चुनें: Add new only (डिफ़ॉल्ट: जो Employee Code पहले से है वह गलती है और कुछ नहीं बदलता), Update existing only (Employee Code से मिलान; जो कोड न मिले वह गलती), या Add new and update existing। अपडेट मोड में ख़ाली सेल का मतलब कोई बदलाव नहीं; जन्मतिथि या मैनेजर हटाने के लिए - (डैश) लिखें। नाम, मोबाइल, ईमेल, DOB, लिंग, DOJ, छह ऑर्गनाइज़ेशन कोड, दोनों मैनेजर कोड और Career Level बदले जा सकते हैं। पद या करियर लेवल बदलने पर लेवल इतिहास में लिखा जाता है, और सैलरी नए सैलरी स्ट्रक्चर से आती है। कर्मचारी की सैलरी यहाँ से नहीं बदलती: सैलरी रिवीज़न अप्रूवल वर्कफ़्लो से जाता है।'],
     ['Check file shows every row as New, Will change (with before → after), No change or Error. Lines with an error are not applied; the correct lines are. Before an update press Download backup of old values: it is a file in the same format, so loading it in Update existing only mode puts the old values back. The history table shows how many employees were added and how many were updated.', 'Check file हर पंक्ति को New, Will change (पहले → बाद में के साथ), No change या Error दिखाता है। गलती वाली पंक्तियाँ लागू नहीं होतीं; सही लागू होती हैं। अपडेट से पहले Download backup of old values दबाएँ: यह उसी फ़ॉर्मेट की फ़ाइल है, इसलिए इसे Update existing only मोड में लोड करने से पुरानी वैल्यू वापस आ जाती हैं। इतिहास टेबल में दिखता है कितने कर्मचारी जुड़े और कितने बदले।'],]);
  E('cockpit', 'req', 'Requests', 'Requests',
    ['All the change requests that employees sent for their own details, with what changes and the proof.', 'कर्मचारियों की अपनी जानकारी बदलने की सारी माँगें, क्या बदलना है और सबूत के साथ।'],
    ['So that HR decides every change in one list.', 'ताकि HR हर बदलाव का फ़ैसला एक लिस्ट से करे।'], HR,
    [['Open Cockpit > Requests.', 'Cockpit > Requests खोलें।'], ['Open a row to see the old value, the new value and the proof document.', 'लाइन खोलकर पुराना मान, नया मान और सबूत का दस्तावेज़ देखें।'], ['Approve, or reject with a reason. The employee gets the answer in the Inbox.', 'मंज़ूर करें, या कारण लिखकर नामंज़ूर करें। कर्मचारी को जवाब Inbox में मिलता है।']]);
  E('cockpit', 'ins', 'Insights', 'Insights',
    ['What is pending and where it is stuck: the pending board, history, HR analytics and reports.', 'क्या बाक़ी है और कहाँ अटका है: पेंडिंग बोर्ड, इतिहास, HR एनालिटिक्स और रिपोर्ट।'],
    ['So that HR sees the delay and follows up on the right person.', 'ताकि HR को देरी दिखे और सही व्यक्ति से फ़ॉलो-अप हो।'], HR,
    [['Open Cockpit > Insights.', 'Cockpit > Insights खोलें।'], ['Choose Pending board for what is open, with the stage, who it is with and the days.', 'जो खुला है उसके लिए Pending board चुनें: स्टेज, किसके पास है और कितने दिन।'], ['Choose History, HR analytics or Reports for the past and the totals.', 'पिछला और कुल देखने के लिए History, HR analytics या Reports चुनें।']]);

  /* ---------- Engagement ---------- */
  E('engage', 'board', 'Notice board', 'नोटिस बोर्ड',
    ['Notices of the company for everyone, with a record of who has read each.', 'सबके लिए कंपनी के नोटिस, और हर नोटिस किसने पढ़ा इसका रिकॉर्ड।'],
    ['So that important news reaches everybody and you can prove it.', 'ताकि ज़रूरी ख़बर सब तक पहुँचे और आप इसका सबूत रख सकें।'], ['Everyone reads. HR and Admin write.', 'सब पढ़ते हैं। HR और Admin लिखते हैं।'],
    [['To read: open Engagement > Notice board and press “I have read this”.', 'पढ़ने के लिए: Engagement > Notice board खोलें और “I have read this” दबाएँ।'], ['To write (HR): press + New notice, write it, choose who gets it and publish.', 'लिखने के लिए (HR): + New notice दबाएँ, लिखें, किसे जाएगा चुनें और प्रकाशित करें।'], ['Press Who has read to see the list, or Withdraw to take a notice back.', 'लिस्ट देखने के लिए Who has read दबाएँ, या नोटिस वापस लेने के लिए Withdraw।']]);
  E('engage', 'polls', 'Polls', 'पोल',
    ['A short question to employees, with the result shown after they vote.', 'कर्मचारियों से एक छोटा सवाल, वोट के बाद नतीजा दिखता है।'],
    ['To know the opinion of the team quickly.', 'टीम की राय जल्दी जानने के लिए।'], ['Everyone votes. HR makes and closes polls.', 'सब वोट देते हैं। HR पोल बनाता और बंद करता है।'],
    [['To vote: open Engagement > Polls, choose your answer and press Submit my vote.', 'वोट देने के लिए: Engagement > Polls खोलें, जवाब चुनें और Submit my vote दबाएँ।'], ['To make a poll (HR): press + New poll, write the question and the choices, and publish.', 'पोल बनाने के लिए (HR): + New poll दबाएँ, सवाल और विकल्प लिखें और प्रकाशित करें।'], ['Press Close the poll when the time is over.', 'समय पूरा होने पर Close the poll दबाएँ।']]);
  E('engage', 'letters', 'Letters and orders', 'पत्र और आदेश',
    ['Official letters and office orders made from the letterhead, sent to employees, and confirmed by them.', 'लेटरहेड से बने आधिकारिक पत्र और ऑफ़िस ऑर्डर, कर्मचारियों को भेजे जाते हैं और वे पुष्टि करते हैं।'],
    ['So that every letter has a number, a date and a confirmation.', 'ताकि हर पत्र का नंबर, तारीख़ और पुष्टि हो।'], HR,
    [['Open Engagement > Letters and orders. Press Letterhead once to set the company heading.', 'Engagement > Letters and orders खोलें। कंपनी का हेडिंग तय करने के लिए एक बार Letterhead दबाएँ।'], ['Press + New letter, choose the type and the employees, write it and save.', '+ New letter दबाएँ, प्रकार और कर्मचारी चुनें, लिखें और सेव करें।'], ['Press View or PDF to see or download it. Press Cancel to cancel it. The employee presses Confirm.', 'देखने या डाउनलोड के लिए View या PDF दबाएँ। रद्द करने के लिए Cancel। कर्मचारी Confirm दबाता है।']]);
  E('engage', 'more', 'Surveys and recognition', 'सर्वे और सराहना',
    ['A page that leads to the surveys and the recognition of good work.', 'सर्वे और अच्छे काम की सराहना तक ले जाने वाला पेज।'],
    ['So that feedback and appreciation have a place in the same module.', 'ताकि फ़ीडबैक और सराहना एक ही मॉड्यूल में रहें।'], ALL,
    [['Open Engagement > Surveys and recognition.', 'Engagement > Surveys and recognition खोलें।'], ['Press the card of the survey or the recognition to open it.', 'सर्वे या सराहना के कार्ड को दबाकर खोलें।']]);

  /* ---------- My Asset ---------- */
  E('myasset', 'mine', 'My assets', 'मेरे एसेट',
    ['The assets the company has given you. You confirm when you receive one and hand it back when you leave.', 'कंपनी ने आपको जो एसेट दिए हैं। मिलने पर आप पुष्टि करते हैं और छोड़ते समय लौटाते हैं।'],
    ['So that it is clear who holds what.', 'ताकि साफ़ रहे कि किसके पास क्या है।'], ALL,
    [['Open My Asset. The table shows the asset, type, issue date and your acknowledgement.', 'My Asset खोलें। टेबल में एसेट, प्रकार, दिए जाने की तारीख़ और आपकी पुष्टि दिखती है।'], ['When HR gives you an asset, press Acknowledge to confirm that you received it.', 'HR आपको एसेट दे तो मिलने की पुष्टि के लिए Acknowledge दबाएँ।'], ['Press Return when you hand it back. History shows the earlier assets.', 'लौटाते समय Return दबाएँ। History में पुराने एसेट दिखते हैं।']]);
  E('myasset', 'req', 'My requests', 'मेरी माँगें',
    ['The requests you made for a new asset, with the status.', 'नए एसेट के लिए आपकी माँगें, स्थिति के साथ।'],
    ['So that you know whether your request is approved.', 'ताकि आपको पता रहे कि माँग मंज़ूर हुई या नहीं।'], ALL,
    [['Press + Request an asset. Choose what you need, write the reason and the date.', '+ Request an asset दबाएँ। क्या चाहिए चुनें, कारण और तारीख़ लिखें।'], ['Send it. It goes through the approval chain of the workflow.', 'भेजें। यह वर्कफ़्लो की मंज़ूरी की कड़ी से जाती है।'], ['See the status in My Asset > My requests.', 'स्थिति My Asset > My requests में देखें।']]);

  /* ---------- Expense ---------- */
  E('expense', 'adv', 'My advances', 'मेरे एडवांस',
    ['An advance for company expenses that you settle later with bills.', 'कंपनी के ख़र्च के लिए एडवांस जो आप बाद में बिलों से सेटल करते हैं।'],
    ['So that you do not spend your own money for company work, and every rupee is accounted for.', 'ताकि कंपनी के काम के लिए अपना पैसा न लगे और हर रुपये का हिसाब रहे।'], ALL,
    [['Open Expense > My advances and press + Ask for an advance.', 'Expense > My advances खोलें और + Ask for an advance दबाएँ।'], ['Write the amount, the purpose and the date by which you will settle. Send it.', 'रक़म, मक़सद और सेटल करने की तारीख़ लिखें। भेजें।'], ['After it is paid, add your bills in a claim report before the settle-by date.', 'पैसा मिलने के बाद सेटल करने की तारीख़ से पहले क्लेम रिपोर्ट में अपने बिल जोड़ें।']]);
  E('expense', 'trip', 'Travel', 'यात्रा',
    ['A travel request with the place, the reason, the dates and the estimate, as per the travel policy.', 'यात्रा की माँग: जगह, कारण, तारीख़ें और अनुमान, यात्रा नीति के अनुसार।'],
    ['So that a trip is approved before it starts and costs are known.', 'ताकि यात्रा से पहले मंज़ूरी हो और ख़र्च पता रहे।'], ALL,
    [['Press Read the travel policy first. Then press + New travel request.', 'पहले Read the travel policy दबाएँ। फिर + New travel request।'], ['Write where, why, when and the estimate. Send it for approval.', 'कहाँ, क्यों, कब और अनुमान लिखें। मंज़ूरी के लिए भेजें।'], ['After the trip, open it (Open) and give the trip report. Claim your bills in Reports and claims.', 'यात्रा के बाद उसे Open करके यात्रा रिपोर्ट दें। अपने बिल Reports and claims में क्लेम करें।']]);
  E('expense', 'rep', 'Reports and claims', 'रिपोर्ट और क्लेम',
    ['A claim report with all your bills, to get back what you spent yourself or to settle an advance.', 'आपके सारे बिलों के साथ क्लेम रिपोर्ट, अपना लगाया पैसा वापस पाने या एडवांस सेटल करने के लिए।'],
    ['So that every claim is backed by a bill and approved.', 'ताकि हर क्लेम बिल के साथ हो और मंज़ूर हो।'], ALL,
    [['Press + New claim report. Choose what it is for (a trip, an advance or other).', '+ New claim report दबाएँ। चुनें कि यह किसके लिए है (यात्रा, एडवांस या अन्य)।'], ['Add each bill with the amount and the photo of the bill. The total is worked out.', 'हर बिल रक़म और बिल की फ़ोटो के साथ जोड़ें। कुल अपने आप बनता है।'], ['Send it. After approval the Accounts desk pays you.', 'भेजें। मंज़ूरी के बाद Accounts desk आपको भुगतान करता है।']]);
  E('expense', 'appr', 'Approvals', 'मंज़ूरियाँ',
    ['The advances, trips and claims that wait for your decision.', 'आपके फ़ैसले का इंतज़ार कर रहे एडवांस, यात्राएँ और क्लेम।'],
    ['So that approvers decide in one list.', 'ताकि मंज़ूर करने वाला एक लिस्ट से फ़ैसला करे।'], MGR,
    [['Open Expense > Approvals.', 'Expense > Approvals खोलें।'], ['Open an item and check the amount, the bills and the policy.', 'आइटम खोलकर रक़म, बिल और नीति जाँचें।'], ['Approve, or reject with the reason.', 'मंज़ूर करें, या कारण लिखकर नामंज़ूर करें।']]);
  E('expense', 'acc', 'Accounts desk', 'Accounts desk',
    ['The place where the accounts team pays the approved advances and claims.', 'वह जगह जहाँ अकाउंट्स टीम मंज़ूर एडवांस और क्लेम का भुगतान करती है।'],
    ['So that payment is made only after approval and is recorded.', 'ताकि भुगतान सिर्फ़ मंज़ूरी के बाद हो और दर्ज रहे।'], ['The accounts team, HR and Admin.', 'अकाउंट्स टीम, HR और Admin।'],
    [['Open Expense > Accounts desk. The number in brackets is the work waiting.', 'Expense > Accounts desk खोलें। कोष्ठक का नंबर बाक़ी काम है।'], ['For an advance press Disburse after you give the money. For a claim press Pay.', 'एडवांस में पैसा देने के बाद Disburse दबाएँ। क्लेम में Pay दबाएँ।'], ['Press Download to get the list for the bank.', 'बैंक के लिए लिस्ट पाने को Download दबाएँ।']]);
  E('expense', 'all', 'Register', 'रजिस्टर',
    ['The full list of all advances and claims of the company with their status.', 'कंपनी के सारे एडवांस और क्लेम की पूरी लिस्ट, स्थिति के साथ।'],
    ['So that HR and accounts see everything and can audit.', 'ताकि HR और अकाउंट्स सब देख सकें और ऑडिट कर सकें।'], HR,
    [['Open Expense > Register.', 'Expense > Register खोलें।'], ['Press Open on a row to see its bills and its history.', 'लाइन पर Open दबाकर उसके बिल और इतिहास देखें।'], ['Press Download for the Excel file.', 'Excel फ़ाइल के लिए Download दबाएँ।']]);

  /* ---------- Business data ---------- */
  var BD = function (id, nEn, nHi, whatEn, whatHi) {
    E('bizdata', id, nEn, nHi, [whatEn, whatHi],
      ['So that the automatic KPIs are calculated from real figures.', 'ताकि ऑटोमैटिक KPI असली आँकड़ों से बनें।'], HR,
      [['Open Business data > ' + nEn + '.', 'Business data > ' + nHi + ' खोलें।'], ['Press + Add and fill the month, the amount or count and the person or division.', '+ Add दबाएँ और महीना, रक़म या गिनती और व्यक्ति या डिवीज़न भरें।'], ['To correct a wrong row press Delete and add it again. Only the data of the open month can change.', 'ग़लत लाइन सुधारने के लिए Delete दबाकर फिर जोड़ें। सिर्फ़ खुले महीने का डेटा बदलता है।']]);
  };
  BD('sales', 'Sales', 'सेल्स', 'Monthly sales figures by division. KPIs about sales are worked out from them.', 'डिवीज़न के हिसाब से महीने की बिक्री के आँकड़े। बिक्री के KPI इन्हीं से बनते हैं।');
  BD('store', 'Store', 'स्टोर', 'Store records, such as stock figures and store checks, by person and month.', 'स्टोर के रिकॉर्ड, जैसे स्टॉक के आँकड़े और स्टोर की जाँच, व्यक्ति और महीने के हिसाब से।');
  BD('hr', 'People & HR', 'लोग और HR', 'Records about people, such as hiring and attrition numbers, by month.', 'लोगों के रिकॉर्ड, जैसे भर्ती और अट्रिशन की संख्या, महीने के हिसाब से।');
  BD('training', 'Training', 'ट्रेनिंग', 'Training figures that the training KPIs are calculated from.', 'ट्रेनिंग के आँकड़े जिनसे ट्रेनिंग के KPI बनते हैं।');
  BD('marketing', 'Marketing', 'मार्केटिंग', 'Marketing figures entered by hand that the marketing KPIs use.', 'हाथ से भरे मार्केटिंग के आँकड़े जिन्हें मार्केटिंग के KPI इस्तेमाल करते हैं।');
  BD('ops', 'Operations', 'ऑपरेशंस', 'Operations figures, such as store and service records, by month.', 'ऑपरेशंस के आँकड़े, जैसे स्टोर और सर्विस के रिकॉर्ड, महीने के हिसाब से।');

  /* ---------- CRM and ER ---------- */
  E('crm', 'list', 'Feedback', 'फ़ीडबैक',
    ['The feedback forms filled for customers, with the bill number, the division, who filled it and the score.', 'ग्राहकों के लिए भरे फ़ीडबैक फ़ॉर्म: बिल नंबर, डिवीज़न, किसने भरा और स्कोर।'],
    ['So that customer feedback is counted in the KPIs of the staff.', 'ताकि ग्राहक का फ़ीडबैक स्टाफ़ के KPI में गिना जाए।'], MGR,
    [['Open CRM and ER > Feedback.', 'CRM और ER > Feedback खोलें।'], ['Use the filters for the date and the division. Each row shows the overall result and score.', 'तारीख़ और डिवीज़न के फ़िल्टर लगाएँ। हर लाइन में कुल नतीजा और स्कोर दिखता है।'], ['Open a row to see the answers of the customer.', 'ग्राहक के जवाब देखने के लिए लाइन खोलें।']]);
  E('crm', 'dup', 'Duplicate entries', 'डुप्लिकेट एंट्री',
    ['Bills for which feedback was filled more than once, so that nobody games the target.', 'वे बिल जिन पर फ़ीडबैक एक से ज़्यादा बार भरा गया, ताकि कोई टारगेट में गड़बड़ न करे।'],
    ['So that only one feedback per bill counts.', 'ताकि हर बिल पर सिर्फ़ एक फ़ीडबैक गिना जाए।'], MGR,
    [['Open CRM and ER > Duplicate entries.', 'CRM और ER > Duplicate entries खोलें।'], ['Each row shows the bill, who filled the repeat and the first entry.', 'हर लाइन में बिल, दोबारा किसने भरा और पहली एंट्री दिखती है।'], ['Talk to the person. Only the first entry is counted.', 'व्यक्ति से बात करें। सिर्फ़ पहली एंट्री गिनी जाती है।']]);
  E('crm', 'tgt', 'Daily target', 'डेली टारगेट',
    ['How many feedback forms each employee must fill each day, and how many days the target was met.', 'हर कर्मचारी को रोज़ कितने फ़ीडबैक फ़ॉर्म भरने हैं और कितने दिन टारगेट पूरा हुआ।'],
    ['So that the month score of the target is clear.', 'ताकि टारगेट का महीने का स्कोर साफ़ हो।'], MGR,
    [['Open CRM and ER > Daily target.', 'CRM और ER > Daily target खोलें।'], ['The table shows forms filled, applicable days, days at target, shortfall days and the month score.', 'टेबल में भरे फ़ॉर्म, लागू दिन, टारगेट वाले दिन, कमी वाले दिन और महीने का स्कोर दिखता है।'], ['The target number is set in Setup.', 'टारगेट का नंबर Setup में तय होता है।']]);
  E('crm', 'setup', 'Setup', 'सेटअप',
    ['The questions of the feedback form and their answer types.', 'फ़ीडबैक फ़ॉर्म के सवाल और उनके जवाब के प्रकार।'],
    ['So that HR decides what the customer is asked.', 'ताकि HR तय करे कि ग्राहक से क्या पूछा जाए।'], HR,
    [['Open CRM and ER > Setup and press + Add.', 'CRM और ER > Setup खोलें और + Add दबाएँ।'], ['Write the question and choose the answer type.', 'सवाल लिखें और जवाब का प्रकार चुनें।'], ['Press Inactivate to stop a question. Old answers stay.', 'सवाल बंद करने के लिए Inactivate दबाएँ। पुराने जवाब बने रहते हैं।']]);
  E('crm', 'cmp', 'Complaints', 'शिकायतें',
    ['Complaints against a manager, registered and decided with a result.', 'किसी मैनेजर के ख़िलाफ़ शिकायतें, दर्ज होती हैं और नतीजे के साथ फ़ैसला होता है।'],
    ['So that a complaint is recorded, heard and closed properly.', 'ताकि शिकायत ठीक से दर्ज हो, सुनी जाए और बंद हो।'], HR,
    [['Press + Register complaint. Choose the manager, write who complained and what happened.', '+ Register complaint दबाएँ। मैनेजर चुनें, लिखें कि किसने शिकायत की और क्या हुआ।'], ['Save. It shows in the list with the status.', 'सेव करें। यह स्थिति के साथ लिस्ट में दिखती है।'], ['Press Decide, choose the result and write the decision.', 'Decide दबाएँ, नतीजा चुनें और फ़ैसला लिखें।']]);
  E('crm', 'form', 'Feedback form', 'फ़ीडबैक फ़ॉर्म',
    ['The form that staff fill with the customer after a bill, as set in Setup.', 'बिल के बाद ग्राहक के साथ स्टाफ़ जो फ़ॉर्म भरता है, जैसा Setup में तय है।'],
    ['So that feedback is collected in the same way every time.', 'ताकि हर बार फ़ीडबैक एक ही तरीक़े से लिया जाए।'], ALL,
    [['Open CRM and ER > Feedback form.', 'CRM और ER > Feedback form खोलें।'], ['Write the bill number and the mobile number of the customer, then fill the answers.', 'बिल नंबर और ग्राहक का मोबाइल नंबर लिखें, फिर जवाब भरें।'], ['Press Save. The same bill cannot be filled twice.', 'Save दबाएँ। एक ही बिल दो बार नहीं भरा जा सकता।']]);

  /* ---------- Stock ageing ---------- */
  E('stock', 'tasks', 'Review tasks', 'रिव्यू टास्क',
    ['The month-end review of the stock of the employees who have the stock KPI, with the reviewer and the score.', 'स्टॉक KPI वाले कर्मचारियों के स्टॉक का महीने के अंत का रिव्यू, रिव्यूअर और स्कोर के साथ।'],
    ['So that a second person checks the stock every month.', 'ताकि हर महीने स्टॉक की जाँच दूसरा व्यक्ति करे।'], MGR,
    [['Open Stock ageing > Review tasks.', 'Stock ageing > Review tasks खोलें।'], ['Each row shows the employee, the reviewer, the status and the review score.', 'हर लाइन में कर्मचारी, रिव्यूअर, स्थिति और रिव्यू स्कोर दिखता है।'], ['The reviewer opens the task, checks the stock and gives the score.', 'रिव्यूअर टास्क खोलकर स्टॉक जाँचता है और स्कोर देता है।']]);
  E('stock', 'map', 'Reviewer mapping', 'रिव्यूअर मैपिंग',
    ['Who reviews whose stock.', 'किसका स्टॉक कौन रिव्यू करेगा।'],
    ['So that every employee has a reviewer.', 'ताकि हर कर्मचारी का एक रिव्यूअर हो।'], HR,
    [['Open Stock ageing > Reviewer mapping.', 'Stock ageing > Reviewer mapping खोलें।'], ['Press Choose reviewers.', 'Choose reviewers दबाएँ।'], ['Pick the reviewer of each employee and save.', 'हर कर्मचारी का रिव्यूअर चुनें और सेव करें।']]);
  E('stock', 'set', 'Weights and actions', 'वेट और ऐक्शन',
    ['The weight of each age group of stock in the score, and the action to take for old stock.', 'स्कोर में स्टॉक की हर उम्र के समूह का वज़न, और पुराने स्टॉक पर क्या करना है।'],
    ['So that old stock counts more against the score.', 'ताकि पुराना स्टॉक स्कोर में ज़्यादा असर डाले।'], HR,
    [['Open Stock ageing > Weights and actions.', 'Stock ageing > Weights and actions खोलें।'], ['Change the weights and the actions.', 'वेट और ऐक्शन बदलें।'], ['Press Save.', 'Save दबाएँ।']]);

  /* ---------- Assets ---------- */
  E('assets', 'inv', 'Inventory', 'इन्वेंटरी',
    ['The list of all assets the company owns, with the tag, type, serial number, status and who holds it.', 'कंपनी के सारे एसेट की लिस्ट: टैग, प्रकार, सीरियल नंबर, स्थिति और किसके पास है।'],
    ['So that no asset is lost.', 'ताकि कोई एसेट खोए नहीं।'], HR,
    [['Open Assets > Inventory and press + Add to inventory.', 'Assets > Inventory खोलें और + Add to inventory दबाएँ।'], ['Fill the name, the type and sub-type, the serial number and save. A tag number is made.', 'नाम, प्रकार और उप-प्रकार, सीरियल नंबर भरकर सेव करें। टैग नंबर बनता है।'], ['Press Issue on a row to give it to an employee. CSV downloads the list. History shows the past.', 'कर्मचारी को देने के लिए लाइन पर Issue दबाएँ। CSV से लिस्ट डाउनलोड होती है। History में पिछला दिखता है।']]);
  E('assets', 'iss', 'Employee assets', 'कर्मचारी एसेट',
    ['What each employee holds and whether they acknowledged it.', 'हर कर्मचारी के पास क्या है और उसने पुष्टि की या नहीं।'], ['So that HR knows who holds what.', 'ताकि HR को पता रहे किसके पास क्या है।'], HR,
    [['Open Assets > Employee assets.', 'Assets > Employee assets खोलें।'], ['Press Transfer to move an asset to another employee.', 'एसेट दूसरे कर्मचारी को देने के लिए Transfer दबाएँ।'], ['Press Receive back when it returns.', 'वापस आने पर Receive back दबाएँ।']]);
  E('assets', 'req', 'Requests', 'माँगें',
    ['The asset requests of employees, with the reason and the date needed.', 'कर्मचारियों की एसेट की माँगें, कारण और ज़रूरत की तारीख़ के साथ।'], ['So that HR decides and gives the asset in one flow.', 'ताकि HR एक ही क्रम में फ़ैसला करे और एसेट दे।'], HR,
    [['Open Assets > Requests.', 'Assets > Requests खोलें।'], ['Open a request and approve it or reject it with a reason.', 'माँग खोलकर मंज़ूर करें, या कारण लिखकर नामंज़ूर करें।'], ['For an approved one press Issue and choose the asset from the inventory.', 'मंज़ूर माँग पर Issue दबाएँ और इन्वेंटरी से एसेट चुनें।']]);
  E('assets', 'ret', 'Exit handover', 'एग्ज़िट हैंडओवर',
    ['The assets that an employee who is leaving must give back, with the last working day.', 'जाने वाले कर्मचारी को लौटाने वाले एसेट, आख़िरी कार्यदिवस के साथ।'], ['So that nothing leaves with the person.', 'ताकि कुछ भी व्यक्ति के साथ न जाए।'], HR,
    [['Open Assets > Exit handover.', 'Assets > Exit handover खोलें।'], ['Press Remind to send a reminder to the employee.', 'कर्मचारी को याद दिलाने के लिए Remind दबाएँ।'], ['Press Receive back for each asset that returns. The settlement waits until all are back.', 'हर लौटे एसेट पर Receive back दबाएँ। सभी आने तक सेटलमेंट रुका रहता है।']]);
  E('assets', 'mst', 'Types', 'प्रकार',
    ['The types and sub-types of assets.', 'एसेट के प्रकार और उप-प्रकार।'], ['So that assets are grouped in the same way.', 'ताकि एसेट एक ही तरह से बँटें।'], HR,
    [['Open Assets > Types.', 'Assets > Types खोलें।'], ['Press + Type, then + Sub-type under it.', '+ Type दबाएँ, फिर उसके नीचे + Sub-type।'], ['Save. They appear when you add an asset.', 'सेव करें। एसेट जोड़ते समय ये दिखते हैं।']]);
  E('assets', 'msv', 'Maintenance', 'मेंटेनेंस',
    ['How often each type of system must be serviced, and when the next service is due.', 'हर प्रकार के सिस्टम की सर्विस कितने अंतराल पर होनी है और अगली कब है।'], ['So that servicing is not forgotten.', 'ताकि सर्विस न भूली जाए।'], HR,
    [['Open Assets > Maintenance.', 'Assets > Maintenance खोलें।'], ['Press Edit and set the Interval for the type.', 'Edit दबाएँ और प्रकार का Interval तय करें।'], ['The list shows the last service, the next due date and the status.', 'लिस्ट में पिछली सर्विस, अगली तारीख़ और स्थिति दिखती है।']]);

  /* ---------- My Assignment: the work screens ---------- */
  E('decision', 'elec', 'Electrical maintenance', 'इलेक्ट्रिकल मेंटेनेंस',
    ['A record of the electrical check of a store area, what was put right, the vendor and the work done, with a photo.', 'स्टोर के किसी हिस्से की बिजली की जाँच का रिकॉर्ड: क्या ठीक किया, वेंडर और काम, फ़ोटो के साथ।'],
    ['So that electrical faults are fixed and shown with proof.', 'ताकि बिजली की ख़राबियाँ ठीक हों और सबूत के साथ दिखें।'], ['The person who has the KPI, managers and HR.', 'जिसके पास KPI है, मैनेजर और HR।'],
    [['Open My Assignment > Electrical maintenance.', 'My Assignment > Electrical maintenance खोलें।'], ['Add the date, the store and area, what you checked and what you put right, with a photo.', 'तारीख़, स्टोर और हिस्सा, क्या जाँचा और क्या ठीक किया, फ़ोटो के साथ जोड़ें।'], ['The manager sees it in the list and gives the status.', 'मैनेजर इसे लिस्ट में देखकर स्थिति देता है।']]);
  E('decision', 'smnt', 'System maintenance', 'सिस्टम मेंटेनेंस',
    ['The service record of systems (such as computers or machines): when it was last done, when it is due and who did it.', 'सिस्टम (जैसे कंप्यूटर या मशीन) का सर्विस रिकॉर्ड: पिछली बार कब, अगली कब और किसने की।'],
    ['So that systems are serviced on time.', 'ताकि सिस्टम की सर्विस समय पर हो।'], ['The person who has the KPI and HR.', 'जिसके पास KPI है और HR।'],
    [['Open My Assignment > System maintenance.', 'My Assignment > System maintenance खोलें।'], ['Find the system. The status shows due or overdue.', 'सिस्टम खोजें। स्थिति में due या overdue दिखता है।'], ['After servicing, record it with the date. The next due date moves ahead.', 'सर्विस के बाद तारीख़ के साथ दर्ज करें। अगली तारीख़ आगे बढ़ जाती है।']]);
  E('decision', 'tinsp', 'Barcode/Tag inspection', 'बारकोड/टैग इंस्पेक्शन',
    ['A weekly check of tags and barcodes in a section: how many were checked and how many were missing, wrong, unreadable or double, and how many were put right.', 'किसी सेक्शन में टैग और बारकोड की साप्ताहिक जाँच: कितने जाँचे और कितने गुम, ग़लत, पढ़ने में न आने वाले या दोहरे थे, कितने ठीक किए।'],
    ['So that stock tags stay correct.', 'ताकि स्टॉक के टैग सही रहें।'], ['The person who has the KPI and managers.', 'जिसके पास KPI है और मैनेजर।'],
    [['Open My Assignment > Barcode/Tag inspection.', 'My Assignment > Barcode/Tag inspection खोलें।'], ['Add the week, the section and the counts of checked, missing, wrong, unreadable and double.', 'सप्ताह, सेक्शन और जाँचे, गुम, ग़लत, अपठनीय और दोहरे की गिनती जोड़ें।'], ['Write how many you put right and how many are left.', 'कितने ठीक किए और कितने बाक़ी हैं, लिखें।']]);
  E('decision', 'evid', 'Indexing and VM photos', 'इंडेक्सिंग और VM फ़ोटो',
    ['Photos of indexing and visual merchandising that prove the work, with the KPI, the section and the date.', 'इंडेक्सिंग और विज़ुअल मर्चेंडाइज़िंग की फ़ोटो जो काम का सबूत हैं, KPI, सेक्शन और तारीख़ के साथ।'],
    ['So that the work is shown, not only told.', 'ताकि काम दिखाया जाए, सिर्फ़ बताया नहीं।'], ['The person who has the KPI and managers.', 'जिसके पास KPI है और मैनेजर।'],
    [['Open My Assignment > Indexing and VM photos.', 'My Assignment > Indexing and VM photos खोलें।'], ['Add the photo, choose the KPI and the section.', 'फ़ोटो जोड़ें, KPI और सेक्शन चुनें।'], ['The manager checks the photo and gives the status.', 'मैनेजर फ़ोटो जाँचकर स्थिति देता है।']]);
  E('decision', 'mon', 'CCTV monitoring', 'CCTV मॉनिटरिंग',
    ['Feedback from watching CCTV, with the category, the division or the person, the remark and the proof.', 'CCTV देखकर मिला फ़ीडबैक: श्रेणी, डिवीज़न या व्यक्ति, टिप्पणी और सबूत।'],
    ['So that what the camera shows reaches the right KPI and person.', 'ताकि कैमरे की बात सही KPI और व्यक्ति तक पहुँचे।'], ['The person who watches the CCTV, managers and HR.', 'CCTV देखने वाला, मैनेजर और HR।'],
    [['Open My Assignment > CCTV monitoring.', 'My Assignment > CCTV monitoring खोलें।'], ['Add a note: the date, the category and who or which division it is about, with a remark and a proof.', 'नोट जोड़ें: तारीख़, श्रेणी और किसके या किस डिवीज़न के बारे में, टिप्पणी और सबूत के साथ।'], ['Each category goes to a KPI, shown in the table.', 'हर श्रेणी एक KPI में जाती है, टेबल में दिखता है।']]);
  E('decision', 'alt', 'Alteration jobs', 'अल्टरेशन जॉब',
    ['Alteration jobs of customers: the work, the customer, the salesman, the tailor and the promised date, with the status.', 'ग्राहकों के अल्टरेशन जॉब: काम, ग्राहक, सेल्समैन, टेलर और वादे की तारीख़, स्थिति के साथ।'],
    ['So that the promise to the customer is kept.', 'ताकि ग्राहक से किया वादा निभे।'], ['Salesmen, tailors and managers.', 'सेल्समैन, टेलर और मैनेजर।'],
    [['Open My Assignment > Alteration jobs.', 'My Assignment > Alteration jobs खोलें।'], ['The salesman makes the job with the customer and the promised date.', 'सेल्समैन ग्राहक और वादे की तारीख़ के साथ जॉब बनाता है।'], ['The tailor does the work and fills the day-end entry. The status moves to done.', 'टेलर काम करके दिन-अंत की एंट्री भरता है। स्थिति done हो जाती है।']]);
  E('decision', 'stk', 'Stock audit', 'स्टॉक ऑडिट',
    ['A count of stock by a person who is given the items, and the correct count after the check.', 'जिसे आइटम दिए जाते हैं वह स्टॉक गिनता है, और जाँच के बाद सही गिनती दर्ज होती है।'],
    ['So that stock differences are found early.', 'ताकि स्टॉक का फ़र्क जल्दी पकड़ा जाए।'], ['The person who counts and the manager who gives the audit.', 'गिनने वाला और ऑडिट देने वाला मैनेजर।'],
    [['The manager makes the audit for a division and chooses the person and the items.', 'मैनेजर डिवीज़न के लिए ऑडिट बनाकर व्यक्ति और आइटम चुनता है।'], ['The person gets a task in the Inbox, opens it and enters the count of each item.', 'व्यक्ति को Inbox में टास्क मिलता है, वह खोलकर हर आइटम की गिनती भरता है।'], ['The system shows how many were correct. The status closes after the due date.', 'सिस्टम बताता है कि कितने सही थे। तारीख़ के बाद स्थिति बंद हो जाती है।']]);
  E('decision', 'tasks', 'Decision actions', 'डिसीज़न ऐक्शन',
    ['The actions that came out of a decision taken in a meeting, with who must do what.', 'मीटिंग में लिए फ़ैसले से निकले काम, किसे क्या करना है।'],
    ['So that a decision turns into work.', 'ताकि फ़ैसला काम में बदले।'], ALL,
    [['Open My Assignment > Decision actions.', 'My Assignment > Decision actions खोलें।'], ['Each row shows the decision, the meeting, the status and what to do.', 'हर लाइन में फ़ैसला, मीटिंग, स्थिति और क्या करना है दिखता है।'], ['Do your part and mark it done.', 'अपना काम करके done करें।']]);

  /* ---------- Training ---------- */
  E('training', 'cal', 'Training calendar', 'ट्रेनिंग कैलेंडर',
    ['The calendar of mandatory trainings: the session, the date, the trainer, the audience and the test.', 'ज़रूरी ट्रेनिंग का कैलेंडर: सेशन, तारीख़, ट्रेनर, ऑडियंस और टेस्ट।'],
    ['So that everybody knows when the training is and attends.', 'ताकि सबको पता रहे ट्रेनिंग कब है और वे आएँ।'], ALL,
    [['Open Training > Training calendar.', 'Training > Training calendar खोलें।'], ['HR adds a session with the date, the trainer, the audience and the test.', 'HR तारीख़, ट्रेनर, ऑडियंस और टेस्ट के साथ सेशन जोड़ता है।'], ['After the session the trainer marks who attended and gives the test.', 'सेशन के बाद ट्रेनर बताता है कौन आया और टेस्ट लेता है।']]);
  E('training', 'viva', 'Viva', 'वाइवा',
    ['An oral test of an employee on what was taught, with the marks.', 'जो सिखाया गया उस पर कर्मचारी का मौखिक टेस्ट, अंकों के साथ।'], ['So that learning is checked by talking, not only by paper.', 'ताकि सीख की जाँच सिर्फ़ काग़ज़ से नहीं, बातचीत से भी हो।'], MGR,
    [['Open Training > Viva.', 'Training > Viva खोलें।'], ['Choose the employee and the topic.', 'कर्मचारी और विषय चुनें।'], ['Write the marks and the remark and save.', 'अंक और टिप्पणी लिखकर सेव करें।']]);
  E('training', 'div', 'Division participation', 'डिवीज़न सहभागिता',
    ['How many people of each division were assigned a training and how many attended, in percent.', 'हर डिवीज़न के कितने लोगों को ट्रेनिंग दी गई और कितने आए, प्रतिशत में।'], ['So that a division that skips training is seen.', 'ताकि ट्रेनिंग छोड़ने वाली डिवीज़न दिखे।'], MGR,
    [['Open Training > Division participation.', 'Training > Division participation खोलें।'], ['Read the table: assigned, attended and the percentage for each division.', 'टेबल पढ़ें: हर डिवीज़न के असाइन, उपस्थित और प्रतिशत।'], ['Follow up with the division head where the percentage is low.', 'जहाँ प्रतिशत कम हो वहाँ डिवीज़न हेड से बात करें।']]);
  E('training', 'ojt', 'OJT coaching', 'OJT कोचिंग',
    ['On-the-job coaching: a trainer teaches an employee at work against a checklist, with a due date.', 'काम पर कोचिंग: ट्रेनर कर्मचारी को काम के दौरान चेकलिस्ट के अनुसार सिखाता है, तारीख़ के साथ।'], ['So that skills are learned at the place of work.', 'ताकि कौशल काम की जगह पर सीखा जाए।'], MGR,
    [['Open Training > OJT coaching and make an OJT: choose the employee, the trainer, the template and the due date.', 'Training > OJT coaching खोलें और OJT बनाएँ: कर्मचारी, ट्रेनर, टेम्पलेट और तारीख़ चुनें।'], ['The trainer ticks each point of the checklist as the employee shows it.', 'कर्मचारी जैसे-जैसे दिखाता है, ट्रेनर चेकलिस्ट का हर बिंदु टिक करता है।'], ['When the pass mark is reached the OJT is passed.', 'पास मार्क पूरा होने पर OJT पास होता है।']]);
  E('training', 'ind', 'Employee induction', 'कर्मचारी इंडक्शन',
    ['The plan for a new joiner: the items to be done by HR, the manager and the employee, and the progress.', 'नए जॉइनर की योजना: HR, मैनेजर और कर्मचारी के करने के काम, और प्रगति।'], ['So that a new person starts well.', 'ताकि नया व्यक्ति अच्छी शुरुआत करे।'], ALL,
    [['Open Training > Employee induction. A plan is made when a person joins.', 'Training > Employee induction खोलें। व्यक्ति के जॉइन करने पर योजना बनती है।'], ['Each owner gets a task in the Inbox for their items and marks it done.', 'हर ज़िम्मेदार को अपने आइटम का टास्क Inbox में मिलता है, वह done करता है।'], ['When all are done the employee confirms the induction.', 'सब पूरे होने पर कर्मचारी इंडक्शन की पुष्टि करता है।']]);
  E('training', 'learn', 'Self Training', 'सेल्फ ट्रेनिंग',
    ['Courses that you learn by yourself: watch the videos, read the lessons and take the tests.', 'वे कोर्स जो आप ख़ुद सीखते हैं: वीडियो देखें, पाठ पढ़ें और टेस्ट दें।'], ['So that you can learn at your own time.', 'ताकि आप अपने समय पर सीख सकें।'], ALL,
    [['Open Training > Self Training. Your courses are listed.', 'Training > Self Training खोलें। आपके कोर्स दिखते हैं।'], ['Open a course and finish its lessons in order.', 'कोर्स खोलकर उसके पाठ क्रम से पूरे करें।'], ['Take the test. When you pass, the course is complete.', 'टेस्ट दें। पास होने पर कोर्स पूरा होता है।']]);
  E('training', 'courses', 'Courses', 'कोर्स',
    ['The library of courses: the category, the lessons, the skill, who it is assigned to and how many completed.', 'कोर्स की लाइब्रेरी: श्रेणी, पाठ, स्किल, किसे असाइन है और कितनों ने पूरा किया।'], ['So that HR builds and keeps the courses in one place.', 'ताकि HR कोर्स एक जगह बनाए और रखे।'], HR,
    [['Open Training > Courses.', 'Training > Courses खोलें।'], ['Make a course: the name, the category, the skill, then add the lessons and the test.', 'कोर्स बनाएँ: नाम, श्रेणी, स्किल, फिर पाठ और टेस्ट जोड़ें।'], ['A video lesson: choose the video file (MP4 or WebM, up to 50 MB) with Upload the video file. The length is read from the file by itself and the video plays inside Mirror-HR. If the video is bigger, compress it, or give a YouTube, Vimeo or Drive link instead. Set how much of the video must be watched.', 'वीडियो का पाठ: Upload the video file से वीडियो फ़ाइल (MP4 या WebM, 50 MB तक) चुनें। लंबाई फ़ाइल से अपने आप पढ़ ली जाती है और वीडियो Mirror-HR के अंदर ही चलता है। वीडियो इससे बड़ा हो तो उसे छोटा करें, या उसकी जगह YouTube, Vimeo या Drive का लिंक दें। तय करें कि वीडियो का कितना हिस्सा देखना ज़रूरी है।'], ['A reading lesson: write the text to read and, if you have a handbook or SOP, choose the PDF with Upload the PDF that goes with it (up to 20 MB). The employee opens it from the lesson with Open the PDF.', 'पढ़ने का पाठ: पढ़ने का पाठ लिखें और हैंडबुक या SOP हो तो Upload the PDF that goes with it से PDF चुनें (20 MB तक)। कर्मचारी उसे पाठ से Open the PDF दबाकर खोलता है।'],['Publish it. Then assign it in Assign courses.', 'प्रकाशित करें। फिर Assign courses में असाइन करें।']]);
  E('training', 'assign', 'Assign courses', 'कोर्स असाइन करें',
    ['Give a course to people, and set the course that must be completed at each career level.', 'लोगों को कोर्स दें, और हर करियर लेवल के लिए अनिवार्य कोर्स तय करें।'], ['So that the right people learn the right course by a date.', 'ताकि सही लोग सही कोर्स तारीख़ तक सीखें।'], HR,
    [['Open Training > Assign courses.', 'Training > Assign courses खोलें।'], ['Choose the course, who it goes to (people, division or level) and the last date. Say if it is mandatory.', 'कोर्स, किसे जाएगा (लोग, डिवीज़न या लेवल) और आख़िरी तारीख़ चुनें। बताएँ कि अनिवार्य है या नहीं।'], ['Below, set the course that must be completed at each career level. The table shows who is still pending.', 'नीचे हर करियर लेवल का अनिवार्य कोर्स तय करें। टेबल में दिखता है कौन अभी बाक़ी है।']]);
  E('training', 'progress', 'Learning progress', 'लर्निंग प्रगति',
    ['How far each person has gone in each course, the last date, the best test score and the status.', 'हर व्यक्ति हर कोर्स में कहाँ तक पहुँचा, आख़िरी तारीख़, सबसे अच्छा टेस्ट स्कोर और स्थिति।'], ['So that managers follow up the slow learners.', 'ताकि मैनेजर धीमी गति वालों से फ़ॉलो-अप करें।'], MGR,
    [['Open Training > Learning progress.', 'Training > Learning progress खोलें।'], ['Use the filters for the course or the person.', 'कोर्स या व्यक्ति के फ़िल्टर लगाएँ।'], ['Remind the people who are behind the last date.', 'जो आख़िरी तारीख़ से पीछे हैं उन्हें याद दिलाएँ।']]);
  E('training', 'hist', 'History', 'इतिहास',
    ['The training record of each person: assigned, attended, excused, absent and the average test percentage.', 'हर व्यक्ति का ट्रेनिंग रिकॉर्ड: असाइन, उपस्थित, माफ़, अनुपस्थित और टेस्ट का औसत प्रतिशत।'], ['So that the whole picture of a person is in one row.', 'ताकि व्यक्ति की पूरी तस्वीर एक लाइन में हो।'], MGR,
    [['Open Training > History.', 'Training > History खोलें।'], ['Read the row of the person.', 'व्यक्ति की लाइन पढ़ें।'], ['These numbers feed the training KPIs.', 'ये संख्याएँ ट्रेनिंग के KPI में जाती हैं।']]);
  E('training', 'setup', 'Setup', 'सेटअप',
    ['The templates of training: the type, the checklist points, the pass mark and the deadline days.', 'ट्रेनिंग के टेम्पलेट: प्रकार, चेकलिस्ट के बिंदु, पास मार्क और डेडलाइन के दिन।'], ['So that every OJT and viva uses the same standard.', 'ताकि हर OJT और वाइवा एक ही मानक पर चले।'], HR,
    [['Open Training > Setup.', 'Training > Setup खोलें।'], ['Add a template with its checklist points and the pass mark.', 'चेकलिस्ट के बिंदु और पास मार्क के साथ टेम्पलेट जोड़ें।'], ['Set the deadline days. Save.', 'डेडलाइन के दिन तय करें। सेव करें।']]);
  E('training', 'mine', 'My trainings', 'मेरी ट्रेनिंग',
    ['Your own trainings: the sessions you must attend, your OJT and the courses you must finish.', 'आपकी अपनी ट्रेनिंग: जिन सेशन में जाना है, आपका OJT और जो कोर्स पूरे करने हैं।'], ['So that you see all your learning in one place.', 'ताकि आप अपनी सारी सीख एक जगह देखें।'], ALL,
    [['Open Training > My trainings.', 'Training > My trainings खोलें।'], ['See what is due and by when.', 'देखें क्या बाक़ी है और कब तक।'], ['Open an item to attend, learn or give the test.', 'आइटम खोलकर उसमें शामिल हों, सीखें या टेस्ट दें।']]);

  /* ---------- Marketing ---------- */
  E('marketing', 'content', 'Content items', 'कंटेंट आइटम',
    ['Each design, video or post that is made: the campaign, the creator, the due date, the revisions and the status.', 'बनने वाला हर डिज़ाइन, वीडियो या पोस्ट: कैंपेन, बनाने वाला, तारीख़, रिविज़न और स्थिति।'], ['So that every piece of content is tracked from idea to posting.', 'ताकि हर कंटेंट आइडिया से पोस्टिंग तक ट्रैक हो।'], ['Marketing staff, reviewers and HR.', 'मार्केटिंग स्टाफ़, रिव्यूअर और HR।'],
    [['Open Marketing > Content items and add an item: choose the campaign, the type and the due date.', 'Marketing > Content items खोलें और आइटम जोड़ें: कैंपेन, प्रकार और तारीख़ चुनें।'], ['The creator uploads the work and sends it for review.', 'बनाने वाला काम अपलोड करके रिव्यू के लिए भेजता है।'], ['When it is approved the item is ready to post. Use the filters (All, Draft and so on) to see the status.', 'मंज़ूर होने पर आइटम पोस्ट के लिए तैयार होता है। स्थिति देखने के लिए फ़िल्टर (All, Draft आदि) लगाएँ।']]);
  E('marketing', 'reviews', 'Reviews', 'रिव्यू',
    ['The items that wait for your review, with the step, the reviewer and the time taken.', 'आपके रिव्यू का इंतज़ार कर रहे आइटम, स्टेप, रिव्यूअर और लगा समय।'], ['So that review does not delay the posting.', 'ताकि रिव्यू से पोस्टिंग में देरी न हो।'], ['Reviewers and managers.', 'रिव्यूअर और मैनेजर।'],
    [['Open Marketing > Reviews.', 'Marketing > Reviews खोलें।'], ['Open an item, look at the work and approve it, or send it back with a note.', 'आइटम खोलकर काम देखें और मंज़ूर करें, या नोट के साथ वापस भेजें।'], ['The time you take is counted in the review KPI.', 'आपका लिया समय रिव्यू KPI में गिना जाता है।']]);
  E('marketing', 'camp', 'Campaigns', 'कैंपेन',
    ['A campaign groups the content for one occasion, with the platforms and the dates.', 'कैंपेन किसी अवसर का कंटेंट एक साथ रखता है, प्लेटफ़ॉर्म और तारीख़ों के साथ।'], ['So that the team works to a plan.', 'ताकि टीम योजना के अनुसार काम करे।'], ['Marketing managers and HR.', 'मार्केटिंग मैनेजर और HR।'],
    [['Open Marketing > Campaigns and press + New campaign.', 'Marketing > Campaigns खोलें और + New campaign दबाएँ।'], ['Write the name, choose the platforms and the dates, and save.', 'नाम लिखें, प्लेटफ़ॉर्म और तारीख़ें चुनें और सेव करें।'], ['Add the content items to it. The table shows the items and the status.', 'इसमें कंटेंट आइटम जोड़ें। टेबल में आइटम और स्थिति दिखती है।']]);
  E('marketing', 'posts', 'Post performance', 'पोस्ट परफ़ॉर्मेंस',
    ['The numbers of each post: the platform, the planned and the posted date, the reach, the engagement and the views.', 'हर पोस्ट के आँकड़े: प्लेटफ़ॉर्म, योजना और पोस्ट की तारीख़, रीच, एंगेजमेंट और व्यूज़।'], ['So that the result of a post is known. KPI-269 (engagement rate) is worked out from these figures.', 'ताकि पोस्ट का नतीजा पता चले। KPI-269 (एंगेजमेंट रेट) इन्हीं आँकड़ों से बनता है।'], ['The person who posts, and marketing managers.', 'पोस्ट करने वाला और मार्केटिंग मैनेजर।'],
    [['Open Marketing > Post performance and press + Add post.', 'Marketing > Post performance खोलें और + Add post दबाएँ।'], ['Choose the item and the platform and write the posted date.', 'आइटम और प्लेटफ़ॉर्म चुनें और पोस्ट की तारीख़ लिखें।'], ['After the measurement window, press Edit and enter the reach, the engagement and the views.', 'मापने की अवधि के बाद Edit दबाएँ और रीच, एंगेजमेंट और व्यूज़ भरें।']]);
  E('marketing', 'cal', 'Content calendar', 'कंटेंट कैलेंडर',
    ['A calendar of when each post is planned and posted.', 'कैलेंडर जिसमें हर पोस्ट की योजना और पोस्टिंग की तारीख़ है।'], ['So that the team sees the gaps and the clashes.', 'ताकि टीम को ख़ाली दिन और टकराव दिखें।'], ['Marketing staff and managers.', 'मार्केटिंग स्टाफ़ और मैनेजर।'],
    [['Open Marketing > Content calendar.', 'Marketing > Content calendar खोलें।'], ['Move between the months to see the posts.', 'पोस्ट देखने के लिए महीनों के बीच जाएँ।'], ['Open a post to see its item and status.', 'पोस्ट खोलकर उसका आइटम और स्थिति देखें।']]);
  E('marketing', 'setup', 'Setup', 'सेटअप',
    ['The platforms and the minimum numbers that a post must reach, and the audience channels for followers and visits.', 'प्लेटफ़ॉर्म और पोस्ट के न्यूनतम आँकड़े जो पूरे होने चाहिए, और फ़ॉलोअर और विज़िट के ऑडियंस चैनल।'], ['So that the KPIs have a fair standard.', 'ताकि KPI का मानक निष्पक्ष हो।'], HR,
    [['Open Marketing > Setup.', 'Marketing > Setup खोलें।'], ['In the first table press + Add or Edit for a platform: the minimum engagement for an image and a video and the minimum views of a video.', 'पहली टेबल में प्लेटफ़ॉर्म के लिए + Add या Edit दबाएँ: इमेज और वीडियो का न्यूनतम एंगेजमेंट और वीडियो के न्यूनतम व्यूज़।'], ['In the second table add or stop the audience channels (see Marketing > Audience).', 'दूसरी टेबल में ऑडियंस चैनल जोड़ें या बंद करें (Marketing > Audience देखें)।']]);

  /* ---------- Library ---------- */
  E('library', 'mine', 'My library', 'मेरी लाइब्रेरी',
    ['The policies, SOPs and forms meant for you, with the version and whether you have acknowledged.', 'आपके लिए पॉलिसी, SOP और फ़ॉर्म, वर्ज़न और आपकी पुष्टि के साथ।'], ['So that you read the latest rule and confirm that you did.', 'ताकि आप नया नियम पढ़ें और पुष्टि करें कि पढ़ा।'], ALL,
    [['Open Library > My library.', 'Library > My library खोलें।'], ['Press Open on a document and read it.', 'दस्तावेज़ पर Open दबाकर पढ़ें।'], ['Press “I have read this”. It is recorded with the date.', '“I have read this” दबाएँ। तारीख़ के साथ दर्ज होता है।']]);
  E('library', 'manage', 'Manage', 'प्रबंधन',
    ['Make and keep the documents, their versions and who they are for.', 'दस्तावेज़, उनके वर्ज़न और वे किसके लिए हैं, बनाएँ और रखें।'], ['So that only the live version is shown to people.', 'ताकि लोगों को सिर्फ़ लाइव वर्ज़न दिखे।'], HR,
    [['Open Library > Manage and press + New document.', 'Library > Manage खोलें और + New document दबाएँ।'], ['Write the title, choose the category and the audience, add the file and publish.', 'शीर्षक लिखें, श्रेणी और ऑडियंस चुनें, फ़ाइल जोड़ें और प्रकाशित करें।'], ['To change it press New version. The old versions stay in the history.', 'बदलने के लिए New version दबाएँ। पुराने वर्ज़न इतिहास में रहते हैं।']]);
  E('library', 'acks', 'Acknowledgements', 'पुष्टियाँ',
    ['Who has and who has not acknowledged each document.', 'किसने और किसने नहीं पुष्टि की, हर दस्तावेज़ के लिए।'], ['So that HR can prove who read the rule.', 'ताकि HR साबित कर सके कि नियम किसने पढ़ा।'], HR,
    [['Open Library > Acknowledgements.', 'Library > Acknowledgements खोलें।'], ['Choose the document.', 'दस्तावेज़ चुनें।'], ['See the pending people and remind them.', 'बाक़ी लोगों को देखें और याद दिलाएँ।']]);
  E('library', 'report', 'Report', 'रिपोर्ट',
    ['A summary by category: documents, published versions, drafts, those that need acknowledgement and those due for review in 30 days.', 'श्रेणी के अनुसार सार: दस्तावेज़, प्रकाशित वर्ज़न, ड्राफ़्ट, जिनकी पुष्टि चाहिए और जिनका 30 दिन में रिव्यू है।'], ['So that no policy gets old.', 'ताकि कोई पॉलिसी पुरानी न हो।'], HR,
    [['Open Library > Report.', 'Library > Report खोलें।'], ['Read each category row.', 'हर श्रेणी की लाइन पढ़ें।'], ['Update the documents that are due for review.', 'जिनका रिव्यू बाक़ी है उन्हें अपडेट करें।']]);

  /* ---------- Analytics: Sales analysis ---------- */
  E('analytics', 'sales', 'Sales analysis (Performance)', 'सेल्स एनालिसिस (परफ़ॉर्मेंस)',
    ['Ten sales dashboards in Analytics > Performance > Sales analysis, made from the daily sales files (Cockpit > Imports: employee and division sales, bills, quantity and returns) and the sales targets. Division reports: sale against target (with the pace of the running month), month by month with growth, comparison with last month and last year (same days), ranking and share of the total, and bills, average bill value, items per bill and returns. Employee reports: sale against personal target (best ten and weakest ten), achievement bands, employee against the average of his division, six-month trend of one employee, and a check that the employee targets add up to the division target.',
     'Analytics > Performance > Sales analysis में दस सेल्स डैशबोर्ड, जो रोज़ की सेल्स फ़ाइलों (Cockpit > Imports: कर्मचारी और डिवीज़न की बिक्री, बिल, मात्रा और रिटर्न) और सेल्स टारगेट से बनते हैं। डिवीज़न रिपोर्ट: बिक्री बनाम टारगेट (चालू महीने की रफ़्तार के साथ), महीने-दर-महीने बढ़त के साथ, पिछले महीने और पिछले साल से तुलना (उतने ही दिन), रैंक और कुल में हिस्सा, और बिल, औसत बिल, प्रति बिल आइटम और रिटर्न। कर्मचारी रिपोर्ट: बिक्री बनाम निजी टारगेट (सबसे अच्छे दस और सबसे कमज़ोर दस), उपलब्धि बैंड, कर्मचारी बनाम उसकी डिवीज़न का औसत, एक कर्मचारी का छह महीने का ट्रेंड, और जाँच कि कर्मचारियों के टारगेट का जोड़ डिवीज़न के टारगेट से मिलता है।'],
    ['So that sales can be compared, explained and followed up, and not only imported.', 'ताकि बिक्री की तुलना, समझ और फ़ॉलो-अप हो सके, सिर्फ़ इम्पोर्ट नहीं।'],
    ['HR and Admin see everything. A manager sees only the employee reports, and only of his own team.', 'HR और Admin सब देखते हैं। मैनेजर सिर्फ़ कर्मचारी रिपोर्ट देखता है, और सिर्फ़ अपनी टीम की।'],
    [['Open Analytics > Performance and press Sales analysis.', 'Analytics > Performance खोलें और Sales analysis दबाएँ।'],
     ['Choose the month (the running month shows as “till today”), the branch or division, and, for the trend card, an employee.', 'महीना चुनें (चालू महीना “आज तक” दिखता है), ब्रांच या डिवीज़न, और ट्रेंड कार्ड के लिए एक कर्मचारी।'],
     ['Every card can be shown as a table or a chart, opened in full, drilled down to the employees (click a row) and exported to CSV.', 'हर कार्ड टेबल या चार्ट में दिख सकता है, पूरा खुल सकता है, कर्मचारियों तक जा सकता है (लाइन पर क्लिक करें) और CSV में एक्सपोर्ट हो सकता है।'],
     ['Upload the daily files every day in Cockpit > Imports (till-date sale and quantity, till-date bills, division returns). The app keeps every day, so the day-wise history and the same-day comparisons are there. To compare with last year, upload last year’s files the same way.', 'रोज़ की फ़ाइलें हर दिन Cockpit > Imports में अपलोड करें (आज तक की बिक्री और मात्रा, आज तक के बिल, डिवीज़न के रिटर्न)। ऐप हर दिन का डेटा रखता है, इसलिए दिन-वार इतिहास और उतने ही दिन की तुलना मिलती है। पिछले साल से तुलना के लिए पिछले साल की फ़ाइलें भी ऐसे ही अपलोड करें।']],
    [['Colours: green when the achievement is at or above the first limit (100%), yellow at or above the second (80%), red below. In the running month the colour compares with the days gone (the pace). The limits are the same as the Dashboard cards (the SLA “Target colours on the Dashboard”).', 'रंग: हरा जब उपलब्धि पहली सीमा (100%) या उससे ऊपर हो, पीला दूसरी सीमा (80%) या उससे ऊपर, लाल उससे कम। चालू महीने में रंग बीते दिनों (रफ़्तार) से तुलना करता है। सीमाएँ Dashboard के कार्ड जैसी ही हैं (SLA “Target colours on the Dashboard”)।'],
     ['Division sales have no branch, so the branch filter does not change the division reports. A dash means there is no figure to compare with.', 'डिवीज़न की बिक्री में ब्रांच नहीं होती, इसलिए ब्रांच फ़िल्टर से डिवीज़न रिपोर्ट नहीं बदलती। डैश का मतलब है तुलना के लिए कोई आँकड़ा नहीं।']]);
})();
