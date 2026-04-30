import { describe, it, expect } from 'vitest';
import { generateAIResponse } from './aiEngine';

describe('aiEngine', () => {
  const mockUserContext = {
    name: 'TestUser',
    userType: 'first-time voter'
  };

  it('should return a greeting response when input is empty or generic greeting', async () => {
    const response = await generateAIResponse('hello', mockUserContext);
    expect(response.type).toBe('greeting');
    expect(response.title).toContain('Welcome to Election Guide');
  });

  it('should return an eligibility response for first-time voter', async () => {
    const response = await generateAIResponse('am I eligible', mockUserContext);
    expect(response.type).toBe('structured');
    expect(response.title).toBe('Voter Eligibility Checker');
    expect(response.list).toContain('Be at least 18 years old');
  });

  it('should return a maps response when asking for polling booth', async () => {
    const response = await generateAIResponse('where is my polling booth', mockUserContext);
    expect(response.type).toBe('map');
    expect(response.title).toBe('Google Maps Integration 🗺️');
    expect(response.content[0]).toContain('Google Maps data');
  });

  it('should fetch candidates securely when asking for candidates', async () => {
    // Note: In a real environment we would mock Axios, but for this basic test we expect the candidates type
    const response = await generateAIResponse('who are the candidates', mockUserContext);
    expect(response.type).toBe('candidates');
    expect(response.title).toBe('Local Candidates (Live Data) 👥');
    expect(response.candidates.length).toBeGreaterThan(0);
  });

  it('should gracefully handle off-topic questions as unknown', async () => {
    const response = await generateAIResponse('what is the weather', mockUserContext);
    expect(response.type).toBe('structured');
    expect(response.title).toBe('How can I help further?');
    expect(response.content[0]).toContain("didn't quite catch that");
  });
});
