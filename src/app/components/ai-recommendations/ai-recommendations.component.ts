// src/app/components/ai-recommendations/ai-recommendations.component.ts
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

export interface ParsedRecommendations {
  scheduling: Array<{ time: string; activity: string }>;
  locationGroups: Array<{ location: string; activities: string[] }>;
  timeManagementTips: string[];
  conflicts: string;
  efficiencyRecommendations: string[];
}

@Component({
  selector: 'app-ai-recommendations',
  templateUrl: './ai-recommendations.component.html',
  styleUrls: ['./ai-recommendations.component.scss'],
})
export class AiRecommendationsComponent implements OnChanges {
  @Input() rawResponse: string = '';
  @Input() isLoading: boolean = false;
  @Input() set officeTimeFrom(value: string | undefined) {
    this._officeTimeFrom = value || '09:00';
  }
  @Input() set officeTimeTo(value: string | undefined) {
    this._officeTimeTo = value || '17:00';
  }

  // Private properties for office hours
  private _officeTimeFrom: string = '09:00';
  private _officeTimeTo: string = '17:00';

  // Properties for template
  earlyMorningTasks: string[] = [];
  eveningTasks: string[] = [];
  weekendTasks: string[] = [];
  locationGroups: Array<{ location: string; activities: string[] }> = [];
  timeManagementTips: string[] = [];
  activityCombinations: string[] = [];
  highPriorityTiming: string[] = [];
  workLifeStrategies: string[] = [];

  parsedRecommendations: ParsedRecommendations = {
    scheduling: [],
    locationGroups: [],
    timeManagementTips: [],
    conflicts: '',
    efficiencyRecommendations: [],
  };

  ngOnChanges(changes: SimpleChanges) {
    if (changes['rawResponse'] && this.rawResponse) {
      console.log(this.rawResponse);

      this.parseGeminiResponse(this.rawResponse);
    }
  }

  isOutsideWorkHours(time: string): boolean {
    const timeValue = this.convertToMinutes(time);
    const workStart = this.convertToMinutes(this._officeTimeFrom);
    const workEnd = this.convertToMinutes(this._officeTimeTo);

    return timeValue < workStart || timeValue >= workEnd;
  }

  private convertToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private parseGeminiResponse(response: string) {
    const sections = response.split('**').filter((s) => s.trim());

    sections.forEach((section) => {
      if (section.includes('1. Optimal Scheduling Order')) {
        this.parsedRecommendations.scheduling = section
          .split('\n')
          .filter((line) => line.includes('-'))
          .map((line) => {
            const [time, activity] = line.split(':').map((s) => s.trim());
            return { time: time.replace('- ', ''), activity };
          });
      }

      if (section.includes('2. Grouping Activities by Location')) {
        const locationLines = section
          .split('\n')
          .filter((line) => line.includes('-'))
          .map((line) => line.replace('- ', ''));

        this.parsedRecommendations.locationGroups = locationLines.map(
          (line) => {
            const [location, activities] = line.split(':').map((s) => s.trim());
            return {
              location,
              activities: activities
                ? activities.split(',').map((a) => a.trim())
                : [],
            };
          }
        );
      }

      if (section.includes('3. Time Management Tips')) {
        this.parsedRecommendations.timeManagementTips = section
          .split('\n')
          .filter((line) => line.includes('-'))
          .map((line) => line.replace('- ', '').trim());
      }

      if (section.includes('4. Potential Conflicts')) {
        this.parsedRecommendations.conflicts = section
          .split('\n')
          .filter((line) => line.includes('-'))
          .map((line) => line.replace('- ', '').trim())
          .join('\n');
      }

      if (section.includes('5. Recommendations for Improving Efficiency')) {
        this.parsedRecommendations.efficiencyRecommendations = section
          .split('\n')
          .filter((line) => line.includes('-'))
          .map((line) => line.replace('- ', '').trim());
      }
    });
  }
}
