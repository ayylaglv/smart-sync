// Complete solution for parsing AI recommendations
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

export interface ParsedRecommendations {
  scheduling: Array<{ time: string; activity: string }>;
  locationGroups: Array<{ location: string; activities: string[] }>;
  timeManagementTips: string[];
  conflicts: string[];
  efficiencyRecommendations: {
    combinations: string[];
    priority: string[];
    workLife: string[];
  };
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

  // Properties for template
  _officeTimeFrom: string = '09:00';
  _officeTimeTo: string = '17:00';
  earlyMorningTasks: string[] = [];
  eveningTasks: string[] = [];
  weekendTasks: string[] = [];
  locationGroups: Array<{ location: string; activities: string[] }> = [];
  timeManagementTips: string[] = [];
  conflicts: string[] = [];
  activityCombinations: string[] = [];
  highPriorityTiming: string[] = [];
  workLifeStrategies: string[] = [];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['rawResponse'] && this.rawResponse) {
      console.log('Raw response:', this.rawResponse);
      this.parseGeminiResponse(this.rawResponse);
    }
  }

  // Helper method to extract time from task description
  getTaskTime(task: string): string {
    // Format: "5:00 PM: hihi - Short activity, can be scheduled immediately after work."

    // Match time patterns at the beginning of the task
    const timePatterns = [
      // Match "5:00 PM:" format
      /^\s*(\d{1,2}[:\.]\d{2}\s*(?:AM|PM)):/i,

      // Match standalone times
      /^\s*(\d{1,2}[:\.]\d{2}\s*(?:AM|PM))\b/i,

      // Match 24-hour format
      /^\s*(\d{1,2}[:\.]\d{2})\b/,
    ];

    // Check each pattern
    for (const pattern of timePatterns) {
      const match = task.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    // Special handling for specific formats
    if (task.toLowerCase().includes('n/a')) {
      return 'N/A';
    }

    // Check for day references
    if (task.toLowerCase().includes('saturday')) {
      return 'Saturday';
    } else if (task.toLowerCase().includes('sunday')) {
      return 'Sunday';
    } else if (task.toLowerCase().includes('weekend')) {
      return 'Weekend';
    }

    // Default based on where the task appears
    if (this.earlyMorningTasks.includes(task)) {
      return `Before ${this._officeTimeFrom}`;
    } else if (this.eveningTasks.includes(task)) {
      return `After ${this._officeTimeTo}`;
    }

    return 'Flexible';
  }

  // Helper method to extract activity title and description from task
  getTaskTitle(task: string): string {
    // Format: "5:00 PM: hihi - Short activity, can be scheduled immediately after work."

    // Try to match "time: activity - description" pattern
    const fullPattern =
      /^\s*(?:\d{1,2}[:\.]\d{2}\s*(?:AM|PM)):\s*([^-]+)\s*-\s*(.+)/i;
    const match = task.match(fullPattern);

    if (match) {
      const activity = match[1]?.trim();
      const description = match[2]?.trim();

      if (description) {
        return `${activity} - ${description}`;
      }
      return activity;
    }

    // Special case for N/A
    if (task.includes('N/A')) {
      return 'No activities scheduled';
    }

    // Simpler pattern - just get everything after the time marker
    const simplePattern = /^\s*(?:\d{1,2}[:\.]\d{2}\s*(?:AM|PM)):\s*(.+)/i;
    const simpleMatch = task.match(simplePattern);

    if (simpleMatch && simpleMatch[1]) {
      return simpleMatch[1].trim();
    }

    // Last resort - return the original task
    return task;
  }

  // Parse the Gemini API response
  private parseGeminiResponse(response: string) {
    // Reset all arrays to ensure we don't have stale data
    this.earlyMorningTasks = [];
    this.eveningTasks = [];
    this.weekendTasks = [];
    this.locationGroups = [];
    this.timeManagementTips = [];
    this.conflicts = [];
    this.activityCombinations = [];
    this.highPriorityTiming = [];
    this.workLifeStrategies = [];

    // First use the cleaner approach by splitting by section headers
    const mainSections = this.splitIntoSections(response);

    // Process each main section
    for (const [title, content] of Object.entries(mainSections)) {
      console.log(`Processing main section: ${title}`);

      if (title.includes('1. Optimal Scheduling Order')) {
        // Extract categories and tasks from the scheduling section
        const schedulingCategories = this.extractSchedulingCategories(content);

        // Process each category
        for (const [category, tasks] of Object.entries(schedulingCategories)) {
          if (category.toLowerCase().includes('early morning')) {
            this.earlyMorningTasks = tasks;
          } else if (category.toLowerCase().includes('evening')) {
            this.eveningTasks = tasks;
          } else if (category.toLowerCase().includes('weekend')) {
            this.weekendTasks = tasks;
          }
        }
      } else if (title.includes('2. Grouping Activities by Location')) {
        // Process location groups
        const lines = content
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.startsWith('-'));

        for (const line of lines) {
          const locationInfo = line.substring(1).trim();
          const parts = locationInfo.split(':');

          if (parts.length >= 2) {
            const location = parts[0].trim();
            const activitiesText = parts[1].trim();
            const activities = activitiesText
              .split(',')
              .map((a) => a.trim())
              .filter((a) => a);

            if (location && activities.length > 0) {
              this.locationGroups.push({ location, activities });
            }
          }
        }
      } else if (title.includes('3. Time Management Tips')) {
        // Process time management tips
        const lines = content
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.startsWith('-'));

        for (const line of lines) {
          const tip = line.substring(1).trim();
          if (tip) {
            this.timeManagementTips.push(tip);
          }
        }
      } else if (title.includes('4. Potential Conflicts')) {
        // Process conflicts - note that "None found" is a special case
        const lines = content
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.startsWith('-'));

        for (const line of lines) {
          const conflict = line.substring(1).trim();
          if (
            conflict &&
            !conflict.toLowerCase().includes('none') &&
            !conflict.toLowerCase().includes('no conflicts')
          ) {
            this.conflicts.push(conflict);
          }
        }
      } else if (
        title.includes('5. Recommendations for Improving Efficiency')
      ) {
        // This section has subsections to extract
        const efficiencySubsections =
          this.extractEfficiencySubsections(content);

        // Process each subsection
        if (efficiencySubsections['Activity combinations']) {
          this.activityCombinations =
            efficiencySubsections['Activity combinations'];
        }

        if (efficiencySubsections['High-priority task timing']) {
          this.highPriorityTiming =
            efficiencySubsections['High-priority task timing'];
        }

        if (efficiencySubsections['Work-life balance strategies']) {
          this.workLifeStrategies =
            efficiencySubsections['Work-life balance strategies'];
        }
      }
    }

    // Add default values if sections are empty
    if (this.timeManagementTips.length === 0) {
      this.timeManagementTips = [
        'Schedule high-priority tasks when your energy level is highest',
        'Use time blocking to group similar activities',
        'Allow buffer time between activities for transition and travel',
      ];
    }

    if (this.workLifeStrategies.length === 0) {
      this.workLifeStrategies = [
        'Schedule buffer time between work and personal activities',
        'Use the early morning for high-energy tasks',
        'Group similar activities to reduce context switching',
      ];
    }

    // Log parsed data for debugging
    console.log('Early Morning Tasks:', this.earlyMorningTasks);
    console.log('Evening Tasks:', this.eveningTasks);
    console.log('Weekend Tasks:', this.weekendTasks);
    console.log('Location Groups:', this.locationGroups);
    console.log('Time Management Tips:', this.timeManagementTips);
    console.log('Activity Combinations:', this.activityCombinations);
    console.log('High Priority Timing:', this.highPriorityTiming);
    console.log('Work-Life Strategies:', this.workLifeStrategies);
  }

  // Helper method to split response into main sections
  private splitIntoSections(response: string): Record<string, string> {
    const sections: Record<string, string> = {};

    // Split the response by section headers (text between ** markers)
    const sectionMatches = response
      .split(/\*\*(.*?)\*\*/g)
      .filter((s) => s.trim());

    // Process each section - alternating between title and content
    for (let i = 0; i < sectionMatches.length; i += 2) {
      if (i + 1 < sectionMatches.length) {
        const title = sectionMatches[i].trim();
        const content = sectionMatches[i + 1].trim();
        sections[title] = content;
      }
    }

    // Handle the case where the response doesn't use ** markers
    if (Object.keys(sections).length === 0) {
      const lines = response.split('\n');
      let currentSection = '';
      let currentContent = '';

      for (const line of lines) {
        const trimmed = line.trim();

        // Check if the line looks like a section header
        if (trimmed.match(/^\d+\.\s+[A-Z][a-zA-Z\s]+$/)) {
          // If we already have a section, save it
          if (currentSection) {
            sections[currentSection] = currentContent.trim();
          }

          // Start a new section
          currentSection = trimmed;
          currentContent = '';
        } else {
          // Add line to current section content
          currentContent += line + '\n';
        }
      }

      // Save the last section
      if (currentSection) {
        sections[currentSection] = currentContent.trim();
      }
    }

    return sections;
  }

  // Helper method to extract scheduling categories from the content
  private extractSchedulingCategories(
    content: string
  ): Record<string, string[]> {
    const categories: Record<string, string[]> = {};
    let currentCategory = '';

    // Split content into lines
    const lines = content.split('\n').map((line) => line.trim());

    for (const line of lines) {
      // Check if the line is a category header
      if (
        line.startsWith('-') &&
        (line.includes('Early Morning') ||
          line.includes('Evening') ||
          line.includes('Weekend'))
      ) {
        // Start a new category
        currentCategory = line.substring(1).trim();
        categories[currentCategory] = [];
      }
      // Check if the line is a task within the current category
      else if (line.startsWith('-') && currentCategory) {
        // Add task to current category
        categories[currentCategory].push(line.substring(1).trim());
      }
      // If line starts with a time, it's probably a task (special case for indented tasks)
      else if (line.match(/^\s*\d{1,2}[:\.]\d{2}/) && currentCategory) {
        categories[currentCategory].push(line);
      }
    }

    return categories;
  }

  // Helper method to extract efficiency subsections
  private extractEfficiencySubsections(
    content: string
  ): Record<string, string[]> {
    const subsections: Record<string, string[]> = {};
    let currentSubsection = '';

    // Split content into lines
    const lines = content.split('\n').map((line) => line.trim());

    for (const line of lines) {
      // Check if the line is a subsection header
      if (line.startsWith('-') && line.includes(':')) {
        const headerParts = line.substring(1).trim().split(':');
        if (headerParts.length > 0) {
          currentSubsection = headerParts[0].trim();
          subsections[currentSubsection] = [];

          // If there's content after the colon, add it to the subsection
          if (headerParts.length > 1 && headerParts[1].trim()) {
            subsections[currentSubsection].push(headerParts[1].trim());
          }
        }
      }
      // Check if the line is a list item within the current subsection
      else if (line.startsWith('-') && currentSubsection) {
        // Add item to current subsection
        subsections[currentSubsection].push(line.substring(1).trim());
      }
      // Special case for indented list items
      else if (line.match(/^\s+-.+/) && currentSubsection) {
        subsections[currentSubsection].push(line.replace(/^\s+-/, '').trim());
      }
    }

    return subsections;
  }
}
