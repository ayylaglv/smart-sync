// src/app/components/homepage/homepage.component.ts
import { Component } from '@angular/core';
import { AuthService } from '../../providers/authService';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss'],
})
export class HomepageComponent {
  isLoading = false;
  error: string | null = null;

  constructor(private authService: AuthService) {}

  async onLogin() {
    try {
      this.isLoading = true;
      this.error = null;
      await this.authService.signInWithGoogle();
    } catch (error: any) {
      console.error('Login error:', error);
      this.error = error.message || 'An error occurred during login';
    } finally {
      this.isLoading = false;
    }
  }
}
