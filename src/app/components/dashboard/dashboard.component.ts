// src/app/components/dashboard/dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../providers/authService';
import {
  NotesService,
  Note as FirebaseNote,
} from '../../providers/notesService';
import { GeminiService } from '../../providers/gemini.service';

interface Note extends Omit<FirebaseNote, 'id'> {
  id: string;
  selected?: boolean;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  notes: Note[] = [];
  isAddingNote = false;
  isEditing = false;
  editingNoteId: string | null = null;
  noteForm: FormGroup;
  private notesSubscription?: Subscription;
  private authSubscription?: Subscription;
  recommendations: string = '';
  isLoadingRecommendations = false;
  selectedNotes: Note[] = [];

  constructor(
    private authService: AuthService,
    private notesService: NotesService,
    private fb: FormBuilder,
    private geminiService: GeminiService
  ) {
    this.noteForm = this.createForm();
  }

  private createForm(): FormGroup {
    return this.fb.group(
      {
        title: ['', Validators.required],
        timeRequired: ['', [Validators.required, Validators.min(0)]],
        priority: ['medium', Validators.required],
        location: [''],
        requiresSpecificClothing: [false],
        officeTimeFrom: ['', Validators.required],
        officeTimeTo: ['', Validators.required],
        confirmed: [false, Validators.requiredTrue],
      },
      {
        validators: [this.timeRangeValidator],
      }
    );
  }

  ngOnInit() {
    this.authSubscription = this.authService.user$.subscribe(async (user) => {
      if (user?.uid) {
        try {
          await this.notesService.initializeUserNotes(user.uid);
        } catch (error) {
          console.error('Failed to initialize notes:', error);
        }
      }
    });

    this.notesSubscription = this.notesService
      .getUserNotes()
      .subscribe((notes) => {
        this.notes = notes
          .filter((note): note is Note => !!note.id)
          .map((note) => ({
            ...note,
            id: note.id as string,
          }));
      });
  }

  ngOnDestroy() {
    this.notesSubscription?.unsubscribe();
    this.authSubscription?.unsubscribe();
  }

  onAddNote() {
    this.isAddingNote = true;
    this.isEditing = false;
    this.editingNoteId = null;
    this.resetForm();
  }

  onEditNote(note: Note) {
    this.isEditing = true;
    this.isAddingNote = true;
    this.editingNoteId = note.id;
    this.noteForm.patchValue({
      title: note.title,
      timeRequired: note.timeRequired,
      priority: note.priority,
      location: note.location,
      requiresSpecificClothing: note.requiresSpecificClothing,
      officeTimeFrom: note.officeTimeFrom,
      officeTimeTo: note.officeTimeTo,
      confirmed: true,
    });
    this.notesService.updateNote(this.editingNoteId, note);
  }

  async onSubmitNote() {
    if (this.noteForm.valid) {
      try {
        const formValue = this.noteForm.value;
        const noteData = {
          title: formValue.title,
          timeRequired: formValue.timeRequired,
          priority: formValue.priority,
          location: formValue.location || '',
          requiresSpecificClothing: formValue.requiresSpecificClothing,
          officeTimeFrom: formValue.officeTimeFrom,
          officeTimeTo: formValue.officeTimeTo,
          completed: false,
        };

        if (this.isEditing && this.editingNoteId) {
          await this.notesService.updateNote(this.editingNoteId, noteData);
        } else {
          await this.notesService.addNote(noteData);
        }

        this.isAddingNote = false;
        this.resetForm();
      } catch (error) {
        console.error('Error saving note:', error);
      }
    }
  }

  resetForm() {
    this.noteForm.reset({
      priority: 'medium',
      requiresSpecificClothing: false,
      confirmed: false,
    });
    this.isEditing = false;
    this.editingNoteId = null;
  }

  cancelEdit() {
    this.resetForm();
    this.isAddingNote = false;
  }

  async onDeleteNote(noteId: string) {
    try {
      await this.notesService.deleteNote(noteId);
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  }

  getErrorMessage(controlName: string): string {
    const control = this.noteForm.get(controlName);
    if (control?.errors) {
      if (control.errors['required']) return 'This field is required';
      if (control.errors['min']) return 'Value must be greater than 0';
      if (controlName === 'officeTimeFrom' || controlName === 'officeTimeTo') {
        if (this.noteForm.errors?.['timeRange'])
          return 'End time must be after start time';
      }
    }
    return '';
  }

  timeRangeValidator(group: FormGroup) {
    const from = group.get('officeTimeFrom')?.value;
    const to = group.get('officeTimeTo')?.value;

    if (from && to) {
      const fromTime = new Date(`2000-01-01T${from}`);
      const toTime = new Date(`2000-01-01T${to}`);

      if (fromTime >= toTime) {
        return { timeRange: true };
      }
    }
    return null;
  }
  async onLogout() {
    try {
      await this.authService.signOut();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  toggleNoteSelection(note: Note) {
    note.selected = !note.selected;
    this.updateSelectedNotes();
  }

  // Keep track of selected notes
  private updateSelectedNotes() {
    this.selectedNotes = this.notes.filter((note) => note.selected);
  }

  async getAIRecommendations() {
    if (this.selectedNotes.length === 0) {
      console.log('No activities selected');
      return;
    }

    const officeTimeFrom = this.selectedNotes[0]?.officeTimeFrom || '09:00';
    const officeTimeTo = this.selectedNotes[0]?.officeTimeTo || '17:00';

    try {
      this.isLoadingRecommendations = true;

      this.recommendations = await this.geminiService.getRecommendations(
        this.selectedNotes,
        this.selectedOfficeTimeFrom,
        this.selectedOfficeTimeTo
      );
    } catch (error) {
      console.error('Error getting recommendations:', error);
      this.recommendations = 'Error getting recommendations. Please try again.';
    } finally {
      this.isLoadingRecommendations = false;
    }
  }

  hasSelectedActivities(): boolean {
    return this.notes.some((note) => note.selected);
  }

  get selectedOfficeTimeFrom(): string {
    return this.selectedNotes[0]?.officeTimeFrom || '09:00';
  }

  get selectedOfficeTimeTo(): string {
    return this.selectedNotes[0]?.officeTimeTo || '17:00';
  }
}
