import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

// src/app/services/gemini.service.ts
@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private readonly apiKey = environment.geminiApiKey;
  private readonly apiUrl =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  constructor(private http: HttpClient) {}

  async getRecommendations(
    notes: any[],
    officeTimeFrom: string = '09:00',
    officeTimeTo: string = '17:00'
  ): Promise<string> {
    const prompt = this.createPrompt(notes, officeTimeFrom, officeTimeTo);

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

  private createPrompt(
    notes: any[],
    officeTimeFrom: string,
    officeTimeTo: string
  ): string {
    return `
      I need help organizing these activities outside of work hours (${officeTimeFrom} - ${officeTimeTo}) 
      since I'm busy with work during those hours.

      Here are my activities:
      ${notes
        .map(
          (note) => `
        - Title: ${note.title}
        - Time Required: ${note.timeRequired} minutes
        - Priority: ${note.priority}
        - Location: ${note.location || 'Not specified'}
        - Preferred Time Window: ${note.officeTimeFrom} - ${note.officeTimeTo}
        ${note.requiresSpecificClothing ? '- Requires specific clothing' : ''}
      `
        )
        .join('\n')}

      Please provide:
      1. Optimal Scheduling Order that avoids work hours (${officeTimeFrom} - ${officeTimeTo}), preferably scheduling activities:
         - Early morning (before ${officeTimeFrom})
         - Evening (after ${officeTimeTo})
         - Weekends if needed
      2. Group activities by location to minimize travel time
      3. Time management tips for balancing these activities with work
      4. Potential conflicts with work hours or other commitments
      5. Recommendations for improving efficiency, including:
         - Which activities could be combined
         - Best times for high-priority tasks
         - How to handle activities that might overlap with work hours
         - Strategies for maintaining work-life balance

      Consider:
      - Energy levels at different times of day
      - Travel time between locations
      - Priority of tasks
      - Activities that require specific clothing or preparation
      - Buffer time needed between work and other activities
      
      Please format the response in a clear, structured way with specific time recommendations 
      that work around the workday of ${officeTimeFrom} - ${officeTimeTo}. Format it to json.
    `;
  }

  private parseResponse(response: any): string {
    return (
      response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      'No recommendations available'
    );
  }
}
