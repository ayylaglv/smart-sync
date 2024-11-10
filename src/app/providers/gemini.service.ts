// src/app/services/gemini.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private readonly apiKey = environment.geminiApiKey;
  private readonly apiUrl =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  constructor(private http: HttpClient) {}

  async getRecommendations(notes: any[]): Promise<string> {
    const prompt = this.createPrompt(notes);

    try {
      const response = await this.http
        .post(`${this.apiUrl}?key=${this.apiKey}`, {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        })
        .toPromise();

      return this.parseResponse(response);
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  }

  private createPrompt(notes: any[]): string {
    return `
      I have the following tasks/activities:
      ${notes
        .map(
          (note) => `
        - Title: ${note.title}
        - Time Required: ${note.timeRequired} minutes
        - Priority: ${note.priority}
        - Location: ${note.location || 'Not specified'}
        - Time Window: ${note.officeTimeFrom} - ${note.officeTimeTo}
        ${note.requiresSpecificClothing ? '- Requires specific clothing' : ''}
      `
        )
        .join('\n')}

      Please analyze these activities and provide:
      1. Optimal scheduling order based on priority and time windows
      2. Suggestions for grouping activities by location
      3. Time management tips
      4. Any potential conflicts or issues to be aware of
      5. Recommendations for improving efficiency
      
      Please format the response in a clear, structured way.
    `;
  }

  private parseResponse(response: any): string {
    // Add proper response parsing based on Gemini API response structure
    return (
      response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      'No recommendations available'
    );
  }
}
