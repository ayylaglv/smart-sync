// src/app/services/auth.service.ts
import { inject, Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import 'firebase/compat/auth';
import { GoogleAuthProvider } from '@angular/fire/auth';

import 'firebase/compat/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  user$: Observable<any>;

  constructor(private afAuth: AngularFireAuth, private router: Router) {
    this.user$ = this.afAuth.authState;
  }

  async signInWithGoogle() {
    try {
      await this.afAuth.setPersistence('local');
      const provider = new GoogleAuthProvider();
      const result = await this.afAuth.signInWithPopup(provider);
      this.router.navigate(['/dashboard']); // Catch any unexpected error and redirect
    } catch (error) {
      console.error('Error during login:', error);
      this.router.navigate(['/error']); // Catch any unexpected error and redirect
    }
  }
  async signOut() {
    try {
      await this.afAuth.signOut();
      await this.router.navigate(['/home']);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  getCurrentUser() {
    return this.afAuth.currentUser;
  }
  async getCurrentUserId(): Promise<string | null> {
    const user = await this.getCurrentUser();
    return user ? user.uid : null;
  }
  isLoggedIn(): Observable<boolean> {
    return this.user$.pipe(map((user) => !!user));
  }
}
