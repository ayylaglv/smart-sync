// src/app/providers/notesService.ts
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthService } from './authService';
import { Observable, map, of, switchMap } from 'rxjs';

export interface Note {
  id?: string;
  title: string;
  timeRequired: number;
  priority: 'high' | 'medium' | 'low';
  location: string;
  requiresSpecificClothing: boolean;
  officeTimeFrom: string;
  officeTimeTo: string;
  completed: boolean;
  createdAt: Date;
}

export interface UserDocument {
  userId: string;
  notes: Note[];
}

@Injectable({
  providedIn: 'root',
})
export class NotesService {
  constructor(
    private firestore: AngularFirestore,
    private authService: AuthService
  ) {}

  async addNote(noteData: Omit<Note, 'id' | 'createdAt'>): Promise<void> {
    const userId = await this.authService.getCurrentUserId();
    if (!userId) throw new Error('No user logged in');

    try {
      const userDocRef = this.firestore
        .collection('users')
        .doc<UserDocument>(userId);
      const userDoc = await userDocRef.get().toPromise();

      const newNote: Note = {
        ...noteData,
        id: this.firestore.createId(),
        createdAt: new Date(),
      };

      if (!userDoc?.exists) {
        await userDocRef.set({
          userId,
          notes: [newNote],
        });
      } else {
        const userData = userDoc.data() as UserDocument;
        await userDocRef.update({
          notes: [...(userData?.notes || []), newNote],
        });
      }
    } catch (error) {
      console.error('Error adding note:', error);
      throw error;
    }
  }

  getUserNotes(): Observable<Note[]> {
    return this.authService.user$.pipe(
      switchMap((user) => {
        if (!user) return of([]);

        return this.firestore
          .collection('users')
          .doc<UserDocument>(user.uid)
          .valueChanges()
          .pipe(
            map((userData) => {
              if (!userData?.notes) return [];
              return [...userData.notes].sort((a, b) => {
                const dateA =
                  a.createdAt instanceof Date
                    ? a.createdAt
                    : new Date(a.createdAt);
                const dateB =
                  b.createdAt instanceof Date
                    ? b.createdAt
                    : new Date(b.createdAt);
                return dateB.getTime() - dateA.getTime();
              });
            })
          );
      })
    );
  }

  async updateNote(noteId: string, updatedData: Partial<Note>): Promise<void> {
    const userId = await this.authService.getCurrentUserId();
    if (!userId) throw new Error('No user logged in');

    try {
      const userDocRef = this.firestore
        .collection('users')
        .doc<UserDocument>(userId);
      const userDoc = await userDocRef.get().toPromise();

      if (!userDoc?.exists) throw new Error('User document not found');

      const userData = userDoc.data() as UserDocument;
      const noteIndex = userData.notes.findIndex((note) => note.id === noteId);

      if (noteIndex === -1) throw new Error('Note not found');

      const updatedNotes = [...userData.notes];
      updatedNotes[noteIndex] = {
        ...updatedNotes[noteIndex],
        ...updatedData,
        id: noteId,
      };

      await userDocRef.update({ notes: updatedNotes });
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  }

  async deleteNote(noteId: string): Promise<void> {
    const userId = await this.authService.getCurrentUserId();
    if (!userId) throw new Error('No user logged in');

    try {
      const userDocRef = this.firestore
        .collection('users')
        .doc<UserDocument>(userId);
      const userDoc = await userDocRef.get().toPromise();

      if (!userDoc?.exists) throw new Error('User document not found');

      const userData = userDoc.data() as UserDocument;
      const updatedNotes = userData.notes.filter((note) => note.id !== noteId);

      await userDocRef.update({ notes: updatedNotes });
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  }

  async initializeUserNotes(userId: string): Promise<void> {
    try {
      const userDocRef = this.firestore
        .collection('users')
        .doc<UserDocument>(userId);
      const userDoc = await userDocRef.get().toPromise();

      if (!userDoc?.exists) {
        await userDocRef.set({
          userId,
          notes: [],
        });
      }
    } catch (error) {
      console.error('Error initializing user notes:', error);
      throw error;
    }
  }
}
