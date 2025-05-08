import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";

// src/app/services/gemini.service.ts
@Injectable({
  providedIn: "root",
})
export class GeminiService {
  private readonly apiKey = environment.geminiApiKey;
  private readonly apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;

  constructor(private http: HttpClient) {}

  async getRecommendations(
    notes: any[],
    officeTimeFrom: string = "09:00",
    officeTimeTo: string = "17:00",
    priority: string = ""
  ): Promise<string> {
    const prompt = this.createPrompt(
      notes,
      officeTimeFrom,
      officeTimeTo,
      priority
    );

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
      console.error("Error calling Gemini API:", error);
      throw error;
    }
  }

  private createPrompt(
    notes: any[],
    officeTimeFrom: string,
    officeTimeTo: string,
    priority: string
  ): string {
    return `
      I need help organizing these activities outside of work hours (${officeTimeFrom} - ${officeTimeTo}) 
      since I'm busy with work during those hours. Unless the activity name is 'lunch' or the note.priority is equal to 'high'.
  
      Here are my activities:
      ${notes
        .map(
          (note) => `
        - Title: ${note.title}
        - Time Required: ${note.timeRequired} minutes
        - Priority: ${note.priority}
        - Location: ${note.location || "Not specified"}
        - Preferred Time Window: ${note.officeTimeFrom} - ${note.officeTimeTo}
        ${note.requiresSpecificClothing ? "- Requires specific clothing" : ""},
      `
        )
        .join("\n")}
  
      Please provide a structured response in the following exact format with numbered sections and bold headings:
  
      **1. Optimal Scheduling Order**
      Recommend specific times for each activity, scheduling them outside work hours (${officeTimeFrom} - ${officeTimeTo}) unless the activity name is 'lunch' or the priority is 'high'. Use this exact format with times:
      - 6:30 AM: [Activity Name] - [brief reason or description]
      - 7:00-7:45 AM: [Activity Name] - [brief reason or description]
      - 6:00 PM: [Activity Name] - [brief reason or description]
      - 8:30 PM: [Activity Name] - [brief reason or description]
      - Weekend (Saturday 10:00 AM): [Activity Name] - [brief reason or description]
  
      Organize activities into these time categories:
      - Early Morning (before ${officeTimeFrom})
      - Evening (after ${officeTimeTo})
      - Weekend
  
      **2. Grouping Activities by Location**
      List recommendations in the exact format:
      - [Location Name]: [Activity 1], [Activity 2], etc.
      
      **3. Time Management Tips**
      List 3-5 specific tips for balancing these activities with work:
      - [Tip 1]
      - [Tip 2]
      - [Tip 3]
      
      **4. Potential Conflicts**
      List any potential scheduling conflicts (or state if none are found):
      - [Conflict 1]
      - [Conflict 2]
      
      
      **5. Recommendations for Improving Efficiency**
      Include the following subsections with specific timing recommendations:
      - Activity combinations: [list specific activities that could be combined with suggested times]
      - High-priority task timing: [identify tasks with priority='high' and recommend optimal times for these high-priority tasks]
      - Work-life balance strategies: [specific strategies to maintain balance with time recommendations]

      IMPORTANT REQUIREMENTS:
      1. Always suggest SPECIFIC CLOCK TIMES for each activity (e.g., "7:30 AM", "6:15 PM")
      2. Each activity must have a recommended time that is outside work hours (${officeTimeFrom} - ${officeTimeTo}), umless the activity name is 'lunch' or the priority is 'high'
      3. Follow the exact formatting with section numbers and headings as shown above with the ** markers
      4. Format each bullet point with a hyphen (-)
      5. Keep responses concise and actionable
    `;
  }

  private parseResponse(response: any): string {
    return (
      response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No recommendations available"
    );
  }
}
