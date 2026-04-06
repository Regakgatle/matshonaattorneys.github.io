/* ============================================
   MATSHONA ATTORNEYS — AI Chatbot Widget
   24/7 Lead Intake, FAQs, Scheduling, Escalation
   ============================================ */

(function () {
  'use strict';

  // ---- Firm Data ----
  const FIRM = {
    name: 'Matshona Attorneys',
    phone: '+27 12 345 6789',
    emergency: '+27 82 345 6789',
    email: 'info@matshonaattorneys.co.za',
    address: '123 Justice Avenue, Hatfield, Pretoria, 0028',
    hours: 'Monday–Friday: 08:00–17:00, Saturday: 09:00–13:00 (by appointment)',
    calendly: 'https://calendly.com/matshonaattorneys',
    areas: [
      'Family Law', 'Criminal Defence', 'Labour Law', 'Personal Injury',
      'Conveyancing & Property', 'Commercial & Business Law', 'Immigration Law', 'Estate Planning & Wills'
    ]
  };

  // ---- FAQ Database ----
  const FAQS = {
    'hours': `Our office hours are:\n${FIRM.hours}\nOur chatbot is available 24/7.`,
    'location': `We're located at:\n📍 ${FIRM.address}\nYou can find us on Google Maps on our Contact page.`,
    'cost': `We offer a FREE initial consultation. Fees vary depending on the nature and complexity of your matter. We'll provide a clear cost estimate after understanding your case.`,
    'consultation': `You can book a free consultation:\n📞 Call: ${FIRM.phone}\n📧 Email: ${FIRM.email}\n📅 Or book online via Calendly.\nWould you like me to help you get started?`,
    'areas': `We specialize in:\n• Family Law\n• Criminal Defence\n• Labour Law\n• Personal Injury\n• Conveyancing & Property\n• Commercial & Business Law\n• Immigration Law\n• Estate Planning & Wills\n\nWhich area are you interested in?`,
    'personal injury': `For personal injury claims, we handle:\n• Motor vehicle accidents (RAF claims)\n• Medical malpractice\n• Workplace injuries\n• Slip and fall claims\n\nImportant: There are time limits for filing claims. Contact us soon to protect your rights.`,
    'family': `Our Family Law services include:\n• Divorce & separation\n• Child custody & access\n• Maintenance claims\n• Protection orders\n• Adoption & prenuptial agreements`,
    'criminal': `Our Criminal Defence team handles:\n• Bail applications\n• Assault & violent crime\n• Fraud & white-collar crime\n• DUI/drunk driving\n• Appeals & reviews\n\nIf you've been arrested, contact us immediately.`,
    'labour': `Our Labour Law services include:\n• Unfair dismissal claims\n• CCMA disputes\n• Employment contracts\n• Workplace discrimination\n• Retrenchment advisory`,
  };

  // ---- Lead Intake Flow ----
  const INTAKE_STEPS = [
    { key: 'name', question: "Let's get started. What is your full name?", validate: v => v.length >= 2 },
    { key: 'phone', question: "What's the best phone number to reach you?", validate: v => v.length >= 10 },
    { key: 'email', question: "And your email address?", validate: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
    { key: 'issue_type', question: "What type of legal issue do you need help with?", validate: v => v.length > 0, quickReplies: ['Family Law','Criminal Defence','Labour Law','Personal Injury','Property','Business','Immigration','Estates','Other'] },
    { key: 'description', question: "Please briefly describe your situation. Include any relevant dates or details.", validate: v => v.length >= 10 },
    { key: 'urgency', question: "How urgent is this matter?", validate: v => v.length > 0, quickReplies: ['Urgent — Need help ASAP','Moderate — Within a week','Not urgent — General enquiry'] }
  ];

  // ---- State ----
  let isOpen = false;
  let intakeMode = false;
  let intakeStep = 0;
  let leadData = {};
  let conversationHistory = [];

  // ---- Build Widget HTML ----
  function createWidget() {
    const root = document.getElementById('chatbot-root');
    if (!root) return;

    root.innerHTML = `
      <button class="chatbot-toggle" id="chatbotToggle" aria-label="Open chat assistant" title="Chat with us">💬</button>
      <div class="chatbot-window" id="chatbotWindow" role="dialog" aria-label="Chat assistant">
        <div class="chatbot-header">
          <div class="chatbot-header-info">
            <div class="chatbot-avatar">M</div>
            <div class="chatbot-header-text">
              <h4>Matshona Legal Assistant</h4>
              <p class="chatbot-status">Online — Available 24/7</p>
            </div>
          </div>
          <button class="chatbot-close" id="chatbotClose" aria-label="Close chat">✕</button>
        </div>
        <div class="chatbot-messages" id="chatMessages"></div>
        <div class="chatbot-input">
          <input type="text" id="chatInput" placeholder="Type your message..." aria-label="Chat message input">
          <button id="chatSend" aria-label="Send message">➤</button>
        </div>
      </div>
    `;

    // Bind events
    document.getElementById('chatbotToggle').addEventListener('click', toggleChat);
    document.getElementById('chatbotClose').addEventListener('click', toggleChat);
    document.getElementById('chatSend').addEventListener('click', handleSend);
    document.getElementById('chatInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSend();
    });

    // Welcome message after short delay
    setTimeout(() => {
      addBotMessage("Hello! 👋 Welcome to Matshona Attorneys. I'm your 24/7 legal assistant.\n\nHow can I help you today?", [
        'I need legal help',
        'Practice areas',
        'Book consultation',
        'Office hours & location',
        'FAQs'
      ]);
    }, 500);
  }

  // ---- Toggle Chat ----
  function toggleChat() {
    isOpen = !isOpen;
    const win = document.getElementById('chatbotWindow');
    const toggle = document.getElementById('chatbotToggle');
    win.classList.toggle('open', isOpen);
    toggle.classList.toggle('active', isOpen);
    toggle.innerHTML = isOpen ? '✕' : '💬';
    if (isOpen) document.getElementById('chatInput').focus();
  }

  // ---- Add Messages ----
  function addBotMessage(text, quickReplies) {
    const container = document.getElementById('chatMessages');
    // Show typing indicator
    const typing = document.createElement('div');
    typing.className = 'typing-indicator';
    typing.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    container.appendChild(typing);
    container.scrollTop = container.scrollHeight;

    setTimeout(() => {
      typing.remove();
      const msg = document.createElement('div');
      msg.className = 'chat-msg bot';
      msg.textContent = text;
      container.appendChild(msg);

      if (quickReplies && quickReplies.length > 0) {
        const qr = document.createElement('div');
        qr.className = 'chat-quick-replies';
        quickReplies.forEach(label => {
          const btn = document.createElement('button');
          btn.className = 'chat-quick-btn';
          btn.textContent = label;
          btn.addEventListener('click', () => {
            qr.remove();
            handleUserInput(label);
          });
          qr.appendChild(btn);
        });
        container.appendChild(qr);
      }
      container.scrollTop = container.scrollHeight;
    }, 800 + Math.random() * 400);
  }

  function addUserMessage(text) {
    const container = document.getElementById('chatMessages');
    const msg = document.createElement('div');
    msg.className = 'chat-msg user';
    msg.textContent = text;
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
  }

  // ---- Handle Send ----
  function handleSend() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    handleUserInput(text);
  }

  // ---- Process User Input ----
  function handleUserInput(text) {
    addUserMessage(text);
    conversationHistory.push({ role: 'user', content: text });

    // If in intake mode, process intake step
    if (intakeMode) {
      processIntake(text);
      return;
    }

    // Route the message
    const lower = text.toLowerCase();

    if (lower.includes('legal help') || lower.includes('need help') || lower.includes('i need')) {
      startIntake();
    } else if (lower.includes('book') || lower.includes('consult') || lower.includes('schedule') || lower.includes('appointment')) {
      addBotMessage(FAQS.consultation, ['Start intake form', 'Book on Calendly', 'Call the office']);
    } else if (lower.includes('practice') || lower.includes('service') || lower.includes('areas') || lower.includes('what do you')) {
      addBotMessage(FAQS.areas, ['Family Law','Criminal Defence','Labour Law','Personal Injury','I need legal help']);
    } else if (lower.includes('hour') || lower.includes('open') || lower.includes('when')) {
      addBotMessage(FAQS.hours);
    } else if (lower.includes('location') || lower.includes('where') || lower.includes('address') || lower.includes('office') || lower.includes('directions')) {
      addBotMessage(FAQS.location);
    } else if (lower.includes('cost') || lower.includes('fee') || lower.includes('price') || lower.includes('charge') || lower.includes('how much')) {
      addBotMessage(FAQS.cost, ['Book free consultation', 'I need legal help']);
    } else if (lower.includes('family') || lower.includes('divorce') || lower.includes('custody') || lower.includes('maintenance')) {
      addBotMessage(FAQS.family, ['I need help with this', 'Book consultation']);
    } else if (lower.includes('criminal') || lower.includes('arrest') || lower.includes('bail') || lower.includes('charge')) {
      addBotMessage(FAQS.criminal, ['I need help urgently', 'Book consultation']);
    } else if (lower.includes('labour') || lower.includes('dismiss') || lower.includes('ccma') || lower.includes('employ') || lower.includes('fired')) {
      addBotMessage(FAQS.labour, ['I need help with this', 'Book consultation']);
    } else if (lower.includes('injury') || lower.includes('accident') || lower.includes('raf') || lower.includes('hurt')) {
      addBotMessage(FAQS['personal injury'], ['I need help with this', 'Book consultation']);
    } else if (lower.includes('faq') || lower.includes('question')) {
      addBotMessage("Here are some common questions I can help with:", ['Office hours', 'Location & directions', 'Consultation fees', 'Practice areas', 'Book a consultation']);
    } else if (lower.includes('calendly')) {
      addBotMessage(`You can book directly on Calendly:\n📅 ${FIRM.calendly}\n\n(This link will be active once the firm sets up their Calendly account.)`, ['I need legal help', 'Back to menu']);
    } else if (lower.includes('call') || lower.includes('phone')) {
      addBotMessage(`You can reach us at:\n📞 ${FIRM.phone}\n📞 ${FIRM.emergency} (After hours/Emergency)\n\nWould you like to start the intake process online instead?`, ['Start intake form', 'Back to menu']);
    } else if (lower.includes('urgent') || lower.includes('emergency') || lower.includes('immediate')) {
      addBotMessage(`⚠️ For urgent matters, please contact us immediately:\n\n📞 Emergency Line: ${FIRM.emergency}\n\nIf you or someone is in immediate danger, call 10111 (SAPS) or 112.`, ['Start intake form']);
    } else if (lower.includes('intake') || lower.includes('start') || lower.includes('begin') || lower.includes('get started')) {
      startIntake();
    } else if (lower.includes('menu') || lower.includes('back') || lower.includes('home') || lower.includes('hi') || lower.includes('hello')) {
      addBotMessage("How can I help you?", ['I need legal help', 'Practice areas', 'Book consultation', 'Office hours & location', 'FAQs']);
    } else if (lower.includes('thank') || lower.includes('bye') || lower.includes('cheers')) {
      addBotMessage("You're welcome! Don't hesitate to reach out if you need anything else. We're here to help. 🙏");
    } else {
      addBotMessage("I'm not sure I understand. Let me help you with some options:", ['I need legal help', 'Practice areas', 'Book consultation', 'FAQs', 'Speak to a human']);
    }

    if (lower.includes('speak to') || lower.includes('human') || lower.includes('person') || lower.includes('real person') || lower.includes('talk to someone')) {
      addBotMessage(`I'll connect you with our team right away.\n\n📞 Call: ${FIRM.phone}\n📧 Email: ${FIRM.email}\n\nAlternatively, fill out the intake form and an attorney will contact you within 24 hours.`, ['Start intake form', 'Back to menu']);
    }
  }

  // ---- Lead Intake ----
  function startIntake() {
    intakeMode = true;
    intakeStep = 0;
    leadData = {};
    const step = INTAKE_STEPS[intakeStep];
    addBotMessage("Great! I'll ask you a few questions to get your enquiry started. This information helps our attorneys prepare for your case.\n\n" + step.question, step.quickReplies);
  }

  function processIntake(text) {
    const step = INTAKE_STEPS[intakeStep];

    if (!step.validate(text)) {
      addBotMessage("That doesn't look quite right. " + step.question, step.quickReplies);
      return;
    }

    leadData[step.key] = text;
    intakeStep++;

    if (intakeStep < INTAKE_STEPS.length) {
      const next = INTAKE_STEPS[intakeStep];
      addBotMessage(next.question, next.quickReplies);
    } else {
      completeIntake();
    }
  }

  function completeIntake() {
    intakeMode = false;
    const summary = `✅ Thank you, ${leadData.name}! Your enquiry has been submitted.\n\n📋 Summary:\n• Issue: ${leadData.issue_type}\n• Urgency: ${leadData.urgency}\n• Contact: ${leadData.phone} / ${leadData.email}\n\nOne of our attorneys will contact you within 24 hours. For urgent matters, call ${FIRM.emergency}.`;

    addBotMessage(summary, ['Book on Calendly', 'Back to menu']);

    // In production, this would send data to CRM/email
    console.log('LEAD CAPTURED:', leadData);

    // Store lead locally for demo
    const leads = JSON.parse(localStorage.getItem('matshona_leads') || '[]');
    leads.push({ ...leadData, timestamp: new Date().toISOString() });
    localStorage.setItem('matshona_leads', JSON.stringify(leads));
  }

  // ---- Initialize ----
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }

})();
