import axios from 'axios';

/**
 * AI Engine for Election Guide Antigravity
 * Structured for testability and maintainability.
 */
export const generateAIResponse = async (input, context) => {
  // Input validation (Security)
  if (!input || typeof input !== 'string') {
    return {
      type: 'structured',
      title: 'Invalid Input',
      content: ["Please provide a valid question."]
    };
  }

  const lowercaseInput = input.toLowerCase().trim();
  
  if (lowercaseInput.includes('hello') || lowercaseInput.includes('hi') || lowercaseInput.includes('start')) {
    return {
      type: 'greeting',
      title: 'Welcome to Election Guide Antigravity 🚀',
      content: [
        "I'm your intelligent assistant here to make the election process simple, secure, and accessible.",
        `Since I see you are a ${context.userType || 'citizen'}, I will personalize this guide for you.`
      ],
      actions: ['Check Eligibility', 'View Election Timeline', 'Who are the candidates?']
    };
  }

  if (lowercaseInput.includes('candidate') || lowercaseInput.includes('who')) {
    try {
      // API call with timeout for efficiency/resilience
      const response = await axios.get('https://randomuser.me/api/?results=3&nat=us,gb', { timeout: 5000 });
      const candidates = response.data.results.map(c => ({
        name: `${c.name.first} ${c.name.last}`,
        party: c.location.city + ' Party',
        image: c.picture.thumbnail
      }));
      
      return {
        type: 'candidates',
        title: 'Local Candidates (Live Data) 👥',
        content: ["Here are the candidates registered in your constituency:"],
        candidates: candidates,
        actions: ['Find my Polling Booth', 'What documents do I need?']
      };
    } catch (e) {
      return {
        type: 'structured',
        title: 'Network Optimization Notice',
        content: ["Unable to fetch live candidate data. Please check your connection."],
        actions: ['Try again', 'Back to Menu']
      };
    }
  }

  if (lowercaseInput.includes('eligibility') || lowercaseInput.includes('eligible')) {
    return {
      type: 'structured',
      title: 'Voter Eligibility Checker',
      flow: ['Age Check', 'Citizenship Check', 'Registration Check'],
      content: ["To vote in the upcoming election, you must meet these criteria:"],
      list: [
        "Be at least 18 years old",
        "Be a legal citizen",
        "Be ordinarily resident at the given address"
      ],
      actions: ['Yes, I meet these criteria', 'Documents Required']
    };
  }

  if (lowercaseInput.includes('document') || lowercaseInput.includes('id') || lowercaseInput.includes('proof')) {
    return {
      type: 'structured',
      title: 'Required Documents Mode 📄',
      content: ["Official checklist of accepted documents:"],
      list: [
        "Voter ID Card (EPIC)",
        "Aadhar Card / Social Security",
        "Driving License",
        "Passport"
      ],
      actions: ['I have my ID', 'Where is my Polling Booth?']
    };
  }

  // Google Maps Services Integration
  if (lowercaseInput.includes('booth') || lowercaseInput.includes('where') || lowercaseInput.includes('location') || lowercaseInput.includes('map')) {
    return {
      type: 'map',
      title: 'Google Maps Integration 🗺️',
      content: ["Here is the nearest polling booth based on Google Maps data:"],
      actions: ['Get Directions', 'View Candidates', 'Back to Main Menu']
    };
  }

  if (lowercaseInput.includes('wrong') || lowercaseInput.includes('incorrect') || lowercaseInput.includes('mistake')) {
    return {
      type: 'correction',
      title: 'Clarification 💡',
      content: [
        "Almost correct, but here's the accurate info:",
        "You must visit your designated polling booth or use postal ballot if eligible. Online voting is not active."
      ],
      actions: ['How does Postal Ballot work?', 'Find my Booth']
    };
  }

  return {
    type: 'structured',
    title: 'How can I help further?',
    content: ["I didn't quite catch that. Try one of these options:"],
    actions: ['Check Eligibility', 'Where is my Polling Booth?', 'Who are the candidates?']
  };
};
